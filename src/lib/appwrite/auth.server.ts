import { Client, Account, Users, Databases } from 'node-appwrite';
import { cookies } from 'next/headers';

const appwriteClient = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

export const users = new Users(appwriteClient);
export const databases = new Databases(appwriteClient);

export async function getLoggedInUser() {
  try {
    const { session } = await getSession();
    if (!session) return null;
    
    // Re-initialize client with session for the 'get' call
    const sessionClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
    
    const sessionCookie = cookies().get('appwrite-session');
    if (!sessionCookie) return null;
    sessionClient.setSession(sessionCookie.value);

    const account = new Account(sessionClient);
    const user = await account.get();
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    return null;
  }
}

export async function getSession() {
    const sessionCookie = cookies().get('appwrite-session');
    if (!sessionCookie) return { session: null };

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    client.setSession(sessionCookie.value);
    
    const account = new Account(client);
    try {
        const session = await account.getSession('current');
        return { session };
    } catch (error) {
        return { session: null };
    }
}

export async function logout() {
    const { session } = await getSession();
    if (!session) return;

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    const sessionCookie = cookies().get('appwrite-session');
    if (sessionCookie) {
        client.setSession(sessionCookie.value);
    }

    const account = new Account(client);
    await account.deleteSession('current');
    cookies().delete('appwrite-session');
}
