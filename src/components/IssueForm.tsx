'use client';

import { useState } from 'react';
import SearchableSelect from './SearchableSelect';

type Project = { id: string; name: string };

type IssueFormProps = {
  project: Project;
  projects: Project[];
  onCancel: () => void;
  onSubmit: (issue: any) => void;
};

type ChildId = {
  id: string;
  projectId: string;
  subjectLine: string;
};

export default function IssueForm({ project, projects, onCancel, onSubmit }: IssueFormProps) {
  // Form State
  const [parentSubject, setParentSubject] = useState('');
  const [children, setChildren] = useState<ChildId[]>([]);
  
  // Field State
  const [status] = useState('Open');
  const [liveUat, setLiveUat] = useState('Live');
  const [issueReq, setIssueReq] = useState('Requirement');
  const [projectVersion, setProjectVersion] = useState('');
  const [handledBy, setHandledBy] = useState('');
  const [remarks, setRemarks] = useState('');
  const [raisedDate, setRaisedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [additionalInfo, setAdditionalInfo] = useState('');

  // UI Flow State
  const [showSubjectPopup, setShowSubjectPopup] = useState<'parent' | number | null>(null);
  const [tempSubject, setTempSubject] = useState('');
  const [relationshipWarning, setRelationshipWarning] = useState(false);

  const openKambalaPopup = (url: string) => {
    const width = 1100;
    const height = 750;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const popup = window.open(url, 'KambalaTrackerPopup', `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`);
    if (popup) {
      popup.focus();
    }
  };

  // Parent tracking logic
  const handleReportIssue = () => {
    openKambalaPopup(`https://issuetracker.kambala.co.in/issuetracker/set_project.php?project_id=${project.id}`);
    setShowSubjectPopup('parent');
    setTempSubject('');
  };

  const saveSubject = () => {
    if (!tempSubject.trim()) return;
    
    if (showSubjectPopup === 'parent') {
      setParentSubject(tempSubject);
    } else if (typeof showSubjectPopup === 'number') {
      const newChildren = [...children];
      newChildren[showSubjectPopup].subjectLine = tempSubject;
      setChildren(newChildren);
    }
    setShowSubjectPopup(null);
  };

  const cancelSubject = () => {
    // User clicked "not raised issue"
    setShowSubjectPopup(null);
  };

  // Child tracking logic
  const handleAddChild = () => {
    setChildren([...children, { id: Date.now().toString(), projectId: project.id, subjectLine: '' }]);
  };

  const handleCreateChildIssue = (index: number) => {
    const childProjId = children[index].projectId;
    if (!childProjId) return alert("Select project for child first.");
    openKambalaPopup(`https://issuetracker.kambala.co.in/issuetracker/set_project.php?project_id=${childProjId}`);
    setShowSubjectPopup(index);
    setTempSubject('');
  };

  const updateChildProject = (index: number, pid: string) => {
    const newChildren = [...children];
    newChildren[index].projectId = pid;
    setChildren(newChildren);
  };

  // Relationship Logic
  const handleAddRelationship = async () => {
    if (!parentSubject) return alert("Please report parent issue first to get Parent ID.");
    
    // Extract parent ID from "parent id : 0009304: CORP ACTION" format or simply from text.
    // For simplicity, we assume the user types the ID in the subject. Let's just find the first number.
    const parentIdMatch = parentSubject.match(/\d+/);
    if (!parentIdMatch) return alert("Could not extract Parent ID from subject line.");
    
    const parentId = parentIdMatch[0];
    
    // Extract child IDs
    const childIds = children.map(c => {
      const match = c.subjectLine.match(/\d+/);
      return match ? match[0] : null;
    }).filter(Boolean);

    if (childIds.length === 0) return alert("No valid child IDs found.");

    const childIdsStr = childIds.join(',');
    
    try {
      await navigator.clipboard.writeText(childIdsStr);
      openKambalaPopup(`https://issuetracker.kambala.co.in/issuetracker/view.php?id=${parentId}`);
      setRelationshipWarning(true);
    } catch (err) {
      alert("Failed to copy child IDs to clipboard.");
    }
  };

  const handleSubmit = () => {
    const childIds = children.map(c => {
      const match = c.subjectLine.match(/\d+/);
      return match ? match[0] : '';
    }).filter(Boolean).join(',');

    const finalIssue = {
      client: project.name,
      subjectLine: parentSubject,
      status: status,
      liveUat: liveUat,
      issueReq: issueReq,
      projectVersion: projectVersion,
      childIds: childIds,
      handledBy: handledBy,
      remarks: remarks,
      raisedDate: raisedDate,
      additionalInfo: additionalInfo
    };

    onSubmit(finalIssue);
  };

  return (
    <div className="glass-panel p-6 mb-6" style={{ padding: '2rem', border: '1px solid var(--primary)' }}>
      <h3 className="text-strong mb-4" style={{ fontSize: '1.25rem' }}>Create Issue - {project.name}</h3>

      {/* Action Buttons Header */}
      <div className="flex gap-4 mb-6">
        <button className="btn btn-primary" onClick={handleReportIssue}>
          1. Report Issue (Kambala)
        </button>
        <button className="btn btn-secondary" onClick={handleAddChild}>
          + Add Child Form
        </button>
      </div>

      <div className="input-group mb-6">
        <label className="input-label">Parent Issue Subject Line</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            className="input-field" 
            value={parentSubject} 
            onChange={e => setParentSubject(e.target.value)}
            placeholder="Click 'Report Issue' above or type manually..."
          />
          <button className="btn btn-secondary" onClick={handleAddRelationship} title="Add Child Relationship">
            🔗 Connect Children
          </button>
        </div>
      </div>

      {children.length > 0 && (
        <div className="mb-6 p-4" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
          <h4 className="mb-4">Child Issues</h4>
          {children.map((child, idx) => (
            <div key={child.id} className="flex gap-4 mb-4 items-center">
              <SearchableSelect 
                options={projects}
                value={child.projectId}
                onChange={val => updateChildProject(idx, val)}
                placeholder="Select project..."
                width="200px"
              />
              <button className="btn btn-secondary" onClick={() => handleCreateChildIssue(idx)}>
                Create in Tracker
              </button>
              <input 
                type="text" 
                className="input-field" 
                value={child.subjectLine} 
                onChange={e => {
                  const newC = [...children];
                  newC[idx].subjectLine = e.target.value;
                  setChildren(newC);
                }}
                placeholder="Child Subject Line"
                style={{ flex: 1 }}
              />
              <button className="btn btn-danger" onClick={() => setChildren(children.filter((_, i) => i !== idx))}>
                X
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Additional Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="input-group">
          <label className="input-label">Live/UAT</label>
          <select className="input-field" value={liveUat} onChange={e => setLiveUat(e.target.value)}>
            <option value="Live">Live</option>
            <option value="UAT">UAT</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Issue/Requirement</label>
          <select className="input-field" value={issueReq} onChange={e => setIssueReq(e.target.value)}>
            <option value="Issue">Issue</option>
            <option value="Requirement">Requirement</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Project and Version</label>
          <input type="text" className="input-field" value={projectVersion} onChange={e => setProjectVersion(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Handled By</label>
          <input type="text" className="input-field" value={handledBy} onChange={e => setHandledBy(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Remarks</label>
          <input type="text" className="input-field" value={remarks} onChange={e => setRemarks(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Raised Date</label>
          <input type="date" className="input-field" value={raisedDate} onChange={e => setRaisedDate(e.target.value)} />
        </div>
      </div>
      <div className="input-group mt-4">
        <label className="input-label">Additional Info</label>
        <textarea className="input-field" rows={3} value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)}></textarea>
      </div>

      <div className="flex gap-4 mt-6 justify-end">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit}>Submit Entry to Sheet</button>
      </div>

      {/* Subject Line Mandatory Popup */}
      {showSubjectPopup !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="mb-4">Enter Issue Subject Line</h3>
            <p className="text-muted mb-4">Please paste the subject line you just created in Kambala Tracker.</p>
            <input 
              type="text" 
              className="input-field mb-6" 
              value={tempSubject} 
              onChange={e => setTempSubject(e.target.value)}
              placeholder="e.g. 0010889: Capture Purpose..."
              autoFocus
            />
            <div className="flex justify-end gap-4">
              <button className="btn btn-danger" onClick={cancelSubject}>Not Raised Issue</button>
              <button className="btn btn-primary" onClick={saveSubject} disabled={!tempSubject.trim()}>
                Save Subject Line
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Relationship Added Warning Popup */}
      {relationshipWarning && (
        <div className="modal-overlay">
          <div className="modal-content text-center">
            <h3 className="mb-4 text-warning">Issue ID relationship added?</h3>
            <p className="text-muted mb-6">Child IDs have been copied to your clipboard. Did you add them successfully in the parent ticket?</p>
            <div className="flex justify-center gap-4">
              <button className="btn btn-secondary" onClick={() => { setRelationshipWarning(false); alert("Please ensure relationship is added in the tracker."); }}>
                No
              </button>
              <button className="btn btn-primary" onClick={() => setRelationshipWarning(false)}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
