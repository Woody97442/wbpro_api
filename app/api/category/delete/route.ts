import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkLevelAccess } from '@/lib/tools';
import { handleCors } from '@/middleware';

/**
 * DELETE /api/category/delete
 * Supprimer une catégorie
 * exemple de corps de requête :
    {
        "id": 12
    }
 *
 */

/**
 * Supprime une catégorie par son id
 */
export async function POST(req: Request) {
    try {
        const { id } = await req.json()

        if (!id) {
            return handleCors(
                NextResponse.json({ error: 'L\'id de la catégorie est requis' }, { status: 400 })
            )
        }

        // Récupérer le token dans l'en-tête de la requête
        const token = req.headers.get('Authorization')?.split(' ')[1]

        // Vérifier l'accès admin (niveau 2)
        const check = await checkLevelAccess(token, 2)
        if (!check.access) {
            return handleCors(
                NextResponse.json({ error: check.error }, { status: check.status })
            )
        }

        // Vérifier si la catégorie existe
        const category = await prisma.category.findUnique({ where: { id } })
        if (!category) {
            return handleCors(
                NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
            )
        }

        // Supprimer la catégorie
        await prisma.category.delete({ where: { id } })

        return handleCors(
            NextResponse.json({ message: 'Catégorie supprimée avec succès' }, { status: 200 })
        )
    } catch (error) {
        console.error('Erreur suppression catégorie:', error)
        return handleCors(
            NextResponse.json({ error: 'Erreur lors de la suppression de la catégorie' }, { status: 500 })
        )
    }
}

export async function OPTIONS(req: Request) {
    return handleCors(new NextResponse(null, { status: 204 }));
}