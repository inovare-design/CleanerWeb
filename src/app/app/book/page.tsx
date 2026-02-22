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
    const userRegion = user?.customerProfile?.area || "";
    const userName = user?.name || "";

    // Extrair todas as regiões únicas atendidas
    const allRegions = Array.from(new Set(employees.flatMap((e: any) => e.employeeProfile?.servedAreas || []))).sort() as string[];

    return {
        services: formattedServices,
        employees: formattedEmployees,
        userAddress,
        userRegion,
        userName,
        allRegions
    };
}

export default async function BookPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { services, employees, userAddress, userRegion, userName, allRegions } = await getData(session.user.id);

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 leading-tight">Olá, {userName}! 👋<br />Vamos agendar sua limpeza?</h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Confirme os detalhes abaixo e escolha o melhor horário para você.
                </p>
            </div>

            <BookWizard
                services={services}
                employees={employees}
                userAddress={userAddress}
                userRegion={userRegion}
                allRegions={allRegions}
            />
        </div>
    );
}
