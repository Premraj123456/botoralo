import { Client, Account, Databases } from 'appwrite';

// This file is intended for client-side use.
// For server-side actions, use src/lib/appwrite/server.ts

const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);

export default client;
