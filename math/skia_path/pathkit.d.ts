
export interface StrokeOptions{
    width?:number,
    join?:PathKit.StrokeJoin
    cap?:PathKit.StrokeCap
    miter_limit?:number
}
declare namespace PathKit{
     function onRuntimeInitialized():void
    // 这些仅适用于PathKit.FromCmds()。
     const MOVE_VERB=0
     const LINE_VERB=1
     const QUAD_VERB=2
     const CONIC_VERB=3
     const CUBIC_VERB=4
     const CLOSE_VERB=5

     // 这些用于PathKit.MakeFromOp()和SkPath.op()
     enum PathOp {
        DIFFERENCE,
        INTERSECT,
        REVERSE_DIFFERENCE,
        UNION,
        XOR
    }
    enum FillType{
        WINDING,// 非零
        EVENODD,// 奇偶
        INVERSE_WINDING,// 填充外部
        INVERSE_EVENODD
    }
    enum StrokeJoin{
        MITER,
        ROUND,
        BEVEL
    }
    enum StrokeCap{
        BUTT,
        ROUND,
        SQUARE
    }
    class SkPath{
        /**
         * 添加给定的路径this然后返回this以用于链接目的
         * @param otherPath 附加到此路径的路径
         */
        addPath(otherPath:SkPath):this
        addPath(otherPath:SkPath, transform: SVGMatrix):this
        addPath(otherPath:SkPath, a:number, b:number, c:number, d:number, e:number, f:number):this
        /**
         // add box un-transformed (i.e. at 0, 0)
moreBoxes.addPath(box)
// add box 300 points to the right
         .addPath(box, 1, 0, 0,
                       0, 1, 300,
                       0, 0 ,1)
// add a box shrunk by 50% in both directions
         .addPath(box, 0.5, 0,   0,
                       0,   0.5, 0,
                       0,   0,   1)
         */
        addPath(otherPath:SkPath, scaleX:number, skewX:number, transX:number, skewY:number, scaleY:number, transY:number, pers0:number, pers1:number, pers2:number):this
        contains(x:number,y:number):boolean
        /**
         * 添加所描述的弧，this然后返回this以进行链接。 有关更多详细信息，请参阅Path2D.arc() 。
         * @param x 圆弧中心的坐标。
         * @param y 
         * @param radius 圆弧的半径。
         * @param startAngle 角度的起点和终点，从 x 轴正方向顺时针测量，以弧度为单位。
         * @param endAngle 
         * @param ccw 可选参数，指定圆弧是否应在startAngle和endAngleBoolean之间逆时针绘制 ，而不是默认的顺时针绘制。
         */
        arc(x:number, y:number, radius:number, startAngle:number, endAngle:number, ccw:boolean):this
        /**
         * 将描述的弧添加到this（如果需要，则添加一条线）然后返回 this以进行链接。 有关更多详细信息，请参阅Path2D.arcTo() 。
         * @param x1 定义控制点的坐标。
         * @param y1 
         * @param x2 
         * @param y2 
         * @param radius 
         */
        arcTo(x1:number, y1:number, x2:number, y2:number, radius:number):this
        //将笔返回到当前子路径的开头，然后返回this以进行链接。 有关更多详细信息，请参阅Path2D.closePath() 
        close():this 
        closePath():this
        //返回SkRect表示路径的最小和最大面积的this。有关更多详细信息，请参阅 SkPath 参考 。
        computeTightBounds():SkRect
        /**
         * 将描述的圆锥线添加到this（如果需要，则添加一条线）然后返回this以进行链接。 有关更多详细信息，请参阅SkPath 参考。
         * @param x1 定义控制点和终点的坐标
         * @param y1 
         * @param x2 
         * @param y2 
         * @param w 圆锥曲线的权重。
         */
        conicTo(x1:number, y1:number, x2:number, y2:number, w:number):this
        copy():this

