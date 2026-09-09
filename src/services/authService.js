import {
  fetchProfileById,
  fetchSession,
  signInWithPassword,
  signOutSession,
  subscribeToAuthChanges,
} from '../repositories/authRepository'

async function toUser(session) {
  if (!session) return null
  const profile = await fetchProfileById(session.user.id)
  return { id: session.user.id, email: session.user.email, name: profile.name }
}

export async function getSession() {
  const session = await fetchSession()
  return toUser(session)
}

export async function signIn(email, password) {
  const session = await signInWithPassword(email, password)
  return toUser(session)
}

export async function signOut() {
  await signOutSession()
}

export function onAuthStateChange(callback) {
  return subscribeToAuthChanges(callback)
}
