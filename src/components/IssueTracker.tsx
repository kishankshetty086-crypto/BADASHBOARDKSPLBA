'use client';

import { useState, useEffect } from 'react';
import IssueForm from './IssueForm';
import SearchableSelect from './SearchableSelect';

type Project = { id: string; name: string };

type Issue = {
  client: string;
  subjectLine: string;
  status: string;
  liveUat: string;
  issueReq: string;
  projectVersion: string;
  childIds: string;
  handledBy: string;
  remarks: string;
  raisedDate: string;
  additionalInfo: string;
};

// Mock data to simulate already reported issues
const MOCK_ISSUES: Issue[] = [
  {
    client: 'PROSTOCK',
    subjectLine: '0010723: Capital Gain Project Requirement.',
    status: 'Open',
    liveUat: 'Live',
    issueReq: 'Requirement',
    projectVersion: 'Have to Discuss',
    childIds: '',
    handledBy: 'Pradeep Kamath',
    remarks: '',
    raisedDate: '30/05/2026',
    additionalInfo: ''
  }
];

export default function IssueTracker({ team, projects }: { team: string, projects: Project[] }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string>('');
  const [fetchError, setFetchError] = useState<string>('');

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Fetch issues when client changes
  useEffect(() => {
    if (selectedProject) {
      setLoading(true);
      setFetchError('');
      fetch(`/api/issues?client=${encodeURIComponent(selectedProject.name)}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setFetchError(data.error);
            setIssues([]);
            return;
          }
          if (Array.isArray(data)) {
            // Zoho returns array of objects with keys matching columns
            const mappedIssues: Issue[] = data.map(record => ({
              client: record['Client'] || '',
              subjectLine: record['Issue Subject Line'] || '',
              status: record['Status'] || '',
              liveUat: record['Live/UAT'] || '',
              issueReq: record['Issue/Requirement'] || '',
              projectVersion: record['Project and Version'] || '',
              childIds: record['Child Id Details'] || '',
              handledBy: record['Handled By'] || '',
              remarks: record['Remarks'] || '',
              raisedDate: record['Raised Date'] || '',
              additionalInfo: record['Additional Info'] || ''
            }));
            setIssues(mappedIssues);
          } else {
            setIssues([]);
          }
        })
        .catch(err => {
          console.error("Failed to load issues", err);
          setFetchError('Network error fetching issues.');
          setIssues([]);
        })
        .finally(() => setLoading(false));
    } else {
      setIssues([]);
      setFetchError('');
    }
  }, [selectedProject]);

  const handleIssueSubmit = async (newIssue: Issue) => {
    setSubmitStatus('Saving to Zoho Sheets...');
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIssue)
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.status === 'failure') throw new Error(data.error_message || 'Zoho API Error');

      setIssues(prev => [...prev, newIssue]);
      setShowForm(false);
      setSubmitStatus('');
      alert("Successfully saved to Zoho Sheets!");
    } catch (err: any) {
      setSubmitStatus('');
      alert(`Failed to save to Zoho: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="flex-between mb-6">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Issue Tracker</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
          disabled={!selectedProjectId}
          title={!selectedProjectId ? 'Please select a client first' : ''}
        >
          Report Issue
        </button>
      </div>

      <div className="flex gap-4 mb-8 items-center">
        <label className="text-strong">Select Client:</label>
        <SearchableSelect 
          options={projects}
          value={selectedProjectId}
          onChange={setSelectedProjectId}
          placeholder="Select a client..."
          width="300px"
        />
      </div>

      {selectedProject && (
        <div className="mb-6 flex gap-4">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Report Issue</button>
          <button className="btn btn-secondary">Create Child ID</button>
        </div>
      )}

      {showForm && selectedProject && (
        <IssueForm 
          project={selectedProject} 
          onCancel={() => setShowForm(false)} 
          onSubmit={handleIssueSubmit} 
          projects={projects}
        />
      )}

      {selectedProject && (
        <div className="mt-4">
          <h3 className="mb-4 text-strong">Previously Reported Issues - {selectedProject.name}</h3>
          
          {submitStatus && (
            <div className="mb-4" style={{ color: 'var(--success)' }}>
              {submitStatus}
            </div>
          )}

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Issue Subject Line</th>
                  <th>Status</th>
                  <th>Live/UAT</th>
                  <th>Issue/Req</th>
                  <th>Version</th>
                  <th>Child IDs</th>
                  <th>Handled By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                      ⏳ Loading issues from Zoho Sheets...
                    </td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--error, #f87171)' }}>
                      ⚠️ Error: {fetchError}
                    </td>
                  </tr>
                ) : (
                  <>
                    {issues.map((issue, idx) => (
                      <tr key={idx}>
                        <td>{issue.client}</td>
                        <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={issue.subjectLine}>
                          {issue.subjectLine}
                        </td>
                        <td><span className="badge badge-success">{issue.status}</span></td>
                        <td>{issue.liveUat}</td>
                        <td>{issue.issueReq}</td>
                        <td>{issue.projectVersion}</td>
                        <td>{issue.childIds || '-'}</td>
                        <td>{issue.handledBy}</td>
                        <td>{issue.raisedDate}</td>
                      </tr>
                    ))}
                    {issues.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>No issues reported for this client yet.</td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
