
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Checking SchedulingConfig table...')
        await prisma.schedulingConfig.findFirst()
        console.log('SUCCESS: Table exists and is queryable.')
    } catch (e: any) {
        console.error('FAILURE: Table likely does not exist or client is broken.')
        console.error(e.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
