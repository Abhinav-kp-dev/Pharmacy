-- Seed Data for MedOS Database

-- Insert Default Users (passwords are plain text for demo - use hashing in production)
INSERT INTO users (username, password, name, email, role, status) VALUES
('admin', 'admin123', 'System Administrator', 'admin@medos.in', 'admin', 'Active'),
('staff1', 'staff123', 'Anil Kumar', 'anil@medos.in', 'staff', 'Active'),
('staff2', 'staff123', 'Meera Prakash', 'meera@medos.in', 'staff', 'Active');

-- Insert Suppliers
INSERT INTO suppliers (supplier_id, name, contact_person, phone, email, status) VALUES
('SUP001', 'MedSupply Co.', 'Rajan Pillai', '04872-220011', 'orders@medsupply.in', 'Active'),
('SUP002', 'PharmaDist Ltd.', 'Anita Joseph', '04872-331122', 'supply@pharmadist.in', 'Active'),
('SUP003', 'GlobalPharma', 'Suresh Nair', '04872-442233', 'biz@globalpharma.in', 'Active'),
('SUP004', 'NutriCorp', 'Meera Das', '04872-553344', 'info@nutricorp.in', 'Inactive');

-- Insert Categories
INSERT INTO categories (name, description) VALUES
('Antibiotic', 'Medicines that fight bacterial infections'),
('Analgesic', 'Pain relievers and fever reducers'),
('Antidiabetic', 'Medicines for diabetes management'),
('Cardiac', 'Cardiovascular medications'),
('Antiallergic', 'Allergy relief medications'),
('Antacid', 'Stomach acid neutralizers'),
('Supplement', 'Vitamins and dietary supplements');

-- Insert Manufacturers
INSERT INTO manufacturers (name, country) VALUES
('Sun Pharma', 'India'),
('Cipla', 'India'),
('Dr. Reddys', 'India'),
('Torrent', 'India'),
('Mankind', 'India'),
('Zydus', 'India'),
('Himalaya', 'India'),
('Abbott', 'USA');

-- Insert Medicines
INSERT INTO medicines (medicine_id, name, category_id, manufacturer_id, quantity, price, expiry_date, supplier_id, reorder_level) VALUES
('MED001', 'Amoxicillin 500mg', 1, 1, 240, 12.50, '2026-08-15', 1, 15),
('MED002', 'Paracetamol 650mg', 2, 2, 12, 4.00, '2025-12-01', 2, 15),
('MED003', 'Metformin 500mg', 3, 3, 180, 8.75, '2026-03-20', 1, 15),
('MED004', 'Atorvastatin 10mg', 4, 4, 5, 22.00, '2025-11-10', 3, 15),
('MED005', 'Cetirizine 10mg', 5, 5, 320, 6.50, '2027-01-30', 2, 15),
('MED006', 'Omeprazole 20mg', 6, 6, 0, 9.00, '2026-06-14', 1, 15),
('MED007', 'Azithromycin 250mg', 1, 1, 95, 18.00, '2025-10-05', 3, 15),
('MED008', 'Losartan 50mg', 4, 2, 150, 14.25, '2026-09-22', 1, 15),
('MED009', 'Vitamin D3 1000IU', 7, 7, 8, 32.00, '2027-03-11', 4, 15),
('MED010', 'Ibuprofen 400mg', 2, 8, 200, 7.50, '2026-12-31', 2, 15);

-- Insert Patients
INSERT INTO patients (patient_id, name, age, gender, phone, email, last_visit, total_purchases) VALUES
('PAT001', 'Rahul Sharma', 45, 'Male', '9876543210', 'rahul@email.com', '2026-03-01', 12),
('PAT002', 'Priya Nair', 32, 'Female', '9812345678', 'priya@email.com', '2026-03-05', 7),
('PAT003', 'Arun Menon', 58, 'Male', '9823456789', 'arun@email.com', '2026-02-28', 24),
('PAT004', 'Sneha Thomas', 27, 'Female', '9834567890', 'sneha@email.com', '2026-03-06', 3),
('PAT005', 'Vijay Kumar', 67, 'Male', '9845678901', 'vijay@email.com', '2026-03-04', 31);

-- Insert Sample Sales
INSERT INTO sales (invoice_id, patient_id, total_amount, discount, tax, net_amount, payment_method, status, created_at) VALUES
('INV202603001', 1, 150.00, 0, 0, 150.00, 'Cash', 'Completed', '2026-03-01 09:30:00'),
('INV202603002', 2, 87.50, 5, 0, 82.50, 'UPI', 'Completed', '2026-03-02 11:15:00'),
('INV202603003', 3, 220.00, 0, 0, 220.00, 'Card', 'Completed', '2026-03-03 14:20:00'),
('INV202603004', 5, 165.75, 10, 0, 155.75, 'Cash', 'Completed', '2026-03-04 10:45:00'),
('INV202603005', 2, 95.00, 0, 0, 95.00, 'UPI', 'Completed', '2026-03-05 16:00:00'),
('INV202603006', 4, 44.00, 0, 0, 44.00, 'Cash', 'Completed', '2026-03-06 09:15:00'),
('INV202603007', 1, 125.00, 0, 0, 125.00, 'Card', 'Completed', '2026-03-07 09:12:00');

-- Insert Sale Items
INSERT INTO sale_items (sale_id, medicine_id, quantity, unit_price, total_price) VALUES
(1, 1, 10, 12.50, 125.00),
(1, 2, 5, 4.00, 20.00),
(1, 10, 1, 7.50, 7.50),
(2, 3, 10, 8.75, 87.50),
(3, 4, 10, 22.00, 220.00),
(4, 8, 10, 14.25, 142.50),
(4, 5, 3, 6.50, 19.50),
(5, 7, 5, 18.00, 90.00),
(5, 2, 1, 4.00, 4.00),
(6, 4, 2, 22.00, 44.00),
(7, 1, 10, 12.50, 125.00);

-- Insert Activity Log
INSERT INTO activity_log (action_type, description, reference_type, reference_id, created_at) VALUES
('SALE', 'Bill #INV202603007 generated for Rahul Sharma', 'SALE', 7, '2026-03-07 09:12:00'),
('ALERT', 'Low stock alert: Atorvastatin 10mg (5 units)', 'MEDICINE', 4, '2026-03-07 09:05:00'),
('PATIENT', 'New patient registered: Sneha Thomas', 'PATIENT', 4, '2026-03-07 08:50:00'),
('STOCK', 'Restock received: Amoxicillin 500mg (+200)', 'MEDICINE', 1, '2026-03-07 08:33:00'),
('ALERT', 'Expiry alert: Azithromycin 250mg (Oct 2025)', 'MEDICINE', 7, '2026-03-07 08:15:00');

-- Insert Stock Transactions
INSERT INTO stock_transactions (medicine_id, transaction_type, quantity, reference_type, reference_id, notes, created_at) VALUES
(1, 'IN', 200, 'PURCHASE', NULL, 'Initial stock', '2026-03-01 08:00:00'),
(1, 'OUT', 10, 'SALE', 1, 'Sale INV202603001', '2026-03-01 09:30:00'),
(1, 'OUT', 10, 'SALE', 7, 'Sale INV202603007', '2026-03-07 09:12:00'),
(2, 'IN', 50, 'PURCHASE', NULL, 'Initial stock', '2026-03-01 08:00:00'),
(2, 'OUT', 5, 'SALE', 1, 'Sale INV202603001', '2026-03-01 09:30:00'),
(3, 'OUT', 10, 'SALE', 2, 'Sale INV202603002', '2026-03-02 11:15:00');
