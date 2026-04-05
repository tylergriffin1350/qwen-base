#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');

const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

const pkg = require('../package.json');

const banner = `
${green}  \u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557
  \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557
  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551
  \u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551
  \u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551
  \u255a\u2550\u2550\u2550\u2550\u2550\u255d \u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u255d${reset}

  BASE ${dim}v${pkg.version}${reset}
  Builder's Automated State Engine
  for Qwen Code
`;

const args = process.argv.slice(2);
const hasGlobal = args.includes('--global') || args.includes('-g');
const hasLocal = args.includes('--local') || args.includes('-l');
const hasWorkspace = args.includes('--workspace') || args.includes('-w');
const hasHelp = args.includes('--help') || args.includes('-h');

function parseConfigDirArg() {
  const configDirIndex = args.findIndex(arg => arg === '--config-dir' || arg === '-c');
  if (configDirIndex !== -1) {
    const nextArg = args[configDirIndex + 1];
    if (!nextArg || nextArg.startsWith('-')) {
      console.error(`  ${yellow}--config-dir requires a path argument${reset}`);
      process.exit(1);
    }
    return nextArg;
  }
  const configDirArg = args.find(arg => arg.startsWith('--config-dir=') || arg.startsWith('-c='));
  if (configDirArg) return configDirArg.split('=')[1];
  return null;
}
const explicitConfigDir = parseConfigDirArg();

function expandTilde(filePath) {
  if (filePath && filePath.startsWith('~/')) return path.join(os.homedir(), filePath.slice(2));
  return filePath;
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function countFiles(dir) {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) count += countFiles(path.join(dir, entry.name));
    else count++;
  }
  return count;
}

console.log(banner);

if (hasHelp) {
  console.log(`  ${yellow}Usage:${reset} npx qwen-base [options]

  ${yellow}Options:${reset}
    ${cyan}-g, --global${reset}              Install commands globally (to ~/.qwen)
    ${cyan}-l, --local${reset}               Install commands locally (to ./.qwen)
    ${cyan}-w, --workspace${reset}           Install workspace layer (.base/ in current directory)
    ${cyan}-c, --config-dir <path>${reset}   Specify custom Qwen config directory
    ${cyan}-h, --help${reset}                Show this help message

  ${yellow}Examples:${reset}
    ${dim}# Full install: global commands + workspace layer${reset}
    npx qwen-base --global --workspace

    ${dim}# Global commands only${reset}
    npx qwen-base --global

    ${dim}# Workspace layer only${reset}
    npx qwen-base --workspace

    ${dim}# Install to current project only${reset}
    npx qwen-base --local --workspace

  ${yellow}What gets installed:${reset}
    ${cyan}Commands (--global or --local):${reset}
      commands/qwen-base/  - 15 slash commands + orientation
      base/                - Framework (tasks, templates, context, frameworks)

    ${cyan}Workspace (--workspace):${reset}
      .base/data/          - JSON data surfaces
      .base/hooks/         - 8 Python hooks
      .base/base-mcp/      - MCP server
      .base/schemas/       - JSON validation schemas
      .base/grooming/      - Weekly groom reports
      .base/audits/        - Audit history
      .base/workspace.json - Workspace manifest
      .base/operator.json  - Operator profile
      .mcp.json            - MCP server registration
`);
  process.exit(0);
}

