const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking AppointmentStatus enum levels...");
        // Apenas tentando buscar um agendamento fictício com o novo status
        // ou apenas imprimindo o que o Prisma acha que é o status
        const statuses = require('@prisma/client').AppointmentStatus;
        console.log("Status disponíveis no Prisma Client:", statuses);

        // Tenta uma query simples que usa um dos novos campos
        console.log("Testando query com campo cleanerConfirmationDate...");
        const count = await prisma.appointment.count({
            where: {
                cleanerConfirmationDate: { not: null }
            }
        });
        console.log("Query bem sucedida. Agendamentos finalizados:", count);

    } catch (e) {
        console.error("ERRO DE SCHEMA NO BANCO:");
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
