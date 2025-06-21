// src/app/api/category/get/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleCors } from '@/middleware';

/**
 * GET /api/category/get
 * - Lister toutes les catégories
 * - ou une seule par ID ou slug (ex: ?id=1 ou ?slug=clothing)
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    try {
        if (id || slug) {
            const category = await prisma.category.findFirst({
                where: {
                    OR: [
                        id ? { id: parseInt(id) } : undefined,
                        slug ? { slug } : undefined,
                    ].filter(Boolean) as any,
                },
                include: {
                    _count: {
                        select: { products: true },
                    },
                },
            });

            if (!category) {
                return handleCors(
                    NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
                );
            }

            return handleCors(
                NextResponse.json(
                    {
                        message: 'Catégorie récupérée avec succès',
                        category,
                    },
                    { status: 200 }
                )
            );
        }

        // Si pas d'id ni de slug → on retourne tout
        const categories = await prisma.category.findMany({
            orderBy: { id: 'asc' },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        return handleCors(
            NextResponse.json(
                {
                    message: 'Catégories récupérées avec succès',
                    categories,
                },
                { status: 200 }
            )
        );
    } catch (error) {
        console.error('Erreur récupération catégories :', error);
        return handleCors(
            NextResponse.json(
                { error: 'Erreur lors de la récupération des catégories' },
                { status: 500 }
            )
        );
    }
}

export async function OPTIONS(req: Request) {
    return handleCors(new NextResponse(null, { status: 204 }));
}