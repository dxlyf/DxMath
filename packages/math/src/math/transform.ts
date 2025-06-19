import { Matrix2D } from "./mat2d"
import { Vector2 } from "./vec2"

export class Transform{
    owner?:Transform|null=null
    position:Vector2
    skew:Vector2
    private _rotation:number=0
    scale:Vector2
    pivot:Vector2
    origin:Vector2
    private _matrix:Matrix2D
    private _worldMatrix:Matrix2D
    private _invertWorldMatrix:Matrix2D
    private _cx:number=1
    private _sx:number=0
    private _cy:number=0
    private _sy:number=1
    private dirty=false
    private invertWorldMatrixDirty=false
    private worldId=0
    private parentId=0
    private changeCallback:any
    constructor(owner?:Transform) {
        this.owner = owner
        this.position = Vector2.zero().onChange(this.onUpdate)
        this._rotation = 0
        this.scale = Vector2.one().onChange(this.onUpdate)
        this.skew = Vector2.zero().onChange(this.onUpdate)
        this.origin = Vector2.zero().onChange(this.onUpdate)
        this.pivot = Vector2.zero().onChange(this.onUpdate)

        this._matrix = Matrix2D.default()
        this._worldMatrix = Matrix2D.default()
        this._invertWorldMatrix = Matrix2D.default()

        this._rotation = 0
        this._cx = 1;
        this._sx = 0;
        this._cy = 0;
        this._sy = 1;

        this.dirty = false
        this.invertWorldMatrixDirty = false
        this.worldId = 0
        this.parentId = 0
    }
    private get needUpdateScale() {
        return this.scale.x !== 1 || this.scale.y !== 1
    }
    get parent():any {
        return this.owner && this.owner.parent ? this.owner.parent.transform : null
    }
    get angle() {
        return this.rotation * 180 / Math.PI
    }
    set angle(v) {
        this.rotation = v / 180 * Math.PI
    }
    get rotation() {
        return this._rotation
    }
    set rotation(v) {
        if (this._rotation !== v) {
            this._rotation = v
            this.onUpdate(this.skew)
        }
    }
    get matrix() {
        const lt = this._matrix
        if (!this.dirty) {
            return lt
        }
        lt.elements[0] = this._cx * this.scale.x;
        lt.elements[1] = this._sx * this.scale.x;
        lt.elements[2] = this._cy * this.scale.y;
        lt.elements[3] = this._sy * this.scale.y;
        
        const dx=this.pivot.x+this.origin.x,dy=this.pivot.y+this.origin.y;

        lt.elements[4] = this.position.x+this.origin.x - (dx * lt.a + dy * lt.c);
        lt.elements[5] = this.position.y+this.origin.y - (dx* lt.b + dy * lt.d);

        this.dirty = false
        return this._matrix
    }
    private get parentWorldDirty() {
        if (this.parent) {
            return this.parentId !== this.parent.worldId || this.parent.parentWorldDirty
        } else {
            return this.parentId === -1
        }
    }
    get worldMatrix() {
        if (!this.parentWorldDirty) {
            return this._worldMatrix
        }

        if (this.parent) {
            this._worldMatrix.multiplyMatrices(this.parent.worldMatrix, this.matrix)
            this.parentId = this.parent.worldId
        } else {
            this._worldMatrix.copy(this.matrix)
            this.parentId = 0
        }
        this.worldId++
        return this._worldMatrix
    }
    get invertWorldMatrix() {
        if (!this.invertWorldMatrixDirty && !this.parentWorldDirty) {
            return this._invertWorldMatrix
        }
        this._invertWorldMatrix.invertMatrix(this.worldMatrix)
        this.invertWorldMatrixDirty = false
        return this._invertWorldMatrix
    }
    isIdentity() {
        return this.matrix.isIdentity()
    }
    onChange(changeCallback:(v:Transform)=>void) {
        this.changeCallback = changeCallback
    }
    setFromMatrix(matrix:Matrix2D) {
        matrix.decomposeTRSOP(this)
    }
    onUpdate = (p:any) => {
        this.dirty = true
        this.invertWorldMatrixDirty = true
        this.parentId = -1
        if (p === this.skew) {
            this.updateSkew()
        }
        this.changeCallback && this.changeCallback(this);
    }
    updateSkew() {
        this._cx = Math.cos(this._rotation + this.skew.y);
        this._sx = Math.sin(this._rotation + this.skew.y);
        this._cy = -Math.sin(this._rotation - this.skew.x); // cos, added PI/2
        this._sy = Math.cos(this._rotation - this.skew.x); // sin, added PI/2
    }
}