function installCommands(isGlobal) {
  const src = path.join(__dirname, '..');
  const configDir = expandTilde(explicitConfigDir) || expandTilde(process.env.QWEN_CONFIG_DIR);
  const globalDir = configDir || path.join(os.homedir(), '.qwen');
  const qwenDir = isGlobal ? globalDir : path.join(process.cwd(), '.qwen');
  const cmdsDest = path.join(qwenDir, 'commands', 'qwen-base');
  const baseDest = path.join(qwenDir, 'base');

  const locationLabel = isGlobal
    ? qwenDir.replace(os.homedir(), '~')
    : qwenDir.replace(process.cwd(), '.');

  if (fs.existsSync(baseDest) || fs.existsSync(cmdsDest)) {
    console.log(`  ${yellow}Existing installation found at ${locationLabel}${reset}`);
    console.log(`  Updating...`);
    if (fs.existsSync(baseDest)) fs.rmSync(baseDest, { recursive: true, force: true });
    if (fs.existsSync(cmdsDest)) fs.rmSync(cmdsDest, { recursive: true, force: true });
  }

  console.log(`  Installing to ${cyan}${locationLabel}${reset}\n`);

  // Copy framework
  if (fs.existsSync(path.join(src, 'src', 'framework'))) {
    copyDir(path.join(src, 'src', 'framework'), path.join(baseDest, 'framework'));
  }
  // Copy commands
  if (fs.existsSync(path.join(src, 'src', 'commands'))) {
    copyDir(path.join(src, 'src', 'commands'), cmdsDest);
    console.log(`  ${green}+${reset} commands/qwen-base/ (${countFiles(cmdsDest)} commands)`);
  }
  // Copy skill entry point
  if (fs.existsSync(path.join(src, 'src', 'skill'))) {
    copyDir(path.join(src, 'src', 'skill'), path.join(baseDest, 'skill'));
    // Also copy to .qwen/skill/base/ (matching original .claude/skills/base/)
    const skillDest = path.join(qwenDir, 'skill', 'base');
    copyDir(path.join(src, 'src', 'skill'), skillDest);
    // Copy MCP package sources into skill (for scaffold reference)
    const skillMcpDest = path.join(skillDest, 'packages', 'base-mcp');
    copyDir(path.join(src, 'src', 'packages', 'base-mcp'), skillMcpDest);
    // Also to framework for scaffold
    const fwMcpDest = path.join(baseDest, 'framework', 'packages', 'base-mcp');
    copyDir(path.join(src, 'src', 'packages', 'base-mcp'), fwMcpDest);
    console.log(`  ${green}+${reset} skill/base/ (entry point + MCP package)`);
  }
  // Copy hooks to framework
  if (fs.existsSync(path.join(src, 'src', 'hooks'))) {
    const hooksDest = path.join(baseDest, 'framework', 'hooks');
    copyDir(path.join(src, 'src', 'hooks'), hooksDest);
  }
  // Copy MCP package sources
  if (fs.existsSync(path.join(src, 'src', 'packages', 'base-mcp'))) {
    const mcpDest = path.join(baseDest, 'framework', 'packages', 'base-mcp');
    copyDir(path.join(src, 'src', 'packages', 'base-mcp'), mcpDest);
  }
  console.log(`  ${green}+${reset} base/ (framework files)`);
  console.log('');
}

