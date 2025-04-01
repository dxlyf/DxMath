
import {int26_6,Point26_6,Int52_12,Point52_12, Int26_6} from './fixed'

// maxAbs returns the maximum of abs(a) and abs(b).
function maxAbs(a:int26_6, b:int26_6){
	if( a < 0) {
		a = -a
	}
	if(b < 0) {
		b = -b
	}
	if(a < b) {
		return b
	}
	return a
}
function pRot90CCW(p: Point26_6) {
	return Point26_6.from(p.y, -p.x)
}
// pRot90CW returns the vector p rotated clockwise by 90 degrees.
//
// Note that the Y-axis grows downwards, so {1, 0}.Rot90CW is {0, 1}.
function pRot90CW(p: Point26_6) {
	return Point26_6.from(-p.y, p.x)
}
function pRot45CW(p:Point26_6){
	// 181/256 is approximately 1/√2, or sin(π/4).
	let px=p.x, py=p.y
	let qx = (+px - py) * 181 / 256
	let qy = (+px + py) * 181 / 256
	return Point26_6.from(qx,qy)
}
function pRot45CCW(p:Point26_6) {
	// 181/256 is approximately 1/√2, or sin(π/4).
    let px=p.x, py=p.y
	let qx = (+px + py) * 181 / 256
	let qy = (-px + py) * 181 / 256
	return Point26_6.from(qx,qy)
}
function pNeg(p: Point26_6) {
	return Point26_6.from(-p.x, -p.y)
}
function pSub(a: Point26_6, b: Point26_6) {
	return Point26_6.from(a.x - b.x, a.y - b.y)
}
function pAdd(a: Point26_6, b: Point26_6) {
	return Point26_6.from(a.x + b.x, a.y + b.y)
}
function pDot(a: Point26_6, b: Point26_6) {
	return a.dot(b)
}

function pNorm(p: Point26_6, length: int26_6) {
	// 计算向量的长度
	const d = pLen(p);

	// 如果长度为 0，返回空点
	if (d === 0) {
		return Point26_6.from(0,0)
	}

	// 计算归一化后的坐标
	const s = length;
	const t = d;
	const x = (p.x * s) / t;
	const y = (p.y * s) / t;

	// 返回新的点对象
	return Point26_6.from(x,y)
}
function pRot135CCW(p:Point26_6) {
	// 181/256 is approximately 1/√2, or sin(π/4).
	let px=p.y, py=p.y
	let qx = (-px + py) * 181 / 256
	let qy = (-px - py) * 181 / 256
	return Point26_6.from(qx,qy)
}
function pRot135CW(p:Point26_6) {
	// 181/256 is approximately 1/√2, or sin(π/4).
	let px=p.y, py=p.y
	let qx = (-px - py) * 181 / 256
	let qy = (+px - py) * 181 / 256
	return Point26_6.from(qx,qy)
}

// 辅助函数：计算向量的长度
function pLen(p:Point26_6) {
	return Math.sqrt(p.x*p.x + p.y*p.y)>>0
}

// An Adder accumulates points on a curve.
export interface Adder{
	// Start starts a new curve at the given point.
	Start(a:Point26_6):void
	// Add1 adds a linear segment to the current curve.
	Add1(b:Point26_6):void
	// Add2 adds a quadratic segment to the current curve.
	Add2(b:Point26_6, c:Point26_6):void
	// Add3 adds a cubic segment to the current curve.
	Add3(b:Point26_6, c:Point26_6, d:Point26_6):void
}
export class Path {
  
    points:int26_6[]=[]
    constructor() {
        this.points = [];
    }
    get length(){
        return this.points.length
    }
    toString() {
        let s = "";
        for (let i = 0; i < this.points.length;) {
            if (i !== 0) {
                s += " ";
            }
            switch (this.points[i]) {
                case 0:
                    s += `S0[${this.points[i + 1]}, ${this.points[i + 2]}]`;
                    i += 4;
                    break;
                case 1:
                    s += `A1[${this.points[i + 1]}, ${this.points[i + 2]}]`;
                    i += 4;
                    break;
                case 2:
                    s += `A2[${this.points[i + 1]}, ${this.points[i + 2]}, ${this.points[i + 3]}, ${this.points[i + 4]}]`;
                    i += 6;
                    break;
                case 3:
                    s += `A3[${this.points[i + 1]}, ${this.points[i + 2]}, ${this.points[i + 3]}, ${this.points[i + 4]}, ${this.points[i + 5]}, ${this.points[i + 6]}]`;
                    i += 8;
                    break;
                default:
                    throw new Error("freetype/raster: bad path");
            }
        }
        return s;
    }

    clear() {
        this.points = [];
    }

    Start(a:Point26_6) {
        this.points.push(0, a.x, a.y, 0);
    }

    Add1(b:Point26_6) {
        this.points.push(1, b.x, b.y, 1);
    }

    Add2(b:Point26_6, c:Point26_6) {
        this.points.push(2, b.x, b.y, c.x, c.y, 2);
    }

    Add3(b:Point26_6, c:Point26_6, d:Point26_6) {
        this.points.push(3, b.x, b.y, c.x, c.y, d.x, d.y, 3);
    }

    AddPath(q:Path) {
        this.points.push(...q.points);
    }

    AddStroke(q, width, cr, jr) {
        // Stroke 方法的实现
        // 这里可以根据需要实现
    }

    firstPoint() {
        return Point26_6.from(this.points[1], this.points[2]);
    }

    lastPoint() {
        return Point26_6.from(this.points[this.points.length - 3], this.points[this.points.length - 2]);
    }

  
    slice(start:number, end?:number) {
        let p = new Path();
        p.points = this.points.slice(start, end);
        return p;
    }

}



 function AddPathReversed(p:Adder,q:Path) {
    if (q.points.length === 0) return;

    let i = q.points.length - 1;
    while (true) {
        switch (q.points[i]) {
            case 0:
                return;
            case 1:
                i -= 4;
                p.Add1(Point26_6.from(q.points[i - 2], q.points[i - 1]));
                break;
            case 2:
                i -= 6;
                p.Add2(Point26_6.from(q.points[i + 2], q.points[i + 3]), Point26_6.from(q.points[i - 2], q.points[i - 1]));
                break;
            case 3:
                i -= 8;
                p.Add3(Point26_6.from(q.points[i + 4], q.points[i + 5]), Point26_6.from(q.points[i + 2], q.points[i + 3]), Point.from(q.points[i - 2], q.points[i - 1]));
                break;
            default:
                throw new Error("freetype/raster: bad path");
        }
    }
}
export {
    maxAbs,
    pAdd,
    pDot,
    pLen,
    pNeg,
    pNorm,
    pRot90CCW,
    pRot90CW,
    pRot45CW,
    pRot45CCW,
    pRot135CCW,
    pRot135CW,
    pSub,
    AddPathReversed
}