以下是使用 **JavaScript** 实现的常见数值积分方法，包括矩形法、梯形法、辛普森法、Romberg 积分和高斯积分。所有方法均以函数 \( f(x) = x^2 \) 为例，计算其在区间 \([0, 1]\) 上的积分（真实值为 \( \frac{1}{3} \)）。

---

### **1. 矩形法（左端点）**
```javascript
function rectangularIntegral(f, a, b, n) {
    const h = (b - a) / n;
    let sum = 0;
    for (let i = 0; i < n; i++) {
        const x = a + i * h;
        sum += f(x);
    }
    return h * sum;
}

// 示例：计算 ∫x² dx 从 0 到 1，n=100
const f = x => x * x;
console.log(rectangularIntegral(f, 0, 1, 100)); // 输出 ≈0.32835
```

---

### **2. 梯形法**
```javascript
function trapezoidalIntegral(f, a, b, n) {
    const h = (b - a) / n;
    let sum = (f(a) + f(b)) / 2;
    for (let i = 1; i < n; i++) {
        const x = a + i * h;
        sum += f(x);
    }
    return h * sum;
}

// 示例：n=100
console.log(trapezoidalIntegral(f, 0, 1, 100)); // 输出 ≈0.33335
```

---

### **3. 辛普森法（Simpson's Rule）**
```javascript
function simpsonsIntegral(f, a, b, n) {
    if (n % 2 !== 0) throw new Error("n 必须是偶数");
    const h = (b - a) / n;
    let sum = f(a) + f(b);
    for (let i = 1; i < n; i++) {
        const x = a + i * h;
        sum += i % 2 === 0 ? 2 * f(x) : 4 * f(x);
    }
    return (h / 3) * sum;
}

// 示例：n=100（偶数）
console.log(simpsonsIntegral(f, 0, 1, 100)); // 输出 ≈0.33333
```

---

### **4. Romberg 积分**
```javascript
function rombergIntegral(f, a, b, maxIter = 10, tol = 1e-6) {
    let R = Array(maxIter + 1).fill().map(() => Array(maxIter + 1).fill(0));
    let h = b - a;
    R[0][0] = (h / 2) * (f(a) + f(b));

    for (let k = 1; k <= maxIter; k++) {
        h /= 2;
        // 梯形法计算 R[k][0]
        let sum = 0;
        for (let i = 1; i <= 2 ** (k - 1); i++) {
            sum += f(a + (2 * i - 1) * h);
        }
        R[k][0] = 0.5 * R[k - 1][0] + h * sum;

        // Richardson 外推
        for (let j = 1; j <= k; j++) {
            R[k][j] = R[k][j - 1] + (R[k][j - 1] - R[k - 1][j - 1]) / (4 ** j - 1);
        }

        // 检查收敛
        if (Math.abs(R[k][k] - R[k - 1][k - 1]) < tol) {
            return R[k][k];
        }
    }
    return R[maxIter][maxIter];
}

// 示例
console.log(rombergIntegral(f, 0, 1)); // 输出 ≈0.333333
```

---

### **5. 高斯积分（2点公式）**
```javascript
function gaussianIntegral(f, a, b) {
    // 高斯点（2点公式）和权重
    const points = [-0.577350269, 0.577350269]; // ±1/√3
    const weights = [1, 1];

    // 变换到区间 [a, b]
    const transform = t => (a + b) / 2 + (b - a) / 2 * t;
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
        sum += weights[i] * f(transform(points[i]));
    }
    return sum * (b - a) / 2;
}

// 示例
console.log(gaussianIntegral(f, 0, 1)); // 输出 ≈0.333333
```

---

### **总结**
| 方法          | JS 函数名               | 特点               | 示例结果（∫x² dx, [0,1]） |
| ------------- | ---------------------- | ------------------ | ------------------------- |
| 矩形法         | `rectangularIntegral`  | 简单但误差较大       | ≈0.32835                  |
| 梯形法         | `trapezoidalIntegral`  | 平衡精度和效率       | ≈0.33335                  |
| 辛普森法        | `simpsonsIntegral`     | 更高精度（需偶数n）  | ≈0.33333                  |
| Romberg 积分  | `rombergIntegral`      | 高精度自适应         | ≈0.333333                 |
| 高斯积分        | `gaussianIntegral`     | 高效高精度（特定点） | ≈0.333333                 |

可根据需求选择合适的方法，其中 **Romberg 积分** 和 **高斯积分** 适合高精度计算，而 **梯形法** 和 **辛普森法** 是常用折中方案。