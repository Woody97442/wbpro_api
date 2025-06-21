import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkLevelAccess } from '@/lib/tools'
import { handleCors } from '@/middleware'

/**
 * Supprimer un produit via id ou référence
 */
export async function DELETE(req: Request) {
    try {
        const token = req.headers.get('Authorization')?.split(' ')[1]
        const check = await checkLevelAccess(token, 2)

        if (!check.access) {
            return handleCors(NextResponse.json({ error: check.error }, { status: check.status }))
        }

        const body = await req.json()
        const { id, reference } = body

        if (!id && !reference) {
            return handleCors(NextResponse.json({ error: 'Veuillez fournir un id ou une référence' }, { status: 400 }))
        }

        const whereClause = id ? { id: parseInt(id) } : { reference }

        const existingProduct = await prisma.product.findFirst({ where: whereClause })
        if (!existingProduct) {
            return handleCors(NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 }))
        }

        await prisma.product.delete({ where: { id: existingProduct.id } })

        return handleCors(NextResponse.json({ message: 'Produit supprimé avec succès' }, { status: 200 }))

    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json({ error: 'Erreur lors de la suppression du produit' }, { status: 500 }))
    }
}

export async function OPTIONS(req: Request) {
    return handleCors(new NextResponse(null, { status: 204 }))
}
