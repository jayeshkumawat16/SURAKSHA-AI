# SURAKSHA-AI — Cross-Platform Disaster Safety Mobile Application

SURAKSHA AI is a mission-critical, cross-platform mobile application for Android and iOS built for disaster preparedness, authoritative alert comprehension, situation-aware emergency guidance, offline safety rules, emergency SOS preparation, local trusted contact management, and lifeline relief resource navigation.

It is engineered with a **local-first command-centre architecture** that ensures full operational utility even when Gemini AI, cell towers, or the internet are unavailable.

---

## Architecture Overview

```
suraksha-ai/
├── mobile/                      # Cross-Platform React Native (Expo SDK 52)
│   ├── app/                     # Expo Router file-based screens
│   │   ├── _layout.tsx          # Bottom tab navigation & route layout
│   │   ├── index.tsx            # Home command dashboard
│   │   ├── alerts.tsx           # Authoritative alerts feed with provenance markers
│   │   ├── assistant.tsx        # Situation-aware AI & offline safety assistant
│   │   ├── lifeline-map.tsx     # Relief shelters, hospitals & supply directory
│   │   ├── sos.tsx              # Offline SOS composer & trusted contacts manager
│   │   ├── guides.tsx           # Reviewed national disaster safety protocols
│   │   ├── preparedness.tsx     # Persisted grab-bag readiness checklist
│   │   ├── settings.tsx         # Data privacy, languages & manual offline toggle
│   │   └── gemini-settings.tsx  # Integrated Gemini AI controls & server proxy test
│   ├── src/
│   │   ├── components/          # Reusable design system (Button, Card, Badge, etc.)
│   │   ├── constants/           # Navy, cyan, red theme & accessible touch targets
│   │   ├── data/                # Emergency guides & verified demo resources
│   │   ├── services/            # API proxy, location, SOS, connectivity, alerts
│   │   ├── storage/             # expo-sqlite local DB & repositories
│   │   └── types/               # Strict TypeScript definitions
│   ├── tests/                   # Jest unit test suite for mobile logic
│   ├── app.json                 # Expo native configuration & permissions
│   ├── package.json
│   └── tsconfig.json
├── backend/                     # Python FastAPI & Gemini Server Proxy
│   ├── app/
│   │   ├── main.py              # FastAPI endpoints, CORS & exception handling
│   │   ├── config.py            # Pydantic settings & safe key detection
│   │   ├── schemas.py           # Typed request/response contracts
│   │   ├── safety_rules.py      # Deterministic reviewed disaster safety rules
│   │   ├── ai_service.py        # Official Google GenAI SDK proxy & fallback
│   │   ├── alerts.py            # Authoritative alert adapter & demo feed
│   │   └── resources.py         # Relief shelter and emergency directory
│   ├── tests/                   # Pytest test suite for backend API & AI service
│   ├── requirements.txt         # FastAPI, Google GenAI SDK, Pydantic, Pytest
│   ├── .env.example             # Template for server-side secrets
│   └── pytest.ini
├── start-backend.sh             # One-step backend startup script
├── .gitignore                   # Rigorous exclusion of secrets and build files
└── README.md                    # System documentation and run guide
```

---

## Security & Gemini Secret Handling

- **Zero Client-Side Secret Leakage**: The mobile application bundle, `app.json`, `AsyncStorage`, and `expo-sqlite` **NEVER** contain the Gemini API key.
- **Server-Side Proxy**: All Gemini calls run through the Python FastAPI backend (`POST /api/assistant/analyze`).
- **Safe Public Config**: The `GET /api/config/public` endpoint only shares safe metadata: whether Gemini is configured (`boolean`) and the model display name.
- **Protected Health & Connection Testing**: `POST /api/gemini/test` tests upstream Gemini connectivity with rate-limiting and never reveals the secret key in requests, logs, or responses.
- **Graceful Deterministic Fallback**: If Gemini is unconfigured, unreachable, or times out, the app seamlessly provides reviewed offline disaster safety guidance.

---

## Prerequisites

