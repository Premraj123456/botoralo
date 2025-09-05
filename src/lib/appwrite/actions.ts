'use server';

import { databases, users } from './auth.server';
import { getLoggedInUser } from '@/lib/appwrite/auth.server';
import { ID, Query } from 'node-appwrite';

const BOTS_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const BOTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_BOTS_COLLECTION_ID!;

// This is a mock implementation.
// In a real app, you would fetch this from your database.
export async function getUserSubscription() {
  return { plan: 'Free', botLimit: 2, customerId: null };
}

export async function createBot(data: { name: string, code: string }) {
  const user = await getLoggedInUser();
  if (!user) throw new Error('Not authenticated');

  const bot = await databases.createDocument(
    BOTS_DATABASE_ID,
    BOTS_COLLECTION_ID,
    ID.unique(),
    {
      name: data.name,
      code: data.code,
      ownerId: user.$id,
      status: 'stopped',
    }
  );

  return bot;
}

export async function getUserBots() {
  const user = await getLoggedInUser();
  if (!user) return [];

  const { documents } = await databases.listDocuments(
    BOTS_DATABASE_ID,
    BOTS_COLLECTION_ID,
    [Query.equal('ownerId', user.$id)]
  );
  return documents;
}

export async function getBotById(botId: string) {
  const user = await getLoggedInUser();
  if (!user) throw new Error('Not authenticated');

  const bot = await databases.getDocument(
    BOTS_DATABASE_ID,
    BOTS_COLLECTION_ID,
    botId
  );

  if (bot.ownerId !== user.$id) {
    throw new Error('Not authorized');
  }
  
  return bot;
}
