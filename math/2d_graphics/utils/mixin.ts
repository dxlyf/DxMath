
// 对类进行扩展，增加一个方法，用于获取所有的元素
export function mixin<T extends FunctionConstructor,S extends FunctionConstructor>(target:T,source:S) {
    Object.assign(target.prototype,source.prototype)
}