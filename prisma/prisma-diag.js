const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        console.log('Checking for active locks/queries...');
        const results = await prisma.$queryRawUnsafe(`
            SELECT pid, state, query, wait_event_type, wait_event, now() - query_start AS duration
            FROM pg_stat_activity
            WHERE state <> 'idle' AND pid <> pg_backend_pid();
        `);
        console.log('Active Queries:', JSON.stringify(results, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
