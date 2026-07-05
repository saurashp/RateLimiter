import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import { Cpu, Ban, Activity, Database, Clock, Plus } from 'lucide-react';

export default function DashboardOverview({
  metrics,
  history,
  topOffenders,
  onQuickWhitelist,
  onSwitchTab
}) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Initialize and Update Chart
  useEffect(() => {
    if (!chartRef.current) return;
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing instance to recreate or prevent duplicate mounts
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Chart datasets
    const labels = history.map(h => h.time);
    const totalData = history.map(h => h.total);
    const allowedData = history.map(h => h.allowed);
    const blockedData = history.map(h => h.blocked);

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Requests',
            data: totalData,
            borderColor: '#6366F1', // Primary Accent (Indigo)
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointRadius: 0
          },
          {
            label: 'Allowed Requests',
            data: allowedData,
            borderColor: '#10B981', // Optimal (Green)
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.3,
            fill: false,
            pointRadius: 0
          },
          {
            label: 'Limited (429)',
            data: blockedData,
            borderColor: '#EF4444', // Critical (Red)
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 200
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#94A3B8',
              font: {
                family: 'Inter',
                size: 11
              },
              boxWidth: 12
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: '#0B1326',
            titleColor: '#F1F5F9',
            bodyColor: '#94A3B8',
            borderColor: '#1E293B',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(30, 41, 59, 0.3)'
            },
            ticks: {
              color: '#64748B',
              maxTicksLimit: 6,
              font: {
                family: 'JetBrains Mono',
                size: 9
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(30, 41, 59, 0.3)'
            },
            ticks: {
              color: '#64748B',
              font: {
                family: 'JetBrains Mono',
                size: 9
              }
            },
            min: 0
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  // Update chart data whenever history state changes
  useEffect(() => {
    if (chartInstance.current && history.length > 0) {
      const labels = history.map(h => h.time);
      const totalData = history.map(h => h.total);
      const allowedData = history.map(h => h.allowed);
      const blockedData = history.map(h => h.blocked);

      chartInstance.current.data.labels = labels;
      chartInstance.current.data.datasets[0].data = totalData;
      chartInstance.current.data.datasets[1].data = allowedData;
      chartInstance.current.data.datasets[2].data = blockedData;

      chartInstance.current.update('none'); // Update without full recalculation for high performance
    }
  }, [history]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px 0' }}>
      
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        {/* Metric 1: Active Rules */}
        <div 
          onClick={() => onSwitchTab('config')}
          className="hover-scale"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Rules</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{metrics.activeRules}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-primary-hover)' }}>Configure Overrides →</span>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)', padding: '12px', borderRadius: '10px' }}>
            <Cpu size={24} />
          </div>
        </div>

        {/* Metric 2: Blocked Requests */}
        <div 
          onClick={() => onSwitchTab('logs')}
          className="hover-scale"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Blocked Requests</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-critical)', fontFamily: 'var(--font-mono)' }}>{metrics.blockedRequests.toLocaleString()}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Audit Block Logs →</span>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-critical)', padding: '12px', borderRadius: '10px' }}>
            <Ban size={24} />
          </div>
        </div>

        {/* Metric 3: RPS */}
        <div 
          className="hover-scale"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Throughput (RPS)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{metrics.rps.toFixed(1)}</span>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-optimal)',
                boxShadow: '0 0 8px var(--color-optimal)',
                animation: 'pulse-glow 1.5s infinite',
                '--glow-color': 'var(--color-optimal)'
              }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Real-time evaluation stream</span>
          </div>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-secondary)', padding: '12px', borderRadius: '10px' }}>
            <Activity size={24} />
          </div>
        </div>

        {/* Metric 4: Redis Status */}
        <div 
          className="hover-scale"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Redis Status</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-optimal)' }}>CONNECTED</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Latency: 0.8ms</span>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-optimal)', padding: '12px', borderRadius: '10px' }}>
            <Database size={24} />
          </div>
        </div>

      </div>

      {/* Charts & Health Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Throughput Chart (2/3 width placeholder using CSS Grid on desktop) */}
        <div style={{
          gridColumn: 'span 2',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          height: '350px'
        }}
        className="tablet-chart-full"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Traffic Throughput</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Comparing Allowed vs Limited requests</span>
          </div>
          <div style={{ position: 'relative', flex: 1, minHeight: '0' }}>
            <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* Operational Health (1/3 width) */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Operational Health</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Real-time infrastructure benchmarks</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
            
            {/* P99 Latency Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Clock size={14} /> P99 API Latency
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)' }}>{metrics.latencyP99.toFixed(1)} ms</span>
              </div>
              <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (metrics.latencyP99 / 50) * 100)}%`, background: 'var(--color-secondary)', transition: 'width 0.5s' }} />
              </div>
            </div>

            {/* CPU Usage */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Cpu size={14} /> Node CPU Usage
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{metrics.cpu.toFixed(1)} %</span>
              </div>
              <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${metrics.cpu}%`, background: metrics.cpu > 70 ? 'var(--color-critical)' : metrics.cpu > 40 ? 'var(--color-warning)' : 'var(--color-optimal)', transition: 'width 0.5s' }} />
              </div>
            </div>

            {/* Memory Usage */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Database size={14} /> RAM Allocation
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{metrics.memory.toFixed(1)} %</span>
              </div>
              <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${metrics.memory}%`, background: 'var(--color-primary)', transition: 'width 0.5s' }} />
              </div>
            </div>

            {/* Redis latency */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Redis Replication Lag</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--color-optimal)', fontWeight: 'bold' }}>0.04 ms</div>
            </div>

          </div>
        </div>

      </div>

      {/* Top Offenders Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Top Blocked Offenders</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Most rate-limited IP addresses in the current analysis window</p>
        </div>

        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Client IP Address</th>
                <th className="hide-mobile">Total Requests</th>
                <th>Blocked Requests (429)</th>
                <th className="hide-mobile">Block Rate (%)</th>
                <th style={{ textAlign: 'right' }}>Mitigation</th>
              </tr>
            </thead>
            <tbody>
              {topOffenders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                    No blocked IP addresses in this window. System optimal.
                  </td>
                </tr>
              ) : (
                topOffenders.map((offender) => {
                  const blockRate = offender.requests > 0 ? (offender.blocked / offender.requests) * 100 : 0;
                  return (
                    <tr key={offender.ip}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>{offender.flag}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }} className="hide-mobile">{offender.country}</span>
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>{offender.ip}</code>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }} className="hide-mobile">{offender.requests}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-critical)', fontWeight: 'bold' }}>{offender.blocked}</td>
                      <td className="hide-mobile">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', width: '36px', fontSize: '0.8rem' }}>{blockRate.toFixed(0)}%</span>
                          <div style={{ width: '60px', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${blockRate}%`, background: 'var(--color-critical)' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => onQuickWhitelist(offender.ip)}
                          style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Plus size={12} /> Whitelist
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
