/**
 * VESTORA — Structured Logger
 */

declare const process: { env: { NODE_ENV?: string } };

type LogLevel = "debug" | "info" | "warn" | "error";

export class Logger {
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  private format(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString().split("T")[1].replace("Z", "");
    return `[VESTORA:${this.namespace}] ${timestamp} [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
      console.debug(this.format("debug", message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.info(this.format("info", message), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.format("warn", message), ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.format("error", message), ...args);
  }
}
