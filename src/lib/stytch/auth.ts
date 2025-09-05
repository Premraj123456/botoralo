'use server';

import { cookies } from 'next/headers';
import { stytchClient } from './server';
import { getStytchSession } from '@stytch/nextjs';

export const getCurrentUser = async () => {
    return getStytchSession();
};

export const stytchLogout = async () => {
    // The session token is read from cookies automatically by the SDK
    return stytchClient.sessions.revoke({
        session_token: cookies().get('stytch_session')?.value
    });
}
