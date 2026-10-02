#!/usr/bin/env node

import { spawn, exec, execSync } from "node:child_process";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import net from "node:net";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const webDir = path.join(rootDir, "web");
const botDir = path.join(rootDir, "bot");

// Terminal styling constants
const ESC = "\x1B";
const RESET = `${ESC}[0m`;
const BOLD = `${ESC}[1m`;
const DIM = `${ESC}[2m`;
const CYAN = `${ESC}[36m`;
const GREEN = `${ESC}[32m`;
const YELLOW = `${ESC}[33m`;
const RED = `${ESC}[31m`;
const MAGENTA = `${ESC}[35m`;
const WHITE = `${ESC}[37m`;
const GRAY = `${ESC}[90m`;

// Service definitions
const services = {
  web: {
    name: "Frontend Web",
    type: "Next.js",
    url: "http://localhost:3000",
    probeHost: "127.0.0.1",
    port: 3000,
    dir: webDir,
    process: null,
    pid: null,
    status: "STARTING",
    httpStatus: null,
    latency: null,
    color: CYAN,
    tag: "WEB",
  },
  bot: {
    name: "Backend Bot",
    type: "Worker + D1",
    url: "http://127.0.0.1:8787",
    probeHost: "127.0.0.1",
    port: 8787,
    dir: botDir,
    process: null,
    pid: null,
    status: "STARTING",
    httpStatus: null,
    latency: null,
    color: MAGENTA,
    tag: "BOT",
  },
};

// UI state
const recentEvents = [];
const MAX_EVENTS = 6;
const startTime = Date.now();
let isShuttingDown = false;
let redrawTimer = null;
let healthCheckTimer = null;
let uptimeTimer = null;

// Strip ANSI codes for accurate string length calculations
function stripAnsi(str) {
  return String(str).replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}

// Format duration into mm:ss or hh:mm:ss
function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

// Safe cross platform browser opener
function openBrowser(url) {
  if (process.platform === "win32") {
    exec(`start "" "${url}"`);
  } else if (process.platform === "darwin") {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

// Free port if occupied by a stale zombie process on Windows
function freePortIfOccupied(port) {
  if (process.platform !== "win32") return;
  try {
    const output = execSync(
      `netstat -ano -p tcp | findstr :${port} | findstr LISTENING`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }
    );
    const lines = output.trim().split(/\r?\n/);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pidStr = parts[parts.length - 1];
      const pid = parseInt(pidStr, 10);
      if (pid && pid !== process.pid) {
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" });
      }
    }
  } catch {
    // Port was free or no process matched
  }
}

// Kill child process tree thoroughly on Windows and Unix
function killProcessTree(proc, callback) {
  if (!proc || !proc.pid) {
    if (callback) callback();
    return;
  }
  const pid = proc.pid;
  if (process.platform === "win32") {
    exec(`taskkill /pid ${pid} /T /F`, () => {
      if (callback) callback();
    });
  } else {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      try {
        proc.kill("SIGTERM");
      } catch {
        // Process is already closed
      }
    }
    if (callback) callback();
  }
}

// Filter out noise logs such as health check pings, compiler progress, and empty lines
function isNoiseLog(rawLine) {
  const clean = stripAnsi(rawLine).toLowerCase().trim();
  if (!clean) return true;
  if (clean.includes("get / 200")) return true;
  if (clean.includes("get /favicon.ico")) return true;
  if (clean.includes("wrangler:inf") && clean.includes("get /")) return true;
  if (clean.includes("x-health-check")) return true;
  if (clean.includes("ready in ") && clean.includes("ms")) return true;
  if (clean.includes("compiled in ") && clean.includes("ms")) return true;
  if (clean.includes("compiling / ...")) return true;
  if (clean.includes("watching for file changes")) return true;
  return false;
}

// Record meaningful events
function addEvent(source, rawLine) {
  if (isNoiseLog(rawLine)) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  recentEvents.push({
    source,
    time: timeStr,
    text: stripAnsi(rawLine).trim(),
  });

  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.shift();
  }

  scheduleRedraw();
}

// Schedule throttled render
function scheduleRedraw() {
  if (redrawTimer || isShuttingDown) return;
  redrawTimer = setTimeout(() => {
    redrawTimer = null;
    renderDashboard();
  }, 60);
}

// Check if a port is in use
function checkPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

