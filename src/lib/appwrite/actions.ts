'use server';

import { cookies } from 'next/headers';
import { Account, Client, Databases, ID, Query, Users } from 'node-appwrite';

const BOTS_DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const BOTS_COLLECTION_ID = process.env.APPWRITE_BOTS_COLLECTION_ID!;

const createAdminClient = () => {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
        .setKey(process.env.APPWRITE_API_KEY!);

    return {
        get account() {
            return new Account(client);
        },
        get database() {
            return new Databases(client);
        },
        get users() {
            return new Users(client);
        }
    };
};

const createSessionClient = () => {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
    
    const session = cookies().get('appwrite-session');
    if (!session || !session.value) {
        throw new Error("No session found");
    }
    client.setSession(session.value);

    return {
        get account() {
            return new Account(client);
        }
    };
}


// Auth actions
export async function signup(email: string, password: string, name: string) {
    const { account } = createAdminClient();
    await account.create(ID.unique(), email, password, name);
    const session = await account.createEmailPasswordSession(email, password);
    
    cookies().set('appwrite-session', session.secret, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
    });
}

export async function login(email: string, password: string) {
    const { account } = createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);
    
    cookies().set('appwrite-session', session.secret, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
    });
}

export async function logout() {
    const { account } = createSessionClient();
    await account.deleteSession('current');
    cookies().delete('appwrite-session');
}

export async function getLoggedInUser() {
    try {
        const { account } = createSessionClient();
        return await account.get();
    } catch (error) {
        return null;
    }
}

// User data actions
export async function getUserSubscription() {
    // This is a mock implementation. 
    // In a real app, you would store subscription status in the user's document or a separate collection.
    return { plan: 'Free', botLimit: 2 };
}


// Bot actions
export async function createBot(data: { name: string, code: string }) {
    const user = await getLoggedInUser();
    if (!user) throw new Error("Not authenticated");

    const { database } = createAdminClient();
    return await database.createDocument(
        BOTS_DATABASE_ID,
        BOTS_COLLECTION_ID,
        ID.unique(),
        {
            ...data,
            ownerId: user.$id,
            status: 'stopped'
        }
    );
}

export async function getUserBots() {
    const user = await getLoggedInUser();
    if (!user) return [];

    const { database } = createAdminClient();
    const response = await database.listDocuments(
        BOTS_DATABASE_ID,
        BOTS_COLLECTION_ID,
        [Query.equal('ownerId', user.$id)]
    );
    return response.documents;
}

export async function getBotById(botId: string) {
    const user = await getLoggedInUser();
    if (!user) throw new Error("Not authenticated");

    const { database } = createAdminClient();
    const bot = await database.getDocument(BOTS_DATABASE_ID, BOTS_COLLECTION_ID, botId);

    if (bot.ownerId !== user.$id) {
        throw new Error("Unauthorized");
    }

    return bot;
}