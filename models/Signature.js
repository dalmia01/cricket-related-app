import mongoose from 'mongoose'

const SignatureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  district: { type: String },
  location: { type: String },
  message: { type: String },
  signature: { type: String, required: true },
}, { timestamps: true })

export default mongoose.models.Signature || mongoose.model('Signature', SignatureSchema)
