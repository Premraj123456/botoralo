'use server';

import { cookies } from 'next/headers';
import { loadStytchClient } from './server';

export const getCurrentUser = async () => {
    const stytchClient = loadStytchClient();
    const session_token = cookies().get('stytch_session')?.value;

    if (!session_token) {
        return { session: null, user: null };
    }

    try {
        const { member, organization, session } = await stytchClient.sessions.authenticate({
            session_token,
        });
        // The B2B user object is called a 'member'
        return { session, user: member, organization };
    } catch (e) {
        // Session not found or invalid
        return { session: null, user: null };
    }
};

export const stytchLogout = async () => {
    const stytchClient = loadStytchClient();
    try {
        await stytchClient.sessions.revoke({
            session_token: cookies().get('stytch_session')?.value
        });
    } catch (e) {
        // Ignore errors if session is already revoked
    }
}
