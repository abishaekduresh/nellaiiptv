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

// Approximate country centroids — used when exact lat/lng is unavailable
const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  AD:[42.55,1.60],AE:[23.42,53.85],AF:[33.93,67.71],AL:[41.15,20.17],AM:[40.07,45.04],
  AO:[-11.20,17.87],AR:[-38.42,-63.62],AT:[47.52,14.55],AU:[-25.27,133.78],AZ:[40.14,47.58],
  BA:[43.92,17.68],BD:[23.68,90.36],BE:[50.50,4.47],BF:[12.36,-1.56],BG:[42.73,25.49],
  BH:[25.93,50.64],BI:[-3.37,29.92],BJ:[9.31,2.32],BN:[4.54,114.73],BO:[-16.29,-63.59],
  BR:[-14.24,-51.93],BT:[27.51,90.43],BW:[-22.33,24.68],BY:[53.71,27.95],BZ:[17.19,-88.50],
  CA:[56.13,-106.35],CD:[-4.04,21.76],CF:[6.61,20.94],CG:[-0.23,15.83],CH:[46.82,8.23],
  CI:[7.54,-5.55],CL:[-35.68,-71.54],CM:[7.37,12.35],CN:[35.86,104.20],CO:[4.57,-74.30],
  CR:[9.75,-83.75],CU:[21.52,-77.78],CV:[16.54,-23.04],CY:[35.13,33.43],CZ:[49.82,15.47],
  DE:[51.17,10.45],DJ:[11.83,42.59],DK:[56.26,9.50],DO:[18.74,-70.16],DZ:[28.03,1.66],
  EC:[-1.83,-78.18],EE:[58.60,25.01],EG:[26.82,30.80],ER:[15.18,39.78],ES:[40.46,-3.75],
  ET:[9.15,40.49],FI:[61.92,25.75],FJ:[-16.58,179.41],FR:[46.23,2.21],GA:[-0.80,11.61],
  GB:[55.38,-3.44],GE:[42.32,43.36],GH:[7.95,-1.02],GM:[13.44,-15.31],GN:[9.95,-11.41],
  GQ:[1.65,10.27],GR:[39.07,21.82],GT:[15.78,-90.23],GW:[11.80,-15.18],GY:[4.86,-58.93],
  HN:[15.20,-86.24],HR:[45.10,15.20],HT:[18.97,-72.29],HU:[47.16,19.50],ID:[-0.79,113.92],
  IE:[53.41,-8.24],IL:[31.05,34.85],IN:[20.59,78.96],IQ:[33.22,43.68],IR:[32.43,53.69],
  IS:[64.96,-19.02],IT:[41.87,12.57],JM:[18.11,-77.30],JO:[30.59,36.24],JP:[36.20,138.25],
  KE:[-0.02,37.91],KG:[41.20,74.77],KH:[12.57,104.99],KP:[40.34,127.51],KR:[35.91,127.77],
  KW:[29.31,47.48],KZ:[48.02,66.92],LA:[19.86,102.50],LB:[33.85,35.86],LI:[47.14,9.55],
  LK:[7.87,80.77],LR:[6.43,-11.78],LS:[-29.61,28.23],LT:[55.17,23.88],LU:[49.82,6.13],
  LV:[56.88,24.60],LY:[26.34,17.23],MA:[31.79,-7.09],MD:[47.41,28.37],ME:[42.71,19.37],
  MG:[-18.77,46.87],MK:[41.61,21.75],ML:[17.57,-3.99],MM:[21.92,95.96],MN:[46.86,103.85],
  MR:[21.01,-10.94],MT:[35.94,14.38],MU:[-20.35,57.55],MV:[3.20,73.22],MW:[-13.25,34.30],
  MX:[23.63,-102.55],MY:[4.21,101.98],MZ:[-18.67,35.53],NA:[-22.96,18.49],NE:[17.61,8.08],
  NG:[9.08,8.68],NI:[12.87,-85.21],NL:[52.13,5.29],NO:[60.47,8.47],NP:[28.39,84.12],
  NZ:[-40.90,174.89],OM:[21.51,55.92],PA:[8.54,-80.78],PE:[-9.19,-75.02],PG:[-6.31,143.96],
  PH:[12.88,121.77],PK:[30.38,69.35],PL:[51.92,19.15],PS:[31.95,35.23],PT:[39.40,-8.22],
  PY:[-23.44,-58.44],QA:[25.35,51.18],RO:[45.94,24.97],RS:[44.02,21.01],RU:[61.52,105.32],
  RW:[-1.94,29.87],SA:[23.89,45.08],SD:[12.86,30.22],SE:[60.13,18.64],SG:[1.35,103.82],
  SI:[46.15,14.99],SK:[48.67,19.70],SL:[8.46,-11.78],SN:[14.50,-14.45],SO:[5.15,46.20],
  SS:[4.86,31.57],SV:[13.79,-88.90],SY:[34.80,38.99],SZ:[-26.52,31.47],TD:[15.45,18.73],
  TG:[8.62,0.82],TH:[15.87,100.99],TJ:[38.86,71.28],TL:[-8.87,125.73],TM:[38.97,59.56],
  TN:[33.89,9.54],TO:[-21.18,-175.20],TR:[38.96,35.24],TT:[10.69,-61.22],TW:[23.70,120.96],
  TZ:[-6.37,34.89],UA:[48.38,31.17],UG:[1.37,32.29],US:[37.09,-95.71],UY:[-32.52,-55.77],
  UZ:[41.38,64.59],VE:[6.42,-66.59],VN:[14.06,108.28],YE:[15.55,48.52],ZA:[-30.56,22.94],
  ZM:[-13.13,27.85],ZW:[-19.02,29.15],
};

