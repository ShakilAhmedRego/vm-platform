'use client'

import { supabase } from './supabase'

export async function getSession() {
  return supabase.auth.getSession()
}

export async function getUser() {
  return supabase.auth.getUser()
}

export async function getUserRole(userId: string): Promise<'admin' | 'user' | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error) return null
  const role = (data as any)?.role
  if (role === 'admin' || role === 'user') return role
  return null
}
