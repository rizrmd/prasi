import { spawn, type Subprocess, type SystemError } from "bun";
import { dir } from "./dir";
import { g } from "server/utils/global";

type StdioOption = "inherit" | "pipe" | "ignore";
type StdioTuple = [StdioOption, StdioOption, StdioOption];

interface SpawnConfig {
  stdio: StdioTuple;
  cwd?: string;
  env?: Record<string, string>;
  ipc?: (message: unknown, subprocess: Subprocess) => void;
}

// Track running processes by command
export const running = new Map<string, Subprocess>();

// Kill all running subprocesses and wait for them to exit
export const cleanup = async () => {
  const procs = Array.from(running.values());
  if (procs.length === 0) return;

  // Kill all running processes
  procs.forEach((p) => p.kill());
  // Wait for all processes to exit
  await Promise.all(procs.map((p) => p.exited));
  // Clear the running map
  running.clear();
};

// Synchronous cleanup for process.exit
const cleanupSync = () => {
  const procs = Array.from(running.values());
  if (procs.length === 0) return;

  // Kill all running processes immediately
  procs.forEach((p) => p.kill());
  running.clear();
};

// Set up process signal handlers
["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal, async () => {
    g.shutting_down = true;

    await cleanup();
    process.exit(0);
  });
});

// Ensure cleanup on normal exit (must be synchronous)
process.on("exit", () => {
  cleanupSync();
});

export const run = async (
  commandInput: string | undefined | null,
  arg?: {
    mode: "passthrough" | "pipe" | "silent";
    pipe?: (output: string) => string | void;
    cwd?: string;
    started?: (proc: Subprocess) => void;
    stdin?: "ignore" | "pipe" | "inherit";
    ipc?: {
      onMessage: (message: unknown) => void;
    };
  }
) => {
  return new Promise<void>((resolve, reject) => {
    // Parse and validate the command string into executable and args
    const parseCommand = (
      rawInput: string | undefined | null
    ): [string, ...string[]] => {
      // First ensure we have a valid string
      if (typeof rawInput !== "string" || !rawInput || !rawInput.trim()) {
        throw new Error("Command must be a non-empty string");
      }

      // Now we know we have a valid string
      const input = rawInput.trim();

      const args: string[] = [];
      let current = "";
      let inQuotes = false;
      let escaped = false;

      if (input.includes("&&") || input.includes("||") || input.includes(";")) {
        throw new Error("Command chaining is not allowed");
      }

      for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (escaped && char) {
          if (!'\\"'.includes(char)) {
            throw new Error(`Invalid escape sequence: \\${char}`);
          }
          current += char;
          escaped = false;
          continue;
        }

        if (char === "\\") {
          escaped = true;
          continue;
        }

        if (char === '"' && !inQuotes) {
          inQuotes = true;
          continue;
        }

        if (char === '"' && inQuotes) {
          inQuotes = false;
          continue;
        }

        if (char === " " && !inQuotes) {
          if (current) {
            args.push(current);
            current = "";
          }
          continue;
        }

        current += char;
      }

      // Check for unclosed quotes
      if (inQuotes) {
        throw new Error("Unclosed quote in command");
      }

      // Check for trailing escape
      if (escaped) {
        throw new Error("Command ends with incomplete escape sequence");
      }

      if (current) {
        args.push(current);
      }

      // Validate resulting command
      if (args.length === 0) {
        throw new Error("Command cannot be empty");
      }

      if (args.some((arg) => arg.includes("$("))) {
        throw new Error("Command substitution is not allowed");
      }

      if (args.length === 0) {
        throw new Error("Command cannot be empty");
      }

      return [args[0], ...args.slice(1)] as [string, ...string[]];
    };

    // Parse command with validation
    let proc: Subprocess;
    let validatedCommand: string;
    try {
      const [executablePath, ...executableArgs] = parseCommand(commandInput);
      validatedCommand = executablePath;

      // Create child process with stdin/ipc handling
      const spawnOptions: SpawnConfig = {
        stdio:
          arg?.mode === "passthrough"
            ? [arg?.stdin ? arg.stdin : "ignore", "inherit", "inherit"]
            : [arg?.stdin ? arg.stdin : "ignore", "pipe", "pipe"],
        cwd: arg?.cwd ? dir.path(arg.cwd) : process.cwd(),
      };

      // Create the process with IPC handling if needed
      proc = spawn([executablePath, ...executableArgs], {
        ...spawnOptions,
        ipc: arg?.ipc
          ? (message: unknown) => {
              arg.ipc!.onMessage(message);
            }
          : undefined,
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    if (arg?.started) arg.started(proc);

    // Add to running processes
    running.set(validatedCommand, proc);

    // Ensure process is removed from running on termination
    const cleanup = () => {
      running.delete(validatedCommand);
    };

    // Handle output based on mode
    if (arg?.mode === "pipe") {
      const handleOutput = async (
        stream: ReadableStream<Uint8Array>,
        isStderr = false
      ) => {
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const output = new TextDecoder().decode(value);
            if (arg.pipe) {
              const transformed = arg.pipe(output);
              if (transformed) {
                (isStderr ? process.stderr : process.stdout).write(transformed);
              }
            }
          }
        } catch (err) {
          console.error(
            `Error handling ${isStderr ? "stderr" : "stdout"}:`,
            err
          );
        } finally {
          reader.releaseLock();
          try {
            await stream.cancel();
          } catch {
            // Ignore cancel errors
          }
        }
      };

      if (proc.stdout instanceof ReadableStream) {
        handleOutput(proc.stdout);
      }
      if (proc.stderr instanceof ReadableStream) {
        handleOutput(proc.stderr, true);
      }
    }

    // Handle process completion and cleanup
    proc.exited
      .then((code: number | null) => {
        cleanup();
        if (code === 0) {
          resolve();
        } else {
          if (!g.shutting_down) {
            console.error(
              `${commandInput}\nCommand failed with exit code ${code}`
            );
          }
          resolve();
        }
      })
      .catch((err: SystemError) => {
        cleanup();
        reject(err);
      });
  });
};
