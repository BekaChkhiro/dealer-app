# Royal Motors Portal — სრული სპეციფიკაცია (კლონისთვის)

---

## 1. ტექნოლოგიური სტეკი

### Frontend
- **Framework:** React (SPA — Single Page Application)
- **UI Library:** Bootstrap 5 + Material UI (MUI — პაგინაციისთვის)
- **Routing:** React Router (client-side)
- **HTTP Client:** Axios (`Accept: application/json, text/plain, */*`)
- **Icons:** SVG icons (sidebar-ში)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Session:** express-session (`connect.sid` cookie)
- **Database:** სავარაუდოდ MySQL/PostgreSQL (auto-increment ID-ები)
- **File Storage:** `/static/cars/`, `/static/icons/`

---

## 2. Design System

### ფერთა პალიტრა

| ელემენტი | ფერი | HEX |
|----------|------|-----|
| Sidebar background | `rgb(49, 58, 70)` | **#313A46** |
| Sidebar active link | `rgb(114, 124, 245)` | **#727CF5** |
| Sidebar text | `rgb(255, 255, 255)` | **#FFFFFF** |
| Header background | `rgb(255, 255, 255)` | **#FFFFFF** |
| Header shadow | `rgba(154, 161, 171, 0.15)` | — |
| Body background | `rgb(255, 255, 255)` | **#FFFFFF** |
| Body text | `rgb(33, 37, 41)` | **#212529** |
| Button Primary | `rgb(13, 110, 253)` | **#0D6EFD** (Bootstrap blue) |
| Table header bg | `rgb(246, 249, 251)` | **#F6F9FB** |
| Table border | `rgb(222, 226, 230)` | **#DEE2E6** |
| Input border | `rgb(222, 226, 230)` | **#DEE2E6** |
| Pagination selected | `rgba(0, 0, 0, 0.08)` | — |
| Content area bg | `rgb(243, 244, 249)` | **#F3F4F9** (ღია ნაცრისფერი) |

### ფონტები

| გამოყენება | Font Family |
|-----------|-------------|
| Primary | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| MUI components | `Roboto, Helvetica, Arial, sans-serif` |

### ტიპოგრაფია

| ელემენტი | Size | Weight |
|----------|------|--------|
| Body text | 16px | 400 |
| Page title (h2) | 22px | 500 |
| Table header | 12px | 700 |
| Table cell | 12px | 400 |
| Button | 16px | 400 |
| Sidebar link | 16px | 400 |
| Pagination | 14px | — |

### კომპონენტების ზომები

| კომპონენტი | ზომა |
|-----------|------|
| Sidebar width | **270px** |
| Header height | **70px** |
| Input height | 38px |
| Button padding | 6px 12px |
| Button border-radius | 6px |
| Input border-radius | 6px |
| Pagination item | 32px x 32px, border-radius: 16px |
| Search bar width | 250px |
| Logo | 100px x 40px |

---

## 3. Layout სტრუქტურა

```
+------------------------------------------------------------------+
|  HEADER (70px, white, shadow)                                      |
|  [hamburger] [Search By VIN] ................. [Lang] [Settings] [User] |
+----------+-------------------------------------------------------+
|          |                                                         |
| SIDEBAR  |  CONTENT AREA (bg: #F3F4F9)                           |
| (270px)  |                                                         |
| #313A46  |  [Page Title h2]                                       |
|          |                                                         |
| [logo]   |  [Filters] [Export] [+ Add New]    [Search input]      |
| Dashboard|                                                         |
| Users    |  +---TABLE (full width)---+                             |
| Booking  |  | Header (bg: #F6F9FB)  |                             |
| Cars     |  | Row 1                 |                              |
| Container|  | Row 2                 |                              |
| Boats    |  | Row 3          [...] |                              |
| Calculator|  +----------------------+                              |
| Transact.|                                                         |
| Ticket   |  [Showing X of Y  ToTal: Z  Show: [10▾]]    [< 1 2 >] |
| Change PW|                                                         |
| Log Out  |                                                         |
+----------+-------------------------------------------------------+
```

