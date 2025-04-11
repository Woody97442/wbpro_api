import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { userUpdateSchema } from '@/src/schemas/user.schema';

/**
 * Récupérer un utilisateur par ID
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id, 10);
        if (isNaN(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (err) {
        console.error(err)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de l’utilisateur.' },
            { status: 500 }
        )
    }
}

/**
 * Modifier un utilisateur par ID
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json()
        const parse = userUpdateSchema.safeParse(body)

        if (!parse.success) {
            return NextResponse.json({ error: parse.error.flatten().fieldErrors }, { status: 400 })
        }

        const id = parseInt(params.id, 10);
        if (isNaN(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: parse.data,
        })

        return NextResponse.json(updatedUser)
    } catch (err) {
        return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 })
    }
}

/**
 * Supprimer un utilisateur par ID
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {

        const id = parseInt(params.id, 10);
        if (isNaN(id)) {
            return NextResponse.json({ error: "ID invalide" }, { status: 400 });
        }

        const user = await prisma.user.delete({
            where: { id },
        })

        return NextResponse.json({ message: 'Utilisateur supprimé.', user })
    } catch (err) {
        console.error(err)
        return NextResponse.json(
            { error: 'Erreur lors de la suppression de l’utilisateur.' },
            { status: 500 }
        )
    }
}
