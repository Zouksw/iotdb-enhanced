declare module 'ioredis' {
  import { EventEmitter } from 'events';

  export interface RedisOptions {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number;
    retryStrategy?: (times: number) => number | void;
    enableReadyCheck?: boolean;
    enableOfflineQueue?: boolean;
    connectionTimeout?: number;
  }

  export default class Redis extends EventEmitter {
    constructor(options?: RedisOptions);
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<'OK'>;
    del(...keys: string[]): Promise<number>;
    quit(): Promise<'OK'>;
    disconnect(): void;
    flushall(): Promise<'OK'>;
    flushdb(): Promise<'OK'>;
    readonly status: string;
  }
}
