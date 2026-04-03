#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors
const green = '\x1b[32m';
const cyan = '\x1b[36m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

const pkg = require('../package.json');

const banner = `
${green}  ██████╗ ███████╗███████╗██████╗
  ██╔══██╗██╔════╝██╔════╝██╔══██╗
  ██████╔╝█████╗  █████╗  ██████╔╝
  ██╔══██╗██╔══╝  ██╔══╝  ██╔══██╗
  ██║  ██║███████╗███████╗██║  ██║
  ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝${reset}

  BASE ${dim}v${pkg.version}${reset}
  Builder's Automated State Engine
  for Qwen Code
`;

const args = process.argv.slice(2);
const hasHelp = args.includes('--help') || args.includes('-h');
const hasLocal = args.includes('--local') || args.includes('-l');

function parseConfigDirArg() {
  const idx = args.findIndex(arg => arg === '--config-dir' || arg === '-c');
  if (idx !== -1) {
    const nextArg = args[idx + 1];
    if (!nextArg || nextArg.startsWith('-')) {
      console.error(`  ${yellow}--config-dir requires a path argument${reset}`);
      process.exit(1);
    }
    return nextArg;
  }
  const configDirArg = args.find(arg => arg.startsWith('--config-dir=') || arg.startsWith('-c='));
  if (configDirArg) {
    return configDirArg.split('=')[1];
  }
  return null;
}

function expandTilde(filePath) {
  if (filePath && filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

function copyDir(srcDir, destDir, skipDirs = []) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (skipDirs.includes(entry.name)) continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, skipDirs);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function countFiles(dir, ext) {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(fullPath, ext);
    } else if (!ext || entry.name.endsWith(ext)) {
      count++;
    }
  }
  return count;
}

console.log(banner);

if (hasHelp) {
  console.log(`  ${yellow}Usage:${reset} npx qwen-base [options]

  ${yellow}Options:${reset}
    ${cyan}-l, --local${reset}              Install to ./.qwen/commands/ instead of global
    ${cyan}-c, --config-dir <path>${reset}  Specify custom Qwen config directory
    ${cyan}-h, --help${reset}               Show this help message

  ${yellow}Examples:${reset}
    ${dim}# Install globally (default)${reset}
    npx qwen-base

    ${dim}# Install to current project only${reset}
    npx qwen-base --local

  ${yellow}What gets installed:${reset}
    ${cyan}commands/qwen-base/${reset}
      base.md              Entry point (routing + persona)
      framework/           Tasks, templates, frameworks (11 commands)
      commands/            Command definitions
      hooks/               7 Python hooks for workspace intelligence
      templates/           operator.json, workspace.json templates
    ${cyan}.qwen/hooks/${reset}              Python hooks registration
`);
  process.exit(0);
}

const explicitConfigDir = parseConfigDirArg();
const configDir = expandTilde(explicitConfigDir) || expandTilde(process.env.QWEN_CONFIG_DIR);
const globalDir = configDir || path.join(os.homedir(), '.qwen');
const qwenDir = hasLocal ? path.join(process.cwd(), '.qwen') : globalDir;
const baseDest = path.join(qwenDir, 'commands', 'qwen-base');

const locationLabel = hasLocal
  ? baseDest.replace(process.cwd(), '.')
  : baseDest.replace(os.homedir(), '~');

if (fs.existsSync(baseDest)) {
  console.log(`  ${yellow}Existing installation found at ${locationLabel}${reset}`);
  console.log(`  Updating...`);
  fs.rmSync(baseDest, { recursive: true, force: true });
}

console.log(`  Installing to ${cyan}${locationLabel}${reset}\n`);

const src = path.join(__dirname, '..');

// Copy entry point
fs.mkdirSync(baseDest, { recursive: true });
fs.copyFileSync(path.join(src, 'src', 'skill', 'base.md'), path.join(baseDest, 'base.md'));
console.log(`  ${green}+${reset} base.md ${dim}(entry point)${reset}`);

