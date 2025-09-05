import { loadStytch } from '@stytch/nextjs/server';
import * as stytch from 'stytch';

let stytchClient: stytch.Client;

const loadStytchClient = () => {
  if (!stytchClient) {
    const stytchEnv = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN!.startsWith('public-token-test')
      ? stytch.envs.test
      : stytch.envs.live;
    
    stytchClient = new stytch.Client({
      project_id: process.env.NEXT_PUBLIC_STYTCH_PROJECT_ID!,
      secret: process.env.STYTCH_SECRET!,
      env: stytchEnv,
    });
  }
  return stytchClient;
};

export { loadStytchClient };
