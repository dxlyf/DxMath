// @ts-nocheck
// 26.6 Fixed Point
export const FDot6 = {
    ONE: 64,
  
    fromInt(n) {
      return n << 6;
    },
  
    fromFloat(n) {
      return (n * 64) | 0;
    },
  
    floor(n) {
      return n >> 6;
    },
  
    ceil(n) {
      return (n + 63) >> 6;
    },
  
    round(n) {
      return (n + 32) >> 6;
    },
  
    toFDot16(n) {
      return FDotMath.leftShift(n, 10);
    },
  
    div(a, b) {
      if (b === 0) throw new Error("Division by zero");
      if (a >= -32768 && a <= 32767) {
        return FDotMath.leftShift(a, 16) / b | 0;
      } else {
        return FDot16.div(a, b);
      }
    },
  
    canConvertToFDot16(n) {
      const max_dot6 = 0x7FFFFFFF >> (16 - 6);
      return Math.abs(n) <= max_dot6;
    },
  
    smallScale(value, dot6) {
      if (dot6 < 0 || dot6 > 64) throw new Error("dot6 out of range");
      return ((value * dot6) >> 6) & 0xFF;
    }
  };
  
  // 24.8 Fixed Point from 16.16
  export const FDot8 = {
    fromFDot16(x) {
      return (x + 0x80) >> 8;
    }
  };
  
  // 16.16 Fixed Point
  export const FDot16 = {
    ONE: 1 << 16,
    HALF: 1 << 15,
  
    fromFloat(x) {
      return FDotMath.saturateToInt32(x * (1 << 16));
    },
  
    floorToInt(x) {
      return x >> 16;
    },
  
    ceilToInt(x) {
      return (x + (1 << 16) - 1) >> 16;
    },
  
    roundToInt(x) {
      return (x + (1 << 15)) >> 16;
    },
  
    mul(a, b) {
      return ((BigInt(a) * BigInt(b)) >> 16n) | 0;
    },
  
    div(numer, denom) {
      if (denom === 0) throw new Error("Division by zero");
      const v = (BigInt(numer) << 16n) / BigInt(denom);
      return FDotMath.boundInt32(v);
    },
  
    fastDiv(a, b) {
      if (b === 0) throw new Error("Division by zero");
      return (FDotMath.leftShift(a, 16) / b) | 0;
    }
  };
  
  // Common math helpers
  const FDotMath = {
    leftShift(x, bits) {
      return x << bits;
    },
  
    leftShift64(x, bits) {
      return BigInt(x) << BigInt(bits);
    },
  
    saturateToInt32(x) {
      if (x > 0x7FFFFFFF) return 0x7FFFFFFF;
      if (x < -0x80000000) return -0x80000000;
      return x | 0;
    },
  
    boundInt32(x) {
      if (x > BigInt(0x7FFFFFFF)) return 0x7FFFFFFF;
      if (x < BigInt(-0x80000000)) return -0x80000000;
      return Number(x);
    }
  };
  