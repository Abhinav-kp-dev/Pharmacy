-- MedOS Database Schema
-- Pharmacy Management System

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table (referenced by medicines)
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Manufacturers table
CREATE TABLE IF NOT EXISTS manufacturers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    country TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medicines table
CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_id INTEGER,
    manufacturer_id INTEGER,
    quantity INTEGER DEFAULT 0,
    price REAL NOT NULL,
    expiry_date DATE,
    supplier_id INTEGER,
    batch_number TEXT,
    reorder_level INTEGER DEFAULT 15,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
    phone TEXT,
    email TEXT,
    address TEXT,
    last_visit DATE,
    total_purchases INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sales/Invoices table
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id TEXT UNIQUE NOT NULL,
    patient_id INTEGER,
    total_amount REAL NOT NULL,
    discount REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    net_amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'Cash' CHECK(payment_method IN ('Cash', 'Card', 'UPI', 'Credit')),
    status TEXT DEFAULT 'Completed' CHECK(status IN ('Completed', 'Pending', 'Cancelled')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Sale Items (line items for each sale)
CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    medicine_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- Stock Transactions (for tracking inventory changes)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('IN', 'OUT', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL,
    reference_type TEXT, -- 'SALE', 'PURCHASE', 'RETURN', 'EXPIRED'
    reference_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- Purchase Orders (for restocking)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_number TEXT UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,
    total_amount REAL,
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Ordered', 'Received', 'Cancelled')),
    order_date DATE DEFAULT CURRENT_DATE,
    expected_date DATE,
    received_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_id INTEGER NOT NULL,
    medicine_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost REAL,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    reference_type TEXT,
    reference_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category_id);
CREATE INDEX IF NOT EXISTS idx_medicines_supplier ON medicines(supplier_id);
CREATE INDEX IF NOT EXISTS idx_medicines_expiry ON medicines(expiry_date);
CREATE INDEX IF NOT EXISTS idx_sales_patient ON sales(patient_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_stock_medicine ON stock_transactions(medicine_id);

-- Views for common queries
CREATE VIEW IF NOT EXISTS v_medicine_details AS
SELECT 
    m.id,
    m.medicine_id,
    m.name,
    c.name as category,
    mf.name as manufacturer,
    m.quantity,
    m.price,
    m.expiry_date,
    s.name as supplier,
    m.reorder_level,
    CASE 
        WHEN m.quantity = 0 THEN 'Out of Stock'
        WHEN m.quantity < m.reorder_level THEN 'Low Stock'
        WHEN date(m.expiry_date) < date('now') THEN 'Expired'
        WHEN date(m.expiry_date) < date('now', '+60 days') THEN 'Expiring Soon'
        ELSE 'In Stock'
    END as stock_status
FROM medicines m
LEFT JOIN categories c ON m.category_id = c.id
LEFT JOIN manufacturers mf ON m.manufacturer_id = mf.id
LEFT JOIN suppliers s ON m.supplier_id = s.id;

CREATE VIEW IF NOT EXISTS v_sales_summary AS
SELECT 
    s.id,
    s.invoice_id,
    p.name as patient_name,
    p.patient_id,
    s.total_amount,
    s.net_amount,
    s.payment_method,
    s.status,
    s.created_at,
    COUNT(si.id) as item_count
FROM sales s
LEFT JOIN patients p ON s.patient_id = p.id
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id;

CREATE VIEW IF NOT EXISTS v_low_stock AS
SELECT * FROM v_medicine_details
WHERE quantity < reorder_level OR quantity = 0;

CREATE VIEW IF NOT EXISTS v_expiring_soon AS
SELECT * FROM v_medicine_details
WHERE date(expiry_date) BETWEEN date('now') AND date('now', '+60 days');
