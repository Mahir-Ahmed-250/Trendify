import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';

export const generateInvoicePDF = (order: Order) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text('NEONTHREAD', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Official Purchase Invoice', 14, 30);
  
  // Order Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Order ID: ${order.id}`, 14, 45);
  doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, 14, 50);

  // Customer Info
  doc.setFontSize(12);
  doc.text('Customer Details:', 14, 70);
  doc.setFontSize(10);
  doc.text(`Name: ${order.customer.name}`, 14, 78);
  doc.text(`Phone: ${order.customer.phone}`, 14, 83);
  doc.text(`Email: ${order.customer.email}`, 14, 88);
  doc.text(`Address: ${order.customer.address}`, 14, 93);
  doc.text(`District: ${order.customer.district}`, 14, 98);

  // Table
  const tableData = order.items.map(item => [
    item.name,
    item.selectedSize || 'N/A',
    item.quantity,
    `TK ${item.price}`,
    `TK ${item.price * item.quantity}`
  ]);

  autoTable(doc, {
    startY: 110,
    head: [['Product', 'Size', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0] },
    styles: { fontSize: 9 },
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.text(`Subtotal: TK ${order.subtotal.toFixed(2)}`, pageWidth - 60, finalY);
  
  if (order.discount > 0) {
    doc.text(`Discount: - TK ${order.discount.toFixed(2)}`, pageWidth - 60, finalY + 6);
  }
  
  doc.text(`Shipping: TK ${order.shippingCharge.toFixed(2)}`, pageWidth - 60, finalY + 12);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: TK ${order.total.toFixed(2)}`, pageWidth - 60, finalY + 22);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  const footerText = 'Thank you for shopping with NEONTHREAD. For any queries, please contact us at neonthread@gmail.com';
  const textWidth = doc.getTextWidth(footerText);
  doc.text(footerText, (pageWidth - textWidth) / 2, doc.internal.pageSize.height - 10);

  // Save
  doc.save(`Invoice_${order.id}.pdf`);
};
