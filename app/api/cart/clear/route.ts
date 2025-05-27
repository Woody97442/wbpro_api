import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkThisAccess, verifyJwtToken } from '@/lib/tools'
import { handleCors } from '@/middleware'
import { UserSession } from '@/types/types'

export async function DELETE(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return handleCors(
                NextResponse.json({ error: 'Token manquant' }, { status: 401 })
            )
        }

        const userSession = await verifyJwtToken(token) as UserSession
        const userId = userSession?.id

        if (!userId) {
            return handleCors(
                NextResponse.json({ error: 'userId introuvable dans le token' }, { status: 400 })
            )
        }

        const userCheck = await checkThisAccess(token, userId.toString())
        if (!userCheck.access) {
            return handleCors(
                NextResponse.json({ error: userCheck.error }, { status: userCheck.status })
            )
        }

        // Récupérer le panier actif
        const cart = await prisma.cart.findFirst({
            where: {
                userId,
                isActive: true,
            },
        })

        if (!cart) {
            return handleCors(
                NextResponse.json({ error: 'Panier non trouvé.' }, { status: 404 })
            )
        }

        // Supprimer tous les articles du panier
        await prisma.cartItem.deleteMany({
            where: {
                cartId: cart.id,
            },
        })

        // Supprimer le panier lui-même
        await prisma.cart.delete({
            where: {
                id: cart.id,
            },
        })

        return handleCors(
            NextResponse.json({ message: 'Panier supprimé.' })
        )
    } catch (err) {
        console.error(err)
        return handleCors(
            NextResponse.json({ error: 'Erreur lors de la suppression du panier.' }, { status: 500 })
        )
    }
}

export async function OPTIONS(req: NextRequest) {
    return handleCors(new NextResponse(null, { status: 204 }))
}
