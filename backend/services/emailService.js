import nodemailer from 'nodemailer';

// Configure email transporter
// Using Gmail SMTP - for production, use environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'medos.alerts@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password' // Use App Password for Gmail
  }
});

// Pharmacy admin email for restock notifications
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@medos.in';
const PHARMACY_NAME = 'MedOS Thrissur';

/**
 * Send restock alert email when medicine goes out of stock
 */
export async function sendRestockAlert(medicine, supplier = null) {
  const mailOptions = {
    from: `"${PHARMACY_NAME} Alerts" <${process.env.EMAIL_USER || 'medos.alerts@gmail.com'}>`,
    to: ADMIN_EMAIL,
    subject: `⚠️ URGENT: Restock Required - ${medicine.name}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Stock Alert</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Immediate Action Required</p>
        </div>
        
        <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #111827; margin: 0 0 16px; font-size: 18px;">Medicine Out of Stock</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background: #f9fafb;">
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 40%;">Medicine ID</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; color: #111827;">${medicine.medicine_id}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Medicine Name</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; color: #111827; font-weight: 700;">${medicine.name}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Category</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; color: #111827;">${medicine.category || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Current Stock</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; color: #EF4444; font-weight: 700;">0 units</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Reorder Level</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; color: #111827;">${medicine.reorder_level || 10} units</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Unit Price</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; color: #111827;">₹${medicine.price}</td>
            </tr>
            ${supplier ? `
            <tr style="background: #f9fafb;">
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Supplier</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; color: #111827;">${supplier.name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Supplier Contact</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; color: #111827;">${supplier.phone}<br><a href="mailto:${supplier.email}" style="color: #0D9488;">${supplier.email}</a></td>
            </tr>
            ` : ''}
          </table>

          <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400E; font-size: 14px;">
              <strong>Recommended Action:</strong> Place a restock order for at least <strong>${medicine.reorder_level * 2 || 20} units</strong> to maintain adequate inventory levels.
            </p>
          </div>

          <a href="http://localhost:5173" style="display: inline-block; background: #0D9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Open Inventory Dashboard
          </a>
        </div>
        
        <div style="background: #f9fafb; padding: 16px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            This is an automated alert from ${PHARMACY_NAME} Inventory Management System.<br>
            Generated on ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Restock alert sent for ${medicine.name}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send restock alert for ${medicine.name}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send low stock warning email (before it runs out)
 */
export async function sendLowStockWarning(medicine, currentQty) {
  const mailOptions = {
    from: `"${PHARMACY_NAME} Alerts" <${process.env.EMAIL_USER || 'medos.alerts@gmail.com'}>`,
    to: ADMIN_EMAIL,
    subject: `🔔 Low Stock Warning - ${medicine.name} (${currentQty} units left)`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Low Stock Warning</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Stock Running Low</p>
        </div>
        
        <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #111827; margin: 0 0 16px; font-size: 18px;">Medicine Below Reorder Level</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background: #f9fafb;">
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Medicine</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; color: #111827; font-weight: 700;">${medicine.name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Current Stock</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; color: #F59E0B; font-weight: 700;">${currentQty} units</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Reorder Level</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; color: #111827;">${medicine.reorder_level || 10} units</td>
            </tr>
          </table>

          <p style="color: #6b7280; font-size: 14px;">Consider restocking soon to avoid stockouts.</p>
        </div>
        
        <div style="background: #f9fafb; padding: 16px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            Automated alert from ${PHARMACY_NAME} • ${new Date().toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Low stock warning sent for ${medicine.name}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send low stock warning for ${medicine.name}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfig() {
  try {
    await transporter.verify();
    console.log('✅ Email service configured and ready');
    return true;
  } catch (error) {
    console.error('❌ Email config error:', error.message);
    return false;
  }
}
