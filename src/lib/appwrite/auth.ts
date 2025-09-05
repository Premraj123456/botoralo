'use client';
import { account } from '@/lib/appwrite';
import { ID } from 'appwrite';

export async function login(email: string, password: string) {
    await account.createEmailPasswordSession(email, password);
    const loggedIn = await account.get();
    return JSON.parse(JSON.stringify(loggedIn));
}

export async function signup(email: string, password: string, name: string) {
    await account.create(ID.unique(), email, password, name);
    await login(email, password);
    const loggedIn = await account.get();
    return JSON.parse(JSON.stringify(loggedIn));
}

export async function logout() {
    await account.deleteSession('current');
}

export async function hasActiveSession() {
    try {
        await account.get();
        return true;
    } catch (error) {
        return false;
    }
}
