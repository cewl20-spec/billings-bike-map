import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import BikeMap from './components/BikeMap';
import { useRoutes } from './useRoutes';

export default function App() {
  const [mode, setMode] = useState('all');
  const [safetyVis, setSafetyVis] = useState({ high: true, med: true, low: true, primitive: true });  
  const { routes, status, error, count, refreshRoutes, reapplyOverrides } = useRoutes();

  function toggleSafety(key) {
    setSafetyVis(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const handleOverrideSaved = useCallback(() => {
    reapplyOverrides();
  }, [reapplyOverrides]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        mode={mode}
        setMode={setMode}
        safetyVis={safetyVis}
        toggleSafety={toggleSafety}
        status={status}
        count={count}
        onRefresh={refreshRoutes}
      />
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {status === 'error' && (
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, zIndex: 1000, color: '#856404',
          }}>
            ⚠️ {error} — Try refreshing or check your connection.
          </div>
        )}
        {status === 'loading' && (
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            background: '#fff', border: '1px solid #ddd', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, zIndex: 1000, color: '#555',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          }}>
            ⏳ Loading Billings bike infrastructure…
          </div>
        )}
        <BikeMap
          routes={routes}
          mode={mode}
          safetyVis={safetyVis}
          onOverrideSaved={handleOverrideSaved}
        />
      </div>
    </div>
  );
}
