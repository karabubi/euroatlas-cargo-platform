import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PDFDocument = require('pdfkit');

import { InvoicesService } from './invoices.service';

type PdfInvoice = Awaited<ReturnType<InvoicesService['findOne']>>;

@Injectable()
export class InvoicePdfService {
  constructor(private readonly invoicesService: InvoicesService) {}

  async generate(invoiceId: string): Promise<{
    buffer: Buffer;
    fileName: string;
  }> {
    const invoice = await this.invoicesService.findOne(invoiceId);

    const buffer = await this.createPdfBuffer(invoice);

    return {
      buffer,
      fileName: `${invoice.invoiceNo}.pdf`,
    };
  }

  private createPdfBuffer(invoice: PdfInvoice): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice ${invoice.invoiceNo}`,
          Author: 'EuroAtlas Cargo',
          Subject: 'Customer invoice',
          Creator: 'EuroAtlas Cargo Platform',
        },
      });

      const chunks: Buffer[] = [];

      document.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      document.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      document.on('error', reject);

      this.drawInvoice(document, invoice);
      document.end();
    });
  }

  private drawInvoice(document: PDFKit.PDFDocument, invoice: PdfInvoice): void {
    const customerName =
      invoice.customer.companyName ||
      `${invoice.customer.firstName} ${invoice.customer.lastName}`;

    const issueDate = this.formatDate(invoice.issueDate);

    const dueDate = this.formatDate(invoice.dueDate);

    this.drawHeader(document, invoice.invoiceNo);

    document
      .fontSize(10)
      .fillColor('#475569')
      .text(`Issue date: ${issueDate}`, 350, 65, {
        width: 190,
        align: 'right',
      })
      .text(`Due date: ${dueDate}`, 350, 82, {
        width: 190,
        align: 'right',
      })
      .text(`Status: ${this.formatStatus(invoice.status)}`, 350, 99, {
        width: 190,
        align: 'right',
      });

    document.moveTo(50, 135).lineTo(545, 135).strokeColor('#cbd5e1').stroke();

    this.drawCustomerAndShipment(document, invoice, customerName);

    this.drawItems(document, invoice);

    this.drawTotals(document, invoice);

    this.drawAdditionalInformation(document, invoice);

    this.drawFooter(document);
  }

  private drawHeader(document: PDFKit.PDFDocument, invoiceNo: string): void {
    document
      .fillColor('#0284c7')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('EUROATLAS CARGO', 50, 50);

    document
      .fillColor('#0f172a')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('INVOICE', 50, 72);

    document
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#475569')
      .text(invoiceNo, 50, 108);
  }

  private drawCustomerAndShipment(
    document: PDFKit.PDFDocument,
    invoice: PdfInvoice,
    customerName: string,
  ): void {
    const startY = 160;

    document
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f172a')
      .text('BILL TO', 50, startY);

    document
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#334155')
      .text(customerName, 50, startY + 22)
      .text(`Customer: ${invoice.customer.customerNo}`, 50, startY + 39)
      .text(invoice.customer.email || 'No email', 50, startY + 56);

    document
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f172a')
      .text('SHIPMENT', 315, startY);

    document
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#334155')
      .text(invoice.shipment.shipmentNo, 315, startY + 22)
      .text(
        `${invoice.shipment.originCountry} → ${invoice.shipment.destinationCountry}`,
        315,
        startY + 39,
      );
  }

  private drawItems(document: PDFKit.PDFDocument, invoice: PdfInvoice): void {
    let y = 260;

    document.rect(50, y, 495, 28).fill('#0f172a');

    document
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('DESCRIPTION', 60, y + 10)
      .text('QTY', 335, y + 10, {
        width: 45,
        align: 'right',
      })
      .text('UNIT PRICE', 385, y + 10, {
        width: 70,
        align: 'right',
      })
      .text('AMOUNT', 465, y + 10, {
        width: 70,
        align: 'right',
      });

    y += 28;

    invoice.items.forEach((item, index) => {
      this.ensurePageSpace(document, y, 55);

      if (y > 700) {
        y = 60;
      }

      if (index % 2 === 0) {
        document.rect(50, y, 495, 34).fill('#f8fafc');
      }

      document
        .fillColor('#0f172a')
        .font('Helvetica')
        .fontSize(9)
        .text(item.description, 60, y + 11, {
          width: 260,
        })
        .text(this.formatNumber(item.quantity), 335, y + 11, {
          width: 45,
          align: 'right',
        })
        .text(this.formatMoney(item.unitPrice, invoice.currency), 385, y + 11, {
          width: 70,
          align: 'right',
        })
        .text(this.formatMoney(item.amount, invoice.currency), 465, y + 11, {
          width: 70,
          align: 'right',
        });

      document
        .moveTo(50, y + 34)
        .lineTo(545, y + 34)
        .strokeColor('#e2e8f0')
        .stroke();

      y += 34;
    });

    document.y = y + 18;
  }

  private drawTotals(document: PDFKit.PDFDocument, invoice: PdfInvoice): void {
    const startY = Math.max(document.y, 430);

    document
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#475569')
      .text('Subtotal', 355, startY, {
        width: 90,
        align: 'right',
      })
      .fillColor('#0f172a')
      .text(this.formatMoney(invoice.subtotal, invoice.currency), 455, startY, {
        width: 90,
        align: 'right',
      });

    document
      .fillColor('#475569')
      .text(`Tax (${this.formatNumber(invoice.taxRate)}%)`, 355, startY + 22, {
        width: 90,
        align: 'right',
      })
      .fillColor('#0f172a')
      .text(
        this.formatMoney(invoice.taxAmount, invoice.currency),
        455,
        startY + 22,
        {
          width: 90,
          align: 'right',
        },
      );

    document
      .moveTo(355, startY + 48)
      .lineTo(545, startY + 48)
      .strokeColor('#0f172a')
      .stroke();

    document
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#0f172a')
      .text('Total', 355, startY + 60, {
        width: 90,
        align: 'right',
      })
      .text(
        this.formatMoney(invoice.total, invoice.currency),
        455,
        startY + 60,
        {
          width: 90,
          align: 'right',
        },
      );

    document.y = startY + 100;
  }

  private drawAdditionalInformation(
    document: PDFKit.PDFDocument,
    invoice: PdfInvoice,
  ): void {
    const hasPaymentTerms = Boolean(invoice.paymentTerms);

    const hasNotes = Boolean(invoice.notes);

    if (!hasPaymentTerms && !hasNotes) {
      return;
    }

    this.ensurePageSpace(document, document.y, 130);

    let y = document.y;

    if (y > 650) {
      y = 60;
    }

    if (hasPaymentTerms) {
      document
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#0f172a')
        .text('Payment terms', 50, y);

      document
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#475569')
        .text(invoice.paymentTerms ?? '', 50, y + 18, {
          width: 300,
        });

      y = document.y + 18;
    }

    if (hasNotes) {
      document
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#0f172a')
        .text('Notes', 50, y);

      document
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#475569')
        .text(invoice.notes ?? '', 50, y + 18, {
          width: 400,
        });
    }
  }

  private drawFooter(document: PDFKit.PDFDocument): void {
    const footerY = document.page.height - 65;

    document
      .moveTo(50, footerY - 12)
      .lineTo(545, footerY - 12)
      .strokeColor('#cbd5e1')
      .stroke();

    document
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#64748b')
      .text(
        'EuroAtlas Cargo — Cargo management from Europe to North Africa',
        50,
        footerY,
        {
          width: 495,
          align: 'center',
        },
      )
      .text('Thank you for your business.', 50, footerY + 14, {
        width: 495,
        align: 'center',
      });
  }

  private ensurePageSpace(
    document: PDFKit.PDFDocument,
    currentY: number,
    requiredHeight: number,
  ): void {
    const pageBottom = document.page.height - 80;

    if (currentY + requiredHeight > pageBottom) {
      document.addPage({
        size: 'A4',
        margin: 50,
      });
    }
  }

  private formatDate(value: Date | string | null | undefined): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private formatNumber(value: unknown): string {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      return '0';
    }

    return new Intl.NumberFormat('en-GB', {
      maximumFractionDigits: 2,
    }).format(numberValue);
  }

  private formatMoney(value: unknown, currency: string): string {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      return '—';
    }

    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(numberValue);
  }

  private formatStatus(status: string): string {
    return status
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
