import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { userUpdateProfileSchema } from '@/lib/schemas/user.schema';
import { checkThisAccess } from '@/lib/tools';
import { handleCors } from '@/middleware';


/**
 * Modifier le profil d'un utilisateur
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
            return handleCors(NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status }));
        }

        const body = await req.json()
        const parse = userUpdateProfileSchema.safeParse(body)

        if (!parse.success) {
            return handleCors(NextResponse.json({ error: parse.error.flatten().fieldErrors }, { status: 400 }))
        }

        // Liste des champs sensibles à ne pas modifier
        const sensitiveFields = ['role', 'createdAt', 'updatedAt', 'email', 'password'];

        if (Object.keys(body).some(field => sensitiveFields.includes(field))) {
            return handleCors(NextResponse.json({ error: 'Vous ne pouvez pas modifier des champs sensibles.' }, { status: 400 }));
        }

        const userId = parseInt(id, 10)
        if (isNaN(userId)) {
            return handleCors(NextResponse.json({ error: 'ID invalide' }, { status: 400 }))
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: parse.data.newProfilName
            },
            select: {
                id: true,
                email: true,
                name: true
            }
        })

        return handleCors(NextResponse.json(updatedUser))
    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 }))
    }
}


export async function OPTIONS(req: NextRequest) {
    return handleCors(new NextResponse(null, { status: 204 }));
}