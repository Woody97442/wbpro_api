import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { SignJWT } from 'jose'
import { handleCors } from '@/middleware'

async function signJwtToken(payload: object, secret: string) {
    const iat = Math.floor(Date.now() / 1000)
    const exp = iat + 60 * 60 * 24 * 7 // 7 jours

    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .sign(new TextEncoder().encode(secret))
}

export async function POST(req: Request) {
    const { email, password } = await req.json()

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
        return handleCors(NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 }))
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
        return handleCors(NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 }))
    }

    const token = await signJwtToken(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET!
    )

    return handleCors(NextResponse.json(
        { token },
        {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:5173',
            },
        }
    ))
}

// Handler OPTIONS pour le preflight CORS
export async function OPTIONS(req: Request) {
    return handleCors(new NextResponse(null, { status: 204 }));
}
