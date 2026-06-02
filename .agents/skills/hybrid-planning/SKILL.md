---
name: hybrid-planning
description: >
    Activate this skill ONLY by using the `/hybrid-plan` slash command.
    Use `/hybrid-plan` to initiate ARCHITECT mode (for planning) and `/hybrid-plan execute <file>`
    to initiate BUILDER mode (for execution). This skill enforces two
    strict operating modes — ARCHITECT (plan only, zero application code) and BUILDER (execute
    only, zero theory) — and must be consulted before writing any plan document or implementation
    code. Never mix the two modes in a single response.
---

# Hybrid Planning & High-Signal Execution Skill

## Overview

This skill enforces a strict two-phase discipline for software development: **think exhaustively
first, then execute precisely**. Every response must belong to exactly one mode. Mixed-mode
responses are a skill violation.

```
┌──────────────────────────────────────────────────────────────────┐
│  NEW TASK / FEATURE REQUEST                                       │
│           │                                                       │
│           ▼                                                       │
│  ┌─────────────────┐    Plan exists &     ┌───────────────────┐  │
│  │  ARCHITECT MODE  │ ──── approved? ───▶  │   BUILDER MODE    │  │
│  │  (Plan Only)     │                      │   (Code Only)     │  │
│  └─────────────────┘                      └───────────────────┘  │
│           ▲                                  │             │      │
│           └──── Scope gap detected ──────────┘             │      │
│                                                            ▼      │
│                                              ┌─────────────────┐  │
│                                              │   _debt.md Log  │  │
│                                              │ (non-blocking)  │  │
│                                              └─────────────────┘  │
│                                                                    │
│  SESSION START → Context Snapshot → resume correct step           │
└──────────────────────────────────────────────────────────────────┘
```

---
## 1. MODE DETECTION

Determine the correct mode based on the `/hybrid-plan` command used:

| Command | Mode |
| ----------------------------------------------------------------------------------- | ------------------------------------ |
| `/hybrid-plan`                                                                      | ARCHITECT                            |
| `/hybrid-plan execute <file>`                                                       | BUILDER                              |
| User says "continue" and a validated plan is in scope                               | BUILDER → run Context Snapshot first |
| A Builder step requires changes **not covered by the plan**                         | → Pause → ARCHITECT (mini-plan)      |
| Builder discovers a fixable issue that is **out of scope**                          | → Log to `_debt.md` → continue       |

**Always state the active mode on the first line of your response:**

```
[ARCHITECT MODE] — Planning: <feature-name>
[BUILDER MODE]   — Executing: <plan-file>.md / Step <N> of <total>
```
---

## 2. ARCHITECT MODE

### 2.1 Trigger Conditions

Activate when:

- User invokes `/hybrid-plan` command to start a new task
- No `plan/` file exists for the current task
- An existing plan is incomplete, stale, or contradicts the current codebase state
- Builder mode discovers a scope gap (undocumented dependency, missing type, unhandled edge case)

### 2.2 Hard Rules

- **ZERO application code.** Do not write, edit, or suggest code outside `plan/`.
- **ZERO shortcuts.** A lazy plan (< 300 lines, vague steps, missing interfaces) is a direct skill violation.
- **ONE plan, ONE file.** Each feature/migration gets its own file: `plan/<feature-name>.plan.md`.
- **Remind the user** to add `plan/` to `.gitignore` if not already done.

### 2.3 Pre-Planning Checklist (run before writing the plan)

Before drafting, perform a silent codebase audit and answer these internally:

- [ ] What files will be **created**?
- [ ] What files will be **modified**?
- [ ] What files will be **deleted**?
- [ ] What TypeScript interfaces / types need to be defined or changed?
- [ ] What database schema or API contracts are affected?
- [ ] What are the top 5 edge cases or failure modes?
- [ ] Are there auth/security implications (Firebase Rules, JWT, RBAC)?
- [ ] Does this task have dependencies on in-progress work?

### 2.4 Plan Document Structure (Mandatory)

Every `plan/*.plan.md` must follow this exact structure. Sections cannot be skipped.

````markdown
# Plan: <Feature / Task Name>

**Version:** 1.0
**Status:** DRAFT | APPROVED | IN PROGRESS | COMPLETE
**Created:** YYYY-MM-DD
**Estimated Steps:** <N>

---

## 1. Context & Goals

> 3–6 sentence high-signal summary. Why does this task exist?
> What problem does it solve? What does success look like?

**Out of Scope:** (explicitly list what this plan does NOT cover)

