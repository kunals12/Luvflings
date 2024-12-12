//@ts-nocheck
import * as readline from 'readline';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import redisClient from '../../backend/redisClient'; // Ensure Redis client is properly set up

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH as string;

if (!apiId || !apiHash) {
  throw new Error('API_ID or API_HASH is missing in the environment variables.');
}

const prompt = (query: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

const initClient = async (): Promise<TelegramClient> => {
  const savedSession = await redisClient.get('telegramSession');
  const stringSession = new StringSession(savedSession || '');

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  try {
    if (!savedSession) {
      await connectAndSaveSession(client);
    } else {
      await client.connect(); // Connect using the existing session
      // console.log('Session loaded and client connected.');
    }
    return client;
  } catch (error) {
    console.error('Error initializing client:', error);
    throw error;
  }
};

const connectAndSaveSession = async (client: TelegramClient): Promise<void> => {
  try {
    await client.start({
      phoneNumber: async () => {
        const number = await prompt('Enter your number: ');
        if (!number) throw new Error('Phone number is required.');
        return number;
      },
      password: async () => {
        const password = await prompt('Enter your password (if needed): ');
        return password || ''; // Password can be optional
      },
      phoneCode: async () => {
        const code = await prompt('Enter the code you received: ');
        if (!code) throw new Error('Code is required.');
        return code;
      },
      onError: (err) => console.error('Error during authentication:', err),
    });

    const sessionString = client.session.save();

    if (sessionString) {
      await redisClient.set('telegramSession', sessionString);
      // console.log('Session saved to Redis:', sessionString);
    } else {
      console.error('Failed to save session string.');
    }
  } catch (error) {
    console.error('Error during connection and session saving:', error);
    throw error;
  }
};

const ensureClientIsReady = async (client: TelegramClient): Promise<void> => {
  if (!client.connected) {
    await client.connect();
  }
};

export const createGroupChat = async (groupTitle: string): Promise<Api.messages.Chat> => {
  const client = await initClient();
  try {
    await ensureClientIsReady(client);

    const result = await client.invoke(
      new Api.messages.CreateChat({
        users: [], // No users initially, just the bot
        title: groupTitle,
      })
    );
    // console.log('Group created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

export const sendInviteLink = async (chatId: number): Promise<string> => {
  const client = await initClient();
  try {
    await ensureClientIsReady(client);

    const inviteLink = await client.invoke(
      new Api.messages.ExportChatInvite({
        peer: chatId,
      })
    );
    // console.log('Invite Link:', inviteLink);
    return inviteLink;
  } catch (error) {
    console.error('Error generating invite link:', error);
    throw error;
  }
};
