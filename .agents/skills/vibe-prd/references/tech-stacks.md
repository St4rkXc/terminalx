# Tech Stack Recommendations by Product Type

When the user hasn't specified a stack, use this guide to recommend one based on their product type.
Always explain WHY you're recommending a stack — don't just list technologies.

---

## How to Use This File

1. Identify the product type from the interview
2. Find the matching category below
3. Recommend the primary stack with brief rationale
4. Note the alternatives and when to consider them

---

## Web App (B2C / Consumer SaaS)

**Recommended Stack: Next.js Full-Stack**

| Layer          | Technology                               | Why                                                     |
| -------------- | ---------------------------------------- | ------------------------------------------------------- |
| Frontend + SSR | Next.js 14+ (App Router)                 | SEO, performance, DX, huge ecosystem                    |
| Language       | TypeScript                               | Type safety, fewer runtime bugs                         |
| UI             | Tailwind CSS + shadcn/ui                 | Fast to build, consistent, accessible by default        |
| State          | TanStack Query + Zustand                 | Async state vs. client state, separated concerns        |
| Auth           | Clerk or Auth0                           | Battle-tested, social login, MFA, saves weeks           |
| Database       | PostgreSQL (via Supabase or Neon)        | Relational, reliable, JSON support, serverless-friendly |
| ORM            | Drizzle ORM                              | Typesafe, lightweight, great with serverless            |
| Hosting        | Vercel (frontend) + Railway/Render (API) | Zero-config deploys, great DX                           |
| Email          | Resend                                   | Modern API, great React Email support                   |
| File Storage   | Cloudflare R2                            | Cheap, S3-compatible, no egress fees                    |
| Analytics      | PostHog                                  | Open source, product analytics + session replay         |
| Error Tracking | Sentry                                   | Industry standard                                       |

**When to use:** Consumer products, marketing-heavy apps, content-driven products, anything needing SEO.

**Alternative for simpler products:** Next.js with Supabase as backend (BaaS) — skip the custom API entirely.

---

## B2B SaaS / Dashboard-heavy Apps

**Recommended Stack: React + Dedicated Backend**

| Layer           | Technology                        | Why                                                     |
| --------------- | --------------------------------- | ------------------------------------------------------- |
| Frontend        | React 18+ (Vite) or Next.js       | SPA appropriate for app-like UIs                        |
| Language        | TypeScript                        | Essential for large codebases                           |
| UI              | shadcn/ui + Radix + Tailwind      | Accessible components, full control                     |
| Data Tables     | TanStack Table                    | Best-in-class, headless                                 |
| State           | TanStack Query + Zustand          | Same as above                                           |
| Backend         | Node.js + Fastify or NestJS       | Fastify: high performance; NestJS: structured for teams |
| Auth            | Auth0 or Clerk (with org support) | Multi-tenancy, SSO, SCIM, RBAC out of the box           |
| Database        | PostgreSQL + Redis                | RDBMS for core data, Redis for sessions/cache           |
| ORM             | Prisma or Drizzle                 | Prisma: more tooling; Drizzle: lighter, faster          |
| Background Jobs | BullMQ (via Redis)                | Battle-tested queue system                              |
| Hosting         | AWS ECS / GCP Cloud Run / Fly.io  | More control, better for variable load                  |

**When to use:** Admin panels, internal tools, multi-tenant SaaS, compliance-heavy industries.

**Alternative:** NestJS (more opinionated, better for larger teams with structure requirements).

---

## Mobile App (iOS + Android)

**Recommended Stack: React Native + Expo**

| Layer              | Technology                      | Why                                       |
| ------------------ | ------------------------------- | ----------------------------------------- |
| Framework          | React Native via Expo           | Write once, iOS + Android, huge ecosystem |
| Language           | TypeScript                      | Same as web, team can share knowledge     |
| Navigation         | Expo Router (file-based)        | Natural for React developers              |
| UI                 | NativeWind + custom components  | Tailwind-like syntax for mobile           |
| State              | TanStack Query + Zustand        | Same pattern as web                       |
| Auth               | Clerk or Supabase Auth          | Native-friendly SDKs                      |
| Backend            | Same as above (REST or GraphQL) | Share backend with web if applicable      |
| Push Notifications | Expo Notifications              | Cross-platform, simple                    |
| OTA Updates        | Expo Updates / EAS Update       | Ship fixes without app store review       |
| CI/CD              | EAS Build                       | Managed iOS/Android build service         |

**When to use:** Consumer mobile products, products where offline capability matters, MVP.

**Alternative:** Flutter — better performance, wider platform reach (web/desktop too), but requires Dart knowledge.

---

## API-Only / Backend Service

**Recommended Stack: Node.js or Python**

### Node.js (when team knows JS/TS)

| Layer      | Technology           | Why                                           |
| ---------- | -------------------- | --------------------------------------------- |
| Runtime    | Node.js 20+          | LTS, fast, huge ecosystem                     |
| Framework  | Fastify              | 2x faster than Express, schema-first, plugins |
| Language   | TypeScript           | Type safety                                   |
| Validation | Zod                  | Runtime + compile-time schema validation      |
| Database   | PostgreSQL + Drizzle | As above                                      |
| Testing    | Vitest + Supertest   | Fast, native ESM                              |
| Docs       | OpenAPI + Scalar     | Auto-generated, beautiful API docs            |

### Python (when team knows Python, or ML-adjacent)