### Login Page Layout
```
+------------------------------------------------------------------+
|  BACKGROUND: Container port aerial photo (full screen)            |
|                                                                    |
|              +---CARD (510px, dark semi-transparent)---+           |
|              |  "Authorization"                         |           |
|              |  Username / Email                        |           |
|              |  [input: Enter username or email]        |           |
|              |  [input: Enter password] [eye icon]      |           |
|              |  [====== Log In (blue) ======]           |           |
|              |                         Reset Password   |           |
|              |           OR                             |           |
|              |  Search by Private Key                   |           |
|              |  [input: Search by your private code]    |           |
|              |  [====== Search (green) ======]          |           |
|              +----------------------------------------+            |
+------------------------------------------------------------------+
```

---

## 4. გვერდების დეტალური სპეციფიკაცია

---

### 4.0 Login Page (`/`)
**ანავტორიზებული მომხმარებლისთვის**

**ვიზუალი:**
- Full-screen background: კონტეინერების პორტის ფოტო (aerial view)
- ცენტრში: ნახევრად გამჭვირვალე მუქი card (510px wide)
- სათაური: "Authorization"

**ელემენტები:**
1. **Username/Email input** — `placeholder="Enter username or email"`, `type="text"`, `class="form-control"`
2. **Password input** — `type="password"`, `placeholder="Enter password"`, eye icon (toggle visibility)
3. **Log In button** — `class="btn-primary"`, `type="submit"`, full width, blue
4. **Reset Password** — link, right-aligned
5. **"OR" separator**
6. **Private code search input** — `placeholder="Search by your private code"`, `class="form-control"`
7. **Search button** — `class="btn-success"`, green

**API:** `POST /api/login` — `{"user": "...", "password": "..."}`

---

### 4.1 Dashboard (`/`)
**ავტორიზებული მომხმარებლისთვის**

**ამჟამად:** ცარიელი, მხოლოდ "Dashboard" სათაური

**რეკომენდებული ფუნქციონალი (თუ სრული ვერსია გინდა):**
- სულ მანქანები, აქტიური ბუქინგები, კონტეინერები (stat cards)
- ჯამური ვალი, გადახდილი თანხა
- გემების სტატუსი
- ბოლო ტრანზაქციები

**API:** `GET /api/user`

---

### 4.2 Users (`/users`)
**მომხმარებელთა მართვა**

**ელემენტები:**
- Page title: "Users" (h2)
- **+ Add New** button (btn-primary)
- **Search** input (placeholder="Search")
- ცხრილი
- პაგინაცია + Show dropdown (10/20/30/50)

**ცხრილის სვეტები:**
| # | სვეტი | API field | ტიპი |
|---|-------|-----------|------|
| 1 | ID | id | number |
| 2 | Fullname | name + surname | string |
| 3 | Email | email | string |
| 4 | Username | username | string |
| 5 | Sup. Fee | superviser_fee | number ($) |
| 6 | Last Login Date | last_login_time | datetime |
| 7 | Last Purchase Date | last_purchase_date | datetime/null |
| 8 | Role | role | "admin" / "user" |
| 9 | (...) menu | — | actions |

**Three-dot menu (სავარაუდო):** Edit, Delete

**API:**
- `GET /api/users?limit=10&page=1&keyword=&asc=desc&calculator_category=&role=&sort_by=id`
- Response: `{error: 0, success: true, data: [...], total: N}`

**User object fields:**
```json
{
  "id": 1,
  "name": "Irakli",
  "surname": "Lipartiani",
  "email": "iliparteliani@gmail.com",
  "username": "irakli-lip",
  "balance": 0,
  "phone": "0000000",
  "calculator_category": "A",
  "role": "admin",
  "identity_number": "000000000",
  "signup_date": "2025-04-18T00:00:00.000Z",
  "last_login_time": "2026-02-13T11:01:36.000Z",
  "last_purchase_date": null,
  "superviser_fee": 100,
  "creator": "irakli-lip",
  "debt": 0
}
```

