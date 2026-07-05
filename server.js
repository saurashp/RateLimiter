import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-Memory Database / State Store
let config = {
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
};

let overrides = [
  { id: '1', path: '/api/v1/login', rps: 3, window: '1m', active: true },
  { id: '2', path: '/api/v1/checkout', rps: 10, window: '1m', active: true },
  { id: '3', path: '/api/v1/users', rps: 15, window: '5m', active: false }
];

let whitelist = [
  { id: 'w1', type: 'IP', value: '127.0.0.1', reason: 'Internal loopback developer interface', addedAt: new Date().toISOString() },
  { id: 'w2', type: 'IP', value: '192.168.1.50', reason: 'Admin panel gateway gateway bypass', addedAt: new Date().toISOString() },
  { id: 'w3', type: 'API_KEY', value: 'rl_key_prod_admin_bypass', reason: 'Checkout microservice webhook bypass token', addedAt: new Date().toISOString() }
];

let metrics = {
  activeRules: 3,
  blockedRequests: 0,
  rps: 0,
  latencyP99: 12.4,
  cpu: 18.2,
  memory: 42.1
};

let history = [];
let logs = [];
let anomalies = [];
let isBotAttackActive = false;

// Client requests track: { ip_or_endpoint: [timestamp1, timestamp2, ...] }
const requestHistory = {};

// Client Pool for Simulator
const simulatorClients = [
  { ip: '192.168.1.50', country: 'United States', flag: '🇺🇸', key: 'rl_key_prod_admin_bypass', weight: 0.15 },
  { ip: '203.0.113.12', country: 'Germany', flag: '🇩🇪', key: null, weight: 0.2 },
  { ip: '198.51.100.5', country: 'Japan', flag: '🇯🇵', key: null, weight: 0.15 },
  { ip: '103.209.25.10', country: 'India', flag: '🇮🇳', key: null, weight: 0.2 },
  { ip: '45.143.203.14', country: 'China', flag: '🇨🇳', key: null, weight: 0.15 },
  { ip: '185.220.101.4', country: 'Russia (Tor)', flag: '🇷🇺', key: null, weight: 0.15 }
];

// Helper selectors
const pickRandomClient = (pool) => {
  const r = Math.random();
  let sum = 0;
  for (let i = 0; i < pool.length; i++) {
    sum += pool[i].weight;
    if (r <= sum) return pool[i];
  }
  return pool[pool.length - 1];
};

const pickRandomPath = (ip) => {
  if (ip === '45.143.203.14') return '/api/v1/login';
  if (ip === '185.220.101.4') return '/api/v1/checkout';
  
  const paths = ['/api/v1/products', '/api/v1/users', '/index.html', '/assets/main.css', '/api/v1/checkout'];
  return paths[Math.floor(Math.random() * paths.length)];
};

// Helper to anonymize IP addresses
const anonymizeIp = (ip) => {
  if (!ip) return '0.0.0.0';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 3).join(':')}:xxxx:xxxx:xxxx:xxxx`;
  }
  return 'xxx.xxx.xxx.xxx';
};

// Core Rate Limiting Evaluator
// Returns { allowed: boolean, reason: string, limitRps: number, ruleLabel: string, limitKey: string }
function evaluateRateLimit(clientIp, path, apiKey) {
  const now = Date.now();

  // 1. Whitelist Exception Check
  const isIpWhitelisted = whitelist.some(w => w.type === 'IP' && w.value === clientIp);
  const isKeyWhitelisted = apiKey && whitelist.some(w => w.type === 'API_KEY' && w.value === apiKey);

  if (isIpWhitelisted || isKeyWhitelisted) {
    return { allowed: true, reason: 'Whitelisted bypass exception', limitRps: Infinity, ruleLabel: 'Whitelist Exception', limitKey: null };
  }

  // 2. Fail-Open Check
  if (config.failOpen && Math.random() < 0.05) {
    return { allowed: true, reason: 'Fail-Open Policy Fallback', limitRps: Infinity, ruleLabel: 'Fail-Open', limitKey: null };
  }

  // 3. Find limits rules
  const activeOverrides = overrides.filter(o => o.active);
  const overrideRule = activeOverrides.find(o => o.path === path);
  
  let limitRps = config.globalRps;
  let windowMs = 60 * 1000;
  let limitKey = clientIp;
  let ruleLabel = 'Global Default Rule';

  if (overrideRule) {
    limitRps = overrideRule.rps;
    const windowMinutes = parseInt(overrideRule.window.replace('m', ''), 10) || 1;
    windowMs = windowMinutes * 60 * 1000;
    limitKey = `${clientIp}:${path}`;
    ruleLabel = `Route Override [${path}]`;
  }

  // Sliding window check
  if (!requestHistory[limitKey]) {
    requestHistory[limitKey] = [];
  }

  // Clean old logs
  requestHistory[limitKey] = requestHistory[limitKey].filter(t => now - t < windowMs);

  if (requestHistory[limitKey].length >= limitRps) {
    return {
      allowed: false,
      reason: `Exceeded ${ruleLabel} (${limitRps} req/window)`,
      limitRps,
      ruleLabel,
      limitKey
    };
  } else {
    requestHistory[limitKey].push(now);
    return { allowed: true, reason: 'Allowed requests limit check passed', limitRps, ruleLabel, limitKey };
  }
}

// Background Traffic Simulator Loop
setInterval(() => {
  const now = Date.now();
  
  // Base requests count
  let numRequests = Math.floor(Math.random() * 20) + 15;
  let allowedCount = 0;
  let blockedCount = 0;
  const newBlockedLogs = [];

  const requestsToProcess = [];

  // Generate standard traffic
  for (let i = 0; i < numRequests; i++) {
    const client = pickRandomClient(simulatorClients);
    const path = pickRandomPath(client.ip);
    requestsToProcess.push({ client, path });
  }

  // If Bot Attack simulation is enabled, inject 80-130 extra requests/sec
  if (isBotAttackActive) {
    const botCount = Math.floor(Math.random() * 50) + 80;
    const botClients = [
      { ip: '111.90.158.12', country: 'Ukraine', flag: '🇺🇦', key: null },
      { ip: '95.211.23.41', country: 'Netherlands', flag: '🇳🇱', key: null },
      { ip: '103.45.12.82', country: 'China', flag: '🇨🇳', key: null }
    ];

    for (let i = 0; i < botCount; i++) {
      const client = botClients[Math.floor(Math.random() * botClients.length)];
      const path = Math.random() < 0.6 ? '/api/v1/login' : '/api/v1/checkout';
      requestsToProcess.push({ client, path });
    }
    numRequests += botCount;
  }

  // Process simulator queue
  requestsToProcess.forEach(({ client, path }) => {
    const result = evaluateRateLimit(client.ip, path, client.key);
    const method = path === '/api/v1/login' ? 'POST' : 'GET';

    if (result.allowed) {
      allowedCount++;
    } else {
      blockedCount++;
      metrics.blockedRequests++;

      newBlockedLogs.push({
        id: `log-${now}-${Math.random()}`,
        timestamp: now,
        ip: config.ipAnonymization ? anonymizeIp(client.ip) : client.ip,
        country: client.country,
        countryFlag: client.flag,
        method,
        path,
        reason: result.reason
      });
    }
  });

  // Keep logs list trimmed to last 100 entries
  if (newBlockedLogs.length > 0) {
    logs = [...newBlockedLogs, ...logs].slice(0, 100);
  }

  // Clean old elements from memory store (older than 5 minutes)
  Object.keys(requestHistory).forEach(key => {
    requestHistory[key] = requestHistory[key].filter(t => now - t < 5 * 60 * 1000);
    if (requestHistory[key].length === 0) {
      delete requestHistory[key];
    }
  });

  // Calculate sliding stats for UI chart
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  history = [...history, { time: timeStr, total: numRequests, allowed: allowedCount, blocked: blockedCount }].slice(-20);

  // Compute fluctuating system diagnostic values
  const newCpu = Math.max(10, Math.min(95, metrics.cpu + (Math.random() * 4 - 2)));
  const newLatency = Math.max(8, Math.min(45, metrics.latencyP99 + (Math.random() * 2 - 1)));

  metrics = {
    ...metrics,
    rps: numRequests,
    cpu: newCpu,
    latencyP99: newLatency,
    activeRules: overrides.filter(o => o.active).length + 1
  };

  // Run anomaly detector
  const windowMs = 15 * 1000;
  const blockCountsByIp = {};
  
  logs.forEach(log => {
    if (now - log.timestamp < windowMs) {
      if (!blockCountsByIp[log.ip]) {
        blockCountsByIp[log.ip] = {
          ip: log.ip,
          country: log.country,
          path: log.path,
          count: 0
        };
      }
      blockCountsByIp[log.ip].count++;
    }
  });

  const activeAnomalies = [];
  Object.values(blockCountsByIp).forEach(data => {
    if (data.count > 6) {
      let pattern = 'Brute-Force Crawler';
      if (data.path === '/api/v1/login') {
        pattern = 'Credential Stuffing';
      } else if (data.count > 15) {
        pattern = 'DDoS Flood API Abuse';
      }

      activeAnomalies.push({
        id: `anomaly-${data.ip}-${now}`,
        ip: data.ip,
        country: data.country,
        path: data.path,
        count: data.count,
        pattern
      });
    }
  });

  anomalies = activeAnomalies;
}, 1000);

// Global real rate-limiting middleware for REST endpoints
const realRateLimiterMiddleware = (req, res, next) => {
  // Exclude dashboard operations from being blocked
  if (req.path.startsWith('/api/state') || 
      req.path.startsWith('/api/config') || 
      req.path.startsWith('/api/overrides') || 
      req.path.startsWith('/api/whitelist') || 
      req.path.startsWith('/api/simulate') || 
      req.path.startsWith('/api/system')) {
    return next();
  }

  // Extract IP & key
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const apiKey = req.headers['x-api-key'] || req.query.apiKey || null;
  const path = req.path;

  const result = evaluateRateLimit(clientIp, path, apiKey);

  if (result.allowed) {
    // If config says injection is active, append rate-limiting telemetry headers
    if (config.xHeaderInjection) {
      res.setHeader('X-RateLimit-Limit', result.limitRps === Infinity ? 99999 : result.limitRps);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, (result.limitRps === Infinity ? 99999 : result.limitRps) - (requestHistory[result.limitKey || clientIp] || []).length));
      res.setHeader('X-RateLimit-Reset', 60);
    }
    next();
  } else {
    // Log real API rate-limiting block
    metrics.blockedRequests++;
    logs = [{
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      ip: config.ipAnonymization ? anonymizeIp(clientIp) : clientIp,
      country: 'Local Client',
      countryFlag: '💻',
      method: req.method,
      path: req.path,
      reason: `REAL BLOCK: ${result.reason}`
    }, ...logs].slice(0, 100);

    return res.status(config.errorPayload.status).json(config.errorPayload);
  }
};

app.use(realRateLimiterMiddleware);

// --- REST API ENDPOINTS FOR FRONTEND ---

// Get State
app.get('/api/state', (req, res) => {
  // Derive Top Blocked Offenders table logic dynamically from logs
  const offenders = {};
  
  // Populate standard clients
  simulatorClients.forEach(c => {
    const ipKey = config.ipAnonymization ? anonymizeIp(c.ip) : c.ip;
    offenders[ipKey] = {
      ip: ipKey,
      country: c.country,
      flag: c.flag,
      requests: 0,
      blocked: 0
    };
  });

  logs.forEach(l => {
    if (!offenders[l.ip]) {
      offenders[l.ip] = {
        ip: l.ip,
        country: l.country,
        flag: l.countryFlag,
        requests: 0,
        blocked: 0
      };
    }
    offenders[l.ip].blocked++;
    offenders[l.ip].requests += 1.5;
  });



  const sortedOffenders = Object.values(offenders)
    .filter(o => o.blocked > 0)
    .sort((a, b) => b.blocked - a.blocked);

  res.json({
    config,
    overrides,
    whitelist,
    metrics,
    history,
    logs,
    anomalies,
    isBotAttackActive,
    topOffenders: sortedOffenders
  });
});

// Update Config
app.post('/api/config', (req, res) => {
  config = { ...config, ...req.body };
  res.json(config);
});

// Add Override
app.post('/api/overrides', (req, res) => {
  const newOverride = {
    id: `override-${Date.now()}`,
    ...req.body,
    active: true
  };
  overrides.push(newOverride);
  res.json(overrides);
});

// Toggle Override
app.put('/api/overrides/:id', (req, res) => {
  const { id } = req.params;
  overrides = overrides.map(o => o.id === id ? { ...o, active: req.body.active } : o);
  res.json(overrides);
});

// Delete Override
app.delete('/api/overrides/:id', (req, res) => {
  const { id } = req.params;
  overrides = overrides.filter(o => o.id !== id);
  res.json(overrides);
});

// Add Whitelist Entry
app.post('/api/whitelist', (req, res) => {
  const newEntry = {
    id: `w-${Date.now()}`,
    addedAt: new Date().toISOString(),
    ...req.body
  };
  whitelist = [newEntry, ...whitelist];
  res.json(whitelist);
});

// Remove Whitelist Entry
app.delete('/api/whitelist/:id', (req, res) => {
  const { id } = req.params;
  whitelist = whitelist.filter(w => w.id !== id);
  res.json(whitelist);
});

// Toggle Bot Attack Simulation
app.post('/api/simulate/bot-attack', (req, res) => {
  isBotAttackActive = req.body.active;
  res.json({ isBotAttackActive });
});

// System: Reset Live Metrics & Charts
app.post('/api/system/reset-stats', (req, res) => {
  metrics.blockedRequests = 0;
  history = [];
  res.json({ success: true });
});

// System: Clear Logs
app.post('/api/system/clear-logs', (req, res) => {
  logs = [];
  res.json({ success: true });
});

// --- Mock API endpoints for testing rate limiting ---

app.get('/api/v1/products', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: "Premium Load Balancer Node", price: 299 },
      { id: 2, name: "Secure Gateway Tunnel", price: 149 }
    ]
  });
});

app.get('/api/v1/users', (req, res) => {
  res.json({
    success: true,
    users: ["admin", "dev_ops_leads", "audit_sec"]
  });
});

app.post('/api/v1/login', (req, res) => {
  res.json({
    success: true,
    token: "mocked_session_token_xyz123"
  });
});

app.get('/api/v1/checkout', (req, res) => {
  res.json({
    success: true,
    status: "processing_payment"
  });
});

// Root Route - Welcome Info
app.get('/', (req, res) => {
  res.send('LimitRate Engine Service Node is active. Configure endpoints and monitor traffic metrics via the Dashboard Panel.');
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[LimitRate] Server cluster running on port ${PORT}`);
});
