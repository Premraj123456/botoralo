import type { Bot, Log } from './types';

export const bots: Bot[] = [
  {
    id: 'bot-1',
    name: 'ETH/BTC Arbitrage Bot',
    status: 'running',
    ramUsage: 96,
    ramMax: 128,
    uptime: '72d 4h 12m',
    code: `const ccxt = require('ccxt');

async function main() {
  const exchange = new ccxt.binance();
  while(true) {
    try {
      const ticker = await exchange.fetchTicker('ETH/BTC');
      console.log('Current ETH/BTC price:', ticker.last);
      // Arbitrage logic here...
    } catch (e) {
      console.error(e);
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

main();`,
  },
  {
    id: 'bot-2',
    name: 'SOL Trend Follower',
    status: 'stopped',
    ramUsage: 0,
    ramMax: 512,
    uptime: '0s',
    code: `// Trading bot for Solana
console.log("Initializing Solana Trend Follower Bot...");
function checkTrend() {
  // Complex trend analysis
  console.log("Analyzing SOL/USDT market trends...");
}
// setInterval(checkTrend, 60000); // Bot is currently stopped
console.log("Bot stopped.");`,
  },
  {
    id: 'bot-3',
    name: 'DCA Bot',
    status: 'error',
    ramUsage: 45,
    ramMax: 128,
    uptime: '1h 30m',
    code: `// Dollar Cost Averaging Bot
const API_KEY = "YOUR_API_KEY"; // Error: API key is not set
if (!API_KEY.startsWith('sk-')) {
    throw new Error("Invalid API Key format.");
}
console.log("DCA bot running...");`,
  },
  {
    id: 'bot-4',
    name: 'Grid Trading Bot - ADA',
    status: 'running',
    ramUsage: 256,
    ramMax: 1024,
    uptime: '12d 8h',
    code: `// Grid trading bot for Cardano
console.log("ADA Grid Trader started.");
let grids = 10;
for(let i=0; i<grids; i++){
    console.log(\`Setting up grid level \${i+1}\`);
}
`,
  },
];

export const logs: { [key: string]: Log[] } = {
  'bot-1': [
    { id: 'l1-1', timestamp: '2023-10-27 10:00:00', level: 'info', message: 'Bot started successfully.' },
    { id: 'l1-2', timestamp: '2023-10-27 10:00:05', level: 'info', message: 'Current ETH/BTC price: 0.058' },
    { id: 'l1-3', timestamp: '2023-10-27 10:00:10', level: 'info', message: 'Current ETH/BTC price: 0.059' },
    { id: 'l1-4', timestamp: '2023-10-27 10:00:15', level: 'warn', message: 'API latency high: 1200ms' },
  ],
  'bot-2': [
    { id: 'l2-1', timestamp: '2023-10-26 14:00:00', level: 'info', message: 'Initializing Solana Trend Follower Bot...' },
    { id: 'l2-2', timestamp: '2023-10-26 14:00:05', level: 'info', message: 'Bot stopped by user.' },
  ],
  'bot-3': [
    { id: 'l3-1', timestamp: '2023-10-27 08:30:00', level: 'info', message: 'DCA bot starting...' },
    { id: 'l3-2', timestamp: '2023-10-27 08:30:01', level: 'error', message: 'Uncaught Error: Invalid API Key format.' },
    { id: 'l3-3', timestamp: '2023-10-27 08:30:01', level: 'info', message: 'Bot restarting...' },
    { id: 'l3-4', timestamp: '2023-10-27 08:30:05', level: 'error', message: 'Uncaught Error: Invalid API Key format.' },
  ],
  'bot-4': [
    { id: 'l4-1', timestamp: '2023-10-15 00:00:00', level: 'info', message: 'ADA Grid Trader started.'},
    { id: 'l4-2', timestamp: '2023-10-15 00:00:01', level: 'info', message: 'Setting up grid level 1'},
    { id: 'l4-3', timestamp: '2023-10-15 00:00:02', level: 'info', message: 'Setting up grid level 2'},
  ]
};
