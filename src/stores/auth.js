import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const session = ref(null)
  const profile = ref(null) // row from users table
  const teacherProfile = ref(null) // row from teachers table if applicable

  const isLoggedIn = computed(() => !!session.value)
  const role = computed(() => profile.value?.role ?? null)
  const userId = computed(() => session.value?.user?.id ?? null)
  
  const isAdmin = computed(() => role.value === 'admin')
  const isTeacher = computed(() => role.value === 'teacher')
  const isLibrarian = computed(() => role.value === 'librarian')
  const isParent = computed(() => role.value === 'parent')

  async function fetchProfile(id) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    profile.value = data
    
    if (data?.role === 'teacher') {
      const { data: tData } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', id)
        .maybeSingle()
      teacherProfile.value = tData
    }
  }

  async function init() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    if (session.value) await fetchProfile(session.value.user.id)

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession
      if (newSession) {
        await fetchProfile(newSession.user.id)
      } else {
        profile.value = null
        teacherProfile.value = null
      }
    })
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    session.value = data.session
    await fetchProfile(data.user.id)
    return profile.value?.role
  }

  async function logout() {
    await supabase.auth.signOut()
    session.value = null
    profile.value = null
    teacherProfile.value = null
  }

  return { 
    session, 
    profile, 
    teacherProfile,
    isLoggedIn, 
    role, 
    userId, 
    isAdmin,
    isTeacher,
    isLibrarian,
    isParent,
    init, 
    login, 
    logout 
  }
})
