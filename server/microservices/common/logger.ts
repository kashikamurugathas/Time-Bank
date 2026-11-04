export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class ServiceLogger {
  constructor(private serviceName: string) {}

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${this.serviceName.toUpperCase()}] [${level.toUpperCase()}]: ${message}${metaStr}`;
  }

  info(message: string, meta?: any) {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: any) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, meta?: any) {
    console.error(this.formatMessage('error', message, meta));
  }

  debug(message: string, meta?: any) {
    if (process.env.DEBUG === 'true') {
      console.log(this.formatMessage('debug', message, meta));
    }
  }
}

export function createLogger(serviceName: string): ServiceLogger {
  return new ServiceLogger(serviceName);
}
