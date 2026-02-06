import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

// Use a global variable to preserve the connection across hot reloads in development
let cached = globalThis._mongoose
if (!cached) cached = globalThis._mongoose = { conn: null, promise: null }

export async function connectDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false }).then(m => m.connection)
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default connectDB
