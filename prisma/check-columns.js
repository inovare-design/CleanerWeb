const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const results = await prisma.$queryRawUnsafe(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Appointment' 
            AND column_name IN ('warnings', 'priorityAreas', 'customDuration');
        `);
        console.log('Columns found:', JSON.stringify(results, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
