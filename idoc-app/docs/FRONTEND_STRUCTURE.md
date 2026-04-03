# I Doc App - Frontend Structure Blueprint

## 1) Web (React) Target Structure

```text
web/
  src/
    app/
      router/
      providers/
      store/
    modules/
      auth/
      admin/
      doctor/
      pharmacy/
      patient/
      booking/
      orders/
      payments/
      chat/
      notifications/
      profile/
    shared/
      components/
      hooks/
      utils/
      services/
      constants/
      theme/
    assets/
```

### Route strategy
- /auth/*
- /admin/*
- /doctor/*
- /pharmacy/*
- /patient/*

### Route guards
- AuthGuard
- RoleGuard (admin/doctor/pharmacy/general)
- ApprovalGuard (doctor/pharmacy)
- BlockedGuard

---

## 2) Mobile (Flutter) Target Structure

```text
mobile/
  lib/
    core/
      config/
      theme/
      network/
      storage/
      routing/
      widgets/
      errors/
    features/
      auth/
      admin/
      doctor/
      pharmacy/
      patient/
      bookings/
      orders/
      payments/
      chat/
      notifications/
      profile/
    l10n/
  test/
```

State management options:
- Riverpod (recommended) or Bloc

Navigation:
- go_router with guarded routes per role and auth state

---

## 3) Shared API Contract Strategy

Single API domain model per backend entity:
- User / Profile
- DoctorProfile
- PharmacyProfile
- Booking / Prescription
- Order / OrderItem
- Payment
- ChatRoom / Message
- Notification

Client-side rules:
- central HTTP client with JWT refresh
- typed DTO mapping layer
- optimistic UI only for safe operations

---

## 4) Real-time UX Rules

Chat:
- websocket connection per authenticated user
- room join only for authorized participants
- message read state sync

Video:
- request Agora token from backend per booking/session
- deny token fetch if payment/booking state invalid

---

## 5) Production Frontend Standards

- role-based feature flags at route/module level
- strict form validation
- paginated list rendering
- retry/error boundaries
- telemetry hooks for key actions (booking/payment/chat)
- accessibility + responsive layout
