const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
    // 1. Criar Tenant (Empresa de Limpeza)
    const tenant = await prisma.tenant.create({
        data: {
            name: 'CleanFast Services',
            slug: 'cleanfast',
        },
    })

    console.log('Tenant criado:', tenant.name)

    // 2. Criar Usuário Admin
    const admin = await prisma.user.create({
        data: {
            email: 'admin@cleanfast.com',
            name: 'Admin User',
            password: await bcrypt.hash('password123', 10),
            role: 'ADMIN',
            tenantId: tenant.id,
        },
    })
    console.log('Admin criado:', admin.email)

    // 3. Criar Serviços
    const service = await prisma.service.create({
        data: {
            name: 'Limpeza Residencial Padrão',
            description: 'Limpeza de manutenção (até 100m²)',
            price: 150.00,
            durationMin: 120,
            tenantId: tenant.id,
        },
    })

    // 4. Criar Cleaner
    const cleanerUser = await prisma.user.create({
        data: {
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
    const clientUser = await prisma.user.create({
        data: {
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

    // 6. Criar Agendamento Exemplo
    await prisma.appointment.create({
        data: {
            startTime: new Date(new Date().setHours(10, 0, 0, 0)), // Hoje as 10h
            endTime: new Date(new Date().setHours(12, 0, 0, 0)),   // Hoje as 12h
            status: 'CONFIRMED',
            price: 150.00,
            address: 'Rua das Flores, 123 - Centro',
            serviceId: service.id,
            customerId: clientUser.customerProfile!.id, // Non-null assertion pois acabamos de criar
            employeeId: cleanerUser.employeeProfile!.id,
            tenantId: tenant.id,
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
