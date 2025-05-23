import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkLevelAccess } from '@/lib/tools';
import { hash } from 'bcryptjs'
import { handleCors } from '@/middleware';

/**
 * Lister les utilisateur.
 */
export async function GET(req: Request) {
    try {

        // Récupérer le token dans l'en-tête de la requête
        const token = req.headers.get('Authorization')?.split(' ')[1];

        const check = await checkLevelAccess(token, 2)
        if (check.access === false) {
            return handleCors(NextResponse.json({ error: check.error }, { status: check.status }))
        }

        const users = await prisma.user.findMany(
            {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true
                }
            }
        )
        return handleCors(NextResponse.json(users))

    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json(
            { error: 'Erreur lors de la récupération des utilisateurs.' },
            { status: 500 }
        ))
    }
}

/**
 * Créer un utilisateur manuellement.
 */
export async function POST(req: Request) {
    const { email, password, name, role } = await req.json()

    // Récupérer le token dans l'en-tête de la requête
    const token = req.headers.get('Authorization')?.split(' ')[1];

    const check = await checkLevelAccess(token, 2)
    if (check.access === false) {
        return handleCors(NextResponse.json({ error: check.error }, { status: check.status }))
    }

    // Vérifie que l'utilisateur n'existe pas déjà
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
        return handleCors(NextResponse.json({ error: 'Email déjà utilisé' }, { status: 400 }))
    }

    // Hash du mot de passe
    const hashedPassword = await hash(password, 10)

    // Création de l'utilisateur
    const newUser = await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
            role
        },
    })

    return handleCors(NextResponse.json({
        message: 'Utilisateur créé avec succès',
        user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
        },
    }))
}

export async function OPTIONS(req: NextRequest) {
    return handleCors(new NextResponse(null, { status: 204 }));
}