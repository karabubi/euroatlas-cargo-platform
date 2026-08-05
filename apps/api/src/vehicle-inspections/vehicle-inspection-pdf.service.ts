import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

import { VehicleInspectionsService } from './vehicle-inspections.service';

type PdfInspection = Awaited<ReturnType<VehicleInspectionsService['findOne']>>;

@Injectable()
export class VehicleInspectionPdfService {
  constructor(private readonly inspectionsService: VehicleInspectionsService) {}

  async generate(id: string): Promise<{
    buffer: Buffer;
    fileName: string;
  }> {
    const inspection = await this.inspectionsService.findOne(id);

    const buffer = await this.createPdfBuffer(inspection);

    return {
      buffer,
      fileName: `${inspection.inspectionNo}.pdf`,
    };
  }

  private createPdfBuffer(inspection: PdfInspection): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({
        size: 'A4',
        margins: {
          top: 48,
          right: 48,
          bottom: 48,
          left: 48,
        },
        info: {
          Title: `Vehicle Inspection ${inspection.inspectionNo}`,
          Author: 'EuroAtlas Cargo',
          Subject: 'Vehicle inspection report',
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

      this.drawReport(document, inspection);
      document.end();
    });
  }

  private drawReport(
    document: PDFKit.PDFDocument,
    inspection: PdfInspection,
  ): void {
    this.drawHeader(document, inspection);
    this.drawVehicleSection(document, inspection);
    this.drawInspectionSection(document, inspection);
    this.drawConditionSection(document, inspection);
    this.drawTextSections(document, inspection);
    this.drawStatusHistory(document, inspection);
    this.drawDamageReports(document, inspection);
    this.drawFooter(document);
  }

  private drawHeader(
    document: PDFKit.PDFDocument,
    inspection: PdfInspection,
  ): void {
    document
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#0f172a')
      .text('EUROATLAS CARGO');

    document
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#64748b')
      .text('Professional vehicle shipping and logistics');

    document
      .moveDown(0.7)
      .strokeColor('#0ea5e9')
      .lineWidth(2)
      .moveTo(48, document.y)
      .lineTo(547, document.y)
      .stroke();

    document.moveDown(1);

    document
      .font('Helvetica-Bold')
      .fontSize(19)
      .fillColor('#0f172a')
      .text('VEHICLE INSPECTION REPORT');

    document
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#475569')
      .text(`Inspection number: ${inspection.inspectionNo}`)
      .text(`Generated: ${this.formatDate(new Date())}`);

    document.moveDown(1);
  }

  private drawVehicleSection(
    document: PDFKit.PDFDocument,
    inspection: PdfInspection,
  ): void {
    this.sectionTitle(document, 'Vehicle');

    const vehicle = inspection.vehicle;

    this.drawTwoColumnRows(document, [
      ['Vehicle number', vehicle.vehicleNo, 'VIN', vehicle.vin ?? '—'],
      [
        'Make and model',
        `${vehicle.make} ${vehicle.model}`,
        'Year',
        vehicle.year?.toString() ?? '—',
      ],
      [
        'Colour',
        vehicle.color ?? '—',
        'Vehicle status',
        this.formatValue(vehicle.status),
      ],
      [
        'Shipment',
        vehicle.shipment.shipmentNo,
        'Route',
        `${vehicle.shipment.originCountry} to ${vehicle.shipment.destinationCountry}`,
      ],
    ]);

    document.moveDown(0.8);
  }

  private drawInspectionSection(
    document: PDFKit.PDFDocument,
    inspection: PdfInspection,
  ): void {
    this.sectionTitle(document, 'Inspection information');

    this.drawTwoColumnRows(document, [
      [
        'Inspection type',
        this.formatValue(inspection.type),
        'Status',
        this.formatValue(inspection.status),
      ],
      [
        'Inspection date',
        this.formatDate(inspection.inspectionDate),
        'Condition',
        inspection.condition ? this.formatValue(inspection.condition) : '—',
      ],
      [
        'Inspector',
        inspection.inspectorName ?? '—',
        'Location',
        inspection.location ?? '—',
      ],
      [
        'Odometer',
        inspection.odometer === null
          ? '—'
          : `${inspection.odometer.toLocaleString('en-GB')} km`,
        'Fuel level',
        inspection.fuelLevel === null ? '—' : `${inspection.fuelLevel}%`,
      ],
    ]);

    document.moveDown(0.8);
  }

