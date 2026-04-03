# I Doc App — Complete Telemedicine Platform

A full-stack telemedicine application built with **React Native (Expo)** + **Django REST Framework**.  
Works on iOS, Android, and Web from a single codebase.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│          React Native (Expo)                │
│    iOS  •  Android  •  Web                  │
│                                             │
│  Auth │ Doctor │ Pharmacy │ Patient │ Admin  │
└──────────────────┬──────────────────────────┘
                   │ HTTP / WebSocket
┌──────────────────┴──────────────────────────┐
│          Django REST Framework               │
│    JWT Auth  •  DRF APIs  •  Channels        │
│                                             │
│  Accounts │ Bookings │ Orders │ Payments     │
│  Chat │ Notifications │ Admin               │
└──────────────────┬──────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
 PostgreSQL     Redis         Stripe
 (Database)   (Cache/WS)   (Payments)
```

---

## Quick Start

### 1. Backend (Django)

```bash
cd idoc-backend

# Option A: Docker (recommended)
docker-compose up -d
# Backend runs on http://localhost:8000
# Database is auto-migrated and seeded

# Option B: Manual
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env .env.local         # Edit settings as needed

# For SQLite (quick dev — no Postgres needed):
# Just run as-is, it defaults to SQLite

python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

### 2. Frontend (React Native)

```bash
cd idoc-app
npm install
npx expo start

# Then:
#   Press 'a' → Android emulator
#   Press 'i' → iOS simulator
#   Press 'w' → Web browser
#   Scan QR  → Expo Go on phone
```

### 3. Connect Frontend to Backend

Edit `idoc-app/src/services/api.js`:
```js
const BASE_URL = 'http://YOUR_IP:8000/api/v1';
// For Android emulator: http://10.0.2.2:8000/api/v1
// For iOS simulator:    http://localhost:8000/api/v1
// For physical device:  http://YOUR_COMPUTER_IP:8000/api/v1
```

Set `USE_MOCK = false` in `idoc-app/src/context/AuthContext.js`

---

## Demo Credentials

| Role     | Email              | Password    |
|----------|--------------------|-------------|
| Admin    | admin@idoc.com     | admin123    |
| Doctor   | sarah@idoc.com     | doctor123   |
| Pharmacy | medplus@idoc.com   | pharmacy123 |
| Patient  | john@idoc.com      | user123     |

---

## Features by Role

### Patient (General User)
- Browse & search doctors by specialty
- View doctor profiles, ratings, availability
- Book video/chat consultations
- Browse pharmacies & buy medicines
- Add to cart & place orders
- View bookings, orders, prescriptions
- Real-time chat with doctors
- Video call consultations
- Push notifications

### Doctor
- Dashboard with today's schedule & stats
- Manage appointments (confirm/start/complete)
- Patient list with history
- Write & send prescriptions (linked to pharmacy)
- Video/chat consultations
- Earnings tracking

### Pharmacy
- Dashboard with sales & order stats
- Order management workflow (new → preparing → ready → delivered)
- Inventory management with low-stock alerts
- Add/edit medicines
- Chat with customers

### Admin
- System-wide dashboard (users, revenue, bookings)
- User management (view/block/unblock)
- Doctor & pharmacy approval workflow
- Activity monitoring

---

## API Endpoints

### Auth
```
POST   /api/v1/auth/register/
POST   /api/v1/auth/login/
POST   /api/v1/auth/logout/
GET    /api/v1/auth/profile/
PUT    /api/v1/auth/profile/
POST   /api/v1/auth/change-password/
POST   /api/v1/auth/forgot-password/
POST   /api/v1/auth/token/refresh/
```

### Doctors
```
GET    /api/v1/doctors/                  ?specialty=&available=true&search=
GET    /api/v1/doctors/{id}/
GET    /api/v1/doctors/{id}/slots/       ?date=2026-04-03
GET    /api/v1/doctors/dashboard/
```

### Bookings
```
GET    /api/v1/bookings/                 ?status=pending
POST   /api/v1/bookings/create/
GET    /api/v1/bookings/{id}/
POST   /api/v1/bookings/{id}/cancel/
POST   /api/v1/bookings/{id}/confirm/
GET    /api/v1/bookings/prescriptions/
POST   /api/v1/bookings/prescriptions/create/
```

### Pharmacies & Medicines
```
GET    /api/v1/pharmacies/
GET    /api/v1/pharmacies/{id}/
GET    /api/v1/pharmacies/medicines/     ?pharmacy=&category=&search=
POST   /api/v1/pharmacies/medicines/create/
PUT    /api/v1/pharmacies/medicines/{id}/
GET    /api/v1/pharmacies/dashboard/
```

