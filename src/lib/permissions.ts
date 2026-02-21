export const ADMIN_PERMISSIONS = [
    { key: "admin:full", label: "Acesso Total (Super Admin)", description: "Permite gerenciar tudo, incluindo configurações e outros admins." },
    { key: "finance:manage", label: "Gerenciar Financeiro", description: "Ver faturas, processar faturamento e gerenciar movimentações." },
    { key: "finance:read", label: "Ver Financeiro (Somente Leitura)", description: "Apenas visualização do dashboard e faturas." },
    { key: "team:manage", label: "Gerenciar Equipe/Funcionários", description: "Contratar, editar e demitir membros da equipe." },
    { key: "team:read", label: "Ver Equipe (Somente Leitura)", description: "Visualizar lista de funcionários e suas escalas." },
    { key: "customers:manage", label: "Gerenciar Clientes", description: "Cadastrar, editar e organizar base de clientes." },
    { key: "appointments:manage", label: "Gerenciar Agendamentos", description: "Criar, editar e cancelar qualquer agendamento." },
    { key: "services:manage", label: "Gerenciar Serviços", description: "Configurar catálogo e preços." },
    { key: "routes:view", label: "Ver Rotas em Tempo Real", description: "Acompanhar cleaners no mapa." },
];

export const STAFF_PERMISSIONS = [
    { key: "routes:view_self", label: "Ver Próprias Rotas", description: "Ver apenas os agendamentos atribuídos ao próprio cleaner." },
    { key: "appointments:confirm", label: "Confirmar Chegada/Início", description: "Marcar início do serviço." },
    { key: "appointments:finish", label: "Finalizar Serviço", description: "Concluir visita e anexar fotos/avisos." },
    { key: "appointments:view_details", label: "Ver Detalhes do Cliente", description: "Ver endereço completo, acesso e notas do cliente." },
];
