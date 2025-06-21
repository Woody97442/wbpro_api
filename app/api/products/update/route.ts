import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkLevelAccess } from '@/lib/tools'
import { handleCors } from '@/middleware'

/**
 * Mettre à jour un produit existant
 * 
 * exemple de corps de requête :
    {
        "id": 12, // ou "reference": "PROD-010-HOME"
        "name": "Nouveau nom",
        "price": 42.90,
        "stock": 99,
        "description": "Description mise à jour",
        "images": ["url1", "url2"]
    }
 */
export async function PATCH(req: Request) {
    try {
        const token = req.headers.get('Authorization')?.split(' ')[1]
        const check = await checkLevelAccess(token, 2)

        if (!check.access) {
            return handleCors(NextResponse.json({ error: check.error }, { status: check.status }))
        }

        const body = await req.json()
        const { id, reference, ...updates } = body

        if (!id && !reference) {
            return handleCors(NextResponse.json({ error: 'Veuillez fournir un id ou une référence' }, { status: 400 }))
        }

        const whereClause = id ? { id: parseInt(id) } : { reference }

        const existingProduct = await prisma.product.findFirst({ where: whereClause })
        if (!existingProduct) {
            return handleCors(NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 }))
        }

        // Gérer images (si fourni sous forme de tableau)
        if (Array.isArray(updates.images)) {
            updates.images = JSON.stringify(updates.images)
        }

        const updatedProduct = await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
                ...updates,
                updatedAt: new Date()
            }
        })

        return handleCors(NextResponse.json({
            message: 'Produit mis à jour avec succès',
            product: updatedProduct
        }, { status: 200 }))

    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json({ error: 'Erreur lors de la mise à jour du produit' }, { status: 500 }))
    }
}

export async function OPTIONS(req: Request) {
    return handleCors(new NextResponse(null, { status: 204 }))
}
