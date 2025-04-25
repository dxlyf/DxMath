
import {execSync} from 'node:child_process'
import * as fs from 'node:fs'

// 读取 package.json
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = pkg.version;

console.log(`🚀 当前版本: v${version}`);

// =============================
// ✅ 1. 构建项目（如果有 build 脚本）
// =============================
if (pkg.scripts?.build) {
  console.log("📦 构建中...");
  execSync("npm run build", { stdio: "inherit" });
}

// =============================
// ✅ 2. 升级版本号（可选）
// =============================
const bump = process.argv[2] || "patch"; // patch / minor / major

console.log(`📈 升级版本号 (${bump})...`);
//execSync(`npm version ${bump}`, { stdio: "inherit" });

// =============================
// ✅ 3. 发布到 NPM
// =============================
console.log("📤 发布中...");
//execSync("npm publish --access public", { stdio: "inherit" });
execSync("npm publish", { stdio: "inherit" });

// =============================
// ✅ 4. 推送 Git（可选）
// =============================
// console.log("🔀 推送到 Git...");
// execSync("git push && git push --tags", { stdio: "inherit" });

// console.log("✅ 发布成功！");
