# Royal Motors Portal

## Project Overview
- **Type:** Full-Stack Web Application
- **Description:** Dealer/car import management dashboard for Royal Motors — a vehicle import and shipping logistics portal with user management, vehicle tracking, booking/container management, financial transactions, and pricing calculator.
- **Target Users:** Admin (full access), Dealer/User (limited access)
- **Created:** 2026-02-13
- **Last Updated:** 2026-03-11
























- **Status:** In Progress 🔶
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
- [x] **Status:** DONE ✅
- **Dependencies:** T4.7
- **Description:** Configure Railway deployment for both frontend and backend. Set up PostgreSQL on Railway. Configure environment variables (DB connection, session secret, CORS origins). Set up file storage for static assets. Configure build pipeline.

---

## Phase 5: Detail Pages & Core Missing Features
**Goal:** Add individual detail/inner pages for key entities, implement VIN global search, and create missing backend endpoints

### T5.1 Add GET /:id endpoints for all entities
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.2
- **Description:** Add individual record retrieval endpoints for all entities: `GET /api/vehicles/:id`, `GET /api/users/:id`, `GET /api/booking/:id`, `GET /api/containers/:id`, `GET /api/boats/:id`, `GET /api/transactions/:id`. Each should return full record with related data (e.g., vehicle with dealer info, booking with boat info). Response format: `{error: 0, success: true, data: {...}}`. Role-based access: users can only view their own records.

### T5.2 Build Car detail/inner page
- **Complexity:** High
- [x] **Status:** DONE ✅
- **Dependencies:** T5.1, T2.8
- **Description:** Create dedicated `/cars/:id` route and CarDetail component. Sections: Hero section with car image gallery, Vehicle info card (mark, model, year, VIN, lot, auction), Dealer/Buyer info card (dealer name, receiver, personal number, phone), Shipping info card (container, booking, line, ports, dates), Financial info card (vehicle price, total, paid, debt with visual indicators), Status timeline (purchase → warehouse → container → transit → arrived → delivered), Driver info section if applicable. Back button to return to cars list. Edit button (admin only). Related transactions list at bottom.

### T5.3 Build User detail/inner page
- **Complexity:** High
- [x] **Status:** DONE ✅
- **Dependencies:** T5.1, T2.5
- **Description:** Create dedicated `/users/:id` route and UserDetail component. Sections: User profile header (avatar initials, name, surname, email, username, phone, role badge), Financial summary card (balance, debt, supervisor fee), Account info (signup date, last login, last purchase date, calculator category, identity number, creator), User's vehicles table (paginated list of vehicles belonging to this dealer), User's transactions table, User's bookings table. Edit button (admin only). Back button to users list.

### T5.4 Implement VIN global search in Header
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T5.1
- **Description:** Make the Header "Search By VIN" input fully functional. On typing: debounced API call to `GET /api/vehicles?keyword={vin}&limit=10` to search across vehicles. Display dropdown results showing: car image thumbnail, mark/model/year, VIN, dealer name, status. On click: navigate to `/cars/:id` detail page. On Enter with exact VIN: navigate directly to matching car. Show "No results" state. Close dropdown on click outside. Support keyboard navigation (arrow keys + Enter).

### T5.5 Add VIN search API endpoint
- **Complexity:** Low
- [x] **Status:** DONE ✅
- **Dependencies:** T1.2
- **Description:** Create dedicated `GET /api/search?q={query}` endpoint that searches across vehicles by VIN, lot_number, mark, model, buyer name. Returns top 10 results with essential fields (id, vin, mark, model, year, profile_image_url, buyer, current_status). Optimized for quick typeahead responses. Uses existing vehicle indexes (idx_vehicles_vin).

---

## Phase 6: Incomplete Features Completion
**Goal:** Complete all partially implemented and placeholder features

### T6.1 Implement Booking Export functionality
- **Complexity:** Low
- [x] **Status:** DONE ✅
- **Dependencies:** T3.2
- **Description:** Implement the empty `handleExport()` function in Booking.jsx (currently has TODO comment). Reuse the same CSV export utility already working in Cars and Containers pages. Export all visible/filtered booking data with columns: VIN, Buyer, Booking, Line, Container, Delivery Location, Loading Port, dates, Terminal. Download as CSV file.

