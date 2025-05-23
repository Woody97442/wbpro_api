import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkThisAccess, updateCartTotal } from '@/lib/tools'
import { handleCors } from '@/middleware'

export async function DELETE(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return handleCors(NextResponse.json({ error: 'Token manquant' }, { status: 401 }))
        }

        const { userId, productId } = await req.json()

        if (!userId || !productId) {
            return handleCors(NextResponse.json({ error: 'userId et productId sont requis.' }, { status: 400 }))
        }

        const userCheck = await checkThisAccess(token, userId)
        if (!userCheck.access) {
            return handleCors(NextResponse.json({ error: userCheck.error }, { status: userCheck.status }))
        }

        // Récupérer le panier de l'utilisateur
        const cart = await prisma.cart.findFirst({
            where: {
                userId: parseInt(userId, 10),
                isActive: true,
            },
        })

        if (!cart) {
            return handleCors(NextResponse.json({ error: 'Panier non trouvé.' }, { status: 404 }))
        }

        // Supprimer l'élément du panier
        await prisma.cartItem.deleteMany({
            where: {
                cartId: cart.id,
                productId: parseInt(productId, 10),
            },
        })
        // Mettre à jour le total du panier
        await updateCartTotal(cart.id)

        return handleCors(NextResponse.json({ message: 'Produit supprimé du panier.' }))
    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 }))
    }
}

export async function OPTIONS(req: NextRequest) {
    return handleCors(new NextResponse(null, { status: 204 }))
}
