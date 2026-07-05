# LimitRate // Distributed API Rate Limiting Dashboard & Simulator

LimitRate is a real-time administrative interface and simulation engine designed for managing, configuring, and monitoring distributed API rate-limiting services. Built with a modern, high-performance web stack, it provides visual telemetry and control surfaces to audit traffic patterns, mitigate threats, manage whitelist exceptions, and mock production rate-limit behaviors.

> [!NOTE]
> The user interface for this dashboard was created using Google Stitch.

---

## 🚀 Key Features

### 1. Real-Time Telemetry & Traffic Stream
*   **Live Metrics Dashboard:** Monitors aggregate request rates (allowed vs. blocked requests per second), system latency (P99), and simulated hardware footprints (CPU & Memory).
*   **Dynamic Visual Charts:** Utilizes interactive, sliding time-series charts (powered by Chart.js) to graph incoming traffic trends over a rolling window.
*   **Top Offenders Table:** Tracks and aggregates malicious or high-throughput client IPs with visual IP geolocation metadata, enabling administrators to quickly diagnose abusive nodes.

### 2. Live Configuration Shell
*   **Global Rate Limits:** Instantly adjust the default Requests Per Second (RPS) threshold and time windows.
*   **System Integrity & Policy Control:** Toggle distributed cache persistence parameters (e.g., Redis cluster tracking), header injections (`X-RateLimit` status headers), IP anonymization, and security policies.
*   **Fail-Open / Fail-Closed Policy:** Simulation of high-availability backup behaviors during middleware faults.
*   **Customizable Error Response Payloads:** Direct administrative editing of JSON error payloads (status codes, message blocks, documentation URLs) sent to client applications when rate limits are breached.

### 3. Granular Route Overrides
*   Fine-tune distinct rate limiting rules (RPS bounds and sliding windows) for sensitive sub-routes (e.g. `/auth/login` for credential protection or `/api/v1/checkout` for transaction pacing).
*   Easily toggle override rules active/inactive or delete them from the processing queue.

### 4. Advanced Threat Mitigation & Logs
*   **Audit Trail:** Real-time stream of blocked requests detailing offending IP address, target path, trigger rule, and timestamp.
*   **Anomaly Detection Engine:** Evaluates running traffic profiles to identify specific network attacks:
    *   *Credential Stuffing:* Repeated auth failures on login routes.
    *   *Brute-Force Crawler:* High-density path scanning.
    *   *DDoS Flood API Abuse:* Bulk volumetric traffic.
*   **Mitigation Actions:** Integrated single-click mitigation to immediately whitelist or block clients directly from the telemetry dashboard.

### 5. Whitelist Manager
*   Configure loopback, developer, and service-to-service exception lists using CIDR-compatible Client IPs or secret API keys (`API_KEY`).
*   Include descriptive logic tags for administrative audit logs explaining why each exception was provisioned.

### 6. Interactive Command Palette (`Ctrl + K`)
*   Fully keyboard-navigable search interface for quick navigation between tabs, system toggles (Fail-Open, Privacy Mode), and data operations (clearing logs, resetting metrics).

---

## 🛠️ Technology Stack

*   **Core:** React 19, JavaScript (ES Modules)
*   **UI Framework:** Google Stitch (for UI structure and component composition)
*   **Build Tool:** Vite 8 (optimized HMR and production bundling)
*   **Styling:** Vanilla CSS (Glassmorphism layout, premium dark-mode aesthetic, custom animation micro-interactions)
*   **Icons:** Lucide React
*   **Charting:** Chart.js
*   **Linter:** Oxlint (high-performance static code analysis)

---

## 📁 Repository Structure

```
├── .oxlintrc.json          # Oxlint static analysis configuration
├── index.html              # Core HTML wrapper with typography & viewport setup
├── package.json            # Scripts, dependency registers, and build setup
├── vite.config.js          # Vite build pipeline setup
├── src/
│   ├── main.jsx            # React root application bootstrap
│   ├── App.jsx             # Core state manager and traffic simulator event loop
│   ├── App.css             # Main UI theme styling
│   ├── index.css           # Global typography, color tokens, and layout resets
│   └── components/
│       ├── DashboardOverview.jsx   # Telemetry graphs, meters, and top offenders panel
│       ├── ConfigurationShell.jsx   # Global variables, override routes, and JSON editors
│       ├── TrafficLogs.jsx         # Live log streams and anomaly detection banner
│       ├── WhitelistManager.jsx    # Whitelist exceptions and database bypass options
│       └── CommandPalette.jsx      # Keyboard-driven action overlay
```

---

## 🏁 Getting Started

### Prerequisites

*   **Node.js:** Version 18.x or higher is recommended.
*   **npm:** Node Package Manager (comes bundled with Node.js).

### Installation

1. Clone or navigate to the repository root directory.
2. Install the application dependencies:
    ```bash
    npm install
    ```

### Running Locally

To run the integrated application stack:

1.  **Start the Backend Express Server:**
    ```bash
    npm run server
    ```
    This spins up the REST API, simulator engine, and rate-limiting middleware on `http://localhost:5000`.

2.  **Start the Frontend Dev Server:**
    ```bash
    npm run dev
    ```
    This starts the Vite React application on `http://localhost:5173`. Any `/api/*` call is automatically proxied to port 5000.

### Production Build

To compile and optimize the project for production deployment:
```bash
npm run build
```

To preview the production bundle locally:
```bash
npm run preview
```

---

## 🛡️ Traffic Simulation Scenarios

To help engineers evaluate how rate-limiting policies affect traffic flow, the dashboard includes an active backend **Traffic Simulator**:

*   **Baseline Traffic:** Mocks background API consumer request volume.
*   **Simulate Bot Attack:** Clicking this button tells the server to inject a massive stream (80-130 requests/sec) of malicious brute-force attempts from botnet IPs targeting key routes.
*   **Behavioral Monitoring:** Observe how quickly route-specific limits capture anomalies, verify that the error response format triggers correctly, and test how whitelisting an IP immediately resolves its blocked requests under high load.

---

> [!NOTE]
> The backend operates with an in-memory data store for configurations, overrides, whitelists, and log streams. This allows it to run out-of-the-box locally with zero database configuration.

