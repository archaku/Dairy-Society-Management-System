const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF invoice for a transaction
 * @param {Object} data - Invoice data
 * @param {String} type - Transaction type (milk, supplement, direct)
 * @returns {Promise<String>} - Path to the generated PDF
 */
const generateInvoice = async (data, type) => {
    return new Promise((resolve, reject) => {
        try {
            const invoicesDir = path.join(__dirname, '../uploads/invoices');
            if (!fs.existsSync(invoicesDir)) {
                fs.mkdirSync(invoicesDir, { recursive: true });
            }

            const fileName = `invoice_${type}_${data._id}.pdf`;
            const filePath = path.join(invoicesDir, fileName);
            const relativePath = `/uploads/invoices/${fileName}`;

            const doc = new PDFDocument({ margin: 50 });
            const writeStream = fs.createWriteStream(filePath);

            doc.pipe(writeStream);

            // Header
            doc.fontSize(20).text('DSMS - Dairy Society Management System', { align: 'center' });
            doc.moveDown();
            doc.fontSize(16).text('INVOICE', { align: 'center', underline: true });
            doc.moveDown();

            // Invoice Info
            doc.fontSize(10).text(`Invoice No: INV-${data._id.toString().substring(0, 8).toUpperCase()}`);
            doc.text(`Date: ${new Date(data.createdAt).toLocaleDateString()}`);
            doc.text(`Payment Status: ${data.paymentStatus || 'Paid'}`);
            doc.moveDown();

            // Customer Info
            doc.fontSize(12).text('Billed To:', { underline: true });
            const person = data.user || data.farmer;
            doc.fontSize(10).text(`Name: ${person.firstName} ${person.lastName}`);
            doc.text(`Phone: ${person.phone || 'N/A'}`);
            doc.moveDown();

            // Table Header
            const tableTop = 250;
            doc.fontSize(10).text('Description', 50, tableTop, { bold: true });
            doc.text('Quantity', 250, tableTop, { bold: true });
            doc.text('Rate', 350, tableTop, { bold: true });
            doc.text('Amount', 450, tableTop, { bold: true });

            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            // Table Content
            let currentY = tableTop + 25;
            if (type === 'milk' || type === 'direct') {
                doc.text(type === 'milk' ? 'Fresh Milk Purchase' : 'Direct Milk Sale', 50, currentY);
                doc.text(`${data.quantity} L`, 250, currentY);
                doc.text(`Rs. ${data.rate || data.pricePerLiter}`, 350, currentY);
                doc.text(`Rs. ${data.totalAmount}`, 450, currentY);
            } else if (type === 'supplement') {
                data.items.forEach((item, index) => {
                    doc.text(item.supplement.name, 50, currentY);
                    doc.text(`${item.quantity}`, 250, currentY);
                    doc.text(`Rs. ${item.priceAtTime}`, 350, currentY);
                    doc.text(`Rs. ${item.quantity * item.priceAtTime}`, 450, currentY);
                    currentY += 20;
                });
            }

            // Total
            doc.moveTo(50, currentY + 10).lineTo(550, currentY + 10).stroke();
            doc.fontSize(12).text(`Total Amount: Rs. ${data.totalAmount}`, 350, currentY + 25, { bold: true });

            // Footer
            doc.fontSize(10).text('Thank you for your business!', 50, 700, { align: 'center' });

            doc.end();

            writeStream.on('finish', () => resolve(relativePath));
            writeStream.on('error', (err) => reject(err));

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateInvoice };
