'use client';

import { useState, useEffect } from 'react';
import IssueTracker from './IssueTracker';
import MeetingTracker from './MeetingTracker';
import { useRouter } from 'next/navigation';

export default function Dashboard({ team }: { team: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('issue_tracker');
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [zohoConnected, setZohoConnected] = useState(false);

  useEffect(() => {
    // Load persisted active tab from localStorage
    const savedTab = localStorage.getItem('zoho_updater_tab');
    if (savedTab) setActiveTab(savedTab);
    
    setIsLoaded(true);

    // Fetch projects
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setProjects(data);
      })
      .catch(err => console.error("Failed to fetch projects", err));
      
    // Check Zoho auth status
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => setZohoConnected(data.isConnected))
      .catch(err => console.error("Failed to check auth status", err));
  }, []);

  const handleSetTab = (newTab: string) => {
    setActiveTab(newTab);
    localStorage.setItem('zoho_updater_tab', newTab);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.refresh(); // Tells Next.js to re-fetch Server Components (page.tsx) without the cookie
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header className="flex-between mb-8">
        <div>
          <h1 style={{ fontSize: '2rem', background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Zoho Dashboard Updater
          </h1>
          <p className="text-muted" style={{ color: 'var(--text-muted)' }}>Team: <strong>{team}</strong></p>
        </div>
        <div className="flex gap-4 items-center">
          {!zohoConnected && (
            <a href="/api/auth/zoho" className="btn btn-primary" style={{ background: '#f59e0b' }}>
              Connect Zoho
            </a>
          )}
          {zohoConnected && (
            <span className="badge badge-success" style={{ padding: '0.5rem 1rem' }}>✓ Zoho Connected</span>
          )}
          <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <nav className="glass-panel mb-6" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
        {[
          { id: 'issue_tracker', label: 'Issue Tracker' },
          { id: 'meeting_tracker', label: 'Meeting Tracker' },
          { id: 'client_logs', label: 'Client Wise Update Logs' },
          { id: 'others', label: 'Others' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => handleSetTab(tab.id)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: '1 0 auto' }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="glass-panel" style={{ padding: '2rem', minHeight: '60vh' }}>
        {activeTab === 'issue_tracker' && <IssueTracker team={team} projects={projects} />}
        {activeTab === 'meeting_tracker' && <MeetingTracker team={team} />}
        {activeTab === 'client_logs' && <div className="flex-center" style={{ height: '100%' }}><h2>Client Wise Update Logs (Coming Soon)</h2></div>}
        {activeTab === 'others' && (
          <div className="flex-center flex-col gap-4" style={{ height: '100%' }}>
            <h2>Other Tools</h2>
            <div className="flex gap-4">
              <button className="btn btn-primary">Mock / Live Update</button>
              <button className="btn btn-secondary">Documents</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
