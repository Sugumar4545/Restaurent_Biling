# Restaurant POS System

A real-time Point of Sale (POS) system for restaurant/hotel businesses built with React, Node.js, Express, PostgreSQL, and Socket.io.

## Features

### Module A: Waiter Mobile Interface
- Table selection grid (10 tables)
- Category-based menu browsing with search
- Add to cart with special instructions
- Dine-in / Parcel order types
- Real-time "Send to Kitchen" via Socket.io

### Module B: Kitchen Display System (KDS)
- Digital ticket cards with Order ID, Table #, Items, Time Elapsed
- "Start Preparing" and "Mark Ready" actions
- Real-time order notifications with sound alerts
- Color-coded status indicators (Red=Pending, Yellow=Preparing, Green=Ready)

### Module C: Customer Waiting Dashboard
- Full-screen split display (optimized for TV/Tablet)
- Left panel: "Preparing" orders
- Right panel: "Ready for Pickup" orders
- Real-time updates via Socket.io

### Module D: Admin Panel
- **Billing**: Convert orders to invoices, apply tax/discounts, PDF invoice generation
- **Inventory**: CRUD for menu items, stock management, low-stock alerts, auto-deduction
- **Staff Management**: Worker CRUD, role-based management, attendance tracking
- **Reports**: Daily sales summary, top selling items chart, category breakdown, hourly trends

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Real-Time | Socket.io |

## Database Schema

### menu_items
| Field | Type | Description |
|-------|------|-------------|
| name | VARCHAR(255) | Item name |
| price | DECIMAL(10,2) | Price |
| category | VARCHAR(100) | Category |
| stock_quantity | INTEGER | Stock count |
| is_available | BOOLEAN | Availability |

### orders
| Field | Type | Description |
|-------|------|-------------|
| order_id | VARCHAR(50) | Unique order ID |
| table_number | INTEGER | Table number |
| status | VARCHAR(20) | Pending/Preparing/Ready/Paid/Cancelled |
| total_amount | DECIMAL(10,2) | Subtotal |
| order_type | VARCHAR(20) | dine-in/parcel |

### workers
| Field | Type | Description |
|-------|------|-------------|
| name | VARCHAR(255) | Worker name |
| role | VARCHAR(50) | Admin/Staff/Chef/Waiter |
| phone | VARCHAR(20) | Phone number |
| joining_date | DATE | Join date |

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Sugumar4545/Restaurent_Biling.git
cd Restaurent_Biling
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Setup PostgreSQL database**
```bash
# Create the database
createdb pos_system

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your PostgreSQL credentials
```

4. **Run migrations and seed data**
```bash
npm run migrate
npm run seed
```

5. **Start the application**
```bash
npm run dev
```

### Access Points
- **Waiter Interface**: http://localhost:3000/
- **Kitchen Display**: http://localhost:3000/kitchen
- **Customer Dashboard**: http://localhost:3000/customer
- **Admin Panel**: http://localhost:3000/admin
- **API Server**: http://localhost:5000

## API Endpoints

### Menu
- `GET /api/menu` - List all menu items
- `GET /api/menu/categories` - List categories
- `POST /api/menu` - Create menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item
- `PATCH /api/menu/:id/stock` - Update stock

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/active` - Active orders
- `PATCH /api/orders/:orderId/status` - Update status
- `POST /api/orders/:orderId/bill` - Generate bill

### Workers
- `GET /api/workers` - List workers
- `POST /api/workers` - Add worker
- `PUT /api/workers/:id` - Update worker
- `DELETE /api/workers/:id` - Delete worker

### Reports
- `GET /api/reports/daily-sales` - Daily sales summary
- `GET /api/reports/top-selling` - Top selling items
- `GET /api/reports/by-category` - Sales by category
- `GET /api/reports/hourly` - Hourly sales

### Socket.io Events
- `NEW_ORDER` - Waiter sends new order to kitchen
- `ORDER_STATUS_UPDATE` - Kitchen updates order status
- `ORDER_READY` - Kitchen marks order as ready

## License
MIT
