# Royal Motors Portal

## Project Overview
- **Type:** Full-Stack Web Application
- **Description:** Dealer/car import management dashboard for Royal Motors — a vehicle import and shipping logistics portal with user management, vehicle tracking, booking/container management, financial transactions, and pricing calculator.
- **Target Users:** Admin (full access), Dealer/User (limited access)
- **Created:** 2026-02-13
- **Last Updated:** 2026-02-13















- **Status:** In Progress
- **Plugin Version:** 1.1.1

## Tech Stack
- **Frontend:** React (SPA) + Bootstrap 5 + Material UI (MUI) + React Router + Axios
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL
- **Authentication:** express-session (connect.sid cookie, session-based)
- **File Storage:** /static/cars/, /static/icons/
- **Hosting:** Railway

## Project Structure
```
dealer-dashboard/
├── client/                    # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components (Sidebar, Header, DataTable, Pagination)
│   │   ├── pages/             # Page components (Dashboard, Users, Cars, etc.)
│   │   ├── services/          # API service layer (Axios)
│   │   ├── context/           # Auth context, app state
│   │   ├── hooks/             # Custom hooks
│   │   ├── assets/            # Icons, images
│   │   └── styles/            # CSS/SCSS files
│   └── package.json
├── server/                    # Express backend
│   ├── routes/                # API routes
│   ├── controllers/           # Route handlers
│   ├── models/                # Database models
│   ├── middleware/             # Auth, validation middleware
│   ├── config/                # DB config, session config
│   └── package.json
├── static/                    # Uploaded files (cars, icons)
├── FULL_SPECIFICATION.md
└── PROJECT_PLAN.md
```

---

## Phase 1: Foundation & Authentication
**Goal:** Project setup, layout components, authentication, and dashboard shell

### T1.1 Initialize project structure
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Description:** Set up monorepo with React frontend (Create React App or Vite) and Express backend. Configure PostgreSQL connection, express-session, CORS, and basic middleware. Install dependencies: Bootstrap 5, MUI, React Router, Axios.

### T1.2 Set up PostgreSQL database and schema
- **Complexity:** High
- [x] **Status:** DONE ✅
- **Dependencies:** T1.1
- **Description:** Create all database tables based on specification schema: users, vehicles, booking, containers, boats, calculator, transactions. Set up migrations. Tables have auto-increment IDs. See Section 11 of spec for full schema.

### T1.3 Implement authentication system
- **Complexity:** High
- [x] **Status:** DONE ✅
- **Dependencies:** T1.2
- **Description:** Build `POST /api/login` endpoint with session-based auth (express-session, connect.sid cookie). Implement auth middleware for protected routes. Build `GET /api/user` for current user info. Handle login validation and error responses. Response format: `{error: 0, success: true, data: {...}}`.

### T1.4 Build Login page UI
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.1
- **Description:** Full-screen login page with container port aerial photo background. Center card (510px, dark semi-transparent) with: "Authorization" title, username/email input, password input with eye toggle, "Log In" blue button (full width), "Reset Password" link, "OR" separator, private code search input, green "Search" button. Connect to `POST /api/login`.

### T1.5 Build Sidebar component
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.1
- **Description:** 270px wide sidebar, background #313A46, padding 25px 0. Logo (100x40px) at top. 11 nav items with SVG icons: Dashboard, Users, Booking, Cars, Containers, Boats, Calculator, Transactions, Ticket, Change Password, Log Out. Active state: background #727CF5. React Router NavLink integration. Hamburger toggle for collapse/expand.

### T1.6 Build Header component
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.3
- **Description:** 70px height, white background, shadow rgba(154,161,171,0.15). Elements: hamburger toggle, "Search By VIN" input (250px), language dropdown (Georgian/English with flag), settings gear icon, user info (avatar initials circle + username + email). Connect VIN search to global search functionality.

### T1.7 Build main layout shell
- **Complexity:** Low
- [x] **Status:** DONE ✅
- **Dependencies:** T1.5, T1.6
- **Description:** Compose Header + Sidebar + Content Area layout. Content area background #F3F4F9. Protected route wrapper that redirects to login if not authenticated. React Router setup for all page routes.

### T1.8 Build Dashboard page
- **Complexity:** Low
- [x] **Status:** DONE ✅
- **Dependencies:** T1.7
- **Description:** Dashboard page with "Dashboard" h2 title. Initially can be empty shell. Recommended: stat cards for total cars, active bookings, containers, total debt, paid amount, boat status, recent transactions. Uses `GET /api/user` data.

---

