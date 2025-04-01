// fixed.ts - 26.6 和 52.12 定点数类型实现

class Int26_6 {
    constructor(public readonly value: number) {}

    static I(i: number): Int26_6 {
        return new Int26_6(i * 64); // i << 6
    }

    toString(): string {
        const shift = 6, mask = 0x3f;
        let x = this.value;
        
        if (x >= 0) {
            return `${(x >> shift)}:${(x & mask).toString().padStart(2, '0')}`;
        }
        
        x = -x;
        if (x >= 0) {
            return `-${(x >> shift)}:${(x & mask).toString().padStart(2, '0')}`;
        }
        return "-33554432:00";
    }

    Floor(): number { return (this.value + 0x00) >> 6; }
    Round(): number { return (this.value + 0x20) >> 6; }
    Ceil(): number { return (this.value + 0x3f) >> 6; }

    Mul(y: Int26_6): Int26_6 {
        const product = this.value * y.value;
        return new Int26_6(Math.round(product / 64));
    }
}

class Int52_12 {
    constructor(public readonly value: bigint) {}

    toString(): string {
        const shift = 12, mask = 0xfffn;
        let x = this.value;
        
        if (x >= 0n) {
            return `${(x >> BigInt(shift))}:${(x & mask).toString().padStart(4, '0')}`;
        }
        
        x = -x;
        if (x >= 0n) {
            return `-${(x >> BigInt(shift))}:${(x & mask).toString().padStart(4, '0')}`;
        }
        return "-2251799813685248:0000";
    }

    Floor(): number { return Number((this.value + 0x000n) >> 12n); }
    Round(): number { return Number((this.value + 0x800n) >> 12n); }
    Ceil(): number { return Number((this.value + 0xfffn) >> 12n); }

    Mul(y: Int52_12): Int52_12 {
        const product = this.value * y.value;
        return new Int52_12((product + (1n << 11n)) >> 12n);
    }
}

// Point 和 Rectangle 类型实现
class Point26_6 {
    constructor(public X: Int26_6, public Y: Int26_6) {}

    static P(x: number, y: number): Point26_6 {
        return new Point26_6(Int26_6.I(x), Int26_6.I(y));
    }

    Add(q: Point26_6): Point26_6 {
        return new Point26_6(new Int26_6(this.X.value + q.X.value), new Int26_6(this.Y.value + q.Y.value));
    }

    Sub(q: Point26_6): Point26_6 {
        return new Point26_6(new Int26_6(this.X.value - q.X.value), new Int26_6(this.Y.value - q.Y.value));
    }

    Mul(k: Int26_6): Point26_6 {
        return new Point26_6(new Int26_6((this.X.value * k.value) / 64), new Int26_6((this.Y.value * k.value) / 64));
    }

    Div(k: Int26_6): Point26_6 {
        return new Point26_6(new Int26_6((this.X.value * 64) / k.value), new Int26_6((this.Y.value * 64) / k.value));
    }
}

class Rectangle26_6 {
    constructor(public Min: Point26_6, public Max: Point26_6) {}

    static R(minX: number, minY: number, maxX: number, maxY: number): Rectangle26_6 {
        [minX, maxX] = minX > maxX ? [maxX, minX] : [minX, maxX];
        [minY, maxY] = minY > maxY ? [maxY, minY] : [minY, maxY];
        return new Rectangle26_6(
            Point26_6.P(minX, minY),
            Point26_6.P(maxX, maxY)
        );
    }

    Empty(): boolean {
        return this.Min.X.value >= this.Max.X.value || this.Min.Y.value >= this.Max.Y.value;
    }

    Intersect(s: Rectangle26_6): Rectangle26_6 {
        let r = new Rectangle26_6(
            new Point26_6(
                new Int26_6(Math.max(this.Min.X.value, s.Min.X.value)),
                new Int26_6(Math.max(this.Min.Y.value, s.Min.Y.value))
            ),
            new Point26_6(
                new Int26_6(Math.min(this.Max.X.value, s.Max.X.value)),
                new Int26_6(Math.min(this.Max.Y.value, s.Max.Y.value))
            )
        );
        return r.Empty() ? new Rectangle26_6(new Point26_6(new Int26_6(0), new Point26_6(new Int26_6(0))) : r;
    }
}

// 类似实现 Point52_12 和 Rectangle52_12...
// (实现模式与 26.6 系列类似，使用 bigint 处理更大范围)

// 使用示例
const p1 = Point26_6.P(2, -3);
console.log(p1.X.toString()); // "128:00"
console.log(p1.Y.toString()); // "-192:00"

const rect = Rectangle26_6.R(0, 1, 2, 3);
console.log(rect.Max.Y.Round()); // 3