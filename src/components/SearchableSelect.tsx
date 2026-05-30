'use client';

import { useState, useRef, useEffect } from 'react';

type Option = { id: string; name: string };

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search...",
  width = '100%'
}: {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  width?: string | number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width }}>
      <div 
        className="input-field" 
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '42px' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '1rem', color: selectedOption ? 'var(--text-strong)' : 'var(--text-muted)' }}>
          {selectedOption ? `${selectedOption.name} (ID: ${selectedOption.id})` : placeholder}
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>▼</span>
      </div>
      
      {isOpen && (
        <div 
          className="glass-panel" 
          style={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            zIndex: 100, 
            marginTop: '4px',
            maxHeight: '350px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--surface)'
          }}
        >
          <input 
            type="text" 
            className="input-field" 
            placeholder="Type to search..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ margin: '0.5rem', width: 'calc(100% - 1rem)' }}
            autoFocus
          />
          <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '0.5rem' }}>
            {filteredOptions.length > 0 ? filteredOptions.map(o => (
              <div 
                key={o.id}
                onClick={() => {
                  onChange(o.id);
                  setIsOpen(false);
                  setSearch('');
                }}
                style={{
                  padding: '0.625rem 1rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--surface-border)',
                  background: value === o.id ? 'var(--surface-hover)' : 'transparent',
                  transition: 'background 0.1s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = value === o.id ? 'var(--surface-hover)' : 'transparent')}
              >
                {o.name} <span className="text-muted" style={{ fontSize: '0.8rem' }}>(ID: {o.id})</span>
              </div>
            )) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No matches found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
