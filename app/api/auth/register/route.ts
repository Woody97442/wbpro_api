import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { handleCors } from '@/middleware'

export async function POST(req: Request) {
    const { email, password, name } = await req.json()

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
        },
    })

    return handleCors(NextResponse.json(
        {
            message: "Utilisateur créé avec succès",
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
            },
        }
    ));
}

export async function OPTIONS(req: NextRequest) {
    return handleCors(new NextResponse(null, { status: 204 }));
}