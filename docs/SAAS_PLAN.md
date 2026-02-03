# n8n MCP SaaS Platform - Project Plan

## Executive Summary

โปรเจคนี้คือ **SaaS Platform** ที่ให้บริการ MCP (Model Context Protocol) Server สำหรับเชื่อมต่อ AI clients (Claude, Cursor, etc.) กับ n8n automation platform

**Value Proposition:** ลูกค้าสามารถใช้ AI ควบคุม n8n workflows ได้ผ่านการพูดคุย โดยไม่ต้อง host MCP server เอง

---

## Table of Contents

1. [Business Model](#1-business-model)
2. [System Architecture](#2-system-architecture)
3. [Features & Requirements](#3-features--requirements)
4. [Database Schema](#4-database-schema)
5. [API Specification](#5-api-specification)
6. [Security Considerations](#6-security-considerations)
7. [Implementation Phases](#7-implementation-phases)
8. [Pricing Strategy](#8-pricing-strategy)
9. [Technology Stack](#9-technology-stack)

---

## 1. Business Model

### 1.1 Target Customers

| Segment | Description | Priority |
|---------|-------------|----------|
| Technical Users | Developers, DevOps ที่รู้จัก n8n และ MCP | Primary (early adopters) |
| Non-Technical Users | Business users ที่ต้องการใช้ AI จัดการ automation | Secondary (growth phase) |

### 1.2 Revenue Model

- **Subscription-based** พร้อม usage limits
- Charge ตาม tier/plan
- Overage charges สำหรับ usage เกิน limit

### 1.3 Value Chain

```
┌─────────────────────────────────────────────────────────────────┐
│                         Customer Journey                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Sign Up        2. Connect n8n      3. Get API Key           │
│  ┌─────────┐       ┌─────────────┐     ┌─────────────┐          │
│  │ Register│ ────▶ │ Enter n8n   │ ──▶ │ Receive     │          │
│  │ Account │       │ URL + Key   │     │ SaaS API Key│          │
│  └─────────┘       └─────────────┘     └─────────────┘          │
│                                               │                  │
│                                               ▼                  │
│  4. Configure MCP Client           5. Use AI with n8n           │
│  ┌─────────────────────┐          ┌─────────────────────┐       │
│  │ Add API Key to      │ ──────▶  │ "Create a workflow  │       │
│  │ Claude/Cursor/etc   │          │  that sends emails" │       │
│  └─────────────────────┘          └─────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│   │ Claude   │  │ Cursor   │  │ Continue │  │ Other    │       │
│   │ Desktop  │  │ IDE      │  │ Dev      │  │ MCP      │       │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│        │             │             │             │               │
│        └─────────────┴──────┬──────┴─────────────┘               │
│                             │ MCP Protocol                       │
│                             │ (Authorization: Bearer xxx)        │
│                             ▼                                    │
├─────────────────────────────────────────────────────────────────┤
│                        SaaS Layer                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Cloudflare Workers (MCP Server)             │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│   │  │ Auth        │  │ Rate        │  │ Usage       │     │   │
│   │  │ Middleware  │  │ Limiter     │  │ Tracker     │     │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│   │                         │                                │   │
│   │                         ▼                                │   │
│   │  ┌─────────────────────────────────────────────────┐   │   │
│   │  │              MCP Tool Handler                    │   │   │
│   │  │         (32 tools for n8n operations)            │   │   │
│   │  └─────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                             │                                    │
│   ┌─────────────────────────┴─────────────────────────┐         │
│   │                                                    │         │
│   ▼                                                    ▼         │
│   ┌──────────────┐                          ┌──────────────┐    │
│   │ Cloudflare   │                          │ Cloudflare   │    │
│   │ D1 Database  │                          │ KV Store     │    │
│   │ (Users, Keys)│                          │ (Rate Limit) │    │
│   └──────────────┘                          └──────────────┘    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                      Customer Layer                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   │ Customer A   │  │ Customer B   │  │ Customer C   │         │
│   │ n8n Instance │  │ n8n Instance │  │ n8n Instance │         │
│   │ (self-hosted)│  │ (n8n cloud)  │  │ (self-hosted)│         │
│   └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Request Flow                              │
└─────────────────────────────────────────────────────────────────┘

1. Client sends MCP request
   ┌─────────────────────────────────────────┐
   │ POST /mcp                               │
   │ Authorization: Bearer n2f_abc123       │
   │ Content-Type: application/json          │
   │                                         │
   │ {                                       │
   │   "method": "tools/call",               │
   │   "params": {                           │
   │     "name": "n8n_list_workflows"        │
   │   }                                     │
   │ }                                       │
   └─────────────────────────────────────────┘
                    │
                    ▼
2. Auth Middleware
   ┌─────────────────────────────────────────┐
   │ - Extract API key from header           │
   │ - Lookup user from D1 database          │
   │ - Validate key is active                │
   │ - Get n8n credentials from DB           │
   └─────────────────────────────────────────┘
                    │
                    ▼
3. Rate Limiter
   ┌─────────────────────────────────────────┐
   │ - Check usage count in KV               │
   │ - Compare with plan limit               │
   │ - Reject if over limit                  │
   │ - Increment counter                     │
   └─────────────────────────────────────────┘
                    │
                    ▼
4. MCP Handler
   ┌─────────────────────────────────────────┐
   │ - Parse MCP request                     │
   │ - Create N8nClient with user's creds    │
   │ - Execute tool                          │
   │ - Return response                       │
   └─────────────────────────────────────────┘
                    │
                    ▼
5. Usage Tracker
   ┌─────────────────────────────────────────┐
   │ - Log request to D1                     │
   │ - Update monthly usage count            │
   └─────────────────────────────────────────┘
                    │
                    ▼
6. Response
   ┌─────────────────────────────────────────┐
   │ {                                       │
   │   "result": {                           │
   │     "content": [...]                    │
   │   }                                     │
   │ }                                       │
   └─────────────────────────────────────────┘
```

---

## 3. Features & Requirements

### 3.1 Core Features (MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **User Registration** | สมัครสมาชิกด้วย email | P0 |
| **n8n Connection** | ลงทะเบียน n8n URL + API key | P0 |
| **API Key Generation** | สร้าง SaaS API key สำหรับ MCP client | P0 |
| **MCP Server** | 32 tools สำหรับ n8n operations | P0 (มีแล้ว) |
| **Usage Tracking** | นับจำนวน requests ต่อเดือน | P0 |
| **Rate Limiting** | จำกัด requests ตาม plan | P0 |

### 3.2 Growth Features (Phase 2)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Dashboard** | UI ดู usage, manage keys | P1 |
| **Multiple n8n Instances** | เชื่อมต่อหลาย n8n ต่อ account | P1 |
| **Billing Integration** | Stripe payment | P1 |
| **Usage Analytics** | Charts, reports | P2 |
| **Team Management** | Multiple users per account | P2 |
| **Webhooks** | Notify on events | P2 |

### 3.3 Functional Requirements

#### FR-001: User Registration
- ผู้ใช้สามารถสมัครด้วย email + password
- ส่ง verification email
- สร้าง account พร้อม default plan (Free)

#### FR-002: n8n Connection Management
- ผู้ใช้สามารถเพิ่ม n8n instance (URL + API key)
- ระบบ validate connection ก่อนบันทึก
- เข้ารหัส API key ก่อนเก็บใน database

#### FR-003: API Key Management
- ระบบสร้าง unique API key สำหรับแต่ละ n8n connection
- ผู้ใช้สามารถ regenerate key ได้
- ผู้ใช้สามารถ revoke key ได้

#### FR-004: Usage Tracking
- นับทุก MCP request
- แยกตาม user, n8n instance, tool
- Reset counter ทุกต้นเดือน

#### FR-005: Rate Limiting
- ตรวจสอบ usage ก่อนทุก request
- Return 429 Too Many Requests เมื่อเกิน limit
- แสดง remaining quota ใน response headers

### 3.4 Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Availability** | 99.9% uptime |
| **Latency** | < 500ms p95 (excluding n8n response time) |
| **Scalability** | Support 10,000+ concurrent users |
| **Security** | Encrypt all sensitive data at rest |

---

## 4. Database Schema

### 4.1 Cloudflare D1 Schema

```sql
-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    plan TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- n8n Connections table
CREATE TABLE n8n_connections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    n8n_url TEXT NOT NULL,
    n8n_api_key_encrypted TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- API Keys table
CREATE TABLE api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    connection_id TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,  -- First 8 chars for display
    name TEXT,
    status TEXT DEFAULT 'active',
    last_used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (connection_id) REFERENCES n8n_connections(id)
);

-- Usage Logs table
CREATE TABLE usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    api_key_id TEXT NOT NULL,
    connection_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    status TEXT NOT NULL,  -- 'success', 'error', 'rate_limited'
    response_time_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Monthly Usage Summary table
CREATE TABLE usage_monthly (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    year_month TEXT NOT NULL,  -- Format: '2024-01'
    request_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, year_month),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Plans table
CREATE TABLE plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    monthly_request_limit INTEGER NOT NULL,
    price_monthly REAL NOT NULL,
    features TEXT,  -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO plans (id, name, monthly_request_limit, price_monthly, features) VALUES
    ('free', 'Free', 100, 0, '{"connections": 1, "support": "community"}'),
    ('starter', 'Starter', 1000, 9.99, '{"connections": 3, "support": "email"}'),
    ('pro', 'Pro', 10000, 29.99, '{"connections": 10, "support": "priority"}'),
    ('enterprise', 'Enterprise', 100000, 99.99, '{"connections": "unlimited", "support": "dedicated"}');

-- Indexes for performance
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_usage_logs_user_month ON usage_logs(user_id, created_at);
CREATE INDEX idx_usage_monthly_user ON usage_monthly(user_id, year_month);
CREATE INDEX idx_n8n_connections_user ON n8n_connections(user_id);
```

### 4.2 Cloudflare KV Structure

```
Rate Limiting:
  Key: "rate:{user_id}:{year_month}"
  Value: request_count (integer)
  TTL: 35 days

Session Cache:
  Key: "session:{session_id}"
  Value: { user_id, email, plan }
  TTL: 24 hours

API Key Cache:
  Key: "apikey:{key_hash}"
  Value: { user_id, connection_id, n8n_url, n8n_api_key }
  TTL: 1 hour
```

---

## 5. API Specification

### 5.1 Management API (Dashboard)

#### Authentication

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

#### User Management

```
GET    /api/user/profile
PUT    /api/user/profile
DELETE /api/user/account
```

#### n8n Connections

```
GET    /api/connections              # List all connections
POST   /api/connections              # Add new connection
GET    /api/connections/:id          # Get connection details
PUT    /api/connections/:id          # Update connection
DELETE /api/connections/:id          # Delete connection
POST   /api/connections/:id/test     # Test connection
```

#### API Keys

```
GET    /api/keys                     # List all API keys
POST   /api/keys                     # Create new key
DELETE /api/keys/:id                 # Revoke key
POST   /api/keys/:id/regenerate      # Regenerate key
```

#### Usage & Billing

```
GET    /api/usage                    # Get current usage
GET    /api/usage/history            # Get usage history
GET    /api/billing/plans            # List available plans
POST   /api/billing/subscribe        # Subscribe to plan
POST   /api/billing/cancel           # Cancel subscription
GET    /api/billing/invoices         # List invoices
```

### 5.2 MCP API (Existing + Auth)

```
POST /mcp
Headers:
  - Authorization: Bearer {n2f_api_key}
  - Content-Type: application/json

Body: JSON-RPC 2.0 (MCP Protocol)
```

### 5.3 API Response Format

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Monthly request limit exceeded",
    "details": {
      "limit": 1000,
      "used": 1000,
      "reset_at": "2024-02-01T00:00:00Z"
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 5.4 Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 500
X-RateLimit-Reset: 2024-02-01T00:00:00Z
```

---

## 6. Security Considerations

### 6.1 Authentication & Authorization

| Concern | Solution |
|---------|----------|
| Password Storage | bcrypt hash with salt |
| Session Management | JWT with short expiry + refresh tokens |
| API Key Format | `n2f_{random_32_chars}` |
| API Key Storage | SHA-256 hash (never store plaintext) |

### 6.2 Data Protection

| Data | Protection Method |
|------|-------------------|
| n8n API Keys | AES-256 encryption at rest |
| User Passwords | bcrypt hash |
| API Keys | SHA-256 hash |
| Communication | HTTPS only |

### 6.3 Input Validation

- Validate all inputs before processing
- Sanitize error messages (no sensitive data leakage)
- Validate n8n URL format (prevent SSRF)
- Rate limit login attempts (prevent brute force)

### 6.4 API Key Security

```
Generation:
1. Generate 32 random bytes
2. Encode as base64url
3. Prefix with "n2f_"
4. Return to user ONCE
5. Store SHA-256 hash in database

Validation:
1. Extract key from Authorization header
2. Compute SHA-256 hash
3. Lookup hash in database
4. Check key status is 'active'
```

---

## 7. Implementation Phases

### Phase 1: MVP (Week 1-2)

**Goal:** ทำให้ใช้งานและ charge เงินได้

#### Week 1: Core Infrastructure
- [ ] Setup Cloudflare D1 database
- [ ] Create database schema
- [ ] Implement user registration/login
- [ ] Implement n8n connection management
- [ ] Implement API key generation

#### Week 2: Integration & Launch
- [ ] Add auth middleware to MCP server
- [ ] Implement usage tracking
- [ ] Implement rate limiting
- [ ] Create simple landing page
- [ ] Setup Stripe checkout
- [ ] Deploy & test

**Deliverables:**
- Working auth system
- API key management
- Usage tracking
- Rate limiting
- Stripe payment link

---

### Phase 2: Dashboard (Week 3-4)

**Goal:** ให้ลูกค้า self-service ได้

#### Week 3: Dashboard Backend
- [ ] Usage API endpoints
- [ ] Billing API endpoints
- [ ] Connection management API

#### Week 4: Dashboard Frontend
- [ ] Login/Register pages
- [ ] Dashboard overview
- [ ] Connection management UI
- [ ] API key management UI
- [ ] Usage charts
- [ ] Billing/subscription UI

**Deliverables:**
- Full dashboard UI
- Self-service connection management
- Usage visualization

---

### Phase 3: Growth Features (Week 5-8)

**Goal:** เพิ่ม features สำหรับ scale

- [ ] Multiple n8n connections per account
- [ ] Team management
- [ ] Usage analytics & reports
- [ ] Webhooks for events
- [ ] API documentation portal
- [ ] Email notifications

---

### Phase 4: Enterprise (Week 9+)

**Goal:** รองรับลูกค้าองค์กร

- [ ] SSO integration (SAML, OIDC)
- [ ] Audit logs
- [ ] Custom contracts
- [ ] SLA guarantees
- [ ] Dedicated support

---

## 8. Pricing Strategy

### 8.1 Pricing Tiers

| Plan | Price | Requests/Month | Connections | Support |
|------|-------|----------------|-------------|---------|
| **Free** | $0 | 100 | 1 | Community |
| **Starter** | $9.99/mo | 1,000 | 3 | Email |
| **Pro** | $29.99/mo | 10,000 | 10 | Priority |
| **Enterprise** | $99.99/mo | 100,000 | Unlimited | Dedicated |

### 8.2 Overage Pricing

| Plan | Overage Rate |
|------|--------------|
| Free | Not allowed (upgrade required) |
| Starter | $0.02/request |
| Pro | $0.01/request |
| Enterprise | $0.005/request |

### 8.3 Pricing Rationale

```
Cost Analysis (per 1000 requests):
- Cloudflare Workers: ~$0.15
- D1 Database: ~$0.05
- Bandwidth: ~$0.02
- Total cost: ~$0.22

Pricing (Starter plan):
- $9.99 / 1000 requests = $0.01/request
- Margin: ~97%

Pricing (Pro plan):
- $29.99 / 10000 requests = $0.003/request
- Margin: ~86%
```

---

## 9. Technology Stack

### 9.1 Infrastructure

| Component | Technology | Reason |
|-----------|------------|--------|
| **Compute** | Cloudflare Workers | Serverless, global edge, low latency |
| **Database** | Cloudflare D1 | SQLite at edge, integrated with Workers |
| **Cache/KV** | Cloudflare KV | Fast key-value, rate limiting |
| **CDN** | Cloudflare | Integrated |
| **DNS** | Cloudflare | Integrated |

### 9.2 Backend

| Component | Technology | Reason |
|-----------|------------|--------|
| **Language** | TypeScript | Type safety, existing codebase |
| **Runtime** | Cloudflare Workers | Existing deployment |
| **Auth** | JWT + bcrypt | Standard, secure |
| **Encryption** | Web Crypto API | Built into Workers |

### 9.3 Frontend (Dashboard)

| Component | Technology | Reason |
|-----------|------------|--------|
| **Framework** | React / Next.js | Popular, large ecosystem |
| **UI Library** | Tailwind CSS + shadcn/ui | Fast development |
| **Charts** | Recharts | Simple, React-native |
| **Hosting** | Cloudflare Pages | Integrated, free |

### 9.4 Third-Party Services

| Service | Purpose |
|---------|---------|
| **Stripe** | Payment processing |
| **Resend / SendGrid** | Transactional emails |
| **Sentry** | Error monitoring |
| **Plausible / Umami** | Privacy-friendly analytics |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **MCP** | Model Context Protocol - Anthropic's protocol for AI-tool integration |
| **n8n** | Open-source workflow automation platform |
| **SaaS** | Software as a Service |
| **Tenant** | A customer/organization using the platform |
| **API Key** | Secret token for authenticating API requests |

---

## Appendix B: References

- [MCP Specification](https://modelcontextprotocol.io/)
- [n8n Public API Documentation](https://docs.n8n.io/api/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Stripe API Documentation](https://stripe.com/docs/api)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-27 | Claude | Initial draft |

---

*This document is a living document and will be updated as the project evolves.*