function createPinIcon(count: number, hasActive: boolean, approximate = false): L.DivIcon {
  const fill   = approximate ? '#f59e0b' : (hasActive ? '#22c55e' : '#38bdf8');
  const stroke = approximate ? '#b45309' : (hasActive ? '#15803d' : '#0369a1');
  const label  = count > 99 ? '99+' : String(count);
  const w = Math.min(28 + Math.floor(count / 2), 44);
  const h = Math.round(w * 1.45);
  // Approximate pins use a dashed stroke to signal "country-level only"
  const dashAttr = approximate ? ' stroke-dasharray="3 2"' : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 28 40">
  <path d="M14 0C6.27 0 0 6.27 0 14c0 10.8 14 26 14 26S28 24.8 28 14C28 6.27 21.73 0 14 0z"
        fill="${fill}" stroke="${stroke}" stroke-width="1.5"${dashAttr} opacity="${approximate ? 0.8 : 1}"/>
  <circle cx="14" cy="13" r="6.5" fill="white" opacity="0.92"/>
  <text x="14" y="17" text-anchor="middle" dominant-baseline="auto"
        fill="${stroke}" font-size="7.5" font-family="ui-monospace,monospace" font-weight="700">${label}</text>
</svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize:    [w, h],
    iconAnchor:  [w / 2, h],
    popupAnchor: [0, -(h + 4)],
  });
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  const key = coords.map(c => `${c[0].toFixed(4)},${c[1].toFixed(4)}`).join('|');

  useEffect(() => {
    if (coords.length === 0) return;
    if (coords.length === 1) { map.setView(coords[0], 6); return; }
    const lats = coords.map(c => c[0]);
    const lngs = coords.map(c => c[1]);
    map.fitBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      { padding: [48, 48], maxZoom: 12 },
    );
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function FitButton({ coords }: { coords: [number, number][] }) {
  const map = useMap();

  function fit() {
    if (coords.length === 0) return;
    if (coords.length === 1) { map.setView(coords[0], 6); return; }
    const lats = coords.map(c => c[0]);
    const lngs = coords.map(c => c[1]);
    map.fitBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      { padding: [48, 48], maxZoom: 12 },
    );
  }

  return (
    <div style={{ position: 'absolute', bottom: 28, right: 10, zIndex: 1000 }} className="leaflet-control">
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

export default function ClientSessionsMap({ clients }: { clients: StreamClientRecord[] }) {
  const points = useMemo(() => {
    type Entry = {
      key: string; lat: number; lng: number; approximate: boolean;
      label: string; country_code: string | null;
      isp: string | null; org: string | null;
      active: number; total: number;
    };

    // Exact points aggregated by IP
    const exactByIp = new Map<string, Entry>();
    // Approximate points aggregated by country code
    const approxByCountry = new Map<string, Entry>();

    for (const c of clients) {
      if (c.latitude != null && c.longitude != null) {
        const key = c.ip ?? `${c.latitude},${c.longitude}`;
        if (!exactByIp.has(key)) {
          const loc = [c.city, c.region, c.country].filter(Boolean).join(', ') || c.country_code || '—';
          exactByIp.set(key, { key, lat: c.latitude, lng: c.longitude, approximate: false,
            label: loc, country_code: c.country_code, isp: c.isp, org: c.org, active: 0, total: 0 });
        }
        const e = exactByIp.get(key)!;
        e.total++;
        if (c.closed_at == null) e.active++;
      } else {
        // Fall back to country centroid
        const code = (c.country_code || c.country)?.toUpperCase().trim();
        if (!code || code === 'NONE' || !COUNTRY_CENTROIDS[code]) continue;
        const [lat, lng] = COUNTRY_CENTROIDS[code];
        if (!approxByCountry.has(code)) {
          approxByCountry.set(code, { key: code, lat, lng, approximate: true,
            label: c.country || code, country_code: code, isp: c.isp, org: c.org, active: 0, total: 0 });
        }
        const e = approxByCountry.get(code)!;
        e.total++;
        if (c.closed_at == null) e.active++;
      }
    }

    return Array.from(exactByIp.values()).concat(Array.from(approxByCountry.values()));
  }, [clients]);

  const coords = useMemo<[number, number][]>(() => points.map(p => [p.lat, p.lng]), [points]);

  if (points.length === 0) return null;

  const hasApprox = points.some(p => p.approximate);

  return (
    <div className="relative flex flex-col" style={{ height: '100%' }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={true}
        style={{ flex: '1 1 0', width: '100%', minHeight: '360px' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <FitBounds coords={coords} />
        <FitButton coords={coords} />

        {points.map(p => (
          <Marker
            key={p.key}
            position={[p.lat, p.lng]}
            icon={createPinIcon(p.total, p.active > 0, p.approximate)}
          >
            <Popup minWidth={170}>
              <div style={{ lineHeight: 1.6, fontSize: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.label}</div>
                {p.country_code && (
                  <span style={{ display:'inline-block', background:'#f1f5f9', borderRadius:3, padding:'0 4px', fontSize:10, fontFamily:'monospace', marginBottom:4 }}>
                    {p.country_code}
                  </span>
                )}
                {p.approximate && (
                  <div style={{ color:'#b45309', fontSize:10, marginBottom:4 }}>⚠ Country-level only</div>
                )}
                {!p.approximate && (
                  <div style={{ fontFamily:'monospace', color:'#6b7280', marginBottom:4 }}>{p.key}</div>
                )}
                {p.isp && <div style={{ color:'#374151', fontSize:11 }}>{p.isp}</div>}
                {p.org && p.org !== p.isp && <div style={{ color:'#9ca3af', fontSize:10 }}>{p.org}</div>}
                <div style={{ marginTop:6, borderTop:'1px solid #e5e7eb', paddingTop:4 }}>
                  {p.active > 0 && <div style={{ color:'#16a34a', fontWeight:500 }}>● {p.active} active</div>}
                  <div style={{ color:'#9ca3af' }}>{p.total} session{p.total !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-[1000] flex items-center gap-3 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-400 pointer-events-none">
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />Active</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-400" />Closed</span>
        {hasApprox && <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />~Country</span>}
      </div>
    </div>
  );
}
