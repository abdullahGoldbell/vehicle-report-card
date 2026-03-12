import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  db: {
    server: process.env.DB_SERVER || 'GBITR01V.goldbell.com.sg',
    database: process.env.DB_DATABASE || 'MAXIMO',
    user: process.env.DB_USER || 'ReadUser',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true' ? true : false,
      trustServerCertificate: true,
      requestTimeout: 300000,
      connectionTimeout: 60000,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
    from: process.env.SMTP_FROM || 'noreply@goldbell.com.sg',
  },
  siteId: process.env.SITE_ID || 'GBE',
  outputDir: path.resolve(process.env.REPORT_OUTPUT_DIR || './output'),
};
