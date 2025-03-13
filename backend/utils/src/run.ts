import { spawn, type ChildProcess, type SpawnOptions } from "child_process";
import { dir } from "./dir";

// Track running processes by command
export const running: Record<string, ChildProcess> = {};

export const run = async (
  command: string,
  arg?: {
    mode: "passthrough" | "pipe" | "silent";
    pipe?: (output: string) => string;
    cwd?: string;
  }
) => {
  return new Promise<void>((resolve, reject) => {
    // Split command into command and args
    const [cmd, ...args] = command.split(" ").filter(Boolean);
    
    if (!cmd) {
      reject(new Error("Command cannot be empty"));
      return;
    }

    // Configure spawn options based on mode
    const spawnOptions: SpawnOptions = {
      shell: true,
      stdio: arg?.mode === "passthrough" ? "inherit" : "pipe",
      cwd: arg?.cwd ? dir.path(arg.cwd) : process.cwd(),
    };

    // Create child process
    const proc: ChildProcess = spawn(cmd, args, spawnOptions);

    // Add to running processes
    running[command] = proc;

    // Handle output based on mode
    if (arg?.mode !== "passthrough" && proc.stdout && proc.stderr) {
      proc.stdout.on("data", (data: Buffer) => {
        const output = data.toString();
        if (arg?.mode === "pipe" && arg.pipe) {
          const transformed = arg.pipe(output);
          process.stdout.write(transformed);
        }
      });

      proc.stderr.on("data", (data: Buffer) => {
        const output = data.toString();
        if (arg?.mode === "pipe" && arg.pipe) {
          const transformed = arg.pipe(output);
          process.stderr.write(transformed);
        }
      });
    }

    // Handle process exit
    proc.on("close", (code: number | null) => {
      delete running[command];
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    // Handle process error
    proc.on("error", (err: Error) => {
      delete running[command];
      reject(err);
    });
  });
};
