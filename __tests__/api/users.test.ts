import { GET, OPTIONS } from '@/app/api/users/route';
import { checkLevelAccess } from '@/lib/tools';
import { prisma } from '@/lib/prisma';
import { handleCors } from '@/middleware';
import { NextResponse } from 'next/server';

jest.mock('@/lib/tools', () => ({
    checkLevelAccess: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findMany: jest.fn(),
        },
    },
}));

jest.mock('@/middleware', () => ({
    handleCors: jest.fn((res) => res),
}));

jest.mock('next/server', () => {
    class MockNextResponse {
        status: number;
        body: any;
        constructor(body: any, init?: { status?: number }) {
            this.body = body;
            this.status = init?.status || 200;
        }
        static json = jest.fn((body: any, init?: { status?: number }) => {
            return new MockNextResponse(body, init);
        });
    }

    return {
        NextResponse: MockNextResponse,
    };
});

describe('API GET /users', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('retourne la liste des utilisateurs si accès autorisé', async () => {
        (checkLevelAccess as jest.Mock).mockResolvedValue({ access: true });
        (prisma.user.findMany as jest.Mock).mockResolvedValue([
            { id: 1, email: 'user1@test.com', name: 'User One', role: 'user' },
            { id: 2, email: 'user2@test.com', name: 'User Two', role: 'admin' },
        ]);

        const mockReq = {
            headers: {
                get: jest.fn().mockImplementation((header) => (header === 'Authorization' ? 'Bearer validtoken' : null)),
            },
        } as unknown as Request;

        const response = await GET(mockReq);

        expect(checkLevelAccess).toHaveBeenCalledWith('validtoken', 2);
        expect(prisma.user.findMany).toHaveBeenCalledWith({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });
        expect(handleCors).toHaveBeenCalled();
        expect(response.body).toEqual([
            { id: 1, email: 'user1@test.com', name: 'User One', role: 'user' },
            { id: 2, email: 'user2@test.com', name: 'User Two', role: 'admin' },
        ]);
        expect(response.status).toBe(200);
    });

    it('retourne une erreur 403 si accès refusé', async () => {
        (checkLevelAccess as jest.Mock).mockResolvedValue({
            access: false,
            error: 'Accès refusé',
            status: 403,
        });

        const mockReq = {
            headers: {
                get: jest.fn().mockImplementation((header) => (header === 'Authorization' ? 'Bearer invalidtoken' : null)),
            },
        } as unknown as Request;

        const response = await GET(mockReq);

        expect(checkLevelAccess).toHaveBeenCalledWith('invalidtoken', 2);
        expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Accès refusé' }, { status: 403 });
        expect(response.body).toEqual({ error: 'Accès refusé' });
        expect(response.status).toBe(403);
    });

    it('retourne une erreur 500 en cas d’exception', async () => {
        (checkLevelAccess as jest.Mock).mockResolvedValue({ access: true });
        (prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const mockReq = {
            headers: {
                get: jest.fn().mockReturnValue('Bearer token'),
            },
        } as unknown as Request;

        const response = await GET(mockReq);

        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(handleCors).toHaveBeenCalled();
        expect(response.body).toEqual({ error: 'Erreur lors de la récupération des utilisateurs.' });
        expect(response.status).toBe(500);

        consoleErrorSpy.mockRestore();
    });
});

describe('API OPTIONS /users', () => {
    it('répond avec status 204', async () => {
        const mockReq = {} as Request;

        const response = await OPTIONS(mockReq);

        expect(handleCors).toHaveBeenCalled();
        expect(response.status).toBe(204);
    });
});
