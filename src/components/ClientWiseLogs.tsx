'use client';

import { useState, useEffect } from 'react';
import SearchableSelect from './SearchableSelect';

type Log = {
  status: string;
  updateInfo: string;
  remarks: string;
  projectLink: string;
  updatedDate: string;
};

const EMPTY_FORM = {
  status: 'Live',
  updateInfo: '',
  remarks: '',
  projectLink: '',
  updatedDate: new Date().toISOString().split('T')[0],
};

const STATUS_COLORS: Record<string, string> = {
  Live: '#22c55e',
  UAT: '#f59e0b',
  'In Progress': '#3b82f6',
  Pending: '#ef4444',
  Closed: '#6b7280',
};

export default function ClientWiseLogs({
  team,
  projects,
}: {
  team: string;
  projects: { id: string; name: string }[];
}) {
  const [selectedClient, setSelectedClient] = useState('');
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Derive unique client names from projects list
  const clientOptions = projects.map(p => ({ id: p.name, name: p.name }));

  const loadLogs = (clientName: string) => {
    if (!clientName) return;
    setLoading(true);
    setFetchError('');
    setLogs([]);
    fetch(`/api/client-logs?client=${encodeURIComponent(clientName)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          // Error code 2863 = sheet doesn't exist for this client
          if (data.code === 2863) {
            setFetchError(`No log sheet found for "${clientName}". This client may not have a dedicated log sheet yet.`);
          } else {
            setFetchError(data.error);
          }
          setLogs([]);
          return;
        }
        const mapped: Log[] = (Array.isArray(data) ? data : []).map((r: any) => ({
          status: r['Status'] || '',
          updateInfo: r['UPDATE INFORMATION'] || '',
          remarks: r['REMARKS'] || '',
          projectLink: r['Project Web/Mob Link'] || '',
          updatedDate: r['Updated date'] || '',
        }));
        setLogs(mapped);
      })
      .catch(() => setFetchError('Network error fetching logs.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedClient) loadLogs(selectedClient);
    else { setLogs([]); setFetchError(''); }
  }, [selectedClient]);

  const handleSubmit = async () => {
    if (!selectedClient) return alert('Please select a client first.');
    if (!form.updateInfo.trim()) return alert('Update Information is required.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/client-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client: selectedClient, ...form }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLogs(prev => [...prev, { ...form }]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      alert('Log saved to Zoho Sheets!');
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-6">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Client Wise Update Logs</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Team: <strong>{team}</strong></p>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
            disabled={!selectedClient}
            title={!selectedClient ? 'Select a client first' : ''}
          >
            {showForm ? 'Cancel' : '+ Add Update Log'}
          </button>
        </div>
      </div>

      {/* Client Selector */}
      <div className="glass-panel mb-6" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="text-strong" style={{ whiteSpace: 'nowrap' }}>Select Client:</label>
        <div style={{ flex: 1, minWidth: '220px', maxWidth: '360px' }}>
          <SearchableSelect
            options={clientOptions}
            value={selectedClient}
            onChange={setSelectedClient}
            placeholder="Search client..."
          />
        </div>
        {selectedClient && (
          <button
            className="btn btn-secondary"
            onClick={() => loadLogs(selectedClient)}
            title="Refresh"
          >
            ↻ Refresh
          </button>
        )}
      </div>

      {/* Add Log Form */}
      {showForm && selectedClient && (
        <div className="glass-panel mb-6" style={{ padding: '2rem', border: '1px solid var(--primary)' }}>
          <h3 className="mb-4" style={{ fontWeight: 600 }}>
            New Update Log — <span style={{ color: 'var(--primary)' }}>{selectedClient}</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option>Live</option>
                <option>UAT</option>
                <option>In Progress</option>
                <option>Pending</option>
                <option>Closed</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Updated Date</label>
              <input type="date" className="input-field" value={form.updatedDate} onChange={e => setForm(f => ({ ...f, updatedDate: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Project / Web / Mob Link</label>
              <input type="text" className="input-field" value={form.projectLink} onChange={e => setForm(f => ({ ...f, projectLink: e.target.value }))} placeholder="e.g. EXE, Web, Mob, FTP path..." />
            </div>
            <div className="input-group">
              <label className="input-label">Remarks</label>
              <input type="text" className="input-field" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Short summary..." />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Update Information *</label>
              <textarea
                className="input-field"
                rows={4}
                value={form.updateInfo}
                onChange={e => setForm(f => ({ ...f, updateInfo: e.target.value }))}
                placeholder="Describe the update in detail, FTP paths, changes made, etc..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <button className="btn btn-secondary" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save to Zoho Sheet'}
            </button>
          </div>
        </div>
      )}

      {/* Logs Table */}
      {!selectedClient ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>👈 Select a client above to view their update logs</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Updated Date</th>
                <th>Status</th>
                <th>Project / Link</th>
                <th>Update Information</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>⏳ Loading logs for {selectedClient}...</td></tr>
              ) : fetchError ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#f87171' }}>⚠️ {fetchError}</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No update logs found for {selectedClient}.</td></tr>
              ) : (
                [...logs].reverse().map((log, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: 'nowrap' }}>{log.updatedDate}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.7rem',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: (STATUS_COLORS[log.status] || '#6b7280') + '22',
                        color: STATUS_COLORS[log.status] || '#6b7280',
                        border: `1px solid ${STATUS_COLORS[log.status] || '#6b7280'}44`,
                      }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{log.projectLink || '-'}</td>
                    <td style={{ maxWidth: '400px', whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: 1.5 }}>{log.updateInfo}</td>
                    <td style={{ fontSize: '0.85rem' }}>{log.remarks || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
