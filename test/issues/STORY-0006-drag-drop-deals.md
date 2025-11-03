# Drag and drop deals between pipeline stages

**ID:** STORY-0006 | **Feature:** FEAT-0005 | **Status:** in-progress
**Points:** 8 | **Priority:** critical | **Assignee:** chris.anderson

## Story
As a sales representative, I want to drag and drop deal cards between pipeline stages, so that I can quickly update deal progress without opening detail views.

## Acceptance Criteria (0/4 verified)
1. ⬜ Given I am viewing the pipeline board, when I drag a deal card from one stage to another, then the card moves smoothly with visual feedback
2. ⬜ Given I drop a deal card in a new stage, when the drop completes, then the deal's stage is updated in the database immediately
3. ⬜ Given a deal changes stage, when the update completes, then the deal probability is automatically updated based on the new stage
4. ⬜ Given I am dragging a deal, when I hover over an invalid drop zone, then visual feedback indicates the drop is not allowed

## Definition of Done (0/7 complete)
1. ⬜ Drag and drop functionality implemented with touch support
2. ⬜ Optimistic UI updates with rollback on failure
3. ⬜ Stage change API endpoint implemented
4. ⬜ Automatic probability updates working
5. ⬜ Activity log entry created for stage changes
6. ⬜ Unit and integration tests passing
7. ⬜ Accessibility testing completed (keyboard navigation)

## Definition of Ready (4/4 ready)
1. ✅ User story clearly defined
2. ✅ Drag-and-drop library selected (react-beautiful-dnd)
3. ✅ Design and animations approved
4. ✅ Story estimated

---
_Created: 2025-02-28T09:30:00Z | Updated: 2025-03-02T11:15:00Z_
_Tags: deals, pipeline, drag-drop, ux_