        /**
         * 将描述的立方线添加到this（如果需要，则添加一条线）然后返回this以进行链接。 有关更多详细信息，请参阅Path2D.bezierCurveTo 。
         * @param cp1x 
         * @param cp1y 
         * @param cp2x 
         * @param cp2y 
         * @param x 
         * @param y 
         */
        cubicTo(cp1x:number, cp1y:number, cp2x:number, cp2y:number, x:number, y:number):this
        bezierCurveTo(cp1x:number, cp1y:number, cp2x:number, cp2y:number, x:number, y:number):this
        /**
         * 应用虚线路径效果，this然后返回this以进行链接。请参阅上面的“虚线”效果的视觉示例。
         * @param on 虚线长度
         * @param off  空白长度
         * @param phase 偏移
         */
        dash(on:number, off:number, phase:number):this
        /**
         * 添加所描述的椭圆，this然后返回this以用于链接目的。 有关更多详细信息，请参阅Path2D.ellipse 。
         * @param x 椭圆中心的坐标。
         * @param y 
         * @param radiusX X 和 Y 方向的半径。
         * @param radiusY 
         * @param rotation 椭圆的旋转角度（以弧度为单位
         * @param startAngle 绘制的起始角度和终止角度，以弧度为单位从 x 轴正方向测量。
         * @param endAngle 
         * @param ccw 可选参数，指定椭圆是否应在startAngle和endAngleBoolean之间逆时针绘制，而不是默认的顺时针绘制。
         */
        ellipse(x:number, y:number, radiusX:number, radiusY:number, rotation:number, startAngle:number, endAngle:number, ccw:boolean):this
   
        equals(otherPath:SkPath):boolean

        /**
         * 返回SkRect表示路径的最小和最大面积的this。有关更多详细信息，请参阅 SkPath 参考 。
         */
        getBounds():SkRect
        getFillType():FillType
        //值为“nonzero”或“evenodd”。
        getFillTypeString():"nonzero"|"evenodd"
        /**
         * 将笔（不进行绘制）移动到给定的坐标，然后返回this以进行链接。 有关更多详细信息，请参阅Path2D.moveTo 
         * @param x 
         * @param y 
         */
        moveTo(x:number, y:number):this
        /**
         * 绘制一条直线到给定的坐标，然后返回this以进行链接。 有关更多详细信息，请参阅
         * @param x 笔应该移动到的位置的坐标。
         * @param y 
         */
        lineTo(x:number, y:number):this
        /**
         * 
         * @param otherPath 要与之合并的另一条路径this。operation - ，要应用于两条路径的操作
         * @param operation 
         */
        op(otherPath:SkPath, operation:PathOp):this

        //使用给定的坐标绘制二次贝塞尔曲线，然后返回this 以进行链接。 有关更多详细信息，请参阅Path2D.quadraticCurveTo 。
        quadTo(cpx:number, cpy:number, x:number, y:number):this
        quadraticCurveTo(cpx:number, cpy:number, x:number, y:number):this

        rect(x:number, y:number, w:number, h:number):this
        /**
         * 设置路径的填充类型。有关更多详细信息，请参阅 SkPath 参考 
         * @param fillType 
         */
        setFillType(fillType:FillType):this
        /**
         * 将路径设置this为一组不重叠的轮廓，描述与原始路径相同的区域。请参阅上面的“简化”效果的视觉示例
         */
        simplify():this

        stroke(strokeOpts:StrokeOptions):this

