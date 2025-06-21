import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleCors } from '@/middleware'


/**
 * GET /api/products/get
 * exemple de corps de requête :
    /api/products/get → tous les produits
    /api/products/get?id=1 → produit par ID
    /api/products/get?reference=PROD-001-XXX → produit par référence
    /api/products/get?category=3 → produits d’une catégorie
    * /api/products/get?minRating=4.5 → produits avec note ≥ 4.5
*/

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        const reference = searchParams.get('reference')
        const categoryId = searchParams.get('categoryId')
        const minRating = searchParams.get('minRating')

        if (id || reference) {
            const product = await prisma.product.findFirst({
                where: {
                    ...(id && { id: parseInt(id) }),
                    ...(reference && { reference }),
                },
                include: { category: true }
            })

            if (!product) {
                return handleCors(NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 }))
            }

            return handleCors(NextResponse.json({ product }, { status: 200 }))
        }

        if (categoryId) {
            const products = await prisma.product.findMany({
                where: { categoryId: parseInt(categoryId) },
                orderBy: { createdAt: 'desc' },
                include: { category: true }
            })

            return handleCors(NextResponse.json({ products }, { status: 200 }))
        }

        // Préparer les conditions dynamiques
        const whereConditions: any = {};

        if (categoryId) {
            whereConditions.categoryId = parseInt(categoryId);
        }

        if (minRating) {
            whereConditions.rating = {
                gte: parseFloat(minRating),
            };
        }

        // Récupération des produits filtrés ou non
        const products = await prisma.product.findMany({
            where: whereConditions,
            orderBy: { createdAt: 'desc' },
            include: { category: true },
        });

        return handleCors(NextResponse.json({ products }, { status: 200 }))
    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json({ error: 'Erreur lors de la récupération des produits' }, { status: 500 }))
    }
}

export async function OPTIONS(req: Request) {
    return handleCors(new NextResponse(null, { status: 204 }))
}