// Copy framework
const fwSrc = path.join(src, 'src', 'framework');
const fwDest = path.join(baseDest, 'framework');
copyDir(fwSrc, fwDest);
const fwCount = countFiles(fwSrc);
console.log(`  ${green}+${reset} framework/ ${dim}(${fwCount} files)${reset}`);

// Copy commands
const cmdSrc = path.join(src, 'src', 'commands');
const cmdDest = path.join(baseDest, 'commands');
copyDir(cmdSrc, cmdDest);
const cmdCount = countFiles(cmdSrc);
console.log(`  ${green}+${reset} commands/ ${dim}(${cmdCount} files)${reset}`);

// Copy hooks
const hooksSrc = path.join(src, 'src', 'hooks');
const hooksDest = path.join(baseDest, 'hooks');
copyDir(hooksSrc, hooksDest);
const hookCount = countFiles(hooksSrc);
console.log(`  ${green}+${reset} hooks/ ${dim}(${hookCount} Python hooks)${reset}`);

// Copy templates
const tplSrc = path.join(src, 'src', 'templates');
const tplDest = path.join(baseDest, 'templates');
copyDir(tplSrc, tplDest);
console.log(`  ${green}+${reset} templates/ ${dim}(workspace templates)${reset}`);

// Copy MCP server
const mcpSrc = path.join(src, 'src', 'packages', 'base-mcp');
if (fs.existsSync(mcpSrc)) {
  const mcpDest = path.join(qwenDir, 'base-mcp');
  copyDir(mcpSrc, mcpDest);
  console.log(`  ${green}+${reset} base-mcp/ ${dim}(MCP server)${reset}`);

  // Install MCP deps
  try {
    require('child_process').execSync('npm install --production --silent', {
      cwd: mcpDest, stdio: 'pipe'
    });
    console.log(`  ${green}+${reset} MCP dependencies installed${reset}`);
  } catch (e) {
    console.log(`  ${yellow}!${reset} MCP deps install failed — run cd ${mcpDest} && npm install${reset}`);
  }
}

// Wire hooks into .qwen/settings.json
function wireHooks(qwenDir, hooksDir) {
  const settingsPath = path.join(qwenDir, 'settings.json');
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch (e) {}
  }
  if (!settings.hooks) settings.hooks = {};

  const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.py') && !f.startsWith('_'));
  for (const hookFile of hookFiles) {
    const hookName = hookFile.replace('.py', '');
    const hookPath = path.join(hooksDir, hookFile).replace(/\\/g, '/');
    const hookCommand = `python3 ${hookPath}`;

    // Determine which event
    let eventName = 'SessionStart';
    if (hookFile === 'active-hook.py') eventName = 'SessionStart';
    else if (hookFile === 'psmm-injector.py') eventName = 'SessionStart';
    else if (hookFile === 'backlog-hook.py') eventName = 'SessionStart';
    else if (hookFile === 'operator.py') eventName = 'SessionStart';
    else if (hookFile === 'satellite-detection.py') eventName = 'SessionStart';
    else if (hookFile === 'apex-insights.py') eventName = 'Stop';
    else if (hookFile === 'base-pulse-check.py') eventName = 'SessionStart';

    if (!settings.hooks[eventName]) settings.hooks[eventName] = [];
    const exists = settings.hooks[eventName].some(h =>
      (h.command && h.command.includes(hookFile)) ||
      (h.hooks && h.hooks.some(i => i.command && i.command.includes(hookFile)))
    );
    if (!exists) {
      settings.hooks[eventName].push({ hooks: [{ type: 'command', command: hookCommand }] });
    }
  }
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

wireHooks(qwenDir, hooksDest);
console.log(`  ${green}+${reset} Hooks wired in settings.json${reset}`);

console.log(`
  ${green}Done!${reset} Open Qwen Code and type ${cyan}/base${reset} to start.
`);