        toCanvas(ctx:CanvasRenderingContext2D):this
        //返回动词和参数的二维数组。查看PathKit.FromCmds()更多详细信息。
        toCmds():SkPath
        /**
         * 返回一个 与路径具有相同操作的Path2Dthis对象。
         * @example
         * let box = PathKit.NewPath().rect(0, 0, 100, 100);
let ctx = document.getElementById('canvas1').getContext('2d');
ctx.strokeStyle = 'green';
ctx.stroke(box.toPath2D());
toSVGString()
         */
        toPath2D():Path2D
        /**
         * 返回基于路径的SVGPathString表示
         */
        toSVGString():string
        /**
            应用指定的 转换this然后返回以 用于this链接目的
         * @param matr 仿射变换矩阵的九个数字之一。
            @example
            let path = PathKit.NewPath().rect(0, 0, 100, 100);
            // scale up the path by 5x
            path.transform([5, 0, 0,
                            0, 5, 0,
                            0, 0, 1]);
            // move the path 75 px to the right.
            path.transform(1, 0, 75,
                        0, 1, 0,
                        0, 0, 1)
         */
        transform(matr:SkMatrix):this
        transform(scaleX:number, skewX:number, transX:number, skewY:number, scaleY:number, transY:number, pers0:number, pers1:number, pers2:number):this
        /**
        将路径设置this为原始路径的子集，然后返回this以进行链接。请参阅上面的“修剪”效果的视觉示例。
         * @param startT [0, 1] 之间的值，表示要绘制的路径的开始和停止“百分比”
         * @param stopT 
         * @param isComplement 是否应该绘制修剪部分的补集，而不是 startT和stopT之间的区域。
         */
        trim(startT:number, stopT:number, isComplement:boolean):this
    }
    type SkMatrix=number[]
    class SkOpBuilder {
        /**

         * @param path h要与给定规则组合的路径。
         * @param operation 要应用于两个路径的操作。
         */
        add(path:SkPath, operation:PathOp):void
        make():SkPath
        resolve():SkPath
    }
    class SkRect{
        fLeft:number
        fTop:number
        fRight:number
        fBottom:number
    }
    class StrokeOpts {
        width:number
        miter_limit:number // 斜接限制。默认为 4。 有关更多详细信息，请参阅SkPaint 参考。
        join:StrokeJoin// =StrokeJoin.MITER
        cap:StrokeCap //=StrokeCap.BUTT
    }
    /**
     * 
     * @param str 代表 SVGPath
     * @returns  返回SkPath具有与 SVG 字符串相同的动词和参数，或者 null返回失败。 
     * @example
     * let path = PathKit.FromSVGString('M150 0 L75 200 L225 200 Z');
     */
    function FromSVGString(str:string):SkPath
    /**
     *  
     * @param cmds 一个二维命令数组，其中命令是一个动词，后跟其参数。
        返回SkPath带有列表中的动词和参数的动词或null失败的动词。
        这比多次调用.moveTo()、等要快得多。.lineTo()
        @example 
        let cmds = [
            [PathKit.MOVE_VERB, 0, 10],
            [PathKit.LINE_VERB, 30, 40],
            [PathKit.QUAD_VERB, 20, 50, 45, 60],
        ];
        let path = PathKit.FromCmds(cmds);
     */
    function FromCmds(cmds:Array<Array<Number>>):SkPath
    function NewPath():SkPath
    function NewPath(pathToCopy:SkPath):SkPath
    /**
     * 返回SkPath将给定的 PathOp 应用于第一和第二条路径（顺序很重要）的结果。
     * @param pathOne 
     * @param pathTwo 
     * @param op 
     * @example
     * let pathOne = PathKit.NewPath().moveTo(0, 20).lineTo(10, 10).lineTo(20, 20).close();
        let pathTwo = PathKit.NewPath().moveTo(10, 20).lineTo(20, 10).lineTo(30, 20).close();
        let mountains = PathKit.MakeFromOp(pathOne, pathTwo, PathKit.PathOp.UNION);
     */
    function MakeFromOp(pathOne:SkPath, pathTwo:SkPath, op:PathOp):SkPath

    /**
     * 控制点的坐标。X - ，要查找其对应 Y 坐标的 X 坐标
     * 快速评估三次缓入/缓出曲线。这被定义为单位正方形内的参数三次曲线。做出以下假设：
     * @param cpx1 
     * @param cpy1 
     * @param cpx2 
     * @param cpy2 
     * @param X 
     */
    function cubicYFromX(cpx1:number, cpy1:number, cpx2:number, cpy2:number, X:number):number
    /**
     * 这将以长度为 2 的数组形式返回给定 T 值的 (X, Y) 坐标
     * @param cpx1 
     * @param cpy1 
     * @param cpx2 
     * @param cpy2 
     * @param T 
     */
    function cubicPtFromT(cpx1:number, cpy1:number, cpx2:number, cpy2:number, T:number):[number,number]

    //仅供测试的功能
    function LTRBRect(left:number, top:number, right:number, bottom:number):SkRect
    // 将所有动词和参数打印到控制台。仅适用于调试和测试版本。
    function dump():void
}

export default  function PathKitInit(options:{locateFile:(file:string)=>string}):Promise<typeof PathKit>

