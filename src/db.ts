import sql from 'mssql';
import { config } from './config';

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool;

  pool = await new sql.ConnectionPool({
    server: config.db.server,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    port: config.db.port,
    options: config.db.options,
    pool: config.db.pool,
  }).connect();

  console.log(`Connected to ${config.db.server}/${config.db.database}`);
  return pool;
}

export async function query<T = any>(
  sqlText: string,
  params?: Record<string, { type: (() => sql.ISqlType) | sql.ISqlType; value: any }>
): Promise<T[]> {
  const pool = await getPool();
  const request = pool.request();

  if (params) {
    for (const [name, param] of Object.entries(params)) {
      request.input(name, param.type, param.value);
    }
  }

  const result = await request.query(sqlText);
  return result.recordset as T[];
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Database connection closed');
  }
}

export { sql };
