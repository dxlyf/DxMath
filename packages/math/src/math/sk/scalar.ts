export type SkScalar = number;

// Constants
const SK_Scalar1: SkScalar = 1.0;
const SK_ScalarHalf: SkScalar = 0.5;
const SK_ScalarSqrt2: SkScalar = Math.SQRT2;
const SK_ScalarPI: SkScalar = Math.PI;
const SK_ScalarTanPIOver8: SkScalar = 0.414213562;
const SK_ScalarRoot2Over2: SkScalar = 0.707106781; // Math.cos(pi/4) sqrt(2)/2
const SK_ScalarMax: SkScalar = 3.402823466e+38;
const SK_ScalarMin: SkScalar = -SK_ScalarMax;
const SK_ScalarInfinity: SkScalar = Infinity;
const SK_ScalarNegativeInfinity: SkScalar = -Infinity;
const SK_ScalarNaN: SkScalar = NaN;

// Conversion functions
const SkIntToScalar = (x: number): SkScalar => x;
const SkIntToFloat = (x: number): number => x;
const SkScalarToFloat = (x: SkScalar): number => x;
const SkFloatToScalar = (x: number): SkScalar => x;
const SkScalarToDouble = (x: SkScalar): number => x;
const SkDoubleToScalar = (x: number): SkScalar => x;

// Math utilities
const SkScalarFloorToScalar = (x: SkScalar): SkScalar => Math.floor(x);
const SkScalarCeilToScalar = (x: SkScalar): SkScalar => Math.ceil(x);
const SkScalarRoundToScalar = (x: SkScalar): SkScalar => Math.round(x);
const SkScalarTruncToScalar = (x: SkScalar): SkScalar => Math.trunc(x);

const SkScalarFloorToInt = (x: SkScalar): number => Math.floor(x);
const SkScalarCeilToInt = (x: SkScalar): number => Math.ceil(x);
const SkScalarRoundToInt = (x: SkScalar): number => Math.round(x);

const SkScalarAbs = (x: SkScalar): SkScalar => Math.abs(x);
const SkScalarCopySign = (x: SkScalar, y: SkScalar): SkScalar => Math.sign(y) * Math.abs(x);
const SkScalarMod = (x: SkScalar, y: SkScalar): SkScalar => x % y;
const SkScalarSqrt = (x: SkScalar): SkScalar => Math.sqrt(x);
const SkScalarPow = (b: SkScalar, e: SkScalar): SkScalar => Math.pow(b, e);

// Trigonometric functions
const SkScalarSin = (radians: SkScalar): number => Math.sin(radians);
const SkScalarCos = (radians: SkScalar): number => Math.cos(radians);
const SkScalarTan = (radians: SkScalar): number => Math.tan(radians);
const SkScalarASin = (val: SkScalar): number => Math.asin(val);
const SkScalarACos = (val: SkScalar): number => Math.acos(val);
const SkScalarATan2 = (y: SkScalar, x: SkScalar): number => Math.atan2(y, x);
const SkScalarExp = (x: SkScalar): number => Math.exp(x);
const SkScalarLog = (x: SkScalar): number => Math.log(x);
const SkScalarLog2 = (x: SkScalar): number => Math.log2(x);

// Validation functions
const SkScalarIsNaN = (x: SkScalar): boolean => Number.isNaN(x);
const SkScalarIsFinite = (x: SkScalar): boolean => Number.isFinite(x);
const SkScalarsAreFinite = (a: SkScalar, b: SkScalar): boolean => 
    Number.isFinite(a) && Number.isFinite(b);

const SkScalarsAreFiniteArray = (array: SkScalar[], count: number): boolean => 
    array.slice(0, count).every(Number.isFinite);

// Math operations
const SkScalarFraction = (x: SkScalar): SkScalar => x - SkScalarTruncToScalar(x);
const SkScalarSquare = (x: SkScalar): SkScalar => x * x;
const SkScalarInvert = (x: SkScalar): SkScalar => SK_Scalar1 / x;
const SkScalarAve = (a: SkScalar, b: SkScalar): SkScalar => (a + b) * SK_ScalarHalf;
const SkScalarHalf = (a: SkScalar): SkScalar => a * SK_ScalarHalf;

// Angle conversions
const SkDegreesToRadians = (degrees: SkScalar): SkScalar => degrees * (SK_ScalarPI / 180);
const SkRadiansToDegrees = (radians: SkScalar): SkScalar => radians * (180 / SK_ScalarPI);

