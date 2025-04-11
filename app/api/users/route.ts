import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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