---

### 4.3 Booking (`/booking`)
**ბუქინგების/შიპინგის ტრეკინგი**

**ელემენტები:**
- Page title: "Booking"
- **Filters** button (btn-primary, icon: filter)
- **Export** button (btn-primary, icon: download)
- **+ Add New** button (btn-primary)
- Search input
- ცხრილი + პაგინაცია

**ცხრილის სვეტები (12):**
| # | სვეტი | API field |
|---|-------|-----------|
| 1 | VIN | vin |
| 2 | Buyer | buyer_fullname |
| 3 | Booking | booking_number |
| 4 | Line | line |
| 5 | Container | container |
| 6 | Delivery Location | delivery_location |
| 7 | Loading Port | loading_port |
| 8 | Container Loaded Date | container_loaded_date |
| 9 | Container Receive Date | container_receive_date |
| 10 | Terminal | terminal |
| 11 | Estimated Opening Date | est_opening_date |
| 12 | Opening Date | open_date |
| 13 | (...) menu | — |

**API:**
- `GET /api/booking?limit=10&page=1&keyword=&asc=desc&start_date=&end_date=&sort_by=id&loading_port=&line=`
- `GET /api/vin-codes/booking` — VIN dropdown-ისთვის
- `GET /api/containers-list/booking` — Container dropdown-ისთვის
- `GET /api/boats?limit=50&page=1&keyword=&asc=desc&status=us_port&sort_by=id` — Boat dropdown-ისთვის

**Filters params:** start_date, end_date, loading_port, line

---

### 4.4 Cars (`/cars`) — მთავარი გვერდი
**მანქანების მართვა**

**ელემენტები:**
- Page title: "Cars"
- **Filters** button
- **Export** button
- **+ Add New** button
- Search input
- ცხრილი (thumbnails-ით) + პაგინაცია

**ცხრილის სვეტები (16):**
| # | სვეტი | API field |
|---|-------|-----------|
| 1 | Image | profile_image_url |
| 2 | Dealer | buyer (name + surname from user) |
| 3 | Purchase Date | purchase_date |
| 4 | Vehicle Name | mark + model + year |
| 5 | VIN | vin |
| 6 | Buyer | receiver_fullname |
| 7 | Personal Number | receiver_identity_number |
| 8 | Phone | receiver_phone |
| 9 | Container | container_number |
| 10 | Booking | booking |
| 11 | Line | line |
| 12 | Auction | auction |
| 13 | State | us_state |
| 14 | Paid | payed_amount |
| 15 | Total | total_price |
| 16 | Debt | debt_amount |
| 17 | (...) menu | — |

**Image:** Thumbnail ~60x45px, loaded from `/static/cars/{filename}`

**API:**
- `GET /api/vehicles?limit=10&page=1&auction=&keyword=&asc=desc&start_date=&end_date=&sort_by=id&line=&status=&paid=`
- `GET /api/users?limit=500&page=1&...` — dealer dropdown-ისთვის
- `GET /api/cities` — ქალაქების dropdown-ისთვის

