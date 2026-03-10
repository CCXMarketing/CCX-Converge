/**
 * SeedButton.jsx — TEMPORARY COMPONENT
 * 
 * Add this to your app temporarily to populate the database.
 * Remove it after you've seeded the data.
 * 
 * USAGE:
 * 1. Copy this file to: C:\Projects\Converge\src\utils\SeedButton.jsx
 * 2. Import it in your App.jsx or any page:
 *    import SeedButton from './utils/SeedButton';
 * 3. Add <SeedButton /> anywhere in your JSX
 * 4. Click the button once
 * 5. Check your browser console for progress
 * 6. Remove the import and component after seeding
 */

import { useState } from 'react';
import { seedDatabase } from './seedData';

export default function SeedButton() {
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [results, setResults] = useState(null);

  const handleSeed = async () => {
    if (status === 'running') return;
    
    const confirmed = window.confirm(
      "This will populate Firestore with 10 demo partners, 17 interactions, 10 deals, and 3 commission records.\n\nOnly run this ONCE. Continue?"
    );
    
    if (!confirmed) return;

    setStatus('running');
    try {
      const res = await seedDatabase();
      setResults(res);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setResults({ error: err.message });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      background: '#02475A',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      fontFamily: 'sans-serif',
      maxWidth: '320px'
    }}>
      {status === 'idle' && (
        <>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
            Populate Radar with demo partner data
          </p>
          <button
            onClick={handleSeed}
            style={{
              background: '#ADC837',
              color: '#02475A',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
              width: '100%'
            }}
          >
            Seed Database
          </button>
        </>
      )}

      {status === 'running' && (
        <p style={{ margin: 0, fontSize: '14px' }}>
          ⏳ Seeding data... Check browser console for progress.
        </p>
      )}

      {status === 'done' && results && (
        <div style={{ fontSize: '13px' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#ADC837' }}>
            ✅ Seed Complete!
          </p>
          <p style={{ margin: '2px 0' }}>Partners: {results.partners}/10</p>
          <p style={{ margin: '2px 0' }}>Interactions: {results.interactions}/17</p>
          <p style={{ margin: '2px 0' }}>Deals: {results.deals}/10</p>
          <p style={{ margin: '2px 0' }}>Commissions: {results.commissions}/3</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '11px', opacity: 0.7 }}>
            Now remove this component from your code.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div style={{ fontSize: '13px' }}>
          <p style={{ margin: '0 0 4px 0', color: '#ff6b6b', fontWeight: 'bold' }}>
            ❌ Error
          </p>
          <p style={{ margin: 0 }}>{results?.error}</p>
        </div>
      )}
    </div>
  );
}