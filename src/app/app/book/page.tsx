import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import BookWizard from "@/components/book-wizard";

async function getData(userId: string) {
    const services = await db.service.findMany({
        orderBy: { name: 'asc' }
    });

    const employees = await db.user.findMany({
        where: { role: "CLEANER" },
        include: { employeeProfile: true },
        orderBy: { name: 'asc' }
    });

    const user = await db.user.findUnique({
        where: { id: userId },
        include: { customerProfile: true }
    });

    // Formatar serviços para serialização (Decimal -> number)
    const formattedServices = services.map((s: any) => ({
        ...s,
        price: Number(s.price)
    }));

    // Formatar funcionários
    const formattedEmployees = employees.map((e: any) => ({
        id: e.employeeProfile?.id || "",
        user: { name: e.name },
        color: e.employeeProfile?.color || "#000"
    })).filter((e: any) => e.id !== ""); // Remove se não tiver profile

    const userAddress = user?.customerProfile?.address || "";

    // Extrair todas as regiões únicas atendidas
    const allRegions = Array.from(new Set(employees.flatMap((e: any) => e.employeeProfile?.servedAreas || []))).sort() as string[];

    return {
        services: formattedServices,
        employees: formattedEmployees,
        userAddress,
        allRegions
    };
}

export default async function BookPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { services, employees, userAddress, allRegions } = await getData(session.user.id);

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Novo Agendamento</h1>
                <p className="text-muted-foreground">
                    Siga os passos para agendar sua limpeza.
                </p>
            </div>

            <BookWizard
                services={services}
                employees={employees}
                userAddress={userAddress}
                allRegions={allRegions}
            />
        </div>
    );
}
