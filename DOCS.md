# 📚 CodersAPI Complete Documentation

Welcome to the official documentation for **coders.api**. This comprehensive guide covers everything from installation to advanced deployment strategies.

---

## 📑 Table of Contents

1.  [Getting Started](#-getting-started)
2.  [Configuration](#-configuration)
3.  [Routing System](#-routing-system)
4.  [Request & Response Helpers](#-request--response-helpers)
5.  [Security & Protection](#-security--protection)
6.  [Performance & Optimization](#-performance--optimization)
7.  [Monitoring & Telemetry](#-monitoring--telemetry)
8.  [Authentication & Security](#-authentication--security)
9.  [Plugin System](#-plugin-system)
10. [Official CLI](#-official-cli)
11. [Utilities](#-utilities)

---

## 🚀 Getting Started

**coders.api** is a drop-in replacement for standard Express setups that pre-packages security, performance, and monitoring tools.

### Installation

```bash
npm install coders.api
```

### "Hello World" Example

Create a file named `server.js`:

```javascript
const CodersAPI = require('coders.api');

// Initialize the server
const app = new CodersAPI({
    port: 3000,
    name: 'My API',
    telemetry: true // Enables the terminal dashboard
});

// Add a simple route
app.get('/', (req, res) => {
    res.ok("Hello from CodersAPI!");
});

// Start listening
app.start();
```

Run it:
```bash
node server.js
```

---

## ⚙️ Configuration

The `CodersAPI` class accepts a configuration object to tailor the server's behavior.

```javascript
const app = new CodersAPI({
    port: 8080,               // (Number) Port to listen on. Default: 3000
    name: 'Production Srv',   // (String) Server name in logs. Default: 'CodersAPI Server'
    cloud: true,              // (Boolean) Enable Multi-Core Clustering. Default: false
    telemetry: true,          // (Boolean) Enable CLI Dashboard. Default: false
    limit: '5mb',             // (String) Request body size limit. Default: '1mb'
    rateLimitWindow: 60000,   // (Number) Rate limit window in ms. Default: 15 mins
    maxRequests: 500,         // (Number) Max requests per window. Default: 150
    secret: 'my-secret',      // (String) JWT signing secret. Default: (Strong 64-char string)
    cors: {                   // (Object) Custom CORS options
        origin: 'https://mydomain.com',
        credentials: true
    }
});
```

---

## 🛣️ Routing System

The framework wraps standard routing to add automatic error handling and logging. You do not need `try/catch` blocks in your routes; if an error occurs, the server logs it securely and returns a 500 status.

### Basic Methods

```javascript
app.get('/path', handler);
app.post('/path', handler);
app.put('/path', handler);
app.delete('/path', handler);
```

### Group Routing

Groups allow you to organize routes under a prefix. This is best practice for versioning APIs.

```javascript
app.group('/api/v1', (router) => {
    // Defines POST /api/v1/users
    router.post('/users', (req, res) => {
        res.ok({ id: 1 });
    });

    // Defines GET /api/v1/status
    router.get('/status', (req, res) => {
        res.ok("Online");
    });
});
```

### Validation Middleware

The `validate` method ensures required fields exist in `req.body`, `req.query`, or `req.params` before your handler runs.

```javascript
// Automatically validates that 'username' and 'password' are not null/undefined/empty
app.post('/login', app.validate(['username', 'password']), (req, res) => {
    // If code reaches here, username and password exist
    res.ok("Login successful");
});
```

### Static Files

Serve static assets like images, HTML, or CSS.

```javascript
const path = require('path');
// Maps the '/public' URL path to the 'assets' folder on disk
app.static('/public', path.join(__dirname, 'assets'));
```

---

## 🔄 Request & Response Helpers

We provide semantic helper methods attached to the `res` object to standardize your API responses.

### `res.ok(data, message)`
sends a `200 OK` response with a standard JSON structure.

*   **data**: The payload (object, array, string, etc.).
*   **message**: Optional string (default: "Success").

```javascript
res.ok({ id: 1, name: "test" }, "User found");
/*
HTTP 200
{
  "success": true,
  "message": "User found",
  "data": { "id": 1, "name": "test" }
}
*/
```

### `res.fail(message, status)`
Sends an error response with a proper HTTP status code.

*   **message**: Description of the error.
*   **status**: HTTP status code (default: 400).

```javascript
res.fail("Invalid API Key", 401);
/*
HTTP 401
{
  "success": false,
  "error": "Invalid API Key"
}
*/
```

### `res.flat(buffer)`
Sends raw binary data. Useful for image generation, file downloads, or streaming.

```javascript
res.flat(myImageBuffer);
// Sets Content-Type based on buffer detection (implementation dependent) or generic binary
```

---

## 🛡️ Security & Protection

**coders.api** takes a "Security by Default" approach. These features are always active.

### 1. DDoS Shield
A proprietary algorithm monitors socket connections.
*   **Detection**: If an IP sends requests with intervals < 500ms repeatedly, its "Suspicion Score" rises.
*   **Action**: Once the score exceeds a threshold (100), the IP is **banned for 5 minutes**.
*   **Socket Destruction**: Connection attempts from banned IPs are destroyed immediately to save server resources.

### 2. Header Hardening (Helmet)
We automatically inject security headers to preventing common attacks:
*   `X-XSS-Protection`: Block Cross-Site Scripting.
*   `X-Frame-Options`: Prevent Clickjacking (`DENY`).
*   `X-Content-Type-Options`: Prevent MIME-sniffing (`nosniff`).

### 3. Rate Limiting
A secondary layer limits the total requests per IP within a time window (Default: 150 requests / 15 mins). Excess requests receive `429 Too Many Requests`.

---

## ⚡ Performance & Optimization

### Cloud Mode (Clustering)
Setting `cloud: true` enables the Node.js `cluster` module.
*   **Master Process**: Manages workers.
*   **Worker Processes**: One process per CPU core.
*   **Benefit**: Multiplies throughput by the number of cores (e.g., 8-core CPU = ~8x performance).
*   **Auto-Respawn**: If a worker crashes, a new one is instantly spawned.

### HTTP/2 Support
The server attempts to use the `spdy` library for **HTTP/2**.
*   **Multiplexing**: Multiple requests over a single TCP connection.
*   **Header Compression**: Smaller payloads.
*   **Fallback**: Safely falls back to HTTP/1.1 if HTTP/2 is unavailable or unsupported by the client.

### JIT Optimization
On startup, the specific `_safeV8Optimize` method runs:
1.  Enables V8 `harmony` flags.
2.  Runs "warm-up" cycles on JSON stringification functions to trigger Inline Caching (IC) in the V8 engine, ensuring the first request is as fast as the last.

---

## 🔐 Authentication & Security

CodersAPI provides a first-class authentication system built for modern SaaS architectures.

### JWT Authentication

The framework uses `jsonwebtoken` for secure stateless authentication.

#### `app.sign(payload, [expiry])`
Signs a new JWT.
*   **payload**: (Object) The data to store in the token.
*   **expiry**: (String) Expiration time (e.g., '24h', '7d'). Default: '24h'.

#### `app.guard([roles])`
A middleware to protect routes.
*   **roles**: (Array) Optional list of required roles. If the decoded token's `role` field is not in this list, access is denied (403).

```javascript
// Example Usage
app.post('/login', (req, res) => {
   const token = app.sign({ id: 1, role: 'admin' });
   res.ok({ token });
});

app.get('/dashboard', app.guard(['admin', 'editor']), (req, res) => {
   res.ok(`Welcome ${req.user.id}`); // req.user is populated by the guard
});
```

### API Keys
Ideal for internal services or B2B integrations.

#### `app.apiKeyGuard([keys])`
*   **keys**: (Array) List of valid API keys to check against the `x-api-key` header.

### User Rate Limiting
Go beyond IP-based limiting by tracking specific users.

#### `app.userRateLimit(maxPerMinute)`
*   **maxPerMinute**: (Number) Max requests allowed per minute per user ID (from JWT) or IP.

---

## 🧩 Plugin System

Extend the core engine without modifying the library source.

#### `app.usePlugin(plugin, [options])`

A plugin is simply a function that receives the `CodersAPI` instance.

```javascript
const loggerPlugin = (instance, opts) => {
   console.log(`Plugin ${opts.name} loaded`);
   instance.app.use((req, res, next) => {
       console.log('Request received');
       next();
   });
};

app.usePlugin(loggerPlugin, { name: 'RequestLogger' });
```

---

## 💻 Official CLI

The `coders.api` command-line tool simplifies environment management and bootstrapping.

### Available Commands

| Command | Description |
| :--- | :--- |
| `init` | Scaffolds `index.js` and `.env` in the current directory. |
| `start` | Starts the server in production mode. |
| `dev` | Starts the server in development mode with `nodemon`. |
| `status` | Displays real-time CPU, RAM, and OS metrics. |
| `env` | Lists project environment variables (masked). |
| `info` | Displays project information and GitHub links. |
| `version` | Shows the current framework version. |

---

## 📊 Monitoring & Telemetry

### CLI Dashboard
Enable with `telemetry: true`. Replaces standard logs with a GUI.

*   **RPS Graph**: Real-time line chart of Requests Per Second.
*   **CPU Donut**: Visualizes system load.
*   **Traffic List**: Rolling log of methods/URLs.
*   **Blocked IP Gauge**: Real-time count of attackers caught by the DDoS Shield.

---

## 🛠️ Utilities

### Smart Fetch
A built-in HTTP client wrapper.

```javascript
// Automatically validates SSL, follows redirects, and rotates User-Agents
const response = await app.fetch('https://api.github.com/users/google');

// Returns JSON object directly if content-type is json
console.log(response.login);
```

---

<p align="center">Documentation maintained by the Coders</p>
