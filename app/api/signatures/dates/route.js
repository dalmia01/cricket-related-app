import { NextResponse } from 'next/server'
import dbConnect from '../../../../lib/dbConnect'
import mongoose from 'mongoose'

export const runtime = 'nodejs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  try {
    await dbConnect()
    const db = mongoose.connection.db
    const cols = await db.listCollections().toArray()
    const dates = cols
      .map(c => c.name)
      .filter(name => /^signatures_\d{2}-\d{2}-\d{4}$/.test(name))
      .map(name => {
        const m = name.match(/^signatures_(\d{2})-(\d{2})-(\d{4})$/)
        if (!m) return null
        const dd = m[1]
        const mm = m[2]
        const yyyy = m[3]
        // produce ISO-like YYYY-MM-DD (local date)
        return `${yyyy}-${mm}-${dd}`
      })
      .filter(Boolean)
    // dedupe & sort descending (latest first)
    const uniq = Array.from(new Set(dates)).sort((a, b) => (a < b ? 1 : -1))

    return NextResponse.json({ dates: uniq }, { headers: corsHeaders })
  } catch (err) {
    console.error('Error listing signature dates', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500, headers: corsHeaders })
  }
}
