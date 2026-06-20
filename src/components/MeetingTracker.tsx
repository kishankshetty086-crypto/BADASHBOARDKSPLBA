'use client';

import { useState, useEffect } from 'react';

type Meeting = {
  client: string;
  agenda: string;
  dateTime: string;
  participants: string;
  baParticipants: string;
  meetingLink: string;
  remarks: string;
};

const EMPTY_FORM: Meeting = {
  client: '',
  agenda: '',
  dateTime: '',
  participants: '',
  baParticipants: '',
  meetingLink: '',
  remarks: '',
};

export default function MeetingTracker({ team }: { team: string }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Meeting>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [filterClient, setFilterClient] = useState('');
  // New state for Zoho meeting modal
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingUrlInput, setMeetingUrlInput] = useState('');


  const loadMeetings = (client?: string) => {
    setLoading(true);
    setFetchError('');
    const url = client ? `/api/meetings?client=${encodeURIComponent(client)}` : '/api/meetings';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.error) { setFetchError(data.error); setMeetings([]); return; }
        const mapped: Meeting[] = (Array.isArray(data) ? data : []).map((r: any) => ({
          client: r['CLIENT'] || '',
          agenda: r['MEETING AGENDA'] || '',
          dateTime: r['Date & Time'] || '',
          participants: r['Participants'] || '',
          baParticipants: r['BA Participants'] || '',
          meetingLink: r['MEETING LINK'] || '',
          remarks: r['Remarks'] || '',
        }));
        setMeetings(mapped);
      })
      .catch(() => setFetchError('Network error fetching meetings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMeetings(); }, []);

  const handleSubmit = async () => {
    if (!form.client || !form.agenda || !form.dateTime) {
      alert('Client, Agenda and Date & Time are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error || data.status === 'failure') throw new Error(data.error || data.error_message);
      setMeetings(prev => [...prev, form]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      alert('Meeting saved to Zoho Sheets!');
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilter = () => loadMeetings(filterClient.trim() || undefined);

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-6">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Meeting Tracker</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Team: <strong>{team}</strong></p>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Schedule Meeting'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel mb-6" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Filter by client name..."
          value={filterClient}
          onChange={e => setFilterClient(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleFilter()}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <button className="btn btn-secondary" onClick={handleFilter}>Search</button>
        <button className="btn btn-secondary" onClick={() => { setFilterClient(''); loadMeetings(); }}>Clear</button>
        <button className="btn btn-secondary" onClick={() => loadMeetings(filterClient || undefined)} title="Refresh">↻ Refresh</button>
      </div>

      {/* Add Meeting Form */}
      {showForm && (
          {/* Top Zoho Meeting Button */}
          <button type="button" className="btn btn-secondary mb-2" onClick={() => setShowMeetingModal(true)}>
            Create Zoho Meeting
          </button>
          
        <div className="glass-panel mb-6" style={{ padding: '2rem', border: '1px solid var(--primary)' }}>
          <h3 className="mb-4" style={{ fontWeight: 600 }}>Schedule New Meeting</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Client *</label>
              <input type="text" className="input-field" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="e.g. PROSTOCKS" />
            </div>
            <div className="input-group">
              <label className="input-label">Meeting Agenda *</label>
              <input type="text" className="input-field" value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} placeholder="e.g. Sprint Review" />
            </div>
            <div className="input-group">
              <label className="input-label">Date & Time *</label>
              <input type="datetime-local" className="input-field" value={form.dateTime} onChange={e => setForm(f => ({ ...f, dateTime: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Meeting Link</label>
              <input type="url" className="input-field" value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))} placeholder="https://meet.zoho.in/..." />
            </div>
            <div className="input-group">
              <label className="input-label">Participants (Client Side)</label>
              <input type="text" className="input-field" value={form.participants} onChange={e => setForm(f => ({ ...f, participants: e.target.value }))} placeholder="Names or emails" />
            </div>
            <div className="input-group">
              <label className="input-label">BA Participants</label>
              <input type="text" className="input-field" value={form.baParticipants} onChange={e => setForm(f => ({ ...f, baParticipants: e.target.value }))} placeholder="BA team emails" />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Remarks</label>
              <textarea className="input-field" rows={2} value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Any additional notes..." />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <button className="btn btn-secondary" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save to Zoho Sheet'}
              </button>
              {/* Zoho Meeting Modal */}
              {showMeetingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                    <h3 className="text-lg font-semibold mb-4">Zoho Meeting</h3>
                    <iframe src="https://meeting.zoho.in/meeting/" className="w-full h-64 mb-4 border" title="Zoho Meeting"></iframe>
                    <label className="input-label block mb-2">Enter Meeting Link</label>
                    <input
                      type="url"
                      className="input-field w-full mb-4"
                      placeholder="https://meeting.zoho.in/..."
                      value={meetingUrlInput}
                      onChange={e => setMeetingUrlInput(e.target.value)}
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowMeetingModal(false);
                          setMeetingUrlInput('');
                        }}
                      >
                        Meeting Not created
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setForm(f => ({ ...f, meetingLink: meetingUrlInput }));
                          setShowMeetingModal(false);
                        }}
                        disabled={!meetingUrlInput.trim()}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Meetings Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Meeting Agenda</th>
              <th>Date & Time</th>
              <th>Participants</th>
              <th>BA Participants</th>
              <th>Meeting Link</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>⏳ Loading meetings...</td></tr>
            ) : fetchError ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#f87171' }}>⚠️ {fetchError}</td></tr>
            ) : meetings.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No meetings found.</td></tr>
            ) : meetings.map((m, i) => (
              <tr key={i}>
                <td><strong>{m.client}</strong></td>
                <td>{m.agenda}</td>
                <td style={{ whiteSpace: 'pre-line' }}>{m.dateTime}</td>
                <td style={{ fontSize: '0.85rem' }}>{m.participants || '-'}</td>
                <td style={{ fontSize: '0.85rem' }}>{m.baParticipants || '-'}</td>
                <td>
                  {m.meetingLink ? (
                    <a
                      href={m.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                    >
                      Join ↗
                    </a>
                  ) : '-'}
                </td>
                <td style={{ fontSize: '0.85rem' }}>{m.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
