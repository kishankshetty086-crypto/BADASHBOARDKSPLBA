'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TeamSelection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSelectTeam = async (team: string) => {
    setLoading(true);
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team }),
      });
      router.refresh(); // Refresh server components to read the new cookie
    } catch (err) {
      console.error('Failed to login', err);
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Welcome</h1>
        <p className="text-muted mb-8">Please select your team to continue</p>
        
        <div className="flex-col gap-4">
          <button 
            className="btn btn-primary" 
            style={{ padding: '1rem', fontSize: '1.1rem' }}
            onClick={() => handleSelectTeam('BA DELTA')}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'BA DELTA'}
          </button>
          <button 
            className="btn btn-primary" 
            style={{ padding: '1rem', fontSize: '1.1rem' }}
            onClick={() => handleSelectTeam('BA ALPHA')}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'BA ALPHA'}
          </button>
        </div>
      </div>
    </div>
  );
}
