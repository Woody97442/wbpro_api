import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkLevelAccess } from '@/lib/tools';
import { handleCors } from '@/middleware';

/**
 * Lister les utilisateur.
 */
export async function GET(req: Request) {
    try {

        // Récupérer le token dans l'en-tête de la requête
        const token = req.headers.get('Authorization')?.split(' ')[1];

        const check = await checkLevelAccess(token, 2)
        if (check.access === false) {
            return handleCors(NextResponse.json({ error: check.error }, { status: check.status }))
        }

        const users = await prisma.user.findMany(
            {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true
                }
            }
        )
        return handleCors(NextResponse.json(users))

    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json(
            { error: 'Erreur lors de la récupération des utilisateurs.' },
            { status: 500 }
        ))
    }
}

export async function OPTIONS(req: Request) {
    return handleCors(new NextResponse(null, { status: 204 }));
}