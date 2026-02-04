"use client"
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import LocationSelector from '../components/LocationSelector'

function SignatureCanvas({ onChange }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)

  useEffect(() => {
    const c = canvasRef.current
    const ctx = c.getContext('2d')
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#111'
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)

    function pointerDown(e) {
      drawing.current = true
      const rect = c.getBoundingClientRect()
      ctx.beginPath()
      ctx.moveTo((e.clientX - rect.left) * (c.width / rect.width), (e.clientY - rect.top) * (c.height / rect.height))
    }
    function pointerMove(e) {
      if (!drawing.current) return
      const rect = c.getBoundingClientRect()
      ctx.lineTo((e.clientX - rect.left) * (c.width / rect.width), (e.clientY - rect.top) * (c.height / rect.height))
      ctx.stroke()
      onChange && onChange(c.toDataURL())
    }
    function pointerUp() {
      drawing.current = false
      onChange && onChange(c.toDataURL())
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
}

export default function LandingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [signature, setSignature] = useState(null)
  const [message, setMessage] = useState('Great service')
  const [loading, setLoading] = useState(false)

  const messages = ['Great service', 'Thank you!', 'Amazing!', 'Proud supporter', 'Best wishes']

  async function handleProceed() {
    if (!signature) return alert('Please sign in the box')
    const phoneDigits = (phone || '').replace(/\D/g, '')
    if (!/^[0-9]{10}$/.test(phoneDigits)) {
      alert('Phone number must be exactly 10 digits')
      return
    }
    setLoading(true)
    const payload = { name, phone: phoneDigits, district: selectedDistrict, location: selectedLocation, message, signature }
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
        localStorage.removeItem('visitor.district')
        localStorage.removeItem('visitor.location')
      } catch (e) {}
      router.push('/listings')
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
      const storedDistrict = localStorage.getItem('visitor.district') || ''
      const storedLocation = localStorage.getItem('visitor.location') || ''
      if (!storedName || !storedPhone) {
        router.replace('/')
        return
      }
      setName(storedName)
      setPhone(storedPhone)
      setSelectedDistrict(storedDistrict)
      setSelectedLocation(storedLocation)
    } catch (e) {
      router.replace('/')
    }
  }, [])

  function handleLocationChange(selection) {
    // selection: { district, location }
    const loc = selection && selection.location ? selection.location : ''
    const dist = selection && selection.district ? selection.district : ''
    setSelectedLocation(loc)
    setSelectedDistrict(dist)
    try {
      localStorage.setItem('visitor.location', loc || '')
      localStorage.setItem('visitor.district', dist || '')
    } catch (e) {}
  }

  return (
    <main className="container">
      <h1>Landing</h1>
      <div className="card">
        <p><strong>{name}</strong> — {phone} — {selectedDistrict ? `${selectedDistrict} / ${selectedLocation}` : selectedLocation}</p>

        <label>Digital signature</label>
        <SignatureCanvas onChange={setSignature} />

        <label>Message</label>
        <select value={message} onChange={e => setMessage(e.target.value)}>
          {messages.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <button onClick={handleProceed} className="btn" disabled={loading}>{loading ? 'Saving...' : 'Proceed'}</button>
      </div>
    </main>
  )
}
