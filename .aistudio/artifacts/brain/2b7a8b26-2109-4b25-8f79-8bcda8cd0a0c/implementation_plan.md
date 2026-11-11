# Fix 404 API Route Login Failure & Deployment URL Routing

Resolve the "API route not found (404)" error encountered during login on deployed instances by fixing URL prefix mismatches, adding consecutive slash normalization, enabling CORS preflight handling, and supporting dual route mounting.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Root Cause Identified**:
> 1. **URL Normalization**: If any base URL or deployment proxy introduces a double slash (e.g., `//api/auth/login`), Express strict routing does not match `/api/auth/login` and immediately returns `404 Not Found`. In `agencyApi.ts`, any HTTP 404 triggers the exact error banner: *"API route not found (404). The server may still be deploying or starting up."*
> 2. **Proxy Prefix Mismatches**: In Google AI Studio deployments and reverse proxies, requests may sometimes be forwarded either with or without the `/api` prefix (e.g., `/auth/login` vs. `/api/auth/login`).
> 3. **CORS / Preflight**: When accessing the deployed backend from an external browser origin or iframe, browsers dispatch an `OPTIONS` preflight request. Without CORS headers in `server.ts`, Express returns a 404 on preflight.
> 4. **Cold Start Timing**: On newly triggered deployments (Cloud Run / Render), the container spins up fresh. During the first ~30 seconds, requests can receive 404/503 from the Google Frontend gateway before the Node process is listening.

- **Confirmed Decision 1**: Add incoming URL slash-normalization middleware in `server.ts` to collapse any consecutive leading slashes (e.g., `//api/...` $\to$ `/api/...`).
- **Confirmed Decision 2**: Mount `apiRouter` on both `app.use('/api', apiRouter)` and `app.use(apiRouter)` so that requests sent to `/api/auth/login` and `/auth/login` both resolve correctly.
- **Confirmed Decision 3**: Add lightweight CORS and preflight middleware in `server.ts` to allow cross-origin requests from preview origins and custom domains.
- **Confirmed Decision 4**: Sanitize endpoint concatenation in `src/services/agencyApi.ts` to strip trailing slashes from `baseUrl` and ensure clean single-slash paths.

---

### 1. Overview & Core Concept

- **What It Does**: Hardens the backend server entry point (`server.ts`) and frontend API client (`agencyApi.ts`) against routing mismatches, trailing/leading slash glitches, and missing CORS preflights.
- **Target Audience / Persona**: Agency directors logging into the workspace on deployed domains, preview URLs, and Cloud Run environments.
- **Key Value**: Completely eliminates 404 errors during authentication and data fetching across all deployment environments.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Director Login on Deployed Instances**:
   - The user opens the deployed website URL (whether on Google AI Studio's Cloud Run or Render).
   - The user navigates to the Director Access card.
   - Submitting valid credentials immediately sends `POST /api/auth/login`.
   - The backend matches the route instantly, verifies the password hash, returns the JWT session cookie and token, and transitions the director into the workspace without any 404 error.
2. **First-Time Setup Flow**:
   - On a fresh deployment with zero accounts, the user fills in their name, email, and password in the setup form.
   - `POST /api/auth/setup-admin` processes cleanly and grants immediate Owner access.

#### Visual Polish & Feedback
- Login button shows an unhurried, clean spinner during authentication ("Authenticating...").
- Descriptive, precise error banners: If the server is genuinely cold-starting, an automatic retry button and clear status message guide the user.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Mount Route Matching (`/api` + `/`)**
  - *Chosen Approach*: Mount `apiRouter` at both `/api` and root in `server.ts`.
  - *Why*: Immune to whether a client, proxy, or reverse gateway forwards paths with or without `/api`.
  - *Alternatives Considered*: Only mounting `/api`. Fails whenever a proxy strips the prefix.

- **Decision 2: In-Memory URL Normalization Middleware**
  - *Chosen Approach*: A lightweight 4-line Express middleware before route matching that normalizes `req.url`.
  - *Why*: Resolves double slashes without external dependencies or regex overhead.

- **Decision 3: Express CORS Preflight Handling**
  - *Chosen Approach*: Allow standard `GET, POST, PATCH, DELETE, OPTIONS` with `Authorization`, `Content-Type`, and credential support (`Access-Control-Allow-Credentials: true`).
  - *Why*: Ensures browser cross-origin requests from preview origins never fail preflight with 404.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INCOMING REQUEST                                │
│   e.g. POST /api/auth/login OR //api/auth/login OR /auth/login        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   EXPRESS MIDDLEWARE PIPELINE                          │
│                                                                        │
│   1. URL Normalizer: Collapses "//api/..." -> "/api/..."               │
│   2. CORS & Preflight: Responds 204 to OPTIONS with allowed headers    │
│   3. Body Parsers: express.json(), express.urlencoded()                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       ROUTER RESOLUTION                                │
│                                                                        │
│   app.use('/api', apiRouter)  ◄── Matches /api/auth/login              │
│   app.use(apiRouter)          ◄── Matches /auth/login fallback         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    AUTH HANDLER & SQLITE DB                            │
│   Verifies scrypt password hash -> Issues 30-day session cookie + JWT  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Step-by-Step Implementation Plan

1. **`server.ts`**:
   - Add URL slash normalization middleware before routing.
   - Add CORS headers and `OPTIONS` preflight handler for API routes.
   - Mount `apiRouter` on both `/api` and root.
2. **`src/services/agencyApi.ts`**:
   - Clean and normalize base URL and endpoint concatenation (`cleanBase + cleanEndpoint`).
   - Add graceful retry support if an initial request returns 404 while the server is waking up from a cold start.
3. **Verification**:
   - Test `POST /api/auth/login`, `POST //api/auth/login`, and `POST /auth/login` via curl.
   - Test `OPTIONS` preflight response.
   - Run `npm run build`, `compile_applet`, and `lint_applet`.
