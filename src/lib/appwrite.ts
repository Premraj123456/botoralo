import { Client, Databases, Users } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

export const users = new Users(client);
export const databases = new Databases(client);

// You can create a database and collection in your Appwrite project
export const USER_DATABASE_ID = 'users'; 
export const USER_COLLECTION_ID = 'profiles';
