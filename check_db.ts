const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- DATABASE CHECK ---')

    const tenants = await prisma.tenant.findMany()
    console.log('TENANTS:', JSON.stringify(tenants, null, 2))

    const admin = await prisma.user.findUnique({
        where: { email: 'admin@cleanfast.com' }
    })
    console.log('ADMIN USER:', JSON.stringify(admin, null, 2))

    const clients = await prisma.user.findMany({
        where: { role: 'CLIENT' },
        include: { customerProfile: true }
    })
    console.log('CLIENTS:', JSON.stringify(clients, null, 2))

    console.log('--- END CHECK ---')
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
