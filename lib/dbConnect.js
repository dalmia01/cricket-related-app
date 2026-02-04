import mongoose from 'mongoose'

/**
 * Global is used here to maintain a cached connection across hot reloads in development.
 */
let cached = global.mongoose

if (!cached) cached = global.mongoose = { conn: null, promise: null }

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    // Do not throw at import time; throw when attempting to connect so other runtime
    // operations (like OPTIONS preflight) can run without a crash.
    throw new Error('Please define the MONGODB_URI environment variable')
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }
    cached.promise = mongoose.connect(MONGODB_URI, opts).then(m => m)
  }
  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect
