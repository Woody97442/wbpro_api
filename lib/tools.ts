import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma'

interface AccessResult {
    error: string;
    status: number;
    access: boolean;
}

// Fonction pour vérifier un token
export async function verifyJwtToken(token: string) {
    try {
        const secret = getJwtSecret();

        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(secret)
        );

        return payload; // Tu récupères ici le contenu du token (ex: { id, email })
    } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        return null; // Token invalide
    }
}

// Fonction utilitaire pour récupérer le secret
function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET est manquant dans les variables d\'environnement');
    }
    return secret;
}

// Fonction pour vérifier les droits d'accès
export async function checkLevelAccess(token: string | undefined, levelAccess: number) {

    let result = {
        error: 'Accès autorisé',
        status: 200,
        access: true
    };

    if (!token) {
        result = {
            error: 'Token manquant',
            status: 401,
            access: false
        }
        return result;
    }

    // Vérification du token
    const payload = await verifyJwtToken(token);
    if (!payload) {
        result = {
            error: 'Token invalide ou expiré',
            status: 401,
            access: false
        }
        return result;
    }

    // Vérification du rôle de l'utilisateur
    if (payload.role !== 'ADMIN' && levelAccess === 2) {
        result = {
            error: 'Accès réservé aux administrateurs',
            status: 403,
            access: false
        }
        return result;
    }

    return result;
}

/**
 * Vérifie l'accès d'un utilisateur pour une action donnée (lecture, modification)
 * @param token Le token JWT de l'utilisateur
 * @param requestedUserId L'ID de l'utilisateur ciblé
 * @returns Un objet contenant le résultat de la vérification
 */
export async function checkThisAccess(token: string | undefined, requestedUserId: string): Promise<AccessResult> {
    let result: AccessResult = {
        error: 'Accès autorisé',
        status: 200,
        access: true,
    };

    // Vérification de la présence du token
    if (!token) {
        return {
            error: 'Token manquant',
            status: 401,
            access: false
        };
    }

    // Vérification du token
    const payload = await verifyJwtToken(token);
    if (!payload) {
        return {
            error: 'Token invalide ou expiré',
            status: 401,
            access: false
        };
    }

    const userIdFromToken = payload.id;
    const userRole = payload.role;

    // Si l'utilisateur est admin, il peut effectuer toutes les actions
    if (userRole === 'ADMIN') {
        return result;  // L'admin peut toujours accéder
    }

    // Si l'utilisateur n'est pas admin, il ne peut modifier que ses propres informations
    if (userIdFromToken !== parseInt(requestedUserId, 10)) {
        return {
            error: 'Accès interdit.',
            status: 403,
            access: false
        };
    }

    return result;  // Accès autorisé si c'est son propre compte
}

/**
 * Calcule le total du panier et met à jour le champ 'total' du panier.
 * @param cartId L'ID du panier à mettre à jour.
 */
export async function updateCartTotal(cartId: number) {
    // Récupérer tous les articles du panier
    const cartItems = await prisma.cartItem.findMany({
        where: { cartId },
        select: {
            quantity: true,
            unitPrice: true,
        },
    })

    // Calculer le total du panier
    const total = cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    // Mettre à jour le total dans le panier
    await prisma.cart.update({
        where: { id: cartId },
        data: { total },
    })
}