### Orders
```
GET    /api/v1/orders/                   ?status=pending
POST   /api/v1/orders/create/
GET    /api/v1/orders/{id}/
POST   /api/v1/orders/{id}/cancel/
POST   /api/v1/orders/{id}/status/
```

### Payments
```
POST   /api/v1/payments/create-intent/
POST   /api/v1/payments/confirm/
GET    /api/v1/payments/history/
POST   /api/v1/payments/{id}/refund/
POST   /api/v1/payments/webhook/
```

### Chat
```
GET    /api/v1/chat/rooms/
POST   /api/v1/chat/rooms/create/
GET    /api/v1/chat/rooms/{id}/messages/
POST   /api/v1/chat/rooms/{id}/send/
WebSocket: ws://localhost:8000/ws/chat/{room_id}/
```

### Notifications
```
GET    /api/v1/notifications/
POST   /api/v1/notifications/{id}/read/
POST   /api/v1/notifications/read-all/
GET    /api/v1/notifications/unread-count/
WebSocket: ws://localhost:8000/ws/notifications/{user_id}/
```

### Admin
```
GET    /api/v1/admin/dashboard/
GET    /api/v1/admin/users/              ?role=&blocked=true&search=
GET    /api/v1/admin/users/{id}/
POST   /api/v1/admin/users/{id}/block/
POST   /api/v1/admin/users/{id}/unblock/
GET    /api/v1/admin/pending-approvals/
POST   /api/v1/admin/doctors/{id}/approve/
POST   /api/v1/admin/pharmacies/{id}/approve/
POST   /api/v1/admin/users/{id}/reject/
```

---

## Publishing

### Android (Google Play Store)

```bash
cd idoc-app

# 1. Install EAS CLI
npm install -g eas-cli
eas login

# 2. Build production APK/AAB
eas build --platform android --profile production

# 3. Submit to Play Store
eas submit --platform android
```

**Requirements:**
- Google Play Developer account ($25 one-time)
- App signing key (EAS manages this)
- Privacy policy URL
- App screenshots

### iOS (Apple App Store)

```bash
# 1. Build for iOS
eas build --platform ios --profile production

# 2. Submit to App Store
eas submit --platform ios
```

**Requirements:**
- Apple Developer account ($99/year)
- App Store Connect setup
- Privacy policy URL
- App screenshots

### Backend Deployment

**Recommended: Railway / Render / DigitalOcean**

```bash
# Railway (easiest)
npm install -g @railway/cli
railway login
cd idoc-backend
railway init
railway up

# Set environment variables in Railway dashboard
```

---

## Third-Party Setup

### Stripe (Payments)
1. Create account at stripe.com
2. Get API keys from Dashboard → Developers
3. Add to `.env`: `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`
4. Set up webhook for `/api/v1/payments/webhook/`

### Agora (Video Calls)
1. Create account at agora.io
2. Create a project, get App ID and Certificate
3. Add to `.env`: `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE`
4. Install `react-native-agora` in the frontend

### Firebase (Push Notifications)
1. Create project at console.firebase.google.com
2. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
3. Download service account key for backend
4. Add to `.env`: `FIREBASE_CREDENTIALS_PATH`

---

## Project Structure

```
idoc-app/                          # React Native Frontend
├── App.js                         # Entry point
├── app.json                       # Expo config
├── eas.json                       # Build/submit config
├── package.json
└── src/
    ├── components/UIComponents.js # Reusable UI components
    ├── context/AuthContext.js     # Auth state management
    ├── navigation/AppNavigator.js # Role-based navigation
    ├── services/
    │   ├── api.js                 # REST API client
    │   └── socket.js              # WebSocket client
    ├── utils/
    │   ├── theme.js               # Colors, fonts, spacing
    │   └── toastConfig.js         # Toast notifications
    └── screens/
        ├── auth/                  # Login, Register, ForgotPassword
        ├── general/               # Patient screens (7 screens)
        ├── doctor/                # Doctor screens (4 screens)
        ├── pharmacy/              # Pharmacy screens (3 screens)
        ├── admin/                 # Admin screens (3 screens)
        └── shared/                # Chat, Video, Profile, Notifications

idoc-backend/                      # Django Backend
├── config/                        # Settings, URLs, ASGI/WSGI
├── apps/
│   ├── accounts/                  # User model, auth, roles
│   ├── doctors/                   # Doctor listing, slots
│   ├── bookings/                  # Appointments, prescriptions
│   ├── pharmacies/                # Medicines, inventory
│   ├── orders/                    # Medicine orders
│   ├── payments/                  # Stripe integration
│   ├── chat/                      # Real-time messaging
│   ├── notifications/             # Push & in-app notifications
│   └── administration/            # Admin controls
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```
