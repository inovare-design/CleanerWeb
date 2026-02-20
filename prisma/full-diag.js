const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const results = await prisma.$queryRawUnsafe(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'Appointment'
            ORDER BY table_name, column_name;
        `);
        console.log('Columns in public.Appointment:', JSON.stringify(results, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
