// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(req: NextRequest) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
        return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET)
        const { payload } = await jwtVerify(token, secret)

        // tu peux aussi ajouter payload dans un header personnalisé si tu veux
        const requestHeaders = new Headers(req.headers)
        requestHeaders.set('x-user-id', String(payload.id))

        return NextResponse.next({ request: { headers: requestHeaders } })
    } catch (err) {
        console.error('Erreur JWT :', err)
        return NextResponse.json({ error: 'Token invalide ou expiré' }, { status: 401 })
    }
}

export const config = {
    matcher: ['/api/users/:path*'],
}
