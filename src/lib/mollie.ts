export type MolliePaymentResponse = {
    id: string;
    status: 'open' | 'canceled' | 'pending' | 'authorized' | 'expired' | 'failed' | 'paid';
    _links: {
        checkout: { href: string; type: string };
    };
};

export async function createMolliePayment(
    apiKey: string,
    amount: string,
    description: string,
    redirectUrl: string,
    webhookUrl: string
) {
    // Ensure amount has 2 decimal places
    const formattedAmount = Number(amount).toFixed(2);

    const response = await fetch('https://api.mollie.com/v2/payments', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            amount: {
                currency: 'EUR', // iDEAL only supports EUR
                value: formattedAmount,
            },
            description,
            redirectUrl,
            webhookUrl,
            method: ['ideal'], // Force iDEAL if desired, or leave empty for all methods
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Mollie API Error:', error);
        throw new Error(error.detail || 'Falha ao criar pagamento no Mollie');
    }

    return await response.json() as MolliePaymentResponse;
}

export async function getMolliePayment(apiKey: string, paymentId: string) {
    const response = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
    });

    if (!response.ok) {
        throw new Error('Falha ao consultar pagamento no Mollie');
    }

    return await response.json() as MolliePaymentResponse;
}
