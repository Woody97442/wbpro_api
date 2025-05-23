import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkThisAccess, checkLevelAccess } from '@/lib/tools'
import { handleCors } from '@/middleware'

/**
 * Récupérer les commandes d’un utilisateur ou toutes les commandes si admin
 */
export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '')

        if (!token) {
            return handleCors(NextResponse.json({ error: 'Token manquant' }, { status: 401 }))
        }

        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return handleCors(NextResponse.json({ error: 'Paramètre userId manquant' }, { status: 400 }))
        }

        // Vérifie si l'utilisateur est admin
        const adminCheck = await checkLevelAccess(token, 2)
        if (adminCheck.access) {
            const allOrders = await prisma.order.findMany({
                include: {
                    user: { select: { id: true, email: true, name: true } },
                }
            })
            return handleCors(NextResponse.json(allOrders))
        }

        // Vérifie si l'utilisateur a le droit d'accéder à ses propres commandes
        const userCheck = await checkThisAccess(token, userId)
        if (!userCheck.access) {
            return handleCors(NextResponse.json({ error: userCheck.error }, { status: userCheck.status }))
        }

        const userOrders = await prisma.order.findMany({
            where: { userId: parseInt(userId, 10) },
            include: {
                // Ajoute ici tes relations (ex: produits)
            }
        })

        return handleCors(NextResponse.json(userOrders))

    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json({ error: 'Erreur lors de la récupération des commandes.' }, { status: 500 }))
    }
}


export async function OPTIONS(req: NextRequest) {
    return handleCors(new NextResponse(null, { status: 204 }))
}
