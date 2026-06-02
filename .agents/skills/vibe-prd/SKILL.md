---
name: vibe-prd
description: Generate a comprehensive, professional Product Requirements Document (PRD) before the user starts building an app or software product. Triggers when the user types /vibe-prd, or when they say things like "buatin PRD", "buat PRD dulu", "I want to create a PRD", "help me plan my app", "generate PRD", "product requirements document", "I'm about to build an app", "planning a new product", or any variant asking to plan/document a software project before development. ALWAYS use this skill when the user wants structured documentation before coding. The output is a deeply detailed .md file (minimum 800 lines) covering every aspect of the product from architecture to deployment.
---

# PRD Spawnner

A skill that produces deeply professional, engineering-grade Product Requirements Documents before a user starts building a software product. The PRD is the north star of any project — get it right, and the entire development journey becomes measurably smoother.

## Why this matters

Most bugs and scope creep originate from ambiguity at the planning stage. A thorough PRD eliminates that ambiguity. It forces product thinking before code thinking. When done well, it also becomes a living reference that the team returns to throughout development.

## Workflow

The skill runs in two phases: **Interview → Generate**.

---

## Phase 1: Interview

**Never skip this phase.** The quality of the PRD depends entirely on the information gathered here.

When triggered, immediately enter interview mode. Present all questions in a single conversational block — don't drip them one by one. Tell the user this will take 2-3 minutes and is worth it.

Use this exact opening:

```
Alright, before I generate the PRD, I need to understand your project a bit deeper.
Answer everything you can — skip what you're not sure about, we can fill those in together later.
```

### Core Interview Questions

Group questions into sections so it feels organized, not overwhelming.

#### 🎯 About the Product

1. What is the name of the product / app you want to build?
2. In 1-2 sentences, what does this product do? (elevator pitch)
3. What specific problem does it solve?
4. Who is the target user? (demographics, skill level, context of use)

#### 🖥️ Platform & Scope

5. What platforms are you targeting? (Web app / Mobile iOS / Mobile Android / Desktop / API-only / all?)
6. Is this an MVP (minimum viable product) or a full product?
7. What are the MUST-HAVE features for v1? List them all.
8. What are the nice-to-have features? List them as well.

#### ⚙️ Tech & Architecture

9. Do you have a tech stack preference? (If you're not sure, write "recommend me one")
10. Does it need integration with other systems or third-party services? (payment, auth, maps, AI, etc.)
11. Do you already have an existing codebase? Or is this greenfield?
12. Do you need a dedicated backend, or serverless/BaaS (Firebase, Supabase, etc.)?

#### 📊 Scale & Business

13. Estimated users at launch: how many? 6 months out: how many?
14. Do you have a business model? (freemium, subscription, marketplace, etc.)
15. Are there any compliance/regulations to consider? (GDPR, HIPAA, PCI-DSS, etc.)
16. Who are your closest competitors? What makes your product different?

#### 👥 Team & Timeline

17. How many people are on the team? What are their roles?
18. What is the target launch date?
19. Are there budget constraints to include in the planning?

### Handling incomplete answers

The user won't always answer everything. That's fine. Use these fallback strategies:

- If platform is unknown → assume web-first, mobile-responsive
- If tech stack is unknown → recommend based on product type (see `references/tech-stacks.md`)
- If scale is unknown → assume 1K MAU at launch, 10K at 6 months
- If team is unknown → assume solo developer or small team (2-4)
- Always state your assumptions explicitly in the PRD under "Assumptions & Constraints"

### Confirming before generating

After collecting answers, give a quick summary:

```
Alright, here's what I've captured:
[bullet summary of key points]

I'm ready to generate the PRD now. Is there anything you'd like to change or add first?
```

Wait for confirmation, then proceed to Phase 2.

---

## Phase 2: PRD Generation

Generate the PRD as a single `.md` file saved to `plan/prd/[product-name]-PRD.md`.

**Minimum length: 800 lines.** This is not arbitrary — professional PRDs are thorough. If a section feels thin, go deeper. Add diagrams using Mermaid syntax. Add tables. Add code examples for API contracts.

Read `references/prd-template.md` for the complete template structure and fill every section with specific, concrete content based on what the user told you. Never use generic filler text.

### Generation principles

**Be specific, not generic.** Instead of "the system should be fast", write "API endpoints must respond in < 200ms at p95 under 500 concurrent users."

**Think like a senior engineer.** Anticipate failure modes. Call out edge cases. Flag technical risks. Suggest patterns that will prevent bugs before they happen.

**Think like a product manager.** Every feature needs a WHY. Every user story maps to a business outcome. Every metric is measurable.

**Think like a security engineer.** Don't treat security as an afterthought section — weave it throughout. Mention auth strategy in the architecture section, input validation in the API section, rate limiting in the infra section.

**Think scalably.** Even for MVPs, design decisions should not create walls. Call out which decisions are "good enough for now" and what the migration path looks like.

### Mermaid diagrams to include

Always include at least these diagrams (rendered in Mermaid):

1. **System Architecture Overview** — components and how they connect
2. **Entity Relationship Diagram** — core data models
3. **Core User Flow** — the primary happy path as a flowchart
4. **API Request Lifecycle** — how a typical request flows through the system (for products with a backend)

### After generation

Present the file using `present_files`. Then say:

```
The PRD is ready — [X] lines, ready to serve as your project's north star.

Here are a few highlights from this PRD:
- [top 3 most important technical decisions made]
- [top risk called out]

You can share this directly with your team, or we can refine specific sections if anything needs adjustment.
```

---

## Reference files

- `references/prd-template.md` — Full PRD template with all sections. **Read this before generating.**
- `references/tech-stacks.md` — Tech stack recommendations by product type. Read when the user hasn't specified a stack.
