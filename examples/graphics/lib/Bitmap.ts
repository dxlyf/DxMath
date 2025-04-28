// Bitmap.ts
export class Bitmap {
    width: number;
    height: number;
    data: Uint8ClampedArray;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
    }

    setPixel(x: number, y: number, r: number, g: number, b: number, a: number = 255) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
        const idx = (y * this.width + x) * 4;
        this.data[idx + 0] = r;
        this.data[idx + 1] = g;
        this.data[idx + 2] = b;
        this.data[idx + 3] = a;
    }
}
