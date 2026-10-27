import { PrismaClient } from '@prisma/client';

// Global PrismaClient singleton
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma = globalThis.prismaGlobal ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export interface DatabaseTestResult {
  connected: boolean;
  provider: string;
  databaseUrlConfigured: boolean;
  urlSanitized?: string;
  host?: string;
  port?: string;
  database?: string;
  latencyMs?: number;
  serverVersion?: string;
  error?: string;
  troubleshootingCommand?: string;
}

/**
 * Test MySQL database connection via Prisma
 */
export async function testDatabaseConnection(): Promise<DatabaseTestResult> {
  const rawUrl = process.env.DATABASE_URL;

  if (!rawUrl) {
    return {
      connected: false,
      provider: 'mysql',
      databaseUrlConfigured: false,
      error: 'Environment variable DATABASE_URL is not set in process.env or .env file.',
      troubleshootingCommand: 'export DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<dbname>"',
    };
  }

  // Parse sanitized details
  let sanitized = rawUrl;
  let host = 'localhost';
  let port = '3306';
  let database = 'scholasync';

  try {
    const parsed = new URL(rawUrl);
    host = parsed.hostname;
    port = parsed.port || '3306';
    database = parsed.pathname.replace(/^\//, '');
    sanitized = `${parsed.protocol}//${parsed.username}:****@${parsed.host}${parsed.pathname}`;
  } catch (e) {
    // If not valid URL format
  }

  const startTime = Date.now();

  try {
    // Run lightweight probe query
    const result: any = await prisma.$queryRaw`SELECT 1 as is_alive, VERSION() as version`;
    const latencyMs = Date.now() - startTime;
    const serverVersion = result && result[0] ? String(result[0].version) : 'MySQL 8.x';

    return {
      connected: true,
      provider: 'mysql',
      databaseUrlConfigured: true,
      urlSanitized: sanitized,
      host,
      port,
      database,
      latencyMs,
      serverVersion,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      connected: false,
      provider: 'mysql',
      databaseUrlConfigured: true,
      urlSanitized: sanitized,
      host,
      port,
      database,
      latencyMs,
      error: err.message || 'Failed to establish connection to MySQL database.',
      troubleshootingCommand: `docker run -d --name scholasync-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=${database} mysql:8.0`,
    };
  }
}
