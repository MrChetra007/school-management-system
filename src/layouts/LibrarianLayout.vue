<script setup>
import { computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const userInitials = computed(() => (auth.profile?.email || '').slice(0, 2).toUpperCase())

async function logout() { await auth.logout(); router.push('/login') }

const navItems = [
  { to: '/librarian/dashboard', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z', label: 'Dashboard' },
  { to: '/librarian/books',     icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z', label: 'Books' },
  { to: '/librarian/borrows',   icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', label: 'Issue & Return' },
  { to: '/librarian/overdue',   icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z', label: 'Overdue' },
]
function isActive(path) { return route.path.startsWith(path) }
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="20" height="20">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/>
          </svg>
        </div>
        <div class="sidebar-brand-text">
          <div class="sidebar-brand-name">Library</div>
          <div class="sidebar-brand-sub">Librarian Portal</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-item" :class="{ active: isActive(item.to) }">
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
            <div class="sidebar-user-role">Librarian</div>
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
        <div style="flex:1"><h2 style="font-size:16px;font-weight:600;">Library Management</h2></div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="badge badge-purple">Librarian</span>
          <div class="avatar">{{ userInitials }}</div>
        </div>
      </header>
      <main class="page-content"><RouterView /></main>
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
