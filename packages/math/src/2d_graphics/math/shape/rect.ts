import { Vector2 } from '../vector2'
import {BoundingRect} from '../bounding_rect'

export class Rect {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    get left() {
        return this.x
    }
    get right() {
        return this.x + this.width
    }
    get top() {
        return this.y
    }
    get bottom() {
        return this.y + this.height
    }
    distanceTo(px: number, py: number) {
        const left = this.left;
        const right = this.right
        const top = this.top;
        const bottom = this.bottom;

        const onLeftEdge = px === left && py >= top && py <= bottom;
        const onRightEdge = px === right && py >= top && py <= bottom;
        const onTopEdge = py === top && px >= left && px <= right;
        const onBottomEdge = py === bottom && px >= left && px <= right;

        const isOnBorder = onLeftEdge || onRightEdge || onTopEdge || onBottomEdge;

        if (isOnBorder) {
            return 0;
        }

        // 计算点到矩形每条边的距离
        const distances = [];

        // 距离左边
        if (px < left) {
            distances.push(left - px);
        } else if (px > right) {
            distances.push(px - right);
        } else {
            distances.push(0);
        }

        // 距离上边
        if (py < top) {
            distances.push(top - py);
        } else if (py > bottom) {
            distances.push(py - bottom);
        } else {
            distances.push(0);
        }

        // 如果点在矩形内部，计算到最近边的距离
        if (px > left && px < right && py > top && py < bottom) {
            const distToLeft = px - left;
            const distToRight = right - px;
            const distToTop = py - top;
            const distToBottom = bottom - py;
            return Math.min(distToLeft, distToRight, distToTop, distToBottom);
        }

        // 如果点在矩形外部，计算到最近边的距离
        return Math.sqrt(distances[0] ** 2 + distances[1] ** 2);
    }
    contains(x: number, y: number) {
        return !(this.x > x || this.x + this.width < x || this.y > y || this.y + this.height < y)
    }
    containsStroke(x: number, y: number, width: number, alignment: number = 0.5) {
        const dist = this.distanceTo(x, y)
        const halfWidth = width * 0.5
        const offset = (alignment - 0.5) * 2 * halfWidth
        return Math.abs(dist - offset) <= halfWidth;
    }
    getBoundingBox(boundingBox: BoundingRect) {
        boundingBox.fromRect(this.x,this.y,this.width,this.height);
        return boundingBox;
    }
}