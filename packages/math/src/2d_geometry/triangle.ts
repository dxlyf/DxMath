
// 三角形类声明

import { Vector2 } from "../math/vec2";


export class Triangle{
    static create(a:Vector2,b:Vector2,c:Vector2):Triangle{
        return new Triangle(a,b,c)
    }
    points:Vector2[]=[]
    constructor(a:Vector2,b:Vector2,c:Vector2){
        this.points=[a,b,c]
    }
    get a(){
        return this.points[0]
    }
    get b(){
        return this.points[1]
    }
    get c(){
        return this.points[2]
    }
    ySort(){
        this.points.sort((a,b)=>{
            return a.y-b.y
        })
        return this
    }
    // 分割成两个三角形
    split():Triangle[]{
        this.ySort()
        const a=this.a
        const b=this.b
        const c=this.c
        if(b.y>a.y&&b.y<c.y){
                // 分割点
                let x=a.x+(c.x-a.x)*(b.y-a.y)/(c.y-a.y)
                const d=Vector2.create(x,b.y)
                return [
                    Triangle.create(a,d,c),
                    Triangle.create(d,b,c)
                ]
        }else{
            return []
        }
    }
    perimeter(){
        let r=0
        for(let i=0,j=this.points.length-1;i<this.points.length;j=i++){
            let dx=this.points[i].x-this.points[j].x
            let dy=this.points[i].y-this.points[j].y
            r+=Math.sqrt(dx*dx+dy*dy)
        }
        return r
    }
    area(){
        Vector2.beginPools()
        const ab=Vector2.pool().subVectors(this.b,this.a)
        const ac=Vector2.pool().subVectors(this.c,this.a)
        Vector2.endPools()
        return 0.5*ab.cross(ac)
    }
    centroid(){
        Vector2.beginPools()
        const ab=Vector2.pool().subVectors(this.b,this.a)
        const ac=Vector2.pool().subVectors(this.c,this.a)
        ab.add(ac).multiplyScalar(0.5)
        ab.add(this.a)
        Vector2.endPools()
        return ab
    }
    /***            -B
     *           -  -
     *        -     -
     *    c -       - a
     *    -         -
        -           -
     * A-------------C
             b
      b=C-A
      c=B-A
      a=B-C

    */
    barycentric(p:Vector2):[number,number,number]{
        Vector2.beginPools()
        const ab=Vector2.pool().subVectors(this.b,this.a) // c边
        const ac=Vector2.pool().subVectors(this.c,this.a) // b
        const d=ac.cross(ab) // ac 在ab右边
        if(d===0){
            return [-1,-1,-1]
        }
        
        const pa=Vector2.pool().subVectors(this.a,p)
        const pb=Vector2.pool().subVectors(this.b,p)
        const pc=Vector2.pool().subVectors(this.c,p)
        Vector2.endPools()
        // 保证叉乘结果是正值，如果pb 叉乘pc >0,代表pb在右边
        const alpha = pc.cross(pb)/d // 计算角A的重心坐标
        const beta = pa.cross(pc)/d // 计算角B的重心坐标
        
        const gamma = 1 - alpha - beta;// 计算角C的重心坐标

        return [alpha,beta,gamma];
    }
    contains(p:Vector2):boolean{
        Vector2.beginPools() 
        let r=0
        for(let i=0,j=this.points.length-1;i<3;j=i++){
            const a=Vector2.pool().subVectors(this.points[i],this.points[j])
            const b=Vector2.pool().subVectors(p,this.points[j])
            // 都在一个方向
            if(a.cross(b)>0){
                r++
            }else{
                r--
            }
        }
        Vector2.endPools()
        return Math.abs(r)===3;
    }
    // 返回指定顶点的角平分线端点 [顶点, 分点]
    getAngleBisector(vertexIndex: number): [Vector2, Vector2] {
        const points = this.points;
        const a = points[vertexIndex];
        let oppositeEdgePoint1: Vector2, oppositeEdgePoint2: Vector2;

        // 确定对边的两个端点
        if (vertexIndex === 0) {         // 角A，对边BC
            oppositeEdgePoint1 = points[1];
            oppositeEdgePoint2 = points[2];
        } else if (vertexIndex === 1) {  // 角B，对边AC
            oppositeEdgePoint1 = points[0];
            oppositeEdgePoint2 = points[2];
        } else {                        // 角C，对边AB
            oppositeEdgePoint1 = points[0];
            oppositeEdgePoint2 = points[1];
        }

        // 计算邻边长度
        const len1 = a.distanceTo(oppositeEdgePoint1); // 如角A时是AB长度
        const len2 = a.distanceTo(oppositeEdgePoint2); // 如角A时是AC长度

        // 计算分点坐标 (len1 * oppositeEdgePoint2 + len2 * oppositeEdgePoint1) / (len1 + len2)
        const denominator = len1 + len2;
        if (denominator === 0) { // 防止除零
            return [a, a.clone()]; // 退化为点，返回顶点本身
        }
        const x = (len1 * oppositeEdgePoint2.x + len2 * oppositeEdgePoint1.x) / denominator;
        const y = (len1 * oppositeEdgePoint2.y + len2 * oppositeEdgePoint1.y) / denominator;
        const d = Vector2.create(x, y);

        return [a, d];
    }

