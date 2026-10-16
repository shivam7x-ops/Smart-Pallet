# Product Requirements Document (PRD)
## Smart Pallet Tracker with Route Optimization

**Document status:** Initial project specification  
**Version:** 1.0  
**Date:** 10 October 2026

---

## 1. Product Overview

### 1.1 Product vision
Build an IoT-enabled pallet management and delivery platform that lets warehouse teams register pallets, monitor their latest reported locations and movement, manage inventory and delivery orders, assign pallets to orders, optimize multi-stop delivery routes, and track deliveries from a web dashboard.

### 1.2 Problem statement
Pallet movement and delivery operations can be difficult to monitor when inventory records, location updates, and delivery planning are handled separately. The system will combine device telemetry, pallet inventory, delivery workflows, route planning, and a live dashboard in one application.

### 1.3 Goals
- Maintain a unique digital record for every pallet.
- Receive and validate telemetry from ESP32-based tracking devices.
- Show the latest reported location, status, and timestamp for each pallet.
- Maintain pallet inventory, movement history, delivery orders, and assignments.
- Generate practical routes for deliveries to multiple destinations.
- Show tracking and delivery information on a map-based dashboard.
- Use Firebase Authentication for user sign-in and Firebase Realtime Database (RTDB) for application data and live updates.

### 1.4 Out of scope for the first release
- Automated fleet dispatch or driver payroll.
- Guaranteed road-traffic predictions unless a routing provider supports them.
- Indoor positioning at warehouse level.
- Cellular connectivity hardware integration until a GSM/LTE module and service are selected.
- Production-grade multi-region disaster recovery and advanced enterprise analytics.
- Fully autonomous route re-optimization without manager approval.

---

## 2. Users and Roles

### Warehouse Manager
- Register, edit, and retire pallets.
- View available, reserved, dispatched, in-transit, delivered, and maintenance statuses.
- Create delivery orders and assign pallets.
- Review location history and delivery progress.

### Dispatcher / Logistics Operator
- Enter destinations and vehicle constraints.
- Generate and review optimized routes.
- Dispatch deliveries and monitor active journeys.

### Administrator
- Manage authorized users and role assignments.
- Register or associate IoT devices with pallets.
- Review device connectivity, data freshness, and system errors.

### Viewer (optional)
- Read-only access to permitted inventory, route, and delivery information.

Role-based permissions must be enforced by the backend and Firebase security rules, not only by hiding frontend controls.

---

## 3. Technology Stack and Architecture

### 3.1 Proposed stack
- **Web dashboard:** React, preferably with TypeScript.
- **Backend/API:** Python with FastAPI.
- **Authentication:** Firebase Authentication.
- **Database and live updates:** Firebase Realtime Database.
- **IoT firmware:** ESP32 using Arduino framework or ESP-IDF.
- **Maps and routing:** A map provider and routing engine selected during Phase 5. Options may include OpenStreetMap-based services or a commercial provider; review terms, quotas, attribution, and API costs before choosing.
- **Hosting:** Select during deployment planning. Keep secrets in environment variables or a managed secret store.

### 3.2 High-level architecture

```text
ESP32 + GPS + optional sensors
          |
          | HTTPS telemetry (Wi-Fi)
          v
Python FastAPI backend  <----> Firebase Realtime Database
          ^                         ^
          |                         |
          | API requests             | Firebase Auth / live subscriptions
          |                         |
React web dashboard ----------------+
          |
          +---- Map / routing provider
```

**Important design decision:** The ESP32 should send telemetry to the Python API, and the API should validate and write accepted records to RTDB. Avoid putting Firebase service-account credentials in browser code or ESP32 firmware. Firebase Authentication verifies dashboard users; the backend should verify Firebase ID tokens before accepting protected API requests.

For a prototype, direct device-to-API communication over Wi-Fi is sufficient. For remote deployments, consider HTTPS, device credentials or signed device tokens, rate limiting, and replay protection. Do not rely on an unauthenticated public endpoint.

### 3.3 Connectivity assumptions
- Initial prototype uses Wi-Fi.
- GPS requires a view of the sky and may be inaccurate or unavailable indoors.
- If a pallet travels outside Wi-Fi coverage, it cannot deliver live updates over Wi-Fi. Store a limited queue of readings on the device and transmit them when connectivity returns, if memory and firmware design allow.
- GSM/LTE can be added in a later iteration after hardware, SIM/service, and power requirements are decided.

