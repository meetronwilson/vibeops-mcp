# VibeOps Roadmap

This document captures future enhancements and architectural considerations for the VibeOps framework.

## Strategic Concepts

### 1. Critical Path Analysis

**Status:** Foundation in place (feature dependencies added in v2.1.0)

**Current State:**
- Feature schema includes `featureDependencies` field
- Supports three dependency types:
  - `blocks`: Hard blocker - Feature B can't start until Feature A is done
  - `requires`: Soft dependency - Feature B needs Feature A's functionality
  - `related`: Informational - features are connected but not blocking

**Future Enhancements:**
- [ ] Automatic critical path calculation
- [ ] Visual dependency graph generation
- [ ] Timeline estimation based on dependency chains
- [ ] AI-driven work prioritization (Claude suggests what to work on next)
- [ ] Circular dependency detection
- [ ] Parallel work identification (what can be done simultaneously)

**Use Cases:**
- Help Claude understand what needs to be built first
- Avoid starting work on blocked features
- Calculate realistic project timelines
- Identify bottleneck features that block the most work

**Example:**
```
Goal: Build User Dashboard (FEAT-0003)
Critical Path:
  FEAT-0001: Authentication (blocks everything)
    └─> FEAT-0002: User Profile (required for dashboard)
        └─> FEAT-0003: User Dashboard ✓ Can start

Estimated minimum duration: Sum of critical path items
```

---

### 2. Cloud-Hosted MCP with API Key

**Status:** Conceptual - not yet implemented

**Problem Being Solved:**
- npm version management issues (current pain point)
- Version display inconsistencies in Claude Code
- Need to manually rebuild, republish, reinstall
- No cross-machine persistence of data
- No team collaboration on contracts

**Architecture Vision:**

**Current (Local):**
```json
"vibeops": {
  "command": "node",
  "args": ["path/to/local/build/index.js"]
}
```

**Future (Cloud):**
```json
"vibeops": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-remote"],
  "env": {
    "VIBEOPS_API_URL": "https://api.vibeops.io",
    "VIBEOPS_API_KEY": "your-secret-key"
  }
}
```

**Implementation Approach:**
1. Wrap current TypeScript MCP server in HTTP API layer
2. Use Express/Fastify for API endpoints
3. Add authentication middleware (API key validation)
4. Each MCP tool becomes an API endpoint
5. Replace file-based storage with database (PostgreSQL/MongoDB)
6. Use MCP remote server adapter for Claude Code integration

**Benefits:**
- ✅ Instant updates - everyone gets latest version immediately
- ✅ No npm version management
- ✅ Centralized contract repository
- ✅ Multi-user collaboration on same contracts
- ✅ Built-in backup/versioning
- ✅ Analytics and usage tracking
- ✅ Team permissions and access control
- ✅ Cross-machine persistence

**Challenges:**
- ⚠️ Network dependency (offline = broken)
- ⚠️ API infrastructure costs
- ⚠️ Security concerns (contracts contain sensitive product info)
- ⚠️ Latency on every tool call
- ⚠️ More complex auth/authorization
- ⚠️ Migration path from local to cloud

**Hybrid Approach (Recommended):**
Support both modes:
- **Local Mode** (current): Offline-first, solo development, full speed
- **Cloud Mode** (future): Team collaboration, shared contracts, always in sync
- Same contract schemas work in both modes
- User chooses mode in config

**Best Candidates for Cloud Storage:**
- Memory system (session_memory tool) - cross-machine persistence
- Shared contract repositories for teams
- Analytics and insights across projects

**Decision Framework:**

Choose **Local** if:
- Solo developer
- Want offline capability
- Security/privacy concerns about cloud storage
- Low-latency critical

Choose **Cloud** if:
- Team collaboration needed
- Want to avoid npm version issues
- Need cross-machine sync
- Building SaaS product around framework

Choose **Hybrid** if:
- Want flexibility
- Different use cases (solo + team)
- Migration path from local to cloud

---

## Near-Term Enhancements (v2.3+)

### Memory System Improvements
- [ ] Cloud storage option for memories
- [ ] Memory search with full-text indexing
- [ ] Automatic memory creation on Claude Code exit
- [ ] Memory diff/comparison tools

### Contract Schema Enhancements
- [ ] Spike schema: Add findings/outcomes fields
- [ ] All schemas: Add time tracking (estimated vs actual)
- [ ] Feature schema: Add priority/urgency scoring
- [ ] Module schema: Add OKRs (Objectives & Key Results)

### Developer Experience
- [ ] Web UI for browsing contracts
- [ ] VS Code extension for contract validation
- [ ] CLI tool for contract operations outside Claude Code
- [ ] Contract template generator (interactive)

### AI-Driven Development
- [ ] Automatic test generation from acceptance criteria
- [ ] Bug prediction based on code complexity
- [ ] Tech debt scoring algorithm
- [ ] Automated Definition of Done validation

---

## Long-Term Vision (v3.0+)

### Platform Evolution
- [ ] VibeOps Cloud (SaaS offering)
- [ ] Multi-tenant contract repositories
- [ ] Team collaboration features
- [ ] Real-time contract sync
- [ ] Analytics dashboard

### Integrations
- [ ] GitHub Issues/Projects sync
- [ ] Jira/Linear bidirectional sync
- [ ] Slack/Discord notifications
- [ ] CI/CD pipeline integration

### Advanced Features
- [ ] Machine learning for estimation accuracy
- [ ] Velocity tracking across sprints
- [ ] Burndown/burnup chart generation
- [ ] Risk analysis and prediction

---

## Decision Log

### 2025-11-05: Memory System Implementation
**Decision:** Implemented as local file storage (v2.2.0)
**Rationale:** Fastest path to value, avoids cloud complexity
**Future:** Strong candidate for cloud storage in hybrid model

### 2025-11-05: Feature Dependencies
**Decision:** Added to feature schema (v2.1.0)
**Rationale:** Enables critical path analysis, AI-driven prioritization
**Future:** Build visualization and automatic path calculation

### 2025-11-05: Testing Schema for User Stories
**Decision:** Added comprehensive testing field (v2.1.0)
**Rationale:** AI-driven dev needs explicit testing requirements
**Impact:** Made Definition of Ready optional (less bottleneck)

---

## Contributing

When adding ideas to this roadmap:
1. Clearly state the problem being solved
2. Provide specific use cases
3. Consider implementation complexity
4. Note any dependencies or blockers
5. Add decision rationale when prioritizing

---

## Questions to Explore

1. Should we build a separate CLI tool for contract operations?
2. What's the right database for cloud contracts? (Postgres, Mongo, Supabase?)
3. How to handle contract migrations when schemas evolve?
4. What analytics would be most valuable to users?
5. Should memory storage be opt-in or automatic?
6. How to version control contracts effectively?
7. What's the authentication story for cloud MCP?

---

**Last Updated:** 2025-11-05
**Current Version:** v2.2.1
**Next Planned Release:** TBD
