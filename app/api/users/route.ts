import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { userCreateSchema } from '@/src/schemas/user.schema'


/**
 * Créer un utilisateur.
 * @param {Request} req
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const parse = userCreateSchema.safeParse(body)

        if (!parse.success) {
            return NextResponse.json({ error: parse.error.flatten().fieldErrors }, { status: 400 })
        }

        const { name, email } = parse.data

        const existing = await prisma.user.findUnique({ where: { email } })

        if (existing) {
            return NextResponse.json({ error: 'Cet utilisateur existe déjà.' }, { status: 409 })
        }

        const user = await prisma.user.create({ data: { name, email } })

        return NextResponse.json(user, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
    }
}

/**
 * Lister les utilisateur.
 */
export async function GET() {
    try {
        const users = await prisma.user.findMany()
        return NextResponse.json(users)
    } catch (err) {
        console.error(err)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des utilisateurs.' },
            { status: 500 }
        )
    }
}