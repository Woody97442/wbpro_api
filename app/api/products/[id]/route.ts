import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkLevelAccess } from '@/lib/tools';
import { handleCors } from '@/middleware';

interface Params {
    params: {
        id: string
    }
}

/**
 * Récupérer un produit par ID.
 */
export async function GET(_req: Request, { params }: Params) {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
        return handleCors(NextResponse.json({ error: "ID invalide" }, { status: 400 }));
    }

    try {
        const product = await prisma.product.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                stock: true,
                reference: true,
                images: true
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

/**
 * Modifier un produit par ID.
 */
export async function PUT(req: Request, { params }: Params) {
    const id = parseInt(params.id, 10);
    const { name, description, price, stock, reference, images } = await req.json();

    // Récupérer le token dans l'en-tête de la requête
    const token = req.headers.get('Authorization')?.split(' ')[1]

    // Vérifier si l'utilisateur a un niveau d'accès suffisant (niveau 2 pour admin)
    const check = await checkLevelAccess(token, 2)
    if (check.access === false) {
        return handleCors(NextResponse.json({ error: check.error }, { status: check.status }))
    }

    if (isNaN(id)) {
        return handleCors(NextResponse.json({ error: "ID invalide" }, { status: 400 }));
    }

    try {
        // Vérifie si la référence est déjà utilisée par un autre produit
        const existingProductWithReference = await prisma.product.findFirst({
            where: {
                reference,
                NOT: { id },
            }
        });

        if (existingProductWithReference) {
            return handleCors(NextResponse.json({ error: 'Référence déjà utilisée' }, { status: 400 }));
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name,
                description: description || null,
                price,
                stock,
                reference,
                images: JSON.stringify(images),
            },
        });

        return handleCors(NextResponse.json(updatedProduct));
    } catch (err) {
        console.error(err);
        return handleCors(NextResponse.json({ error: "Erreur lors de la mise à jour du produit." }, { status: 500 }));
    }
}

/**
 * Supprimer un produit par ID.
 */
export async function DELETE(req: Request, { params }: Params) {

    // Récupérer le token dans l'en-tête de la requête
    const token = req.headers.get('Authorization')?.split(' ')[1]

    // Vérifier si l'utilisateur a un niveau d'accès suffisant (niveau 2 pour admin)
    const check = await checkLevelAccess(token, 2)
    if (check.access === false) {
        return handleCors(NextResponse.json({ error: check.error }, { status: check.status }))
    }

    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
        return handleCors(NextResponse.json({ error: "ID invalide" }, { status: 400 }));
    }

    try {
        const product = await prisma.product.delete({
            where: { id },
        });

        return handleCors(NextResponse.json({ message: "Produit supprimé avec succès", product }));
    } catch (err) {
        console.error(err);
        return handleCors(NextResponse.json({ error: "Erreur lors de la suppression du produit." }, { status: 500 }));
    }
}

export async function OPTIONS(req: NextRequest) {
    return handleCors(new NextResponse(null, { status: 204 }));
}