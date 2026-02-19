const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

const MAIN_TENANT_ID = 'c0a80101-0000-0000-0000-000000000000'
const ADMIN_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

async function main() {
    // 1. Criar Tenant (Empresa de Limpeza)
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'cleanfast' },
        update: {},
        create: {
            id: MAIN_TENANT_ID,
            name: 'CleanFast Services',
            slug: 'cleanfast',
        },
    })

    console.log('Tenant verificado/criado:', tenant.name)

    // 2. Criar Usuário Admin (SUPER_ADMIN)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@cleanfast.com' },
        update: {
            id: ADMIN_USER_ID,
            role: 'SUPER_ADMIN',
            tenantId: tenant.id
        },
        create: {
            id: ADMIN_USER_ID,
            email: 'admin@cleanfast.com',
            name: 'Admin User',
            password: await bcrypt.hash('password123', 10),
            role: 'SUPER_ADMIN',
            tenantId: tenant.id,
        },
    })
    console.log('Admin verificado/atualizado para SUPER_ADMIN:', admin.email)

    // 3. Criar Serviços
    const service = await prisma.service.upsert({
        where: { id: 'default-service-id' }, // We'll keep it static for seed simplicity if possible, or just find
        update: {},
        create: {
            id: 'default-service-id',
            name: 'Limpeza Residencial Padrão',
            description: 'Limpeza de manutenção (até 100m²)',
            price: 150.00,
            durationMin: 120,
            tenantId: tenant.id,
        },
    })

    // 4. Criar Cleaner
    const cleanerUser = await prisma.user.upsert({
        where: { email: 'joao.cleaner@cleanfast.com' },
        update: { role: 'CLEANER' },
        create: {
            email: 'joao.cleaner@cleanfast.com',
            name: 'João Silva',
            password: await bcrypt.hash('password123', 10),
            role: 'CLEANER',
            tenantId: tenant.id,
            employeeProfile: {
                create: {
                    phone: '11999999999',
                    color: '#3b82f6',
                    tenantId: tenant.id
                }
            }
        },
        include: {
            employeeProfile: true
        }
    })

    // 5. Criar Cliente
    const clientUser = await prisma.user.upsert({
        where: { email: 'maria.cliente@gmail.com' },
        update: { role: 'CLIENT' },
        create: {
            email: 'maria.cliente@gmail.com',
            name: 'Maria Oliveira',
            password: await bcrypt.hash('password123', 10),
            role: 'CLIENT',
            tenantId: tenant.id,
            customerProfile: {
                create: {
                    phone: '11988888888',
                    address: 'Rua das Flores, 123 - Centro',
                    tenantId: tenant.id
                }
            }
        },
        include: {
            customerProfile: true
        }
    })

    console.log('Seed concluído com sucesso!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
