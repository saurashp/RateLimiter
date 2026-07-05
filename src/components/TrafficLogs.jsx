import React, { useState } from 'react';
import { ShieldAlert, Play, Pause, Trash2, Filter, AlertTriangle, ShieldX } from 'lucide-react';

export default function TrafficLogs({ logs, onClearLogs, anomalies, onMitigateAnomaly }) {
  const [isStreaming, setIsStreaming] = useState(true);
  const [filterPath, setFilterPath] = useState('');
  const [filterReason, setFilterReason] = useState('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesPath = log.path.toLowerCase().includes(filterPath.toLowerCase()) || 
                        log.ip.includes(filterPath);
    const matchesReason = filterReason === 'ALL' || 
                         (filterReason === 'GLOBAL' && log.reason.toLowerCase().includes('global')) ||
                         (filterReason === 'ROUTE' && log.reason.toLowerCase().includes('override'));
    return matchesPath && matchesReason;
  });

  // If streaming is paused, we slice a snapshot, otherwise we use the original.
  // In a real app we might store a paused logs buffer. Let's just slice the log list.
  const displayLogs = isStreaming ? filteredLogs : filteredLogs.slice(0, 50); // Frozen display

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 0' }}>
      
      {/* AI Anomaly Panel */}
      {anomalies && anomalies.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          padding: '16px 20px',
          animation: 'pulse-glow 3s infinite',
          '--glow-color': 'rgba(239, 68, 68, 0.25)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-critical)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={18} /> Threat Intelligence & Anomaly Alerts ({anomalies.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {anomalies.map((anomaly) => (
              <div key={anomaly.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(7, 12, 24, 0.4)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldX size={16} style={{ color: 'var(--color-critical)' }} />
                  <span style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                    <strong>{anomaly.ip}</strong> ({anomaly.country}) is triggering consecutive Rate Limits on <code style={{ color: 'var(--color-critical)' }}>{anomaly.path}</code> ({anomaly.count} hits). Potential <strong>{anomaly.pattern}</strong> pattern detected.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => onMitigateAnomaly(anomaly.ip, 'WHITELIST')}
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Trust (Whitelist IP)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Banner Control */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
            <ShieldAlert size={26} style={{ color: 'var(--color-critical)' }} /> Live Audit Log
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Streaming history of requests blocked with <code>HTTP 429 (Too Many Requests)</code>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${isStreaming ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={() => setIsStreaming(!isStreaming)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isStreaming ? (
              <>
                <Pause size={14} /> Pause Stream
              </>
            ) : (
              <>
                <Play size={14} /> Resume Stream
              </>
            )}
          </button>
          <button 
            className="btn btn-danger" 
            onClick={onClearLogs}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={14} /> Clear Logs
          </button>
        </div>
      </div>

      {/* Filters and Search Panel */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search by endpoint route, method, or IP..." 
            value={filterPath}
            onChange={(e) => setFilterPath(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              width: '100%',
              padding: 0
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Filter Block Type:</label>
          <select 
            value={filterReason} 
            onChange={(e) => setFilterReason(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '0.8rem', height: '30px' }}
          >
            <option value="ALL">All Blocks</option>
            <option value="GLOBAL">Global Rules</option>
            <option value="ROUTE">Route Overrides</option>
          </select>
        </div>
      </div>

      {/* Log Feed Table */}
      <div className="cyber-table-container">
        <table className="cyber-table">
          <thead>
            <tr>
              <th style={{ width: '15%' }} className="hide-mobile">Timestamp</th>
              <th style={{ width: '20%' }}>Client IP</th>
              <th style={{ width: '12%' }}>Method / Code</th>
              <th style={{ width: '25%' }}>Target Endpoint</th>
              <th style={{ width: '28%' }}>Block Reason</th>
            </tr>
          </thead>
          <tbody>
            {displayLogs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                  {isStreaming ? 'Waiting for blocked request stream...' : 'Stream paused. No data to display.'}
                </td>
              </tr>
            ) : (
              displayLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }} className="hide-mobile">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem' }} title={log.country}>
                        {log.countryFlag}
                      </span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {log.ip}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {log.method}
                      </span>
                      <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                        429
                      </span>
                    </div>
                  </td>
                  <td>
                    <code style={{ color: 'var(--color-primary-hover)', fontWeight: 'bold' }}>
                      {log.path}
                    </code>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {log.reason}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
