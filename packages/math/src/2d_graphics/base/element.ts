import {EventTarget} from '../event'
import deepmerge from '../utils/deepmerge'



export interface ElementAnimateConfig {
    duration?: number
    delay?: number
    //easing?: AnimationEasing
    during?: (percent: number) => void

    // `done` will be called when all of the animations of the target props are
    // "done" or "aborted", and at least one "done" happened.
    // Common cases: animations declared, but some of them are aborted (e.g., by state change).
    // The calling of `animationTo` done rather than aborted if at least one done happened.
    done?: Function
    // `aborted` will be called when all of the animations of the target props are "aborted".
    aborted?: Function

    scope?: string
    /**
     * If force animate
     * Prevent stop animation and callback
     * immediently when target values are the same as current values.
     */
    force?: boolean
    /**
     * If use additive animation.
     */
    additive?: boolean
    /**
     * If set to final state before animation started.
     * It can be useful if something you want to calcuate depends on the final state of element.
     * Like bounding rect for text layouting.
     *
     * Only available in animateTo
     */
    setToFinal?: boolean
}

export interface ElementTextConfig {
    /**
     * Position relative to the element bounding rect
     * @default 'inside'
     */
   // position?: BuiltinTextPosition | (number | string)[]

    /**
     * Rotation of the label.
     */
    rotation?: number

    /**
     * Rect that text will be positioned.
     * Default to be the boundingRect of the host element.
     * The coords of `layoutRect` is based on the target element, but not global.
     *
     * [NOTICE]: boundingRect includes `lineWidth`, which is inconsistent with
     *  the general element placement principle, where `lineWidth` is not counted.
     */
    //layoutRect?: RectLike

    /**
     * Offset of the label.
     * The difference of offset and position is that it will be applied
     * in the rotation
     */
    offset?: number[]

    /**
     * Origin or rotation. Which is relative to the bounding box of the attached element.
     * Can be percent value. Relative to the bounding box.
     * If specified center. It will be center of the bounding box.
     *
     * Only available when position and rotation are both set.
     */
    origin?: (number | string)[] | 'center'

    /**
     * Distance to the rect
     * @default 5
     */
    distance?: number

    /**
     * If use local user space. Which will apply host's transform
     *
     * [NOTICE]: If the host element may rotate to non-parallel to screen x/y,
     *  need to use `local:true`, otherwise the transformed layout rect may not be expected.
     *
     * @default false
     */
    local?: boolean

    /**
     * `insideFill` is a color string or left empty.
     * If a `textContent` is "inside", its final `fill` will be picked by this priority:
     * `textContent.style.fill` > `textConfig.insideFill` > "auto-calculated-fill"
     * In most cases, "auto-calculated-fill" is white.
     */
    insideFill?: string

    /**
     * `insideStroke` is a color string or left empty.
     * If a `textContent` is "inside", its final `stroke` will be picked by this priority:
     * `textContent.style.stroke` > `textConfig.insideStroke` > "auto-calculated-stroke"
     *
     * The rule of getting "auto-calculated-stroke":
     * If (A) the `fill` is specified in style (either in `textContent.style` or `textContent.style.rich`)
     * or (B) needed to draw text background (either defined in `textContent.style` or `textContent.style.rich`)
     * "auto-calculated-stroke" will be null.
     * Otherwise, "auto-calculated-stroke" will be the same as `fill` of this element if possible, or null.
     *
     * The reason of (A) is not decisive:
     * 1. If users specify `fill` in style and still use "auto-calculated-stroke", the effect
     * is not good and unexpected in some cases. It not easy and seams uncessary to auto calculate
     * a proper `stroke` for the given `fill`, since they can specify `stroke` themselve.
     * 2. Backward compat.
     */
    insideStroke?: string

    /**
     * `outsideFill` is a color string or left empty.
     * If a `textContent` is "inside", its final `fill` will be picked by this priority:
     * `textContent.style.fill` > `textConfig.outsideFill` > #000
     */
    outsideFill?: string

    /**
     * `outsideStroke` is a color string or left empth.
     * If a `textContent` is not "inside", its final `stroke` will be picked by this priority:
     * `textContent.style.stroke` > `textConfig.outsideStroke` > "auto-calculated-stroke"
     *
     * The rule of getting "auto-calculated-stroke":
     * If (A) the `fill` is specified in style (either in `textContent.style` or `textContent.style.rich`)
     * or (B) needed to draw text background (either defined in `textContent.style` or `textContent.style.rich`)
     * "auto-calculated-stroke" will be null.
     * Otherwise, "auto-calculated-stroke" will be a neer white color to distinguish "front end"
     * label with messy background (like other text label, line or other graphic).
     */
    outsideStroke?: string

    /**
     * Tell zrender I can sure this text is inside or not.
     * In case position is not using builtin `inside` hints.
     */
    inside?: boolean

    /**
     * Auto calculate overflow area by `textConfig.layoutRect` (if any) or `host.boundingRect`.
     * It makes sense only if label is inside. It ensure the text does not overflow the host.
     * Useful in `text.style.overflow` and `text.style.lineOverflow`.
     *
     * If `textConfig.rotation` or `text.rotation exists`, it works correctly only when the rotated text is parallel
     * to its host (i.e. 0, PI/2, PI, PI*3/2, 2*PI, ...). Do not supported other cases until a real scenario arises.
     */
    autoOverflowArea?: boolean
}
export interface ElementTextGuideLineConfig {
    /**
     * Anchor for text guide line.
     * Notice: Won't work
     */
    anchor?: Point

    /**
     * If above the target element.
     */
    showAbove?: boolean

    /**
     * Candidates of connectors. Used when autoCalculate is true and anchor is not specified.
     */
    candidates?: ('left' | 'top' | 'right' | 'bottom')[]
}

export interface ElementProps{
    name?: string
    ignore?: boolean
    isGroup?: boolean
    draggable?: boolean | 'horizontal' | 'vertical'

    silent?: boolean
    ignoreHostSilent?: boolean

    ignoreClip?: boolean
    globalScaleRatio?: number

    textConfig?: ElementTextConfig
   // textContent?: ZRText

  //  clipPath?: Path
    drift?: Element['drift']

   // extra?: Dictionary<unknown>

    // For echarts animation.
    anid?: string
}