**Vehicle object (სრული — 40+ field):**
```json
{
  "id": 17,
  "buyer": "nata darsalia",
  "dealer_id": "6",
  "receiver_fullname": "",
  "receiver_identity_number": "",
  "mark": "MERCEDES-BENZ",
  "model": "E-Class",
  "year": "2019",
  "vin": "WDDZF4JBXKA553402",
  "lot_number": "51387465",
  "auction": "Copart",
  "receiver_phone": null,
  "us_state": "NV-LAS VEGAS WEST",
  "destination_port": "Poti",
  "us_port": "Port of CA California",
  "is_sublot": 1,
  "is_fully_paid": 0,
  "is_partially_paid": 1,
  "is_funded": 0,
  "is_insured": 1,
  "doc_type": "SALVAGE",
  "container_cost": 1500,
  "landing_cost": 500,
  "vehicle_price": 17250,
  "total_price": 2223,
  "payed_amount": 17250,
  "debt_amount": 2223,
  "create_date": "2025-06-25T00:00:00.000Z",
  "container_number": "MEDU8764800",
  "line": "MSC",
  "current_status": "arrived",
  "vehicle_pickup_date": "2025-06-25T00:00:00.000Z",
  "warehouse_receive_date": "2025-06-25T00:00:00.000Z",
  "container_loading_date": "2025-06-25T00:00:00.000Z",
  "estimated_receive_date": "2025-06-25T00:00:00.000Z",
  "receive_date": null,
  "booking": "EBKG12878173",
  "dealer_fee": 100,
  "status_color": "red",
  "buyer_number": "425638",
  "has_key": 1,
  "profile_image_url": "/static/cars/1750877198503_51387465_Image_1.jpg",
  "has_auction_image": 1,
  "has_transportation_image": 1,
  "has_port_image": 1,
  "has_poti_image": 1,
  "is_hybrid": 0,
  "vehicle_type": "sedan",
  "container_open_date": "2025-06-25T00:00:00.000Z",
  "container_receive_date": null,
  "receiver_changed": null,
  "receiver_change_date": null,
  "driver_fullname": null,
  "driver_phone": null,
  "driver_car_license_number": null,
  "purchase_date": "2025-05-28T00:00:00.000Z",
  "driver_company": null,
  "late_car_payment": 0
}
```

---

### 4.5 Containers (`/containers`)
**კონტეინერების ტრეკინგი**

**ელემენტები:** Filters, Export, + Add New, Search, Table, Pagination

**ცხრილის სვეტები (14):**
| # | სვეტი | API field |
|---|-------|-----------|
| 1 | VIN | vin |
| 2 | Container# | container_number |
| 3 | Purchase Date | purchase_date |
| 4 | Vehicle Name | manufacturer + model + manufacturer_year |
| 5 | Buyer | buyer_name |
| 6 | Booking | booking |
| 7 | Delivery Location | delivery_location |
| 8 | Container Open Date | container_open_date |
| 9 | Lines | line |
| 10 | Personal Number | personal_number |
| 11 | Lot/Stock | lot_number |
| 12 | Loading Port | loading_port |
| 13 | Container Loaded Date | container_loaded_date |
| 14 | Container Receive Date | container_receive_date |
| 15 | (...) menu | — |

**Container object:**
```json
{
  "id": 4,
  "container_number": "MEDU8764800",
  "vin": "WDDZF4JBXKA553402",
  "purchase_date": "2025-05-28T00:00:00.000Z",
  "manufacturer": "MERCEDES-BENZ",
  "model": "E-Class",
  "manufacturer_year": "2019",
  "buyer_name": "nata darsalia",
  "booking": "EBKG12878173",
  "delivery_location": "BATUMI",
  "container_open_date": null,
  "line": "MSC",
  "personal_number": "01008023001",
  "lot_number": "51387465",
  "loading_port": "Port of CA California",
  "container_loaded_date": null,
  "container_receive_date": null,
  "boat_id": "123",
  "boat_name": "CAPE TAINARO",
  "user_id": "6",
  "status": "booked"
}
```

**API:**
- `GET /api/containers?limit=10&page=1&keyword=&asc=desc&start_date=&end_date=&sort_by=id&status=`
- `GET /api/vin-codes/booking?type=containers`
- `GET /api/boats?limit=50&page=1&keyword=&asc=desc&status=us_port&sort_by=id`

---

### 4.6 Boats (`/boats`)
**გემების ტრეკინგი**

**ელემენტები:** + Add New, Search, Table, Pagination
**(Filters და Export არ აქვს)**

