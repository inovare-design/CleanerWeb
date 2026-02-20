const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log('Connecting to database...');
    try {
        await prisma.$connect();
        console.log('Connected. Running ALTER TABLE...');

        // Executando comandos individualmente para isolar falhas se houver
        await prisma.$executeRawUnsafe('ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "customDuration" INTEGER;');
        console.log('Added customDuration');

        await prisma.$executeRawUnsafe('ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "priorityAreas" TEXT;');
        console.log('Added priorityAreas');

        await prisma.$executeRawUnsafe('ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "warnings" TEXT;');
        console.log('Added warnings');

        console.log('All columns synchronized successfully.');
    } catch (e) {
        console.error('Error during synchronization:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
