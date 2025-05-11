// Cell 表示一个像素单元上的部分覆盖情况
export class Cell {
    x: number;
    y: number;
    cover: number = 0; // 纵向扫描线穿过的覆盖贡献（正负，方向有关）
    area: number = 0;  // 面积贡献（精确到子像素）
  
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
    }
  
    add(cover: number, area: number) {
      this.cover += cover;
      this.area += area;
    }
  
    clone(): Cell {
      const c = new Cell(this.x, this.y);
      c.cover = this.cover;
      c.area = this.area;
      return c;
    }
  }
  