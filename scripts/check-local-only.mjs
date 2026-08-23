#!/usr/bin/env node
/**
 * 检查「数据不出这台机器」这个承诺是不是还成立。
 *
 *     node scripts/check-local-only.mjs
 *
 * README 顶上挂着两个徽章：`storage-100% local` 和 `No network calls`。
 * 这类承诺的问题在于它是**写出来的**——写完那天是真的，之后谁加一个
 * 埋点、一个字体 CDN、一次 fetch，徽章还挂在那儿，没有任何东西会红。
 *
 * 而这恰恰是最不能靠自觉的一类承诺：用户信了它，才把私密记录写进来。
 *
 * 所以把它变成一次扫描。同一套做法在 jkinco-listen-open 里也在用
 * （那边 CI 会拦下任何云端模型痕迹和 API Key）。
 *
 * 退出码 0 表示承诺仍然成立。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOURCE_DIRS = ["src"];
const SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html"]);

/**
 * 每一条都写清楚**为什么**它会破坏承诺——将来有人真的需要加，
 * 至少知道自己在放弃什么，而不是随手把这行规则删掉。
 */
const FORBIDDEN = [
  { pattern: /\bfetch\s*\(/,               why: "fetch 会把数据发出去" },
  { pattern: /\bXMLHttpRequest\b/,          why: "XHR 会把数据发出去" },
  { pattern: /\bnew\s+WebSocket\b/,         why: "WebSocket 是持续外连" },
  { pattern: /\bnew\s+EventSource\b/,       why: "SSE 是持续外连" },
  { pattern: /navigator\.sendBeacon/,       why: "sendBeacon 就是埋点上报" },
  { pattern: /\baxios\b/,                   why: "HTTP 客户端" },
  { pattern: /googletagmanager|google-analytics|gtag\(|mixpanel|sentry|posthog|umami|plausible/i,
    why: "第三方埋点/监控" },
  { pattern: /fonts\.googleapis\.com|fonts\.gstatic\.com/,
    why: "外链字体会把访问者 IP 暴露给字体服务商" },
  { pattern: /https?:\/\/(?!localhost|127\.0\.0\.1)[\w.-]+\.[a-z]{2,}\/[^\s"')]*\.(js|css|woff2?|ttf)/i,
    why: "从 CDN 拉运行时资源" },
];

/** 出现在这些位置的匹配不算数。 */
const ALLOWED = [
  /^\s*(\/\/|\*|\/\*)/,        // 注释里提到，比如这份清单本身
  /^\s*\*/,
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
      out.push(...walk(full));
    } else if (SOURCE_EXTS.has(extname(name))) {
      out.push(full);
    }
  }
  return out;
}

const findings = [];
for (const dir of SOURCE_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (ALLOWED.some((allowed) => allowed.test(line))) return;
      for (const { pattern, why } of FORBIDDEN) {
        if (pattern.test(line)) {
          findings.push({
            file: relative(ROOT, file), line: index + 1,
            why, text: line.trim().slice(0, 100),
          });
        }
      }
    });
  }
}

// 运行时依赖同样要看：一个 HTTP 客户端进了 dependencies，承诺就已经松了
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const SUSPECT_DEPS = ["axios", "node-fetch", "got", "superagent", "ky",
                      "@sentry/react", "posthog-js", "mixpanel-browser",
                      "firebase", "@supabase/supabase-js"];
for (const name of Object.keys(pkg.dependencies ?? {})) {
  if (SUSPECT_DEPS.includes(name)) {
    findings.push({ file: "package.json", line: 0,
                    why: "运行时依赖会联网", text: name });
  }
}

if (findings.length === 0) {
  const count = SOURCE_DIRS.flatMap((d) => walk(join(ROOT, d))).length;
  console.log(`扫了 ${count} 个源文件，没有发现任何外发数据的路径。`);
  console.log("README 上的 `100% local storage` 和 `No network calls` 仍然成立。");
  process.exit(0);
}

console.error("这些地方会让数据离开用户的机器：\n");
for (const f of findings) {
  const where = f.line ? `${f.file}:${f.line}` : f.file;
  console.error(`  ${where}\n      ${f.why}\n      ${f.text}\n`);
}
console.error(
  "如果这是有意为之，那么 README 上的 `storage-100% local` 和 " +
  "`No network calls` 徽章必须一起改掉——\n" +
  "用户是看着那两个徽章才把私密记录写进来的。"
);
process.exit(1);