### T6.2 Build full Ticket/Support system
- **Complexity:** High
- [x] **Status:** DONE ✅
- **Dependencies:** T1.2, T1.7
- **Description:** Replace "Coming Soon" placeholder with full ticket system. Backend: Create `tickets` table (id, user_id, subject, message, status, priority, created_at, updated_at, resolved_at). API endpoints: `GET /api/tickets`, `POST /api/tickets`, `PUT /api/tickets/:id`, `DELETE /api/tickets/:id`. Frontend: Ticket list page with DataTable (ID, Subject, Status badge, Priority, Created Date, actions). Add new ticket form (subject, message, priority dropdown). Ticket detail view with message thread. Admin can change status (open/in_progress/resolved/closed). Users see only their own tickets.

### T6.3 Implement Private Code search on Login
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.3
- **Description:** Replace "Feature coming soon" alert with actual Private Code functionality on Login page. Private code = identity_number from users table. Create `POST /api/login/private-code` endpoint that accepts identity_number and returns limited vehicle tracking info (no auth required). Show results: list of user's vehicles with statuses, tracking timeline. This allows clients to check their car status without logging in.

### T6.4 Implement Reset Password flow
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.3
- **Description:** Implement password reset functionality. Backend: `POST /api/forgot-password` (accepts email, generates reset token, stores token with expiry in DB). `POST /api/reset-password` (accepts token + new password). Add `reset_token` and `reset_token_expires` columns to users table. Frontend: "Forgot Password" page with email input. "Reset Password" page (accessed via token link). Email sending via nodemailer or similar service. Token expiry: 1 hour.

### T6.5 Build Settings page
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.7
- **Description:** Create `/settings` route and Settings page accessed via header gear icon. Sections: Profile settings (edit own name, surname, email, phone), Notification preferences (if applicable), Language preference (persist to DB instead of just localStorage), Theme preference (future: dark mode toggle), App info (version, last update). Admin-only section: System settings, default calculator category, session timeout configuration.

---

## Phase 7: Advanced Features & Optimization
**Goal:** Performance improvements, advanced management features, and production readiness

### T7.1 Build dedicated Dashboard statistics endpoint
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T1.2
- **Description:** Create `GET /api/dashboard/stats` endpoint that returns all dashboard metrics in one call instead of 4 separate API calls. Response: `{total_vehicles, active_bookings, total_containers, total_boats, boats_in_transit, total_balance, total_debt, recent_transactions: [...], vehicles_by_status: {...}, monthly_revenue: [...]}`. Role-based: admin sees global stats, users see their own stats. Add database views or optimized queries for aggregations.

### T7.2 Implement User Balance & Debt management
- **Complexity:** High
- [x] **Status:** DONE ✅
- **Dependencies:** T5.3, T3.13
- **Description:** Expose and manage user financial fields (balance, debt, superviser_fee). Backend: `GET /api/users/:id/balance` (returns balance, debt, transaction history), `POST /api/users/:id/balance` (add/subtract from balance with reason). Frontend: Balance widget on User detail page showing current balance and debt. Transaction history specific to user. Balance adjustment form (admin only) with amount, type (credit/debit), and note. Auto-update debt when transactions are created.

### T7.3 Build Booking detail inner page
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T5.1, T3.2
- **Description:** Create `/booking/:id` route and BookingDetail component. Show: Booking info card (booking number, VIN, buyer, line, container), Shipping timeline (loaded → in transit → arrived → delivered with dates), Location info (loading port, delivery location, terminal), Related vehicle card (clickable link to car detail), Related boat info (if assigned), Container info. Edit button (admin). Back to booking list.

### T7.4 Build Container detail inner page
- **Complexity:** Medium
- [x] **Status:** DONE ✅
- **Dependencies:** T5.1, T3.5
- **Description:** Create `/containers/:id` route and ContainerDetail component. Show: Container info card (container number, status, dates), List of vehicles in this container (table with car links), Shipping route (loading port → destination, with boat info), Timeline (booked → loaded → in transit → received → opened), Related booking info. Edit button (admin). Back to containers list.

### T7.5 Build Boat detail inner page
- **Complexity:** Low
- [x] **Status:** DONE ✅
- **Dependencies:** T5.1, T3.8
- **Description:** Create `/boats/:id` route and BoatDetail component. Show: Boat info card (name, identification code, status badge), Voyage timeline (departure → estimated arrival → actual arrival), List of containers on this boat (table with links), List of bookings assigned to this boat. Status change controls (admin). Back to boats list.

