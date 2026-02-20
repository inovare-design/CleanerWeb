const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const results = await prisma.$queryRawUnsafe(\`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Appointment'
            ORDER BY column_name;
        \`);
        console.log('All Appointment Columns:', JSON.stringify(results, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
