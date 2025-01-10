import { spawn as bunSpawn, type Subprocess } from "bun";
import { Readable } from "node:stream";

export type Spawn = ReturnType<typeof spawn>;
export const spawn = (
  arg: {
    cmd: string;
    cwd?: string;
    log?: false | { max_lines: number };
    restart_on_exit?: boolean;
    onRestart?: (arg: {
      exit_code?: number;
      new_process: Subprocess;
    }) => void | Promise<void>;
    ipc?(message: any, subprocess: Subprocess): void;
  } & (
    | {
        onMessage: (arg: {
          from: "stdout" | "stderr";
          text: string;
          raw: string;
        }) => void;
        mode?: "pipe";
      }
    | {
        mode?: "passthrough";
      }
  )
) => {
  const log = {
    lines: 0,
    text: [] as string[],
  };

  async function processStream(
    stream: AsyncIterable<Buffer>,
    from: "stderr" | "stdout"
  ) {
    for await (const x of stream) {
      const buf = x as Buffer;
      const raw = buf.toString("utf-8");
      const text = raw
        .trim()
        .replace(
          /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
          ""
        );

      if (arg.log) {
        log.lines += 1;
        log.text.push(text);
        if (log.lines > arg.log.max_lines) {
          log.text.shift();
        }
      }

      const on_msg = (arg as any).onMessage;
      if (arg.mode !== "passthrough" && on_msg) {
        on_msg({ from: from, text, raw });
      }
    }
  }

  const is_piped = arg.mode === "pipe" || !arg.mode;
  const createProc = () => {
    const proc = bunSpawn({
      cmd: arg.cmd.split(" "),
      cwd: arg.cwd,
      env: { ...process.env, FORCE_COLOR: "1" },
      ...(is_piped
        ? { stderr: "pipe", stdout: "pipe" }
        : { stderr: "inherit", stdout: "inherit" }),
      ...(arg.ipc ? { ipc: arg.ipc } : undefined),
    });

    if (is_piped) {
      const stdout = Readable.fromWeb(proc.stdout as any);
      const stderr = Readable.fromWeb(proc.stderr as any);
      processStream(stdout, "stdout");
      processStream(stderr, "stderr");
    }
    return proc;
  };
  const proc = createProc();

  const result = {
    process: proc,
    exited: proc.exited,
    log,
  };

  if (arg.restart_on_exit) {
    proc.exited.then(async (exit_code) => {
      const new_spawn = spawn(arg);

      if (arg.onRestart) {
        await arg.onRestart({ exit_code, new_process: new_spawn.process });
      }
    });
  }

  return result;
};
