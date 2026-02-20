const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        const sql = `
            ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "customDuration" INTEGER;
            ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "priorityAreas" TEXT;
            ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "warnings" TEXT;
        `;

        console.log('Running SQL...');
        // Aumentar o timeout da query se necessário (padrão é infinito no pg driver mas o DB pode ter limites)
        await client.query(sql);
        console.log('SQL executed successfully');
    } catch (err) {
        console.error('Error executing SQL:', err);
    } finally {
        await client.end();
    }
}

run();
