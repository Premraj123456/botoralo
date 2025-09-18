'use server';

import { createAdminClient, createSessionClient } from '@/lib/appwrite/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { ID, Query } from 'appwrite';

const BOTS_DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const BOTS_COLLECTION_ID = process.env.APPWRITE_BOTS_COLLECTION_ID!;

export async function createBot(data: { name: string, code: string }) {
  const { user } = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { databases } = await createAdminClient();

  const bot = await databases.createDocument(
    BOTS_DATABASE_ID,
    BOTS_COLLECTION_ID,
    ID.unique(),
    {
      name: data.name,
      code: data.code,
      ownerId: user.id,
      status: 'stopped',
    }
  );

  return bot;
}

export async function getUserBots() {
  const { user } = await getCurrentUser();
  if (!user) return [];
  
  const { databases } = await createAdminClient();

  try {
    const { documents } = await databases.listDocuments(
      BOTS_DATABASE_ID,
      BOTS_COLLECTION_ID,
      [Query.equal('ownerId', user.id)]
    );
    return documents;
  } catch (error) {
    console.error("Error fetching user bots from Appwrite:", error);
    // If the collection doesn't exist, Appwrite throws an error.
    // It's better to return an empty array than crash the app.
    return [];
  }
}

export async function getBotById(botId: string) {
  const { user } = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  const { databases } = await createAdminClient();

  const bot = await databases.getDocument(
    BOTS_DATABASE_ID,
    BOTS_COLLECTION_ID,
    botId
  );

  if (bot.ownerId !== user.id) {
    throw new Error('Not authorized');
  }
  
  return bot;
}
