import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleCors } from '@/middleware';

interface Params {
    params: {
        reference: string
    }
}

/**
 * Récupérer un produit par Référence.
 */
export async function GET(_req: Request, { params }: Params) {
    const { reference } = await params;

    if (!reference) {
        return handleCors(NextResponse.json({ error: "Référence invalide" }, { status: 400 }));
    }

    try {
        const product = await prisma.product.findUnique({
            where: { reference },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                stock: true,
                reference: true,
            }
        });

        if (!product) {
            return handleCors(NextResponse.json({ error: "Produit non trouvé" }, { status: 404 }));
        }

        return handleCors(NextResponse.json(product));
    } catch (err) {
        console.error(err);
        return handleCors(NextResponse.json({ error: "Erreur lors de la récupération du produit." }, { status: 500 }));
    }
}

export async function OPTIONS(req: NextRequest) {
    return handleCors(new NextResponse(null, { status: 204 }));
}