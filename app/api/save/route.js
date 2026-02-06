import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/dbConnect'
import Signature from '../../../models/Signature'
import Pusher from 'pusher'

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
export const config = {
  regions: ['bom1'],
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, phone, state, district, city, message, signature } = body || {}
    if (!name || !phone || !signature) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400, headers: corsHeaders })
    }

    await dbConnect()
    const doc = await Signature.create({ name, phone, state, district, city, message, signature })

    try {
      const pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER,
        useTLS: true,
      })
      // trigger a simple public event on channel 'signatures'
      await pusher.trigger('signatures', 'created', JSON.parse(JSON.stringify(doc)))
    } catch (triggerErr) {
      // don't fail the request if realtime notify fails; log for debugging
      console.error('Pusher trigger error', triggerErr)
    }

    return NextResponse.json(doc, { status: 201, headers: corsHeaders })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: corsHeaders })
  }
}
