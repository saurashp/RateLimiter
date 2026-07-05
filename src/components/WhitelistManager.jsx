import React, { useState } from 'react';
import { Plus, Trash2, ShieldAlert, Key, Globe, Search, ShieldCheck } from 'lucide-react';

export default function WhitelistManager({ whitelist, onAddEntry, onRemoveEntry }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [type, setType] = useState('IP');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!value.trim()) {
      setError('Value field cannot be empty');
      return;
    }

    if (!reason.trim()) {
      setError('Bypass reason is required for auditing');
      return;
    }

    // IP validation regex
    if (type === 'IP') {
      const ipPattern = /^((25[0-5]|2[0-4][0-9]|[0-9]?[0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[0-9]?[0-9]?)$/;
      if (!ipPattern.test(value.trim())) {
        setError('Please enter a valid IPv4 address (e.g., 192.168.1.1)');
        return;
      }
    } else {
      // API Key validation
      if (value.trim().length < 8) {
        setError('API Key should be at least 8 characters long');
        return;
      }
    }

    onAddEntry({
      id: Date.now().toString(),
      type,
      value: value.trim(),
      reason: reason.trim(),
      addedAt: new Date().toISOString()
    });

    // Reset Form
    setValue('');
    setReason('');
    setShowAddForm(false);
  };

  const filteredWhitelist = whitelist.filter(entry => 
    entry.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 0' }}>
      
      {/* Top Banner Control */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
            <ShieldCheck size={26} style={{ color: 'var(--color-optimal)' }} /> Whitelist Management
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Manage trusted IPs and API tokens that bypass standard rate limiting rules.
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={16} /> Add Whitelist Rule
        </button>
      </div>

      {/* Add Whitelist Form Modal/Card */}
      {showAddForm && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--color-primary)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.1)'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: 'var(--color-primary)' }} /> Create Bypass Exception
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            
            {/* Type selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Target Type</label>
              <select value={type} onChange={(e) => { setType(e.target.value); setError(''); setValue(''); }} style={{ height: '38px' }}>
                <option value="IP">Client IP Address</option>
                <option value="API_KEY">API Authorization Key</option>
              </select>
            </div>

            {/* Value */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                {type === 'IP' ? 'IPv4 Address' : 'API Key token'}
              </label>
              <input
                type="text"
                placeholder={type === 'IP' ? 'e.g. 185.190.140.2' : 'e.g. key_checkout_service'}
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(''); }}
                style={{ height: '38px' }}
              />
            </div>

            {/* Description/Reason */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bypass Audit Metadata (Why?)</label>
              <input
                type="text"
                placeholder="e.g. Third party payment gateway webhook callback system"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ height: '38px' }}
              />
            </div>

            {/* Action buttons and warnings */}
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
              {error ? (
                <div style={{ color: 'var(--color-critical)', fontSize: '0.8125rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={14} /> {error}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  * All changes reflect immediately in the live traffic stream.
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddForm(false); setError(''); setValue(''); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Activate Rule
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

      {/* Whitelist Search & Filter */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Search size={18} style={{ color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          placeholder="Filter whitelist entries by address, key or bypass reason..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Whitelist Data Table */}
      <div className="cyber-table-container">
        <table className="cyber-table">
          <thead>
             <tr>
              <th>Type</th>
              <th>Target Identifier</th>
              <th>Bypass Reason</th>
              <th className="hide-mobile">Created At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWhitelist.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                  No whitelist exceptions found matching search criteria.
                </td>
              </tr>
            ) : (
              filteredWhitelist.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <span className={`badge ${entry.type === 'IP' ? 'badge-primary' : 'badge-success'}`} style={{ display: 'inline-flex', gap: '6px' }}>
                      {entry.type === 'IP' ? <Globe size={10} /> : <Key size={10} />}
                      {entry.type === 'IP' ? 'IP Address' : 'API Key'}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                      {entry.value}
                    </code>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {entry.reason}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }} className="hide-mobile">
                    {new Date(entry.addedAt).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-danger"
                      onClick={() => onRemoveEntry(entry.id)}
                      style={{ padding: '6px' }}
                      title="Revoke Exception"
                    >
                      <Trash2 size={14} />
                    </button>
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
