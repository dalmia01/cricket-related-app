import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/dbConnect'
import Signature from '../../../models/Signature'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, phone, district, location, message, signature } = body || {}
    if (!name || !phone || !signature) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400, headers: corsHeaders })
    }

    await dbConnect()
    const doc = await Signature.create({ name, phone, district, location, message, signature })
    return NextResponse.json(doc, { status: 201, headers: corsHeaders })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: corsHeaders })
  }
}
