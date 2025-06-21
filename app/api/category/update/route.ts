import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkLevelAccess } from '@/lib/tools';
import { handleCors } from '@/middleware';

/**
 * UPDATE /api/category/update
 * Mettre à jour une catégorie
 * exemple de corps de requête :
    {
        "id": 12,
        "name": "Nouveau nom",
    }
 *
 */

/**
 * Met à jour une catégorie par son id
 */
export async function POST(req: Request) {
    try {
        const { id, name } = await req.json()

        if (!id) {
            return handleCors(
                NextResponse.json({ error: 'L\'id de la catégorie est requis' }, { status: 400 })
            )
        }

        // Récupérer le token dans l'en-tête
        const token = req.headers.get('Authorization')?.split(' ')[1]

        // Vérifier le niveau d'accès admin (niveau 2)
        const check = await checkLevelAccess(token, 2)
        if (!check.access) {
            return handleCors(
                NextResponse.json({ error: check.error }, { status: check.status })
            )
        }

        // Vérifier que la catégorie existe
        const existingCategory = await prisma.category.findUnique({ where: { id } })
        if (!existingCategory) {
            return handleCors(
                NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
            )
        }

        // Mise à jour (on ne met à jour que les champs fournis)
        const updatedCategory = await prisma.category.update({
            where: { id },
            data: {
                name: name ?? existingCategory.name,
            },
        })

        return handleCors(
            NextResponse.json({ message: 'Catégorie mise à jour', category: updatedCategory }, { status: 200 })
        )
    } catch (error) {
        console.error('Erreur mise à jour catégorie:', error)
        return handleCors(
            NextResponse.json({ error: 'Erreur lors de la mise à jour de la catégorie' }, { status: 500 })
        )
    }
}

export async function OPTIONS(req: Request) {
    return handleCors(new NextResponse(null, { status: 204 }));
}