### T7.6 Implement Bulk operations
- **Complexity:** High
- [x] **Status:** DONE ✅
- **Dependencies:** T2.1
- **Description:** Add multi-select capability to DataTable component (checkbox column). Backend: `DELETE /api/vehicles/bulk` (accepts array of IDs), `PUT /api/vehicles/bulk` (update status/field for multiple records). Same for booking, containers. Frontend: Select all / deselect all checkbox in table header. Bulk action bar appears when items selected (Delete Selected, Change Status, Export Selected). Confirmation dialog for bulk delete. Progress indicator for bulk operations.

### T7.7 Implement Audit Log system
- **Complexity:** High
- [x] **Status:** DONE ✅
- **Dependencies:** T1.2
- **Description:** Track all data changes for accountability. Backend: Create `audit_logs` table (id, user_id, entity_type, entity_id, action, old_values, new_values, ip_address, created_at). Middleware that automatically logs CREATE, UPDATE, DELETE operations. API: `GET /api/audit-logs` (admin only, paginated, filterable by entity, user, date range, action). Frontend: Audit Log page (admin only) with DataTable showing: Date, User, Action, Entity, Changes. Filter by date range, user, entity type. Detail modal showing old vs new values diff.

---

## Phase 8: Users & Cars Module Enhancements
**Goal:** მომხმარებლების მოდულის გაუმჯობესება, მანქანების გვერდის ახალი ფუნქციონალი

#### T8.1: Add address field to users
- [x] **Status:** DONE ✅
- **Complexity:** Low
- **Dependencies:** T2.4
- **Description:**
  - Add `address` column to users table (VARCHAR 500)
  - Update Users API endpoints (GET, POST, PUT) to include address
  - Add address input field to user create/edit form
  - Display address in user detail page

#### T8.2: Redesign Users table columns
- [x] **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T2.5, T8.1
- **Description:**
  - Change Users table columns to: ID, სახელი გვარი (Fullname), ტელეფონი (Phone), მეილი (Email), მანქანების რაოდენობა (Cars Count), როლი (Role)
  - Remove: Username, Sup. Fee, Last Login Date, Last Purchase Date columns
  - Add cars count - requires JOIN with vehicles table or subquery
  - Backend: Update GET /api/users to include vehicle_count for each user

