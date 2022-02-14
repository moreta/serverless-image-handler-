// https://github.com/Mrdev1ce/rs-shop-be/blob/bc6420345b6c29acfc062cba02246ad1b5a8dd9e/product-service/common/logger.ts#L1

export class Logger {
  constructor(private loggerName: string) {}

  private buildMessageArgs(
    level: string,
    message: string,
    data?: unknown
  ): [string, string, string, unknown] {
    const levelStr = `${level}: `
    const nameStr = `${this.loggerName}: `
    return [levelStr, nameStr, message, data]
  }

  public info(message: string, data?: unknown) {
    const level = "INFO"
    const messageArgs = this.buildMessageArgs(level, message, data)
    console.info(...messageArgs)
  }

  public error(message: string, data?: unknown) {
    const level = "ERROR"
    const messageArgs = this.buildMessageArgs(level, message, data)
    console.error(...messageArgs)
  }
}
