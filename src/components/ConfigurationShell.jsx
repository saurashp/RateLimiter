import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, Plus, Trash2, Key, Terminal, Code, ToggleLeft, ToggleRight, Save, Info } from 'lucide-react';

export default function ConfigurationShell({
  config,
  onSaveConfig,
  overrides,
  onAddOverride,
  onToggleOverride,
  onDeleteOverride
}) {
  // Global settings state
  const [globalRps, setGlobalRps] = useState(config.globalRps);
  const [globalWindow, setGlobalWindow] = useState(config.globalWindow); // '1m', '5m', '15m', '1h'
  
  // Advanced parameters state
  const [redisPersistence, setRedisPersistence] = useState(config.redisPersistence);
  const [xHeaderInjection, setXHeaderInjection] = useState(config.xHeaderInjection);
  const [ipAnonymization, setIpAnonymization] = useState(config.ipAnonymization);
  const [failOpen, setFailOpen] = useState(config.failOpen);

  // Custom Error Payload State
  const [jsonText, setJsonText] = useState(JSON.stringify(config.errorPayload, null, 2));
  const [jsonError, setJsonError] = useState('');
  const [lines, setLines] = useState([]);

  // New override route form state
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [newRoutePath, setNewRoutePath] = useState('');
  const [newRouteRps, setNewRouteRps] = useState(5);
  const [newRouteWindow, setNewRouteWindow] = useState('1m');
  const [overrideError, setOverrideError] = useState('');

  // Handle JSON changes and compute line numbers
  useEffect(() => {
    const textLines = jsonText.split('\n');
    setLines(textLines);

    try {
      JSON.parse(jsonText);
      setJsonError('');
    } catch (e) {
      setJsonError(e.message);
    }
  }, [jsonText]);

  // Sync state with incoming config prop changes
  useEffect(() => {
    setGlobalRps(config.globalRps);
    setGlobalWindow(config.globalWindow);
    setRedisPersistence(config.redisPersistence);
    setXHeaderInjection(config.xHeaderInjection);
    setIpAnonymization(config.ipAnonymization);
    setFailOpen(config.failOpen);
    setJsonText(JSON.stringify(config.errorPayload, null, 2));
  }, [config]);

  const handleSave = () => {
    if (jsonError) return;

    onSaveConfig({
      globalRps: parseInt(globalRps, 10),
      globalWindow,
      redisPersistence,
      xHeaderInjection,
      ipAnonymization,
      failOpen,
      errorPayload: JSON.parse(jsonText)
    });
  };

  const handleAddOverrideSubmit = (e) => {
    e.preventDefault();
    setOverrideError('');

    if (!newRoutePath.trim()) {
      setOverrideError('Route path is required');
      return;
    }

    if (!newRoutePath.startsWith('/')) {
      setOverrideError('Route must start with / (e.g. /auth/login)');
      return;
    }

    // Check duplicate
    if (overrides.some(o => o.path === newRoutePath.trim())) {
      setOverrideError('Override for this path already exists');
      return;
    }

    onAddOverride({
      id: Date.now().toString(),
      path: newRoutePath.trim(),
      rps: parseInt(newRouteRps, 10),
      window: newRouteWindow,
      active: true
    });

    setNewRoutePath('');
    setShowOverrideForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px 0' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
            <Settings size={26} style={{ color: 'var(--color-primary)' }} /> Rate Limit Configurations
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Fine-tune traffic policies, custom rate limit limits, route rules and safety boundaries.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleSave}
          disabled={!!jsonError}
          style={{ gap: '8px' }}
        >
          <Save size={16} /> Save Config
        </button>
      </div>

      {/* Main Grid: Left for controls, Right for JSON Payload */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Left Side: Parameters & Overrides */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Global Defaults Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Global Default Rule
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Global RPS Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>RPS Limit (Req/sec)</label>
                  <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)', fontWeight: 600 }}>{globalRps} req/s</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  step="5" 
                  value={globalRps} 
                  onChange={(e) => setGlobalRps(e.target.value)} 
                  style={{
                    width: '100%',
                    background: 'var(--border-color)',
                    accentColor: 'var(--color-primary)',
                    height: '6px',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {/* Segmented control for window duration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Evaluation Window Duration</label>
                <div className="segmented-control">
                  {['1m', '5m', '15m', '1h'].map((win) => (
                    <div 
                      key={win} 
                      className={`segmented-option ${globalWindow === win ? 'active' : ''}`}
                      onClick={() => setGlobalWindow(win)}
                    >
                      {win}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Advanced Switches Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Advanced Parameters
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Redis Persistence */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Redis State Persistence</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sync counters back to Redis cluster</div>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={redisPersistence} 
                    onChange={(e) => setRedisPersistence(e.target.checked)} 
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {/* X-RateLimit Headers */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>X-RateLimit Headers</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Inject limits info into client headers</div>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={xHeaderInjection} 
                    onChange={(e) => setXHeaderInjection(e.target.checked)} 
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {/* IP Anonymization */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>IP Masking & Anonymization</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hash client IP for compliance and GDPR</div>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={ipAnonymization} 
                    onChange={(e) => setIpAnonymization(e.target.checked)} 
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

            </div>
          </div>

          {/* Security Policy Card: Fail-Open */}
          <div style={{ 
            background: 'var(--bg-surface)', 
            border: failOpen ? '1px solid var(--color-warning)' : '1px solid var(--border-color)', 
            borderRadius: '12px', 
            padding: '20px',
            transition: 'border var(--transition-normal)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Fail-Open Security Policy
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pass traffic if Redis latency spikes</div>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={failOpen} 
                  onChange={(e) => setFailOpen(e.target.checked)} 
                />
                <span className="switch-slider danger"></span>
              </label>
            </div>

            {failOpen ? (
              <div style={{ 
                background: 'rgba(245, 158, 11, 0.08)', 
                border: '1px solid rgba(245, 158, 11, 0.3)', 
                borderRadius: '8px', 
                padding: '10px 12px',
                display: 'flex',
                gap: '8px'
              }}>
                <ShieldAlert size={18} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)', lineHeight: '1.4' }}>
                  <strong>WARNING: Fail-Open Active.</strong> Rate limiting checks are bypassed if the infrastructure experiences connection bottlenecks. While this guarantees API availability, it leaves your core servers exposed to massive brute-force attacks and DDoS events.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Info size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Fail-Closed policy active: Security prioritized. Availability might be impacted if nodes crash.
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Route Overrides & Custom JSON Payload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Route specific overrides card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Route Overrides
              </h3>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowOverrideForm(!showOverrideForm)}
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              >
                <Plus size={12} /> Add Override
              </button>
            </div>

            {/* Inline Override Form */}
            {showOverrideForm && (
              <form onSubmit={handleAddOverrideSubmit} style={{ 
                background: 'var(--bg-main)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '14px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ROUTE PATTERN (Path)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. /auth/login" 
                    value={newRoutePath}
                    onChange={(e) => setNewRoutePath(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>LIMIT RPS</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="1000" 
                      value={newRouteRps}
                      onChange={(e) => setNewRouteRps(e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>WINDOW</label>
                    <select 
                      value={newRouteWindow} 
                      onChange={(e) => setNewRouteWindow(e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '6px 8px', height: '30px' }}
                    >
                      <option value="1m">1m</option>
                      <option value="5m">5m</option>
                      <option value="15m">15m</option>
                    </select>
                  </div>
                </div>

                {overrideError && (
                  <div style={{ color: 'var(--color-critical)', fontSize: '0.75rem' }}>{overrideError}</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setShowOverrideForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Add Rule</button>
                </div>
              </form>
            )}

            {/* Overrides Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {overrides.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '16px 0' }}>
                  No route overrides defined. Global rate limits will apply.
                </div>
              ) : (
                overrides.map((ovr) => (
                  <div 
                    key={ovr.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '10px 14px', 
                      background: 'var(--bg-main)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '8px',
                      opacity: ovr.active ? 1 : 0.6
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <code style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                        {ovr.path}
                      </code>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Limit: <strong style={{ color: 'var(--text-primary)' }}>{ovr.rps} req/sec</strong> (window: {ovr.window})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label className="switch" style={{ transform: 'scale(0.85)' }}>
                        <input 
                          type="checkbox" 
                          checked={ovr.active} 
                          onChange={() => onToggleOverride(ovr.id)} 
                        />
                        <span className="switch-slider"></span>
                      </label>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => onDeleteOverride(ovr.id)}
                        style={{ padding: '4px', background: 'transparent', border: 'none' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* JSON Payload Editor Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={18} style={{ color: 'var(--color-secondary)' }} /> HTTP 429 Payload Editor
              </h3>
              
              {jsonError ? (
                <span className="badge badge-danger">SYNTAX ERROR</span>
              ) : (
                <span className="badge badge-success">VALID PAYLOAD</span>
              )}
            </div>

            {/* Custom styled editor in Terminal block */}
            <div className="terminal-window" style={{ display: 'flex', flexDirection: 'column', height: '240px' }}>
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="terminal-dot red"></span>
                  <span className="terminal-dot yellow"></span>
                  <span className="terminal-dot green"></span>
                </div>
                <div className="terminal-title">custom_error.json</div>
                <div style={{ width: '40px' }}></div>
              </div>

              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Line numbers */}
                <div style={{
                  padding: '12px 8px 12px 12px',
                  background: '#04070F',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  textAlign: 'right',
                  userSelect: 'none',
                  borderRight: '1px solid var(--border-color)'
                }}>
                  {lines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Text area */}
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#050A15',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.825rem',
                    padding: '12px',
                    resize: 'none',
                    outline: 'none',
                    lineHeight: '1.45',
                    overflowY: 'auto'
                  }}
                />
              </div>
            </div>

            {jsonError && (
              <div style={{
                color: 'var(--color-critical)',
                fontSize: '0.75rem',
                marginTop: '10px',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(239, 68, 68, 0.08)',
                padding: '6px 10px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '6px'
              }}>
                JSON syntax error: {jsonError}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