function installWorkspace() {
  const src = path.join(__dirname, '..');
  const workspaceDir = process.cwd();
  const baseDir = path.join(workspaceDir, '.base');

  console.log(`  Installing workspace layer to ${cyan}${baseDir.replace(os.homedir(), '~')}${reset}\n`);

  // Create directories
  for (const dir of ['data', 'hooks', 'grooming', 'audits', 'schemas']) {
    fs.mkdirSync(path.join(baseDir, dir), { recursive: true });
  }
  console.log(`  ${green}+${reset} .base/data/`);
  console.log(`  ${green}+${reset} .base/hooks/`);
  console.log(`  ${green}+${reset} .base/grooming/`);
  console.log(`  ${green}+${reset} .base/audits/`);
  console.log(`  ${green}+${reset} .base/schemas/`);

  // Initialize JSON data surfaces
  const dataSurfaces = {
    'projects.json': { version: 1, workspace: '', last_modified: null, categories: [], items: [], archived: [] },
    'entities.json': { entities: [], last_updated: null },
    'state.json': { drift_score: 0, areas: {}, last_groom: null, last_updated: null },
    'psmm.json': { sessions: {} },
    'staging.json': { proposals: [] }
  };
  let surfaceCount = 0;
  for (const [filename, data] of Object.entries(dataSurfaces)) {
    if (!fs.existsSync(path.join(baseDir, 'data', filename))) {
      fs.writeFileSync(path.join(baseDir, 'data', filename), JSON.stringify(data, null, 2));
      surfaceCount++;
    }
  }
  if (surfaceCount > 0) {
    console.log(`  ${green}+${reset} .base/data/ (${surfaceCount} JSON surfaces initialized)`);
  }

  // Copy workspace.json template
  const workspaceJsonSrc = path.join(src, 'src', 'templates', 'workspace.json');
  if (!fs.existsSync(path.join(baseDir, 'workspace.json')) && fs.existsSync(workspaceJsonSrc)) {
    const template = JSON.parse(fs.readFileSync(workspaceJsonSrc, 'utf-8'));
    template.workspace = path.basename(workspaceDir);
    template.created = new Date().toISOString().split('T')[0];
    fs.writeFileSync(path.join(baseDir, 'workspace.json'), JSON.stringify(template, null, 2));
    console.log(`  ${green}+${reset} .base/workspace.json (manifest)`);
  }

  // Copy operator.json
  const operatorSrc = path.join(src, 'src', 'templates', 'operator.json');
  if (!fs.existsSync(path.join(baseDir, 'operator.json')) && fs.existsSync(operatorSrc)) {
    fs.copyFileSync(operatorSrc, path.join(baseDir, 'operator.json'));
    console.log(`  ${green}+${reset} .base/operator.json (operator profile)`);
  }

  // Copy schemas
  const schemasSrc = path.join(src, 'src', 'schemas');
  if (fs.existsSync(schemasSrc)) {
    const files = fs.readdirSync(schemasSrc).filter(f => f.endsWith('.json'));
    for (const f of files) {
      fs.copyFileSync(path.join(schemasSrc, f), path.join(baseDir, 'schemas', f));
    }
    console.log(`  ${green}+${reset} .base/schemas/ (${files.length} validation schemas)`);
  }

  // Copy hooks
  const hooksSrc = path.join(src, 'src', 'hooks');
  if (fs.existsSync(hooksSrc)) {
    const hookFiles = fs.readdirSync(hooksSrc).filter(f => f.endsWith('.py'));
    for (const f of hookFiles) {
      fs.copyFileSync(path.join(hooksSrc, f), path.join(baseDir, 'hooks', f));
    }
    console.log(`  ${green}+${reset} .base/hooks/ (${hookFiles.length} hooks)`);
  }

  // Copy base-mcp
  const mcpSrc = path.join(src, 'src', 'packages', 'base-mcp');
  const mcpDest = path.join(baseDir, 'base-mcp');
  if (fs.existsSync(mcpSrc)) {
    copyDir(mcpSrc, mcpDest);
    console.log(`  ${green}+${reset} .base/base-mcp/`);
    try {
      execSync('npm install --production --silent', { cwd: mcpDest, stdio: 'pipe' });
      console.log(`  ${green}+${reset} base-mcp dependencies installed`);
    } catch (e) {
      console.log(`  ${yellow}!${reset} base-mcp npm install failed — run cd .base/base-mcp && npm install${reset}`);
    }
  }

  // Register MCP in .mcp.json
  const mcpJsonPath = path.join(workspaceDir, '.mcp.json');
  let mcpConfig = {};
  if (fs.existsSync(mcpJsonPath)) {
    try { mcpConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf-8')); } catch (e) {}
  }
  if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {};
  mcpConfig.mcpServers['base-mcp'] = { type: 'stdio', command: 'node', args: ['./.base/base-mcp/index.js'] };
  fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 2));
  console.log(`  ${green}+${reset} .mcp.json (base-mcp registered)`);

  console.log(`\n  ${green}Workspace layer installed.${reset}\n`);
}

function promptLocation() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const configDir = expandTilde(explicitConfigDir) || expandTilde(process.env.QWEN_CONFIG_DIR);
  const globalPath = configDir || path.join(os.homedir(), '.qwen');
  const globalLabel = globalPath.replace(os.homedir(), '~');

  console.log(`  ${yellow}What would you like to install?${reset}

  ${cyan}1${reset}) Full install  ${dim}(commands to ${globalLabel} + workspace layer to .base/)${reset}
  ${cyan}2${reset}) Commands only  ${dim}(${globalLabel})${reset}
  ${cyan}3${reset}) Workspace only ${dim}(.base/ in current directory)${reset}
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    rl.close();
    const choice = answer.trim() || '1';
    if (choice === '1' || choice === '2') installCommands(true);
    if (choice === '1' || choice === '3') installWorkspace();
    if (!['1','2','3'].includes(choice)) { installCommands(true); installWorkspace(); }
    console.log(`  ${green}Done!${reset} Open Qwen Code and type ${cyan}/base${reset} to start.\n`);
  });
}

if (hasGlobal && hasLocal) {
  console.error(`  ${yellow}Cannot specify both --global and --local${reset}`);
  process.exit(1);
} else if (hasGlobal || hasLocal || hasWorkspace) {
  if (hasGlobal || hasLocal) installCommands(hasGlobal);
  if (hasWorkspace) installWorkspace();
  console.log(`  ${green}Done!${reset} Open Qwen Code and type ${cyan}/base${reset} to start.\n`);
} else {
  promptLocation();
}
