'use server';

import { cookies } from 'next/headers';
import { stytchClient } from './server';
import { getStytchSession } from '@stytch/nextjs/server';

export const getCurrentUser = async () => {
    return getStytchSession(cookies());
};

export const stytchLogout = async () => {
    return stytchClient.sessions.revoke({
        session_token: cookies().get('stytch_session')?.value
    });
}
