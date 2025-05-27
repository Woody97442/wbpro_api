import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleCors } from '@/middleware'
import { UserSession } from '@/types/types'
import { verifyJwtToken } from '@/lib/tools'

const secret = process.env.JWT_SECRET
export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return handleCors(NextResponse.json({ error: 'Token manquant' }, { status: 401 }))
        }

        const userSession = await verifyJwtToken(token) as UserSession

        if (!userSession) {
            return handleCors(NextResponse.json({ error: 'Token manquant' }, { status: 401 }))
        }

        const userId = userSession.id

        if (!userId) {
            return handleCors(NextResponse.json({ error: 'userId introuvable dans le token' }, { status: 400 }))
        }

        // 🔄 Récupère le panier de l'utilisateur
        const cart = await prisma.cart.findFirst({
            where: {
                userId: userId,
                isActive: true,
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        })

        if (!cart) {
            return handleCors(NextResponse.json({ error: 'Panier non trouvé' }, { status: 404 }))
        }

        return handleCors(NextResponse.json(cart))
    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json({ error: 'Erreur lors de la récupération du panier.' }, { status: 500 }))
    }
}

export async function OPTIONS(req: NextRequest) {
    return handleCors(new NextResponse(null, { status: 204 }))
}
