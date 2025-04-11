// app/api/users/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await prisma.user.findUnique({ where: { id: parseInt(params.id) } })
    if (!user) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
    return NextResponse.json(user)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const body = await req.json()
    const { name, email } = body

    try {
        const updated = await prisma.user.update({
            where: { id: parseInt(params.id) },
            data: { name, email },
        })
        return NextResponse.json(updated)
    } catch {
        return NextResponse.json({ error: 'Erreur de mise à jour' }, { status: 400 })
    }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        await prisma.user.delete({ where: { id: parseInt(params.id) } })
        return new NextResponse(null, { status: 204 })
    } catch {
        return NextResponse.json({ error: 'Erreur de suppression' }, { status: 400 })
    }
}
