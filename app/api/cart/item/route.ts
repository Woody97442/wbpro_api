import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkThisAccess, updateCartTotal } from '@/lib/tools'
import { handleCors } from '@/middleware'

export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token) {
            return handleCors(NextResponse.json({ error: 'Token manquant' }, { status: 401 }))
        }

        const body = await req.json()
        const { userId, productId, quantity = 1 } = body

        if (!userId || !productId) {
            return handleCors(NextResponse.json({ error: 'userId et productId sont requis.' }, { status: 400 }))
        }

        const userCheck = await checkThisAccess(token, userId)
        if (!userCheck.access) {
            return handleCors(NextResponse.json({ error: userCheck.error }, { status: userCheck.status }))
        }

        const parsedUserId = parseInt(userId, 10)
        const parsedProductId = parseInt(productId, 10)

        // 🔄 Récupère ou crée un panier actif
        let cart = await prisma.cart.findFirst({
            where: {
                userId: parsedUserId,
                isActive: true,
            },
        })

        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    userId: parsedUserId,
                },
            })
        }

        // 🔍 Vérifie si le produit est déjà dans le panier
        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId: parsedProductId,
            },
        })

        if (existingItem) {
            // 🆙 Incrémente la quantité
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: {
                    quantity: existingItem.quantity + quantity,
                },
            })
        } else {
            // ➕ Ajoute le produit au panier
            const product = await prisma.product.findUnique({
                where: { id: parsedProductId },
                select: { price: true },
            })

            if (!product) {
                return handleCors(NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 }))
            }

            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: parsedProductId,
                    quantity,
                    unitPrice: product.price,
                },
            })
        }

        // 🔄 Recalculer et mettre à jour le total du panier
        await updateCartTotal(cart.id)

        return handleCors(NextResponse.json({ message: 'Produit ajouté au panier.' }))
    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json({ error: 'Erreur lors de l’ajout au panier.' }, { status: 500 }))
    }
}

export async function OPTIONS(req: NextRequest) {
    return handleCors(new NextResponse(null, { status: 204 }))
}
