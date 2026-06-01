'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface StreamClientRecord {
  uuid: string;
  ip: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  country_code: string | null;
  isp: string | null;
  org: string | null;
  latitude: number | null;
  longitude: number | null;
  opened_at: number | null;
  closed_at: number | null;
}

function createPinIcon(count: number, hasActive: boolean): L.DivIcon {
  const fill   = hasActive ? '#22c55e' : '#38bdf8';
  const stroke = hasActive ? '#15803d' : '#0369a1';
  const label  = count > 99 ? '99+' : String(count);
  // Pin grows slightly with session count, capped at 44 px wide
  const w = Math.min(28 + Math.floor(count / 2), 44);
  const h = Math.round(w * 1.45);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 28 40">
  <path d="M14 0C6.27 0 0 6.27 0 14c0 10.8 14 26 14 26S28 24.8 28 14C28 6.27 21.73 0 14 0z"
        fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
  <circle cx="14" cy="13" r="6.5" fill="white" opacity="0.92"/>
  <text x="14" y="17" text-anchor="middle" dominant-baseline="auto"
        fill="${stroke}" font-size="7.5" font-family="ui-monospace,monospace" font-weight="700">${label}</text>
</svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize:    [w, h],
    iconAnchor:  [w / 2, h],       // tip of the pin
    popupAnchor: [0, -(h + 4)],    // popup opens above the pin
  });
}

// ── Fit-bounds helper (runs inside MapContainer context) ──────────────────────
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  const key = coords.map(c => `${c[0].toFixed(4)},${c[1].toFixed(4)}`).join('|');

  useEffect(() => {
    if (coords.length === 0) return;
    if (coords.length === 1) { map.setView(coords[0], 10); return; }
    const lats = coords.map(c => c[0]);
    const lngs = coords.map(c => c[1]);
    map.fitBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      { padding: [48, 48], maxZoom: 12 },
    );
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ── "Show all points" button (runs inside MapContainer context) ───────────────
function FitButton({ coords }: { coords: [number, number][] }) {
  const map = useMap();

  function fit() {
    if (coords.length === 0) return;
    if (coords.length === 1) { map.setView(coords[0], 10); return; }
    const lats = coords.map(c => c[0]);
    const lngs = coords.map(c => c[1]);
    map.fitBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      { padding: [48, 48], maxZoom: 12 },
    );
  }

  return (
    <div
      style={{ position: 'absolute', bottom: 28, right: 10, zIndex: 1000 }}
      className="leaflet-control"
    >
      <button
        onClick={fit}
        title="Fit all points"
        className="flex items-center gap-1.5 bg-slate-900/95 hover:bg-slate-800 border border-slate-600 text-slate-200 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-lg transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
          <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
        </svg>
        Fit points
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ClientSessionsMap({ clients }: { clients: StreamClientRecord[] }) {
  const points = useMemo(() => {
    type Entry = {
      ip: string; lat: number; lng: number;
      city: string | null; region: string | null; country: string | null; country_code: string | null;
      isp: string | null; org: string | null;
      active: number; total: number;
    };
    const agg = new Map<string, Entry>();

    for (const c of clients) {
      if (c.ip == null || c.latitude == null || c.longitude == null) continue;
      if (!agg.has(c.ip)) {
        agg.set(c.ip, {
          ip: c.ip, lat: c.latitude, lng: c.longitude,
          city: c.city, region: c.region, country: c.country, country_code: c.country_code,
          isp: c.isp, org: c.org, active: 0, total: 0,
        });
      }
      const e = agg.get(c.ip)!;
      e.total++;
      if (c.closed_at == null) e.active++;
    }

    return Array.from(agg.values());
  }, [clients]);

  const coords = useMemo<[number, number][]>(() => points.map(p => [p.lat, p.lng]), [points]);

  if (points.length === 0) return null;

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      scrollWheelZoom={true}
      style={{ height: '360px', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <FitBounds coords={coords} />
      <FitButton coords={coords} />

      {points.map(p => {
        const label = [p.city, p.region, p.country].filter(Boolean).join(', ');
        return (
          <Marker
            key={p.ip}
            position={[p.lat, p.lng]}
            icon={createPinIcon(p.total, p.active > 0)}
          >
            <Popup minWidth={170}>
              <div style={{ lineHeight: 1.6, fontSize: 12 }}>
                {label && <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>}
                {p.country_code && (
                  <span style={{ display: 'inline-block', background: '#f1f5f9', borderRadius: 3, padding: '0 4px', fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>
                    {p.country_code}
                  </span>
                )}
                <div style={{ fontFamily: 'monospace', color: '#6b7280', marginBottom: 4 }}>{p.ip}</div>
                {p.isp && <div style={{ color: '#374151', fontSize: 11 }}>{p.isp}</div>}
                {p.org && p.org !== p.isp && <div style={{ color: '#9ca3af', fontSize: 10 }}>{p.org}</div>}
                <div style={{ marginTop: 6, borderTop: '1px solid #e5e7eb', paddingTop: 4 }}>
                  {p.active > 0 && <div style={{ color: '#16a34a', fontWeight: 500 }}>● {p.active} active</div>}
                  <div style={{ color: '#9ca3af' }}>{p.total} session{p.total !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
