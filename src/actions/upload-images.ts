"use server";

/**
 * Simula o upload de imagens para um bucket (ex: Supabase, S3).
 * Em um cenário real, as imagens seriam salvas e as URLs retornadas.
 */
export async function uploadProofImages(formData: FormData) {
    // Simulando delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));

    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
        return { urls: [] };
    }

    // Mock: Retornando URLs estáticas baseadas no nome do arquivo
    const urls = files.map(file => {
        return `https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=400&file=${encodeURIComponent(file.name)}`;
    });

    return { urls };
}
