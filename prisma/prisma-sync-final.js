const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        console.log('Setting timeouts and clearing table locks...');
        // Tenta limpar sessões que possam estar travando a tabela Appointment
        try {
            await prisma.$executeRawUnsafe(`
                SELECT pg_terminate_backend(pid) 
                FROM pg_stat_activity 
                WHERE pid <> pg_backend_pid() 
                AND query LIKE '%Appointment%'
                AND state <> 'idle';
            `);
            console.log('Potential blocking sessions terminated.');
        } catch (lockErr) {
            console.log('Note: Could not terminate sessions (common if not superuser), proceeding anyway.');
        }

        await prisma.$executeRawUnsafe('SET statement_timeout = 30000;');
        await prisma.$executeRawUnsafe('SET lock_timeout = 10000;');

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
        console.error('Final sync attempt failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
