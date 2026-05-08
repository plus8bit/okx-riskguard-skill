import { mkdir, cp, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const packageRoot = path.join(dist, "onchain-riskguard-submission");

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`))));
  });
}

await mkdir(packageRoot, { recursive: true });
await cp(path.join(root, "skill"), path.join(packageRoot, "skill"), { recursive: true });
await cp(path.join(root, "ARCHITECTURE.md"), path.join(packageRoot, "ARCHITECTURE.md"));
await cp(path.join(root, "README.md"), path.join(packageRoot, "README.md"));
await writeFile(
  path.join(packageRoot, "SECURITY_DECLARATION.txt"),
  "I confirm that the submitted Skill code does not contain private keys, seed phrases, API keys, or other sensitive information.\n"
);

const tarPath = path.join(dist, "onchain-riskguard-submission.tar.gz");
await run("tar", ["-czf", tarPath, "-C", dist, "onchain-riskguard-submission"]);
createWriteStream(path.join(dist, ".keep")).end();
console.log(`Created ${tarPath}`);
