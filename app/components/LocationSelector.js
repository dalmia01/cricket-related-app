"use client";
import { useEffect, useMemo, useState } from "react";
import staticLocations from "../../lib/locations.json";

export default function LocationSelector({
  value,
  onChange,
  autoSelect = true,
}) {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [locations, setLocations] = useState(staticLocations || []);
  const [locationFilter, setLocationFilter] = useState("");
  const initialLocation =
    typeof value === "string" ? value : (value && value.location) || "";
  const initialDistrict = (value && value.district) || "";
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);

  useEffect(() => {
    async function init() {
      let locations = staticLocations;
      if (!locations || !locations.length) {
        try {
          const mod = await import("../../lib/locations.json");
          locations = mod.default || mod;
        } catch (e) {
          locations = [];
        }
      }

      const ds = Array.from(
        new Set((locations || []).map((l) => l.district)),
      ).sort();
      setDistricts(ds);
      setLocations(locations || []);

      if (initialLocation || initialDistrict) {
        const entry =
          (locations || []).find((l) => l.location === initialLocation) ||
          (locations || []).find((l) => l.district === initialDistrict);
        if (entry) {
          setSelectedDistrict(initialDistrict || entry.district);
          setSelectedLocation(initialLocation || entry.location || "");
        }
      }
    }
    init();
  }, []);

  const filtered = useMemo(() => {
    if (!selectedDistrict) return [];
    const opts = (locations || [])
      .filter((l) => l.district === selectedDistrict)
      .map((l) => l.location);
    if (!locationFilter) return opts;
    return opts.filter((loc) =>
      loc.toLowerCase().includes(locationFilter.toLowerCase()),
    );
  }, [selectedDistrict]);

  useEffect(() => {
    if (autoSelect && !selectedDistrict && districts.length)
      setSelectedDistrict(districts[0]);
  }, [districts, autoSelect]);

  useEffect(() => {
    if (
      autoSelect &&
      selectedDistrict &&
      (!selectedLocation || !filtered.includes(selectedLocation))
    ) {
      setSelectedLocation(filtered[0] || "");
    }
  }, [selectedDistrict, autoSelect]);

  useEffect(() => {
    onChange &&
      onChange({ district: selectedDistrict, location: selectedLocation });
  }, [selectedDistrict, selectedLocation]);

  return (
    <div className="location-selector">
      <label style={{ display: "block", marginTop: 8 }}>District</label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="">-- Select district --</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <label style={{ display: "block", marginTop: 8 }}>Location</label>
      {selectedDistrict ? (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{ flex: 1 }}
            >
              {autoSelect ? (
                <option value="">-- Select location --</option>
              ) : (
                <option value="">All locations</option>
              )}
              {filtered.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <div style={{ color: "#94a3b8", fontSize: 13 }}>
          Choose a district first
        </div>
      )}
    </div>
  );
}
