import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkLevelAccess } from '@/lib/tools';
import { handleCors } from '@/middleware';

/**
 * Crée une catégorie
 */
export async function POST(req: Request) {
    try {
        const { name } = await req.json()

        // Vérification token et niveau d'accès
        const token = req.headers.get('Authorization')?.split(' ')[1]
        const check = await checkLevelAccess(token, 2)
        if (!check.access) {
            return handleCors(
                NextResponse.json({ error: check.error }, { status: check.status })
            )
        }

        // Vérifie si la catégorie existe déjà
        const existingCategory = await prisma.category.findUnique({ where: { name } })
        if (existingCategory) {
            return handleCors(
                NextResponse.json({ error: 'Catégorie déjà existante' }, { status: 400 })
            )
        }

        // Création de la catégorie
        const category = await prisma.category.create({
            data: {
                name,
                slug: name.replace(/\s+/g, '-').toLowerCase(),
                reference: name.replace(/\s+/g, '-').toLowerCase()
            },
        })

        return handleCors(
            NextResponse.json(
                {
                    message: 'Catégorie créée avec succès',
                    category,
                },
                { status: 201 }
            )
        )
    } catch (error) {
        console.error('Erreur création catégorie :', error)
        return handleCors(
            NextResponse.json(
                { error: 'Erreur lors de la création de la catégorie' },
                { status: 500 }
            )
        )
    }
}

export async function OPTIONS(req: Request) {
    return handleCors(new NextResponse(null, { status: 204 }));
}