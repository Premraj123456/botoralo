import { loadStytch } from '@stytch/nextjs/server';
import * as stytch from 'stytch';

let client: stytch.Client;

const stytchEnv = stytch.envs.test;

const stytchClient = loadStytch();

export { stytchClient };
