import { z } from 'zod'

export const userUpdateProfileSchema = z.object({
    newProfilName: z.string().min(3, 'Le nom est requis.'),
})

export const userUpdatePasswordSchema = z.object({
    currentPassword: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères.'),
    newPassword: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères.'),
})