## Phase 2: Core Data Management (Users & Cars)
**Goal:** Users CRUD and Cars CRUD — the two most essential data pages

### T2.1 Build reusable DataTable component
- **Complexity:** High
- [x] **Status:** DONE ✅
- **Dependencies:** T1.7
- **Description:** Generic data table component with: header row (bg #F6F9FB, font 12px bold), data rows (font 12px, padding 8px, border-bottom #DEE2E6), three-dot action menu on last column, row hover highlight. Supports configurable columns, sorting, and dynamic data. Used across all list pages.

### T2.2 Build reusable Pagination component
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.7
- **Description:** Pagination bar with left section (Showing X of Y, Total: Z, Show dropdown 10/20/30/50) and right section (MUI Pagination with circular buttons 32x32px, border-radius 16px). Pagination selected state: rgba(0,0,0,0.08).

### T2.3 Build reusable ActionButtons bar
- **Complexity:** Low
- [x] **Status:** DONE ✅
- **Dependencies:** T1.7
- **Description:** Configurable action bar with optional Filters button, Export button, + Add New button, and Search input. Different pages show different combinations (see spec Section 7.4 for matrix).

### T2.4 Implement Users API endpoints
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.2, T1.3
- **Description:** Build all Users endpoints: `GET /api/users` (paginated, with keyword search, sort, role filter, calculator_category filter), `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`. Query params: limit, page, keyword, asc, sort_by, calculator_category, role. Response: `{error: 0, success: true, data: [...], total: N}`.

### T2.5 Build Users page UI
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T2.1, T2.2, T2.3, T2.4
- **Description:** Users page with "Users" h2 title, + Add New button, Search input. Table columns: ID, Fullname (name + surname), Email, Username, Sup. Fee ($), Last Login Date, Last Purchase Date, Role (admin/user), actions menu (Edit, Delete). Connect to Users API with pagination.

### T2.6 Build Users add/edit modal or form
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T2.5
- **Description:** Form for creating/editing users. Fields: name, surname, email, username, password, phone, calculator_category, role, identity_number, superviser_fee. Validation and API integration (POST for create, PUT for update).

### T2.7 Implement Vehicles API endpoints
- **Complexity:** High
- [x] **Status:** DONE ✅
- **Dependencies:** T1.2, T1.3
- **Description:** Build all Vehicles endpoints: `GET /api/vehicles` (paginated, with filters: auction, keyword, date range, line, status, paid), `POST /api/vehicles` (with image upload), `PUT /api/vehicles/:id`, `DELETE /api/vehicles/:id`. Also `GET /api/users?limit=500` for dealer dropdown, `GET /api/cities` for cities dropdown. Handle file uploads to /static/cars/.

### T2.8 Build Cars page UI
- **Complexity:** High
- [x] **Status:** DONE ✅
- **Dependencies:** T2.1, T2.2, T2.3, T2.7
- **Description:** Cars page with Filters, Export, + Add New, Search. Table with 16 columns: Image (thumbnail ~60x45px from /static/cars/), Dealer, Purchase Date, Vehicle Name (mark + model + year), VIN, Buyer, Personal Number, Phone, Container, Booking, Line, Auction, State, Paid, Total, Debt, actions menu. Image loaded from profile_image_url.

### T2.9 Build Cars add/edit form
- **Complexity:** High
- [x] **Status:** DONE ✅
- **Dependencies:** T2.8
- **Description:** Complex form for creating/editing vehicles with 40+ fields. Image upload support. Dropdowns for dealer (from users API), cities, auction types. Date pickers for various dates. Financial fields (vehicle_price, total_price, payed_amount, etc.). Status management.

### T2.10 Implement Filters modal/panel
- [x] **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T2.3
- **Description:** Reusable filters component for Cars page (and later Booking, Containers). Supports date range (start_date, end_date), dropdown filters (auction, line, status, paid). Updates API query params on apply.

### T2.11 Implement Export functionality
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T2.8
- **Description:** Export button functionality for Cars page (and later Booking, Containers). Export current filtered data to CSV/Excel format. Download trigger from browser.

---

## Phase 3: Logistics & Finance
**Goal:** Booking, Containers, Boats, Calculator, and Transactions pages

### T3.1 Implement Booking API endpoints
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.2, T1.3
- **Description:** Build Booking endpoints: `GET /api/booking` (paginated, with filters: start_date, end_date, loading_port, line), `POST /api/booking`, `PUT /api/booking/:id`, `DELETE /api/booking/:id`. Also `GET /api/vin-codes/booking` for VIN dropdown, `GET /api/containers-list/booking` for container dropdown, `GET /api/boats` for boat dropdown.

### T3.2 Build Booking page UI
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T2.1, T2.2, T2.3, T2.10, T3.1
- **Description:** Booking page with Filters, Export, + Add New, Search. Table with 12 columns: VIN, Buyer, Booking, Line, Container, Delivery Location, Loading Port, Container Loaded Date, Container Receive Date, Terminal, Estimated Opening Date, Opening Date, actions menu. Filters: start_date, end_date, loading_port, line.

### T3.3 Build Booking add/edit form
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T3.2
- **Description:** Booking create/edit form with fields from booking schema. VIN dropdown (from vin-codes API), container dropdown, boat dropdown. Date pickers for various dates.

### T3.4 Implement Containers API endpoints
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.2, T1.3
- **Description:** Build Containers endpoints: `GET /api/containers` (paginated, with filters: start_date, end_date, status), `POST /api/containers`, `PUT /api/containers/:id`, `DELETE /api/containers/:id`. Also `GET /api/vin-codes/booking?type=containers`, `GET /api/boats`.

### T3.5 Build Containers page UI
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T2.1, T2.2, T2.3, T2.10, T3.4
- **Description:** Containers page with Filters, Export, + Add New, Search. Table with 14 columns: VIN, Container#, Purchase Date, Vehicle Name, Buyer, Booking, Delivery Location, Container Open Date, Lines, Personal Number, Lot/Stock, Loading Port, Container Loaded Date, Container Receive Date, actions menu.

### T3.6 Build Containers add/edit form
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T3.5
- **Description:** Container create/edit form. VIN dropdown, boat dropdown. Fields from containers schema.

### T3.7 Implement Boats API endpoints
- **Complexity:** Low
- [x] **Status:** DONE ✅
- **Dependencies:** T1.2, T1.3
- **Description:** Build Boats endpoints: `GET /api/boats` (paginated, with status filter), `POST /api/boats`, `PUT /api/boats/:id`, `DELETE /api/boats/:id`. Simpler entity — 7 fields.

### T3.8 Build Boats page UI
- **Complexity:** Low
- [x] **Status:** DONE ✅
- **Dependencies:** T2.1, T2.2, T3.7
- **Description:** Boats page with + Add New, Search (no Filters, no Export). Table with 7 columns: ID, Name, Identification Code, Est. Departure Date, Est. Arrival Date, Arrival Date, Status (us_port/in_transit/arrived/delivered), actions menu.

### T3.9 Build Boats add/edit form
- **Complexity:** Low
- [x] **Status:** DONE ✅
- **Dependencies:** T3.8
- **Description:** Boat create/edit form. Fields: name, identification_code, departure_date, estimated_arrival_date, arrival_date, status.

### T3.10 Implement Calculator API endpoints
- **Complexity:** Low
- [x] **Status:** DONE ✅
- **Dependencies:** T1.2, T1.3
- **Description:** Build Calculator endpoints: `GET /api/calculator` (paginated, with keyword, auction, port filters), `POST /api/calculator`, `PUT /api/calculator/:id`, `DELETE /api/calculator/:id`. Also uses `GET /api/cities`.

### T3.11 Build Calculator page UI
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T2.1, T2.2, T3.10
- **Description:** Calculator page with "Price By Port" special filter button, + Add New, Search. Table with 7 columns: Auction, City, Destination, Land Price, Container Price, Total, Port, actions menu. 401 entries, 41 pages of data.

### T3.12 Build Calculator add/edit form
- **Complexity:** Low
- [x] **Status:** DONE ✅
- **Dependencies:** T3.11
- **Description:** Calculator entry create/edit form. Fields: auction, city, destination, land_price, container_price, total_price, port.

### T3.13 Implement Transactions API endpoints
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.2, T1.3
- **Description:** Build Transactions endpoints: `GET /api/transactions` (paginated, with keyword, date range, sort), `POST /api/transactions`. Payment types: car_amount, shipping, customs, balance.

### T3.14 Build Transactions page UI
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T2.1, T2.2, T3.13
- **Description:** Transactions page with + Add New, Search (no Filters, no Export). Table with 10 columns: ID, Payed ID, Date, VIN, Mark, Model, Year, Personal Number, Amount, Payment Type, actions menu.

### T3.15 Build Transactions add/edit form
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T3.14
- **Description:** Transaction create/edit form. Fields from transactions schema. VIN lookup/dropdown, payment type selection.

---

## Phase 4: Polish, Testing & Deployment
**Goal:** Remaining features, testing, and production deployment

### T4.1 Build Change Password page
- **Complexity:** Low
- [x] **Status:** DONE ✅
- **Dependencies:** T1.7, T1.3
- **Description:** Center-aligned page with lock illustration (/static/icons/change-pass.webp), "Change Password" h3 title. Three password inputs with eye toggles: Old Password, New Password, Repeat Password. Submit button (btn-primary, full width). API: `POST /api/change-password`. Validation: new === repeat, old password check.

### T4.2 Build Ticket page shell
- **Complexity:** Low
- [x] **Status:** DONE ✅
- **Dependencies:** T1.7
- **Description:** Ticket/support page — currently incomplete in original. Build basic shell with sidebar and header. Content area placeholder. Uses `GET /api/user` only.

### T4.3 Implement role-based access control
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.3, T2.4
- **Description:** Implement role-based middleware on backend (admin vs user). Admin: full CRUD on all entities. User: limited access (view own data, restricted management). Protect routes accordingly. Frontend: conditionally show/hide actions based on role.

### T4.4 Implement Log Out functionality
- **Complexity:** Low
- [x] **Status:** DONE ✅
- **Dependencies:** T1.3
- **Description:** Sidebar "Log Out" button destroys session on backend, clears connect.sid cookie, redirects to login page. `POST /api/logout` or session destroy endpoint.

### T4.5 Implement language switching
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.6
- **Description:** Header language dropdown: Georgian (ქართული) / English with Georgian flag icon. i18n setup for UI labels. Store preference in localStorage or user settings.

### T4.6 Responsive design and polish
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** All UI tasks
- **Description:** Ensure proper sidebar collapse behavior on smaller screens. Polish all components to match design system exactly. Verify color palette, typography, and spacing matches specification. Test hamburger toggle functionality.

### T4.7 End-to-end testing
- **Complexity:** High
- [x] **Status:** DONE ✅
- **Dependencies:** All previous tasks
- **Description:** Test all CRUD operations for each entity. Test authentication flow (login, session persistence, logout). Test pagination, filtering, sorting, search across all pages. Test role-based access. Test export functionality.

### T4.8 Deploy to Railway
- **Complexity:** Medium
- **Status:** IN_PROGRESS 🔄
- **Dependencies:** T4.7
- **Description:** Configure Railway deployment for both frontend and backend. Set up PostgreSQL on Railway. Configure environment variables (DB connection, session secret, CORS origins). Set up file storage for static assets. Configure build pipeline.

---

## Original Specification Analysis

**Source Document:** FULL_SPECIFICATION.md

### Extracted Requirements
- 10 distinct pages with detailed specifications
- 30+ API endpoints (11 confirmed GET, 19+ estimated write operations)
- Session-based authentication with express-session
- Full design system: color palette, typography, component sizes
- Database schema for 7 tables (users, vehicles, booking, containers, boats, calculator, transactions)
- Role-based access: admin (full), user (limited — specifics unclear)
- Common query parameters: limit, page, keyword, asc, sort_by, date range
- Standard response format: `{error: 0, success: true, data: [...], total: N}`

### Clarifications Made
- Database: **PostgreSQL** (spec mentioned "probably MySQL/PostgreSQL")
- Hosting: **Railway** (not specified in original)
- MVP Features: **All features included** (user selected all — organized into 4 phases)

### Key Design Tokens
| Token | Value |
|-------|-------|
| Sidebar bg | #313A46 |
| Sidebar active | #727CF5 |
| Primary button | #0D6EFD |
| Content area bg | #F3F4F9 |
| Table header bg | #F6F9FB |
| Border color | #DEE2E6 |
| Body text | #212529 |
| Sidebar width | 270px |
| Header height | 70px |

---

## Progress Tracking

### Overall Status
**Total Tasks**: 42
**Completed**: 41 🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜ (97%)
**In Progress**: 1
**Blocked**: 0

### Phase Progress
- 🟢 Phase 1: Foundation & Authentication → 8/8 (100%) ✅
- 🔵 Phase 2: Core Data Management → 11/11 (100%) ✅
- 🟣 Phase 3: Logistics & Finance → 15/15 (100%) ✅
- 🟠 Phase 4: Polish, Testing & Deployment → 7/8 (87%)

### Current Focus
🎯 **Next Task**: T4.8 - Deploy to Railway
📅 **Phase**: 4 - Polish, Testing & Deployment
🔄 **Status**: In Progress (1 task active: T4.8)

---

## Summary

| Metric | Count |
|--------|-------|
| Total Phases | 4 |
| Total Tasks | 42 |
| High Complexity | 6 |
| Medium Complexity | 19 |
| Low Complexity | 10 |