- **macOS** (Tested on Apple Silicon / macOS Monterey or later)
- **Node.js**: v18 LTS or later (Current environment: v24.21.0)
- **npm**: v10 or later
- **Python**: 3.9+ (Current environment: Python 3.9.6)
- **Git**
- Optional:
  - **Xcode** & iOS Simulator (for macOS local iOS simulation)
  - **Android Studio** & Android Emulator (for Android emulation)
  - **Expo Go** app on physical iPhone / Android device

---

## 1. Backend Setup & Startup

### Step 1.1: Navigate and Configure `.env`

```bash
cd /Users/jayeshhh16/Downloads/suraksha-ai/backend
cp .env.example .env
```

Open `backend/.env` in your editor:
```env
# Server-side Gemini API key (Leave placeholder if running offline-only)
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
APP_ENV=development
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=*
RATE_LIMIT_TEST_SECONDS=5
```

> **Note**: SURAKSHA AI runs completely and safely even **without** a Gemini API key. If no key is set, the deterministic safety engine operates automatically.

### Step 1.2: Start the Backend

You can run the startup script from the project root:

```bash
cd /Users/jayeshhh16/Downloads/suraksha-ai
./start-backend.sh
```

Or manually:
```bash
cd /Users/jayeshhh16/Downloads/suraksha-ai/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The server starts at `http://0.0.0.0:8000`. Test it:
```bash
curl http://127.0.0.1:8000/api/health
```

---

## 2. Mobile Client Setup & Launch

### Step 2.1: Configure Mobile API Base URL

```bash
cd /Users/jayeshhh16/Downloads/suraksha-ai/mobile
cp .env.example .env
```

Edit `mobile/.env` depending on your testing target:

- **Testing on iOS Simulator (Mac)**:
  ```env
  EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
  ```
- **Testing on Android Emulator**:
  ```env
  EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000
  ```
- **Testing on Physical iPhone or Android via Expo Go**:
  Find your Mac's local network IP (`ipconfig getifaddr en0`):
  ```env
  EXPO_PUBLIC_API_BASE_URL=http://192.168.1.XX:8000
  ```

> `EXPO_PUBLIC_API_BASE_URL` is a public configuration address, not a secret. It can also be modified in-app under **Settings → Backend Endpoint**.

### Step 2.2: Run the Mobile App

```bash
cd /Users/jayeshhh16/Downloads/suraksha-ai/mobile
npm run start
```

Press:
- `i` to launch on the iOS Simulator.
- `a` to launch on an open Android Emulator.
- Scan the QR code using the **Expo Go** app on your physical iPhone or Android device (ensure both devices are on the same Wi-Fi network).

---

## 3. Running Test Suites

### Backend Tests (pytest)
Runs 22 comprehensive unit and integration tests:
```bash
cd /Users/jayeshhh16/Downloads/suraksha-ai/backend
PYTHONPATH=. venv/bin/pytest tests/
```
**Test coverage:**
- `test_health_endpoint`: operational readiness.
- `test_public_config_never_exposes_key`: strict verification that credentials are never disclosed.
- `test_gemini_test_endpoint_unconfigured`: safe handling of missing keys without crashing.
- `test_assistant_analyze_offline_mode`: deterministic safety rule evaluation.
- `test_assistant_analyze_auto_fallback_when_unconfigured`: automatic fallback when offline.
- `test_assistant_analyze_gemini_mode_fails_safely_when_unconfigured`: informative 400 error.
- `test_assistant_analyze_oversized_input`: Pydantic payload constraints (>1000 chars rejection).
- `test_ai_service_malformed_json_fallback`: AI output parsing and fallback.
- `test_ai_service_timeout_fallback`: graceful timeout recovery.
- `test_classify_hazard_*`: earthquake, flood, fire, cyclone, medical emergency keyword classification.
- `test_alerts_endpoint_provenance_labels`: verification of `DEMO_NOT_VERIFIED` tags.
- `test_resources_endpoint_and_detail`: category filters and detail views.

