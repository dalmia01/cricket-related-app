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

export async function GET(request) {
  try {
    await dbConnect()
    const url = new URL(request.url)
    const sp = url.searchParams
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
    const limit = Math.min(200, Math.max(5, parseInt(sp.get('limit') || '20', 10)))
    const district = sp.get('district') || ''
    const location = sp.get('location') || ''
    const search = (sp.get('search') || '').trim()
    const sort = sp.get('sort') || 'newest'

    const filter = {}
    if (district) filter.district = district
    if (location) filter.location = location
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [ { name: rx }, { message: rx }, { location: rx } ]
    }

    const total = await Signature.countDocuments(filter)
    const skip = (page - 1) * limit
    const cursor = Signature.find(filter).sort({ createdAt: sort === 'old' ? 1 : -1 }).skip(skip).limit(limit).lean()
    const docs = await cursor.exec()
    return NextResponse.json({ docs, total, page, limit }, { headers: corsHeaders })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500, headers: corsHeaders })
  }
}
