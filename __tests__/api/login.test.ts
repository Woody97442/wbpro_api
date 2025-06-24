import { POST, OPTIONS } from '@/app/api/auth/login/route'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'

// Mock prisma, bcryptjs et jose
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
    },
}))

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
}))

jest.mock('jose', () => {
    return {
        SignJWT: jest.fn().mockImplementation(() => ({
            setProtectedHeader: jest.fn().mockReturnThis(),
            setIssuedAt: jest.fn().mockReturnThis(),
            setExpirationTime: jest.fn().mockReturnThis(),
            sign: jest.fn().mockResolvedValue('mocked_token'),
        })),
    }
})

// Mock handleCors (supposé dans un fichier séparé)
jest.mock('@/middleware', () => ({
    handleCors: (res: any) => res,
}))

describe('POST /api/auth/login', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('doit retourner 404 si utilisateur non trouvé', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

        const req = new Request('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
        })

        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(404)
        expect(data.error).toBe('Utilisateur non trouvé')
    })

    it('doit retourner 401 si mot de passe incorrect', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 1,
            email: 'test@test.com',
            password: 'hashedpassword',
            role: 'user',
            name: 'Test User',
        })

            ; (compare as jest.Mock).mockResolvedValue(false)

        const req = new Request('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@test.com', password: 'wrongpassword' }),
        })

        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(401)
        expect(data.error).toBe('Mot de passe incorrect')
    })

    it('doit retourner un token valide si connexion réussie', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 1,
            email: 'test@test.com',
            password: 'hashedpassword',
            role: 'user',
            name: 'Test User',
        })

            ; (compare as jest.Mock).mockResolvedValue(true)

        const req = new Request('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@test.com', password: 'correctpassword' }),
        })

        const res = await POST(req)
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.token).toBe('mocked_token')
    })
})

describe('OPTIONS /api/auth/login', () => {
    it('doit retourner status 204 pour OPTIONS', async () => {
        const req = new Request('http://localhost/api/auth/login', {
            method: 'OPTIONS',
        })

        const res = await OPTIONS(req)
        expect(res.status).toBe(204)
    })
})
