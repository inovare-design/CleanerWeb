import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL,
        },
    },
})

async function main() {
    console.log('Adding missing columns to Appointment table...')
    try {
        // Set a long timeout (10 minutes)
        await prisma.$executeRawUnsafe(`SET statement_timeout = '10min';`)
        console.log('Statement timeout set to 10 minutes.')

        console.log('Adding customDuration...')
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "customDuration" INTEGER;
        `)
        console.log('Column customDuration added or already exists.')

        console.log('Adding priorityAreas...')
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "priorityAreas" TEXT;
        `)
        console.log('Column priorityAreas added or already exists.')

        console.log('Adding warnings...')
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "warnings" TEXT;
        `)
        console.log('Column warnings added or already exists.')

        console.log('Database fix completed successfully.')
    } catch (error: any) {
        console.error('Error fixing database:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
