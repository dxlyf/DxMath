/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#include "include/core/SkBitmap.h"
#include "include/core/SkCanvas.h"
#include "include/core/SkColorSpace.h"
#include "include/core/SkImage.h"
#include "include/core/SkSurface.h"
#include "include/core/SkYUVAInfo.h"
#include "include/core/SkYUVAPixmaps.h"
#include "include/gpu/GpuTypes.h"
#include "include/gpu/graphite/BackendTexture.h"
#include "include/gpu/graphite/Image.h"
#include "include/gpu/graphite/Recorder.h"
#include "include/gpu/graphite/Surface.h"
#include "include/gpu/graphite/YUVABackendTextures.h"
#include "include/private/base/SkMutex.h"
#include "src/gpu/RefCntedCallback.h"
#include "src/gpu/graphite/Caps.h"
#include "src/gpu/graphite/Image_Base_Graphite.h"
#include "src/gpu/graphite/Image_Graphite.h"
#include "src/gpu/graphite/Image_YUVA_Graphite.h"
#include "src/gpu/graphite/Log.h"
#include "src/gpu/graphite/RecorderPriv.h"
#include "src/gpu/graphite/ResourceProvider.h"
#include "src/gpu/graphite/Texture.h"
#include "src/gpu/graphite/TextureProxy.h"
#include "src/gpu/graphite/TextureProxyView.h"
#include "src/gpu/graphite/TextureUtils.h"
#include "src/image/SkImage_Base.h"
#include "src/image/SkImage_Lazy.h"
#include "src/image/SkImage_Picture.h"
#include "src/image/SkImage_Raster.h"

using namespace skgpu::graphite;

