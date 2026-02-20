const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const result = await prisma.$queryRawUnsafe(`SELECT * FROM "Appointment" LIMIT 1`);
        console.log('Sample Row keys:', Object.keys(result[0] || {}));
    } catch (e) {
        console.error('Error selecting from Appointment:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
