import { loadStytch } from '@stytch/nextjs';
import * as stytch from 'stytch';

let client: stytch.Client;

const stytchEnv = stytch.envs.test;

const stytchClient = loadStytch();

export { stytchClient };
