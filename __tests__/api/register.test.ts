import { POST } from '@/app/api/auth/register/route'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

// Mock jose
jest.mock('jose', () => ({
    jwtVerify: jest.fn(() => Promise.resolve({ payload: {} })),
}))

// Mock prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
}))

describe('POST /api/auth/register', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    it('crée un nouvel utilisateur avec succès', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (hash as jest.Mock).mockResolvedValue('hashedpassword');
        (prisma.user.create as jest.Mock).mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
        });

        const req = {
            json: async () => ({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            }),
        } as unknown as Request;

        const res = await POST(req);
        const json = await res.json();

        expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
        expect(hash).toHaveBeenCalledWith('password123', 10);
        expect(prisma.user.create).toHaveBeenCalledWith({
            data: {
                email: 'test@example.com',
                name: 'Test User',
                password: 'hashedpassword',
            },
        });

        expect(json).toHaveProperty('message', 'Utilisateur créé avec succès');
        expect(json.user).toMatchObject({
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
        });
    });

    it('retourne une erreur si email déjà utilisé', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 1,
            email: 'test@example.com',
        });

        const req = {
            json: async () => ({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            }),
        } as unknown as Request;

        const res = await POST(req);
        const json = await res.json();

        expect(json).toHaveProperty('error', 'Email déjà utilisé');
    });
});
