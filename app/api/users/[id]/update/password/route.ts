import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkThisAccess } from '@/lib/tools';
import { handleCors } from '@/middleware';
import bcrypt from 'bcryptjs'
import { userUpdatePasswordSchema } from '@/lib/schemas/user.schema';

/**
 * Modifier le mot de passe d'un utilisateur
 */
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
    const params = await context.params
    const { id } = params

    try {
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");

        const accessCheck = await checkThisAccess(token, id);
        if (!accessCheck.access) {
            return handleCors(NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status }));
        }

        const body = await req.json()
        const parse = userUpdatePasswordSchema.safeParse(body)

        if (!parse.success) {
            return handleCors(NextResponse.json({ error: parse.error.flatten().fieldErrors }, { status: 400 }))
        }

        const { currentPassword, newPassword } = body

        if (!currentPassword || !newPassword) {
            return handleCors(NextResponse.json({ error: "Champs requis : currentPassword et newPassword" }, { status: 400 }));
        }

        const userId = parseInt(id, 10)
        if (isNaN(userId)) {
            return handleCors(NextResponse.json({ error: 'ID invalide' }, { status: 400 }))
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true }
        })

        if (!user || !user.password) {
            return handleCors(NextResponse.json({ error: 'Utilisateur non trouvé ou mot de passe manquant.' }, { status: 404 }))
        }

        const passwordMatch = await bcrypt.compare(currentPassword, user.password)
        if (!passwordMatch) {
            return handleCors(NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 401 }))
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        })

        return handleCors(NextResponse.json({ message: 'Mot de passe mis à jour avec succès.' }))

    } catch (err) {
        console.error(err)
        return handleCors(NextResponse.json({ error: 'Erreur lors de la mise à jour du mot de passe.' }, { status: 500 }))
    }
}


export async function OPTIONS(req: NextRequest) {
    return handleCors(new NextResponse(null, { status: 204 }));
}