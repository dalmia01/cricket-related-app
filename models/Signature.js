import mongoose from 'mongoose'

const SignatureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  district: { type: String },
  location: { type: String },
  message: { type: String },
  signature: { type: String, required: true },
}, { timestamps: true })

// Indexes to speed up common queries
SignatureSchema.index({ createdAt: -1 })
SignatureSchema.index({ district: 1, location: 1 })
// text index for simple search (name, message, location)
SignatureSchema.index({ name: 'text', message: 'text', location: 'text', signature: 'text' })

export default mongoose.models.Signature || mongoose.model('Signature', SignatureSchema)
