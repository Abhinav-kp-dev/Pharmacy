import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  connectDB, seedDatabase,
  User, Supplier, Medicine, Patient, Sale,
  StockTransaction, ActivityLog, Settings, RestockRequest
} from './database/index.js';
import { sendRestockAlert, sendLowStockWarning } from './services/emailService.js';

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS Configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/prescriptions'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// ═══════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required' });

    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    if (user.status === 'Inactive')
      return res.status(403).json({ error: 'Account is inactive. Contact administrator.' });

    user.last_login = new Date();
    await user.save();

    res.json({
      success: true,
      user: { id: user._id, username: user.username, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// UPLOADS
// ═══════════════════════════════════════════════════════════

app.post('/api/upload-prescription', upload.single('prescription'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: `/uploads/prescriptions/${req.file.filename}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// USERS (admin only)
// ═══════════════════════════════════════════════════════════

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ role: 1, name: 1 });
    res.json(users.map(u => ({
      id: u._id, username: u.username, name: u.name, email: u.email,
      role: u.role, status: u.status, last_login: u.last_login, created_at: u.created_at
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, password, name, email, role } = req.body;
    if (!username || !password || !name || !role)
      return res.status(400).json({ error: 'Username, password, name and role are required' });

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    const user = await User.create({ username, password, name, email, role });
    res.status(201).json({ id: user._id, username, name, email, role, status: 'Active' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, role, status, password } = req.body;
    const update = { name, email, role, status };
    if (password) update.password = password;
    await User.findByIdAndUpdate(req.params.id, update);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    const user = await User.findById(req.params.id);
    if (user?.role === 'admin' && adminCount <= 1)
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// MEDICINES
// ═══════════════════════════════════════════════════════════

app.get('/api/medicines', async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.json(medicines.map(m => ({
      id: m._id, medicine_id: m.medicine_id, name: m.name, category: m.category,
      manufacturer: m.manufacturer, qty: m.quantity, price: m.price,
      expiry: m.expiry_date, supplier: m.supplier, reorder_level: m.reorder_level
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/medicines/:id', async (req, res) => {
  try {
    const m = await Medicine.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Medicine not found' });
    res.json({
      id: m._id, medicine_id: m.medicine_id, name: m.name, category: m.category,
      manufacturer: m.manufacturer, qty: m.quantity, price: m.price,
      expiry: m.expiry_date, supplier: m.supplier
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/medicines', async (req, res) => {
  try {
    const { name, category, manufacturer, qty, price, expiry, supplier } = req.body;
    const count = await Medicine.countDocuments();
    const medicine_id = 'MED' + String(count + 1).padStart(3, '0');

    const sup = supplier ? await Supplier.findOne({ name: supplier }) : null;

    const med = await Medicine.create({
      medicine_id, name, category, manufacturer,
      quantity: parseInt(qty) || 0,
      price: parseFloat(price) || 0,
      expiry_date: expiry,
      supplier,
      supplier_id: sup?._id,
    });

    await ActivityLog.create({ action_type: 'STOCK', description: `New medicine added: ${name}`, reference_type: 'MEDICINE', reference_id: med._id });
    res.status(201).json({ id: med._id, medicine_id, message: 'Medicine added successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/medicines/:id', async (req, res) => {
  try {
    const { name, qty, price, expiry, category, manufacturer, supplier } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (qty !== undefined) update.quantity = parseInt(qty);
    if (price !== undefined) update.price = parseFloat(price);
    if (expiry !== undefined) update.expiry_date = expiry;
    if (category !== undefined) update.category = category;
    if (manufacturer !== undefined) update.manufacturer = manufacturer;
    if (supplier !== undefined) update.supplier = supplier;

    await Medicine.findByIdAndUpdate(req.params.id, update);
    res.json({ message: 'Medicine updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/medicines/:id/stock', async (req, res) => {
  try {
    const { quantity, type, notes } = req.body;
    const med = await Medicine.findById(req.params.id);
    if (!med) return res.status(404).json({ error: 'Medicine not found' });

    const newQty = type === 'IN' ? med.quantity + parseInt(quantity) : med.quantity - parseInt(quantity);
    await Medicine.findByIdAndUpdate(req.params.id, { quantity: newQty });

    await StockTransaction.create({
      medicine_id: med._id, medicine_name: med.name,
      transaction_type: type, quantity: parseInt(quantity), notes
    });

    res.json({ message: 'Stock updated', newQuantity: newQty });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/medicines/:id', async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ message: 'Medicine deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// PATIENTS
// ═══════════════════════════════════════════════════════════

app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ name: 1 });
    res.json(patients.map(p => ({
      id: p._id, patient_id: p.patient_id, name: p.name, age: p.age,
      gender: p.gender, phone: p.phone, email: p.email,
      lastVisit: p.last_visit, purchases: p.total_purchases
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const p = await Patient.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Patient not found' });
    res.json({
      id: p._id, patient_id: p.patient_id, name: p.name, age: p.age,
      gender: p.gender, phone: p.phone, email: p.email,
      last_visit: p.last_visit, total_purchases: p.total_purchases
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/patients/:id/history', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    const sales = await Sale.find({ patient_id: patient._id }).sort({ created_at: -1 });
    res.json(sales);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/patients', async (req, res) => {
  try {
    const { name, age, gender, phone, email, address } = req.body;
    const count = await Patient.countDocuments();
    const patient_id = 'PAT' + String(count + 1).padStart(3, '0');
    const today = new Date().toISOString().split('T')[0];

    const patient = await Patient.create({ patient_id, name, age, gender, phone, email, address, last_visit: today });
    await ActivityLog.create({ action_type: 'PATIENT', description: `New patient registered: ${name}`, reference_type: 'PATIENT', reference_id: patient._id });
    res.status(201).json({ id: patient._id, patient_id, message: 'Patient added successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const { name, age, phone, email, address } = req.body;
    await Patient.findByIdAndUpdate(req.params.id, { name, age, phone, email, address });
    res.json({ message: 'Patient updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Patient deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════════════════

app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    const result = await Promise.all(suppliers.map(async s => {
      const medCount = await Medicine.countDocuments({ supplier_id: s._id });
      return {
        id: s._id, supplier_id: s.supplier_id, name: s.name,
        contact: s.contact_person, phone: s.phone, email: s.email,
        status: s.status, medicines: medCount
      };
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const { name, contact, phone, email, address, status } = req.body;
    const count = await Supplier.countDocuments();
    const supplier_id = 'SUP' + String(count + 1).padStart(3, '0');
    const sup = await Supplier.create({ supplier_id, name, contact_person: contact, phone, email, address, status: status || 'Active' });
    res.status(201).json({ id: sup._id, supplier_id, message: 'Supplier added successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { name, contact, phone, email, status } = req.body;
    await Supplier.findByIdAndUpdate(req.params.id, { name, contact_person: contact, phone, email, status });
    res.json({ message: 'Supplier updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// SALES / BILLING
// ═══════════════════════════════════════════════════════════

app.get('/api/sales', async (req, res) => {
  try {
    const sales = await Sale.find().sort({ created_at: -1 });
    res.json(sales);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/sales/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(sale);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { patientId, items, discount = 0, tax = 0, paymentMethod = 'Cash', notes, prescription_url } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ error: 'No items in cart' });

    // Resolve patient
    let patient = null;
    if (patientId) {
      patient = mongoose.Types.ObjectId.isValid(patientId)
        ? await Patient.findById(patientId)
        : await Patient.findOne({ $or: [{ name: patientId }, { patient_id: patientId }] });
    }

    // Calculate totals
    const total = items.reduce((s, i) => s + (i.price * i.cartQty), 0);
    const discountAmt = parseFloat(discount) || 0;
    const taxAmt = parseFloat(tax) || 0;
    const net = total - discountAmt + taxAmt;

    // Invoice ID
    const d = new Date();
    const invoice_id = `INV${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    // Build items array
    const saleItems = await Promise.all(items.map(async i => {
      const med = await Medicine.findById(i.id);
      return {
        medicine_id: i.id,
        medicine_name: i.name,
        category: med?.category || i.category || 'Other',
        quantity: i.cartQty,
        unit_price: i.price,
        total_price: i.price * i.cartQty
      };
    }));

    const sale = await Sale.create({
      invoice_id,
      patient_id: patient?._id,
      patient_name: patient?.name || patientId || 'Walk-in Customer',
      items: saleItems,
      total_amount: total,
      discount: discountAmt,
      tax: taxAmt,
      net_amount: net,
      payment_method: paymentMethod,
      prescription_url,
      notes
    });

    // Update stock quantities and check for restock alerts
    for (const item of items) {
      await Medicine.findByIdAndUpdate(item.id, { $inc: { quantity: -item.cartQty } });
      await StockTransaction.create({
        medicine_id: item.id, medicine_name: item.name,
        transaction_type: 'OUT', quantity: item.cartQty,
        reference_type: 'SALE', reference_id: sale._id
      });

      // Check stock level after sale and send email alerts
      const updatedMedicine = await Medicine.findById(item.id);
      if (updatedMedicine) {
        const supplier = updatedMedicine.supplier_id 
          ? await Supplier.findById(updatedMedicine.supplier_id) 
          : null;

        if (updatedMedicine.quantity === 0) {
          // Out of stock - send urgent alert
          sendRestockAlert(updatedMedicine, supplier).catch(err => 
            console.error('Email alert failed:', err)
          );
          await ActivityLog.create({
            action_type: 'ALERT',
            description: `OUT OF STOCK: ${updatedMedicine.name} needs immediate restocking`,
            reference_type: 'MEDICINE',
            reference_id: updatedMedicine._id
          });
        } else if (updatedMedicine.quantity < updatedMedicine.reorder_level) {
          // Low stock warning
          sendLowStockWarning(updatedMedicine, updatedMedicine.quantity).catch(err => 
            console.error('Email warning failed:', err)
          );
        }
      }
    }

    // Update patient
    if (patient) {
      const today = new Date().toISOString().split('T')[0];
      await Patient.findByIdAndUpdate(patient._id, {
        last_visit: today,
        $inc: { total_purchases: 1 }
      });
    }

    // Activity log
    await ActivityLog.create({
      action_type: 'SALE',
      description: `Bill #${invoice_id} generated for ${patient?.name || 'Walk-in Customer'}`,
      reference_type: 'SALE',
      reference_id: sale._id
    });

    res.status(201).json({ id: sale._id, invoice_id, total, discount: discountAmt, tax: taxAmt, netAmount: net });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// DASHBOARD / ANALYTICS
// ═══════════════════════════════════════════════════════════

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [totalMedicines, lowStock, outOfStock, expired, expiringSoon, totalPatients, totalSuppliers] = await Promise.all([
      Medicine.countDocuments(),
      Medicine.countDocuments({ quantity: { $gt: 0 }, $expr: { $lt: ['$quantity', '$reorder_level'] } }),
      Medicine.countDocuments({ quantity: 0 }),
      Medicine.countDocuments({ expiry_date: { $lt: today } }),
      Medicine.countDocuments({ expiry_date: { $gte: today, $lte: sixtyDays } }),
      Patient.countDocuments(),
      Supplier.countDocuments({ status: 'Active' }),
    ]);

    // Today's revenue - use local timezone for start/end of day
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const revenueAgg = await Sale.aggregate([
      { $match: { created_at: { $gte: todayStart, $lte: todayEnd }, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$net_amount' } } }
    ]);
    const todayRevenue = revenueAgg[0]?.total || 0;

    res.json({ totalMedicines, lowStock, outOfStock, expired, expiringSoon, todayRevenue, totalPatients, totalSuppliers });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/sales-chart', async (req, res) => {
  try {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Build array of last 6 months including current
    const monthsData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsData.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        monthName: months[d.getMonth()],
        revenue: 0,
        sales: 0
      });
    }

    // Get actual sales data from last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const salesData = await Sale.aggregate([
      { $match: { created_at: { $gte: sixMonthsAgo }, status: 'Completed' } },
      {
        $group: {
          _id: { year: { $year: '$created_at' }, month: { $month: '$created_at' } },
          revenue: { $sum: '$net_amount' },
          sales: { $sum: 1 }
        }
      }
    ]);

    // Merge actual data into months array
    salesData.forEach(s => {
      const idx = monthsData.findIndex(m => m.year === s._id.year && m.month === s._id.month);
      if (idx !== -1) {
        monthsData[idx].revenue = Math.round(s.revenue);
        monthsData[idx].sales = s.sales;
      }
    });

    res.json(monthsData.map(m => ({ month: m.monthName, revenue: m.revenue, sales: m.sales })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/category-chart', async (req, res) => {
  try {
    const colors = ['#0D9488', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B', '#3B82F6', '#EC4899'];
    
    // Get revenue by category from actual sales
    const salesByCategory = await Sale.aggregate([
      { $match: { status: 'Completed' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'medicines',
          localField: 'items.medicine_id',
          foreignField: '_id',
          as: 'medicine'
        }
      },
      { $unwind: { path: '$medicine', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$medicine.category',
          value: { $sum: '$items.total_price' }
        }
      },
      { $sort: { value: -1 } },
      { $limit: 7 }
    ]);

    // If no sales data, fall back to medicine inventory counts
    if (salesByCategory.length === 0) {
      const inventoryData = await Medicine.aggregate([
        { $group: { _id: '$category', value: { $sum: 1 } } },
        { $sort: { value: -1 } }
      ]);
      return res.json(inventoryData.map((d, i) => ({ name: d._id || 'Other', value: d.value, color: colors[i % colors.length] })));
    }

    res.json(salesByCategory.map((d, i) => ({ 
      name: d._id || 'Other', 
      value: Math.round(d.value), 
      color: colors[i % colors.length] 
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/recent-activity', async (req, res) => {
  try {
    const activities = await ActivityLog.find().sort({ created_at: -1 }).limit(12);
    res.json(activities.map(a => ({
      time: new Date(a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      text: a.description,
      type: a.action_type.toLowerCase()
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/low-stock', async (req, res) => {
  try {
    const meds = await Medicine.find({ $expr: { $lt: ['$quantity', '$reorder_level'] } }).sort({ quantity: 1 }).limit(10);
    res.json(meds.map(m => ({ medicine_id: m.medicine_id, name: m.name, quantity: m.quantity, reorder_level: m.reorder_level, category: m.category })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/expiring', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const ninetyDays = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const meds = await Medicine.find({ expiry_date: { $lte: ninetyDays } }).sort({ expiry_date: 1 }).limit(10);
    res.json(meds.map(m => {
      const daysLeft = Math.ceil((new Date(m.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
      return { medicine_id: m.medicine_id, name: m.name, quantity: m.quantity, expiry_date: m.expiry_date, days_left: daysLeft, category: m.category };
    }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════

app.get('/api/reports/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate && endDate) {
      match.created_at = { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59') };
    }

    const sales = await Sale.find(match).sort({ created_at: -1 });
    const total = sales.reduce((s, r) => s + r.net_amount, 0);
    const avg = sales.length ? total / sales.length : 0;

    res.json({ sales, summary: { total_sales: sales.length, total_revenue: total, avg_sale: avg } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/inventory', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const meds = await Medicine.find().sort({ name: 1 });
    const inventory = meds.map(m => {
      let status = 'In Stock';
      if (m.quantity === 0) status = 'Out of Stock';
      else if (m.quantity < m.reorder_level) status = 'Low Stock';
      else if (m.expiry_date < today) status = 'Expired';
      return { ...m.toObject(), status };
    });
    const summary = {
      total: inventory.length,
      inStock: inventory.filter(m => m.status === 'In Stock').length,
      lowStock: inventory.filter(m => m.status === 'Low Stock').length,
      outOfStock: inventory.filter(m => m.status === 'Out of Stock').length,
      expired: inventory.filter(m => m.status === 'Expired').length,
      totalValue: inventory.reduce((s, m) => s + (m.quantity * m.price), 0)
    };
    res.json({ inventory, summary });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/top-medicines', async (req, res) => {
  try {
    const data = await Sale.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.medicine_name', totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.total_price' } } },
      { $sort: { totalQty: -1 } },
      { $limit: 10 }
    ]);
    res.json(data.map(d => ({ name: d._id, qty: d.totalQty, revenue: d.totalRevenue })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.find();
    const obj = {};
    settings.forEach(s => { obj[s.key] = s.value; });
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/settings', async (req, res) => {
  try {
    const updates = req.body;
    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        Settings.findOneAndUpdate({ key }, { key, value }, { upsert: true })
      )
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// EMAIL ALERTS / RESTOCK NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

// Get all out-of-stock medicines
app.get('/api/alerts/out-of-stock', async (req, res) => {
  try {
    const outOfStock = await Medicine.find({ quantity: 0 }).populate('supplier_id');
    res.json(outOfStock.map(m => ({
      id: m._id,
      medicine_id: m.medicine_id,
      name: m.name,
      category: m.category,
      supplier: m.supplier_id ? { name: m.supplier_id.name, email: m.supplier_id.email, phone: m.supplier_id.phone } : null
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Manually trigger restock alert for a medicine
app.post('/api/alerts/send-restock/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    
    const supplier = medicine.supplier_id ? await Supplier.findById(medicine.supplier_id) : null;
    const result = await sendRestockAlert(medicine, supplier);
    
    if (result.success) {
      res.json({ message: 'Restock alert email sent', messageId: result.messageId });
    } else {
      res.status(500).json({ error: 'Failed to send email', details: result.error });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════

async function startServer() {
  await connectDB();
  await seedDatabase();

  app.listen(PORT, () => {
    const host = process.env.NODE_ENV === 'production' ? 'Production Mode' : `http://localhost:${PORT}`;
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🏥 MedOS Backend — MongoDB Atlas Edition                 ║
║   Running on: ${host.padEnd(42)}║
║   Database: MongoDB Atlas (medos)                          ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(40)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
}

startServer();
