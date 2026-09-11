import { spawn } from "node:child_process";
import {
  open,
  mkdir,
  readFile,
  writeFile,
  unlink,
  readlink,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
const root = fileURLToPath(new URL("../", import.meta.url)).replace(/\/$/, "");
const pidFile = resolve(root, ".cache/dev-server.pid");
async function managedPid() {
  let raw;
  try {
    raw = (await readFile(pidFile, "utf8")).trim();
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  if (!/^\d+$/.test(raw)) throw new Error("Invalid preview PID file.");
  const pid = Number(raw);
  try {
    process.kill(pid, 0);
    const [cwd, command] = await Promise.all([
      readlink(`/proc/${pid}/cwd`),
      readFile(`/proc/${pid}/cmdline`, "utf8"),
    ]);
    if (cwd !== root || !command.includes("scripts/next.ts\0dev\0"))
      throw new Error("PID belongs to another process; refusing to manage it.");
    return pid;
  } catch (error) {
    if (["ESRCH", "ENOENT"].includes(error.code)) return null;
    throw error;
  }
}
export async function stopPreview() {
  const pid = await managedPid();
  if (!pid) return false;
  process.kill(pid, "SIGTERM");
  for (let i = 0; i < 40; i++) {
    await delay(250);
    try {
      process.kill(pid, 0);
    } catch (error) {
      if (error.code === "ESRCH") {
        await unlink(pidFile).catch(() => {});
        return true;
      }
      throw error;
    }
  }
  throw new Error("Preview did not stop; inspect .cache/dev-server.log.");
}
export async function startPreview() {
  if (await managedPid()) {
    console.log("Preview is already running. See .cache/dev-server.log.");
    return;
  }
  await mkdir(resolve(root, ".cache"), { recursive: true });
  const log = await open(resolve(root, ".cache/dev-server.log"), "a");
  const child = spawn(
    process.execPath,
    ["scripts/next.ts", "dev", "code-server"],
    {
      cwd: root,
      detached: true,
      stdio: ["ignore", log.fd, log.fd],
      env: process.env,
    },
  );
  await new Promise((resolveSpawn, reject) => {
    child.once("spawn", resolveSpawn);
    child.once("error", reject);
  });
  await writeFile(pidFile, `${child.pid}\n`);
  child.unref();
  await log.close();
  console.log(
    "Preview started with detached file logging. Open your configured /absproxy/<port>/ URL.",
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const command = process.argv[2];
  try {
    if (command === "start") await startPreview();
    else if (command === "stop")
      console.log(
        (await stopPreview())
          ? "Preview stopped."
          : "No managed preview running.",
      );
    else
      throw new Error(
        "Usage: node scripts/preview.mjs start|stop (Linux/code-server).",
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
