<script setup>
import { ref, computed, watch } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAcademicYearStore } from '@/stores/academicYear'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const yearStore = useAcademicYearStore()
const sidebarOpen = ref(false)

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  sidebarOpen.value = false
})

const userInitials = computed(() => {
  const email = auth.profile?.email || ''
  return email.slice(0, 2).toUpperCase()
})

async function logout() {
  await auth.logout()
  router.push('/login')
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', icon: 'grid', label: 'Dashboard' },
    ],
  },
  {
    label: 'School Setup',
    items: [
      { to: '/admin/school',         icon: 'info',     label: 'School Info' },
      { to: '/admin/academic-years', icon: 'calendar', label: 'Academic Years' },
      { to: '/admin/subjects',       icon: 'book-open',label: 'Subjects' },
      { to: '/admin/holidays',       icon: 'sun',      label: 'Holidays' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/admin/teachers',  icon: 'users',    label: 'Teachers' },
      { to: '/admin/classes',   icon: 'layers',   label: 'Classes' },
      { to: '/admin/students',  icon: 'user',     label: 'Students' },
    ],
  },
  {
    label: 'Attendance',
    items: [
      { to: '/admin/attendance/students', icon: 'check-square', label: 'Student Attendance' },
      { to: '/admin/attendance/teachers', icon: 'user-check',   label: 'Teacher Attendance' },
    ],
  },
  {
    label: 'Academics',
    items: [
      { to: '/admin/scores',    icon: 'bar-chart-2', label: 'Scores' },
      { to: '/admin/health',    icon: 'heart',       label: 'Health Records' },
      { to: '/admin/sick-days', icon: 'thermometer', label: 'Sick Days' },
    ],
  },
  {
    label: 'Finance & Resources',
    items: [
      { to: '/admin/budget',    icon: 'dollar-sign', label: 'Budget' },
      { to: '/admin/inventory', icon: 'package',     label: 'Inventory' },
      { to: '/admin/library',   icon: 'book',        label: 'Library' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { to: '/admin/reports', icon: 'printer', label: 'Reports & Print' },
    ],
  },
]

// Icon SVG paths
const icons = {
  grid:         'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  info:         'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  calendar:     'M3 9h18M16 2v4M8 2v4M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  'book-open':  'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  sun:          'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  users:        'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  layers:       'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  user:         'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  'check-square':'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  'user-check': 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17 11l2 2 4-4',
  'bar-chart-2':'M18 20V10M12 20V4M6 20v-6',
  heart:        'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z',
  thermometer:  'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z',
  'dollar-sign':'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  package:      'M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  book:         'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z',
  printer:      'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  'log-out':    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
}

function getIconPath(name) {
  return icons[name] || icons['grid']
}

function isActive(path) {
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="app-layout">
    <!-- Mobile Overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'mobile-open': sidebarOpen }">
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="20" height="20">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="sidebar-brand-text">
          <div class="sidebar-brand-name">SchoolAdmin</div>
          <div class="sidebar-brand-sub">Administrator Portal</div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <template v-for="group in navGroups" :key="group.label">
          <div class="nav-section-label">{{ group.label }}</div>
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ active: isActive(item.to) }"
          >
            <svg viewBox="0 0 24 24" fill="none" :stroke="'currentColor'" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path :d="getIconPath(item.icon)"/>
            </svg>
            {{ item.label }}
          </RouterLink>
        </template>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="avatar">{{ userInitials }}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">{{ auth.profile?.email?.split('@')[0] }}</div>
            <div class="sidebar-user-role">Administrator</div>
          </div>
        </div>
        <button class="nav-item logout-btn" @click="logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path :d="getIconPath('log-out')"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="main-content">
      <!-- Top bar -->
      <header class="top-bar">
        <button class="mobile-toggle" @click="sidebarOpen = true" style="margin-right: 8px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div class="top-bar-left">
          <h2 class="top-bar-title">{{ route.meta.title || 'Dashboard' }}</h2>
          <div v-if="yearStore.selectedYearName" class="year-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path d="M3 9h18M16 2v4M8 2v4M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            {{ yearStore.selectedYearName }}
          </div>
        </div>
        <div class="top-bar-right">
          <button class="btn btn-secondary btn-sm" @click="router.push('/admin/academic-years')">
            ប្តូរឆ្នាំសិក្សា
          </button>
          <span class="badge badge-blue">Admin</span>
          <div class="avatar">{{ userInitials }}</div>
        </div>
      </header>

      <!-- Page -->
      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.top-bar-left { flex: 1; display: flex; align-items: center; gap: 12px; }
.top-bar-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }

.year-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--primary-50);
  color: var(--primary-700);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.top-bar-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 4px;
}
.sidebar-user-info { overflow: hidden; }
.sidebar-user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-user-role { font-size: 11px; color: var(--text-secondary); }

.logout-btn {
  width: 100%;
  color: #ef4444 !important;
}
.logout-btn:hover { background: rgba(239,68,68,0.1) !important; }
</style>