// Spawn a service cleanly
async function startService(key) {
  const s = services[key];
  if (s.process) {
    killProcessTree(s.process);
    s.process = null;
  }

  s.status = "STARTING";
  s.httpStatus = null;
  s.latency = null;

  addEvent("system", `Starting ${s.name}...`);

  const isWindows = process.platform === "win32";
  let child;

  try {
    if (isWindows) {
      child = spawn("cmd.exe", ["/d", "/s", "/c", "npm run dev"], {
        cwd: s.dir,
        env: { ...process.env, FORCE_COLOR: "1" },
      });
    } else {
      child = spawn("npm", ["run", "dev"], {
        cwd: s.dir,
        env: { ...process.env, FORCE_COLOR: "1" },
      });
    }

    s.process = child;
    s.pid = child.pid;

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        if (line.trim()) {
          // Detect startup completion indicators
          const clean = stripAnsi(line).toLowerCase();
          if (clean.includes("ready in") || clean.includes("local:")) {
            s.status = "READY";
            addEvent(key, `${s.name} ready on port ${s.port}`);
          }
          addEvent(key, line);
        }
      }
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        if (line.trim()) {
          addEvent(key, `Error: ${line.trim()}`);
        }
      }
    });

    child.on("exit", (code) => {
      if (!isShuttingDown) {
        s.status = "EXITED";
        s.pid = null;
        addEvent("system", `${s.name} exited with code ${code ?? 0}`);
        scheduleRedraw();
      }
    });
  } catch (err) {
    s.status = "FAILED";
    addEvent("system", `Failed to spawn ${s.name}: ${err.message}`);
  }
}

// HTTP Health check probe without logging noise
function probeService(s) {
  const start = Date.now();
  const req = http.get(
    {
      hostname: s.probeHost,
      port: s.port,
      path: "/",
      headers: { "x-health-check": "orbit-dashboard" },
      timeout: 2000,
    },
    (res) => {
      const latency = Date.now() - start;
      const prevStatus = s.status;
      const prevCode = s.httpStatus;

      s.httpStatus = res.statusCode;
      s.latency = latency;
      s.status = "READY";
      res.resume();

      // Only schedule redraw when status or response code changes
      if (prevStatus !== "READY" || prevCode !== res.statusCode) {
        scheduleRedraw();
      }
    }
  );

  req.on("error", () => {
    const prevStatus = s.status;
    s.latency = null;
    s.httpStatus = null;
    if (s.process && s.status !== "STARTING") {
      s.status = "LISTENING";
    }
    if (prevStatus !== s.status) {
      scheduleRedraw();
    }
  });

  req.on("timeout", () => {
    req.destroy();
  });
}

function runHealthChecks() {
  probeService(services.web);
  probeService(services.bot);
}

// Clean shutdown handler
function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (redrawTimer) clearTimeout(redrawTimer);
  if (healthCheckTimer) clearInterval(healthCheckTimer);
  if (uptimeTimer) clearInterval(uptimeTimer);

  // Restore cursor and normal screen buffer
  process.stdout.write(`${ESC}[?1049l${ESC}[?25h`);
  process.stdout.write(`\n${YELLOW}Shutting down Orbit Fund Management services...${RESET}\n`);

  let count = 0;
  const finish = () => {
    count++;
    if (count >= 2) {
      process.stdout.write(`${GREEN}All processes stopped cleanly. Goodbye!${RESET}\n\n`);
      process.exit(0);
    }
  };

  killProcessTree(services.web.process, finish);
  killProcessTree(services.bot.process, finish);

  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

