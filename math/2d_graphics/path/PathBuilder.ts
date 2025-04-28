
export enum PathVerb {
    MOVE_TO = "M", // 移动到指定的点，不绘制
    LINE_TO = "L", // 绘制直线到指定的点
    CUBIC_BEZIER_TO = "C", // 绘制三次贝塞尔曲线到指定的点
    QUADRATIC_BEZIER_TO = "Q", // 绘制二次贝塞尔曲线到指定的点
    CLOSE_PATH = "Z", // 关闭路径，绘制直线到起始点 
}
export class PathBuilder {
    public points: number[] = []; // 存储路径的字符串
    public verbs: PathVerb[] = []; // 存储路径的字符串
    private needInjectMove = true;
    private get lastVerb() { // 获取最后一个点的坐标
        const length = this.verbs.length; // 获取路径的长度
        return this.verbs[length - 1]; // 返回最后一个点的坐标
    }
    private get size(){
        return this.verbs.length
    }
    private injectMove() {
        if (this.needInjectMove) {
            if (this.size===0) { // 如果路径为空，不绘制
                this.moveTo(0,0)
            }else{
                this.moveTo(this.points[this.points.length-2],this.points[this.points.length-1])
            }
        }
    }
    moveTo(x: number, y: number) { // 移动到指定的点，不绘制
        if (this.lastVerb === PathVerb.MOVE_TO) { // 如果最后一个点是移动到指定的点，不绘制
            const len=this.points.length
            this.points[len-2] = x; // 更新最后一个点的坐标
            this.points[len-1] = y; // 更新最后一个点的坐标
        } else {
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
        this.points.push(cx1, cy1, cx2, cy2, x, y );
        this.verbs.push(PathVerb.CUBIC_BEZIER_TO);
        return this;
    }
    closePath() { 
        if(this.size>0){
            if(this.lastVerb!==PathVerb.CLOSE_PATH){ 
                this.verbs.push(PathVerb.CLOSE_PATH);  
            }
            this.needInjectMove = true; 
        }
        return this; // 返回自身，方便链式调用
    }
}