// Checks
const SkScalarIsInt = (x: SkScalar): boolean => x === SkScalarFloorToScalar(x);
const SkScalarSignAsInt = (x: SkScalar): number => x < 0 ? -1 : (x > 0 ? 1 : 0);
const SkScalarSignAsScalar = (x: SkScalar): SkScalar => x < 0 ? -SK_Scalar1 : (x > 0 ? SK_Scalar1 : 0);

// Tolerance checks
const SK_ScalarNearlyZero: SkScalar = SK_Scalar1 / (1 << 12);
const SkScalarNearlyZeroCheck = (x: SkScalar, tolerance: SkScalar = SK_ScalarNearlyZero): boolean => 
    SkScalarAbs(x) <= tolerance;

const SkScalarNearlyEqual = (x: SkScalar, y: SkScalar, tolerance: SkScalar = SK_ScalarNearlyZero): boolean => 
    SkScalarAbs(x - y) <= tolerance;

// Snap to zero for sin/cos
const SK_ScalarSinCosNearlyZero: SkScalar = SK_Scalar1 / (1 << 16);
const SkScalarSinSnapToZero = (radians: SkScalar): number => {
    const v = SkScalarSin(radians);
    return SkScalarNearlyZeroCheck(v, SK_ScalarSinCosNearlyZero) ? 0 : v;
};

const SkScalarCosSnapToZero = (radians: SkScalar): number => {
    const v = SkScalarCos(radians);
    return SkScalarNearlyZeroCheck(v, SK_ScalarSinCosNearlyZero) ? 0 : v;
};

// Interpolation
const SkScalarInterp = (A: SkScalar, B: SkScalar, t: SkScalar): SkScalar => {
    if (t < 0 || t > SK_Scalar1) console.warn("t out of range [0, 1]");
    return A + (B - A) * t;
};

const SkScalarInterpFunc = (
    searchKey: SkScalar,
    keys: SkScalar[],
    values: SkScalar[],
    length: number
): SkScalar => {
    if (length <= 0 || !keys || !values) throw new Error("Invalid input");
    
    let right = 0;
    while (right < length && keys[right] < searchKey) right++;
    
    if (right === length) return values[length - 1];
    if (right === 0) return values[0];
    
    const leftKey = keys[right - 1];
    const rightKey = keys[right];
    const fract = (searchKey - leftKey) / (rightKey - leftKey);
    return SkScalarInterp(values[right - 1], values[right], fract);
};

// Array comparison
const SkScalarsEqual = (a: SkScalar[], b: SkScalar[], n: number): boolean => {
    if (n < 0) throw new Error("Invalid length");
    for (let i = 0; i < n; i++) if (a[i] !== b[i]) return false;
    return true;
};

export {
    SK_Scalar1, SK_ScalarHalf, SK_ScalarSqrt2, SK_ScalarPI, SK_ScalarTanPIOver8,
    SK_ScalarRoot2Over2, SK_ScalarMax, SK_ScalarMin, SK_ScalarInfinity,
    SK_ScalarNegativeInfinity, SK_ScalarNaN,
    SkIntToScalar, SkIntToFloat, SkScalarToFloat, SkFloatToScalar,
    SkScalarToDouble, SkDoubleToScalar,
    SkScalarFloorToScalar, SkScalarCeilToScalar, SkScalarRoundToScalar, SkScalarTruncToScalar,
    SkScalarFloorToInt, SkScalarCeilToInt, SkScalarRoundToInt,
    SkScalarAbs, SkScalarCopySign, SkScalarMod, SkScalarSqrt, SkScalarPow,
    SkScalarSin, SkScalarCos, SkScalarTan, SkScalarASin, SkScalarACos, SkScalarATan2,
    SkScalarExp, SkScalarLog, SkScalarLog2,
    SkScalarIsNaN, SkScalarIsFinite, SkScalarsAreFinite, SkScalarsAreFiniteArray,
    SkScalarFraction, SkScalarSquare, SkScalarInvert, SkScalarAve, SkScalarHalf,
    SkDegreesToRadians, SkRadiansToDegrees,
    SkScalarIsInt, SkScalarSignAsInt, SkScalarSignAsScalar,
    SK_ScalarNearlyZero, SkScalarNearlyZeroCheck as SkScalarNearlyZero,
    SkScalarNearlyEqual, SK_ScalarSinCosNearlyZero,
    SkScalarSinSnapToZero, SkScalarCosSnapToZero,
    SkScalarInterp, SkScalarInterpFunc, SkScalarsEqual
};