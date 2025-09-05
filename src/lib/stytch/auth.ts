'use server';

import { cookies } from 'next/headers';
import { loadStytchClient } from './server';
import { getStytchSession } from '@stytch/nextjs/server';

export const getCurrentUser = async () => {
    return getStytchSession();
};

export const stytchLogout = async () => {
    const stytchClient = loadStytchClient();
    // The session token is read from cookies automatically by the SDK
    return stytchClient.sessions.revoke({
        session_token: cookies().get('stytch_session')?.value
    });
}
