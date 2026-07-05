import React, { useState, useEffect } from 'react';
import { Terminal, ShieldAlert, ShieldCheck, Search, Activity, Menu, X, AlertTriangle } from 'lucide-react';
import DashboardOverview from './components/DashboardOverview';
import ConfigurationShell from './components/ConfigurationShell';
import TrafficLogs from './components/TrafficLogs';
import WhitelistManager from './components/WhitelistManager';
import CommandPalette from './components/CommandPalette';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isBotAttackActive, setIsBotAttackActive] = useState(false);

  // States synchronized with Backend
  const [config, setConfig] = useState({
    globalRps: 30,
    globalWindow: '1m',
    redisPersistence: true,
    xHeaderInjection: true,
    ipAnonymization: false,
    failOpen: false,
    errorPayload: {
      status: 429,
      error: "Too Many Requests",
      message: "API rate limit exceeded. Please retry after 60 seconds.",
      code: "RATE_LIMIT_EXCEEDED",
      documentation_url: "https://docs.limitrate.com/errors"
    }
  });

  const [overrides, setOverrides] = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [metrics, setMetrics] = useState({
    activeRules: 0,
    blockedRequests: 0,
    rps: 0,
    latencyP99: 0,
    cpu: 0,
    memory: 0
  });

  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [topOffenders, setTopOffenders] = useState([]);

  // Fetch state on interval
  useEffect(() => {
    let active = true;
    const fetchState = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok && active) {
          const data = await res.json();
          setConfig(prev => {
            if (JSON.stringify(prev) === JSON.stringify(data.config)) return prev;
            return data.config;
          });
          setOverrides(data.overrides);
          setWhitelist(data.whitelist);
          setMetrics(data.metrics);
          setHistory(data.history);
          setLogs(data.logs);
          setAnomalies(data.anomalies);
          setIsBotAttackActive(data.isBotAttackActive);
          setTopOffenders(data.topOffenders);
        }
      } catch (err) {
        console.error('Failed to sync state with backend:', err);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Open Command Palette with Ctrl+K
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  // Callback Actions
  const handleSaveConfig = async (newConfig) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error('Error saving config:', err);
    }
  };

  const handleAddOverride = async (newOverride) => {
    try {
      const res = await fetch('/api/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOverride)
      });
      if (res.ok) {
        const data = await res.json();
        setOverrides(data);
      }
    } catch (err) {
      console.error('Error adding override:', err);
    }
  };

  const handleToggleOverride = async (id) => {
    const currentOverride = overrides.find(o => o.id === id);
    if (!currentOverride) return;
    try {
      const res = await fetch(`/api/overrides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentOverride.active })
      });
      if (res.ok) {
        const data = await res.json();
        setOverrides(data);
      }
    } catch (err) {
      console.error('Error toggling override:', err);
    }
  };

  const handleDeleteOverride = async (id) => {
    try {
      const res = await fetch(`/api/overrides/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setOverrides(data);
      }
    } catch (err) {
      console.error('Error deleting override:', err);
    }
  };

  const handleAddWhitelist = async (newEntry) => {
    try {
      const res = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });
      if (res.ok) {
        const data = await res.json();
        setWhitelist(data);
      }
    } catch (err) {
      console.error('Error adding whitelist exception:', err);
    }
  };

  const handleRemoveWhitelist = async (id) => {
    try {
      const res = await fetch(`/api/whitelist/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setWhitelist(data);
      }
    } catch (err) {
      console.error('Error removing whitelist exception:', err);
    }
  };

  const handleQuickWhitelist = (ip) => {
    if (whitelist.some(w => w.value === ip)) return;
    const newEntry = {
      type: 'IP',
      value: ip,
      reason: `Quick Whitelisted from Offenders metrics panel`
    };
    handleAddWhitelist(newEntry);
  };

  const handleMitigateAnomaly = (ip) => {
    handleQuickWhitelist(ip);
  };

  const handleToggleBotAttack = async () => {
    const nextVal = !isBotAttackActive;
    try {
      const res = await fetch('/api/simulate/bot-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextVal })
      });
      if (res.ok) {
        setIsBotAttackActive(nextVal);
      }
    } catch (err) {
      console.error('Error toggling bot attack:', err);
    }
  };

  // Command Palette Dispatcher
  const handleCommandPaletteAction = async (type, param) => {
    if (type === 'nav') {
      setActiveTab(param);
    } else if (type === 'toggle') {
      const nextConfig = { ...config, [param]: !config[param] };
      await handleSaveConfig(nextConfig);
    } else if (type === 'system') {
      if (param === 'resetStats') {
        try {
          await fetch('/api/system/reset-stats', { method: 'POST' });
          setHistory([]);
          setMetrics(prev => ({ ...prev, blockedRequests: 0 }));
        } catch (err) {
          console.error('Error resetting stats:', err);
        }
      } else if (param === 'clearLogs') {
        try {
          await fetch('/api/system/clear-logs', { method: 'POST' });
          setLogs([]);
        } catch (err) {
          console.error('Error clearing logs:', err);
        }
      }
    } else if (type === 'action') {
      if (param === 'addWhitelist') {
        setActiveTab('whitelist');
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      
      {/* Sidebar Navigation */}
      <aside style={{
        width: isSidebarOpen ? '260px' : '70px',
        background: '#04070F',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--transition-normal)',
        zIndex: 50,
        position: 'relative'
      }}
      className="sidebar-responsive"
      >
        {/* Brand Logo */}
        <div style={{
          height: '70px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border-color)',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}>
          <svg width="28" height="28" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            {/* Outer Frame: Hexagonal Shield for protection and structure */}
            <path d="M100 20L170 60V140L100 180L30 140V60L100 20Z" stroke="#6366f1" strokeWidth="4" strokeLinejoin="round" opacity="0.3" strokeDasharray="8 4"/>
            
            {/* L Monogram: Sharp, modern L following the flow */}
            <path d="M70 60V140H110" stroke="#6366f1" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
            
            {/* R Monogram: Integrated with the L, suggesting speed and connection */}
            <path d="M105 85H130C141.046 85 150 93.9543 150 105C150 116.046 141.046 125 130 125H105V85Z" stroke="#6366f1" strokeWidth="12" strokeLinejoin="round"/>
            <path d="M130 125L150 145" stroke="#6366f1" strokeWidth="12" strokeLinecap="round"/>
            
            {/* Dynamic Accents: Representing data limits and flow */}
            <rect x="100" y="20" width="2" height="15" fill="#6366f1"/>
            <rect x="100" y="165" width="2" height="15" fill="#6366f1"/>
            <path d="M160 40L175 25" stroke="#6366f1" strokeWidth="4" strokeLinecap="round"/>
            <path d="M40 160L25 175" stroke="#6366f1" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          {isSidebarOpen && (
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', tracking: '1px' }}>
              LimitRate
            </span>
          )}
        </div>

        {/* Sidebar Nav Items */}
        <nav style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 14px',
              background: activeTab === 'dashboard' ? 'var(--bg-surface-hover)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <Activity size={18} style={{ color: activeTab === 'dashboard' ? 'var(--color-secondary)' : 'inherit' }} />
            {isSidebarOpen && <span>Overview</span>}
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`sidebar-link ${activeTab === 'config' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 14px',
              background: activeTab === 'config' ? 'var(--bg-surface-hover)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'config' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <Terminal size={18} style={{ color: activeTab === 'config' ? 'var(--color-primary-hover)' : 'inherit' }} />
            {isSidebarOpen && <span>Configurations</span>}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`sidebar-link ${activeTab === 'logs' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 14px',
              background: activeTab === 'logs' ? 'var(--bg-surface-hover)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'logs' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <ShieldAlert size={18} style={{ color: activeTab === 'logs' ? 'var(--color-critical)' : 'inherit' }} />
            {isSidebarOpen && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Traffic Logs</span>
                {anomalies.length > 0 && (
                  <span style={{ fontSize: '0.65rem', padding: '1px 6px', background: 'var(--color-critical)', color: 'white', borderRadius: '10px', fontWeight: 'bold' }}>
                    {anomalies.length}
                  </span>
                )}
              </div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('whitelist')}
            className={`sidebar-link ${activeTab === 'whitelist' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 14px',
              background: activeTab === 'whitelist' ? 'var(--bg-surface-hover)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === 'whitelist' ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <ShieldCheck size={18} style={{ color: activeTab === 'whitelist' ? 'var(--color-optimal)' : 'inherit' }} />
            {isSidebarOpen && <span>Whitelist Exceptions</span>}
          </button>

        </nav>

        {/* Sidebar Footer */}
        {isSidebarOpen && (
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '0.725rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Redis Cluster:</span>
              <span style={{ color: 'var(--color-optimal)', fontWeight: 'bold' }}>OK</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Fail-Open:</span>
              <span style={{ color: config.failOpen ? 'var(--color-warning)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                {config.failOpen ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Node Instance:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>rl-node-01</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Main Header */}
        <header style={{
          height: '70px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 40
        }}>
          {/* Left search/trigger and toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              className="toggle-sidebar-btn"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Ctrl + K command palette search input mockup */}
            <div 
              onClick={() => setIsCmdOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 14px',
                width: '320px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '0.8125rem'
              }}
              className="header-search-bar"
            >
              <Search size={14} />
              <span>Press <kbd style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', padding: '1px 4px', borderRadius: '3px', fontSize: '0.65rem' }}>Ctrl + K</kbd> to command...</span>
            </div>
          </div>

          {/* Right benchmarks / alerts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Quick alert notifications indicator */}
            {anomalies.length > 0 && (
              <div 
                onClick={() => setActiveTab('logs')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  color: 'var(--color-critical)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  animation: 'pulse-glow 2s infinite',
                  '--glow-color': 'rgba(239, 68, 68, 0.2)'
                }}
              >
                <AlertTriangle size={12} />
                <span>{anomalies.length} Critical Alerts</span>
              </div>
            )}

            <button
              onClick={handleToggleBotAttack}
              className="btn hover-scale"
              style={{
                background: isBotAttackActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                border: isBotAttackActive ? '1px solid var(--color-critical)' : '1px solid var(--color-warning)',
                color: isBotAttackActive ? 'var(--color-critical)' : 'var(--color-warning)',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                animation: isBotAttackActive ? 'pulse-glow 1.5s infinite' : 'none',
                '--glow-color': 'rgba(239, 68, 68, 0.4)'
              }}
            >
              <ShieldAlert size={12} />
              <span>{isBotAttackActive ? 'HALT BOT STORM' : 'SIMULATE BOT ATTACK'}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <span>Version:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 'bold' }}>v1.0.0</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          
          {activeTab === 'dashboard' && (
            <DashboardOverview 
              metrics={metrics}
              history={history}
              topOffenders={topOffenders}
              onQuickWhitelist={handleQuickWhitelist}
              onSwitchTab={setActiveTab}
            />
          )}

          {activeTab === 'config' && (
            <ConfigurationShell 
              config={config}
              onSaveConfig={handleSaveConfig}
              overrides={overrides}
              onAddOverride={handleAddOverride}
              onToggleOverride={handleToggleOverride}
              onDeleteOverride={handleDeleteOverride}
            />
          )}

          {activeTab === 'logs' && (
            <TrafficLogs 
              logs={logs}
              onClearLogs={() => setLogs([])}
              anomalies={anomalies}
              onMitigateAnomaly={handleMitigateAnomaly}
            />
          )}

          {activeTab === 'whitelist' && (
            <WhitelistManager 
              whitelist={whitelist}
              onAddEntry={handleAddWhitelist}
              onRemoveEntry={handleRemoveWhitelist}
            />
          )}

        </main>

      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav" style={{ display: 'none' }}>
        <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>
          <Activity size={18} />
          <span>Overview</span>
        </button>
        <button onClick={() => setActiveTab('config')} className={activeTab === 'config' ? 'active' : ''}>
          <Terminal size={18} />
          <span>Config</span>
        </button>
        <button onClick={() => setActiveTab('logs')} className={activeTab === 'logs' ? 'active' : ''}>
          <ShieldAlert size={18} />
          <span>Logs</span>
          {anomalies.length > 0 && <span className="mobile-badge">{anomalies.length}</span>}
        </button>
        <button onClick={() => setActiveTab('whitelist')} className={activeTab === 'whitelist' ? 'active' : ''}>
          <ShieldCheck size={18} />
          <span>Exceptions</span>
        </button>
      </div>

      {/* Floating command palette overlay */}
      <CommandPalette 
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onAction={handleCommandPaletteAction}
        activeTab={activeTab}
      />

    </div>
  );
}
