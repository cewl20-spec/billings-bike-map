import React, { useState } from 'react';
import { saveOverride, clearOverride } from '../routeUtils';

const SAFETY_OPTIONS = ['high', 'med', 'low'];
const MODE_OPTIONS = ['rec', 'commute', 'both'];
const SAFETY_LABELS = { high: '🟢 High', med: '🟡 Medium', low: '🔴 Low' };
const MODE_LABELS = { rec: '🚵 Recreation', commute: '🏙 Commute', both: '🔄 Both' };

export default function RoutePopup({ route, onOverrideSaved }) {
  const [editing, setEditing] = useState(false);
  const [safety, setSafety] = useState(route.safety);
  const [mode, setMode] = useState(route.mode);
  const [notes, setNotes] = useState(route.notes || '');

  function handleSave() {
    saveOverride(route.id, { safety, mode, notes });
    onOverrideSaved?.();
    setEditing(false);
  }

  function handleClear() {
    clearOverride(route.id);
    setSafety(route.autoSafety);
    setMode(route.autoMode);
    setNotes('');
    onOverrideSaved?.();
    setEditing(false);
  }

  return (
    <div style={{ minWidth: 200 }}>
      <div className="route-popup-name">
        {route.name || 'Unnamed segment'}
      </div>
      <div className="route-popup-type">{route.type}</div>

      {!editing ? (
        <>
          <div className="route-popup-badges">
            <span className={`badge badge-${route.safety}`}>{SAFETY_LABELS[route.safety]}</span>
            <span className={`badge badge-${route.mode}`}>{MODE_LABELS[route.mode]}</span>
            {route.hasOverride && <span className="badge" style={{background:'#e8f0ff',color:'#3355aa'}}>✏️ Edited</span>}
          </div>
          {route.notes && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#555', fontStyle: 'italic' }}>
              {route.notes}
            </div>
          )}
          <button
            onClick={() => setEditing(true)}
            style={{ marginTop: 10, fontSize: 11, color: '#3366cc', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            ✏️ Override safety / mode
          </button>
        </>
      ) : (
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Safety score</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {SAFETY_OPTIONS.map(s => (
                <button key={s} onClick={() => setSafety(s)} style={{
                  padding: '3px 8px', fontSize: 11, borderRadius: 12, cursor: 'pointer',
                  border: safety === s ? '1.5px solid #333' : '1px solid #ccc',
                  background: safety === s ? '#222' : '#fff',
                  color: safety === s ? '#fff' : '#333',
                }}>
                  {SAFETY_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Best for</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {MODE_OPTIONS.map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: '3px 8px', fontSize: 11, borderRadius: 12, cursor: 'pointer',
                  border: mode === m ? '1.5px solid #333' : '1px solid #ccc',
                  background: mode === m ? '#222' : '#fff',
                  color: mode === m ? '#fff' : '#333',
                }}>
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Rough surface near 3rd Ave, construction until June"
              style={{ width: '100%', fontSize: 11, padding: '4px 6px', borderRadius: 4, border: '1px solid #ccc', resize: 'vertical', minHeight: 48 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleSave} style={{ fontSize: 11, padding: '4px 10px', background: '#222', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              Save
            </button>
            <button onClick={() => setEditing(false)} style={{ fontSize: 11, padding: '4px 10px', background: '#f0f0f0', color: '#333', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>
              Cancel
            </button>
            {route.hasOverride && (
              <button onClick={handleClear} style={{ fontSize: 11, padding: '4px 10px', background: '#fff', color: '#cc3333', border: '1px solid #ffaaaa', borderRadius: 6, cursor: 'pointer' }}>
                Reset to auto
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
