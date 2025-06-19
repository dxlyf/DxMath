/* 模拟 FreeType 的 16.16 定点数类型 */
type FT_Fixed = number;
type FT_Angle = number;
type FT_Vector = { x: number; y: number };

/* Constants */
// 将pi 映映到2^32
const FT_TRIG_SCALE = 0xDBD95B16; /* 0.858785336480436 * 2^32 */
const FT_TRIG_SAFE_MSB = 29;
const FT_TRIG_MAX_ITERS = 23;
const FT_ANGLE_PI4 = 0x40000000; /* PI/4 in 16.16 */
const FT_ANGLE_PI2 = 0x80000000; /* PI/2 in 16.16 */
const FT_ANGLE_PI = 0x100000000; /* PI in 16.16 */
const FT_ANGLE_2PI = 0x200000000; /* 2*PI in 16.16 */

/* Arctan 表 (角度值 16.16 格式) */
const ft_trig_arctan_table: number[] = [
  1740967, 919879, 466945, 234379, 117304, 58666, 29335,
  14668, 7334, 3667, 1833, 917, 458, 229, 115,
  57, 29, 14, 7, 4, 2, 1
];

/* 辅助函数：模拟 32 位无符号乘法 */
function umul32(a: number, b: number): number {
  return ((a & 0xFFFF) * (b & 0xFFFF)) + (((a >>> 16) * (b & 0xFFFF) + (a & 0xFFFF) * (b >>> 16)) * 0x10000);
}

/* 乘法后缩放 (模拟 C 的 64 位运算) */
function ft_trig_downscale(val: FT_Fixed): FT_Fixed {
  const s = val < 0 ? -1 : 1;
  val = Math.abs(val);
  
  /* 32x32 -> 64 位乘法 */
  const hi = (val * FT_TRIG_SCALE) / 0x100000000;
  return s * ((hi + 0x40000000) >>> 0);
}

/* 预处理向量到安全范围 */
function ft_trig_prenorm(vec: FT_Vector): number {
  let x = vec.x, y = vec.y;
  const m = Math.max(Math.abs(x), Math.abs(y));
  const shift = 31 - Math.clz32(m | 1); // MSB 位置
  
  if (shift <= FT_TRIG_SAFE_MSB) {
    const s = FT_TRIG_SAFE_MSB - shift;
    vec.x = x << s;
    vec.y = y << s;
    return s;
  } else {
    const s = shift - FT_TRIG_SAFE_MSB;
    vec.x = x >> s;
    vec.y = y >> s;
    return -s;
  }
}

/* CORDIC 伪旋转 */
function ft_trig_pseudo_rotate(vec: FT_Vector, theta: FT_Angle): void {
  let x = vec.x, y = vec.y;
  
  /* 调整到 [-PI/4, PI/4] */
  while (theta < -FT_ANGLE_PI4) {
    [x, y] = [y, -x];
    theta += FT_ANGLE_PI2;
  }
  while (theta > FT_ANGLE_PI4) {
    [x, y] = [-y, x];
    theta -= FT_ANGLE_PI2;
  }

  let arctan = ft_trig_arctan_table;
  for (let i = 1, b = 1; i < FT_TRIG_MAX_ITERS; i++, b <<= 1) {
    const d = theta < 0 ? -1 : 1;
    const tn = arctan[0];
    arctan = arctan.slice(1);

    const xt = d * ((y + b) >> i);
    const yt = d * ((x + b) >> i);
    
    x = x - xt;
    y = y + yt;
    theta -= d * tn;
  }

  vec.x = x;
  vec.y = y;
}

/* 三角函数接口 */
export function FT_Cos(angle: FT_Angle): FT_Fixed {
  const v: FT_Vector = { x: FT_TRIG_SCALE >>> 8, y: 0 };
  ft_trig_pseudo_rotate(v, angle);
  return (v.x + 0x80) >>> 8;
}

export function FT_Sin(angle: FT_Angle): FT_Fixed {
  const v: FT_Vector = { x: FT_TRIG_SCALE >>> 8, y: 0 };
  ft_trig_pseudo_rotate(v, angle);
  return (v.y + 0x80) >>> 8;
}

/* 向量旋转 */
export function FT_Vector_Rotate(vec: FT_Vector, angle: FT_Angle): void {
  if (!vec || !angle) return;
  
  const v = { ...vec };
  const shift = ft_trig_prenorm(v);
  
  ft_trig_pseudo_rotate(v, angle);
  v.x = ft_trig_downscale(v.x);
  v.y = ft_trig_downscale(v.y);
  
  if (shift > 0) {
    const half = 1 << (shift - 1);
    vec.x = (v.x + half - (v.x < 0 ? 1 : 0)) >> shift;
    vec.y = (v.y + half - (v.y < 0 ? 1 : 0)) >> shift;
  } else {
    vec.x = v.x << -shift;
    vec.y = v.y << -shift;
  }
}
export function cos(angle: number): number {
  return FT_Cos(angle << 16) / 65536;
}
/* 其他函数类似实现... */
console.log(FT_Cos(0<<16)/65536)