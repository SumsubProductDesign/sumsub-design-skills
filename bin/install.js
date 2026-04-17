#!/usr/bin/env node
/**
 * Sumsub Design Skills installer
 * Copies skill directories into ~/.claude/skills/ and registers the Figma
 * remote MCP server in ~/.claude.json. Idempotent — safe to re-run.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const HOME = os.homedir();
const TARGET_SKILLS = path.join(HOME, ".claude", "skills");
const CONFIG_PATH = path.join(HOME, ".claude.json");
const SOURCE_SKILLS = path.join(__dirname, "..", "skills");
const VERSION_FILE = path.join(TARGET_SKILLS, ".sumsub-design-skills-version");

const SELF_VERSION = (() => {
  try {
    return require(path.join(__dirname, "..", "package.json")).version;
  } catch (e) {
    return "unknown";
  }
})();

const MCP_KEY = "figma";
const MCP_CONFIG = {
  type: "http",
  url: "https://mcp.figma.com/mcp",
};

const DIVIDER = "======================================";

function log(msg) { process.stdout.write(msg + "\n"); }

function copyDirRecursive(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

function installSkills() {
  log("[1/2] Installing skills into " + TARGET_SKILLS);
  fs.mkdirSync(TARGET_SKILLS, { recursive: true });

  // Remove legacy (unprefixed) skill dirs from older versions
  for (const legacy of ["mockup", "specs-docs", "screen-annotations", "design-review"]) {
    const p = path.join(TARGET_SKILLS, legacy);
    if (fs.existsSync(p)) {
      log("       removing legacy " + legacy);
      fs.rmSync(p, { recursive: true, force: true });
    }
  }

  if (!fs.existsSync(SOURCE_SKILLS)) {
    throw new Error("Skills source not found at " + SOURCE_SKILLS);
  }

  for (const name of fs.readdirSync(SOURCE_SKILLS)) {
    const src = path.join(SOURCE_SKILLS, name);
    const stat = fs.statSync(src);
    if (!stat.isDirectory()) continue;
    const dest = path.join(TARGET_SKILLS, name);
    log("       - " + name);
    copyDirRecursive(src, dest);
  }

  // Record installed version so skills can compare against GitHub and notify about updates
  fs.writeFileSync(VERSION_FILE, SELF_VERSION + "\n");
  log("       recorded version " + SELF_VERSION + " in " + VERSION_FILE);
}

function registerFigmaMcp() {
  log("[2/2] Registering Figma MCP server");
  let data = {};
  if (fs.existsSync(CONFIG_PATH)) {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    try {
      data = JSON.parse(raw);
    } catch (e) {
      log("       WARNING: ~/.claude.json is not valid JSON, skipping MCP setup");
      return;
    }
    fs.writeFileSync(CONFIG_PATH + ".sumsub-backup", raw);
  }

  if (!data.mcpServers || typeof data.mcpServers !== "object") {
    data.mcpServers = {};
  }

  const existing = data.mcpServers[MCP_KEY];
  const same =
    existing &&
    existing.type === MCP_CONFIG.type &&
    existing.url === MCP_CONFIG.url;

  if (same) {
    log("       figma already registered, no changes");
    return;
  }

  data.mcpServers[MCP_KEY] = MCP_CONFIG;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
  log("       figma MCP registered at " + MCP_CONFIG.url);
}

function main() {
  log("");
  log(DIVIDER);
  log("  Sumsub Design Skills — Installer");
  log(DIVIDER);
  log("");

  try {
    installSkills();
    registerFigmaMcp();
  } catch (err) {
    log("");
    log("ERROR: " + (err && err.message ? err.message : String(err)));
    process.exit(1);
  }

  log("");
  log(DIVIDER);
  log("  Done!");
  log(DIVIDER);
  log("");
  log("Installed skills:");
  for (const name of fs.readdirSync(TARGET_SKILLS).sort()) {
    if (name.startsWith("sumsub-")) log("  - " + name);
  }
  log("");
  log("Next steps:");
  log("  1. Fully restart Claude Desktop (Cmd+Q on macOS, Quit from tray on Windows)");
  log("  2. In a new chat, try:  /sumsub-mockup create an applicant list page");
  log("");
  log("A backup of your previous ~/.claude.json was saved to ~/.claude.json.sumsub-backup");
  log("");
}

main();
