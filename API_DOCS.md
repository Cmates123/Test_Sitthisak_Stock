# Inventory Management System — API Documentation

## Base URL
```
http://localhost:3000
```

## Headers
All requests that send a body must include:
```
Content-Type: application/json
```

---

## 1. ER Diagram — Database Schema (Google Sheets)

Data is stored in a Google Spreadsheet with **3 sheet tabs** acting as tables.

### Sheet Structure

```
┌────────────────────────────────────────┐
│   Sheet Tab: "Categories"              │
├────────────────────────────────────────┤
│ A: id           UUID (PK)             │
│ B: name         String (unique)       │
│ C: description  String?               │
│ D: createdAt    ISO 8601 Date         │
└──────────────────┬─────────────────────┘
                   │  1 : Many  (categoryId FK)
                   ▼
┌────────────────────────────────────────┐
│   Sheet Tab: "Products"               │
├────────────────────────────────────────┤
│ A: id            UUID (PK)            │
│ B: name          String               │
│ C: sku           String (unique)      │
│ D: costPrice     Number ≥ 0           │
│ E: stockQuantity Number ≥ 0           │
│ F: categoryId    UUID (FK)            │
│ G: categoryName  String (denormalized)│
│ H: createdAt     ISO 8601 Date        │
│ I: updatedAt     ISO 8601 Date        │
└──────────────────┬─────────────────────┘
                   │  1 : Many  (productId FK)
                   ▼
┌────────────────────────────────────────┐
│   Sheet Tab: "StockTransactions"      │
├────────────────────────────────────────┤
│ A: id          UUID (PK)              │
│ B: productId   UUID (FK)              │
│ C: productName String (denormalized)  │
│ D: type        "IN" | "OUT"           │
│ E: quantity    Number ≥ 1             │
│ F: reason      String                 │
│ G: createdAt   ISO 8601 Date          │
└────────────────────────────────────────┘
```

**Relationships:**
- `Categories` → `Products`: One-to-Many (one category has many products)
- `Products` → `StockTransactions`: One-to-Many (one product has many transactions)

> Row 1 of each tab contains column headers. Data starts at row 2.

---

## 2. API Endpoints

### 2.1 POST /api/products
Create a new product and save it to the database.

**Request**
```
POST /api/products
Content-Type: application/json
```

**Request Body**
```json
{
  "name": "Mechanical Keyboard",
  "sku": "KB-001",
  "costPrice": 1500.00,
  "stockQuantity": 20,
  "categoryId": "665f1a2b3c4d5e6f7a8b9c0d"
}
```

| Field           | Type   | Required | Description                          |
|-----------------|--------|----------|--------------------------------------|
| `name`          | string | ✅       | Product display name                 |
| `sku`           | string | ✅       | Stock Keeping Unit (must be unique)  |
| `costPrice`     | number | ✅       | Cost price in THB (≥ 0)              |
| `stockQuantity` | number | ❌       | Initial stock count (default: 0)     |
| `categoryId`    | string | ✅       | UUID of the category (from GET /api/categories) |

