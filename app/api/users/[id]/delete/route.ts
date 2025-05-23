import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkThisAccess } from '@/lib/tools';
import { handleCors } from '@/middleware';


/**
 * Supprimer un utilisateur par ID
 */
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
    const params = await context.params  // Attente explicite de params
    const { id } = params

    try {
        // Vérification du token dans les headers
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");

        // Vérification des droits d'accès avec la fonction utilitaire
        const accessCheck = await checkThisAccess(token, id);
        if (!accessCheck.access) {
            return handleCors(NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status }));
        }

        const userId = parseInt(id, 10)
        if (isNaN(userId)) {
            return handleCors(NextResponse.json({ error: 'ID invalide' }, { status: 400 }))
        }

        const user = await prisma.user.delete({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true
            }
        })

        return handleCors(NextResponse.json({ message: 'Utilisateur supprimé.', user }))
    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json({ error: 'Erreur lors de la suppression de l’utilisateur.' }, { status: 500 }))
    }
}

export async function OPTIONS(req: NextRequest) {
    return handleCors(new NextResponse(null, { status: 204 }));
}