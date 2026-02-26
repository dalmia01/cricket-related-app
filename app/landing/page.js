"use client"
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import LocationSelector from '../components/LocationSelector'

import { forwardRef, useImperativeHandle } from 'react'

const SignatureCanvas = forwardRef(function SignatureCanvas({ onChange }, ref) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const hasStroke = useRef(false)
  const pointerIdRef = useRef(null)

  useImperativeHandle(ref, () => ({
    clear: () => {
      const c = canvasRef.current
      if (!c) return
      const ctx = c.getContext('2d')
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, c.width, c.height)
      hasStroke.current = false
      onChange && onChange(null)
    }
  }))

  useEffect(() => {
    const c = canvasRef.current
    const ctx = c.getContext('2d')
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#111'
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)

    function pointerDown(e) {
      // prevent default touch behavior (scrolling)
      e.preventDefault && e.preventDefault()
      drawing.current = true
      pointerIdRef.current = e.pointerId
      try { c.setPointerCapture && c.setPointerCapture(e.pointerId) } catch (err) {}
      const rect = c.getBoundingClientRect()
      ctx.beginPath()
      ctx.moveTo((e.clientX - rect.left) * (c.width / rect.width), (e.clientY - rect.top) * (c.height / rect.height))
    }
    function pointerMove(e) {
      if (!drawing.current) return
      e.preventDefault && e.preventDefault()
      const rect = c.getBoundingClientRect()
      ctx.lineTo((e.clientX - rect.left) * (c.width / rect.width), (e.clientY - rect.top) * (c.height / rect.height))
      ctx.stroke()
      hasStroke.current = true
      onChange && onChange(c.toDataURL())
    }
    function pointerUp(e) {
      e.preventDefault && e.preventDefault()
      drawing.current = false
      try { if (pointerIdRef.current) c.releasePointerCapture && c.releasePointerCapture(pointerIdRef.current) } catch (err) {}
      pointerIdRef.current = null
      // only report a signature if the user actually drew
      if (hasStroke.current) {
        onChange && onChange(c.toDataURL())
      } else {
        onChange && onChange(null)
      }
    }

    c.addEventListener('pointerdown', pointerDown)
    window.addEventListener('pointermove', pointerMove)
    window.addEventListener('pointerup', pointerUp)

    return () => {
      c.removeEventListener('pointerdown', pointerDown)
      window.removeEventListener('pointermove', pointerMove)
      window.removeEventListener('pointerup', pointerUp)
    }
  }, [onChange])

  return <canvas ref={canvasRef} width={800} height={200} className="signature-canvas" />
})

