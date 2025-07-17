
export function isNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value);
}
export function isInteger(value: any): value is number {
    return Number.isInteger(value);
}
export function isFloat(value: any): value is number {
    return typeof value === 'number' && !Number.isInteger(value);
}
export function isBoolean(value: any): value is boolean {
    return typeof value === 'boolean';
}
export function isString(value: any): value is string {
    return typeof value === 'string';
}
export function isFunction(value: any): value is Function {
    return typeof value === 'function';
}
export function isObject(value: any): value is object {
    return value !== null && typeof value === 'object';
}
export function isArray(value: any): value is any[] {
    return Array.isArray(value);
}
export function isNull(value: any): value is null {
    return value === null;
}
export function isUndefined(value: any): value is undefined {
    return typeof value === 'undefined';
}
export function isNaN(value: any): value is number {
    return typeof value === 'number' && Number.isNaN(value);
}
export function isFinite(value: any): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}
export function isEmpty(value: any): boolean {
    if (value == null) return true; // null or undefined
    if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}
export function isNullOrUndefined(value: any): boolean {
    return value == null;
}
export function isNullOrUndefinedOrEmpty(value: any): boolean {
    return isNullOrUndefined(value) || isEmpty(value);
}
