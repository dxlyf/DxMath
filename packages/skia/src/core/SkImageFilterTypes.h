/*
 * Copyright 2019 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkImageFilterTypes_DEFINED
#define SkImageFilterTypes_DEFINED

#include "include/core/SkColorFilter.h"
#include "include/core/SkColorSpace.h"
#include "include/core/SkMatrix.h"
#include "include/core/SkPoint.h"
#include "include/core/SkRect.h"
#include "include/core/SkSamplingOptions.h"
#include "include/core/SkTypes.h"
#include "include/private/base/SkTArray.h"
#include "src/core/SkEnumBitMask.h"
#include "src/core/SkSpecialImage.h"

class GrRecordingContext;
enum GrSurfaceOrigin : int;
class SkImage;
class SkImageFilter;
class SkImageFilterCache;
class SkPicture;
class SkSpecialSurface;
class SkSurfaceProps;

class FilterResultImageResolver; // for testing

namespace skgpu::graphite { class Recorder; }

// The skif (SKI[mage]F[ilter]) namespace contains types that are used for filter implementations.
// The defined types come in two groups: users of internal Skia types, and templates to help with
// readability. Image filters cannot be implemented without access to key internal types, such as
// SkSpecialImage. It is possible to avoid the use of the readability templates, although they are
// strongly encouraged.
namespace skif {

// Rounds in/out but with a tolerance.
SkIRect RoundOut(SkRect);
SkIRect RoundIn(SkRect);

// skif::IVector and skif::Vector represent plain-old-data types for storing direction vectors, so
// that the coordinate-space templating system defined below can have a separate type id for
// directions vs. points, and specialize appropriately. As such, all operations with direction
// vectors are defined on the LayerSpace specialization, since that is the intended point of use.
struct IVector {
    int32_t fX;
    int32_t fY;

    IVector() = default;
    IVector(int32_t x, int32_t y) : fX(x), fY(y) {}
    explicit IVector(const SkIVector& v) : fX(v.fX), fY(v.fY) {}
};

struct Vector {
    SkScalar fX;
    SkScalar fY;

    Vector() = default;
    Vector(SkScalar x, SkScalar y) : fX(x), fY(y) {}
    explicit Vector(const SkVector& v) : fX(v.fX), fY(v.fY) {}
};

///////////////////////////////////////////////////////////////////////////////////////////////////
// Coordinate Space Tagging
// - In order to enforce correct coordinate spaces in image filter implementations and use,
//   geometry is wrapped by templated structs to declare in the type system what coordinate space
//   the coordinates are defined in.
// - Currently there is ParameterSpace and DeviceSpace that are data-only wrappers around
//   coordinates, and the primary LayerSpace that provides all operative functionality for image
//   filters. It is intended that all logic about image bounds and access be conducted in the shared
//   layer space.
// - The LayerSpace struct has type-safe specializations for SkIRect, SkRect, SkIPoint, SkPoint,
//   skif::IVector (to distinguish SkIVector from SkIPoint), skif::Vector, SkISize, and SkSize.
// - A Mapping object provides type safe coordinate conversions between these spaces, and
//   automatically does the "right thing" for each geometric type.
///////////////////////////////////////////////////////////////////////////////////////////////////

// ParameterSpace is a data-only wrapper around Skia's geometric types such as SkIPoint, and SkRect.
// Parameter space is the same as the local coordinate space of an SkShader, or the coordinates
// passed into SkCanvas::drawX calls, but "local" is avoided due to the alliteration with layer
// space. SkImageFilters are defined in terms of ParameterSpace<T> geometry and must use the Mapping
// on Context to transform the parameters into LayerSpace to evaluate the filter in the shared
// coordinate space of the entire filter DAG.
//
// A value of ParameterSpace<SkIRect> implies that its wrapped SkIRect is defined in the local
// parameter space.
template<typename T>
class ParameterSpace {
public:
    ParameterSpace() = default;
    explicit ParameterSpace(const T& data) : fData(data) {}
    explicit ParameterSpace(T&& data) : fData(std::move(data)) {}

    explicit operator const T&() const { return fData; }

    static const ParameterSpace<T>* Optional(const T* ptr) {
        return static_cast<const ParameterSpace<T>*>(reinterpret_cast<const void*>(ptr));
    }
private:
    T fData;
};

// DeviceSpace is a data-only wrapper around Skia's geometric types. It is similar to
// 'ParameterSpace' except that it is used to represent geometry that has been transformed or
// defined in the root device space (i.e. the final pixels of drawn content). Much of what SkCanvas
// tracks, such as its clip bounds are defined in this space and DeviceSpace provides a
// type-enforced mechanism for the canvas to pass that information into the image filtering system,
// using the Mapping of the filtering context.
template<typename T>
class DeviceSpace {
public:
    DeviceSpace() = default;
    explicit DeviceSpace(const T& data) : fData(data) {}
    explicit DeviceSpace(T&& data) : fData(std::move(data)) {}

    explicit operator const T&() const { return fData; }

private:
    T fData;
};

// LayerSpace is a geometric wrapper that specifies the geometry is defined in the shared layer
// space where image filters are evaluated. For a given Context (and its Mapping), the image filter
// DAG operates in the same coordinate space. This space may be different from the local coordinate
// space that defined the image filter parameters (such as blur sigma), and it may be different
// from the total CTM of the SkCanvas.
//
// To encourage correct filter use and implementation, the bulk of filter logic should be performed
// in layer space (e.g. determining what portion of an input image to read, or what the output
// region is). LayerSpace specializations for the six common Skia math types (Sk[I]Rect, Sk[I]Point,
// and Sk[I]Size), and skif::[I]Vector (to allow vectors to be specialized separately from points))
// are provided that mimic their APIs but preserve the coordinate space and enforce type semantics.
template<typename T>
class LayerSpace {};

// Layer-space specialization for integerized direction vectors.
template<>
class LayerSpace<IVector> {
public:
    LayerSpace() = default;
    explicit LayerSpace(const IVector& geometry) : fData(geometry) {}
    explicit LayerSpace(IVector&& geometry) : fData(std::move(geometry)) {}
    explicit operator const IVector&() const { return fData; }

    explicit operator SkIVector() const { return SkIVector::Make(fData.fX, fData.fY); }

    int32_t x() const { return fData.fX; }
    int32_t y() const { return fData.fY; }

    LayerSpace<IVector> operator-() const { return LayerSpace<IVector>({-fData.fX, -fData.fY}); }

    LayerSpace<IVector> operator+(const LayerSpace<IVector>& v) const {
        LayerSpace<IVector> sum = *this;
        sum += v;
        return sum;
    }
    LayerSpace<IVector> operator-(const LayerSpace<IVector>& v) const {
        LayerSpace<IVector> diff = *this;
        diff -= v;
        return diff;
    }

    void operator+=(const LayerSpace<IVector>& v) {
        fData.fX += v.fData.fX;
        fData.fY += v.fData.fY;
    }
    void operator-=(const LayerSpace<IVector>& v) {
        fData.fX -= v.fData.fX;
        fData.fY -= v.fData.fY;
    }

private:
    IVector fData;
};

// Layer-space specialization for floating point direction vectors.
template<>
class LayerSpace<Vector> {
public:
    LayerSpace() = default;
    explicit LayerSpace(const Vector& geometry) : fData(geometry) {}
    explicit LayerSpace(Vector&& geometry) : fData(std::move(geometry)) {}
    explicit operator const Vector&() const { return fData; }

    explicit operator SkVector() const { return SkVector::Make(fData.fX, fData.fY); }

    SkScalar x() const { return fData.fX; }
    SkScalar y() const { return fData.fY; }

    SkScalar length() const { return SkVector::Length(fData.fX, fData.fY); }

    LayerSpace<Vector> operator-() const { return LayerSpace<Vector>({-fData.fX, -fData.fY}); }

    LayerSpace<Vector> operator*(SkScalar s) const {
        LayerSpace<Vector> scaled = *this;
        scaled *= s;
        return scaled;
    }

    LayerSpace<Vector> operator+(const LayerSpace<Vector>& v) const {
        LayerSpace<Vector> sum = *this;
        sum += v;
        return sum;
    }
    LayerSpace<Vector> operator-(const LayerSpace<Vector>& v) const {
        LayerSpace<Vector> diff = *this;
        diff -= v;
        return diff;
    }

    void operator*=(SkScalar s) {
        fData.fX *= s;
        fData.fY *= s;
    }
    void operator+=(const LayerSpace<Vector>& v) {
        fData.fX += v.fData.fX;
        fData.fY += v.fData.fY;
    }
    void operator-=(const LayerSpace<Vector>& v) {
        fData.fX -= v.fData.fX;
        fData.fY -= v.fData.fY;
    }

    friend LayerSpace<Vector> operator*(SkScalar s, const LayerSpace<Vector>& b) {
        return b * s;
    }

private:
    Vector fData;
};

// Layer-space specialization for integer 2D coordinates (treated as positions, not directions).
template<>
class LayerSpace<SkIPoint> {
public:
    LayerSpace() = default;
    explicit LayerSpace(const SkIPoint& geometry)  : fData(geometry) {}
    explicit LayerSpace(SkIPoint&& geometry) : fData(std::move(geometry)) {}
    explicit operator const SkIPoint&() const { return fData; }

    // Parrot the SkIPoint API while preserving coordinate space.
    int32_t x() const { return fData.fX; }
    int32_t y() const { return fData.fY; }

    // Offsetting by direction vectors produce more points
    LayerSpace<SkIPoint> operator+(const LayerSpace<IVector>& v) {
        return LayerSpace<SkIPoint>(fData + SkIVector(v));
    }
    LayerSpace<SkIPoint> operator-(const LayerSpace<IVector>& v) {
        return LayerSpace<SkIPoint>(fData - SkIVector(v));
    }

    void operator+=(const LayerSpace<IVector>& v) {
        fData += SkIVector(v);
    }
    void operator-=(const LayerSpace<IVector>& v) {
        fData -= SkIVector(v);
    }

    // Subtracting another point makes a direction between them
    LayerSpace<IVector> operator-(const LayerSpace<SkIPoint>& p) {
        return LayerSpace<IVector>(IVector(fData - p.fData));
    }

    LayerSpace<IVector> operator-() const { return LayerSpace<IVector>({-fData.fX, -fData.fY}); }

private:
    SkIPoint fData;
};

// Layer-space specialization for floating point 2D coordinates (treated as positions)
template<>
class LayerSpace<SkPoint> {
public:
    LayerSpace() = default;
    explicit LayerSpace(const SkPoint& geometry) : fData(geometry) {}
    explicit LayerSpace(SkPoint&& geometry) : fData(std::move(geometry)) {}
    explicit operator const SkPoint&() const { return fData; }

    // Parrot the SkPoint API while preserving coordinate space.
    SkScalar x() const { return fData.fX; }
    SkScalar y() const { return fData.fY; }

    SkScalar distanceToOrigin() const { return fData.distanceToOrigin(); }

    // Offsetting by direction vectors produce more points
    LayerSpace<SkPoint> operator+(const LayerSpace<Vector>& v) {
        return LayerSpace<SkPoint>(fData + SkVector(v));
    }
    LayerSpace<SkPoint> operator-(const LayerSpace<Vector>& v) {
        return LayerSpace<SkPoint>(fData - SkVector(v));
    }

    void operator+=(const LayerSpace<Vector>& v) {
        fData += SkVector(v);
    }
    void operator-=(const LayerSpace<Vector>& v) {
        fData -= SkVector(v);
    }

    // Subtracting another point makes a direction between them
    LayerSpace<Vector> operator-(const LayerSpace<SkPoint>& p) {
        return LayerSpace<Vector>(Vector(fData - p.fData));
    }

    LayerSpace<Vector> operator-() const { return LayerSpace<Vector>({-fData.fX, -fData.fY}); }

private:
    SkPoint fData;
};

// Layer-space specialization for integer dimensions
template<>
class LayerSpace<SkISize> {
public:
    LayerSpace() = default;
    explicit LayerSpace(const SkISize& geometry) : fData(geometry) {}
    explicit LayerSpace(SkISize&& geometry) : fData(std::move(geometry)) {}
    explicit operator const SkISize&() const { return fData; }

    int32_t width() const { return fData.width(); }
    int32_t height() const { return fData.height(); }

    bool isEmpty() const { return fData.isEmpty(); }

private:
    SkISize fData;
};

// Layer-space specialization for floating point dimensions
template<>
class LayerSpace<SkSize> {
public:
    LayerSpace() = default;
    explicit LayerSpace(const SkSize& geometry) : fData(geometry) {}
    explicit LayerSpace(SkSize&& geometry) : fData(std::move(geometry)) {}
    explicit operator const SkSize&() const { return fData; }

    SkScalar width() const { return fData.width(); }
    SkScalar height() const { return fData.height(); }

    bool isEmpty() const { return fData.isEmpty(); }
    bool isZero() const { return fData.isZero(); }

    LayerSpace<SkISize> round() const { return LayerSpace<SkISize>(fData.toRound()); }
    LayerSpace<SkISize> ceil() const { return LayerSpace<SkISize>(fData.toCeil()); }
    LayerSpace<SkISize> floor() const { return LayerSpace<SkISize>(fData.toFloor()); }

private:
    SkSize fData;
};

// Layer-space specialization for axis-aligned integer bounding boxes.
template<>
class LayerSpace<SkIRect> {
public:
    LayerSpace() = default;
    explicit LayerSpace(const SkIRect& geometry) : fData(geometry) {}
    explicit LayerSpace(SkIRect&& geometry) : fData(std::move(geometry)) {}
    explicit LayerSpace(const SkISize& size) : fData(SkIRect::MakeSize(size)) {}
    explicit operator const SkIRect&() const { return fData; }

    static LayerSpace<SkIRect> Empty() { return LayerSpace<SkIRect>(SkIRect::MakeEmpty()); }

    // Parrot the SkIRect API while preserving coord space
    bool isEmpty() const { return fData.isEmpty(); }
    bool contains(const LayerSpace<SkIRect>& r) const { return fData.contains(r.fData); }

    int32_t left() const { return fData.fLeft; }
    int32_t top() const { return fData.fTop; }
    int32_t right() const { return fData.fRight; }
    int32_t bottom() const { return fData.fBottom; }

    int32_t width() const { return fData.width(); }
    int32_t height() const { return fData.height(); }

    LayerSpace<SkIPoint> topLeft() const { return LayerSpace<SkIPoint>(fData.topLeft()); }
    LayerSpace<SkISize> size() const { return LayerSpace<SkISize>(fData.size()); }

    bool intersect(const LayerSpace<SkIRect>& r) { return fData.intersect(r.fData); }
    void join(const LayerSpace<SkIRect>& r) { fData.join(r.fData); }
    void offset(const LayerSpace<IVector>& v) { fData.offset(SkIVector(v)); }
    void outset(const LayerSpace<SkISize>& delta) { fData.outset(delta.width(), delta.height()); }

private:
    SkIRect fData;
};

// Layer-space specialization for axis-aligned float bounding boxes.
template<>
class LayerSpace<SkRect> {
public:
    LayerSpace() = default;
    explicit LayerSpace(const SkRect& geometry) : fData(geometry) {}
    explicit LayerSpace(SkRect&& geometry) : fData(std::move(geometry)) {}
    explicit LayerSpace(const LayerSpace<SkIRect>& rect) : fData(SkRect::Make(SkIRect(rect))) {}
    explicit operator const SkRect&() const { return fData; }

    static LayerSpace<SkRect> Empty() { return LayerSpace<SkRect>(SkRect::MakeEmpty()); }

    // Parrot the SkRect API while preserving coord space and usage
    bool isEmpty() const { return fData.isEmpty(); }
    bool contains(const LayerSpace<SkRect>& r) const { return fData.contains(r.fData); }

    SkScalar left() const { return fData.fLeft; }
    SkScalar top() const { return fData.fTop; }
    SkScalar right() const { return fData.fRight; }
    SkScalar bottom() const { return fData.fBottom; }

    SkScalar width() const { return fData.width(); }
    SkScalar height() const { return fData.height(); }

    LayerSpace<SkPoint> topLeft() const {
        return LayerSpace<SkPoint>(SkPoint::Make(fData.fLeft, fData.fTop));
    }
    LayerSpace<SkPoint> center() const {
        return LayerSpace<SkPoint>(fData.center());
    }
    LayerSpace<SkSize> size() const {
        return LayerSpace<SkSize>(SkSize::Make(fData.width(), fData.height()));
    }

    LayerSpace<SkIRect> round() const { return LayerSpace<SkIRect>(fData.round()); }
    LayerSpace<SkIRect> roundIn() const { return LayerSpace<SkIRect>(RoundIn(fData)); }
    LayerSpace<SkIRect> roundOut() const { return LayerSpace<SkIRect>(RoundOut(fData)); }

    bool intersect(const LayerSpace<SkRect>& r) { return fData.intersect(r.fData); }
    void join(const LayerSpace<SkRect>& r) { fData.join(r.fData); }
    void offset(const LayerSpace<Vector>& v) { fData.offset(SkVector(v)); }
    void outset(const LayerSpace<SkSize>& delta) { fData.outset(delta.width(), delta.height()); }

    LayerSpace<SkPoint> clamp(LayerSpace<SkPoint> pt) const {
        return LayerSpace<SkPoint>(SkPoint::Make(SkTPin(pt.x(), fData.fLeft, fData.fRight),
                                                 SkTPin(pt.y(), fData.fTop, fData.fBottom)));
    }

private:
    SkRect fData;
};

// A transformation that manipulates geometry in the layer-space coordinate system. Mathematically
// there's little difference from these matrices compared to what's stored in a skif::Mapping, but
// the intent differs. skif::Mapping's matrices map geometry from one coordinate space to another
// while these transforms move geometry w/o changing the coordinate space semantics.
// TODO(michaelludwig): Will be replaced with an SkM44 version when skif::Mapping works with SkM44.
template<>
class LayerSpace<SkMatrix> {
public:
    LayerSpace() = default;
    explicit LayerSpace(const SkMatrix& m) : fData(m) {}
    explicit LayerSpace(SkMatrix&& m) : fData(std::move(m)) {}
    explicit operator const SkMatrix&() const { return fData; }

    static LayerSpace<SkMatrix> RectToRect(const LayerSpace<SkRect>& from,
                                           const LayerSpace<SkRect>& to) {
        return LayerSpace<SkMatrix>(SkMatrix::RectToRect(SkRect(from), SkRect(to)));
    }

    // Parrot a limited selection of the SkMatrix API while preserving coordinate space.
    LayerSpace<SkRect> mapRect(const LayerSpace<SkRect>& r) const;

    // Effectively mapRect(SkRect).roundOut() but more accurate when the underlying matrix or
    // SkIRect has large floating point values.
    LayerSpace<SkIRect> mapRect(const LayerSpace<SkIRect>& r) const;

    LayerSpace<SkPoint> mapPoint(const LayerSpace<SkPoint>& p) const {
        return LayerSpace<SkPoint>(fData.mapPoint(SkPoint(p)));
    }

    LayerSpace<Vector> mapVector(const LayerSpace<Vector>& v) const {
        return LayerSpace<Vector>(Vector(fData.mapVector(v.x(), v.y())));
    }

    LayerSpace<SkMatrix>& preConcat(const LayerSpace<SkMatrix>& m) {
        fData = SkMatrix::Concat(fData, m.fData);
        return *this;
    }

    LayerSpace<SkMatrix>& postConcat(const LayerSpace<SkMatrix>& m) {
        fData = SkMatrix::Concat(m.fData, fData);
        return *this;
    }

    bool invert(LayerSpace<SkMatrix>* inverse) const {
        return fData.invert(&inverse->fData);
    }

    // Transforms 'r' by the inverse of this matrix if it is invertible and stores it in 'out'.
    // Returns false if not invertible, in which case 'out' is undefined.
    bool inverseMapRect(const LayerSpace<SkRect>& r, LayerSpace<SkRect>* out) const;
    bool inverseMapRect(const LayerSpace<SkIRect>& r, LayerSpace<SkIRect>* out) const;

    float rc(int row, int col) const { return fData.rc(row, col); }
    float get(int i) const { return fData.get(i); }

private:
    SkMatrix fData;
};

// Mapping is the primary definition of the shared layer space used when evaluating an image filter
// DAG. It encapsulates any needed decomposition of the total CTM into the parameter-to-layer matrix
// (that filters use to map their parameters to the layer space), and the layer-to-device matrix
// (that canvas uses to map the output layer-space image into its root device space). Mapping
// defines functions to transform ParameterSpace and DeviceSpace types to and from their LayerSpace
// variants, which can then be used and reasoned about by SkImageFilter implementations.
class Mapping {
public:
    Mapping() = default;

    // Helper constructor that equates device and layer space to the same coordinate space.
    explicit Mapping(const SkMatrix& paramToLayer)
            : fLayerToDevMatrix(SkMatrix::I())
            , fParamToLayerMatrix(paramToLayer)
            , fDevToLayerMatrix(SkMatrix::I()) {}

    // This constructor allows the decomposition to be explicitly provided, assumes that
    // 'layerToDev's inverse has already been calculated in 'devToLayer'
    Mapping(const SkMatrix& layerToDev, const SkMatrix& devToLayer, const SkMatrix& paramToLayer)
            : fLayerToDevMatrix(layerToDev)
            , fParamToLayerMatrix(paramToLayer)
            , fDevToLayerMatrix(devToLayer) {}

    // Sets this Mapping to the default decomposition of the canvas's total transform, given the
    // requirements of the 'filter'. Returns false if the decomposition failed or would produce an
    // invalid device matrix. Assumes 'ctm' is invertible.
    bool SK_WARN_UNUSED_RESULT decomposeCTM(const SkMatrix& ctm,
                                            const SkImageFilter* filter,
                                            const skif::ParameterSpace<SkPoint>& representativePt);

    // Update the mapping's parameter-to-layer matrix to be pre-concatenated with the specified
    // local space transformation. This changes the definition of parameter space, any
    // skif::ParameterSpace<> values are interpreted anew. Layer space and device space are
    // unchanged.
    void concatLocal(const SkMatrix& local) { fParamToLayerMatrix.preConcat(local); }

    // Update the mapping's layer space coordinate system by post-concatenating the given matrix
    // to it's parameter-to-layer transform, and pre-concatenating the inverse of the matrix with
    // it's layer-to-device transform. The net effect is that neither the parameter nor device
    // coordinate systems are changed, but skif::LayerSpace is adjusted.
    //
    // Returns false if the layer matrix cannot be inverted, and this mapping is left unmodified.
    bool adjustLayerSpace(const SkMatrix& layer);

    // Update the mapping's layer space so that the point 'origin' in the current layer coordinate
    // space maps to (0, 0) in the adjusted coordinate space.
    void applyOrigin(const LayerSpace<SkIPoint>& origin) {
        SkAssertResult(this->adjustLayerSpace(SkMatrix::Translate(-origin.x(), -origin.y())));
    }

    const SkMatrix& layerToDevice() const { return fLayerToDevMatrix; }
    const SkMatrix& deviceToLayer() const { return fDevToLayerMatrix; }
    const SkMatrix& layerMatrix() const { return fParamToLayerMatrix; }
    SkMatrix totalMatrix() const {
        return SkMatrix::Concat(fLayerToDevMatrix, fParamToLayerMatrix);
    }

    template<typename T>
    LayerSpace<T> paramToLayer(const ParameterSpace<T>& paramGeometry) const {
        return LayerSpace<T>(map(static_cast<const T&>(paramGeometry), fParamToLayerMatrix));
    }

    template<typename T>
    LayerSpace<T> deviceToLayer(const DeviceSpace<T>& devGeometry) const {
        return LayerSpace<T>(map(static_cast<const T&>(devGeometry), fDevToLayerMatrix));
    }

    template<typename T>
    DeviceSpace<T> layerToDevice(const LayerSpace<T>& layerGeometry) const {
        return DeviceSpace<T>(map(static_cast<const T&>(layerGeometry), fLayerToDevMatrix));
    }

private:
    // The image filter process decomposes the total CTM into layerToDev * paramToLayer and uses the
    // param-to-layer matrix to define the layer-space coordinate system. Depending on how it's
    // decomposed, either the layer matrix or the device matrix could be the identity matrix (but
    // sometimes neither).
    SkMatrix fLayerToDevMatrix;
    SkMatrix fParamToLayerMatrix;

    // Cached inverse of fLayerToDevMatrix
    SkMatrix fDevToLayerMatrix;

    // Actual geometric mapping operations that work on coordinates and matrices w/o the type
    // safety of the coordinate space wrappers (hence these are private).
    template<typename T>
    static T map(const T& geom, const SkMatrix& matrix);
};

class Context; // Forward declare for FilterResult

// A FilterResult represents a lazy image anchored in the "layer" coordinate space of the current
// image filtering context. It's named Filter*Result* since most instances represent the output of
// a specific image filter (even if that is then used as an input to the next filter). FilterResults
// are lazy to allow certain operations to combine analytically instead of producing an offscreen
// image for every node in a filter graph. Helper functions are provided to modify FilterResults
// that manage this internally.
//
// Even though FilterResult represents a lazy image, it is always backed by a non-lazy source image
// that is then transformed, sampled, cropped, tiled, and/or color-filtered to produce the resolved
// image of the FilterResult. It is these actions applied to the source image that can be combined
// without producing a new intermediate "source" if it's determined that the combined actions
// rendered once would create an image close enough to the canonical output of rendering each action
// separately. Eliding offscreen renders in this way can introduce visually imperceptible pixel
// differences due to avoiding casting down to a lower precision pixel format or performing fewer
// image sampling sequences.
//
// The resolved image of a FilterResult is the output of rendering:
//
//   SkMatrix netTransform = RectToRect(fSrcRect, fDstRect);
//   netTransform.postConcat(fTransform);
//
//   SkPaint paint;
//   paint.setShader(fImage->makeShader(fTileMode, fSamplingOptions, &netTransform));
//   paint.setColorFilter(fColorFilter);
//   paint.setBlendMode(kSrc);
//
//   canvas->drawRect(fLayerBounds, paint);
//
// A FilterResult may represent the output of multiple operations affecting the different meta
// properties defined above. The operations are applied in order:
//   1. Tile the image using configured SkTileMode on the source rect.
//   2. Transform and sample (with configured SkSamplingOptions) from source rect up to the dest
//      rect and then any additional transform.
//   3. Apply any SkColorFilter to all pixels from #2 (including transparent black pixels resulting
//      from decal sampling).
//   4. Restrict the result to the layer bounds.
//
// If a new operation applied to a FilterResult does not respect this order, or cannot be modified
// to be re-ordered in place (e.g. modify fSrcRect/fDstRect instead of fLayerBounds for a crop),
// then the FilterResult must be resolved and the new operation applied to a clean slate. If it can
// be applied while respecting the order of operations than the action is free and no new
// intermediate image is produced.
//
// NOTE: The above comment reflects the end goal of the in-progress FilterResult. Currently
// SkSpecialImage is used, which internally has a subset property (its fSrcRect) and always has an
// fDstRect equal to (0,0,subset WH). Tile modes haven't been implemented yet and kDecal
// is always assumed; Color filters have also not been implemented yet.
class FilterResult {
public:
    FilterResult() : FilterResult(nullptr) {}

    explicit FilterResult(sk_sp<SkSpecialImage> image)
            : FilterResult(std::move(image), LayerSpace<SkIPoint>({0, 0})) {}

    FilterResult(std::pair<sk_sp<SkSpecialImage>, LayerSpace<SkIPoint>> imageAndOrigin)
            : FilterResult(std::move(std::get<0>(imageAndOrigin)), std::get<1>(imageAndOrigin)) {}

    FilterResult(sk_sp<SkSpecialImage> image, const LayerSpace<SkIPoint>& origin)
            : fImage(std::move(image))
            , fSamplingOptions(kDefaultSampling)
            , fTransform(SkMatrix::Translate(origin.x(), origin.y()))
            , fColorFilter(nullptr)
            , fLayerBounds(
                    fTransform.mapRect(LayerSpace<SkIRect>(fImage ? fImage->dimensions()
                                                                  : SkISize{0, 0}))) {}

    // Renders the 'pic', clipped by 'cullRect', into an optimally sized surface (depending on
    // picture bounds and 'ctx's desired output). The picture is transformed by the context's
    // layer matrix. Treats null pictures as fully transparent.
    static FilterResult MakeFromPicture(const Context& ctx,
                                        sk_sp<SkPicture> pic,
                                        ParameterSpace<SkRect> cullRect);

    // Renders 'shader' into a surface that fills the context's desired output bounds. Treats null
    // shaders as fully transparent.
    // TODO: Update 'dither' to SkImageFilters::Dither, but that cannot be forward declared at the
    // moment because SkImageFilters is a class and not a namespace.
    static FilterResult MakeFromShader(const Context& ctx,
                                       sk_sp<SkShader> shader,
                                       bool dither);

    // Converts image to a FilterResult. If 'srcRect' is pixel-aligned it does so without rendering.
    // Otherwise it draws the src->dst sampling of 'image' into an optimally sized surface based
    // on the context's desired output.
    static FilterResult MakeFromImage(const Context& ctx,
                                      sk_sp<SkImage> image,
                                      const SkRect& srcRect,
                                      const ParameterSpace<SkRect>& dstRect,
                                      const SkSamplingOptions& sampling);

    // Bilinear is used as the default because it can be downgraded to nearest-neighbor when the
    // final transform is pixel-aligned, and chaining multiple bilinear samples and transforms is
    // assumed to be visually close enough to sampling once at highest quality and final transform.
    static constexpr SkSamplingOptions kDefaultSampling{SkFilterMode::kLinear};

    explicit operator bool() const { return SkToBool(fImage); }

    // TODO(michaelludwig): Given the planned expansion of FilterResult state, it might be nice to
    // pull this back and not expose anything other than its bounding box. This will be possible if
    // all rendering can be handled by functions defined on FilterResult.
    const SkSpecialImage* image() const { return fImage.get(); }
    sk_sp<SkSpecialImage> refImage() const { return fImage; }

    // Get the layer-space bounds of the result. This will incorporate any layer-space transform.
    LayerSpace<SkIRect> layerBounds() const { return fLayerBounds; }

    SkSamplingOptions sampling() const { return fSamplingOptions; }

    const SkColorFilter* colorFilter() const { return fColorFilter.get(); }

    // Produce a new FilterResult that has been cropped to 'crop', taking into account the context's
    // desired output. When possible, the returned FilterResult will reuse the underlying image and
    // adjust its metadata. This will depend on the current transform and tile mode as well as how
    // the crop rect intersects this result's layer bounds.
    // TODO (michaelludwig): All FilterResults are decal mode and there are no current usages that
    // require force-padding a decal FilterResult so these arguments aren't implemented yet.
    FilterResult applyCrop(const Context& ctx,
                           const LayerSpace<SkIRect>& crop) const;
                           //  SkTileMode newTileMode=SkTileMode::kDecal,
                           //  bool forcePad=false) const;

    // Produce a new FilterResult that is the transformation of this FilterResult. When this
    // result's sampling and transform are compatible with the new transformation, the returned
    // FilterResult can reuse the same image data and adjust just the metadata.
    FilterResult applyTransform(const Context& ctx,
                                const LayerSpace<SkMatrix>& transform,
                                const SkSamplingOptions& sampling) const;

    // Produce a new FilterResult that is visually equivalent to the output of the SkColorFilter
    // evaluating this FilterResult. If the color filter affects transparent black, the returned
    // FilterResult can become non-empty even if the input were empty.
    FilterResult applyColorFilter(const Context& ctx,
                                  sk_sp<SkColorFilter> colorFilter) const;

    // Extract image and origin, safely when the image is null. If there are deferred operations
    // on FilterResult (such as tiling or transforms) not representable as an image+origin pair,
    // the returned image will be the resolution resulting from that metadata and not necessarily
    // equal to the original 'image()'.
    // TODO (michaelludwig) - This is intended for convenience until all call sites of
    // SkImageFilter_Base::filterImage() have been updated to work in the new type system
    // (which comes later as SkDevice, SkCanvas, etc. need to be modified, and coordinate space
    // tagging needs to be added).
    sk_sp<SkSpecialImage> imageAndOffset(const Context& ctx, SkIPoint* offset) const;

    class Builder;

    enum class ShaderFlags : int {
        kNone = 0,
        kSampleInParameterSpace = 1 << 0,
        kForceResolveInputs     = 1 << 1,
        kNonLinearSampling      = 1 << 2,
        kOutputFillsInputUnion  = 1 << 3
        // TODO: Add options for input intersection, first input only, and explicitly provided.
    };
    SK_DECL_BITMASK_OPS_FRIENDS(ShaderFlags)

private:
    friend class ::FilterResultImageResolver; // For testing draw() and asShader()

    // Renders this FilterResult into a new, but visually equivalent, image that fills 'dstBounds',
    // has default sampling, no color filter, and a transform that translates by only 'dstBounds's
    // top-left corner. 'dstBounds' is always intersected with 'fLayerBounds'.
    std::pair<sk_sp<SkSpecialImage>, LayerSpace<SkIPoint>>
    resolve(const Context& ctx, LayerSpace<SkIRect> dstBounds) const;

    // Returns true if the effects of the fLayerBounds crop are visible when this image is drawn
    // with 'xtraTransform' restricted to 'dstBounds'.
    bool isCropped(const LayerSpace<SkMatrix>& xtraTransform,
                   const LayerSpace<SkIRect>& dstBounds) const;

    // Draw directly to the canvas, which draws the same image as produced by resolve() but can be
    // useful if multiple operations need to be performed on the canvas.
    void draw(SkCanvas* canvas) const;

    // Returns the FilterResult as a shader, ideally without resolving to an axis-aligned image.
    // 'xtraSampling' is the sampling that any parent shader applies to the FilterResult.
    sk_sp<SkShader> asShader(const Context& ctx,
                             const SkSamplingOptions& xtraSampling,
                             SkEnumBitMask<ShaderFlags> flags) const;

    // The effective image of a FilterResult is 'fImage' sampled by 'fSamplingOptions' and
    // respecting 'fTileMode' (on the SkSpecialImage's subset), transformed by 'fTransform',
    // filtered by 'fColorFilter', and then clipped to 'fLayerBounds'.
    sk_sp<SkSpecialImage> fImage;
    SkSamplingOptions     fSamplingOptions;
    // SkTileMode         fTileMode = SkTileMode::kDecal;
    // Typically this will be an integer translation that encodes the origin of the top left corner,
    // but can become more complex when combined with applyTransform().
    LayerSpace<SkMatrix>  fTransform;

    // A null color filter is the identity function. Since the output is clipped to fLayerBounds
    // after color filtering, SkColorFilters that affect transparent black are not unbounded.
    sk_sp<SkColorFilter>  fColorFilter;

    // The layer bounds are initially fImage's dimensions mapped by fTransform. As the filter result
    // is processed by the image filter DAG, it can be further restricted by crop rects or the
    // implicit desired output at each node.
    LayerSpace<SkIRect>   fLayerBounds;
};
SK_MAKE_BITMASK_OPS(FilterResult::ShaderFlags)

// A FilterResult::Builder is used to render one or more FilterResults or other sources into
// a new FilterResult. It automatically aggregates the incoming bounds to minimize the output's
// layer bounds.
class FilterResult::Builder {
public:
    Builder(const Context& context);
    ~Builder();

    Builder& add(const FilterResult& input) {
        fInputs.push_back(input);
        return *this;
    }

    // Combine all added inputs by merging them with src-over blending into a single output.
    FilterResult merge();

    // Combine all added inputs by transforming them into equivalent SkShaders and invoking the
    // shader factory that binds them together into a single shader that fills the output surface.
    // 'flags' and 'xtraSampling' control how the input FilterResults are converted to shaders, as
    // well as defining the final output bounds.
    //
    // 'ShaderFn' should be an invokable type with the signature
    //     (SkSpan<sk_sp<SkShader>>)->sk_sp<SkShader>
    // The length of the span will equal the number of FilterResults added to the builder. If an
    // input FilterResult was fully transparent, its corresponding shader will be null. 'ShaderFn'
    // should return a null shader its output would be fully transparent.
    template <typename ShaderFn>
    FilterResult eval(ShaderFn shaderFn,
                      SkEnumBitMask<ShaderFlags> flags,
                      const SkSamplingOptions& xtraSampling = kDefaultSampling) {
        auto outputBounds = this->outputBounds(flags);
        if (outputBounds.isEmpty()) {
            return {};
        }

        auto inputShaders = this->createInputShaders(flags, xtraSampling);
        return this->drawShader(shaderFn(inputShaders), flags, outputBounds);
    }

private:
    SkSpan<sk_sp<SkShader>> createInputShaders(SkEnumBitMask<ShaderFlags> flags,
                                               const SkSamplingOptions& sampling);

    LayerSpace<SkIRect> outputBounds(SkEnumBitMask<ShaderFlags> flags) const;

    FilterResult drawShader(sk_sp<SkShader> shader,
                            SkEnumBitMask<ShaderFlags> flags,
                            const LayerSpace<SkIRect>& outputBounds) const;

    const Context& fContext; // Must outlive the builder
    skia_private::STArray<1, FilterResult> fInputs;
    // Lazily created once all inputs are collected, but parallels fInputs.
    skia_private::STArray<1, sk_sp<SkShader>> fInputShaders;
};

// The context contains all necessary information to describe how the image filter should be
// computed (i.e. the current layer matrix and clip), and the color information of the output of a
// filter DAG. For now, this is just the color space (of the original requesting device). This is
// used when constructing intermediate rendering surfaces, so that we ensure we land in a surface
// that's similar/compatible to the final consumer of the DAG's output.
struct ContextInfo {
    // Properties controlling the size and coordinate space of image filtering
    Mapping             fMapping;
    LayerSpace<SkIRect> fDesiredOutput;
    // Can contain a null image if the image filter DAG has no late-bound null inputs.
    FilterResult        fSource;

    // Properties controlling the pixel data during image filtering
    SkColorType         fColorType;
    // The pointed-to object is owned by the device controlling the filter process, and our lifetime
    // is bounded by the device, so this can be a bare pointer.
    SkColorSpace*       fColorSpace;
    SkSurfaceProps      fSurfaceProps;

    SkImageFilterCache* fCache;
};

class Context {
    static constexpr GrSurfaceOrigin kUnusedOrigin = (GrSurfaceOrigin) 0;
public:
    static Context MakeRaster(const ContextInfo& info) {
        // TODO (skbug:14286): Remove this forcing to 8888. Many legacy image filters only support
        // N32 on CPU, but once they are implemented in terms of draws and SkSL they will support
        // all color types, like the GPU backends.
        ContextInfo n32 = info;
        n32.fColorType = kN32_SkColorType;
        return Context(n32, nullptr, kUnusedOrigin, nullptr);
    }

#if defined(SK_GANESH)
    static Context MakeGanesh(GrRecordingContext* context,
                              GrSurfaceOrigin origin,
                              const ContextInfo& info) {
        return Context(info, context, origin, nullptr);
    }
#endif

#if defined(SK_GRAPHITE)
    static Context MakeGraphite(skgpu::graphite::Recorder* recorder, const ContextInfo& info) {
        return Context(info, nullptr, kUnusedOrigin, recorder);
    }
#endif

    Context() = default; // unitialized to support assignment in branches for MakeX() above

    // The mapping that defines the transformation from local parameter space of the filters to the
    // layer space where the image filters are evaluated, as well as the remaining transformation
    // from the layer space to the final device space. The layer space defined by the returned
    // Mapping may be the same as the root device space, or be an intermediate space that is
    // supported by the image filter DAG (depending on what it returns from getCTMCapability()).
    // If a node returns something other than kComplex from getCTMCapability(), the layer matrix of
    // the mapping will respect that return value, and the remaining matrix will be appropriately
    // set to transform the layer space to the final device space (applied by the SkCanvas when
    // filtering is finished).
    const Mapping& mapping() const { return fInfo.fMapping; }
    // DEPRECATED: Use mapping() and its coordinate-space types instead
    const SkMatrix& ctm() const { return fInfo.fMapping.layerMatrix(); }
    // The bounds, in the layer space, that the filtered image will be clipped to. The output
    // from filterImage() must cover these clip bounds, except in areas where it will just be
    // transparent black, in which case a smaller output image can be returned.
    const LayerSpace<SkIRect>& desiredOutput() const { return fInfo.fDesiredOutput; }
    // DEPRECATED: Use desiredOutput() instead
    const SkIRect& clipBounds() const { return static_cast<const SkIRect&>(fInfo.fDesiredOutput); }
    // The cache to use when recursing through the filter DAG, in order to avoid repeated
    // calculations of the same image.
    SkImageFilterCache* cache() const { return fInfo.fCache; }
    // The output device's color type, which can be used for intermediate images to be
    // compatible with the eventual target of the filtered result.
    SkColorType colorType() const { return fInfo.fColorType; }
#if defined(SK_GANESH)
    GrColorType grColorType() const { return SkColorTypeToGrColorType(fInfo.fColorType); }
#endif
    // The output device's color space, so intermediate images can match, and so filtering can
    // be performed in the destination color space.
    SkColorSpace* colorSpace() const { return fInfo.fColorSpace; }
    sk_sp<SkColorSpace> refColorSpace() const { return sk_ref_sp(fInfo.fColorSpace); }
    // The default surface properties to use when making transient surfaces during filtering.
    const SkSurfaceProps& surfaceProps() const { return fInfo.fSurfaceProps; }

    // This is the image to use whenever an expected input filter has been set to null. In the
    // majority of cases, this is the original source image for the image filter DAG so it comes
    // from the SkDevice that holds either the saveLayer or the temporary rendered result. The
    // exception is composing two image filters (via SkImageFilters::Compose), which must use
    // the output of the inner DAG as the "source" for the outer DAG.
    const FilterResult& source() const { return fInfo.fSource; }
    // DEPRECATED: Use source() instead to get both the image and its origin.
    const SkSpecialImage* sourceImage() const { return fInfo.fSource.image(); }

    // True if image filtering should occur on the GPU if possible.
    bool gpuBacked() const { return SkToBool(fGaneshContext); }
    // The recording context to use when computing the filter with the GPU.
    GrRecordingContext* getContext() const { return fGaneshContext; }

    // Create a surface of the given size, that matches the context's color type and color space
    // as closely as possible, and uses the same backend of the device that produced the source
    // image.
    sk_sp<SkSpecialSurface> makeSurface(const SkISize& size,
                                        const SkSurfaceProps* props = nullptr) const;

    // Create a new context that matches this context, but with an overridden layer space.
    Context withNewMapping(const Mapping& mapping) const {
        ContextInfo info = fInfo;
        info.fMapping = mapping;
        return Context(info, fGaneshContext, fGaneshOrigin, fGraphiteRecorder);
    }
    // Create a new context that matches this context, but with an overridden desired output rect.
    Context withNewDesiredOutput(const LayerSpace<SkIRect>& desiredOutput) const {
        ContextInfo info = fInfo;
        info.fDesiredOutput = desiredOutput;
        return Context(info, fGaneshContext, fGaneshOrigin, fGraphiteRecorder);
    }
    // Create a new context that matches this context, but with an overridden color space.
    Context withNewColorSpace(SkColorSpace* cs) const {
        ContextInfo info = fInfo;
        info.fColorSpace = cs;
        return Context(info, fGaneshContext, fGaneshOrigin, fGraphiteRecorder);
    }

    // Create a new context that matches this context, but with an overridden source.
    // TODO: Have this take just a FilterResult when no origin manipulation is required.
    Context withNewSource(sk_sp<SkSpecialImage> source, LayerSpace<SkIPoint> origin) const {
        // TODO: Some legacy image filter implementations assume that the source FilterResult's
        // origin/transform is at (0,0). To accommodate that, we push the typical origin transform
        // into the param-to-layer matrix and adjust the desired output.
        ContextInfo info = fInfo;
        info.fMapping.applyOrigin(origin);
        info.fDesiredOutput.offset(-origin);
        info.fSource = FilterResult(std::move(source));
        return Context(info, fGaneshContext, fGaneshOrigin, fGraphiteRecorder);
    }

private:
    Context(const ContextInfo& info,
            GrRecordingContext* ganeshContext,
            GrSurfaceOrigin ganeshOrigin,
            skgpu::graphite::Recorder* graphiteRecorder)
            : fInfo(info)
            , fGaneshContext(ganeshContext)
            , fGaneshOrigin(ganeshOrigin)
            , fGraphiteRecorder(graphiteRecorder) {
#if defined(SK_GANESH)
        SkASSERT(!fInfo.fSource.image() ||
                 SkToBool(ganeshContext) == fInfo.fSource.image()->isTextureBacked());
#else
        SkASSERT(!SkToBool(ganeshContext));
#endif

#if defined(SK_GRAPHITE)
        SkASSERT(!fInfo.fSource.image() ||
                 SkToBool(graphiteRecorder) == fInfo.fSource.image()->isGraphiteBacked());
#else
        SkASSERT(!SkToBool(graphiteRecorder));
#endif
    }

    ContextInfo fInfo;

    // Both will be null for CPU image filtering, or one will be non-null to select the GPU backend.
    GrRecordingContext* fGaneshContext;
    GrSurfaceOrigin fGaneshOrigin;
    skgpu::graphite::Recorder* fGraphiteRecorder;
};

} // end namespace skif

#endif // SkImageFilterTypes_DEFINED
