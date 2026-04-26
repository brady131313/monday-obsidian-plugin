import { copyFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_OBSIDIAN_CONFIG_DIR = "/mnt/c/Users/Brady/Documents/Test/.obsidian";
const REQUIRED_ARTIFACTS = ["main.js", "manifest.json"];
const OPTIONAL_ARTIFACTS = ["styles.css"];

const repoRoot = process.cwd();
const obsidianConfigDir = process.env.OBSIDIAN_CONFIG_DIR ?? DEFAULT_OBSIDIAN_CONFIG_DIR;
const manifestPath = path.join(repoRoot, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

if (typeof manifest.id !== "string" || manifest.id.length === 0) {
	throw new Error("manifest.json must define a non-empty plugin id.");
}

const pluginDir = path.join(obsidianConfigDir, "plugins", manifest.id);
const pluginsDir = path.dirname(pluginDir);

if (!existsSync(obsidianConfigDir)) {
	throw new Error(`Obsidian config directory does not exist: ${obsidianConfigDir}`);
}

for (const artifact of REQUIRED_ARTIFACTS) {
	const sourcePath = path.join(repoRoot, artifact);
	if (!existsSync(sourcePath)) {
		throw new Error(`Missing ${artifact}. Run npm run build before copying test plugin artifacts.`);
	}
}

await mkdir(pluginsDir, { recursive: true });
await mkdir(pluginDir, { recursive: true });

for (const artifact of REQUIRED_ARTIFACTS) {
	await copyArtifact(artifact);
}

for (const artifact of OPTIONAL_ARTIFACTS) {
	if (existsSync(path.join(repoRoot, artifact))) {
		await copyArtifact(artifact);
	}
}

console.log(`Copied plugin artifacts to ${pluginDir}`);

async function copyArtifact(artifact) {
	await copyFile(path.join(repoRoot, artifact), path.join(pluginDir, artifact));
}
