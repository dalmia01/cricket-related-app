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

    // determine date to query (query param `date` in YYYY-MM-DD or YYYYMMDD), default to today (UTC)
    const dateParam = sp.get('date') || ''
    let targetDate = new Date()
    if (dateParam) {
      // accept YYYY-MM-DD or YYYYMMDD (interpret as local date)
      const cleaned = dateParam.replace(/-/g, '')
      if (/^\d{8}$/.test(cleaned)) {
        const y = parseInt(cleaned.slice(0, 4), 10)
        const m = parseInt(cleaned.slice(4, 6), 10) - 1
        const d = parseInt(cleaned.slice(6, 8), 10)
        // construct local date for the provided Y/M/D
        targetDate = new Date(y, m, d)
      }
    }

    const yyyy = targetDate.getFullYear()
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0')
    const dd = String(targetDate.getDate()).padStart(2, '0')
    const collectionName = `signatures_${dd}-${mm}-${yyyy}`
    const modelName = `Signature_${collectionName}`
    const schema = Signature.schema
    const DailySignature = mongoose.models[modelName] || mongoose.model(modelName, schema, collectionName)

    const findQuery = DailySignature.find(filter)
      .sort({ createdAt: sort === 'old' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .select(selectFields)
      .lean()

    const [total, docs] = await Promise.all([
      DailySignature.countDocuments(filter),
      findQuery.exec(),
    ])

    return NextResponse.json({ docs, total, page, limit }, { headers: corsHeaders })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'DB error' }, { status: 500, headers: corsHeaders })
  }
}
