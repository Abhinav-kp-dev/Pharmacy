import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://abhinavkp2233_db_user:abhinav@cluster0.i9euyc2.mongodb.net/pharmacore?appName=Cluster0&retryWrites=true&w=majority";

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Atlas connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// ─── SCHEMAS ─────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: String,
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  last_login: Date,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const supplierSchema = new mongoose.Schema({
  supplier_id: { type: String, unique: true },
  name: { type: String, required: true },
  contact_person: String,
  phone: String,
  email: String,
  address: String,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const categorySchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  description: String,
}, { timestamps: { createdAt: 'created_at' } });

const manufacturerSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  country: String,
}, { timestamps: { createdAt: 'created_at' } });

const medicineSchema = new mongoose.Schema({
  medicine_id: { type: String, unique: true },
  name: { type: String, required: true },
  category: String,
  manufacturer: String,
  quantity: { type: Number, default: 0 },
  price: { type: Number, required: true },
  expiry_date: String,
  supplier: String,
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  batch_number: String,
  reorder_level: { type: Number, default: 15 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const patientSchema = new mongoose.Schema({
  patient_id: { type: String, unique: true },
  name: { type: String, required: true },
  age: Number,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  phone: String,
  email: String,
  address: String,
  last_visit: String,
  total_purchases: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const saleItemSchema = new mongoose.Schema({
  medicine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  medicine_name: String,
  category: String,
  quantity: Number,
  unit_price: Number,
  total_price: Number,
});

const saleSchema = new mongoose.Schema({
  invoice_id: { type: String, unique: true },
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patient_name: String,
  items: [saleItemSchema],
  total_amount: Number,
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  net_amount: Number,
  payment_method: { type: String, enum: ['Cash', 'Card', 'UPI', 'Credit'], default: 'Cash' },
  status: { type: String, enum: ['Completed', 'Pending', 'Cancelled'], default: 'Completed' },
  prescription_url: String,
  notes: String,
}, { timestamps: { createdAt: 'created_at' } });

const stockTransactionSchema = new mongoose.Schema({
  medicine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  medicine_name: String,
  transaction_type: { type: String, enum: ['IN', 'OUT', 'ADJUSTMENT'] },
  quantity: Number,
  reference_type: String,
  reference_id: mongoose.Schema.Types.ObjectId,
  notes: String,
}, { timestamps: { createdAt: 'created_at' } });

const activityLogSchema = new mongoose.Schema({
  action_type: String,
  description: String,
  reference_type: String,
  reference_id: mongoose.Schema.Types.ObjectId,
}, { timestamps: { createdAt: 'created_at' } });

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: String,
}, { timestamps: { updatedAt: 'updated_at' } });

const restockRequestSchema = new mongoose.Schema({
  medicine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  medicine_name: String,
  requested_quantity: { type: Number, required: true },
  current_stock: Number,
  requested_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requested_by_name: String,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  notes: String,
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewed_by_name: String,
  reviewed_at: Date,
  review_notes: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// ─── MODELS ──────────────────────────────────────────────────
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);
export const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
export const Manufacturer = mongoose.models.Manufacturer || mongoose.model('Manufacturer', manufacturerSchema);
export const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);
export const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema);
export const Sale = mongoose.models.Sale || mongoose.model('Sale', saleSchema);
export const StockTransaction = mongoose.models.StockTransaction || mongoose.model('StockTransaction', stockTransactionSchema);
export const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
export const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
export const RestockRequest = mongoose.models.RestockRequest || mongoose.model('RestockRequest', restockRequestSchema);

// ─── SEED ────────────────────────────────────────────────────
export async function seedDatabase() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('🌱 Database already seeded, skipping.');
    return;
  }
  console.log('🌱 Seeding database...');

  // Users
  await User.insertMany([
    { username: 'admin', password: 'admin123', name: 'System Administrator', email: 'admin@medos.in', role: 'admin', status: 'Active' },
    { username: 'staff1', password: 'staff123', name: 'Anil Kumar', email: 'anil@medos.in', role: 'staff', status: 'Active' },
    { username: 'staff2', password: 'staff123', name: 'Meera Prakash', email: 'meera@medos.in', role: 'staff', status: 'Active' },
  ]);

  // Suppliers
  const supDocs = await Supplier.insertMany([
    { supplier_id: 'SUP001', name: 'MedSupply Co.', contact_person: 'Rajan Pillai', phone: '04872-220011', email: 'orders@medsupply.in', status: 'Active' },
    { supplier_id: 'SUP002', name: 'PharmaDist Ltd.', contact_person: 'Anita Joseph', phone: '04872-331122', email: 'supply@pharmadist.in', status: 'Active' },
    { supplier_id: 'SUP003', name: 'GlobalPharma', contact_person: 'Suresh Nair', phone: '04872-442233', email: 'biz@globalpharma.in', status: 'Active' },
    { supplier_id: 'SUP004', name: 'NutriCorp', contact_person: 'Meera Das', phone: '04872-553344', email: 'info@nutricorp.in', status: 'Inactive' },
  ]);

  // Medicines
  await Medicine.insertMany([
    { medicine_id: 'MED001', name: 'Amoxicillin 500mg', category: 'Antibiotic', manufacturer: 'Sun Pharma', quantity: 240, price: 12.50, expiry_date: '2026-08-15', supplier: supDocs[0].name, supplier_id: supDocs[0]._id, reorder_level: 15 },
    { medicine_id: 'MED002', name: 'Paracetamol 650mg', category: 'Analgesic', manufacturer: 'Cipla', quantity: 12, price: 4.00, expiry_date: '2025-12-01', supplier: supDocs[1].name, supplier_id: supDocs[1]._id, reorder_level: 15 },
    { medicine_id: 'MED003', name: 'Metformin 500mg', category: 'Antidiabetic', manufacturer: 'Dr. Reddys', quantity: 180, price: 8.75, expiry_date: '2026-03-20', supplier: supDocs[0].name, supplier_id: supDocs[0]._id, reorder_level: 15 },
    { medicine_id: 'MED004', name: 'Atorvastatin 10mg', category: 'Cardiac', manufacturer: 'Torrent', quantity: 5, price: 22.00, expiry_date: '2025-11-10', supplier: supDocs[2].name, supplier_id: supDocs[2]._id, reorder_level: 15 },
    { medicine_id: 'MED005', name: 'Cetirizine 10mg', category: 'Antiallergic', manufacturer: 'Mankind', quantity: 320, price: 6.50, expiry_date: '2027-01-30', supplier: supDocs[1].name, supplier_id: supDocs[1]._id, reorder_level: 15 },
    { medicine_id: 'MED006', name: 'Omeprazole 20mg', category: 'Antacid', manufacturer: 'Zydus', quantity: 0, price: 9.00, expiry_date: '2026-06-14', supplier: supDocs[0].name, supplier_id: supDocs[0]._id, reorder_level: 15 },
    { medicine_id: 'MED007', name: 'Azithromycin 250mg', category: 'Antibiotic', manufacturer: 'Sun Pharma', quantity: 95, price: 18.00, expiry_date: '2025-10-05', supplier: supDocs[2].name, supplier_id: supDocs[2]._id, reorder_level: 15 },
    { medicine_id: 'MED008', name: 'Losartan 50mg', category: 'Cardiac', manufacturer: 'Cipla', quantity: 150, price: 14.25, expiry_date: '2026-09-22', supplier: supDocs[0].name, supplier_id: supDocs[0]._id, reorder_level: 15 },
    { medicine_id: 'MED009', name: 'Vitamin D3 1000IU', category: 'Supplement', manufacturer: 'Himalaya', quantity: 8, price: 32.00, expiry_date: '2027-03-11', supplier: supDocs[3].name, supplier_id: supDocs[3]._id, reorder_level: 15 },
    { medicine_id: 'MED010', name: 'Ibuprofen 400mg', category: 'Analgesic', manufacturer: 'Abbott', quantity: 200, price: 7.50, expiry_date: '2026-12-31', supplier: supDocs[1].name, supplier_id: supDocs[1]._id, reorder_level: 15 },
  ]);

  // Patients
  await Patient.insertMany([
    { patient_id: 'PAT001', name: 'Rahul Sharma', age: 45, gender: 'Male', phone: '9876543210', email: 'rahul@email.com', last_visit: '2026-03-01', total_purchases: 12 },
    { patient_id: 'PAT002', name: 'Priya Nair', age: 32, gender: 'Female', phone: '9812345678', email: 'priya@email.com', last_visit: '2026-03-05', total_purchases: 7 },
    { patient_id: 'PAT003', name: 'Arun Menon', age: 58, gender: 'Male', phone: '9823456789', email: 'arun@email.com', last_visit: '2026-02-28', total_purchases: 24 },
    { patient_id: 'PAT004', name: 'Sneha Thomas', age: 27, gender: 'Female', phone: '9834567890', email: 'sneha@email.com', last_visit: '2026-03-06', total_purchases: 3 },
    { patient_id: 'PAT005', name: 'Vijay Kumar', age: 67, gender: 'Male', phone: '9845678901', email: 'vijay@email.com', last_visit: '2026-03-04', total_purchases: 31 },
  ]);

  // Activity Log
  await ActivityLog.insertMany([
    { action_type: 'SALE', description: 'Bill #INV202603007 generated for Rahul Sharma', reference_type: 'SALE', createdAt: new Date('2026-03-07T09:12:00') },
    { action_type: 'ALERT', description: 'Low stock alert: Atorvastatin 10mg (5 units)', reference_type: 'MEDICINE', createdAt: new Date('2026-03-07T09:05:00') },
    { action_type: 'PATIENT', description: 'New patient registered: Sneha Thomas', reference_type: 'PATIENT', createdAt: new Date('2026-03-07T08:50:00') },
    { action_type: 'STOCK', description: 'Restock received: Amoxicillin 500mg (+200)', reference_type: 'MEDICINE', createdAt: new Date('2026-03-07T08:33:00') },
    { action_type: 'ALERT', description: 'Expiry alert: Azithromycin 250mg (Oct 2025)', reference_type: 'MEDICINE', createdAt: new Date('2026-03-07T08:15:00') },
  ]);

  // Settings
  await Settings.insertMany([
    { key: 'pharmacy_name', value: 'MedOS' },
    { key: 'pharmacy_address', value: 'MG Road, Thrissur, Kerala 680001' },
    { key: 'pharmacy_phone', value: '0487-2220011' },
    { key: 'pharmacy_email', value: 'info@medos.in' },
    { key: 'gst_number', value: '32AABCP1234Z1ZV' },
    { key: 'license_number', value: 'KL/TRS/PHY/2024/001' },
  ]);

  console.log('✅ Database seeded successfully');
}
