import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkLevelAccess } from '@/lib/tools';
import { handleCors } from '@/middleware';

/**
 * Lister tous les Produits.
 */
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                stock: true,
                reference: true,
                images: true,
                createdAt: true,
                updatedAt: true,
                specialty: true,
                country: true,
                preferences: true,
                likes: true,
                dislikes: true,
            }
        })
        return handleCors(NextResponse.json({ success: true, result: products }))

    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json(
            { error: 'Erreur lors de la récupération des produits.' },
            { status: 500 }
        ))
    }
}

/**
 * Créer un produit manuellement (uniquement accessible aux admins).
 */
export async function POST(req: Request) {
    try {
        const { name, description, price, stock, reference, images } = await req.json()

        // Récupérer le token dans l'en-tête de la requête
        const token = req.headers.get('Authorization')?.split(' ')[1]

        // Vérifier si l'utilisateur a un niveau d'accès suffisant (niveau 2 pour admin)
        const check = await checkLevelAccess(token, 2)
        if (!check.access) {
            return handleCors(NextResponse.json({ error: check.error }, { status: check.status }))
        }

        // Vérifie si un produit avec ce nom existe déjà
        const existingProduct = await prisma.product.findUnique({ where: { reference } })
        if (existingProduct) {
            return handleCors(NextResponse.json({ error: 'Produit déjà existant' }, { status: 400 }))
        }


        // Création du produit
        const newProduct = await prisma.product.create({
            data: {
                name,
                description: description || null,  // La description peut être null si non fournie
                price,
                stock,
                reference,
                images: JSON.stringify(images), // Convertir le tableau d'images en JSON
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
                images: newProduct.images
            },
        },
            { status: 201 }
        )
        )

    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json({ error: 'Erreur lors de la création du produit' }, { status: 500 }))
    }
}

export async function OPTIONS(req: Request) {
    return handleCors(new NextResponse(null, { status: 204 }));
}