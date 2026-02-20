const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log('Connecting to database...');
    try {
        await prisma.$connect();
        console.log('Connected. Adjusting session timeout...');

        // Aumentar o timeout da sessão para 60 segundos
        await prisma.$executeRawUnsafe('SET statement_timeout = 60000;');

        const cols = [
            { name: 'customDuration', type: 'INTEGER' },
            { name: 'priorityAreas', type: 'TEXT' },
            { name: 'warnings', type: 'TEXT' }
        ];

        for (const col of cols) {
            console.log(`Adding ${col.name}...`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type};`);
            console.log(`Success adding ${col.name}`);
        }

        console.log('All columns synchronized successfully.');
    } catch (e) {
        console.error('Error during synchronization:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
