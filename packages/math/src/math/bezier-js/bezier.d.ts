
    interface Point {
        x: number;
        y: number;
        z?: number | undefined;
    }
    interface Projection extends Point {
        t?: number | undefined;
        d?: number | undefined;
    }
    interface Inflection {
        x: number[];
        y: number[];
        z?: number[] | undefined;
        values: number[];
    }
    interface Offset extends Point {
        c: Point;
        n: Point;
    }
    interface Pair {
        left: Bezier;
        right: Bezier;
    }
    interface Split extends Pair {
        span: Point[];
        _t1?: number | undefined;
        _t2?: number | undefined;
    }
    interface MinMax {
        min: number;
        mid?: number | undefined;
        max: number;
        size?: number | undefined;
    }
    interface BBox {
        x: MinMax;
        y: MinMax;
        z?: MinMax | undefined;
    }
    interface Line {
        p1: Point;
        p2: Point;
    }
    interface Arc extends Point {
        e: number;
        r: number;
        s: number;
        interval: { start: number; end: number };
    }
    interface Shape {
        startcap: BezierCap;
        forward: Bezier;
        back: Bezier;
        endcap: BezierCap;
        bbox: BBox;
        intersections: (shape: Shape) => string[][] | number[][];
    }
    interface ABC {
        A: Point;
        B: Point;
        C: Point;
    }
    interface Closest {
        mdist: number;
        mpos: number;
    }
    /**
     * Bezier curve constructor. The constructor argument can be one of three things:
     *
     * 1. array/4 of {x:..., y:..., z:...}, z optional
     * 2. numerical array/8 ordered x1,y1,x2,y2,x3,y3,x4,y4
     * 3. numerical array/12 ordered x1,y1,z1,x2,y2,z2,x3,y3,z3,x4,y4,z4
     */
    class Bezier {
        private _linear;
        clockwise: boolean;
        _3d: boolean;
        _t1: number;
        _t2: number;
        _lut: Point[];
        dpoints: Point[][];
        order: number;
        points: Point[];
        dims: string[];
        dimlen: number;
        constructor(points: Point[]);
        constructor(coords: number[]);
        constructor(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4?: number, y4?: number);
        constructor(p1: Point, p2: Point, p3: Point, p4?: Point);
        static fromSVG(svgString: string): Bezier;
        static getABC(n: number, S: Point, B: Point, E: Point, t: number): ABC;
        static quadraticFromPoints(p1: Point, p2: Point, p3: Point, t?: number): Bezier;
        static cubicFromPoints(S: Point, B: Point, E: Point, t?: number, d1?: number): Bezier;
        static getUtils(): utils;
        getUtils(): utils;
        valueOf(): string;
        toString(): string;
        toSVG(): string;
        update(): void;
        computedirection(): void;
        length(): number;
        getLUT(steps?: number): Point[]; // 生成曲线上坐标的查找表，以参数等距间隔排列
        on(point: Point, error: number): number;
        /**
         * 使用基于曲线查找表 (LUT) 的两遍投影测试，查找最接近特定曲线外点的曲线内点。
         * 通过距离比较找到最接近的匹配项，然后检查该匹配项周围的精细区间，看看是否可以找到更优的投影。
        */
        project(point: Point): Projection;
        get(t: number): Point; // 计算曲线上某个点，给定介于t0 到 1 之间的值（含 0 和 1）
        point(idx: number): Point;
        compute(t: number): Point;
        raise(): Bezier; // 向上提升曲线阶数，使之成为更高阶的贝塞尔曲线
        derivative(t: number): Point; //计算指定值处的曲线切线
        /**
         * 计算曲线上的所有拐点。即曲线曲率符号发生变化的所有点。
            t此函数产生发生拐点的值数组。
            请注意，根据定义，二次曲线不能有拐点。
         */
        inflections(): number[]; 
        normal(t: number): Point; // 计算指定t值处的曲线法线
        private __normal2(t);
        private __normal3(t);
        private __normal(t);
        hull(t: number): Point[];// 在所有迭代中，为指定 t 值的曲线上点生成所有包点。
        split(t1: number): Split;//t当仅给出一个值时，此函数将把曲线分成t=... 两条新曲线，这两条新曲线合在一起相当于原始曲线
        split(t1: number, t2: number): Bezier;
        extrema(): Inflection; //计算曲线上的所有极值
        bbox(): BBox; // 根据其外壳坐标和极值计算（如果未缓存）此曲线的边界框。
        overlaps(curve: Bezier): boolean;
        offset(t: number, d?: number): Offset | Bezier[];//果仅使用距离参数调用此函数，则会创建一条沿曲线法线偏移距离为 的新曲线d
        simple(): boolean;
        /** 
         * 将曲线简化为“简单”子曲线的集合，其中简单性定义为所有控制点都在基线的同一侧（三次曲线具有控制到端点线不得交叉的附加约束），并且端点法线之间的角度不大于 60 度。
        此函数存在的主要原因是为了能够缩放曲线。正如偏移函数中提到的，如果不使用欺骗手段，曲线就无法偏移，而这种欺骗手段正是在此函数中实现的。此函数生成的简单曲线数组可以安全地进行缩放。
        */
        reduce(): Bezier[];
        scale(d: Function): Bezier;
        scale(d: number): Bezier;
        //t使用曲率公式计算点处的曲线曲率：
        //该函数生成一个对象{ k:number, r:number}，其中 的值k 是点的曲率t，r是该曲率的半径，等于 1/k。注意，无穷大曲率（例如 时k=0）也表示为 r=0，而不是某个无穷大值。
        curvature(t:number):{ k:number, r:number, dk: number, adk:number };
        outline(d1: number, d2?: number, d3?: number, d4?: number): PolyBezier; // 这将生成一条曲线的轮廓，
        outlineshapes(d1: number, d2: number, curveIntersectionThreshold?: number): Shape[]; // 这会将曲线轮廓生成为一系列形状，而不是路径序列。每个形状都是一个对象
        intersects(curve: Bezier, curveIntersectionThreshold?: number): string[] | number[];// 查找此曲线与另一条曲线的交点。
        intersects(curve: Line): string[] | number[];// 查找此曲线与某条线的交点{p1: {x:... ,y:...}, p2: ... }。交点是t此曲线上的值的数组。
        lineIntersects(line: Line): number[];
        selfintersects(curveIntersectionThreshold?: number): string[];
        curveintersects(c1: Bezier[], c2: Bezier[], curveIntersectionThreshold?: number): string[];
        /**
         * 将贝塞尔曲线近似为一系列圆弧。可选的阈值参数控制圆弧需要达到何种程度的拟合才能被视为合理的近似值。阈值越高，圆弧拟合的精度越低。如果未设置明确的阈值，则使用threshold的值。0.5

此操作仅支持 2d（目前）。
         */
        arcs(errorThreshold?: number): Arc[];
        private _error(pc, np1, s, e);
        private _iterate(errorThreshold, circles);
    }
    class BezierCap extends Bezier {
        virtual: boolean;
    }

    interface utils {
        Tvalues: number[];
        Cvalues: number[];
        arcfn(t: number, derivativeFn: Function): number;
        between(v: number, m: number, M: number): boolean;
        approximately(a: number, b: number, precision?: number): boolean;
        length(derivativeFn: Function): number;
        map(v: number, ds: number, de: number, ts: number, te: number): number;
        lerp(r: number, v1: Point, v2: Point): Point;
        pointToString(p: Point): string;
        pointsToString(points: Point[]): string;
        copy(obj: Object): any;
        angle(o: Point, v1: Point, v2: Point): number;
        round(v: number, d: number): number;
        dist(p1: Point, p2: Point): number;
        closest(LUT: Point[], point: Point): Closest;
        abcratio(t: number, n: number): number;
        projectionratio(t: number, n: number): number;
        lli8(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): Point;
        lli4(p1: Point, p2: Point, p3: Point, p4: Point): Point;
        lli(v1: Offset, v2: Offset): Point;
        makeline(p1: Point, p2: Point): Bezier;
        findbbox(sections: Bezier[]): BBox;
        shapeintersections(
            s1: Shape,
            bbox1: BBox,
            s2: Shape,
            bbox2: BBox,
            curveIntersectionThreshold?: number,
        ): string[][] | number[][];
        makeshape(forward: Bezier, back: Bezier, curveIntersectionThreshold?: number): Shape;
        getminmax(curve: Bezier, d: string, list: number[]): MinMax;
        align(points: Point[], line: Line): Point[];
        roots(points: Point[], line: Line): number[];
        droots(p: number[]): number[];
        inflections(points: Point[]): number[];
        bboxoverlap(b1: BBox, b2: BBox): boolean;
        expandbox(bbox: BBox, _bbox: BBox): void;
        pairiteration(c1: Bezier, c2: Bezier, curveIntersectionThreshold?: number): string[];
        getccenter(p1: Point, p2: Point, p3: Point): Arc;
    }

    /**
     * Poly Bezier
     * @param {[type]} curves [description]
     */
    class PolyBezier {
        curves: Bezier[];
        private _3d;
        points: Point[];
        constructor(curves: Bezier[]);
        valueOf(): string;
        toString(): string;
        addCurve(curve: Bezier): void;
        length(): number;
        curve(idx: number): Bezier;
        bbox(): BBox;
        offset(d: number): PolyBezier;
    }
export {
    Bezier
}