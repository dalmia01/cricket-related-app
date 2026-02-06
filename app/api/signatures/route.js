import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/dbConnect'
import Signature from '../../../models/Signature'

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

export async function GET(request) {
  try {
    await dbConnect()
    const url = new URL(request.url)
    const sp = url.searchParams
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
    const limit = Math.min(200, Math.max(5, parseInt(sp.get('limit') || '20', 10)))
    const state = sp.get('state') || ''
    const district = sp.get('district') || ''
    const city = sp.get('city') || ''
    const search = (sp.get('search') || '').trim()
    const sort = sp.get('sort') || 'newest'
    // option to exclude large fields (like base64 signature) for faster responses
    const includeSignature = String(sp.get('includeSignature') || 'false') === 'true'

    const filter = {}
    if (state) filter.state = state
    if (district) filter.district = district
    if (city) filter.city = city
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [ { name: rx }, { message: rx }, { city: rx } ]
    }

    const skip = (page - 1) * limit
    // run count and find in parallel to reduce total latency
    const findQuery = Signature.find(filter)
      .sort({ createdAt: sort === 'old' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    if (!includeSignature) {
      // exclude the potentially large `signature` field unless requested
      findQuery.select('-signature')
    }

    const [total, docs] = await Promise.all([
      Signature.countDocuments(filter),
      findQuery.exec(),
    ])

    return NextResponse.json({ docs, total, page, limit }, { headers: corsHeaders })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500, headers: corsHeaders })
  }
}
