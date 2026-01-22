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
    name: 'My API',
});

// Add a simple route
app.get('/', (req, res) => {
    res.ok("Hello from CodersAPI!");
});

// Start listening
app.start(3000);
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

### Validation Middleware (Hardened)

The `validate` method ensures required fields exist and match specific rules in `req.body`, `req.query`, or `req.params`.

#### Simple Validation (Existence)
```javascript
app.post('/login', app.validate(['username', 'password']), (req, res) => {
    res.ok("Login successful");
});
```

#### Advanced Validation (Schema-based)
You can define types and constraints for each field.
```javascript
app.post('/register', app.validate({
    username: { required: true, type: 'string', min: 3, max: 20 },
    age: { required: true, type: 'number' },
    bio: { type: 'string', max: 200 } // Optional field with max length
}), (req, res) => {
    res.ok("User registered");
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

### 4. Proxy Trust
If your server is behind a proxy (Nginx, Cloudflare, etc.), enable `trustProxy` to ensure correct IP detection for the DDoS Shield.
```javascript
const app = new CodersAPI({ trustProxy: true });
```

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

#### `app.csrfGuard()`
Enforces CSRF protection using the Double Submit Cookie pattern.
*   **Requirement**: Client must send `X-CSRF-Token` header matching the `CSRF-Token` cookie.

---

## 🔒 Integrity Engine (Anti-Fiddler/MITM)

The Integrity Engine prevents attackers from intercepting and modifying traffic using tools like Fiddler, Burp Suite, or HTTP proxies.

### 1. Response Integrity (Active)
Every response sent via `res.ok()` automatically includes an **HMAC-SHA256 signature** in the `X-Response-Signature` header.
*   **Verification**: The client can use the shared secret to hash the response body and compare it with the header. If an attacker modifies the JSON body in a proxy, the signature will no longer match.

### 2. Request Integrity (Guard)
Protect sensitive endpoints from tampering by requiring the client to sign the request.

#### `app.integrityGuard()`
Add this middleware to any route to verify the payload integrity.

```javascript
app.post('/transfer', app.integrityGuard(), (req, res) => {
   res.ok("Transition processed safely");
});
```

**Client Requirements:**
The client must send two headers:
1.  `x-request-timestamp`: Current Unix timestamp (MS).
2.  `x-request-signature`: `HMAC-SHA256(secret, method + url + timestamp + body)`

*This prevents **Replay Attacks** (5-minute window) and **Payload Tampering**.*

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

The `codersapi` command-line tool simplifies environment management and bootstrapping.

### Available Commands

| Command | Description |
| :--- | :--- |
| `init` | Scaffolds `index.js` and `.env` in the current directory. |
| `start` | Starts the server in production mode. |
| `dev` | Starts the server in development mode with `nodemon`. |
| `status` | Displays real-time CPU, RAM, and OS metrics. |
| `env` | Lists project environment variables (masked). |
| `info` | Access sub-commands: `project`, `system`, `env`, `deps`, `author`. |
| `version` | Shows the current framework version. |

### Info Sub-commands
Use `codersapi info <subcommand>` to get detailed metadata:
- `project`: General framework details (default).
- `system`: Detailed CPU, RAM, and OS metrics.
- `env`: List and mask sensitive project environment variables.
- `deps`: List all current project dependencies.
- `author`: Developer contact and social information.

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