  private drawConditionSection(
    document: PDFKit.PDFDocument,
    inspection: PdfInspection,
  ): void {
    this.sectionTitle(document, 'Operational condition');

    this.drawTwoColumnRows(document, [
      [
        'Keys available',
        this.booleanValue(inspection.hasKeys),
        'Vehicle running',
        this.booleanValue(inspection.isRunning),
      ],
      [
        'Visible damage',
        inspection.hasVisibleDamage ? 'Yes' : 'No',
        'Damage reports',
        inspection.damageReports.length.toString(),
      ],
    ]);

    document.moveDown(0.8);
  }

  private drawTextSections(
    document: PDFKit.PDFDocument,
    inspection: PdfInspection,
  ): void {
    if (inspection.summary) {
      this.ensureSpace(document, 100);
      this.sectionTitle(document, 'Inspection summary');

      document
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#334155')
        .text(inspection.summary, {
          lineGap: 3,
        });

      document.moveDown(0.8);
    }

    if (inspection.notes) {
      this.ensureSpace(document, 100);
      this.sectionTitle(document, 'Internal notes');

      document
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#334155')
        .text(inspection.notes, {
          lineGap: 3,
        });

      document.moveDown(0.8);
    }
  }

  private drawStatusHistory(
    document: PDFKit.PDFDocument,
    inspection: PdfInspection,
  ): void {
    this.ensureSpace(document, 120);
    this.sectionTitle(document, 'Status history');

    const history = inspection.statusHistory ?? [];

    if (history.length === 0) {
      document
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#475569')
        .text('No status changes have been recorded for this inspection.');

      document.moveDown(0.8);
      return;
    }

    history.forEach((item, index) => {
      this.ensureSpace(document, item.note ? 105 : 72);

      const startY = document.y;

      document.circle(56, startY + 7, 4).fill('#0ea5e9');

      if (index < history.length - 1) {
        document
          .strokeColor('#cbd5e1')
          .lineWidth(1)
          .moveTo(56, startY + 13)
          .lineTo(56, startY + (item.note ? 91 : 58))
          .stroke();
      }

      const transition =
        item.fromStatus === null
          ? `Created as ${this.formatValue(item.toStatus)}`
          : `${this.formatValue(item.fromStatus)} to ${this.formatValue(
              item.toStatus,
            )}`;

      document
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#0f172a')
        .text(transition, 70, startY, {
          width: 465,
        });

      document
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#64748b')
        .text(
          `${this.formatDate(item.createdAt)}${
            item.changedBy ? ` - ${item.changedBy}` : ''
          }`,
          70,
          startY + 18,
          {
            width: 465,
          },
        );

      if (item.note) {
        document
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#334155')
          .text(item.note, 70, startY + 38, {
            width: 465,
            lineGap: 2,
          });

        document.y = Math.max(document.y + 9, startY + 82);
      } else {
        document.y = startY + 52;
      }
    });

    document.moveDown(0.6);
  }