---

## 4. Core Functional Requirements

### FR-01: Authentication and authorization
- Users can sign in and sign out using Firebase Authentication.
- Protected API endpoints verify the Firebase ID token.
- Roles determine which actions a user can perform.
- Unauthorized requests are rejected by the backend and database rules.

### FR-02: Pallet registration
- Create a pallet with a unique ID such as `P001`.
- Store pallet type, capacity, status, associated device ID, and creation/update timestamps.
- Prevent duplicate pallet IDs.
- Allow authorized users to edit, deactivate, or retire a pallet.
- Do not delete historical delivery or telemetry records when retiring a pallet.

### FR-03: Device registration and telemetry
- Associate a device ID with a pallet.
- Accept a payload containing device ID, pallet ID, latitude, longitude, timestamp, and optional sensor/movement fields.
- Validate identity, field types, coordinate ranges, timestamp, and payload size.
- Reject or quarantine invalid or stale/out-of-order readings.
- Track the last-seen time and connection/data freshness of each device.
- Record the latest location separately from historical telemetry.

### FR-04: Inventory and movement
- Display pallets with status and last reported location.
- Support statuses such as `AVAILABLE`, `RESERVED`, `DISPATCHED`, `IN_TRANSIT`, `DELIVERED`, `MAINTENANCE`, and `RETIRED`.
- Record status transitions with timestamp, actor or device, and reason where available.
- Define valid transitions in the backend to prevent inconsistent states.

### FR-05: Delivery orders
- Create an order with destination address or coordinates, priority, requested delivery window (optional), and required pallets/quantities.
- Validate pallet availability before assignment.
- Show order status: `DRAFT`, `READY`, `PLANNED`, `DISPATCHED`, `IN_PROGRESS`, `COMPLETED`, or `CANCELLED`.
- Retain order and delivery history.

### FR-06: Pallet assignment and dispatch
- Assign available pallets to an order.
- Prevent the same pallet from being actively assigned to multiple orders.
- Reserve pallets during planning.
- On dispatch, update order, pallet, and route states consistently.
- Support cancellation and release of reservations according to documented transition rules.

### FR-07: Route optimization
- Accept a depot/start location, delivery stops, vehicle capacity, and stop priorities.
- Calculate a route for one vehicle in the initial version.
- Display stop order, estimated distance, and estimated duration when supported by the routing service.
- Allow a dispatcher to review and manually adjust the proposed stop order before dispatch.
- Handle missing coordinates, unreachable stops, provider errors, and capacity violations with clear messages.
- Design the interface so multi-vehicle Vehicle Routing Problem (VRP) support can be added later.

### FR-08: Live tracking dashboard
- Show pallet inventory, current status, latest reported coordinates, last update time, and device freshness.
- Display active routes and delivery stops on a map.
- Update data when new validated telemetry or status changes arrive.
- Clearly label location as stale/offline when no recent update has arrived; define the threshold in configuration.
- Show movement and delivery history for a selected pallet/order.

### FR-09: Delivery completion
- Allow an authorized operator to mark a delivery complete.
- Optionally support arrival confirmation by geofence, but do not treat GPS proximity alone as proof of delivery in the first release.
- Record completion time, actor, and any notes.
- Mark associated pallets as delivered or available for reuse according to the business workflow.

### FR-10: Auditability and errors
- Record important actions such as pallet registration, assignment, dispatch, cancellation, and delivery completion.
- Log backend errors without exposing secrets or sensitive tokens.
- Provide clear validation messages to the dashboard.

---

## 5. Data Model (Initial RTDB Structure)

Use a consistent, documented schema. RTDB is a JSON tree, so avoid deeply nested records that must be downloaded together.

```text
/users/{uid}
  displayName
  email
  role
  active

/pallets/{palletId}
  type
  capacity
  status
  deviceId
  createdAt
  updatedAt

/devices/{deviceId}
  palletId
  lastSeenAt
  connectionStatus
  firmwareVersion

/latestLocations/{palletId}
  deviceId
  latitude
  longitude
  recordedAt
  receivedAt
  movementStatus
  temperature
  humidity
  batteryLevel

/telemetry/{palletId}/{recordId}
  deviceId
  latitude
  longitude
  recordedAt
  receivedAt
  movementStatus
  temperature
  humidity

/orders/{orderId}
  status
  destination
  priority
  palletIds
  createdAt
  updatedAt

/routes/{routeId}
  status
  startLocation
  stopOrder
  vehicleCapacity
  estimatedDistance
  estimatedDuration
  createdAt
  dispatchedAt

/assignments/{orderId}/{palletId}
  status
  assignedAt
  assignedBy

/movementHistory/{palletId}/{eventId}
  eventType
  fromStatus
  toStatus
  timestamp
  actor
  notes

/auditLogs/{logId}
  actorUid
  action
  entityType
  entityId
  timestamp
  details
```

