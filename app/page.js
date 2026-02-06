"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LocationSelector from './components/LocationSelector'

export default function HomePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedFilter, setSelectedFilter] = useState({ state: '', district: '', city: '' })
  const [phoneError, setPhoneError] = useState('')

  function handleProceed(e) {
    e.preventDefault()
    const cleaned = (phone || '').replace(/\D/g, '')
    if (!/^[0-9]{10}$/.test(cleaned)) {
      setPhoneError('Phone must be exactly 10 digits')
      return
    }
    if (!name || !selectedFilter.city) return alert('Please fill all fields')
    setPhoneError('')
    // persist visitor info temporarily and navigate to landing
    try {
      localStorage.setItem('visitor.name', name)
      localStorage.setItem('visitor.phone', cleaned)
      localStorage.setItem('visitor.state', selectedFilter.state || '')
      localStorage.setItem('visitor.district', selectedFilter.district || '')
      localStorage.setItem('visitor.city', selectedFilter.city || '')
    } catch (e) {
      // ignore storage errors
    }
    router.push('/landing')
  }

  return (
    <main className="container">
      <h1>Sign Up</h1>
      <form onSubmit={handleProceed} className="card">
        <label>Full name</label>
        <input value={name} onChange={e => setName(e.target.value)} />

        <label>Phone number</label>
        <input
          type="tel"
          value={phone}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0,10)
            setPhone(v)
            if (phoneError && /^[0-9]{10}$/.test(v)) setPhoneError('')
          }}
          maxLength={10}
        />
        {phoneError ? <div style={{color:'crimson',fontSize:12,marginTop:6}}>{phoneError}</div> : null}

        <LocationSelector value={selectedFilter} onChange={setSelectedFilter} />

        <button type="submit" className="btn">Proceed</button>
      </form>
    </main>
  )
}
