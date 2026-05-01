<script setup>
import { ref, computed, watch } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const sidebarOpen = ref(false)

watch(() => route.path, () => { sidebarOpen.value = false })

const userInitials = computed(() => {
  const email = auth.profile?.email || ''
  return email.slice(0, 2).toUpperCase()
})

async function logout() {
  await auth.logout()
  router.push('/login')
}

const navItems = [
  { to: '/teacher/dashboard',   icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',    label: 'Dashboard' },
  { to: '/teacher/students',    icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', label: 'My Students' },
  { to: '/teacher/attendance',  icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11', label: 'Attendance' },
  { to: '/teacher/scores',      icon: 'M18 20V10M12 20V4M6 20v-6',                               label: 'Scores' },
  { to: '/teacher/sick-days',   icon: 'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z', label: 'Sick Days' },
  { to: '/teacher/growth',      icon: 'M22 12h-4l-3 9L9 3l-3 9H2',                               label: 'Growth' },
  { to: '/teacher/vaccinations',icon: 'M22 12h-4l-3 9L9 3l-3 9H2',                               label: 'Vaccinations' },
  { to: '/teacher/holidays',    icon: 'M3 9h18M16 2v4M8 2v4M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', label: 'Holidays' },
  { to: '/teacher/reports',     icon: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z', label: 'Reports' },
  { to: '/teacher/attendance/my', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', label: 'My Attendance' },
]

function isActive(path) {
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="app-layout">
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>
    <aside class="sidebar" :class="{ 'mobile-open': sidebarOpen }">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="20" height="20">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="sidebar-brand-text">
          <div class="sidebar-brand-name">SchoolMS</div>
          <div class="sidebar-brand-sub">Teacher Portal</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path :d="item.icon"/>
          </svg>
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="avatar">{{ userInitials }}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">{{ auth.profile?.email?.split('@')[0] }}</div>
            <div class="sidebar-user-role">Teacher</div>
          </div>
        </div>
        <button class="nav-item logout-btn" @click="logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>

    <div class="main-content">
      <header class="top-bar">
        <button class="mobile-toggle" @click="sidebarOpen = true" style="margin-right: 8px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div style="flex:1">
          <h2 style="font-size:16px;font-weight:600;color:var(--text-primary);">{{ route.meta.title || 'Teacher Portal' }}</h2>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="badge badge-green">Teacher</span>
          <div class="avatar">{{ userInitials }}</div>
        </div>
      </header>
      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.sidebar-user { display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;margin-bottom:4px; }
.sidebar-user-info { overflow:hidden; }
.sidebar-user-name { font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.sidebar-user-role { font-size:11px;color:var(--text-secondary); }
.logout-btn { width:100%;color:#ef4444 !important; }
.logout-btn:hover { background:rgba(239,68,68,0.1) !important; }
</style>
