import { supabase } from './supabaseClient'

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .single()

  if (error) throw error
  return { name: data.name }
}

async function toUser(session) {
  if (!session) return null
  const profile = await fetchProfile(session.user.id)
  return { id: session.user.id, email: session.user.email, ...profile }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return toUser(data.session)
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return toUser(data.session)
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return data.subscription
}
