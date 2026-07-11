import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as jose from 'jose'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? 'http://127.0.0.1:54321'
const SUPABASE_ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const JWT_SECRET       = process.env.SUPABASE_JWT_SECRET           ?? 'super-secret-jwt-token-with-at-least-32-characters-long'

export function createAnonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON)
}

export async function createUserClient(userId: string, role = 'authenticated'): Promise<SupabaseClient> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  const token = await new jose.SignJWT({ sub: userId, role, iss: 'supabase-demo' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret)

  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

export async function createServiceClient(): Promise<SupabaseClient> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return createClient(SUPABASE_URL, key)
}
