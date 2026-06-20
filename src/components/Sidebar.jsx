import React from 'react';

const SAFETY_CONFIG = [
  { key: 'high', label: 'High safety', color: '#1a9e74', desc: 'Protected trails & cycleways' },
  { key: 'med',  label: 'Medium safety', color: '#e09f27', desc: 'Painted lanes & low-speed roads' },
  { key: 'low',  label: 'Low safety', color: '#e04a4a', desc: 'Shared arterial roads' },
];

export default function Sidebar({ mode, setMode, safetyVis, toggleSafety, status, count, onRefresh }) {
  return (
    <div style={{
      width: 240,
      background: '#fff',
      borderRight: '1px solid #e0ddd8',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 16px',
      gap: 24,
      flexShrink: 0,
      overflowY: 'auto',
    }}>

      {/* Title */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>
          Billings Bike Map
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>
          Trails & Routes
        </div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
          Yellowstone County, MT
        </div>
      </div>

      {/* Mode toggle */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Show routes for
        </div>
        {[
          { key: 'all', label: 'All routes', icon: '🗺️' },
          { key: 'rec', label: 'Recreation', icon: '🚵' },
          { key: 'commute', label: 'Commute', icon: '🏙️' },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '8px 10px', marginBottom: 4,
              border: mode === key ? '1.5px solid #1a1a1a' : '1px solid #e0ddd8',
              borderRadius: 8, cursor: 'pointer',
              background: mode === key ? '#1a1a1a' : '#fff',
              color: mode === key ? '#fff' : '#333',
              fontSize: 13, fontWeight: mode === key ? 600 : 400,
              textAlign: 'left',
            }}
          >
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* Safety filter */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Safety level
        </div>
        {SAFETY_CONFIG.map(({ key, label, color, desc }) => (
          <div
            key={key}
            onClick={() => toggleSafety(key)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '8px 10px', marginBottom: 4, borderRadius: 8,
              border: '1px solid #e0ddd8', cursor: 'pointer',
              background: safetyVis[key] ? '#fafaf8' : '#f5f5f5',
              opacity: safetyVis[key] ? 1 : 0.45,
              transition: 'opacity 0.15s',
            }}
          >
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              background: color, flexShrink: 0, marginTop: 2,
            }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{label}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Key
        </div>
        {[
          { color: '#1a9e74', label: 'Protected trail / cycleway', weight: 4 },
          { color: '#e09f27', label: 'Painted bike lane', weight: 3 },
          { color: '#e04a4a', label: 'Shared road', weight: 3 },
        ].map(({ color, label, weight }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 24, height: weight, background: color, borderRadius: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 24, height: 0, borderTop: '3px dashed #888', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#555' }}>Cut-through / informal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: '#3366cc', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#555' }}>Manually edited score</span>
        </div>
      </div>

      {/* Status */}
      <div style={{ marginTop: 'auto', fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>
        {status === 'loading' && '⏳ Loading routes from OpenStreetMap…'}
        {status === 'loaded' && `✅ ${count} segments loaded`}
        {status === 'error' && '⚠️ Couldn\'t load routes. Check connection.'}
        {status === 'loaded' && (
          <button
            onClick={onRefresh}
            style={{ display: 'block', marginTop: 6, fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            Refresh data
          </button>
        )}
        <div style={{ marginTop: 8, color: '#ccc' }}>
          Data: OpenStreetMap contributors
        </div>
      </div>
    </div>
  );
}
