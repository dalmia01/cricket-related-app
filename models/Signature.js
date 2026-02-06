import mongoose from 'mongoose'

const SignatureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  state: { type: String },
  district: { type: String },
  city: { type: String },
  message: { type: String },
  signature: { type: String, required: true },
}, { timestamps: true })

// Indexes to speed up common queries
SignatureSchema.index({ createdAt: -1 })
SignatureSchema.index({ state: 1, district: 1, city: 1 })
// text index for simple search (name, message, city)
SignatureSchema.index({ name: 'text', message: 'text',state: 'text', district: 'text', city: 'text', signature: 'text' })

export default mongoose.models.Signature || mongoose.model('Signature', SignatureSchema)