| Layer      | Technology                          | Why                                      |
| ---------- | ----------------------------------- | ---------------------------------------- |
| Framework  | FastAPI                             | Async, auto OpenAPI, Pydantic validation |
| Language   | Python 3.11+                        | Type hints, async, fast                  |
| Validation | Pydantic v2                         | Fastest Python validation library        |
| Database   | PostgreSQL + SQLAlchemy or Tortoise | Mature, async-capable                    |
| Testing    | Pytest + HTTPX                      | Industry standard                        |

### Go (when performance is critical)

| Layer     | Technology             | Why                                           |
| --------- | ---------------------- | --------------------------------------------- |
| Framework | Fiber or Chi or stdlib | Fiber: Express-like; Chi: middleware-friendly |
| ORM       | GORM or sqlc           | sqlc: type-safe generated queries             |
| Testing   | Go testing + testify   | Built-in, fast                                |

**When to use Go:** High-throughput APIs (> 10K req/sec), microservices, infrastructure tools.

---

## Real-time / Collaborative Apps

**Recommended Stack: Next.js + WebSocket**

| Layer       | Technology                              | Why                                        |
| ----------- | --------------------------------------- | ------------------------------------------ |
| Frontend    | Next.js + React                         | Standard                                   |
| Real-time   | Liveblocks or Ably or Partykit          | Managed presence, conflict resolution      |
| Alternative | Socket.io (self-hosted)                 | More control, requires infra               |
| Database    | PostgreSQL + Supabase (Realtime)        | Built-in change events via Postgres        |
| State       | Y.js (for CRDT / collaborative editing) | Industry standard for conflict-free merges |

**When to use:** Figma-like tools, collaborative docs, live dashboards, multiplayer features.

---

## E-commerce

**Recommended Stack: Next.js + Commerce Layer**

| Layer             | Technology                                  | Why                                       |
| ----------------- | ------------------------------------------- | ----------------------------------------- |
| Frontend          | Next.js                                     | SEO critical for e-commerce               |
| Commerce Platform | Medusa.js (self-hosted) or Shopify Hydrogen | Medusa: full control; Shopify: proven     |
| Payment           | Stripe                                      | Best DX, global, subscriptions + one-time |
| Search            | Algolia or Typesense                        | Fast product search                       |
| Database          | PostgreSQL                                  | ACID for orders                           |

---

## AI-Powered Apps

**Recommended Stack: Next.js + Vercel AI SDK**

| Layer           | Technology                            | Why                                                  |
| --------------- | ------------------------------------- | ---------------------------------------------------- |
| Frontend        | Next.js                               | Streaming support, server components                 |
| AI SDK          | Vercel AI SDK                         | Provider-agnostic, streaming, tools/function calling |
| LLM Providers   | OpenAI / Anthropic / Gemini (via SDK) | Easy swap between providers                          |
| Vector Database | Pinecone or pgvector                  | pgvector: good enough for < 1M vectors, free         |
| Embeddings      | OpenAI text-embedding-3-small         | Cost-effective, high quality                         |
| RAG Framework   | LlamaIndex or LangChain               | Structure for complex pipelines                      |
| Caching         | Redis                                 | Cache LLM responses where appropriate                |

**Cost considerations:** Always calculate expected LLM call costs at scale. Add caching aggressively.

---

## Greenfield vs. Existing System Guidance

### Greenfield (Starting fresh)

- Prefer managed services over self-hosted — less ops overhead
- Use TypeScript for everything if JS ecosystem
- Pick Postgres — it does almost everything a startup needs
- Don't over-engineer — modular monolith scales further than people think

### Integrating with Legacy System

- Document all integration points as a risk register item
- Plan for schema mismatches — use an anti-corruption layer (adapter pattern)
- Consider whether to migrate or wrap the legacy API
- Define clear ownership boundaries

---

## Stack Decision Checklist

Before recommending a stack, verify:

- [ ] **Team familiarity:** What does the team already know? A known stack in the team is worth more than theoretically optimal.
- [ ] **Hosting budget:** Some stacks are expensive at scale (Vercel, managed DBs). Model the monthly cost at 10x current users.
- [ ] **Compliance requirements:** HIPAA → check if managed service has BAA. PCI → delegate card data to processor.
- [ ] **Timeline:** Tighter deadlines favor managed services (Supabase, Clerk, Resend) over self-hosted.
- [ ] **Scale projections:** Most startups over-engineer for scale. A Postgres + Node.js monolith handles millions of users with proper indexing.
- [ ] **Mobile requirement:** If mobile is critical, consider React Native from day one — retrofitting is painful.

---

## Common Anti-Patterns to Call Out in PRD

Flag these in the PRD's risk register if they appear:

1. **Premature microservices:** Almost always better to start with a monolith and extract services when a real bottleneck exists.
2. **Custom auth implementation:** Never roll your own auth — use a proven provider.
3. **No caching strategy:** Every API needs a cache layer design, even if not implemented day 1.
4. **Missing connection pooling:** PgBouncer or server-side pooling is essential with serverless.
5. **No database migration strategy:** "We'll just ALTER TABLE manually" is a disaster waiting to happen.
6. **Hard-coded configuration:** Secrets in code = security incident waiting to happen.
7. **No async jobs strategy:** Synchronous user-facing requests doing heavy work (email, PDF, AI) = bad UX and flaky APIs.