// Render main dashboard interface
function renderDashboard() {
  if (isShuttingDown) return;

  // Safe box width calculation: strictly never exceeds terminal column boundary
  const termCols = process.stdout.columns || 80;
  const targetWidth = Math.min(Math.max(termCols, 60), 78);
  const innerWidth = targetWidth - 2;

  const lines = [];

  // Top header banner
  const bannerBorder = "─".repeat(innerWidth);
  lines.push(`${CYAN}╭${bannerBorder}╮${RESET}`);

  const title = " ORBIT FUND MANAGEMENT | DEVELOPMENT DASHBOARD ";
  const titlePadded = title.padEnd(innerWidth, " ");
  lines.push(`${CYAN}│${RESET}${BOLD}${WHITE}${titlePadded}${RESET}${CYAN}│${RESET}`);
  lines.push(`${CYAN}╰${bannerBorder}╯${RESET}`);

  // Status Cards Grid
  const cardWidth = Math.floor((targetWidth - 3) / 2);
  const cardInner = cardWidth - 2;
  const web = services.web;
  const bot = services.bot;

  function statusBadge(s) {
    if (s.status === "READY") {
      const ms = s.latency ? ` ${s.latency}ms` : "";
      return `${GREEN}● READY (${s.httpStatus || 200} OK${ms})${RESET}`;
    }
    if (s.status === "STARTING") {
      return `${YELLOW}◌ STARTING...${RESET}`;
    }
    if (s.status === "STOPPED" || s.status === "EXITED") {
      return `${RED}○ ${s.status}${RESET}`;
    }
    return `${CYAN}● ${s.status}${RESET}`;
  }

  const cardBorderLeft = "─".repeat(cardInner);
  const cardBorderRight = "─".repeat(cardInner);

  lines.push(`${GRAY}┌${cardBorderLeft}┐ ┌${cardBorderRight}┐${RESET}`);

  // Row 1: Titles
  const webTitle = ` 🌐 ${web.name} (${web.type})`.padEnd(cardInner, " ");
  const botTitle = ` 🤖 ${bot.name} (${bot.type})`.padEnd(cardInner, " ");
  lines.push(
    `${GRAY}│${RESET}${BOLD}${CYAN}${webTitle}${RESET}${GRAY}│ │${RESET}${BOLD}${MAGENTA}${botTitle}${RESET}${GRAY}│${RESET}`
  );

  // Row 2: Status
  const rawWebBadge = stripAnsi(statusBadge(web));
  const rawBotBadge = stripAnsi(statusBadge(bot));
  const webStatusLine = ` Status: ${statusBadge(web)}${" ".repeat(
    Math.max(0, cardInner - 9 - rawWebBadge.length)
  )}`;
  const botStatusLine = ` Status: ${statusBadge(bot)}${" ".repeat(
    Math.max(0, cardInner - 9 - rawBotBadge.length)
  )}`;
  lines.push(`${GRAY}│${RESET}${webStatusLine}${GRAY}│ │${RESET}${botStatusLine}${GRAY}│${RESET}`);

  // Row 3: URLs
  const webUrlLine = ` Local:  ${CYAN}${web.url}${RESET}${" ".repeat(
    Math.max(0, cardInner - 9 - web.url.length)
  )}`;
  const botUrlLine = ` Local:  ${MAGENTA}${bot.url}${RESET}${" ".repeat(
    Math.max(0, cardInner - 9 - bot.url.length)
  )}`;
  lines.push(`${GRAY}│${RESET}${webUrlLine}${GRAY}│ │${RESET}${botUrlLine}${GRAY}│${RESET}`);

  // Row 4: PID and Port
  const webMeta = ` Port: 3000   PID: ${web.pid || "off"}`.padEnd(cardInner, " ");
  const botMeta = ` Port: 8787   PID: ${bot.pid || "off"}`.padEnd(cardInner, " ");
  lines.push(`${GRAY}│${RESET}${DIM}${webMeta}${RESET}${GRAY}│ │${RESET}${DIM}${botMeta}${RESET}${GRAY}│${RESET}`);

  lines.push(`${GRAY}└${cardBorderLeft}┘ └${cardBorderRight}┘${RESET}`);

  // Info & Uptime Bar
  const uptimeStr = formatUptime(Date.now() - startTime);
  const infoBar = ` Uptime: ${WHITE}${uptimeStr}${RESET} | Database: ${GREEN}Cloudflare D1 (Local SQLite)${RESET} | Mode: ${CYAN}Full Stack Dev${RESET} `;
  lines.push(`${DIM}${infoBar}${RESET}`);

  // Endpoints Quick Reference Box
  const refBorder = "─".repeat(innerWidth);
  lines.push(`${GRAY}┌${refBorder}┐${RESET}`);

  const ep1 = `  • Public Web:       ${CYAN}http://localhost:3000${RESET}`;
  const ep2 = `  • Admin Dashboard:  ${CYAN}http://localhost:3000/admin${RESET} ${DIM}(Passkey: admin123)${RESET}`;
  const ep3 = `  • Bot Webhook:      ${MAGENTA}http://127.0.0.1:8787/webhook${RESET}`;
  const ep4 = `  • Ledger Sync API:  ${MAGENTA}/api/bot/sync${RESET} ${DIM}(Shared BOT_API_KEY active)${RESET}`;

  for (const ep of [ep1, ep2, ep3, ep4]) {
    const rawLen = stripAnsi(ep).length;
    const pad = Math.max(0, innerWidth - rawLen);
    lines.push(`${GRAY}│${RESET}${ep}${" ".repeat(pad)}${GRAY}│${RESET}`);
  }

  lines.push(`${GRAY}├${refBorder}┤${RESET}`);

  // Recent System Events (Quiet, clean notices instead of raw log floods)
  const headerNotice = `  ${BOLD}${WHITE}Recent Events:${RESET}`;
  const rawHdrLen = stripAnsi(headerNotice).length;
  lines.push(`${GRAY}│${RESET}${headerNotice}${" ".repeat(Math.max(0, innerWidth - rawHdrLen))}${GRAY}│${RESET}`);

  const displayEvents = recentEvents.slice(-4);
  if (displayEvents.length === 0) {
    const emptyMsg = `  ${DIM}All services healthy. No errors or warnings.${RESET}`;
    const rawEmptyLen = stripAnsi(emptyMsg).length;
    lines.push(`${GRAY}│${RESET}${emptyMsg}${" ".repeat(Math.max(0, innerWidth - rawEmptyLen))}${GRAY}│${RESET}`);
  } else {
    for (const ev of displayEvents) {
      let tag = `${YELLOW}[SYS]${RESET}`;
      if (ev.source === "web") tag = `${CYAN}[WEB]${RESET}`;
      if (ev.source === "bot") tag = `${MAGENTA}[BOT]${RESET}`;

      const prefix = `  ${GRAY}${ev.time}${RESET} ${tag} `;
      const rawPrefLen = stripAnsi(prefix).length;
      const maxTextLen = Math.max(10, innerWidth - rawPrefLen - 1);

      let text = ev.text;
      if (text.length > maxTextLen) {
        text = text.substring(0, maxTextLen - 1) + "…";
      }

      const totalRaw = rawPrefLen + text.length;
      const pad = Math.max(0, innerWidth - totalRaw);
      lines.push(`${GRAY}│${RESET}${prefix}${WHITE}${text}${RESET}${" ".repeat(pad)}${GRAY}│${RESET}`);
    }
  }

  lines.push(`${GRAY}└${refBorder}┘${RESET}`);

  // Action bar
  const shortcuts = ` ${BOLD}${WHITE}Commands:${RESET} [f] Web | [b] Bot | [a] Admin | [o] Open Both | [r] Restart | [c] Clear | [q] Quit `;
  lines.push(`${CYAN}${shortcuts}${RESET}`);

  // Atomic write inside alternate screen buffer:
  // Move cursor to top left, clear viewport, write lines without causing scrollback elongation
  process.stdout.write(`${ESC}[H${ESC}[2J` + lines.join("\n"));
}