**Response — 201 Created**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Mechanical Keyboard",
    "sku": "KB-001",
    "costPrice": 1500,
    "stockQuantity": 20,
    "category": {
      "id": "f1e2d3c4-b5a6-7890-fedc-ba9876543210",
      "name": "IT"
    },
    "createdAt": "2026-05-13T08:00:00.000Z",
    "updatedAt": "2026-05-13T08:00:00.000Z"
  }
}
```

**Error Responses**

| Status | Error | Cause |
|--------|-------|-------|
| `400`  | `"name, sku, costPrice, and categoryId are required"` | Missing required fields |
| `400`  | `"costPrice must be a non-negative number"` | Negative cost price |
| `404`  | `"Category not found"` | Invalid `categoryId` |
| `409`  | `"SKU already exists"` | Duplicate SKU |
| `500`  | `"Internal server error"` | Database error |

```json
// 409 Conflict example
{
  "success": false,
  "error": "SKU already exists"
}
```

---

### 2.2 PATCH /api/stock/adjust
Adjust stock quantity for a product. Positive values = Stock IN, negative = Stock OUT.
Always records a transaction history entry. Will reject if adjustment causes stock to go below 0.

**Request**
```
PATCH /api/stock/adjust
Content-Type: application/json
```

**Request Body**
```json
{
  "productId": "665f1b3c4d5e6f7a8b9c0d1e",
  "adjustment": -5,
  "reason": "Sold to customer #1042"
}
```

| Field       | Type   | Required | Description                                    |
|-------------|--------|----------|------------------------------------------------|
| `productId` | string | ✅       | MongoDB ObjectId of the product                |
| `adjustment`| number | ✅       | Non-zero integer. `+10` = add, `-5` = deduct   |
| `reason`    | string | ✅       | Short description of reason for adjustment     |

**Response — 200 OK**
```json
{
  "success": true,
  "data": {
    "productId": "665f1b3c4d5e6f7a8b9c0d1e",
    "name": "Mechanical Keyboard",
    "sku": "KB-001",
    "previousStock": 20,
    "adjustment": -5,
    "newStock": 15
  }
}
```

**Error Responses**

| Status | Error | Cause |
|--------|-------|-------|
| `400`  | `"productId, adjustment, and reason are required"` | Missing fields |
| `400`  | `"adjustment must be a non-zero number"` | Zero or non-numeric adjustment |
| `404`  | `"Product not found"` | Invalid `productId` |
| `422`  | `"Insufficient stock. Current: 3, adjustment: -5"` | Result would go below 0 |
| `500`  | `"Internal server error"` | Database error |

```json
// 422 Unprocessable Entity example
{
  "success": false,
  "error": "Insufficient stock. Current: 3, adjustment: -5"
}
```

---

### 2.3 GET /api/products/low-stock
Returns all products with stock quantity below the threshold (default: 5 units).

**Request**
```
GET /api/products/low-stock
GET /api/products/low-stock?threshold=10
```

| Query Param  | Type   | Required | Default | Description                       |
|--------------|--------|----------|---------|-----------------------------------|
| `threshold`  | number | ❌       | `5`     | Low-stock cutoff (exclusive, `< threshold`) |

**Response — 200 OK**
```json
{
  "success": true,
  "threshold": 5,
  "count": 2,
  "data": [
    {
      "_id": "665f1b3c4d5e6f7a8b9c0d1e",
      "name": "USB-C Cable",
      "sku": "USBC-001",
      "costPrice": 120,
      "stockQuantity": 0,
      "categoryId": {
        "_id": "665f1a2b3c4d5e6f7a8b9c0d",
        "name": "IT"
      },
      "createdAt": "2026-05-13T08:00:00.000Z",
      "updatedAt": "2026-05-13T09:00:00.000Z"
    },
    {
      "_id": "665f2c4d5e6f7a8b9c0d1e2f",
      "name": "Sticky Notes Pack",
      "sku": "SN-003",
      "costPrice": 45,
      "stockQuantity": 3,
      "categoryId": {
        "_id": "665f3e5f6a7b8c9d0e1f2a3b",
        "name": "Office Supply"
      },
      "createdAt": "2026-05-12T10:00:00.000Z",
      "updatedAt": "2026-05-13T07:30:00.000Z"
    }
  ]
}
```

**Response when all stock is sufficient**
```json
{
  "success": true,
  "threshold": 5,
  "count": 0,
  "data": []
}
```

**Error Responses**

| Status | Error | Cause |
|--------|-------|-------|
| `500`  | `"Internal server error"` | Database error |

---

## 3. Supporting Endpoints

### GET /api/products
Returns all products with category populated.

```
GET /api/products
```

**Response — 200 OK**
```json
{
  "success": true,
  "data": [ /* array of Product objects */ ]
}
```

---

### GET /api/categories
Returns all categories.

```
GET /api/categories
```

### POST /api/categories
Creates a new category.

```
POST /api/categories
Content-Type: application/json
```

```json
{
  "name": "IT",
  "description": "Information Technology equipment"
}
```

**Response — 201 Created**
```json
{
  "success": true,
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c0d",
    "name": "IT",
    "description": "Information Technology equipment",
    "createdAt": "2026-05-13T08:00:00.000Z"
  }
}
```

---

## 4. Standard Response Format

All responses follow this envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Human-readable error message" }
```

## 5. HTTP Status Codes Summary

| Code | Meaning |
|------|---------|
| `200` | OK — request succeeded |
| `201` | Created — resource created successfully |
| `400` | Bad Request — missing or invalid fields |
| `404` | Not Found — resource does not exist |
| `409` | Conflict — duplicate unique value (SKU, category name) |
| `422` | Unprocessable Entity — business rule violation (negative stock) |
| `500` | Internal Server Error — unexpected server failure |

---

## 6. Setup & Quick Start

### Step 1 — Google Cloud Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google Sheets API**
4. Create a **Service Account** and download the JSON key

### Step 2 — Google Spreadsheet
1. Create a new Google Spreadsheet
2. Share it with the **service account email** (Editor permission)
3. Copy the Spreadsheet ID from the URL:
   `docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`

### Step 3 — Environment Variables
Edit `.env`:
```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
SPREADSHEET_ID=your_spreadsheet_id_here
```

### Step 4 — Run
```bash
npm install
npm run dev
```

The app auto-creates the 3 sheet tabs with headers on first API call.

### Quick Test with curl
```bash
# Create a category
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"IT","description":"IT Equipment"}'

# Create a product (replace <categoryId> with id from above)
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Keyboard","sku":"KB-001","costPrice":1500,"stockQuantity":10,"categoryId":"<categoryId>"}'

# Adjust stock
curl -X PATCH http://localhost:3000/api/stock/adjust \
  -H "Content-Type: application/json" \
  -d '{"productId":"<productId>","adjustment":-3,"reason":"Sold to customer"}'

# Get low stock
curl http://localhost:3000/api/products/low-stock
```
