import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stadiumstream';

let isConnected = false;

// Graceful DB Connection
export const connectDB = async () => {
  // Diagnostic: show whether the env variable was loaded
  const envLoaded = !!process.env.MONGODB_URI;
  const maskedUri = MONGODB_URI.replace(/:([^@]+)@/, ':****@');
  console.log(`[DB] Environment MONGODB_URI loaded: ${envLoaded}`);
  console.log(`[DB] Connecting to: ${maskedUri}`);

  try {
    // Set connection timeout to 8 seconds for Atlas DNS resolution
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    });
    isConnected = true;
    console.log('✅ Successfully connected to MongoDB database.');
  } catch (err) {
    isConnected = false;
    console.warn('\n================================================================');
    console.warn('⚠️ WARNING: MongoDB connection failed!');
    console.warn(`   URI used: ${maskedUri}`);
    console.warn(`   Error: ${err.message}`);
    console.warn('   Fallback: Running with in-memory user database simulation.');
    console.warn('================================================================\n');
  }
};

// Define User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String }, // Optional for Google Auth
  avatar: { type: String },
  provider: { type: String, default: 'local' },
  createdAt: { type: Date, default: Date.now }
});

// Create Mongoose Model (compiled conditionally to prevent overwrites)
const UserMongoose = mongoose.models.User || mongoose.model('User', userSchema);

// Memory database fallback cache
const memoryUsers = new Map();

// Unified Database operations wrapper
export const db = {
  // Find user by email
  findUserByEmail: async (email) => {
    const cleanEmail = email.toLowerCase().trim();
    if (isConnected) {
      try {
        return await UserMongoose.findOne({ email: cleanEmail });
      } catch (err) {
        console.error("DB error finding user:", err);
      }
    }
    // Fallback to memory DB
    return memoryUsers.get(cleanEmail) || null;
  },

  // Create new user record
  createUser: async ({ username, email, password, avatar, provider }) => {
    const cleanEmail = email.toLowerCase().trim();
    const userData = {
      username,
      email: cleanEmail,
      password, // In a real app we'd hash it (e.g. bcrypt); we'll keep it basic for now
      avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username || cleanEmail)}`,
      provider: provider || 'local',
      createdAt: new Date()
    };

    if (isConnected) {
      try {
        const newUser = new UserMongoose(userData);
        return await newUser.save();
      } catch (err) {
        console.error("DB error creating user:", err);
      }
    }

    // Fallback to memory DB
    memoryUsers.set(cleanEmail, userData);
    return userData;
  }
};
