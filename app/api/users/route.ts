import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email } = body

        if (!name || !email) {
            return NextResponse.json(
                { error: 'Le nom et l’email sont requis.' },
                { status: 400 }
            )
        }

        const existing = await prisma.user.findUnique({ where: { email } })

        if (existing) {
            return NextResponse.json(
                { error: 'Cet utilisateur existe déjà.' },
                { status: 409 }
            )
        }

        const user = await prisma.user.create({
            data: { name, email },
        })

        return NextResponse.json(user, { status: 201 })
    } catch (err) {
        console.error(err)
        return NextResponse.json(
            { error: 'Erreur lors de la création de l’utilisateur.' },
            { status: 500 }
        )
    }
}
