'use server';

import { cookies } from 'next/headers';
import { loadStytchClient } from './server';

export const getCurrentUser = async () => {
    const stytchClient = loadStytchClient();
    try {
        const session = await stytchClient.sessions.authenticate({
            session_token: cookies().get('stytch_session')?.value,
        });
        return session;
    } catch (e) {
        // Session not found
        return { session: null, user: null };
    }
};

export const stytchLogout = async () => {
    const stytchClient = loadStytchClient();
    // The session token is read from cookies automatically by the SDK
    return stytchClient.sessions.revoke({
        session_token: cookies().get('stytch_session')?.value
    });
}
