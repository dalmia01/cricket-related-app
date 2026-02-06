"use client"
import { useEffect, useState, useRef, useCallback } from 'react'
import Pusher from 'pusher-js'

export default function ListingsPage() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [selectedFilter, setSelectedFilter] = useState({ state: '', district: '', city: '' })
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef(null)

  const fetchPage = useCallback(async (p = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setHasMore(true)
      } else {
        setLoadingMore(true)
      }

      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('limit', String(limit))
      // include base64 signature data in listing responses
      params.set('includeSignature', 'true')
      if (selectedFilter.state) params.set('state', selectedFilter.state)
      if (selectedFilter.district) params.set('district', selectedFilter.district)
      if (selectedFilter.city) params.set('city', selectedFilter.city)
      if (search) params.set('search', search)
      if (sort) params.set('sort', sort)

      const res = await fetch(`/api/signatures?${params.toString()}`)
      const json = await res.json()
      const docs = json.docs || []
      const tot = json.total || docs.length

      if (reset) setItems(docs)
      else setItems(prev => [...prev, ...docs])
      setTotal(tot)
      setPage(p)
      setHasMore((p * limit) < tot)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [limit, search, selectedFilter, sort])

  // load (and reload) when filters/search/sort change
  useEffect(() => {
    fetchPage(1, true)
  }, [search, sort, selectedFilter, fetchPage])

  // debounce query -> search
  useEffect(() => {
    const t = setTimeout(() => setSearch(query), 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPage(page + 1, false)
        }
      })
    }, { rootMargin: '300px' })
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, loading, page, fetchPage])

  // realtime: subscribe to Pusher channel and refresh when new signature is created
  useEffect(() => {
    try {
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
      if (!key) return
      const pusher = new Pusher(key, { cluster: cluster || undefined, forceTLS: true })
      const channel = pusher.subscribe('signatures')
      const handler = () => {
        // reload first page to keep ordering consistent
        fetchPage(1, true)
      }
      channel.bind('created', handler)

      return () => {
        try {
          channel.unbind('created', handler)
          pusher.unsubscribe('signatures')
          pusher.disconnect()
        } catch (e) {
          // ignore cleanup errors
        }
      }
    } catch (e) {
      console.error('Realtime subscription error', e)
    }
  }, [fetchPage])

  // client-side filtered list is simply `items` (server handles filtering/paging)
  const filtered = items

  return (
    <main style={{padding: '26px 20px', maxWidth: 1200, margin: '0 auto'}}>
      <div style={{textAlign: 'center', marginBottom: 28}}>
        <div style={{display: 'inline-block', padding: '6px 12px', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontSize: 12}}>Signatures</div>
        <h1 style={{fontSize: 40, margin: '18px 0 8px', lineHeight: 1.1}}>Signatures Wall</h1>
        <p style={{color: '#6b7280', maxWidth: 860, margin: '0 auto'}}>A cozy place for visitors to leave their mark — browse messages and names.</p>
        <div style={{marginTop:8, color:'#94a3b8'}}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:32,flexWrap:'wrap',justifyContent:'center'}}>
        <div style={{minWidth:"80vw"}}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or message" style={{width:'100%',padding:'12px',borderRadius:12,border:'1px solid #e6edf3'}} />
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div style={{display:'flex',justifyContent:'center',padding:40}}>
          <div className="spinner" aria-hidden></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <h3>No signatures found</h3>
          <p>Be the first to add a signature or try a different search term.</p>
        </div>
      ) : (
        <>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24}}>
            {filtered.map((item, i) => (
              <article key={item._id} style={{maxWidth : "max-content",background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 10px 30px rgba(2,6,23,0.06)', transform: `rotate(${((Math.random() * 8) - 4).toFixed(2)}deg)`}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <div style={{width:56,height:56,borderRadius:999,display:'flex',alignItems:'center',justifyContent:'center',background:'#eef2ff',fontWeight:700,color:'#0f172a'}}>{(item.name || 'A').split(' ').map(s=>s[0]).slice(0,2).join('')}</div>
                  <div>
                    <div style={{fontWeight:700}}>{item.name || 'Anonymous'}</div>
                              <div style={{fontSize:12,color:'#94a3b8'}}>{item.city || 'Unknown'},{item.district ||""},{item.state ||""}</div>
                  </div>
                </div>
                {item.signature ? (
                  <div style={{marginTop:12}}>
                    <img src={item.signature} alt={item.name || 'signature'} className="sig-img" />
                  </div>
                ) : null}
                <p style={{marginTop:14,color:'#0f172a',lineHeight:1.5}}>{item.message || '—'}</p>
                <div style={{marginTop:16,color:'#e6eef8',fontSize:28,opacity:0.35}}>“”</div>
              </article>
            ))}
          </div>

          <div ref={sentinelRef} style={{height:1,marginTop:8}} />
          {loadingMore ? (
            <div style={{display:'flex',justifyContent:'center',padding:16}}><div className="spinner" aria-hidden></div></div>
          ) : null}
        </>
      )}
    </main>
  )
}