**ცხრილის სვეტები (7):**
| # | სვეტი | API field |
|---|-------|-----------|
| 1 | ID | id |
| 2 | Name | name |
| 3 | Identification Code | identification_code |
| 4 | Est. Departure Date | departure_date |
| 5 | Est. Arrival Date | estimated_arrival_date |
| 6 | Arrival Date | arrival_date |
| 7 | Status | status |
| 8 | (...) menu | — |

**Status values:** `us_port` (მხოლოდ ეს ჩანს, სავარაუდოდ: `in_transit`, `arrived`, `delivered`)

**API:** `GET /api/boats?limit=10&page=1&keyword=&asc=desc&status=&sort_by=id`

---

### 4.7 Calculator (`/calculator`)
**ტრანსპორტირების ფასების კალკულატორი — 401 ჩანაწერი**

**ელემენტები:**
- **Price By Port** button (btn-primary) — სპეციალური ფილტრი
- **+ Add New** button
- Search input
- ცხრილი + პაგინაცია (41 გვერდი)

**ცხრილის სვეტები (7):**
| # | სვეტი | API field |
|---|-------|-----------|
| 1 | Auction | auction |
| 2 | City | city |
| 3 | Destination | destination |
| 4 | Land Price | land_price |
| 5 | Container Price | container_price |
| 6 | Total | total_price |
| 7 | Port | port |
| 8 | (...) menu | — |

**API:**
- `GET /api/calculator?limit=10&page=1&keyword=&auction=&port=`
- `GET /api/cities` (Cars გვერდისთვისაც)

---

### 4.8 Transactions (`/transactions`)
**გადახდების ისტორია**

**ელემენტები:** + Add New, Search, Table, Pagination
**(Filters და Export არ აქვს)**

**ცხრილის სვეტები (10):**
| # | სვეტი | API field |
|---|-------|-----------|
| 1 | ID | id |
| 2 | Payed ID | payer |
| 3 | Date | create_date |
| 4 | VIN | vin |
| 5 | Mark | mark |
| 6 | Model | model |
| 7 | Year | year |
| 8 | Personal Number | personal_number |
| 9 | Amount | paid_amount |
| 10 | Payment Type | payment_type |
| 11 | (...) menu | — |

**Payment types:** `car_amount` (სავარაუდოდ: `shipping`, `customs`, `balance`)

**API:** `GET /api/transactions?limit=10&page=1&keyword=&asc=desc&start_date=&end_date=&sort_by=id`

---

### 4.9 Ticket (`/ticket`)
**მხარდაჭერის ბილეთები — არ არის დასრულებული**

მხოლოდ sidebar და header ჩანს, content area ცარიელია.

**API:** `GET /api/user` (მხოლოდ)

---

### 4.10 Change Password (`/change-password`)
**პაროლის შეცვლა**

**ვიზუალი:** ცენტრში ილუსტრაცია (ბოქლომების სურათი), ფორმა ქვემოთ

**ელემენტები:**
1. ილუსტრაცია: `/static/icons/change-pass.webp`
2. სათაური: "Change Password" (h3)
3. **Old Password** input — `type="password"`, `placeholder="Enter old password"`, eye icon
4. **New Password** input — `type="password"`, `placeholder="Enter new password"`, eye icon
5. **Repeat Password** input — `type="password"`, `placeholder="Enter repear password"`, eye icon
6. **Submit** button — btn-primary, full width

**API:** სავარაუდოდ `POST /api/change-password`

---

## 5. Global Header კომპონენტი

```
[≡ Hamburger] [Search By VIN  🔍] ................. [🇬🇪 ქართ ▾] [⚙] [IL irakli-lip iliparteliani...]
```

| ელემენტი | აღწერა |
|----------|--------|
| Hamburger (≡) | Sidebar-ის toggle (collapse/expand) |
| Search By VIN | Global ძებნა VIN ნომრით, width: 250px |
| Language dropdown | ქართული/ინგლისური, საქართველოს დროშა |
| Settings icon | ⚙ gear icon |
| User info | Avatar (initials circle) + username + email |

