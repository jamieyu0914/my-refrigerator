import { supabase } from '../services/supabaseClient'

export async function fetchSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.session
}

export async function signOutSession() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function subscribeToAuthChanges(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return data.subscription
}

export async function fetchProfileById(id) {
  const { data, error } = await supabase.from('profiles').select('name').eq('id', id).single()
  if (error) throw error
  return data
}