#### T8.3: Add alternating row background colors to tables
- [x] **Status:** DONE ✅
- **Complexity:** Low
- **Dependencies:** T2.1
- **Description:**
  - Update DataTable component with zebra striping
  - Odd rows: white background (#FFFFFF)
  - Even rows: light gray background (#F8F9FA or similar)
  - Apply consistently across all tables (Users, Cars, Booking, etc.)

#### T8.4: Redesign table with full borders
- [x] **Status:** DONE ✅
- **Complexity:** Low
- **Dependencies:** T2.1
- **Description:**
  - Update DataTable component styling to show full table borders
  - Add vertical borders between columns (border-right on cells)
  - Add horizontal borders between rows
  - Table header with distinct border-bottom
  - Clean, professional spreadsheet-like appearance

#### T8.5: Implement ID document upload and verification
- [x] **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T2.6, T8.1
- **Description:**
  - Add `id_document_url` and `id_verified` columns to users table
  - Backend: `POST /api/users/:id/upload-id` - upload ID document image
  - Backend: `PUT /api/users/:id/verify` - admin endpoint to mark as verified
  - File storage in /static/documents/ with secure naming
  - Frontend: ID upload component in user form (drag-drop or file select)
  - Display verification status badge (✅ Verified / ⏳ Pending / ❌ Not uploaded)
  - Admin can view uploaded ID and approve/reject

#### T8.6: Add VIN and Lot copy buttons
- [x] **Status:** DONE ✅
- **Complexity:** Low
- **Dependencies:** T2.8
- **Description:**
  - Add copy-to-clipboard icon buttons next to VIN code in Cars table
  - Add copy-to-clipboard icon button next to Lot number
  - Use clipboard API (navigator.clipboard.writeText)
  - Show tooltip "Copied!" on success
  - Icon: small copy/clipboard SVG icon

#### T8.7: Add Hybrid/Electric vehicle type field
- [x] **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T2.9
- **Description:**
  - Add `fuel_type` column to vehicles table (ENUM: 'gasoline', 'diesel', 'hybrid', 'electric', 'plug_in_hybrid')
  - Update vehicle create/edit form with fuel type dropdown
  - Display fuel type badge in Cars table and detail page
  - Filter by fuel type in Cars filters

#### T8.8: Improve dealer selection with ID and name
- [x] **Status:** DONE ✅
- **Complexity:** Low
- **Dependencies:** T2.9
- **Description:**
  - Update dealer dropdown in car add/edit form
  - Show both ID and name: "[ID] - Name Surname" format
  - Searchable/filterable dropdown (use react-select or MUI Autocomplete)
  - Clear visual distinction between ID and name

#### T8.9: Remove buyer fields from vehicles
- [x] **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T2.7, T2.9
- **Description:**
  - Remove `buyer`, `buyer_phone`, `buyer_personal_number` fields from vehicles table
  - Update all vehicle API endpoints to exclude these fields
  - Remove buyer-related inputs from car add/edit form
  - Update Cars table to not show buyer column
  - Clean up any related frontend components

#### T8.10: Auto-uppercase dealer and receiver names
- [x] **Status:** DONE ✅
- **Complexity:** Low
- **Dependencies:** T2.9
- **Description:**
  - Apply CSS `text-transform: uppercase` to dealer name display
  - Apply same to receiver name field
  - Backend: Optionally store names in uppercase
  - Consistent uppercase display throughout the app

#### T8.11: Allow letters in personal number field (uppercase)
- [x] **Status:** DONE ✅
- **Complexity:** Low
- **Dependencies:** T2.9
- **Description:**
  - Update personal_number validation to accept letters + numbers
  - Auto-convert letters to uppercase on input
  - Frontend: Use input event to transform value to uppercase
  - Backend: Update validation regex to allow alphanumeric

#### T8.12: VIN code max length validation (17 characters)
- [x] **Status:** DONE ✅
- **Complexity:** Low
- **Dependencies:** T2.9
- **Description:**
  - Add maxLength="17" to VIN input field
  - Backend validation: reject VIN > 17 characters
  - Frontend: Show character counter (e.g., "12/17")
  - Display validation error if exceeded

#### T8.13: Remove booking field from vehicles
- [x] **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T2.7, T2.9
- **Description:**
  - Remove `booking_id` or booking reference from vehicles table
  - Update vehicle API endpoints
  - Remove booking dropdown from car add/edit form
  - Update Cars table columns

#### T8.14: Auto-update vehicle status on container status change
- [x] **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T3.4, T2.7
- **Description:**
  - Backend trigger/logic: When container status changes, update all vehicles in that container
  - Container statuses: pending → loaded → in_transit → arrived → delivered
  - Map container status to vehicle status appropriately
  - Use database trigger or API middleware
  - Log status changes in audit log

#### T8.15: Highlight last 6 digits of VIN in red
- [x] **Status:** DONE ✅
- **Complexity:** Low
- **Dependencies:** T2.8
- **Description:**
  - Create VinDisplay component that splits VIN: first 11 chars normal, last 6 chars in red (#DC3545)
  - Apply in Cars table VIN column
  - Apply in Car detail page VIN display
  - Apply in VIN search results

#### T8.16: Add comment field to vehicles
- [x] **Status:** DONE ✅
- **Complexity:** Low
- **Dependencies:** T2.7, T2.9
- **Description:**
  - Add `comment` column to vehicles table (TEXT)
  - Add textarea in car add/edit form
  - Display comment in car detail page (collapsible if long)
  - Optionally show truncated comment in table

#### T8.17: Add insurance options to vehicles
- [x] **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T2.7, T2.9
- **Description:**
  - Add `insurance_type` column to vehicles (ENUM: 'none', 'franchise', 'full')
  - Labels: "დაზღვევის გარეშე", "დაზღვევა ფრანშიზით", "დაზღვევა სრული"
  - Dropdown in car add/edit form
  - Display insurance status badge in table and detail page
  - Filter by insurance type

#### T8.18: Add driver information fields
- [x] **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T2.7, T2.9
- **Description:**
  - Add driver fields to vehicles: `driver_name`, `driver_phone`, `driver_id_number`
  - Section in car add/edit form: "მძღოლის ინფორმაცია"
  - Display driver info card in car detail page
  - Optional: Separate drivers table for reuse

---

## Phase 9: Containers, Ports & System Restructuring
**Goal:** პორტების სისტემა, კონტეინერების გაუმჯობესება, გემების მოდულის წაშლა

#### T9.1: Build Ports management page
- [x] **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T1.2, T3.4
- **Description:**
  - Create `ports` table (id, name, code, country, is_active, created_at)
  - API endpoints: GET/POST/PUT/DELETE /api/ports
  - Frontend: Ports page with DataTable (ID, Name, Code, Country, Status)
  - Add/edit port modal
  - This is where containers will be created and vehicles assigned

#### T9.2: Add container creation on Ports page
- [x] **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T9.1, T3.4
- **Description:**
  - Ports page shows containers per port
  - "Add Container" button on each port row
  - Container create modal: container number, status, dates
  - Container is associated with a specific port
  - View containers list per port with expand/collapse

#### T9.3: Add vehicle assignment to containers on Ports page
- [x] **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T9.2
- **Description:**
  - Container row shows "Add Vehicles" button
  - Vehicle assignment modal: Search/select vehicles by VIN
  - Multi-select checkboxes for bulk assignment
  - Show currently assigned vehicles in expandable row
  - Remove vehicle from container functionality

#### T9.4: Reorder Containers table - container name first
- [x] **Status:** DONE ✅
- **Complexity:** Low
- **Dependencies:** T3.5
- **Description:**
  - Move Container# (container name) to first column
  - Adjust other columns order accordingly
  - Update export to match new column order

#### T9.5: Remove Boats module entirely
- [x] **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T3.7, T3.8, T3.9
- **Description:**
  - Remove Boats page from frontend routing
  - Remove Boats link from sidebar navigation
  - Remove boats API endpoints (or deprecate)
  - Remove boat_id references from other tables if any
  - Keep boats table for data integrity but mark as deprecated
  - Update any booking/container forms that reference boats

#### T9.6: Add destination port to dealer's cars view
- [x] **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T9.1, T8.2
- **Description:**
  - Add `destination_port` field to vehicles (FK to ports)
  - Show destination port column in dealer's car list
  - Dropdown to select destination port in car form
  - Display port name in detail pages

---

## Phase 10: Dealer Dashboard & Invoice System
**Goal:** დილერის დეშბორდის გაუმჯობესება, ინვოისის გენერაცია, საჯარო გვერდები

#### T10.1: Simplify dealer's car table view
- [x] **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T8.9, T8.13
- **Description:**
  - Remove columns from dealer view: სახელი (name), ნომერი (number), ბუქინგი (booking)
  - Remove financial columns (Total, Debt, Paid) from dealer's table view
  - Show only essential columns for dealer: Image, Vehicle, VIN, Container, Status, Destination Port

#### T10.2: Add overdue days column (red) to dealer table
- [x] **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T10.1
- **Description:**
  - Calculate overdue days: current_date - expected_delivery_date (if positive)
  - Add `overdue_days` column to dealer's car table
  - Display in red color (#DC3545) if > 0
  - Sort by overdue days option
  - Backend: Calculate on-the-fly or store in DB

#### T10.3: Add port viewing for dealers
- [x] **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T9.1
- **Description:**
  - Allow dealers to view Ports page (read-only)
  - Show containers and vehicles in ports
  - No create/edit/delete permissions for dealers
  - Add Ports link to dealer sidebar
  - Filter to show only ports with dealer's vehicles

#### T10.4: Add admin-to-dealer messaging
- [x] **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T6.2
- **Description:**
  - Create `messages` table (id, from_user_id, to_user_id, subject, body, read_at, created_at)
  - Admin can send message to any dealer from their profile page
  - Dealer sees messages in dashboard or dedicated Messages page
  - Notification indicator for unread messages
  - Mark as read on view
  - Reply functionality (optional)

#### T10.5: Build public car tracking page
- [x] **Status:** DONE ✅
- **Complexity:** Medium
- **Dependencies:** T5.2, T6.3
- **Description:**
  - Public route: `/track/:vin` or `/public/car/:id`
  - No authentication required
  - Show: Car image, mark/model/year, VIN, current status, timeline
  - Limited information compared to authenticated view
  - Can be shared via link

#### T10.6: Add logo watermark to car images
- [ ] **Status:** IN_PROGRESS 🔄
- **Complexity:** High
- **Dependencies:** T10.5
- **Description:**
  - Backend: Image processing on upload (using sharp or jimp)
  - Apply Royal Motors logo watermark to all car images
  - Position: bottom-right corner, semi-transparent
  - Store watermarked version separately or replace original
  - Watermark on public page images

#### T10.7: Dealer's car form - receiver data or ID upload
- [x] **Status:** DONE ✅
- **Complexity:** High
- **Dependencies:** T8.5, T2.9
- **Description:**
  - When dealer adds a car, show two options:
    - Option 1: Enter receiver details manually (name, phone, personal number)
    - Option 2: Upload receiver's ID document
  - Toggle between the two modes
  - If ID uploaded, extract/enter data manually after viewing
  - Store receiver info in vehicles table

#### T10.8: Add clickable container link in tables
- [ ] **Status:** IN_PROGRESS 🔄
- **Complexity:** Low
- **Dependencies:** T7.4
- **Description:**
  - In Cars table and other places showing container info
  - Make container number a clickable link
  - Navigate to container detail page on click
  - Style as link (blue, underline on hover)

#### T10.9: Build Invoice generation for vehicles
- [ ] **Status:** TODO
- **Complexity:** High
- **Dependencies:** T5.2, T7.2
- **Description:**
  - Backend: `GET /api/vehicles/:id/invoice` - generate PDF invoice
  - Use pdfkit or puppeteer for PDF generation
  - Invoice includes: Vehicle details, dealer info, pricing breakdown
  - Add "Download Invoice" button on car detail page
  - Store generated invoices in /static/invoices/

#### T10.10: Build Invoice generation for transportation
- [ ] **Status:** TODO
- **Complexity:** High
- **Dependencies:** T10.9
- **Description:**
  - Separate invoice type for transportation/shipping
  - Include: Shipping costs, container fees, port fees
  - `GET /api/vehicles/:id/invoice/transport`
  - "Transportation Invoice" button on car detail page
  - Different template than vehicle invoice

#### T10.11: Add dealer dashboard invoice section
- [ ] **Status:** TODO
- **Complexity:** Medium
- **Dependencies:** T10.9, T10.10
- **Description:**
  - Dealer can view and download invoices for their cars
  - Invoice history list in dealer dashboard
  - Filter by date, vehicle, type
  - Download as PDF

#### T10.12: Add files section to car detail page
- [ ] **Status:** TODO
- **Complexity:** High
- **Dependencies:** T5.2
- **Description:**
  - Create `vehicle_files` table (id, vehicle_id, file_name, file_url, file_type, uploaded_by, created_at)
  - API: GET/POST/DELETE /api/vehicles/:id/files
  - Upload multiple files per vehicle (documents, photos, etc.)
  - Display files section in car detail page
  - Download/view file functionality
  - Admin can upload/delete, dealer can view/download
  - File types: PDF, images, documents

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
**Total Tasks**: 89
**Completed**: 87 🟩🟩🟩🟩🟩🟩🟩🟩🟩 (98%)
**In Progress**: 2
**TODO**: 0
**Blocked**: 0

### Phase Progress
- 🟢 Phase 1: Foundation & Authentication → 8/8 (100%) ✅
- 🔵 Phase 2: Core Data Management → 11/11 (100%) ✅
- 🟣 Phase 3: Logistics & Finance → 15/15 (100%) ✅
- 🟠 Phase 4: Polish, Testing & Deployment → 8/8 (100%) ✅
- 🔴 Phase 5: Detail Pages & Core Missing → 5/5 (100%) ✅
- 🟤 Phase 6: Incomplete Features → 5/5 (100%) ✅
- ⚪ Phase 7: Advanced Features & Optimization → 7/7 (100%) ✅
- 🔶 Phase 8: Users & Cars Module Enhancements → 18/18 (100%) ✅
- ✅ Phase 9: Containers, Ports & System Restructuring → 6/6 (100%)
- 🟣 Phase 10: Dealer Dashboard & Invoice System → 6/12 (50%) - T10.8 in progress


### Current Focus
🎯 **Current Task:** T10.8 - Add clickable container link in tables
📅 **Phase:** 10 - Dealer Dashboard & Invoice System
📊 **Progress:** 50% (6/12)
✅ **Last Completed:** T10.7 - Dealer's car form - receiver data or ID upload

---

## Summary

| Metric | Count |
|--------|-------|
| Total Phases | 10 |
| Total Tasks | 89 |
| Completed | 83 |
| TODO | 6 |
| High Complexity | 22 |
| Medium Complexity | 38 |
| Low Complexity | 29 |
