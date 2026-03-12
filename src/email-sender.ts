import nodemailer from 'nodemailer';
import { config } from './config';

let transporter: nodemailer.Transporter;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass,
      },
    });
  }
  return transporter;
}

export interface EmailOptions {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  attachments: { filename: string; path: string }[];
}

/**
 * Send an email with PDF attachments.
 */
export async function sendReport(options: EmailOptions): Promise<void> {
  const transport = getTransporter();

  await transport.sendMail({
    from: config.smtp.from,
    to: options.to,
    cc: options.cc,
    subject: options.subject,
    html: options.body,
    attachments: options.attachments,
  });

  console.log(`  Email sent to ${options.to}`);
}

/**
 * Build email body for a vehicle report.
 */
export function buildVehicleEmailBody(assetnum: string, customerName: string, periodEnd: Date): string {
  const period = new Date(periodEnd).toLocaleDateString('en-SG', { month: 'long', year: 'numeric' });
  return `
    <div style="font-family: 'Segoe UI', sans-serif; color: #333;">
      <p>Dear ${customerName},</p>
      <p>Please find attached the <strong>Vehicle Performance Report</strong> for asset <strong>${assetnum}</strong>, covering the 6-month period ending ${period}.</p>
      <p>This report includes performance parameters, maintenance history, schedule status, parts entitlement, and cost summary.</p>
      <p>If you have any questions, please contact your service manager.</p>
      <br/>
      <p>Best regards,<br/>Goldbell Engineering Services</p>
    </div>
  `;
}

/**
 * Build email body for a fleet report.
 */
export function buildFleetEmailBody(customerName: string, vehicleCount: number, periodEnd: Date): string {
  const period = new Date(periodEnd).toLocaleDateString('en-SG', { month: 'long', year: 'numeric' });
  return `
    <div style="font-family: 'Segoe UI', sans-serif; color: #333;">
      <p>Dear ${customerName},</p>
      <p>Please find attached the <strong>Fleet Performance Report</strong> covering your fleet of <strong>${vehicleCount} vehicles</strong> for the 6-month period ending ${period}.</p>
      <p>This report includes a fleet summary with aggregate performance metrics, cost analysis, and a per-vehicle breakdown.</p>
      <p>Individual vehicle reports are also attached for your reference.</p>
      <p>If you have any questions, please contact your service manager.</p>
      <br/>
      <p>Best regards,<br/>Goldbell Engineering Services</p>
    </div>
  `;
}
