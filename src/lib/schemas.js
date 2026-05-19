import { z } from 'zod'

// Esquema para Registro de Usuário
export const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  full_name: z.string().min(3, 'Nome completo é obrigatório'),
  phone: z.string().min(10, 'Telefone inválido (ex: 11999999999)')
})

// Esquema para Login
export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
})

// Esquema para Endereço
export const addressSchema = z.object({
  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  zip_code: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido (ex: 00000-000)')
})
