import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadPDF(billData) {
    if (!billData) return;
    const doc = new jsPDF();

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(13, 148, 136); // ACCENT color
    doc.text("MedOS", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("MG Road, Thrissur, Kerala", 14, 28);
    doc.text("Ph: 0487-2220011 | Email: support@medos.in", 14, 34);
    doc.text("GSTIN: 32AABCP1234Z1ZV | License: KL/TRS/PHY/2024/001", 14, 40);

    // Invoice details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("TAX INVOICE", 140, 20);

    doc.setFontSize(10);
    doc.text(`Invoice No:`, 140, 28);
    doc.setFont("helvetica", "normal");
    doc.text(`#${billData.id}`, 165, 28);

    doc.setFont("helvetica", "bold");
    doc.text(`Date:`, 140, 34);
    doc.setFont("helvetica", "normal");
    doc.text(billData.date.split(",")[0], 155, 34); // Just the date part

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 45, 196, 45);

    // Patient & Payment details
    doc.setFont("helvetica", "bold");
    doc.text("Billed To:", 14, 52);
    doc.text("Payment Method:", 140, 52);

    doc.setFont("helvetica", "normal");
    doc.text(billData.patient, 14, 58);
    doc.text(billData.payMethod, 140, 58);

    // Table Data
    const tableBody = billData.items.map(i => [
        i.name,
        i.cartQty.toString(),
        `Rs. ${i.price.toFixed(2)}`,
        `Rs. ${(i.price * i.cartQty).toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 65,
        head: [['Description', 'Quantity', 'Rate', 'Amount']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' }
        }
    });

    const finalY = doc.lastAutoTable?.finalY || 65;

    // Totals area
    doc.setFontSize(10);
    let currentY = finalY + 10;

    doc.text("Subtotal:", 140, currentY);
    doc.text(`Rs. ${billData.subtotal.toFixed(2)}`, 196, currentY, { align: "right" });
    currentY += 8;

    if (billData.discountAmt > 0) {
        doc.text("Discount:", 140, currentY);
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`-Rs. ${billData.discountAmt.toFixed(2)}`, 196, currentY, { align: "right" });
        doc.setTextColor(15, 23, 42); // Reset
        currentY += 8;
    }

    if (billData.taxAmt > 0) {
        doc.text("GST (12%):", 140, currentY);
        doc.text(`Rs. ${billData.taxAmt.toFixed(2)}`, 196, currentY, { align: "right" });
        currentY += 8;
    }

    // Bold Total line
    doc.setDrawColor(226, 232, 240);
    doc.line(140, currentY - 4, 196, currentY - 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(13, 148, 136);
    doc.text("TOTAL:", 140, currentY + 4);
    doc.text(`Rs. ${billData.total.toFixed(2)}`, 196, currentY + 4, { align: "right" });

    // Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Thank you for choosing MedOS. Get well soon!", 105, 280, { align: "center" });

    // Save
    doc.save(`MedOS_Invoice_${billData.id}.pdf`);
}
