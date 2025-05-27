import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkThisAccess, updateCartTotal, verifyJwtToken } from '@/lib/tools'
import { handleCors } from '@/middleware'
import { UserSession } from '@/types/types'

async function deleteCartItem(userId: number, productId: number) {
    const cart = await prisma.cart.findFirst({
        where: {
            userId,
            isActive: true,
        },
    })

    if (!cart) return { error: 'Panier non trouvé.', status: 404 }

    await prisma.cartItem.deleteMany({
        where: {
            cartId: cart.id,
            productId,
        },
    })

    await updateCartTotal(cart.id)

    return { message: 'Produit supprimé du panier.', status: 200 }
}

export async function PATCH(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return handleCors(NextResponse.json({ message: 'Token manquant', status: 401 }))
        }

        const userSession = await verifyJwtToken(token) as UserSession
        if (!userSession?.id) {
            return handleCors(NextResponse.json({ message: 'Token invalide', status: 401 }))
        }

        const { productId, quantity } = await req.json()

        const parsedProductId = parseInt(productId, 10)
        const parsedQuantity = parseInt(quantity, 10)

        if (isNaN(parsedProductId) || isNaN(parsedQuantity)) {
            return handleCors(NextResponse.json({ message: 'productId ou quantity invalide.', status: 400 }))
        }

        const userId = userSession.id

        const userCheck = await checkThisAccess(token, userId.toString())
        if (!userCheck.access) {
            return handleCors(NextResponse.json({ message: userCheck.error, status: userCheck.status }))
        }

        const cart = await prisma.cart.findFirst({
            where: {
                userId,
                isActive: true,
            },
        })

        if (!cart) {
            return handleCors(NextResponse.json({ message: 'Panier non trouvé.', status: 404 }))
        }

        if (parsedQuantity <= 0) {
            const deletion = await deleteCartItem(userId, parsedProductId)
            return handleCors(NextResponse.json({ message: deletion.message, status: deletion.status }))
        }

        // Mettre à jour la quantité du produit
        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId: parsedProductId,
            },
        })

        if (!existingItem) {
            return handleCors(NextResponse.json({ message: 'Produit non trouvé dans le panier.', status: 404 }))
        }

        await prisma.cartItem.update({
            where: {
                id: existingItem.id,
            },
            data: {
                quantity: parsedQuantity,
            },
        })

        await updateCartTotal(cart.id)

        return handleCors(NextResponse.json({ message: 'Quantité mise à jour.', status: 200 }))
    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json({ message: 'Erreur lors de la mise à jour.', status: 500 }))
    }
}

export async function OPTIONS(req: NextRequest) {
    return handleCors(new NextResponse(null, { status: 204 }))
}