// Stdin keypress setup
function setupInput() {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (key) => {
      // Ctrl+C or 'q'
      if (key === "\u0003" || key === "q" || key === "Q") {
        shutdown();
        return;
      }

      if (key === "f" || key === "F") {
        openBrowser(services.web.url);
        addEvent("system", `Opened Frontend Web: ${services.web.url}`);
      } else if (key === "b" || key === "B") {
        openBrowser(services.bot.url);
        addEvent("system", `Opened Backend Bot: ${services.bot.url}`);
      } else if (key === "a" || key === "A") {
        openBrowser(`${services.web.url}/admin`);
        addEvent("system", `Opened Admin Panel: ${services.web.url}/admin`);
      } else if (key === "o" || key === "O") {
        openBrowser(services.web.url);
        openBrowser(services.bot.url);
        addEvent("system", "Opened both Web and Bot in browser");
      } else if (key === "r" || key === "R") {
        addEvent("system", "Restarting services...");
        startService("web");
        startService("bot");
      } else if (key === "c" || key === "C") {
        recentEvents.length = 0;
        scheduleRedraw();
      }
    });
  }

  // Handle window resizing cleanly
  process.stdout.on("resize", () => {
    scheduleRedraw();
  });
}

// Initial environment and dependency check
function prepareEnvironment() {
  const webEnvPath = path.join(webDir, ".env.local");
  if (!fs.existsSync(webEnvPath)) {
    const webEnvExample = path.join(webDir, ".env.example");
    if (fs.existsSync(webEnvExample)) {
      fs.copyFileSync(webEnvExample, webEnvPath);
    }
  }

  const botDevVarsPath = path.join(botDir, ".dev.vars");
  if (!fs.existsSync(botDevVarsPath)) {
    const botDevVarsExample = path.join(botDir, ".dev.vars.example");
    if (fs.existsSync(botDevVarsExample)) {
      fs.copyFileSync(botDevVarsExample, botDevVarsPath);
    }
  }
}

// Main execution entry point
async function main() {
  // Switch to alternate screen buffer, clear screen, and hide cursor
  process.stdout.write(`${ESC}[?1049h${ESC}[2J${ESC}[H${ESC}[?25l`);

  prepareEnvironment();
  setupInput();

  // Clean any stale zombie listeners on Windows before starting
  freePortIfOccupied(services.web.port);
  freePortIfOccupied(services.bot.port);

  // Check if ports are free
  const isWebFree = await checkPortFree(services.web.port);
  const isBotFree = await checkPortFree(services.bot.port);

  if (!isWebFree) {
    addEvent("system", "Warning: Port 3000 is occupied. Starting anyway...");
  }
  if (!isBotFree) {
    addEvent("system", "Warning: Port 8787 is occupied. Starting anyway...");
  }

  // Launch both services
  startService("web");
  startService("bot");

  // Health checks every 3 seconds (silent, non repetitive)
  runHealthChecks();
  healthCheckTimer = setInterval(runHealthChecks, 3000);

  // Uptime tick every 3 seconds
  uptimeTimer = setInterval(scheduleRedraw, 3000);

  // Initial draw
  renderDashboard();

  // Clean exit hooks
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("exit", () => {
    process.stdout.write(`${ESC}[?1049l${ESC}[?25h`);
  });
}

main();
