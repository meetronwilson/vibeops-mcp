# Product OS Workflow Guide

Complete workflow examples for using Product OS MCP with Claude Code.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Ideation → Contracts](#ideation--contracts)
3. [Reviewing Contracts](#reviewing-contracts)
4. [Development Workflow](#development-workflow)
5. [Tracking Progress](#tracking-progress)
6. [Team Collaboration](#team-collaboration)
7. [Advanced Queries](#advanced-queries)

---

## Getting Started

### First Conversation

```
You: Test the product-os health check

Claude: ✓ Server healthy
- Modules: 0
- Features: 0
- Issues: 0

You: Let's start planning a new feature
```

---

## Ideation → Contracts

### From ChatGPT Brainstorming

**Step 1: Brainstorm with ChatGPT**

Use ChatGPT to explore ideas, then paste the output into Claude Code:

```
You: I brainstormed with ChatGPT about a CRM pipeline feature. Here's what we came up with:

Module: Sales Pipeline
A visual pipeline for tracking deals through stages from lead to close.

Feature: Drag and Drop Board
Users need a kanban-style board to move deals through pipeline stages.

PRD:
Problem: Sales reps waste time manually updating deal stages in forms.
Goals:
- Reduce time to update deal stages by 80%
- Improve pipeline visibility for managers
- Enable quick bulk updates

Scope:
In Scope:
- Drag and drop cards between columns
- Real-time updates for all users
- Stage transition history

Out of Scope:
- Email integration
- Automated stage transitions

User Story: Drag Deal Card
As a sales rep
I want to drag a deal card to a new column
So that I can quickly update the deal stage

Acceptance Criteria:
- Card moves smoothly with drag gesture
- Drop zones highlight on hover
- Stage updates in database immediately
- Other users see the update within 2 seconds

User Story: Bulk Stage Update
As a sales manager
I want to select multiple deals and move them together
So that I can quickly clean up stale deals

Acceptance Criteria:
- Can select multiple cards with checkboxes
- Selected cards move together
- Confirmation dialog before bulk update

Claude: I found and can create:
- 1 Module: Sales Pipeline (MOD-0001)
- 1 Feature: Drag and Drop Board (FEAT-0001)
  - Problem statement about manual updates
  - 3 goals including time reduction
  - Scope with 3 in-scope, 2 out-of-scope items
- 2 User Stories:
  - STORY-0001: Drag Deal Card (4 AC)
  - STORY-0002: Bulk Stage Update (3 AC)

Should I create these contracts?

You: Yes, create them

Claude: ✓ Created:
- MOD-0001: Sales Pipeline
- FEAT-0001: Drag and Drop Board (linked to MOD-0001)
- STORY-0001: Drag Deal Card (linked to FEAT-0001)
- STORY-0002: Bulk Stage Update (linked to FEAT-0001)

All contracts saved and ready for development.
```

### From Natural Conversation

You can also create contracts through natural conversation:

```
You: Create a module for user authentication

Claude: ✓ Created MOD-0002: User Authentication

You: Add a login feature to that module with email and password

Claude: ✓ Created FEAT-0002: Email Login
Linked to MOD-0002: User Authentication

You: Create a story for the login form

Claude: ✓ Created STORY-0003: Login Form UI
Linked to FEAT-0002: Email Login

Default acceptance criteria added. You can update these later.
```

---

## Reviewing Contracts

### View All Contracts

```
You: Show me all modules

Claude: Found 2 modules:

MOD-0001: Sales Pipeline (initiative)
Status: planning
Features: 1

MOD-0002: User Authentication (theme)
Status: active
Features: 1
```

### View Specific Contract

```
You: Show me STORY-0001

Claude: STORY-0001: Drag Deal Card
Feature: FEAT-0001
Status: backlog
Priority: medium

Description:
As a sales rep, I want to drag a deal card to a new column
so that I can quickly update the deal stage

Acceptance Criteria:
[ ] Card moves smoothly with drag gesture
[ ] Drop zones highlight on hover
[ ] Stage updates in database immediately
[ ] Other users see the update within 2 seconds

Definition of Done:
[ ] Code reviewed
[ ] Tests passing
[ ] Documentation updated
```

### Search Contracts

```
You: Find anything related to "drag"

Claude: Found 2 matches:

FEAT-0001: Drag and Drop Board
STORY-0001: Drag Deal Card
```

### List by Filters

```
You: List all features in the sales pipeline module

You: Show me all backlog stories

You: List bugs with high severity
```

---

## Development Workflow

### Starting Work on a Story

```
You: I'm starting work on STORY-0001

Claude: STORY-0001: Drag Deal Card

Let me mark this as in-progress and show the requirements:

✓ Updated status to in-progress

Acceptance Criteria:
[ ] Card moves smoothly with drag gesture
[ ] Drop zones highlight on hover
[ ] Stage updates in database immediately
[ ] Other users see the update within 2 seconds

Definition of Done:
[ ] Code reviewed
[ ] Tests passing
[ ] Documentation updated

Ready to start coding?

You: Yes, create the DealCard component

Claude: [Creates src/components/Pipeline/DealCard.tsx]

Let me link this file to STORY-0001...
✓ Added DealCard.tsx to implementation.files

You: Also create the Board component

Claude: [Creates src/components/Pipeline/Board.tsx]

✓ Added Board.tsx to implementation.files

Both components are now tracked under STORY-0001.
```

### Checking Off Acceptance Criteria

```
You: The drag gesture is working smoothly now. Check off the first AC.

Claude: ✓ Marked AC #0 as verified:
"Card moves smoothly with drag gesture"

3 acceptance criteria remaining.
```

### Adding Definition of Done Items

```
You: Add a DoD item for "Performance tested with 100+ cards"

Claude: ✓ Added to Definition of Done for STORY-0001:
[ ] Performance tested with 100+ cards
```

### Completing Work

```
You: All ACs are verified and DoD is complete. Mark it done.

Claude: ✓ Updated STORY-0001 to status: done

Summary:
- All 4 acceptance criteria verified
- All 4 definition of done items complete
- Implementation: 2 files, 3 commits, 1 PR

Great work! STORY-0001 is complete.
```

---

## Tracking Progress

### Linking Code to Contracts

**Add files:**
```
You: I created Login.tsx and auth.ts for STORY-0003

Claude: ✓ Added to STORY-0003:
- src/components/Login.tsx
- src/api/auth.ts
```

**Add commits:**
```
You: I just committed the login form. Commit hash: abc123

Claude: ✓ Added commit abc123 to STORY-0003
```

**Add pull requests:**
```
You: Created PR #42 for this story

Claude: ✓ Added PR #42 to STORY-0003
```

### Updating Status

```
You: Move STORY-0004 to in-review

Claude: ✓ Updated STORY-0004 status: backlog → in-review
```

### Assigning Work

```
You: Assign STORY-0005 to Sarah

Claude: ✓ Assigned STORY-0005 to Sarah
```

---

## Team Collaboration

### See What's Assigned to You

```
You: What's assigned to me?

Claude: Found 3 items assigned to you:

STORY-0001: Drag Deal Card (in-progress)
STORY-0003: Login Form UI (backlog)
BUG-0001: Cards flickering on drag (open)
```

### Check Team Progress

```
You: What's in progress?

Claude: 4 items currently in progress:

STORY-0001: Drag Deal Card (assigned to you)
STORY-0006: Email validation (assigned to Sarah)
BUG-0002: Memory leak (assigned to Mike)
DEBT-0001: Refactor auth module (assigned to Sarah)
```

### Find Blockers

```
You: Are there any blockers?

Claude: Found 2 blocked items:

STORY-0007: OAuth integration
Assigned to: Mike
Feature: FEAT-0002

BUG-0003: Login fails on Safari
Assigned to: Sarah
Feature: FEAT-0002
```

### Review Queue

```
You: What needs review?

Claude: 3 items need review:

STORY-0008: Password reset flow (needs-verification)
BUG-0004: Button alignment (in-review)
STORY-0009: Remember me checkbox (in-review)
```

---

## Advanced Queries

### High Priority Items

```
You: Show me all high priority work

Claude: Found 5 high/critical priority items:

Critical:
- BUG-0001: Cards flickering on drag
- DEBT-0002: Database query optimization

High:
- STORY-0010: Payment processing
- STORY-0011: Email notifications
- BUG-0005: Data corruption on concurrent updates
```

### Ready to Start

```
You: What stories are ready to start?

Claude: 3 stories with status "ready":

STORY-0012: Export to CSV
Feature: FEAT-0003
Priority: medium

STORY-0013: Dark mode toggle
Feature: FEAT-0004
Priority: low

STORY-0014: Search filters
Feature: FEAT-0003
Priority: high
```

### Project Statistics

```
You: Give me project stats

Claude: Contract Statistics:

Modules: 3 total
- Planning: 1
- Active: 2

Features: 7 total
- Draft: 1
- Ready: 2
- In Progress: 3
- Completed: 1

Issues: 24 total

User Stories: 15
- Backlog: 5
- Ready: 3
- In Progress: 4
- Done: 3

Bugs: 6
- Open: 2
- In Progress: 2
- Verified: 2

Tech Debt: 2
- Identified: 1
- In Progress: 1

Spikes: 1
- Completed: 1
```

---

## Tips & Best Practices

### 1. Start with Modules

Always create the module first, then features, then issues. This maintains proper hierarchy.

```
Create module → Create features → Create issues
```

### 2. Use Dry-Run Preview

When importing large amounts of text, preview first:

```
You: Here's my ChatGPT output. Show me what you'll create first.
[paste text]

Claude: [Shows parsed structure]

You: Looks good, create them all
```

### 3. Keep Contracts Updated

Update status and check off items as you work. This keeps the project view accurate.

### 4. Link Code Early

Add implementation files as you create them, not at the end. This helps track progress.

### 5. Use Natural Language

You don't need to memorize commands. Just ask naturally:

```
"What's assigned to me?"
"Show me the authentication module"
"Mark the first two ACs as done"
"Add these files to STORY-0001"
```

### 6. Archive Instead of Delete

Use archive for historical tracking:

```
You: Archive the old prototype feature

Claude: ✓ Archived FEAT-0005 (status → cancelled)
```

---

## Common Workflows

### Weekly Planning

```
1. Review ready stories: "What stories are ready to start?"
2. Check priorities: "Show me high priority items"
3. Assign work: "Assign STORY-0020 to Mike"
4. Check blockers: "Any blockers?"
```

### Daily Standup

```
1. Your work: "What's assigned to me?"
2. Yesterday: "Show me STORY-0015" (what you worked on)
3. Today: Update status, check off progress
4. Blockers: "Mark STORY-0016 as blocked"
```

### Sprint Review

```
1. Completed work: Filter by status "done" in time range
2. Check implementation: Review files/commits/PRs
3. Demo: Show the contracts with their AC checked off
```

### Bug Triage

```
1. List bugs: "List all open bugs"
2. Review severity: "Show me critical bugs"
3. Assign: "Assign BUG-0010 to Sarah"
4. Prioritize: "Update BUG-0011 priority to high"
```

---

## Next Steps

- See [README.md](./README.md) for complete feature list
- Check [INSTALLATION.md](./INSTALLATION.md) for setup
- Review [../PLAN.md](../PLAN.md) for architecture details

---

## Getting Help

If you encounter issues or have questions:

- **Issues**: https://github.com/vibeops/product-os/issues
- **Documentation**: https://github.com/vibeops/product-os#readme
