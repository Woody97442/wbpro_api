import { z } from 'zod'

export const userCreateSchema = z.object({
    name: z.string().min(1, 'Le nom est requis.'),
    email: z.string().email('Email invalide.'),
})

export const userUpdateSchema = userCreateSchema.partial() // tout est optionnel pour PUT
