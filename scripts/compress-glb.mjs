#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const getArgValue = (name, fallback) => {
  const idx = args.findIndex((a) => a === name || a.startsWith(`${name}=`));
  if (idx === -1) return fallback;
  const arg = args[idx];
  if (arg.includes("=")) return arg.split("=").slice(1).join("=");
  return args[idx + 1] ?? fallback;
};

const help = hasFlag("--help") || hasFlag("-h");
if (help) {
  console.log(`Usage: node scripts/compress-glb.mjs [options]

Options:
  --dir <path>       Directory to scan (default: public/models)
  --in-place         Replace original files only if compressed file is smaller
  --skip-textures    Keep source texture format (skip webp conversion)
  --help, -h         Show help

Examples:
  node scripts/compress-glb.mjs
  node scripts/compress-glb.mjs --dir public/models/weapons
  node scripts/compress-glb.mjs --in-place
`);
  process.exit(0);
}

const rootDir = process.cwd();
const scanDir = path.resolve(rootDir, getArgValue("--dir", "public/models"));
const inPlace = hasFlag("--in-place");
const skipTextures = hasFlag("--skip-textures");

async function collectGlbFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectGlbFiles(full));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith(".glb")) continue;
    if (entry.name.toLowerCase().endsWith(".opt.glb")) continue;
    files.push(full);
  }
  return files;
}

function spawnTool(command, commandArgs) {
  return spawnSync(command, commandArgs, { stdio: "pipe", encoding: "utf8" });
}

function baseOptimizeArgs(inputFile, outputFile, includeTextureCompress) {
  const cmdArgs = [
    "optimize",
    inputFile,
    outputFile,
    "--compress",
    "meshopt",
    "--prune",
    "--weld",
    "--texture-size",
    "2048",
  ];

  if (includeTextureCompress) {
    cmdArgs.push("--texture-compress", "webp");
  }

  return cmdArgs;
}

function isSuccess(result) {
  return result.status === 0 && !result.error;
}

function runGltfTransform(inputFile, outputFile) {
  const localExe = process.platform === "win32" ? "gltf-transform.cmd" : "gltf-transform";

  const tryRun = (includeTextureCompress) => {
    const optimizeArgs = baseOptimizeArgs(inputFile, outputFile, includeTextureCompress);

    // 1) Try local binary (node_modules/.bin via npm scripts PATH)
    let result = spawnTool(localExe, optimizeArgs);
    if (isSuccess(result)) {
      return { ok: true, result, usedNpmExec: false, usedTextureCompress: includeTextureCompress };
    }

    // 2) Fallback to npm exec through npm-cli.js (works cross-platform from npm scripts)
    if (result.error || result.status === null) {
      const npmCli = process.env.npm_execpath;
      if (npmCli) {
        const npmExecArgs = [npmCli, "exec", "--yes", "@gltf-transform/cli", "--", ...optimizeArgs];
        result = spawnTool(process.execPath, npmExecArgs);
        if (isSuccess(result)) {
          return { ok: true, result, usedNpmExec: true, usedTextureCompress: includeTextureCompress };
        }
        return { ok: false, result, usedNpmExec: true, usedTextureCompress: includeTextureCompress };
      }
      return { ok: false, result, usedNpmExec: false, usedTextureCompress: includeTextureCompress };
    }

    return { ok: false, result, usedNpmExec: false, usedTextureCompress: includeTextureCompress };
  };

  const firstTry = tryRun(!skipTextures);
  if (firstTry.ok) return firstTry;

  // Retry without texture compression when WebP pipeline is unavailable.
  if (!skipTextures && firstTry.usedTextureCompress) {
    const secondTry = tryRun(false);
    if (secondTry.ok) {
      return { ...secondTry, retriedWithoutTextures: true };
    }
    return { ...secondTry, retriedWithoutTextures: true, firstFailure: firstTry.result };
  }

  return firstTry;
}

async function fileSize(filePath) {
  const stat = await fs.stat(filePath);
  return stat.size;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function prettyBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = units[0];
  for (let i = 1; i < units.length && value >= 1024; i += 1) {
    value /= 1024;
    unit = units[i];
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`;
}

function printFailure(prefix, result) {
  console.error(prefix);
  if (result?.error?.message) console.error(result.error.message);
  if (result?.stderr?.trim()) console.error(result.stderr.trim());
  if (result?.stdout?.trim()) console.error(result.stdout.trim());
}

async function main() {
  try {
    await fs.access(scanDir);
  } catch {
    console.error(`[glb:compress] Directory not found: ${scanDir}`);
    process.exit(1);
  }

  const glbFiles = await collectGlbFiles(scanDir);
  if (glbFiles.length === 0) {
    console.log(`[glb:compress] No .glb files found in ${scanDir}`);
    return;
  }

  console.log(`[glb:compress] Found ${glbFiles.length} .glb file(s) in ${scanDir}`);

  let totalBefore = 0;
  let totalAfter = 0;
  let improved = 0;
  let failures = 0;

  for (const inputFile of glbFiles) {
    const outputFile = inPlace
      ? `${inputFile}.tmp-opt.glb`
      : inputFile.replace(/\.glb$/i, ".opt.glb");

    const before = await fileSize(inputFile);
    totalBefore += before;

    const run = runGltfTransform(inputFile, outputFile);
    if (!run.ok) {
      failures += 1;
      console.error(`\n[glb:compress] Failed: ${inputFile}`);
      printFailure("[glb:compress] Error details:", run.result);
      if (run.retriedWithoutTextures && run.firstFailure) {
        printFailure("[glb:compress] First attempt (with --texture-compress webp) also failed:", run.firstFailure);
      }
      totalAfter += before;
      if (await exists(outputFile)) await fs.unlink(outputFile);
      continue;
    }

    if (run.retriedWithoutTextures) {
      console.log(`[glb:compress] ${path.relative(rootDir, inputFile)}: texture compression unavailable, kept original textures.`);
    }

    const after = await fileSize(outputFile);

    if (inPlace) {
      if (after < before) {
        await fs.rename(outputFile, inputFile);
        totalAfter += after;
        improved += 1;
        const gain = (((before - after) / before) * 100).toFixed(1);
        console.log(`[glb:compress] ${path.relative(rootDir, inputFile)}: ${prettyBytes(before)} -> ${prettyBytes(after)} (-${gain}%)`);
      } else {
        await fs.unlink(outputFile);
        totalAfter += before;
        console.log(`[glb:compress] ${path.relative(rootDir, inputFile)}: no gain (${prettyBytes(before)})`);
      }
    } else {
      totalAfter += after;
      if (after < before) improved += 1;
      const gain = (((before - after) / before) * 100).toFixed(1);
      console.log(`[glb:compress] ${path.relative(rootDir, inputFile)} -> ${path.relative(rootDir, outputFile)}: ${prettyBytes(before)} -> ${prettyBytes(after)} (${gain.startsWith("-") ? "" : "-"}${gain}%)`);
    }
  }

  const deltaPct = totalBefore > 0 ? (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1) : "0.0";
  console.log(`\n[glb:compress] Done.`);
  console.log(`[glb:compress] Files improved: ${improved}/${glbFiles.length}`);
  if (failures > 0) console.log(`[glb:compress] Failures: ${failures}`);
  console.log(`[glb:compress] Total: ${prettyBytes(totalBefore)} -> ${prettyBytes(totalAfter)} (${deltaPct.startsWith("-") ? "" : "-"}${deltaPct}%)`);

  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("[glb:compress] Unexpected error:", error);
  process.exit(1);
});