    // 返回指定顶点的中线 [顶点, 对边中点]
    getMedian(vertexIndex: number): [Vector2, Vector2] {
        const a = this.points[vertexIndex];
        let p1: Vector2, p2: Vector2;

        if (vertexIndex === 0) {      // 对边BC
            p1 = this.points[1];
            p2 = this.points[2];
        } else if (vertexIndex === 1) { // 对边AC
            p1 = this.points[0];
            p2 = this.points[2];
        } else {                      // 对边AB
            p1 = this.points[0];
            p2 = this.points[1];
        }

        const midpoint = Vector2.create(
            (p1.x + p2.x) / 2,
            (p1.y + p2.y) / 2
        );
        return [a, midpoint];
    }

    // 内切圆中心（内心）
    incenter(): Vector2 {
        const a = this.b.distanceTo(this.c); // BC边长度
        const b = this.a.distanceTo(this.c); // AC边长度
        const c = this.a.distanceTo(this.b); // AB边长度
        const sum = a + b + c;

        if (sum === 0) { // 所有点重合
            return this.a.clone();
        }

        const ix = (a * this.a.x + b * this.b.x + c * this.c.x) / sum;
        const iy = (a * this.a.y + b * this.b.y + c * this.c.y) / sum;
        return Vector2.create(ix, iy);
    }

    // 内切圆半径
    inradius(): number {
        const area = Math.abs(this.area());
        const s = this.perimeter() / 2;
        return s !== 0 ? area / s : 0;
    }

    // 外切圆中心（外心），可能返回null（三点共线时）
    circumcenter(): Vector2 | null {
        const A = this.a;
        const B = this.b;
        const C = this.c;

        // 计算边AB的中垂线方程系数
        const midAB = Vector2.create((A.x + B.x)/2, (A.y + B.y)/2);
        const dx1 = B.x - A.x, dy1 = B.y - A.y;
        const eq1Rhs = dx1 * midAB.x + dy1 * midAB.y;

        // 计算边AC的中垂线方程系数
        const midAC = Vector2.create((A.x + C.x)/2, (A.y + C.y)/2);
        const dx2 = C.x - A.x, dy2 = C.y - A.y;
        const eq2Rhs = dx2 * midAC.x + dy2 * midAC.y;

        // 解线性方程组
        const D = dx1 * dy2 - dx2 * dy1;
        if (D === 0) return null; // 平行或共线

        const x = (eq1Rhs * dy2 - eq2Rhs * dy1) / D;
        const y = (dx1 * eq2Rhs - dx2 * eq1Rhs) / D;

        return Vector2.create(x, y);
    }

    // 外切圆半径，可能返回null（面积为零时）
    circumradius(): number | null {
        const a = this.b.distanceTo(this.c);
        const b = this.a.distanceTo(this.c);
        const c = this.a.distanceTo(this.b);
        const area = Math.abs(this.area());

        if (area === 0) return null;
        return (a * b * c) / (4 * area);
    }
}