export type Log = {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error';
};