namespace SkImages {

static bool validate_backend_texture(const skgpu::graphite::Caps* caps,
                                     const skgpu::graphite::BackendTexture& texture,
                                     const SkColorInfo& info) {
    if (!texture.isValid() || texture.dimensions().width() <= 0 ||
        texture.dimensions().height() <= 0) {
        return false;
    }

    if (!SkColorInfoIsValid(info)) {
        return false;
    }

    if (!caps->isTexturable(texture.info())) {
        return false;
    }

    return caps->areColorTypeAndTextureInfoCompatible(info.colorType(), texture.info());
}

sk_sp<SkImage> AdoptTextureFrom(Recorder* recorder,
                                const BackendTexture& backendTex,
                                SkColorType ct,
                                SkAlphaType at,
                                sk_sp<SkColorSpace> cs,
                                TextureReleaseProc releaseP,
                                ReleaseContext releaseC) {
    auto releaseHelper = skgpu::RefCntedCallback::Make(releaseP, releaseC);

    if (!recorder) {
        return nullptr;
    }

    const Caps* caps = recorder->priv().caps();

    SkColorInfo info(ct, at, std::move(cs));

    if (!validate_backend_texture(caps, backendTex, info)) {
        return nullptr;
    }

    sk_sp<Texture> texture = recorder->priv().resourceProvider()->createWrappedTexture(backendTex);
    if (!texture) {
        SKGPU_LOG_W("Texture creation failed");
        return nullptr;
    }
    texture->setReleaseCallback(std::move(releaseHelper));

    sk_sp<TextureProxy> proxy(new TextureProxy(std::move(texture)));

    skgpu::Swizzle swizzle = caps->getReadSwizzle(ct, backendTex.info());
    TextureProxyView view(std::move(proxy), swizzle);
    return sk_make_sp<skgpu::graphite::Image>(view, info);
}

sk_sp<SkImage> PromiseTextureFrom(Recorder* recorder,
                                  SkISize dimensions,
                                  const TextureInfo& textureInfo,
                                  const SkColorInfo& colorInfo,
                                  Volatile isVolatile,
                                  GraphitePromiseImageFulfillProc fulfillProc,
                                  GraphitePromiseImageReleaseProc imageReleaseProc,
                                  GraphitePromiseTextureReleaseProc textureReleaseProc,
                                  GraphitePromiseImageContext imageContext) {
    // Our contract is that we will always call the _image_ release proc even on failure.
    // We use the helper to convey the imageContext, so we need to ensure Make doesn't fail.
    imageReleaseProc = imageReleaseProc ? imageReleaseProc : [](void*) {};
    auto releaseHelper = skgpu::RefCntedCallback::Make(imageReleaseProc, imageContext);

    if (!recorder) {
        SKGPU_LOG_W("Null Recorder");
        return nullptr;
    }

    const Caps* caps = recorder->priv().caps();

    SkImageInfo info = SkImageInfo::Make(dimensions, colorInfo);
    if (!SkImageInfoIsValid(info)) {
        SKGPU_LOG_W("Invalid SkImageInfo");
        return nullptr;
    }

    if (!caps->areColorTypeAndTextureInfoCompatible(colorInfo.colorType(), textureInfo)) {
        SKGPU_LOG_W("Incompatible SkColorType and TextureInfo");
        return nullptr;
    }

    sk_sp<TextureProxy> proxy = Image::MakePromiseImageLazyProxy(dimensions,
                                                                 textureInfo,
                                                                 isVolatile,
                                                                 fulfillProc,
                                                                 std::move(releaseHelper),
                                                                 textureReleaseProc);
    if (!proxy) {
        return nullptr;
    }

    skgpu::Swizzle swizzle = caps->getReadSwizzle(colorInfo.colorType(), textureInfo);
    TextureProxyView view(std::move(proxy), swizzle);
    return sk_make_sp<Image>(view, colorInfo);
}

sk_sp<SkImage> SubsetTextureFrom(skgpu::graphite::Recorder* recorder,
                                 const SkImage* img,
                                 const SkIRect& subset,
                                 SkImage::RequiredProperties props) {
    if (!recorder || !img) {
        return nullptr;
    }
    auto subsetImg = img->makeSubset(recorder, subset, props);
    return SkImages::TextureFromImage(recorder, subsetImg, props);
}

static sk_sp<SkImage> generate_picture_texture(skgpu::graphite::Recorder* recorder,
                                               const SkImage_Picture* img,
                                               const SkImageInfo& info,
                                               SkImage::RequiredProperties requiredProps) {
    auto sharedGenerator = img->generator();
    SkAutoMutexExclusive mutex(sharedGenerator->fMutex);

    auto mm = requiredProps.fMipmapped ? skgpu::Mipmapped::kYes : skgpu::Mipmapped::kNo;
    sk_sp<SkSurface> surface = SkSurfaces::RenderTarget(recorder, info, mm);
    if (!surface) {
        SKGPU_LOG_E("Failed to create Surface");
        return nullptr;
    }

    surface->getCanvas()->clear(SkColors::kTransparent);
    surface->getCanvas()->drawPicture(img->picture(), img->matrix(), img->paint());
    return SkSurfaces::AsImage(surface);
}

/*
 *  We only have 2 ways to create a Graphite-backed image.
 *
 *  1. Ask the generator to natively create one
 *  2. Ask the generator to return RGB(A) data, which the GPU can convert
 */
static sk_sp<SkImage> make_texture_image_from_lazy(skgpu::graphite::Recorder* recorder,
                                                   const SkImage_Lazy* img,
                                                   SkImage::RequiredProperties requiredProps) {
    // 1. Ask the generator to natively create one.
    {
        // Disable mipmaps here bc Graphite doesn't currently support mipmap regeneration
        // In this case, we would allocate the mipmaps and fill in the base layer but the mipmap
        // levels would never be filled out - yielding incorrect draws. Please see: b/238754357.
        requiredProps.fMipmapped = false;

        if (img->type() == SkImage_Base::Type::kLazyPicture) {
            sk_sp<SkImage> newImage =
                    generate_picture_texture(recorder,
                                             static_cast<const SkImage_Picture*>(img),
                                             img->imageInfo(),
                                             requiredProps);
            if (newImage) {
                SkASSERT(as_IB(newImage)->isGraphiteBacked());
                return newImage;
            }
        }
        // There is not an analog to GrTextureGenerator for Graphite yet, but if there was,
        // we would want to call it here.
    }

    // 2. Ask the generator to return a bitmap, which the GPU can convert.
    {
        SkBitmap bitmap;
        if (img->getROPixels(nullptr, &bitmap, SkImage_Lazy::CachingHint::kDisallow_CachingHint)) {
            return skgpu::graphite::MakeFromBitmap(recorder,
                                                   img->imageInfo().colorInfo(),
                                                   bitmap,
                                                   nullptr,
                                                   skgpu::Budgeted::kNo,
                                                   requiredProps);
        }
    }

    return nullptr;
}

sk_sp<SkImage> TextureFromImage(skgpu::graphite::Recorder* recorder,
                                const SkImage* image,
                                SkImage::RequiredProperties requiredProps) {
    if (!recorder || !image) {
        return nullptr;
    }
    if (image->dimensions().area() <= 1) {
        requiredProps.fMipmapped = false;
    }

    auto ib = as_IB(image);
    SkASSERT(!ib->isGaneshBacked());

    if (ib->isRasterBacked()) {
        auto raster = static_cast<const SkImage_Raster*>(ib);
        return skgpu::graphite::MakeFromBitmap(recorder,
                                               raster->imageInfo().colorInfo(),
                                               raster->bitmap(),
                                               raster->refMips(),
                                               skgpu::Budgeted::kNo,
                                               requiredProps);
    }
    if (ib->isLazyGenerated()) {
        return make_texture_image_from_lazy(
                recorder, static_cast<const SkImage_Lazy*>(ib), requiredProps);
    }
    SkASSERT(ib->isGraphiteBacked());
    auto ig = static_cast<const skgpu::graphite::Image_Base*>(image);
    return ig->makeTextureImage(recorder, requiredProps);
}

sk_sp<SkImage> TextureFromYUVATextures(Recorder* recorder,
                                       const YUVABackendTextures& yuvaTextures,
                                       sk_sp<SkColorSpace> imageColorSpace,
                                       TextureReleaseProc releaseP,
                                       ReleaseContext releaseC) {
    auto releaseHelper = skgpu::RefCntedCallback::Make(releaseP, releaseC);
    if (!recorder) {
        return nullptr;
    }

    int numPlanes = yuvaTextures.yuvaInfo().numPlanes();
    TextureProxyView textureProxyViews[SkYUVAInfo::kMaxPlanes];
    for (int plane = 0; plane < numPlanes; ++plane) {
        sk_sp<Texture> texture = recorder->priv().resourceProvider()->createWrappedTexture(
                yuvaTextures.planeTexture(plane));
        if (!texture) {
            SKGPU_LOG_W("Texture creation failed");
            return nullptr;
        }
        texture->setReleaseCallback(releaseHelper);

        sk_sp<TextureProxy> proxy(new TextureProxy(std::move(texture)));
        textureProxyViews[plane] = TextureProxyView(std::move(proxy));
    }
    YUVATextureProxies yuvaProxies(recorder, yuvaTextures.yuvaInfo(), textureProxyViews);
    SkASSERT(yuvaProxies.isValid());
    return sk_make_sp<Image_YUVA>(
            kNeedNewImageUniqueID, std::move(yuvaProxies), std::move(imageColorSpace));
}

sk_sp<SkImage> TextureFromYUVAPixmaps(Recorder* recorder,
                                      const SkYUVAPixmaps& pixmaps,
                                      SkImage::RequiredProperties requiredProps,
                                      bool limitToMaxTextureSize,
                                      sk_sp<SkColorSpace> imageColorSpace) {
    if (!recorder) {
        return nullptr;  // until we impl this for raster backend
    }

    if (!pixmaps.isValid()) {
        return nullptr;
    }

    // Resize the pixmaps if necessary.
    int numPlanes = pixmaps.numPlanes();
    int maxTextureSize = recorder->priv().caps()->maxTextureSize();
    int maxDim = std::max(pixmaps.yuvaInfo().width(), pixmaps.yuvaInfo().height());

    SkYUVAPixmaps tempPixmaps;
    const SkYUVAPixmaps* pixmapsToUpload = &pixmaps;
    // We assume no plane is larger than the image size (and at least one plane is as big).
    if (maxDim > maxTextureSize) {
        if (!limitToMaxTextureSize) {
            return nullptr;
        }
        float scale = static_cast<float>(maxTextureSize) / maxDim;
        SkISize newDimensions = {
                std::min(static_cast<int>(pixmaps.yuvaInfo().width() * scale), maxTextureSize),
                std::min(static_cast<int>(pixmaps.yuvaInfo().height() * scale), maxTextureSize)};
        SkYUVAInfo newInfo = pixmaps.yuvaInfo().makeDimensions(newDimensions);
        SkYUVAPixmapInfo newPixmapInfo(newInfo, pixmaps.dataType(), /*rowBytes=*/nullptr);
        tempPixmaps = SkYUVAPixmaps::Allocate(newPixmapInfo);
        if (!tempPixmaps.isValid()) {
            return nullptr;
        }
        SkSamplingOptions sampling(SkFilterMode::kLinear);
        for (int i = 0; i < numPlanes; ++i) {
            if (!pixmaps.plane(i).scalePixels(tempPixmaps.plane(i), sampling)) {
                return nullptr;
            }
        }
        pixmapsToUpload = &tempPixmaps;
    }

    // Convert to texture proxies.
    TextureProxyView views[SkYUVAInfo::kMaxPlanes];
    for (int i = 0; i < numPlanes; ++i) {
        // Turn the pixmap into a TextureProxy
        SkBitmap bmp;
        bmp.installPixels(pixmapsToUpload->plane(i));
        auto mm = requiredProps.fMipmapped ? skgpu::Mipmapped::kYes : skgpu::Mipmapped::kNo;
        std::tie(views[i], std::ignore) = MakeBitmapProxyView(recorder,
                                                              bmp,
                                                              /*mipmapsIn=*/nullptr,
                                                              mm,
                                                              skgpu::Budgeted::kNo);
        if (!views[i]) {
            return nullptr;
        }
    }

    YUVATextureProxies yuvaProxies(recorder, pixmapsToUpload->yuvaInfo(), views);
    SkASSERT(yuvaProxies.isValid());
    return sk_make_sp<Image_YUVA>(
            kNeedNewImageUniqueID, std::move(yuvaProxies), std::move(imageColorSpace));
}

}  // namespace SkImages
