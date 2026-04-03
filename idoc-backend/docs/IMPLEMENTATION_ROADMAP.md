# I Doc App - Step-by-Step Implementation Roadmap

## Execution Principle
Build in vertical slices while preserving current functionality.
Each step must pass:
- backend tests
- API smoke checks
- web login + role route checks

---

## Phase 1 - Auth & RBAC Hardening

### Goals
- Normalize role/approval checks globally
- Prevent blocked/non-approved accounts from protected workflows

### Tasks
- Add global permission mixin for blocked/approval gates
- Apply object-level ownership checks in booking/order/chat/payment views
- Add auth rate limiting for login/register endpoints

Deliverables:
- secure auth paths
- updated DRF permissions map

---

## Phase 2 - Payment Correctness (Stripe)

### Goals
- Webhook-driven source-of-truth payment finalization
- Idempotent status transitions

### Tasks
- Add webhook signature validation and replay protection
- Add `processing` status and transition guards
- Gate booking confirmation/order fulfillment on completed payment

Deliverables:
- deterministic payment lifecycle
- reliable booking/order unlock logic

---

## Phase 3 - Consultation Domain Completion

### Goals
- Full booking/session workflow
- Prescription integrity with doctor ownership

### Tasks
- Enforce doctor slot locking + cancellation rules
- Add consultation history API
- Add prescription CRUD policy with role constraints

Deliverables:
- complete consultation module

---

## Phase 4 - Pharmacy Commerce Completion

### Goals
- Production-ready medicine order lifecycle

### Tasks
- inventory decrement/reserve logic
- order transition guards and event notifications
- prescription-required medicine checks

Deliverables:
- robust medicine commerce flow

---

## Phase 5 - Realtime (Chat + Video)

### Goals
- Secure realtime authorization and scalability

### Tasks
- websocket auth + room ACL checks
- enforce participant-only room access
- Agora token issuance tied to authorized bookings

Deliverables:
- secure chat/video in multi-instance deployment

---

## Phase 6 - Admin Operations

### Goals
- Full control panel behavior per requirements

### Tasks
- approvals queue and moderation actions
- dispute lifecycle management
- transaction monitoring endpoints

Deliverables:
- complete admin control center APIs

---

## Phase 7 - Frontend Role UX (Web + Flutter)

### Goals
- Role-specific interfaces with common API contract

### Tasks
- React dashboards parity checks (admin/doctor/pharmacy/general)
- Flutter module scaffolding aligned to same endpoints
- robust error/loading states and pagination

Deliverables:
- role-consistent frontend behavior

---

## Phase 8 - Production Readiness

### Goals
- Operability, reliability, compliance posture

### Tasks
- audit logging
- structured logging + monitoring hooks
- CI/CD quality gates and migration checks

Deliverables:
- deploy-ready platform

---

## Immediate Next Coding Step

Start with Phase 1 in current backend:
1. introduce unified account-state permission utilities
2. apply them to booking/order/payment/chat endpoints
3. add tests for blocked/non-approved access paths