---

## 6. Sidebar კომპონენტი

**Width:** 270px
**Background:** #313A46 (მუქი ნაცრისფერი-ლურჯი)
**Padding:** 25px 0

| # | Icon | Label | URL |
|---|------|-------|-----|
| — | logo.png | Royal Motors | / |
| 1 | 🏠 | Dashboard | / |
| 2 | 👥 | Users | /users |
| 3 | 📄 | Booking | /booking |
| 4 | 🚗 | Cars | /cars |
| 5 | 📦 | Containers | /containers |
| 6 | 🚢 | Boats | /boats |
| 7 | 🧮 | Calculator | /calculator |
| 8 | 💳 | Transactions | /transactions |
| 9 | 💬 | Ticket | /ticket |
| 10 | 🔑 | Change Password | /change-password |
| 11 | 🚪 | Log Out | (action) |

**Active state:** background: #727CF5 (ლურჯ-იასამნისფერი)
**Logo:** `/static/icons/logo.png` (100x40px, მანქანის სილუეტი წითელი ხაზით)

---

## 7. საერთო კომპონენტები (Reusable)

### 7.1 Data Table
- Header row: bg #F6F9FB, font 12px bold, border-bottom
- Data rows: font 12px, padding 8px, border-bottom #DEE2E6
- Last column: three-dot menu (...)
- Row hover: light highlight

### 7.2 Pagination Bar
```
[Showing X of Y    ToTal: Z    Show: [10▾]]                    [< 1 2 3 ... N >]
```
- Left: info text + show dropdown (10/20/30/50)
- Right: MUI Pagination (circular buttons, 32x32px)

### 7.3 Action Buttons Bar
```
                                    [Filters] [Export] [+ Add New]    [Search 🔍]
```
- Filters: btn-primary + filter icon (არ არის ყველა გვერდზე)
- Export: btn-primary + download icon (არ არის ყველა გვერდზე)
- Add New: btn-primary
- Search: input with search icon

### 7.4 ღილაკების ცხრილი (რომელ გვერდზე რა ღილაკებია)

| გვერდი | Filters | Export | + Add New | Price By Port | Submit |
|--------|---------|--------|-----------|---------------|--------|
| Users | - | - | + | - | - |
| Booking | + | + | + | - | - |
| Cars | + | + | + | - | - |
| Containers | + | + | + | - | - |
| Boats | - | - | + | - | - |
| Calculator | - | - | + | + | - |
| Transactions | - | - | + | - | - |
| Change PW | - | - | - | - | + |

---

## 8. API Endpoint-ების სრული სია

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | `{user, password}` → session cookie |

### Read (GET)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user` | Current user info |
| GET | `/api/users` | Users list (paginated) |
| GET | `/api/vehicles` | Cars list (paginated) |
| GET | `/api/booking` | Bookings list (paginated) |
| GET | `/api/containers` | Containers list (paginated) |
| GET | `/api/containers-list/booking` | Containers dropdown |
| GET | `/api/boats` | Boats list (paginated) |
| GET | `/api/calculator` | Calculator prices (paginated) |
| GET | `/api/cities` | Cities with prices |
| GET | `/api/transactions` | Transactions list (paginated) |
| GET | `/api/vin-codes/booking` | VIN codes for dropdowns |

### Write (სავარაუდო — ვერ დავადასტურეთ)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create user |
| POST | `/api/vehicles` | Create vehicle |
| POST | `/api/booking` | Create booking |
| POST | `/api/containers` | Create container |
| POST | `/api/boats` | Create boat |
| POST | `/api/calculator` | Create calculator entry |
| POST | `/api/transactions` | Create transaction |
| POST | `/api/change-password` | Change password |
| PUT | `/api/users/:id` | Update user |
| PUT | `/api/vehicles/:id` | Update vehicle |
| PUT | `/api/booking/:id` | Update booking |
| PUT | `/api/containers/:id` | Update container |
| PUT | `/api/boats/:id` | Update boat |
| PUT | `/api/calculator/:id` | Update calculator entry |
| DELETE | `/api/users/:id` | Delete user |
| DELETE | `/api/vehicles/:id` | Delete vehicle |
| DELETE | `/api/booking/:id` | Delete booking |
| DELETE | `/api/containers/:id` | Delete container |
| DELETE | `/api/boats/:id` | Delete boat |