---

## 2. Affected Files Map

### Created

- `src/...` — reason

### Modified

- `src/...` — what changes and why

### Deleted

- `src/...` — why removed

---

## 3. Architectural Design

### 3.1 Component / Module Hierarchy

(Tree diagram or bullet structure showing relationships)

### 3.2 State Management (Pinia / Zustand / Context)

(Store names, state shape, actions, getters)

### 3.3 API & Data Layer (Firebase / Laravel / tRPC / REST)

(Endpoint definitions, collection paths, query structure)

### 3.4 Routing Changes

(New routes, guards, redirects)

---

## 4. Strict Contract Definitions

> All types must be defined HERE before a single line of code is written.
> Builder mode will treat these as the source of truth.

### 4.1 TypeScript Interfaces & Types

```ts
interface ExampleEntity {
    id: string;
    createdAt: Timestamp;
    // ...
}
```
````

### 4.2 API Payloads / Response Shapes

```ts
// POST /api/example
type ExampleRequest = { ... }
type ExampleResponse = { ... }
```

### 4.3 Database Schema / Firebase Rules Snapshot

```
/collection/{docId}: {
  field: type  // constraints
}
```

### 4.4 Component Props

```ts
interface ComponentProps {
    prop: type;
    optionalProp?: type;
}
```

---

## 5. Edge Cases & Security Audit

| #   | Scenario                            | Expected Behavior | Mitigation |
| --- | ----------------------------------- | ----------------- | ---------- |
| 1   | Network loss mid-write              |                   |            |
| 2   | Concurrent updates (race condition) |                   |            |
| 3   | Invalid / missing input             |                   |            |
| 4   | Unauthorized access attempt         |                   |            |
| 5   | Empty state / zero results          |                   |            |

**Firebase Security Rules Impact:** (list any rule changes required)
**Auth State Dependencies:** (which steps require the user to be authenticated)

---

## 6. Step-by-Step Execution Checklist

> Each step must be:
>
> - Self-contained (no hidden dependencies on a future step)
> - Small enough to execute in one Builder turn
> - Specific enough that there is only one correct way to implement it

- [ ] **Step 1** — `path/to/file.ts` — Create the `ExampleStore` Pinia store with state: `items`, `isLoading`, `error`. No actions yet.
- [ ] **Step 2** — `path/to/file.ts` — Add `fetchItems()` action using the `/api/items` endpoint. Handle loading and error states.
- [ ] **Step 3** — ...

---

## 7. Rollback Plan

> What needs to be undone if this plan is abandoned mid-execution?

- Files to delete: ...
- DB migrations to revert: ...
- Feature flags to disable: ...

---

## 8. Validation Criteria

> How do we know this plan has been successfully executed?

- [ ] Unit test: `<describe what it tests>`
- [ ] Manual test: `<exact user flow to verify>`
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] No ESLint violations
- [ ] `<other project-specific criteria>`

```

### 2.5 Plan Versioning

If a plan is revised mid-execution:
- Increment version: `1.0 → 1.1`
- Add a `## Changelog` section at the bottom
- Do **not** delete completed steps; strike them out: `~~Step 1~~` ✅

---

## 3. BUILDER MODE

### 3.0 Session Start: Context Snapshot Protocol

**Trigger:** Activate this protocol automatically at the start of every Builder session where
context from a previous session may be missing — i.e., when the user says "continue", "resume",
"where were we", or when a plan is `IN PROGRESS` but no prior Builder output exists in the
current context window.

**Goal:** Reconstruct the exact execution state in under 5 seconds so the user doesn't have to
re-brief you.

**Steps (run silently before any code output):**

1. Read the active `plan/*.plan.md` file
2. Count completed (`✅`) vs pending (`⬜`) steps in the checklist
3. Identify the last completed step and the next pending step
4. Check if any open scope gaps exist (look for `⚠️ SCOPE GAP` markers in the plan or chat)
5. Read `plan/_debt.md` if it exists — note any debt items tagged to the active plan
6. Output the snapshot block below, then proceed immediately to the next step

**Snapshot Output Format:**
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CONTEXT SNAPSHOT — <plan-file>.plan.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan Version : 1.2
Status : IN PROGRESS
Progress : 5 / 12 steps complete

Last Done : ✅ Step 5 — <description>
Resuming At : ⚙️ Step 6 — <description>
Remaining : ⬜ Steps 6–12

Open Gaps : none | ⚠️ <description if any>
Debt Items : 2 logged (see plan/\_debt.md)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Resuming Step 6 now...

