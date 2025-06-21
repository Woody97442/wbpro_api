import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkLevelAccess } from '@/lib/tools';
import { handleCors } from '@/middleware';

/**
 * Créer un produit manuellement et l'assigner à une catégorie
 */
export async function POST(req: Request) {
    try {
        const { name, description, price, stock, reference, images, categoryId } = await req.json()

        const token = req.headers.get('Authorization')?.split(' ')[1]

        const check = await checkLevelAccess(token, 2)
        if (!check.access) {
            return handleCors(NextResponse.json({ error: check.error }, { status: check.status }))
        }

        // Vérifier les champs requis
        if (!categoryId) {
            return handleCors(NextResponse.json({ error: 'categoryId manquant' }, { status: 400 }))
        }

        // Vérifie si la catégorie existe
        const existingCategory = await prisma.category.findUnique({ where: { id: categoryId } })
        if (!existingCategory) {
            return handleCors(NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 }))
        }

        const existingProduct = await prisma.product.findUnique({ where: { reference } })
        if (existingProduct) {
            return handleCors(NextResponse.json({ error: 'Produit déjà existant' }, { status: 400 }))
        }

        const newProduct = await prisma.product.create({
            data: {
                name,
                description: description || null,
                price,
                stock,
                reference,
                images: JSON.stringify(images),
                category: {
                    connect: { id: categoryId }
                }
            }
        })

        return handleCors(NextResponse.json({
            message: 'Produit créé avec succès',
            product: {
                id: newProduct.id,
                name: newProduct.name,
                description: newProduct.description,
                price: newProduct.price,
                stock: newProduct.stock,
                reference: newProduct.reference,
                images: newProduct.images,
                categoryId: newProduct.categoryId
            }
        }, { status: 201 }))

    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json({ error: 'Erreur lors de la création du produit' }, { status: 500 }))
    }
}

export async function OPTIONS(req: Request) {
    return handleCors(new NextResponse(null, { status: 204 }))
}