This is a starting schema, not a requirement to use these exact paths. Finalize indexes, query patterns, retention, and security rules before production. Use server timestamps for receipt/audit times. Keep device-recorded time and server-received time separate.

---

## 6. API Design (Initial)

Prefix endpoints with `/api/v1`.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/pallets` | List/search pallets |
| `POST` | `/pallets` | Register pallet |
| `GET` | `/pallets/{pallet_id}` | Get pallet details |
| `PATCH` | `/pallets/{pallet_id}` | Update pallet |
| `POST` | `/devices/register` | Associate device with pallet |
| `POST` | `/telemetry` | Receive device telemetry |
| `GET` | `/pallets/{pallet_id}/history` | Retrieve movement/telemetry history |
| `POST` | `/orders` | Create order |
| `GET` | `/orders` | List orders |
| `POST` | `/orders/{order_id}/assign` | Assign pallets |
| `POST` | `/routes/optimize` | Calculate a proposed route |
| `POST` | `/routes/{route_id}/dispatch` | Dispatch a reviewed route |
| `POST` | `/orders/{order_id}/complete` | Complete delivery |

Use Pydantic request/response models, appropriate HTTP status codes, pagination for histories, and consistent error response formats. Final endpoint details can evolve during implementation.

---

## 7. Non-Functional Requirements

### Security
- Verify Firebase ID tokens on protected API routes.
- Use least-privilege Firebase database rules.
- Keep service-account credentials and routing API keys out of React bundles and firmware.
- Use HTTPS outside local development.
- Validate and rate-limit telemetry ingestion.
- Add per-device authentication before field deployment.
- Do not store unnecessary personal information.

### Reliability and data quality
- Preserve server receipt timestamps.
- Handle duplicate telemetry safely using event IDs or idempotency keys.
- Handle intermittent Wi-Fi and reconnect attempts.
- Show data freshness instead of implying that old coordinates are live.
- Prevent invalid status transitions and duplicate active pallet assignments.

### Performance
- Keep dashboard list queries bounded and paginated.
- Subscribe only to relevant RTDB paths.
- Limit telemetry write frequency and history query size.
- Define acceptable update latency and expected device count during testing.

### Maintainability
- Separate API routes, business logic, database access, schemas, and configuration.
- Keep firmware, backend, and frontend in clearly named folders.
- Use `.env.example` for configuration names only; never commit real secrets.
- Document local setup and deployment steps.

### Observability
- Provide health checks, structured logs, and error reporting.
- Track API failures, rejected telemetry, device last-seen time, and routing-provider errors.

---

## 8. Phase-by-Phase Development Plan

## Phase 0 — Requirements and Project Setup
**Goal:** Agree on the minimum viable product (MVP) and create a reproducible development environment.

**Tasks**
1. Confirm first-release scope: one vehicle, multiple stops, Wi-Fi telemetry, and one dashboard.
2. Decide pallet fields, status transitions, order lifecycle, and what counts as delivery completion.
3. Choose a map/routing provider and review usage limits, attribution, and costs.
4. Create a Git repository with `frontend/`, `backend/`, `firmware/`, and `docs/` directories.
5. Create a task board and document setup instructions.
6. Add `.gitignore`, `.env.example` files, and basic coding conventions.

**Deliverables**
- Approved MVP scope and status diagrams.
- Repository scaffold.
- Development setup guide.

**Acceptance criteria**
- A new developer can clone the repository and follow the documented setup.
- No secrets are committed.
- Scope and assumptions are documented.

## Phase 1 — Firebase Foundation and Authentication
**Goal:** Set up Firebase and secure dashboard access.

**Tasks**
1. Create a Firebase project and enable Authentication providers.
2. Create a Realtime Database instance and define development rules.
3. Define user profile and role structure.
4. Integrate Firebase Authentication into React.
5. Add login, logout, loading, and unauthorized/error states.
6. Configure FastAPI to verify Firebase ID tokens using the Firebase Admin SDK.
7. Add role/permission checks to protected backend routes.
8. Test database rules and API authorization.

**Deliverables**
- Firebase project configuration guide.
- React authentication flow.
- FastAPI authentication dependency/middleware.
- Initial RTDB security rules.

**Acceptance criteria**
- Signed-out users cannot access protected dashboard pages.
- Backend rejects missing, invalid, and expired ID tokens.
- Users cannot perform actions outside their role.
- Service-account credentials are not exposed to the browser.

## Phase 2 — Backend Skeleton and Data Layer
**Goal:** Establish a maintainable API and database access layer.

**Tasks**
1. Create a FastAPI application with versioned routes.
2. Add Pydantic schemas and centralized validation/error handling.
3. Configure Firebase Admin SDK and RTDB access in one database service layer.
4. Implement `/health`.
5. Implement pallet create, list, detail, and update endpoints.
6. Add uniqueness checks and status validation.
7. Add pagination/search for pallet listings.
8. Write automated tests for validation, permissions, and core business logic.

**Deliverables**
- Running FastAPI service.
- API documentation via OpenAPI/Swagger.
- Initial pallet CRUD endpoints.
- Automated backend tests.

**Acceptance criteria**
- Authorized users can create, view, and update pallets.
- Duplicate pallet IDs and invalid values are rejected.
- API errors are consistent and understandable.
- Core endpoint tests pass.

## Phase 3 — React Dashboard and Pallet Inventory
**Goal:** Deliver a usable dashboard before connecting physical hardware.

**Tasks**
1. Set up React with TypeScript, routing, and reusable layout components.
2. Build login and protected-route handling.
3. Build overview cards for total pallets and counts by status.
4. Build pallet list, search, filters, details, and registration/edit forms.
5. Connect UI to FastAPI endpoints.
6. Add loading, empty, success, and error states.
7. Add a pallet detail page with a placeholder map/location panel.

**Deliverables**
- Working inventory dashboard.
- Pallet registration and management screens.
- Frontend API client and environment configuration.

**Acceptance criteria**
- A manager can register and update pallets from the UI.
- Search and status filters work.
- UI permissions match backend permissions.
- The app handles API failure without crashing.

## Phase 4 — ESP32, GPS, and Telemetry Ingestion
**Goal:** Send real device data securely to the backend.

**Hardware assumptions**
- ESP32 DevKit/WROOM.
- GPS module such as a UART-based NEO-6M-compatible module.
- Optional accelerometer or temperature/humidity sensor, depending on the physical prototype.
- Stable power supply and appropriate wiring for the selected modules.

**Tasks**
1. Confirm exact GPS/sensor module models and voltage/logic requirements before wiring.
2. Connect GPS to ESP32 UART pins and verify serial readings.
3. Implement Wi-Fi connection and reconnection logic.
4. Parse GPS coordinates and validate GPS fix quality.
5. Build a telemetry payload with `deviceId`, `palletId`, coordinates, device timestamp, and optional sensor values.
6. Send payloads to `POST /api/v1/telemetry` over HTTPS when supported by the deployment.
7. Implement device authentication, request timeout, bounded retry, and backoff.
8. Validate payloads in FastAPI and update `/latestLocations` plus `/telemetry`.
9. Add last-seen status and stale-data detection.
10. Test invalid coordinates, missing GPS fix, duplicate events, bad timestamps, and Wi-Fi loss.

**Example telemetry payload**
```json
{
  "deviceId": "DEV001",
  "palletId": "P001",
  "latitude": 30.7046,
  "longitude": 76.7179,
  "recordedAt": "2026-10-10T17:00:00Z",
  "movementStatus": "MOVING",
  "temperature": 25.4,
  "humidity": 58.0
}
```

**Deliverables**
- ESP32 firmware prototype.
- Telemetry API and validation.
- Device-to-pallet association.
- Latest-location and telemetry-history records.

**Acceptance criteria**
- A valid GPS fix produces a valid telemetry request.
- Accepted readings update the latest location and history.
- Invalid or unauthorized readings are rejected.
- Dashboard data clearly shows when a device is stale/offline.
- The system does not claim live GPS accuracy when no valid fix exists.

## Phase 5 — Map and Route Optimization
**Goal:** Visualize current locations and produce a usable route for a delivery.

**Tasks**
1. Integrate a map library/provider into React.
2. Display pallet locations and delivery destinations with distinct markers.
3. Add an order form for destination, priority, and required pallets.
4. Add a vehicle form for start location and capacity.
5. Implement a routing service adapter in Python so providers can be changed without rewriting business logic.
6. Start with one vehicle and multiple delivery stops.
7. Use a routing provider or optimization library to order stops and obtain route geometry, distance, and duration.
8. Validate vehicle capacity and required coordinates.
9. Show proposed stop order and route summary.
10. Allow the dispatcher to review and manually adjust the route before saving it.

**MVP optimization scope**
- One vehicle.
- One start/depot location.
- Multiple destinations.
- Distance/time-based route estimate, subject to provider capabilities.
- Capacity and priority checks.
- Human review before dispatch.

**Later enhancement**
- Multi-vehicle VRP, time windows, traffic-aware routing, driver breaks, and automatic re-optimization.

**Deliverables**
- Map dashboard.
- Route optimization endpoint/service.
- Route review and stop-order UI.

**Acceptance criteria**
- Valid destinations appear on the map.
- Route results include an ordered list of stops.
- Missing or invalid coordinates produce a clear error.
- A dispatcher can review and save a proposed route.
- Routing provider credentials are not exposed in client code.

## Phase 6 — Orders, Assignment, and Delivery Workflow
**Goal:** Connect inventory to actual delivery operations.

**Tasks**
1. Implement create/list/detail/update delivery order endpoints.
2. Check pallet availability when an order is created or assigned.
3. Reserve pallets and prevent conflicting active assignments.
4. Link order, pallet, route, and assignment records.
5. Implement planning, dispatch, in-progress, completion, and cancellation transitions.
6. Add a dispatch confirmation screen.
7. Record movement history and audit events for key transitions.
8. Add delivery completion notes and timestamps.
9. Test concurrent assignment attempts and cancellation/release behavior.

**Deliverables**
- Order management screens and APIs.
- Pallet assignment workflow.
- Dispatch and delivery completion workflow.
- Movement history and audit records.

**Acceptance criteria**
- Unavailable or retired pallets cannot be assigned.
- A pallet cannot be actively assigned to two orders.
- Dispatch updates the related order, route, and pallet statuses consistently.
- Completion is recorded with timestamp and actor.
- Historical records remain available after completion or cancellation.

## Phase 7 — Live Updates and Monitoring
**Goal:** Make operational status updates visible without manual page refreshes.

**Tasks**
1. Subscribe the dashboard to the appropriate RTDB paths or use a backend-mediated event strategy.
2. Update location markers, status labels, and last-seen indicators when new data arrives.
3. Add filters for status, device freshness, order, and route.
4. Show a pallet's recent location/movement history.
5. Add clear indicators for stale telemetry and GPS-unavailable states.
6. Add backend logging for device/API failures and routing errors.
7. Tune update frequency, subscription scope, and history pagination.

**Deliverables**
- Live-updating dashboard.
- Device freshness and error indicators.
- Tracking history view.

**Acceptance criteria**
- New accepted telemetry appears in the dashboard without a manual reload, within the configured target latency.
- Stale data is visibly distinguished from recent data.
- The dashboard does not subscribe to unnecessary large data branches.
- Failures are logged and surfaced clearly.

## Phase 8 — Testing, Security, and Reliability
**Goal:** Verify the complete workflow and reduce risks before demonstration or field use.

**Tasks**
1. Unit-test business rules, status transitions, and route input validation.
2. Integration-test Firebase access and telemetry ingestion.
3. Test end-to-end flow: register pallet → send telemetry → create order → assign pallet → optimize route → dispatch → complete.
4. Test invalid token, unauthorized role, malformed payload, duplicate event, and oversized request.
5. Test Wi-Fi disconnection/reconnection and missing GPS fix.
6. Test duplicate submissions and concurrent pallet assignment.
7. Review Firebase security rules and backend/device authentication.
8. Check logs for exposed credentials or tokens.
9. Test on a phone-sized viewport and common desktop browsers.
10. Document known limitations and recovery steps.

**Deliverables**
- Test plan and results.
- Security checklist.
- Bug list and release candidate.

**Acceptance criteria**
- The complete MVP workflow passes documented end-to-end tests.
- Unauthorized access and invalid telemetry are rejected.
- Core UI works on desktop and mobile-sized screens.
- Known limitations are documented rather than hidden.

## Phase 9 — Deployment and Demonstration
**Goal:** Deploy a stable demonstration environment and prepare the project handover.

**Tasks**
1. Select hosting for React and FastAPI.
2. Configure environment variables and production Firebase settings.
3. Enable HTTPS and restrict database access.
4. Configure allowed frontend origins/CORS.
5. Set usage limits and alerts for map/routing APIs where available.
6. Deploy the backend, then frontend, and test connectivity.
7. Register demo pallets and device IDs.
8. Prepare a demo scenario with a warehouse start point and multiple delivery stops.
9. Write setup, architecture, API, firmware, and troubleshooting documentation.
10. Record a short demo walkthrough if required for evaluation.

**Deliverables**
- Deployed demo.
- Setup and handover documentation.
- Demo dataset and test scenario.

**Acceptance criteria**
- A fresh user can sign in and complete the demo workflow.
- The deployed dashboard receives telemetry from the configured device.
- Secrets are configured outside source control.
- Documentation explains limitations, setup, and troubleshooting.

---

## 9. Suggested Repository Structure

```text
smart-pallet-tracker/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── .env.example
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── main.py
│   ├── tests/
│   └── .env.example
├── firmware/
│   └── esp32_tracker/
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── wiring.md
│   └── test-plan.md
├── PRD.md
└── README.md
```

---

## 10. Milestones and Priority

| Milestone | Included phases | Priority |
|---|---|---|
| M1: Secure foundation | 0–2 | Must have |
| M2: Inventory dashboard | 3 | Must have |
| M3: Real device tracking | 4 | Must have |
| M4: Map and route planning | 5 | Must have |
| M5: Delivery operations | 6 | Must have |
| M6: Live monitoring | 7 | Must have |
| M7: Test and deploy | 8–9 | Must have |
| M8: Multi-vehicle VRP and advanced telemetry | Follow-up iteration | Could have |

Suggested implementation order is phase-by-phase, with a working test/demo at the end of each phase. Exact calendar estimates should be assigned after confirming team size, experience, hardware availability, and the routing provider.

---

## 11. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| GPS performs poorly indoors | Incorrect or missing location | Show GPS fix quality and last valid location; use a separate indoor-positioning approach only if needed. |
| Wi-Fi coverage is unavailable in transit | Tracking gaps | Queue readings locally and retry; consider GSM/LTE for field deployment. |
| Device endpoint is abused | False telemetry or database writes | Device authentication, validation, rate limiting, and audit logs. |
| Firebase rules are too permissive | Unauthorized data access | Deny by default, test rules, and keep privileged writes in the backend. |
| Route API quotas or costs | Route feature becomes unavailable or expensive | Review provider limits and add caching, quotas, and graceful error handling. |
| Duplicate or out-of-order readings | Wrong latest location | Use event IDs, timestamps, idempotent writes, and server receipt time. |
| Conflicting pallet assignments | Inventory inconsistency | Enforce assignment rules in backend business logic and test concurrent requests. |
| Scope becomes too large | Delayed completion | Deliver one-vehicle MVP first; defer multi-vehicle VRP and advanced automation. |

---

## 12. MVP Definition of Done

The MVP is ready for demonstration when:

- A user can authenticate securely.
- An authorized manager can register and manage pallets.
- An ESP32 device can send validated GPS telemetry to the Python backend.
- The backend stores the latest location and a history of readings in Firebase RTDB.
- The dashboard shows pallet status, location, timestamp, and stale/offline state.
- A manager can create an order and assign available pallets.
- The system can generate and display a route for one vehicle and multiple stops.
- A dispatcher can review and dispatch the route.
- Delivery completion and movement history are stored.
- The end-to-end workflow is tested and setup documentation is complete.

## 13. Decisions to Confirm Before Implementation

1. Exact GPS module and optional sensor models.
2. Whether the first demo will use Wi-Fi only or require cellular connectivity.
3. Routing/map provider and its cost/usage constraints.
4. Whether user roles are needed in the initial demo or one administrator is sufficient.
5. Expected number of pallets/devices and telemetry interval.
6. Whether route optimization should prioritize shortest distance, estimated time, delivery priority, or a combination.
7. Hosting provider and whether the project is a local demonstration or a public deployment.

These decisions should be recorded in `docs/architecture.md` before the corresponding implementation phase begins.