```

**Rules:**
- Never ask the user "where did we leave off?" — always derive this from the plan file
- If the plan file is missing or unreadable, output:
```

⛔ SNAPSHOT FAILED — Cannot locate active plan in plan/
Please confirm the plan file path to resume.

```
- Snapshot must fit in one output block. Do not paginate or split it.

---

### 3.1 Trigger Conditions

Activate only when:
- User invokes `/hybrid-plan execute <plan-file>` command.
- A `plan/*.plan.md` exists with **Status: APPROVED** or user explicitly approves.

### 3.2 Token Optimization — Strict Protocol

**Zero Filler Policy.** The following are banned in Builder mode:
- ❌ "Sure, I can help with that!"
- ❌ "Here is the updated code:"
- ❌ "Let me know if you need anything else."
- ❌ "Great question!"
- ❌ Explaining how code works unless explicitly asked
- ❌ Restating the plan step before implementing it

**Allowed preamble (maximum 1 line):**
```

[BUILDER MODE] — Step 4/12: Add fetchItems() action to ExampleStore

```
Then go straight to code.

### 3.3 Code Output Rules

1. **Full block replacements only.** Never output partial files with `// ... rest of code` unless the omitted section is completely unchanged boilerplate (e.g., import blocks in a file you're not touching at all).
2. **Adhere strictly to plan contracts.** Use interface names, type shapes, and field names exactly as defined in Section 4 of the plan. Deviation is a bug.
3. **One step per turn.** Do not bundle multiple checklist items into one response unless they are trivially coupled (e.g., creating a file and its barrel export).
4. **Mark completion.** After each turn, output a single-line status:
```

✅ Step 4 complete. Next: Step 5 — <brief description>.

```
5. **Scope creep guard.** If implementing a step reveals an undocumented dependency, **stop immediately** and output:
```

⚠️ SCOPE GAP DETECTED
Step N requires: <what's missing>
Not covered in plan: plan/<file>.plan.md
Recommended action: Return to ARCHITECT MODE for a mini-plan update before continuing.

```

### 3.4 Diff Discipline

Prefer targeted `str_replace`-style edits for small changes. Use full-file replacement only when:
- > 40% of the file changes
- The file is new
- Structural changes make a diff ambiguous

### 3.5 Step Completion Tracking

At the end of each Builder turn, output the updated checklist state (only the current + next 2 steps):

```

Progress: 4 / 12 steps complete
─────────────────────────────────
✅ Step 3 — Created ExampleStore skeleton
⚙️ Step 4 — [ACTIVE] Add fetchItems() action ← current
⬜ Step 5 — Wire store to ExampleList.vue

```

### 3.6 Debt Log Protocol

**Purpose:** During Builder execution, you will often notice things that *should* be fixed but
are outside the current plan's scope. Do not ignore them. Do not raise a full scope gap for them.
Log them to `plan/_debt.md` and move on — zero disruption to the current build.

**Debt vs Scope Gap — Know the Difference:**

| Situation | Classification | Action |
|---|---|---|
| Missing type that **blocks** current step | Scope Gap | ⚠️ Stop, notify, switch to ARCHITECT |
| Inconsistent naming in an unrelated file | Debt | Log to `_debt.md`, continue |
| A `TODO` comment left by a previous developer | Debt | Log to `_debt.md`, continue |
| Security issue in a file you're **not** touching | Debt | Log to `_debt.md`, continue |
| A pattern that contradicts the plan contract | Scope Gap | ⚠️ Stop, notify, switch to ARCHITECT |
| Dead code / unused import in adjacent file | Debt | Log to `_debt.md`, continue |

**When logging debt, output a single inline notice (1 line max):**
```

📝 Debt logged: <brief description> → plan/\_debt.md

````
Then continue with the current step. Do not expand on it unless asked.

**`_debt.md` Entry Format:**

Each entry appended to `plan/_debt.md`:
```markdown
## [DEBT-<N>] <Short Title>
**Logged:** YYYY-MM-DD
**Logged During:** <plan-file>.plan.md / Step <N>
**Severity:** Low | Medium | High
**Location:** `path/to/file.ts` (line ~N)
**Description:**
> What the issue is and why it matters.

**Suggested Fix:**
> One-paragraph description of the ideal resolution.

**Blocked By:** <plan name> IN PROGRESS | Ready to fix
---
````

**`_debt.md` File Header (create once if file doesn't exist):**

```markdown
# Technical Debt Log

> Auto-maintained by Builder Mode. Do not edit manually during active builds.
> Review and triage after each plan is marked COMPLETE.

| ID  | Title | Severity | File | Status |
| --- | ----- | -------- | ---- | ------ |
```

**Debt Triage (run after a plan reaches COMPLETE status):**
After archiving a plan, output a triage prompt:

```
🧹 DEBT TRIAGE — <N> items logged during <plan-name>
─────────────────────────────────────────────────────
[DEBT-1] Medium — <title> — Ready to fix
[DEBT-2] Low    — <title> — Ready to fix
[DEBT-3] High   — <title> — Ready to fix

Recommended: Address High severity items before starting next plan.
Run: "fix debt items" to begin, or "skip triage" to proceed.
```

---

## 4. MODE TRANSITION PROTOCOL

### Architect → Builder (Plan Approval Gate)

Before Builder mode is active, the plan must pass this gate. Check:

- [ ] All affected files are listed in Section 2
- [ ] All TypeScript interfaces are defined in Section 4
- [ ] All edge cases have a mitigation in Section 5
- [ ] All checklist steps are atomic and unambiguous
- [ ] Status is set to `APPROVED`

If any item is unchecked, do not enter Builder mode. Output:

```
⛔ Plan not ready for execution.
Missing: <list of gaps>
Update the plan to resolve these before proceeding.
```

### Builder → Architect (Scope Gap)

When a scope gap is detected mid-execution:

1. Output the `⚠️ SCOPE GAP DETECTED` block (see 3.3)
2. Do not write any code for the affected step
3. Wait for user confirmation to switch modes
4. On confirmation: switch to ARCHITECT, update the plan (bump version), then return to BUILDER

---

## 5. DIRECTORY CONVENTIONS

```
plan/
├── <feature>.plan.md       ← primary plan documents
├── <migration>.plan.md
├── _debt.md                ← auto-maintained debt log (never delete)
└── _archive/               ← completed plans (move here, don't delete)
    └── <feature>.plan.md
```

> ⚠️ Add `plan/` to your `.gitignore` to keep version control clean.
> Exception: if your team wants shared visibility into plans, commit selectively.

**Naming convention:** `kebab-case` matching the feature branch name where possible.
Example: `auth-email-verification.plan.md`

---

## 6. QUICK REFERENCE CARD

```
┌─────────────────────────────────────────────────────┐
│  ARCHITECT MODE           │  BUILDER MODE             │
│───────────────────────────│───────────────────────────│
│  ✅ Write plan/*.md      │  ✅ Context Snapshot first│
│  ✅ Define interfaces      │  ✅ Write application code│
│  ✅ Map edge cases         │  ✅ Follow plan contracts │
│  ❌ No app code            │  ✅ Log debt to _debt.md  │
│  ❌ No shortcuts           │  ❌ No theory/explanation │
│  ❌ No lazy steps          │  ❌ No filler phrases     │
│                            │  ❌ No partial code blocks│
└─────────────────────────────────────────────────────┘

Plan Status Flow:
DRAFT → APPROVED → IN PROGRESS → COMPLETE → (archive)
                                     ↓
                               Debt Triage
```

---

## 7. ANTI-PATTERNS TO AVOID

| Anti-Pattern                                                   | Why It's Bad                                    | Correct Behavior                                 |
| -------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| Writing app code during Architect mode                         | Skips validation, creates unreviewed code       | Plan only; no exceptions                         |
| "// TODO: implement later" in Builder output                   | Leaves the codebase broken                      | Implement fully or raise a scope gap             |
| 500+ line plan steps                                           | Builder turns become ambiguous and error-prone  | Break into sub-steps of ≤ 30 LOC change each     |
| Changing an interface name mid-build without updating the plan | Type drift, silent bugs                         | Bump plan version first, then code               |
| Mixing explanation and code in Builder mode                    | Wastes tokens, reduces signal density           | Code only + single status line                   |
| Skipping Section 5 (Edge Cases)                                | Security holes and runtime crashes slip through | Required; not optional                           |
| Asking "where did we leave off?" at session start              | Wastes user time, breaks flow                   | Run Context Snapshot silently from the plan file |
| Raising a scope gap for minor out-of-scope issues              | Blocks momentum unnecessarily                   | Log to `_debt.md`, continue building             |
| Ignoring `_debt.md` after plan completes                       | Debt accumulates, codebase degrades silently    | Run debt triage after every COMPLETE plan        |
| Deleting completed plans from `plan/`                         | Loses architectural history and rationale       | Move to `plan/_archive/`, never delete          |
