import React, { useState } from 'react';

const SAFETY_CONFIG = [
  { key: 'high', label: 'High safety', color: '#1a9e74', desc: 'Protected trails & cycleways' },
  { key: 'med',  label: 'Medium safety', color: '#e09f27', desc: 'Painted lanes & low-speed roads' },
  { key: 'low',  label: 'Low safety', color: '#e04a4a', desc: 'Shared arterial roads' },
  { key: 'primitive', label: 'Primitive / Unimproved', color: '#a07840', desc: 'Unpaved or unimproved trails' },
];

export default function Sidebar({ mode, setMode, safetyVis, toggleSafety, status, count, onRefresh }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
  <div style={{ position: 'relative', width: collapsed ? 0 : 240, flexShrink: 0, transition: 'width 0.2s' }}>
    <button
      onClick={() => setCollapsed(!collapsed)}
      style={{
        position: 'absolute', bottom: 24, left: collapsed ? 12 : 252,
        zIndex: 2000, background: '#fff', border: '1px solid #ddd',
        borderRadius: 20, padding: '4px 10px', fontSize: 12,
        cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        transition: 'left 0.2s',
      }}
    >
      {collapsed ? '☰ Menu' : '✕ Hide'}
    </button>

    {!collapsed && (
      <div style={{
        width: 240, height: '100vh', background: '#fff', borderRight: '1px solid #e0ddd8',
        display: 'flex', flexDirection: 'column', padding: '20px 16px',
        gap: 24, overflowY: 'auto',
      }}>
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
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{label}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Key
          </div>
          {[
            { color: '#1a9e74', label: 'Protected trail / cycleway', weight: 4 },
            { color: '#e09f27', label: 'Painted bike lane', weight: 3 },
            { color: '#e04a4a', label: 'Shared road', weight: 3 },
            { color: '#a07840', label: 'Primitive / unimproved', weight: 3 },
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
        </div>

        <div style={{ marginTop: 'auto', fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>
          {status === 'loading' && '⏳ Loading routes…'}
          {status === 'loaded' && `✅ ${count} segments loaded`}
          {status === 'error' && '⚠️ Couldn\'t load routes.'}
          {status === 'loaded' && (
            <button
              onClick={onRefresh}
              style={{ display: 'block', marginTop: 6, fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              Refresh data
            </button>
          )}
          <div style={{ marginTop: 8, color: '#ccc' }}>Data: OpenStreetMap + City of Billings GIS</div>
        </div>
      </div>
    )}
  </div>
);
}