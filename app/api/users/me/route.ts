import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkThisAccess, verifyJwtToken } from '@/lib/tools';
import { handleCors } from '@/middleware';
import { UserSession } from '@/types/types';

/**
 * get information about the current user
 */
export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) return handleCors(NextResponse.json({ error: 'Token manquant' }, { status: 401 }))
        const userSession = await verifyJwtToken(token) as UserSession
        if (!userSession) return handleCors(NextResponse.json({ error: 'Token manquant' }, { status: 401 }))
        const userId = userSession.id

        // Vérification des droits d'accès avec la fonction utilitaire
        const accessCheck = await checkThisAccess(token, userId.toString());
        if (!accessCheck.access) {
            return handleCors(NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status }));
        }

        // Recupération de l'utilisateur
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true
            }
        })

        return handleCors(NextResponse.json({ message: 'Utilisateur récupéré.', user }))
    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json({ error: 'Erreur lors de la récupération de l’utilisateur.' }, { status: 500 }))
    }
}

export async function OPTIONS(req: NextRequest) {
    return handleCors(new NextResponse(null, { status: 204 }));
}