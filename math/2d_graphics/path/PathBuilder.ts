interface Point {
    x: number
    y: number
}
function makePoint(points: number, k: number): Point {
    return {
        x: points[k],
        y: points[k + 1],
    }
}
export enum PathVerb {
    MOVE_TO = "M", // 移动到指定的点，不绘制
    LINE_TO = "L", // 绘制直线到指定的点
    CUBIC_BEZIER_TO = "C", // 绘制三次贝塞尔曲线到指定的点
    QUADRATIC_BEZIER_TO = "Q", // 绘制二次贝塞尔曲线到指定的点
    CLOSE_PATH = "Z", // 关闭路径，绘制直线到起始点 
}
type PathVisitor = {
    moveTo: (record: { type: PathVerb, p0: Point, index: number }) => void
    lineTo: (record: { type: PathVerb, p0: Point, index: number }) => void
    quadraticCurveTo: (record: { type: PathVerb, p0: Point, p1: Point, p2: Point, index: number }) => void
    bezierCurveTo: (record: { type: PathVerb, p0: Point, p1: Point, p2: Point, p3: Point, index: number }) => void
    closePath: (record: { type: PathVerb, lastMovePoint: Point, index: number }) => void
}
export const ptsInVerb = (v: PathVerb) => {
    switch (v) {
        case PathVerb.MOVE_TO: return 2
        case PathVerb.LINE_TO: return 2
        case PathVerb.QUADRATIC_BEZIER_TO: return 4
        case PathVerb.CUBIC_BEZIER_TO: return 6
        default: return 0
    }
}
export type PathVerbData = {
    type: PathVerb
    p0?: Point,
    p1?: Point,
    p2?: Point
    p3?: Point
}
export class PathBuilder {
    public points: number[] = []; // 存储路径的字符串
    public verbs: PathVerb[] = []; // 存储路径的字符串
    private needInjectMove = true;
    private lastMoveIndex = -1
    private get lastVerb() { // 获取最后一个点的坐标
        const length = this.verbs.length; // 获取路径的长度
        return this.verbs[length - 1]; // 返回最后一个点的坐标
    }
    private get size() {
        return this.verbs.length
    }
    private get len() {
        return this.points.length
    }
    private injectMove() {
        if (this.needInjectMove) {
            if (this.size === 0) { // 如果路径为空，不绘制
                this.moveTo(0, 0)
            } else {
                this.moveTo(this.points[this.points.length - 2], this.points[this.points.length - 1])
            }
        }
    }
    moveTo(x: number, y: number) { // 移动到指定的点，不绘制
        const len = this.points.length
        if (this.lastVerb === PathVerb.MOVE_TO) { // 如果最后一个点是移动到指定的点，不绘制
            this.lastMoveIndex = len
            this.points[len - 2] = x; // 更新最后一个点的坐标
            this.points[len - 1] = y; // 更新最后一个点的坐标
        } else {
            this.lastMoveIndex = len
            this.points.push(x, y); // 存储路径的字符串
            this.verbs.push(PathVerb.MOVE_TO); // 存储路径的字符串
        }
        this.needInjectMove = false; // 不需要注入移动到指定的点，不绘制
        return this; // 返回自身，方便链式调用
    }
    lineTo(x: number, y: number) { // 绘制直线到指定的点
        this.injectMove();
        this.points.push(x, y);
        this.verbs.push(PathVerb.LINE_TO);
        return this;
    }
    quadraticBezierTo(cx: number, cy: number, x: number, y: number) { // 绘制二次贝塞尔曲线到指定的点
        this.injectMove();
        this.points.push(cx, cy, x, y);
        this.verbs.push(PathVerb.QUADRATIC_BEZIER_TO);
        return this
    }
    cubicBezierTo(cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number) { // 绘制三次贝塞尔曲线到指定的点
        this.injectMove();
        this.points.push(cx1, cy1, cx2, cy2, x, y);
        this.verbs.push(PathVerb.CUBIC_BEZIER_TO);
        return this;
    }
    closePath() {
        if (this.size > 0) {
            if (this.lastVerb !== PathVerb.CLOSE_PATH) {
                this.verbs.push(PathVerb.CLOSE_PATH);
            }
            this.needInjectMove = true;
        }
        return this; // 返回自身，方便链式调用
    }
    map(fn: (p: Point) => Point) {
        for (let i = 0; i < this.points.length; i += 2) {
            const p = makePoint(this.points, i)
            const mapPoint = fn(p)
            this.points[i] = mapPoint.x
            this.points[i + 1] = mapPoint.y
        }
        return this
    }
    transform(matrix: number[]) {
        this.map((p) => {
            return {
                x: matrix[0] * p.x + matrix[2] * p.y + matrix[4],
                y: matrix[1] * p.x + matrix[3] * p.y + matrix[5]
            }
        })
        return this
    }
    offset(dx: number, dy: number) {
        this.map((p) => {
            return {
                x: p.x + dx,
                y: p.y + dy
            }
        })
        return this
    }
    addPath(path: PathBuilder, matrix?: number[]) {
        path = path.clone()
        if (matrix) {
            path.transform(matrix)
        }
        this.lastMoveIndex = path.lastMoveIndex + this.points.length
        this.needInjectMove = path.needInjectMove
        this.points = this.points.concat(path.points.map(d => d.clone()))
        this.verbs = this.verbs.concat(path.verbs)
        return path
    }
    addReversePath(path: PathBuilder) {

        let needMove = true;
        let needClose = false;
        let points = path.points
        let verbs = path.verbs, i = verbs.length;
        let k = points.length;
        let movePtsLen = ptsInVerb(PathVerb.MOVE_TO)
        while (i-- > 0) {
            let type = verbs[i]
            let n = ptsInVerb(type);

            if (needMove) {
                k -= movePtsLen;
                this.moveTo(points[k], points[k + 1]);
                needMove = false;
            }
            k -= n;
            switch (type) {
                case PathVerb.MOVE_TO:
                    if (needClose) {
                        this.closePath();
                        needClose = false;
                    }
                    needMove = true;
                    k += movePtsLen;   // so we see the point in "if (needMove)" above
                    break;
                case PathVerb.LINE_TO:
                    this.lineTo(points[k], points[k + 1]);
                    break;
                case PathVerb.QUADRATIC_BEZIER_TO:
                    this.quadraticCurveTo(points[k + 2], points[k + 3], points[k], points[k + 1]);
                    break;
                case PathVerb.CUBIC_BEZIER_TO:
                    this.bezierCurveTo(points[k + 4], points[k + 5], points[k + 2], points[k + 3], points[k], points[k + 1]);
                    break;
                case PathVerb.CLOSE_PATH:
                    needClose = true;
                    break;
                default:
                    console.error("unexpected verb");
            }
        }

    }
    visit(_visitor: Partial<PathVisitor>) {
        const visitor: PathVisitor = Object.assign({
            moveTo: () => { },
            lineTo: () => { },
            quadraticCurveTo: () => { },
            bezierCurveTo: () => { },
            closePath: () => { }
        }, _visitor)
        let index = 0
        for (let d of this) {

            switch (d.type) {
                case PathVerb.MOVE_TO:
                    visitor.moveTo({ type: d.type, p0: d.p0!, index });
                    break
                case PathVerb.LINE_TO:
                    visitor.lineTo({ type: d.type, p0: d.p0!, index });
                    break
                case PathVerb.QUADRATIC_BEZIER_TO:
                    visitor.quadraticCurveTo({ type: d.type, p0: d.p0!, p1: d.p1!, p2: d.p2!, index });
                    break
                case PathVerb.CUBIC_BEZIER_TO:
                    visitor.bezierCurveTo({ type: d.type, p0: d.p0!, p1: d.p1!, p2: d.p2!, p3: d.p3!, index });
                    break
                case PathVerb.CLOSE_PATH:
                    visitor.closePath({ type: d.type, lastMovePoint: d.p0!, index })
                    break
            }
            index++

        }
    }
    *[Symbol.iterator](): Iterator<PathVerbData> {
        const points = this.points
        const verbs = this.verbs
        let k = 0, lastMovePoint: Point | null = null
        for (let i = 0; i < verbs.length; i++, k += ptsInVerb(verb)) {
            const verb = verbs[i]
            switch (verb) {
                case PathVerb.MOVE_TO:
                    lastMovePoint = makePoint(points, k)
                    yield { type: verb, p0: makePoint(points, k) }
                    break;
                case PathVerb.LINE_TO:
                    yield { type: verb, p0: makePoint(points, k) }
                    break;
                case PathVerb.QUADRATIC_BEZIER_TO:
                    yield { type: verb, p0: makePoint(points, k - 2), p1: makePoint(points, k), p2: makePoint(points, k + 2) }
                    break;
                case PathVerb.CUBIC_BEZIER_TO:
                    yield { type: verb, p0: makePoint(points, k - 2), p1: makePoint(points, k), p2: makePoint(points, k + 2), p3: makePoint(points, k + 4) }
                    break;
                case PathVerb.CLOSE_PATH:
                    yield { type: verb, p0: lastMovePoint }
                    break;
            }
        }
    }
}