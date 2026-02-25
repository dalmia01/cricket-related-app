"use client";
import { useEffect, useMemo, useState } from "react";
import staticLocations from "../../lib/locations.json";

export default function LocationSelector({ value, onChange, autoSelect = true }) {
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [locations, setLocations] = useState(staticLocations || [])

  const initialCity = typeof value === "string" ? value : (value && value.city) || ""
  const initialDistrict = (value && value.district) || ""
  const initialState = (value && value.state) || ""

  const [selectedState, setSelectedState] = useState(initialState)
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict)
  const [selectedCity, setSelectedCity] = useState(initialCity)
  const [cityFilter, setCityFilter] = useState("")

  useEffect(() => {
    async function init() {
      let locs = staticLocations
      if (!locs || !locs.length) {
        try {
          const mod = await import("../../lib/locations.json")
          locs = mod.default || mod
        } catch (e) {
          locs = []
        }
      }
      const ss = Array.from(new Set((locs || []).map((l) => l.state))).sort()
      setStates(ss)
      setLocations(locs || [])

      if (initialCity || initialDistrict || initialState) {
        const entry = (locs || []).find((l) => l.city === initialCity) || (locs || []).find((l) => l.district === initialDistrict) || (locs || []).find((l) => l.state === initialState)
        if (entry) {
          setSelectedState(initialState || entry.state)
          setSelectedDistrict(initialDistrict || entry.district)
          setSelectedCity(initialCity || entry.city || "")
        }
      }
    }
    init()
  }, [])

  const filteredDistricts = useMemo(() => {
    if (!selectedState) return []
    return Array.from(new Set((locations || []).filter((l) => l.state === selectedState).map((l) => l.district))).sort()
  }, [selectedState, locations])

  const filteredCities = useMemo(() => {
    if (!selectedDistrict) return []
    const opts = (locations || []).filter((l) => l.district === selectedDistrict).map((l) => l.city)
    if (!cityFilter) return opts
    return opts.filter((c) => c.toLowerCase().includes(cityFilter.toLowerCase()))
  }, [selectedDistrict, locations, cityFilter])

  useEffect(() => {
    if (autoSelect && !selectedState && states.length) setSelectedState(states[0])
  }, [states, autoSelect])

  useEffect(() => {
    if (autoSelect && selectedState && (!selectedDistrict || !filteredDistricts.includes(selectedDistrict))) {
      setSelectedDistrict(filteredDistricts[0] || "")
    }
  }, [selectedState, filteredDistricts, autoSelect])

  useEffect(() => {
    if (autoSelect && selectedDistrict && (!selectedCity || !filteredCities.includes(selectedCity))) {
      setSelectedCity(filteredCities[0] || "")
    }
  }, [selectedDistrict, filteredCities, autoSelect])

  useEffect(() => {
    onChange && onChange({ state: selectedState, district: selectedDistrict, city: selectedCity })
  }, [selectedState, selectedDistrict, selectedCity])

  return (
    <div className="location-selector">
      <label style={{ display: "block", marginTop: 8, marginBottom: 8 }}>State</label>
      <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} style={{ width: "100%" }}>
        <option value="">-- Select state --</option>
        {states.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <label style={{ display: "block", marginTop: 8, marginBottom: 8 }}>District</label>
      {selectedState ? (
        <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} style={{ width: "100%" }}>
          <option value="">-- Select district --</option>
          {filteredDistricts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      ) : (
        <div style={{ color: "#94a3b8", fontSize: 13 }}>Choose a state first</div>
      )}

      <label style={{ display: "block", marginTop: 8, marginBottom: 8 }}>Location</label>
      {selectedDistrict ? (
        <>
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} style={{ width: "100%" }}>
            {autoSelect ? <option value="">-- Select city --</option> : <option value="">All cities</option>}
            {filteredCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </>
      ) : (
        <div style={{ color: "#94a3b8", fontSize: 13 }}>Choose a district first</div>
      )}
    </div>
  )
}
