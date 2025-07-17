import {Vector2} from './Vector2'

export class ObjectBoundingBox {
    public center: Vector2;
    public halfExtents: Vector2; // 半宽和半高
    public rotation: number;  // 旋转角度（弧度）

    constructor(center: Vector2, width: number, height: number, rotation: number = 0) {
        this.center = center;
        this.halfExtents = Vector2.create(width,height).mulScalar(0.5) as Vector2;
        this.rotation = rotation;
    }

    // 获取OBB的四个顶点（用于碰撞检测）
    getVertices(): Vector2[] {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const { x: cx, y: cy } = this.center;
        const { x: hw, y: hh } = this.halfExtents;

        return [
            // 右上
            { 
                x: cx + hw * cos - hh * sin,
                y: cy + hw * sin + hh * cos
            },
            // 左上
            { 
                x: cx - hw * cos - hh * sin,
                y: cy - hw * sin + hh * cos
            },
            // 左下
            { 
                x: cx - hw * cos + hh * sin,
                y: cy - hw * sin - hh * cos
            },
            // 右下
            { 
                x: cx + hw * cos + hh * sin,
                y: cy + hw * sin - hh * cos
            }
        ].map((d)=>Vector2.create(d.x,d.y) as Vector2);
    }

    // 分离轴定理（SAT）检测OBB与OBB碰撞
    intersects(other: ObjectBoundingBox): boolean {
        const axes = this.getAxes().concat(other.getAxes());
        const vertices1 = this.getVertices();
        const vertices2 = other.getVertices();

        for (const axis of axes) {
            const proj1 = this.projectVertices(vertices1, axis);
            const proj2 = this.projectVertices(vertices2, axis);

            if (proj1.max < proj2.min || proj2.max < proj1.min) {
                return false; // 分离轴存在，不相交
            }
        }
        return true; // 所有轴都重叠，相交
    }

    // 获取分离轴（OBB的边法线）
    private getAxes(): Vector2[] {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        return [
            { x: cos, y: sin },       // 本地X轴
            { x: -sin, y: cos }        // 本地Y轴
        ].map((d)=>Vector2.create(d.x,d.y) as Vector2);
    }

    // 投影顶点到轴上
    private projectVertices(vertices: Vector2[], axis: Vector2): { min: number; max: number } {
        let min = Infinity;
        let max = -Infinity;

        for (const vertex of vertices) {
            const proj = vertex.x * axis.x + vertex.y * axis.y; // 点积
            min = Math.min(min, proj);
            max = Math.max(max, proj);
        }

        return { min, max };
    }
}