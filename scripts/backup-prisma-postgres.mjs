import { appendFile, chmod, mkdir, readFile, readdir, stat, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backupDir = join(projectRoot, "var", "backups", "prisma-postgres");
const logPath = join(projectRoot, "var", "log", "prisma-postgres-backup.log");
const retentionDays = Number(process.env.OFERTAS_RADAR_BACKUP_RETENTION_DAYS ?? "14");

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
}

function fromEnvFile(contents) {
  const line = contents.split(/\r?\n/).find((entry) => /^\s*DATABASE_URL\s*=/.test(entry));
  if (!line) return "";
  const value = line.replace(/^\s*DATABASE_URL\s*=\s*/, "").trim();
  return (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))
    ? value.slice(1, -1)
    : value;
}

async function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try { return fromEnvFile(await readFile(join(projectRoot, ".env.local"), "utf8")); }
  catch { return ""; }
}

async function log(message) {
  await mkdir(dirname(logPath), { recursive: true, mode: 0o700 });
  await appendFile(logPath, `[${new Date().toISOString()}] ${message}\n`, { mode: 0o600 });
}

function runDump(databaseUrl, outputPath) {
  return new Promise((resolveRun, reject) => {
    const child = spawn("pg_dump", ["--format=plain", "--no-owner", "--no-privileges", "--file", outputPath, databaseUrl], {
      stdio: ["ignore", "ignore", "pipe"]
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolveRun() : reject(new Error(stderr.trim() || `pg_dump terminó con código ${code}`)));
  });
}

const databaseUrl = await getDatabaseUrl();
if (!databaseUrl) {
  const error = "No se encontró DATABASE_URL en el entorno ni en .env.local.";
  await log(`ERROR: ${error}`);
  throw new Error(error);
}

await mkdir(backupDir, { recursive: true, mode: 0o700 });
const outputPath = join(backupDir, `ofertas-radar-${timestamp()}.sql`);
try {
  await runDump(databaseUrl, outputPath);
  await chmod(outputPath, 0o600);
  const cutoff = Date.now() - retentionDays * 86_400_000;
  const names = (await readdir(backupDir)).filter((name) => name.startsWith("ofertas-radar-") && name.endsWith(".sql"));
  await Promise.all((await Promise.all(names.map(async (name) => ({ name, modifiedAt: (await stat(join(backupDir, name))).mtimeMs }))))
    .filter(({ modifiedAt }) => modifiedAt < cutoff)
    .map(({ name }) => unlink(join(backupDir, name))));
  const message = `OK: backup SQL creado en ${outputPath}`;
  await log(message);
  console.log(message);
} catch (error) {
  await unlink(outputPath).catch(() => {});
  const message = error instanceof Error ? error.message : "Error desconocido durante pg_dump";
  await log(`ERROR: ${message}`);
  throw new Error(`No se pudo crear el backup SQL: ${message}`);
}
