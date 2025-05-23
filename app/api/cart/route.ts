import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkThisAccess } from '@/lib/tools'
import { handleCors } from '@/middleware'

export async function GET(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return handleCors(NextResponse.json({ error: 'Token manquant' }, { status: 401 }))
        }

        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return handleCors(NextResponse.json({ error: 'userId manquant' }, { status: 400 }))
        }

        const userCheck = await checkThisAccess(token, userId)
        if (!userCheck.access) {
            return handleCors(NextResponse.json({ error: userCheck.error }, { status: userCheck.status }))
        }

        const parsedUserId = parseInt(userId, 10)

        // Récupère le panier de l'utilisateur
        const cart = await prisma.cart.findFirst({
            where: {
                userId: parsedUserId,
                isActive: true,
            },
            include: {
                items: true, // Inclure les items du panier
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
