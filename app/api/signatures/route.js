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
// Note: `export const config` (segment export) deprecated by Next.js.
// Region hints removed; set platform-specific regions in deployment settings if needed.

export async function GET(request) {
  try {
    await dbConnect()
    const url = new URL(request.url)
    const sp = url.searchParams
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
    const limit = Math.min(200, Math.max(5, parseInt(sp.get('limit') || '20', 10)))
    const search = (sp.get('search') || '').trim()
    const sort = sp.get('sort') || 'newest'
    // option to exclude large fields (like base64 signature) for faster responses
    const includeSignature = String(sp.get('includeSignature') || 'false') === 'true'

    const filter = {}
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [ { name: rx }, { message: rx }, { city: rx } ]
    }

    const skip = (page - 1) * limit
    const baseFields = 'name phone state district city message'
    // use inclusion projection only; exclude `_id` explicitly when returning to frontend
    const selectFields = includeSignature
      ? baseFields + ' signature -_id'
      : baseFields + ' -_id'

    const findQuery = Signature.find(filter)
      .sort({ createdAt: sort === 'old' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .select(selectFields)
      .lean()

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
