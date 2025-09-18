'use server';

import { Client, Account, Databases, Users } from 'appwrite';
import { cookies } from 'next/headers';

const appwriteEndpoint = process.env.APPWRITE_ENDPOINT!;
const appwriteProjectId = process.env.APPWRITE_PROJECT_ID!;
const appwriteApiKey = process.env.APPWRITE_API_KEY!;

const createClient = () => {
    const client = new Client()
      .setEndpoint(appwriteEndpoint)
      .setProject(appwriteProjectId);
    return client;
}

export async function createAdminClient() {
  const client = createClient().setKey(appwriteApiKey);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get users() {
      return new Users(client);
    },
  };
}

export async function createSessionClient() {
  const client = createClient();
  const session = cookies().get('appwrite-session');

  if (!session || !session.value) {
    throw new Error('No session');
  }

  client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
  };
}
