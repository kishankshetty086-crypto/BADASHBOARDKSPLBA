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

const ZOHO_MEETING_URL =
  'https://meeting.zoho.in/meeting/60016380334/487065000000008011/meeting/create';

export default function MeetingTracker({ team }: { team: string }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Meeting>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [filterClient, setFilterClient] = useState('');
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingUrlInput, setMeetingUrlInput] = useState('');

  const loadMeetings = (client?: string) => {
    setLoading(true);
    setFetchError('');
    const url = client
      ? `/api/meetings?client=${encodeURIComponent(client)}`
      : '/api/meetings';
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setFetchError(data.error);
          setMeetings([]);
          return;
        }
        const mapped: Meeting[] = (Array.isArray(data) ? data : []).map(
          (r: Record<string, string>) => ({
            client: r['CLIENT'] || '',
            agenda: r['MEETING AGENDA'] || '',
            dateTime: r['Date & Time'] || '',
            participants: r['Participants'] || '',
            baParticipants: r['BA Participants'] || '',
            meetingLink: r['MEETING LINK'] || '',
            remarks: r['Remarks'] || '',
          })
        );
        setMeetings(mapped);
      })
      .catch(() => setFetchError('Network error fetching meetings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMeetings();
  }, []);

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
      if (data.error || data.status === 'failure')
        throw new Error(data.error || data.error_message);
      setMeetings((prev) => [...prev, form]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      alert('Meeting saved to Zoho Sheets!');
    } catch (err: unknown) {
      alert(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilter = () => loadMeetings(filterClient.trim() || undefined);

  const openZohoMeeting = () => {
    // Open Zoho meeting creation in a floating popup window
    window.open(
      ZOHO_MEETING_URL,
      'ZohoMeeting',
      'width=900,height=650,left=200,top=100,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes'
    );
    // Show mandatory modal in background to capture the link
    setShowMeetingModal(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-6">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Meeting Tracker</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            Team: <strong>{team}</strong>
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Schedule Meeting'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-panel mb-6"
        style={{
          padding: '1rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          className="input-field"
          placeholder="Filter by client name..."
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <button className="btn btn-secondary" onClick={handleFilter}>
          Search
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setFilterClient('');
            loadMeetings();
          }}
        >
          Clear
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => loadMeetings(filterClient || undefined)}
          title="Refresh"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Schedule Meeting Form */}
      {showForm && (
        <div
          className="glass-panel mb-6"
          style={{ padding: '2rem', border: '1px solid var(--primary)' }}
        >
          {/* Zoho Meeting Button at the top */}
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={openZohoMeeting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #2D8CFF 0%, #00BFFF 100%)',
                color: '#fff',
                border: 'none',
                padding: '0.55rem 1.2rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🎥 Create Zoho Meeting
            </button>
            {form.meetingLink && (
              <span
                style={{
                  marginLeft: '1rem',
                  fontSize: '0.82rem',
                  color: '#22c55e',
                }}
              >
                ✅ Meeting link added
              </span>
            )}
          </div>

          <h3 className="mb-4" style={{ fontWeight: 600 }}>
            Schedule New Meeting
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <div className="input-group">
              <label className="input-label">Client *</label>
              <input
                type="text"
                className="input-field"
                value={form.client}
                onChange={(e) =>
                  setForm((f) => ({ ...f, client: e.target.value }))
                }
                placeholder="e.g. PROSTOCKS"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Meeting Agenda *</label>
              <input
                type="text"
                className="input-field"
                value={form.agenda}
                onChange={(e) =>
                  setForm((f) => ({ ...f, agenda: e.target.value }))
                }
                placeholder="e.g. Sprint Review"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Date &amp; Time *</label>
              <input
                type="datetime-local"
                className="input-field"
                value={form.dateTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dateTime: e.target.value }))
                }
              />
            </div>
            <div className="input-group">
              <label className="input-label">Meeting Link</label>
              <input
                type="url"
                className="input-field"
                value={form.meetingLink}
                onChange={(e) =>
                  setForm((f) => ({ ...f, meetingLink: e.target.value }))
                }
                placeholder="https://meeting.zoho.in/..."
              />
            </div>
            <div className="input-group">
              <label className="input-label">Participants (Client Side)</label>
              <input
                type="text"
                className="input-field"
                value={form.participants}
                onChange={(e) =>
                  setForm((f) => ({ ...f, participants: e.target.value }))
                }
                placeholder="Names or emails"
              />
            </div>
            <div className="input-group">
              <label className="input-label">BA Participants</label>
              <input
                type="text"
                className="input-field"
                value={form.baParticipants}
                onChange={(e) =>
                  setForm((f) => ({ ...f, baParticipants: e.target.value }))
                }
                placeholder="BA team emails"
              />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Remarks</label>
              <textarea
                className="input-field"
                rows={2}
                value={form.remarks}
                onChange={(e) =>
                  setForm((f) => ({ ...f, remarks: e.target.value }))
                }
                placeholder="Any additional notes..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save to Zoho Sheet'}
            </button>
          </div>
        </div>
      )}

      {/* Zoho Meeting Mandatory Modal (shown in background while popup is open) */}
      {showMeetingModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '2rem',
              width: '420px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            }}
          >
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                color: '#f1f5f9',
              }}
            >
              🎥 Zoho Meeting
            </h3>
            <p
              style={{
                fontSize: '0.85rem',
                color: '#94a3b8',
                marginBottom: '1.25rem',
              }}
            >
              A Zoho Meeting creation window has opened. Once you create the
              meeting, paste the meeting link below.
            </p>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#cbd5e1',
              }}
            >
              Meeting Link *
            </label>
            <input
              type="url"
              className="input-field"
              style={{ width: '100%', marginBottom: '1.25rem' }}
              placeholder="https://meeting.zoho.in/..."
              value={meetingUrlInput}
              onChange={(e) => setMeetingUrlInput(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowMeetingModal(false);
                  setMeetingUrlInput('');
                }}
              >
                Meeting Not Created
              </button>
              <button
                className="btn btn-primary"
                disabled={!meetingUrlInput.trim()}
                onClick={() => {
                  setForm((f) => ({ ...f, meetingLink: meetingUrlInput.trim() }));
                  setShowMeetingModal(false);
                  setMeetingUrlInput('');
                }}
              >
                Submit
              </button>
            </div>
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
              <th>Date &amp; Time</th>
              <th>Participants</th>
              <th>BA Participants</th>
              <th>Meeting Link</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  ⏳ Loading meetings...
                </td>
              </tr>
            ) : fetchError ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#f87171',
                  }}
                >
                  ⚠️ {fetchError}
                </td>
              </tr>
            ) : meetings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  No meetings found.
                </td>
              </tr>
            ) : (
              meetings.map((m, i) => (
                <tr key={i}>
                  <td>
                    <strong>{m.client}</strong>
                  </td>
                  <td>{m.agenda}</td>
                  <td style={{ whiteSpace: 'pre-line' }}>{m.dateTime}</td>
                  <td style={{ fontSize: '0.85rem' }}>{m.participants || '-'}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {m.baParticipants || '-'}
                  </td>
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
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{m.remarks || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
