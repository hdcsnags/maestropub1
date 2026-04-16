import mongoose from 'mongoose';

const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = 5000;
const DEFAULT_SOCKET_TIMEOUT_MS = 45000;
const DEFAULT_MAX_POOL_SIZE = 10;

let connectionPromise: Promise<typeof mongoose> | null = null;

const getMongoUri = (): string => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

  if (!uri) {
    throw new Error('MongoDB connection string is not configured. Set MONGODB_URI, MONGO_URI, or DATABASE_URL.');
  }

  return uri;
};

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const registerConnectionLogging = (): void => {
  const connection = mongoose.connection;

  if (connection.listeners('connected').length === 0) {
    connection.on('connected', () => {
      console.info('[db] MongoDB connected');
    });
  }

  if (connection.listeners('error').length === 0) {
    connection.on('error', (error) => {
      console.error('[db] MongoDB connection error', error);
    });
  }

  if (connection.listeners('disconnected').length === 0) {
    connection.on('disconnected', () => {
      console.warn('[db] MongoDB disconnected');
    });
  }
};

export const connectToDatabase = async (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  registerConnectionLogging();

  const uri = getMongoUri();

  connectionPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: toNumber(
      process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
      DEFAULT_SERVER_SELECTION_TIMEOUT_MS,
    ),
    socketTimeoutMS: toNumber(process.env.MONGODB_SOCKET_TIMEOUT_MS, DEFAULT_SOCKET_TIMEOUT_MS),
    maxPoolSize: toNumber(process.env.MONGODB_MAX_POOL_SIZE, DEFAULT_MAX_POOL_SIZE),
  });

  try {
    await connectionPromise;
    return mongoose;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    connectionPromise = null;
    return;
  }

  await mongoose.disconnect();
  connectionPromise = null;
};

export default connectToDatabase;
