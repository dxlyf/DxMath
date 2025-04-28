export class Transform {
    private _x: number = 0;
    private _y: number = 0;
    private _scaleX: number = 1;
    private _scaleY: number = 1;
    private _rotation: number = 0;
    private _originX: number = 0;
    private _originY: number = 0;
    private _skewX: number = 0;
    private _skewY: number = 0;
    private _matrix: number[] = [1, 0, 0, 1, 0, 0]; // 本地矩阵
    private _dirty: boolean = true; // 本地矩阵脏标记
    private _parent: Transform | null = null; // 父节点
    private _worldMatrix: number[] = [1, 0, 0, 1, 0, 0]; // 世界矩阵
    private _worldMatrixDirty: boolean = true; // 世界矩阵脏标记

    /**
     * 更新本地矩阵
     */
    private updateLocalMatrix() {
        if (!this._dirty) return;

        const cos = Math.cos(this._rotation);
        const sin = Math.sin(this._rotation);
        const skewX = Math.tan(this._skewX);
        const skewY = Math.tan(this._skewY);

        // 应用原点偏移
        const tx = this._x - this._originX * this._scaleX;
        const ty = this._y - this._originY * this._scaleY;

        // 计算变换矩阵
        this._matrix[0] = this._scaleX * (cos - skewY * sin);
        this._matrix[1] = this._scaleX * (sin + skewY * cos);
        this._matrix[3] = this._scaleY * (-sin - skewX * cos);
        this._matrix[4] = this._scaleY * (cos - skewX * sin);
        this._matrix[2] = tx;
        this._matrix[5] = ty;

        this._dirty = false;
        this._worldMatrixDirty = true;
    }

    /**
     * 更新世界矩阵
     */
    private updateWorldMatrix() {
        if (!this._worldMatrixDirty) return;

        this.updateLocalMatrix();

        if (this._parent) {
            this._parent.updateWorldMatrix();
            const parentMatrix = this._parent.getWorldMatrix();
            const localMatrix = this._matrix;
            // 矩阵乘法
            this._worldMatrix[0] = localMatrix[0] * parentMatrix[0] + localMatrix[3] * parentMatrix[1];
            this._worldMatrix[1] = localMatrix[1] * parentMatrix[0] + localMatrix[4] * parentMatrix[1];
            this._worldMatrix[3] = localMatrix[0] * parentMatrix[3] + localMatrix[3] * parentMatrix[4];
            this._worldMatrix[4] = localMatrix[1] * parentMatrix[3] + localMatrix[4] * parentMatrix[4];
            this._worldMatrix[2] = localMatrix[0] * parentMatrix[2] + localMatrix[3] * parentMatrix[5] + localMatrix[2];
            this._worldMatrix[5] = localMatrix[1] * parentMatrix[2] + localMatrix[4] * parentMatrix[5] + localMatrix[5];
        } else {
            // 没有父节点，世界矩阵等于本地矩阵
            this._worldMatrix[0] = this._matrix[0];
            this._worldMatrix[1] = this._matrix[1];
            this._worldMatrix[2] = this._matrix[2];
            this._worldMatrix[3] = this._matrix[3];
            this._worldMatrix[4] = this._matrix[4];
            this._worldMatrix[5] = this._matrix[5];
        }

        this._worldMatrixDirty = false;
        // 标记子节点世界矩阵需要更新
        for (const child of this._children) {
            child._worldMatrixDirty = true;
        }
    }

    /**
     * 设置父节点
     * @param parent 父节点
     */
    setParent(parent: Transform | null) {
        this._parent = parent;
        this._worldMatrixDirty = true;
    }

    /**
     * 获取本地矩阵
     * @returns 本地矩阵
     */
    getLocalMatrix(): number[] {
        this.updateLocalMatrix();
        return this._matrix;
    }

    /**
     * 获取世界矩阵
     * @returns 世界矩阵
     */
    getWorldMatrix(): number[] {
        this.updateWorldMatrix();
        return this._worldMatrix;
    }

    /**
     * 设置x坐标
     * @param x x坐标
     */
    set x(x: number) {
        this._x = x;
        this._dirty = true;
    }

    /**
     * 获取x坐标
     * @returns x坐标
     */
    get x(): number {
        return this._x;
    }

    /**
     * 设置y坐标
     * @param y y坐标
     */
    set y(y: number) {
        this._y = y;
        this._dirty = true;
    }

    /**
     * 获取y坐标
     * @returns y坐标
     */
    get y(): number {
        return this._y;
    }

    /**
     * 设置x轴缩放
     * @param scaleX x轴缩放比例
     */
    set scaleX(scaleX: number) {
        this._scaleX = scaleX;
        this._dirty = true;
    }

    /**
     * 获取x轴缩放
     * @returns x轴缩放比例
     */
    get scaleX(): number {
        return this._scaleX;
    }

    /**
     * 设置y轴缩放
     * @param scaleY y轴缩放比例
     */
    set scaleY(scaleY: number) {
        this._scaleY = scaleY;
        this._dirty = true;
    }

    /**
     * 获取y轴缩放
     * @returns y轴缩放比例
     */
    get scaleY(): number {
        return this._scaleY;
    }

    /**
     * 设置旋转角度
     * @param rotation 旋转角度（弧度）
     */
    set rotation(rotation: number) {
        this._rotation = rotation;
        this._dirty = true;
    }

    /**
     * 获取旋转角度
     * @returns 旋转角度（弧度）
     */
    get rotation(): number {
        return this._rotation;
    }

    /**
     * 设置原点x坐标
     * @param originX 原点x坐标
     */
    set originX(originX: number) {
        this._originX = originX;
        this._dirty = true;
    }

    /**
     * 获取原点x坐标
     * @returns 原点x坐标
     */
    get originX(): number {
        return this._originX;
    }

    /**
     * 设置原点y坐标
     * @param originY 原点y坐标
     */
    set originY(originY: number) {
        this._originY = originY;
        this._dirty = true;
    }

    /**
     * 获取原点y坐标
     * @returns 原点y坐标
     */
    get originY(): number {
        return this._originY;
    }

    /**
     * 设置x轴倾斜角度
     * @param skewX x轴倾斜角度（弧度）
     */
    set skewX(skewX: number) {
        this._skewX = skewX;
        this._dirty = true;
    }

    /**
     * 获取x轴倾斜角度
     * @returns x轴倾斜角度（弧度）
     */
    get skewX(): number {
        return this._skewX;
    }

    /**
     * 设置y轴倾斜角度
     * @param skewY y轴倾斜角度（弧度）
     */
    set skewY(skewY: number) {
        this._skewY = skewY;
        this._dirty = true;
    }

    /**
     * 获取y轴倾斜角度
     * @returns y轴倾斜角度（弧度）
     */
    get skewY(): number {
        return this._skewY;
    }
}