  private drawDamageReports(
    document: PDFKit.PDFDocument,
    inspection: PdfInspection,
  ): void {
    this.ensureSpace(document, 120);
    this.sectionTitle(document, 'Damage reports');

    if (inspection.damageReports.length === 0) {
      document
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#475569')
        .text('No damage reports were recorded for this inspection.');

      return;
    }

    const totalEstimatedCost = inspection.damageReports.reduce(
      (total, report) => total + Number(report.estimatedCost ?? 0),
      0,
    );

    inspection.damageReports.forEach((report, index) => {
      this.ensureSpace(document, 125);

      document.roundedRect(48, document.y, 499, 18, 4).fill('#fee2e2');

      document
        .fillColor('#991b1b')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(`${index + 1}. ${report.title}`, 56, document.y - 14, {
          width: 483,
        });

      document.moveDown(0.7);

      this.drawTwoColumnRows(document, [
        [
          'Area',
          this.formatValue(report.area),
          'Severity',
          this.formatValue(report.severity),
        ],
        [
          'Estimated cost',
          this.formatMoney(report.estimatedCost),
          'Requires repair',
          report.requiresRepair ? 'Yes' : 'No',
        ],
        [
          'Repair status',
          report.repaired ? 'Repaired' : 'Not repaired',
          'Created',
          this.formatDate(report.createdAt),
        ],
      ]);

      if (report.description) {
        document
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#475569')
          .text('Description');

        document
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#334155')
          .text(report.description, {
            lineGap: 2,
          });
      }

      if (report.repairNotes) {
        document.moveDown(0.3);

        document
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#475569')
          .text('Repair notes');

        document
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#334155')
          .text(report.repairNotes, {
            lineGap: 2,
          });
      }

      document.moveDown(0.9);
    });

    document
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f172a')
      .text(
        `Total estimated repair cost: ${this.formatMoney(totalEstimatedCost)}`,
        {
          align: 'right',
        },
      );
  }

  private sectionTitle(document: PDFKit.PDFDocument, title: string): void {
    document
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#0369a1')
      .text(title.toUpperCase(), 48, document.y, {
        width: 499,
        lineBreak: false,
      });

    document
      .moveDown(0.25)
      .strokeColor('#cbd5e1')
      .lineWidth(0.7)
      .moveTo(48, document.y)
      .lineTo(547, document.y)
      .stroke();

    document.moveDown(0.5);
  }

  private drawTwoColumnRows(
    document: PDFKit.PDFDocument,
    rows: string[][],
  ): void {
    const startX = 48;
    const firstLabelX = startX;
    const firstValueX = 145;
    const secondLabelX = 305;
    const secondValueX = 405;

    for (const row of rows) {
      this.ensureSpace(document, 25);

      const y = document.y;

      document
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#64748b')
        .text(row[0], firstLabelX, y, {
          width: 92,
        });

      document
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#0f172a')
        .text(row[1], firstValueX, y, {
          width: 150,
        });

      document
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#64748b')
        .text(row[2], secondLabelX, y, {
          width: 95,
        });

      document
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#0f172a')
        .text(row[3], secondValueX, y, {
          width: 142,
        });

      document.y = y + 22;
    }
  }

  private drawFooter(document: PDFKit.PDFDocument): void {
    const footerY = document.page.height - document.page.margins.bottom - 16;

    document
      .strokeColor('#cbd5e1')
      .lineWidth(0.5)
      .moveTo(48, footerY - 8)
      .lineTo(547, footerY - 8)
      .stroke();

    document
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#64748b')
      .text('EuroAtlas Cargo - Vehicle Inspection Report', 48, footerY, {
        width: 499,
        align: 'center',
        lineBreak: false,
      });
  }

  private ensureSpace(
    document: PDFKit.PDFDocument,
    requiredHeight: number,
  ): void {
    const availableBottom =
      document.page.height - document.page.margins.bottom - 35;

    if (document.y + requiredHeight > availableBottom) {
      document.addPage();
    }
  }

  private booleanValue(value: boolean | null): string {
    if (value === null) {
      return 'Unknown';
    }

    return value ? 'Yes' : 'No';
  }

  private formatDate(value: Date | string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  private formatValue(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatMoney(
    value: string | number | { toNumber(): number } | null,
  ): string {
    let amount = 0;

    if (typeof value === 'number') {
      amount = value;
    } else if (typeof value === 'string') {
      amount = Number(value);
    } else if (value !== null) {
      amount = value.toNumber();
    }

    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }
}
