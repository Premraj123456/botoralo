import * as stytch from 'stytch';

let stytchClient: stytch.B2BClient;

const loadStytchClient = () => {
  if (!stytchClient) {
    const stytchEnv = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN!.startsWith('public-token-test')
      ? stytch.envs.test
      : stytch.envs.live;
    
    stytchClient = new stytch.B2BClient({
      project_id: process.env.STYTCH_PROJECT_ID!,
      secret: process.env.STYTCH_SECRET!,
      env: stytchEnv,
    });
  }
  return stytchClient;
};

export { loadStytchClient };
