import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/dbConnect'
import Signature from '../../../models/Signature'
import mongoose from 'mongoose'

// Use Node.js serverless runtime for MongoDB (do NOT use Edge)
export const runtime = 'nodejs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

// Prefer functions to run in Vercel Mumbai region (bom1)
// Note: `export const config` (segment export) deprecated by Next.js.
// Region hints removed; set platform-specific regions in deployment settings if needed.

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, phone, state, district, city, message, signature } = body || {}
    if (!name || !phone || !signature) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400, headers: corsHeaders })
    }

    await dbConnect()
    // Create/use a date-based collection: signatures_YYYYMMDD
    // Use local server date (not UTC) so collection matches server/local day
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const collectionName = `signatures_${dd}-${mm}-${yyyy}`
    const modelName = `Signature_${collectionName}`
    const schema = Signature.schema
    const DailySignature = mongoose.models[modelName] || mongoose.model(modelName, schema, collectionName)
    const doc = await DailySignature.create({ name, phone, state, district, city, message, signature })

    try {
      // Only initialize Pusher in production and when required env vars are present.
      const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER, NODE_ENV, VERCEL_ENV } = process.env
      const isProd = NODE_ENV === 'production' || VERCEL_ENV === 'production'
      if (isProd && PUSHER_APP_ID && PUSHER_KEY && PUSHER_SECRET) {
        try {
          const PusherModule = await import('pusher')
          const Pusher = PusherModule && (PusherModule.default || PusherModule)
          const pusher = new Pusher({
            appId: PUSHER_APP_ID,
            key: PUSHER_KEY,
            secret: PUSHER_SECRET,
            cluster: PUSHER_CLUSTER,
            useTLS: true,
          })
          // trigger a simple public event on channel 'signatures'
          // avoid sending large base64 `signature` data to Pusher (causes 413)
          const payload = {
            name: doc.name,
            phone: doc.phone ? String(doc.phone).slice(0, 32) : undefined,
            state: doc.state,
            district: doc.district,
            city: doc.city,
            // truncate message to keep payload small
            message: typeof doc.message === 'string' ? doc.message.slice(0, 400) : doc.message,
            createdAt: doc.createdAt,
            // let clients know a signature image exists without sending it
            signaturePresent: !!doc.signature,
          }

          await pusher.trigger('signatures', 'created', payload)
        } catch (impErr) {
          console.error('Pusher import/trigger error', impErr)
        }
      } else {
        console.warn('Skipping Pusher trigger: either not in production or Pusher env vars missing')
      }
    } catch (triggerErr) {
      // don't fail the request if realtime notify fails; log for debugging
      console.error('Pusher trigger error', triggerErr)
    }

    // Return only selected fields to reduce payload size
    const resp = {
      _id: doc._id,
      name: doc.name,
      phone: doc.phone,
      state: doc.state,
      district: doc.district,
      city: doc.city,
      // keep the full message but avoid sending extremely large payloads
      message: typeof doc.message === 'string' ? doc.message : doc.message,
      createdAt: doc.createdAt,
      // indicate presence of signature without sending the image data
      signaturePresent: !!doc.signature,
    }

    return NextResponse.json(resp, { status: 201, headers: corsHeaders })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: corsHeaders })
  }
}
