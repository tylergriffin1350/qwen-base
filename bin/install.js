#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const green = '\x1b[32m';
const cyan = '\x1b[36m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

const pkg = require('../package.json');

const banner = `
${green}  \u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557
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
const hasHelp = args.includes('--help') || args.includes('-h');
const skipTools = args.includes('--skip-tools');

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
  if (configDirArg) return configDirArg.split('=')[1];
  return null;
}

const explicitConfigDir = parseConfigDirArg();

function expandTilde(filePath) {
  if (filePath && filePath.startsWith('~/')) return path.join(os.homedir(), filePath.slice(2));
  return filePath;
}

function copyDir(srcDir, destDir, skipDirs = []) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (skipDirs.includes(entry.name)) continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath, skipDirs);
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
    ${cyan}-g, --global${reset}              Install globally (to Qwen config directory)
    ${cyan}-l, --local${reset}               Install locally (to ./.qwen/ in current directory)
    ${cyan}-c, --config-dir <path>${reset}   Specify custom Qwen config directory
    ${cyan}--skip-tools${reset}              Skip OSS analysis tool installation
    ${cyan}-h, --help${reset}                Show this help message

  ${yellow}Examples:${reset}
    ${dim}# Install globally (recommended)${reset}
    npx qwen-base --global

    ${dim}# Install to current project only${reset}
    npx qwen-base --local

  ${yellow}What gets installed:${reset}
    ${cyan}commands/qwen-base/${reset}       11 slash commands
    ${cyan}base/                            Framework (core, transform, domains, schemas, rules, tools)
`);
  process.exit(0);
}

function install(isGlobal) {
  const src = path.join(__dirname, '..');
  const configDir = expandTilde(explicitConfigDir) || expandTilde(process.env.QWEN_CONFIG_DIR);
  const globalDir = configDir || path.join(os.homedir(), '.qwen');
  const qwenDir = isGlobal ? globalDir : path.join(process.cwd(), '.qwen');
  const aegisDest = path.join(qwenDir, 'aegis');
  const cmdsDest = path.join(qwenDir, 'commands', 'qwen-base');

  const locationLabel = isGlobal
    ? qwenDir.replace(os.homedir(), '~')
    : qwenDir.replace(process.cwd(), '.');

  if (fs.existsSync(aegisDest) || fs.existsSync(cmdsDest)) {
    console.log(`  ${yellow}Existing installation found at ${locationLabel}${reset}`);
    console.log(`  Updating...`);
    if (fs.existsSync(aegisDest)) fs.rmSync(aegisDest, { recursive: true, force: true });
    if (fs.existsSync(cmdsDest)) fs.rmSync(cmdsDest, { recursive: true, force: true });
  }

  console.log(`  Installing to ${cyan}${locationLabel}${reset}\n`);

  // Copy framework (note: BASE uses 'src/' structure)
  if (fs.existsSync(path.join(src, 'src'))) {
    copyDir(path.join(src, 'src'), path.join(qwenDir, 'base'));
    console.log(`  ${green}+${reset} base/ ${dim}(${countFiles(path.join(qwenDir, 'base'))} framework files)${reset}`);
  }

  // Copy commands
  if (fs.existsSync(path.join(src, 'src', 'commands'))) {
    fs.mkdirSync(cmdsDest, { recursive: true });
    copyDir(path.join(src, 'src', 'commands'), cmdsDest);
    console.log(`  ${green}+${reset} commands/qwen-base/ ${dim}(${countFiles(cmdsDest)} commands)${reset}`);
  }

  console.log(`
  ${green}Done!${reset} Open Qwen Code and type ${cyan}/base${reset} to start.
`);
}

function promptLocation() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const configDir = expandTilde(explicitConfigDir) || expandTilde(process.env.QWEN_CONFIG_DIR);
  const globalPath = configDir || path.join(os.homedir(), '.qwen');
  const globalLabel = globalPath.replace(os.homedir(), '~');

  console.log(`  ${yellow}Where would you like to install?${reset}

  ${cyan}1${reset}) Global ${dim}(${globalLabel})${reset} - available in all projects
  ${cyan}2${reset}) Local  ${dim}(./.qwen)${reset} - this project only
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    rl.close();
    install(answer.trim() !== '2');
  });
}

if (hasGlobal && hasLocal) {
  console.error(`  ${yellow}Cannot specify both --global and --local${reset}`);
  process.exit(1);
} else if (explicitConfigDir && hasLocal) {
  console.error(`  ${yellow}Cannot use --config-dir with --local${reset}`);
  process.exit(1);
} else if (hasGlobal) {
  install(true);
} else if (hasLocal) {
  install(false);
} else {
  promptLocation();
}