### Common Query Parameters (GET lists)
| Param | Type | Values | Description |
|-------|------|--------|-------------|
| limit | int | 10, 20, 30, 50 | Items per page |
| page | int | 1+ | Page number |
| keyword | string | any | Search text |
| asc | string | "asc", "desc" | Sort direction |
| sort_by | string | "id" | Sort field |
| start_date | string | ISO date | Date filter start |
| end_date | string | ISO date | Date filter end |

### Response Format
```json
{
  "error": 0,
  "success": true,
  "data": [...],
  "total": 123
}
```

---

## 9. Static Files

| Path | Description |
|------|-------------|
| `/static/icons/logo.png` | Royal Motors logo (100x40) |
| `/static/icons/change-pass.webp` | Change password illustration |
| `/static/cars/{timestamp}_{id}_{name}.{jpg,jpeg}` | Car images |

---

## 10. Role-based Access

| Feature | admin | user |
|---------|-------|------|
| Dashboard | + | + |
| Users (view/manage) | + | ? |
| Booking | + | + |
| Cars | + | + |
| Containers | + | + |
| Boats | + | + |
| Calculator | + | + |
| Transactions | + | + |
| Ticket | + | + |
| Change Password | + | + |
| Add/Edit/Delete | + | ? |

---

## 11. Database Schema (სავარაუდო)

### users
```sql
id, name, surname, email, username, password_hash, balance, phone,
calculator_category, role, identity_number, signup_date, last_login_time,
last_purchase_date, superviser_fee, creator, debt
```

### vehicles
```sql
id, buyer, dealer_id, receiver_fullname, receiver_identity_number,
mark, model, year, vin, lot_number, auction, receiver_phone,
us_state, destination_port, us_port, is_sublot, is_fully_paid,
is_partially_paid, is_funded, is_insured, doc_type, container_cost,
landing_cost, vehicle_price, total_price, payed_amount, debt_amount,
create_date, container_number, line, current_status, vehicle_pickup_date,
warehouse_receive_date, container_loading_date, estimated_receive_date,
receive_date, booking, dealer_fee, status_color, buyer_number, has_key,
profile_image_url, has_auction_image, has_transportation_image,
has_port_image, has_poti_image, is_hybrid, vehicle_type,
container_open_date, container_receive_date, receiver_changed,
receiver_change_date, driver_fullname, driver_phone,
driver_car_license_number, purchase_date, driver_company, late_car_payment
```

### booking
```sql
id, vin, buyer_fullname, booking_number, booking_paid, container,
container_loaded_date, container_receiver, container_receive_date,
container_released, delivery_location, estimated_arrival_date, line,
open_date, est_opening_date, loading_port, terminal, car_details,
lot_number, user_id, create_date, boat_id, boat_name
```

### containers
```sql
id, container_number, vin, purchase_date, manufacturer, model,
manufacturer_year, buyer_name, booking, delivery_location,
container_open_date, line, personal_number, lot_number, loading_port,
container_loaded_date, container_receive_date, boat_id, boat_name,
user_id, status
```

### boats
```sql
id, name, identification_code, departure_date, estimated_arrival_date,
arrival_date, status
```

### calculator
```sql
id, auction, city, destination, land_price, container_price, total_price, port
```

### transactions
```sql
id, payer, create_date, vin, mark, model, year, buyer,
personal_number, paid_amount, payment_type, addToBalanseAmount
```