export default function LandingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [signature, setSignature] = useState(null)
  const signatureRef = useRef(null)
  // const messages = [
  //   'Here’s to big hits, great wickets, and unforgettable moments! 🌟',
  //   'Play hard, play fair — Super 8 glory awaits! 🏆',
  //   'Wishing both teams a thrilling Super 8 showdown! 🔥',
  //   'May this Sri Lanka vs New Zealand clash be a cracker of a match! 💥',
  // ];
  const messages = [
    'Let the blue roar! All the best Team India 🇮🇳',
    'T20 World Cup mode ON. Go Team India! 🔥',
    'Best wishes Team India — play bold, play proud 💙',
    'Good luck Team India! Make the nation proud 🇮🇳',
    'Game on! Best wishes to Team India 🏏🔥'
  ]
  const [message, setMessage] = useState(messages[0])
  const [loading, setLoading] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const toastTimerRef = useRef(null)
  const TOAST_MS = 500

  async function handleProceed() {
    if (!signature) return alert('Please sign in the box')
    const phoneDigits = (phone || '').replace(/\D/g, '')
    if (!/^[0-9]{10}$/.test(phoneDigits)) {
      alert('Phone number must be exactly 10 digits')
      return
    }
    setLoading(true)
    const payload = { name, phone: phoneDigits, state: selectedState, district: selectedDistrict, city: selectedLocation, message, signature }
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Save failed')
      // clear temporary stored visitor info and navigate
      try {
        localStorage.removeItem('visitor.name')
        localStorage.removeItem('visitor.phone')
        localStorage.removeItem('visitor.state')
        localStorage.removeItem('visitor.district')
        localStorage.removeItem('visitor.city')
      } catch (e) {}
      // show a toast and redirect to base signup path after it disappears
      setToastMessage('Saved successfully')
      setToastVisible(true)
      // clear signature UI
      try { signatureRef.current && signatureRef.current.clear() } catch (e) {}
      setSignature(null)
      // start redirect timer
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => {
        setToastVisible(false)
        router.push('/')
      }, TOAST_MS)
    } catch (err) {
      alert('Error saving: ' + err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    // read visitor info from localStorage; redirect to home if missing
    try {
      const storedName = localStorage.getItem('visitor.name') || ''
      const storedPhone = localStorage.getItem('visitor.phone') || ''
      const storedState = localStorage.getItem('visitor.state') || ''
      const storedDistrict = localStorage.getItem('visitor.district') || ''
      const storedLocation = localStorage.getItem('visitor.city') || ''
      if (!storedName || !storedPhone) {
        router.replace('/')
        return
      }
      setName(storedName)
      setPhone(storedPhone)
      setSelectedState(storedState)
      setSelectedDistrict(storedDistrict)
      setSelectedLocation(storedLocation)
    } catch (e) {
      router.replace('/')
    }
  }, [])

  function handleLocationChange(selection) {
    // selection: { state, district, city }
    const st = selection && selection.state ? selection.state : ''
    const loc = selection && selection.city ? selection.city : ''
    const dist = selection && selection.district ? selection.district : ''
    setSelectedState(st)
    setSelectedLocation(loc)
    setSelectedDistrict(dist)
    try {
      localStorage.setItem('visitor.state', st || '')
      localStorage.setItem('visitor.city', loc || '')
      localStorage.setItem('visitor.district', dist || '')
    } catch (e) {}
  }

  return (
    <main className="container">
      <h1>Landing</h1>
      <div className="mt-2 card">
        <p><strong>{name}</strong> — {phone} — {selectedState ? `${selectedState} / ${selectedDistrict} / ${selectedLocation}` : (selectedDistrict ? `${selectedDistrict} / ${selectedLocation}` : selectedLocation)}</p>

        <label>Digital signature { !signature && <span style={{color:'red',marginLeft:8,fontSize:12}}>* required</span> }</label>
        <SignatureCanvas ref={signatureRef} onChange={setSignature} />
        <div style={{height:8}} />
        {!signature && (
          <div style={{color:'red',fontSize:13,marginTop:8}}>Signature required</div>
        )}
          <div style={{display:'flex',gap:8,marginTop:8}}>
          <button onClick={() => { try { signatureRef.current && signatureRef.current.clear(); setSignature(null) } catch(e){} }} className="btn">Clear signature</button>
        </div>

        <label>Message</label>
        <select value={message} onChange={e => setMessage(e.target.value)}>
          {messages.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <button onClick={handleProceed} className="btn" disabled={loading || !signature}>{loading ? 'Saving...' : 'Proceed'}</button>
        {toastVisible && (
          <div className="app-toast" data-anim-duration={TOAST_MS} role="status" aria-live="polite">
            <div className="app-toast__card" onClick={() => { // click to dismiss and go home
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
                setToastVisible(false)
                router.push('/')
              }}>
              <div className="app-toast__icon">✔</div>
              <div style={{flex:1}}>
                <div className="app-toast__message">{toastMessage}</div>
                <div className="app-toast__sub">Redirecting to signup...</div>
              </div>
            </div>
            <div className="app-toast__progress" style={{animationDuration: `${TOAST_MS}ms`}} />
          </div>
        )}
      </div>
    </main>
  )
}
