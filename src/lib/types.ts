export type Bot = {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  ramUsage: number;
  ramMax: number;
  uptime: string;
  code: string;
};

export type Log = {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error';
};