### Mobile Tests (Jest)
Runs 12 unit tests verifying core logic:
```bash
cd /Users/jayeshhh16/Downloads/suraksha-ai/mobile
npm test
```
**Test coverage:**
- SOS message composition with GPS coordinates, accuracy, and Google Maps URL.
- SOS composition with manual landmark description when GPS is denied.
- Location freshness timestamp formatting (`Just now`, `5m ago`, `2h ago`).
- Deterministic hazard keyword classifier (`earthquake`, `flood`, `fire`, `cyclone`, `medical`).
- Reviewed emergency guidance lookup and life-safety rules.
- Situation update dynamic adaptation (e.g., rising water, exit blocked).
- Trusted contacts SQLite repository (insert, query, delete).
- AI mode selector and fallback logic.

### TypeScript Strict Typecheck
```bash
cd /Users/jayeshhh16/Downloads/suraksha-ai/mobile
npm run typecheck
```
Exits with 0 errors.

---

## 4. Operating Features & Offline Capabilities

| Feature | Works Offline? | Data Source & Mechanism |
|---|---|---|
| **Home Dashboard** | Yes | Displays on-device sync status, checklist progress, and cached alerts. |
| **SOS Composer** | Yes | Generates structured dispatch text with GPS or manual landmark; cached in local SQLite. |
| **Trusted Contacts** | Yes | Stored strictly in local SQLite (`suraksha.db`); no network upload. |
| **Emergency Dialler** | Yes (Cellular required) | Opens phone dialler to `tel:112` after explicit confirmation; never dials silently. |
| **Offline Safety Guides** | Yes | 100% on-device reviewed national disaster protocols (earthquake, flood, fire, cyclone, medical). |
| **Preparedness Checklist** | Yes | Go-Bag survival checklist persisted in SQLite; supports custom user items. |
| **AI Assistant (Auto Mode)** | Yes | Calls Gemini when online; automatically falls back to deterministic rules when offline. |
| **Update My Situation** | Yes | Re-evaluates safety instructions when user reports rising water, smoke, or blocked exits. |
| **Lifeline Directory** | Yes | Built-in offline directory with verified demo records and native open-in-maps navigation. |
| **Alerts Feed** | Yes | Live feeds cached on sync; displays transparent `DEMO — NOT VERIFIED` badges when offline. |
| **Manual Offline Toggle** | Yes | Master switch in Settings to force on-device operation and prevent data calls. |

---

## 5. Important Disclaimers & Known Limitations

1. **Demonstration Data Notice**:
   All sample shelters, hospitals, and alert advisories are clearly labelled `DEMO — NOT VERIFIED`. Never rely on sample records during a real disaster without verifying with local authorities.
2. **Nearest Does Not Equal Safest**:
   During floods, cyclones, or seismic events, the closest shelter may have inundated approach roads or structural collapse. Always verify travel safety before moving.
3. **Emergency Dialler (112)**:
   The app uses native URL linking to `tel:112` (India's national emergency number). It requires user confirmation to launch the dialler and will never dial silently. Placing an actual cellular call requires active network reception.
4. **SOS Message Delivery**:
   Opening the system share sheet (SMS / WhatsApp) does not guarantee delivery. SURAKSHA AI does not silently send background SMS or claim delivery confirmation without cellular dispatch.
5. **No Universal Earthquake Predictions**:
   SURAKSHA AI does not promise universal advance earthquake predictions of 15–30 minutes, which are scientifically unsupported. Only authoritative seismic alerts issued by certified agencies (e.g. NCS) are displayed when available.
6. **Map Tiles**:
   Direct map tile rendering requires network connectivity and map provider services. In offline conditions, the app provides a complete, search-and-filtered native resource list with GPS coordinates and open-in-maps support.

---

## 6. Git Publication Commands

Inspect changes and commit cleanly:
```bash
cd /Users/jayeshhh16/Downloads/suraksha-ai

# Inspect status (verify that .env, node_modules, and venv are excluded)
git status

# Add all tracked source code
git add .

# Create initial release commit
git commit -m "feat: initial release of SURAKSHA AI mobile app and FastAPI backend"

# Connect to your GitHub repository
git remote add origin https://github.com/<your-username>/suraksha-ai.git
git branch -M main
git push -u origin main
```
