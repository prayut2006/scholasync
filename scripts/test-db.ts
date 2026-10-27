/**
 * Automated Database Connection & Migration Diagnostic Test
 * Run: npx tsx scripts/test-db.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { testDatabaseConnection } from '../src/server/prisma.ts';

async function runDiagnostic() {
  console.log('========================================================');
  console.log('  ScholaSync - MySQL Database & Prisma Diagnostic Test');
  console.log('========================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Node.js:   ${process.version}`);
  console.log(`OS:        ${process.platform} (${process.arch})`);
  console.log('--------------------------------------------------------');

  console.log('Testing Database Connection...\n');
  const result = await testDatabaseConnection();

  if (result.connected) {
    console.log(' [SUCCESS] Database Connection Established!');
    console.log(`  - Provider:       ${result.provider}`);
    console.log(`  - Host:           ${result.host}:${result.port}`);
    console.log(`  - Database:       ${result.database}`);
    console.log(`  - Server Version: ${result.serverVersion}`);
    console.log(`  - Query Latency:  ${result.latencyMs}ms`);
    console.log('\nAll core backend database primitives are operational.');
    process.exit(0);
  } else {
    console.log(' [NOTICE / ENVIRONMENT CHECK] Database Connection Result:');
    console.log(`  - Provider:       ${result.provider}`);
    console.log(`  - Configured:     ${result.databaseUrlConfigured ? 'YES' : 'NO'}`);
    if (result.urlSanitized) {
      console.log(`  - Target URL:     ${result.urlSanitized}`);
      console.log(`  - Target Host:    ${result.host}:${result.port}`);
      console.log(`  - Target DB:      ${result.database}`);
    }
    console.log(`  - Diagnostic Error:\n    ${result.error}`);
    console.log('\n--------------------------------------------------------');
    console.log('EXACT COMMANDS TO RESOLVE ENVIRONMENT ISSUES:');
    console.log('--------------------------------------------------------');
    if (!result.databaseUrlConfigured) {
      console.log('1. Set your MySQL connection string in .env:');
      console.log('   DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<dbname>"');
      console.log('\n2. Example for local Docker MySQL:');
      console.log('   docker run -d --name scholasync-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=scholasync mysql:8.0');
      console.log('   DATABASE_URL="mysql://root:password@localhost:3306/scholasync"');
    } else {
      console.log('1. Ensure the MySQL server is running and accessible at:');
      console.log(`   ${result.host}:${result.port}`);
      console.log('\n2. If using Docker, start the container:');
      console.log('   docker start scholasync-mysql');
      console.log('\n3. Run Prisma migration deployment:');
      console.log('   npx prisma migrate deploy');
    }
    console.log('--------------------------------------------------------\n');
    process.exit(1);
  }
}

runDiagnostic().catch((err) => {
  console.error('Diagnostic runner encountered an unexpected error:', err);
  process.exit(1);
});
