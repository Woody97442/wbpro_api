import { POST } from '@/app/api/products/route';
import { NextResponse } from 'next/server';
import { checkLevelAccess } from '@/lib/tools';

jest.mock('jose');

jest.mock('@/lib/tools', () => ({
    checkLevelAccess: jest.fn(),
}));

jest.mock('next/server', () => {
    const originalModule = jest.requireActual('next/server');
    return {
        ...originalModule,
        NextResponse: {
            ...originalModule.NextResponse,
            json: jest.fn((body, init) => ({
                headers: {
                    set: jest.fn(),
                },
                body,
                status: init?.status || 200,
            })),
        },
    };
});

// 👇 MOCK DE PRISMA
jest.mock('@/lib/prisma', () => ({
    prisma: {
        product: {
            findUnique: jest.fn().mockResolvedValue(null), // produit inexistant
            create: jest.fn().mockResolvedValue({
                id: 1,
                name: 'Produit test',
                description: 'Desc test',
                price: 100,
                reference: 'REF456',
                stock: 10,
                images: ['img1.jpg'],
            }),
        },
    },
}));

describe('API POST /products', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('retourne 403 si accès refusé', async () => {
        const mockJsonBody = {
            name: 'Test produit',
            description: 'Test desc',
            price: 99.99,
            reference: 'REF123',
        };

        (checkLevelAccess as jest.Mock).mockResolvedValue({
            access: false,
            error: 'Accès refusé',
            status: 403,
        });

        const mockReq = {
            method: 'POST',
            json: jest.fn().mockResolvedValue(mockJsonBody),
            headers: {
                get: jest.fn().mockImplementation((key) =>
                    key.toLowerCase() === 'authorization'
                        ? 'Bearer fakeToken'
                        : null
                ),
            },
        } as unknown as Request;

        const response = await POST(mockReq);

        expect(checkLevelAccess).toHaveBeenCalledWith(expect.any(String), 2);
        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'Accès refusé' },
            { status: 403 }
        );
        expect(response.status).toBe(403);
    });

    it('retourne 201 si produit créé', async () => {
        const mockJsonBody = {
            name: 'Produit test',
            description: 'Desc test',
            price: 100,
            reference: 'REF456',
            stock: 10,
            images: ['img1.jpg'],
        };

        (checkLevelAccess as jest.Mock).mockResolvedValue({
            access: true,
            error: '',
            status: 200,
        });

        const mockReq = {
            method: 'POST',
            json: jest.fn().mockResolvedValue(mockJsonBody),
            headers: {
                get: jest.fn().mockImplementation((key) =>
                    key.toLowerCase() === 'authorization'
                        ? 'Bearer fakeToken'
                        : null
                ),
            },
        } as unknown as Request;

        const response = await POST(mockReq);

        expect(NextResponse.json).toHaveBeenCalledWith(
            {
                message: 'Produit créé avec succès',
                product: {
                    id: 1,
                    name: 'Produit test',
                    description: 'Desc test',
                    price: 100,
                    reference: 'REF456',
                    stock: 10,
                    images: ['img1.jpg'],
                },
            },
            { status: 201 }
        );

        expect(response.status).toBe(201);
    });
});
