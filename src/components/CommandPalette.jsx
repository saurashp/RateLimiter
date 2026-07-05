import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, onAction }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const actions = [
    { id: 'nav_dashboard', name: 'Navigate: Overview Dashboard', category: 'Navigation', icon: Cpu, action: () => onAction('nav', 'dashboard') },
    { id: 'nav_config', name: 'Navigate: Configuration Shell', category: 'Navigation', icon: Terminal, action: () => onAction('nav', 'config') },
    { id: 'nav_logs', name: 'Navigate: Traffic & Audit Logs', category: 'Navigation', icon: Terminal, action: () => onAction('nav', 'logs') },
    { id: 'nav_whitelist', name: 'Navigate: Whitelist Manager', category: 'Navigation', icon: ShieldAlert, action: () => onAction('nav', 'whitelist') },
    { id: 'toggle_fail_open', name: 'Toggle Policy: Fail-Open / Fail-Closed', category: 'Security', icon: ShieldAlert, action: () => onAction('toggle', 'failOpen') },
    { id: 'toggle_headers', name: 'Toggle Headers: X-RateLimit Injection', category: 'Headers', icon: Terminal, action: () => onAction('toggle', 'xHeaderInjection') },
    { id: 'toggle_anonymize', name: 'Toggle Privacy: IP Anonymization', category: 'Privacy', icon: ShieldAlert, action: () => onAction('toggle', 'ipAnonymization') },
    { id: 'reset_stats', name: 'System: Reset Live Metrics & Charts', category: 'System', icon: Cpu, action: () => onAction('system', 'resetStats') },
    { id: 'clear_logs', name: 'System: Clear Audit Logs Stream', category: 'System', icon: Terminal, action: () => onAction('system', 'clearLogs') },
    { id: 'add_whitelist_ip', name: 'Action: Add IP to Whitelist', category: 'Whitelist', icon: ShieldAlert, action: () => onAction('action', 'addWhitelist') }
  ];

  // Filter actions based on search
  const filteredActions = actions.filter(action =>
    action.name.toLowerCase().includes(query.toLowerCase()) ||
    action.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredActions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-backdrop">
      <div className="cmd-palette-container" ref={containerRef}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border-color)', gap: '12px' }}>
          <Search size={18} className="text-secondary" style={{ color: 'var(--text-secondary)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search actions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              outline: 'none',
              padding: 0
            }}
          />
          <div style={{ fontSize: '0.7rem', padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-main)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ESC
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {filteredActions.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No commands found matching "{query}"
            </div>
          ) : (
            filteredActions.map((action, index) => {
              const Icon = action.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={action.id}
                  onClick={() => {
                    action.action();
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    background: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={16} style={{ color: isSelected ? 'var(--color-primary-hover)' : 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {action.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                      {action.category}
                    </span>
                    {isSelected && <ArrowRight size={14} style={{ color: 'var(--color-primary)' }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid var(--border-color)', background: '#050A15', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div>Use <span style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '1px 4px', borderRadius: '3px' }}>↑↓</span> keys to navigate</div>
          <div>Press <span style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '1px 4px', borderRadius: '3px' }}>Enter</span> to execute</div>
        </div>
      </div>
    </div>
  );
}
