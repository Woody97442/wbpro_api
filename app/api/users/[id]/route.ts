import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { userUpdateSchema } from '@/lib/schemas/user.schema';
import { checkThisAccess } from '@/lib/tools';

/**
 * Récupérer un utilisateur par ID
 */
export async function GET(
    req: NextRequest,
    context: { params: { id: string } }
) {
    const params = await context.params // Attente explicite de params
    const { id } = params

    try {
        // Vérification du token dans les headers
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");

        // Vérification des droits d'accès avec la fonction utilitaire
        const accessCheck = await checkThisAccess(token, id);
        if (!accessCheck.access) {
            return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status });
        }

        const userId = parseInt(id, 10)

        if (isNaN(userId)) {
            return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (err) {
        console.error(err)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de l’utilisateur.' },
            { status: 500 }
        )
    }
}

/**
 * Modifier un utilisateur par ID
 */
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
    const params = await context.params  // Attente explicite de params
    const { id } = params

    try {
        // Vérification du token dans les headers
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");

        // Vérification des droits d'accès avec la fonction utilitaire
        const accessCheck = await checkThisAccess(token, id);
        if (!accessCheck.access) {
            return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status });
        }

        const body = await req.json()
        const parse = userUpdateSchema.safeParse(body)

        if (!parse.success) {
            return NextResponse.json({ error: parse.error.flatten().fieldErrors }, { status: 400 })
        }

        // Liste des champs sensibles à ne pas modifier
        const sensitiveFields = ['role', 'createdAt', 'updatedAt'];

        if (Object.keys(body).some(field => sensitiveFields.includes(field))) {
            return NextResponse.json({ error: 'Vous ne pouvez pas modifier des champs sensibles.' }, { status: 400 });
        }

        const userId = parseInt(id, 10)
        if (isNaN(userId)) {
            return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: parse.data,
            select: {
                id: true,
                email: true,
                name: true
            }
        })

        return NextResponse.json(updatedUser)
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 })
    }
}

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
            return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status });
        }

        const userId = parseInt(id, 10)
        if (isNaN(userId)) {
            return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
        }

        const user = await prisma.user.delete({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true
            }
        })

        return NextResponse.json({ message: 'Utilisateur supprimé.', user })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Erreur lors de la suppression de l’utilisateur.' }, { status: 500 })
    }
}