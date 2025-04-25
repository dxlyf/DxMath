type MatrixNData = Float32Array | number[];

// 行主序的矩阵类
export class MatrixN {
    readonly n: number;
    readonly elements: Float32Array;
    private static readonly EPSILON = 1e-6;

    constructor(n: number, elements?: MatrixNData) {
        this.n = n;
        const size = n * n;
        this.elements = elements ?
            (elements instanceof Float32Array ? elements : new Float32Array(elements)) :
            new Float32Array(size);
    }

    // 静态方法：生成单位矩阵
    static identity(n: number): MatrixN {
        const elements = new Float32Array(n * n);
        for (let i = 0; i < n; i++) elements[i * n + i] = 1;
        return new MatrixN(n, elements);
    }

    // 矩阵乘法
    multiply(other: MatrixN): MatrixN {
        if (this.n !== other.n) throw new Error("MatrixN dimensions must match");
        const result = new Float32Array(this.n * this.n);
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.n; j++) {
                let sum = 0;
                for (let k = 0; k < this.n; k++) {
                    sum += this.get(i, k) * other.get(k, j);
                }
                result[i * this.n + j] = sum;
            }
        }
        return new MatrixN(this.n, result);
    }

    // 转置矩阵
    transpose(): MatrixN {
        const result = new Float32Array(this.n * this.n);
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.n; j++) {
                result[j * this.n + i] = this.get(i, j);
            }
        }
        return new MatrixN(this.n, result);
    }

    // 行列式计算（递归实现）
    determinant(): number {
        if (this.n === 1) return this.get(0, 0);
        if (this.n === 2) {
            return this.get(0, 0) * this.get(1, 1) - this.get(0, 1) * this.get(1, 0);
        }

        let det = 0;
        for (let j = 0; j < this.n; j++) {
            det += this.get(0, j) * this.cofactor(0, j).determinant() * (j % 2 === 0 ? 1 : -1);
        }
        return det;
    }

    // 余因子矩阵
    adjoint(): MatrixN {
        const cofactors = new Float32Array(this.n * this.n);
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.n; j++) {
                cofactors[j * this.n + i] = this.cofactor(i, j).determinant() * ((i + j) % 2 === 0 ? 1 : -1);
            }
        }
        return new MatrixN(this.n, cofactors);
    }

    // 通过行列式求逆（伴随矩阵法）
    invertByDeterminant(): MatrixN {
        const det = this.determinant();
        if (Math.abs(det) < MatrixN.EPSILON) throw new Error("MatrixN is singular");
        return this.adjoint().multiply(new MatrixN(this.n, [1 / det]));
    }

    // 通过初等行变换求逆（高斯-约旦消元法）
    invertByRowOperations(): MatrixN {
        const augmented = this.createAugmentedMatrixN();
        const n = this.n;

        for (let i = 0; i < n; i++) {
            // 寻找主元
            let pivot = i;
            for (let j = i; j < n; j++) {
                if (Math.abs(augmented.get(j, i)) > Math.abs(augmented.get(pivot, i))) {
                    pivot = j;
                }
            }

            if (Math.abs(augmented.get(pivot, i)) < MatrixN.EPSILON) {
                throw new Error("MatrixN is singular");
            }

            // 交换行
            if (pivot !== i) augmented.swapRows(i, pivot);

            // 归一化主元行
            const scale = 1 / augmented.get(i, i);
            augmented.scaleRow(i, scale);

            // 消元其他行
            for (let j = 0; j < n; j++) {
                if (j !== i) {
                    const factor = -augmented.get(j, i);
                    augmented.addRow(j, i, factor);
                }
            }
        }

        // 提取逆矩阵部分
        const inverseElements = new Float32Array(n * n);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                inverseElements[i * n + j] = augmented.get(i, j + n);
            }
        }
        return new MatrixN(n, inverseElements);
    }

    // 秩的计算（高斯消元法）
    rank(): number {
        const matrix = this.clone();
        let rank = 0;
        let row = 0;

        for (let col = 0; col < this.n; col++) {
            let pivot = row;
            for (let i = row; i < this.n; i++) {
                if (Math.abs(matrix.get(i, col)) > Math.abs(matrix.get(pivot, col))) {
                    pivot = i;
                }
            }

            if (Math.abs(matrix.get(pivot, col)) < MatrixN.EPSILON) continue;

            matrix.swapRows(row, pivot);
            rank++;

            for (let i = row + 1; i < this.n; i++) {
                const factor = matrix.get(i, col) / matrix.get(row, col);
                matrix.addRow(i, row, -factor);
            }

            row++;
        }
        return rank;
    }

    // 辅助方法：获取元素
    private get(row: number, col: number): number {
        return this.elements[row * this.n + col];
    }

    // 辅助方法：创建增广矩阵 [I | A]
    private createAugmentedMatrixN(): MatrixN {
        const n = this.n;
        const augmented = new Float32Array(n * 2 * n);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                augmented[i * 2 * n + j] = this.get(i, j);
            }
            augmented[i * 2 * n + (i + n)] = 1;
        }
        return new MatrixN(n * 2, augmented);
    }

    // 辅助方法：交换两行
    private swapRows(row1: number, row2: number): void {
        const temp = new Float32Array(this.n);
        for (let j = 0; j < this.n; j++) {
            temp[j] = this.get(row1, j);
            this.set(row1, j, this.get(row2, j));
        }
        for (let j = 0; j < this.n; j++) {
            this.set(row2, j, temp[j]);
        }
    }

    // 辅助方法：缩放某一行
    private scaleRow(row: number, scalar: number): void {
        for (let j = 0; j < this.n; j++) {
            this.set(row, j, this.get(row, j) * scalar);
        }
    }

    // 辅助方法：将某行的倍数加到另一行
    private addRow(targetRow: number, sourceRow: number, scalar: number): void {
        for (let j = 0; j < this.n; j++) {
            this.set(targetRow, j, this.get(targetRow, j) + this.get(sourceRow, j) * scalar);
        }
    }

    // 辅助方法：设置元素值
    private set(row: number, col: number, value: number): void {
        this.elements[row * this.n + col] = value;
    }

    // 其他辅助方法（省略部分实现）...
    private cofactor(row: number, col: number): MatrixN {
        const subSize = this.n - 1;
        const subElements = new Float32Array(subSize * subSize);
        let index = 0;

        for (let i = 0; i < this.n; i++) {
            if (i === row) continue; // 跳过当前行
            for (let j = 0; j < this.n; j++) {
                if (j === col) continue; // 跳过当前列
                subElements[index++] = this.get(i, j);
            }
        }

        return new MatrixN(subSize, subElements);
    }

    private clone(): MatrixN {
        return new MatrixN(this.n, new Float32Array(this.elements));
    }
}