import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAcademicYearStore } from '@/stores/academicYear'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ── Auth ──────────────────────────────────────────────
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: () => import('@/views/auth/UnauthorizedView.vue'),
      meta: { public: true },
    },

    // ── Admin Standalone (Layer 1) ─────────────────────────
    {
      path: '/admin/academic-years',
      name: 'admin-academic-years',
      component: () => import('@/views/admin/AcademicYearsView.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },

    // ── Admin App (Layer 2) ────────────────────────────────
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, role: 'admin' },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard',       name: 'admin-dashboard',       component: () => import('@/views/admin/DashboardView.vue') },
        { path: 'school',          name: 'admin-school',          component: () => import('@/views/admin/SchoolView.vue') },
        { path: 'subjects',        name: 'admin-subjects',        component: () => import('@/views/admin/SubjectsView.vue') },
        { path: 'classes',         name: 'admin-classes',         component: () => import('@/views/admin/ClassesView.vue') },
        { path: 'teachers',        name: 'admin-teachers',        component: () => import('@/views/admin/TeachersView.vue') },
        { path: 'students',        name: 'admin-students',        component: () => import('@/views/admin/StudentsView.vue') },
        { path: 'students/:id',    name: 'admin-student-detail',  component: () => import('@/views/admin/StudentDetailView.vue') },
        { path: 'attendance/students', name: 'admin-attendance-students', component: () => import('@/views/admin/AttendanceStudentsView.vue') },
        { path: 'attendance/teachers', name: 'admin-attendance-teachers', component: () => import('@/views/admin/AttendanceTeachersView.vue') },
        { path: 'scores',          name: 'admin-scores',          component: () => import('@/views/admin/ScoresView.vue') },
        { path: 'health',          name: 'admin-health',          component: () => import('@/views/admin/HealthView.vue') },
        { path: 'sick-days',       name: 'admin-sick-days',       component: () => import('@/views/admin/SickDaysView.vue') },
        { path: 'holidays',        name: 'admin-holidays',        component: () => import('@/views/admin/HolidaysView.vue') },
        { path: 'budget',          name: 'admin-budget',          component: () => import('@/views/admin/BudgetView.vue') },
        { path: 'inventory',       name: 'admin-inventory',       component: () => import('@/views/admin/InventoryView.vue') },
        { path: 'library',         name: 'admin-library',         component: () => import('@/views/admin/LibraryView.vue') },
        { path: 'users',           name: 'admin-users',           component: () => import('@/views/admin/UsersView.vue') },
        { path: 'reports',         name: 'admin-reports',         component: () => import('@/views/admin/ReportsView.vue') },
      ],
    },

    // ── Teacher ───────────────────────────────────────────
    {
      path: '/teacher',
      component: () => import('@/layouts/TeacherLayout.vue'),
      meta: { requiresAuth: true, role: 'teacher' },
      children: [
        { path: '', redirect: '/teacher/dashboard' },
        { path: 'dashboard',       name: 'teacher-dashboard',       component: () => import('@/views/teacher/DashboardView.vue') },
        { path: 'students',        name: 'teacher-students',        component: () => import('@/views/teacher/StudentsView.vue') },
        { path: 'students/:id',    name: 'teacher-student-detail',  component: () => import('@/views/teacher/StudentDetailView.vue') },
        { path: 'attendance',      name: 'teacher-attendance',      component: () => import('@/views/teacher/AttendanceView.vue') },
        { path: 'attendance/my',   name: 'teacher-my-attendance',   component: () => import('@/views/teacher/MyAttendanceView.vue') },
        { path: 'scores',          name: 'teacher-scores',          component: () => import('@/views/teacher/ScoresView.vue') },
        { path: 'scores/monthly',  name: 'teacher-scores-monthly',  component: () => import('@/views/teacher/ScoresMonthlyView.vue') },
        { path: 'scores/semester', name: 'teacher-scores-semester', component: () => import('@/views/teacher/ScoresSemesterView.vue') },
        { path: 'sick-days',       name: 'teacher-sick-days',       component: () => import('@/views/teacher/SickDaysView.vue') },
        { path: 'growth',          name: 'teacher-growth',          component: () => import('@/views/teacher/GrowthView.vue') },
        { path: 'vaccinations',    name: 'teacher-vaccinations',    component: () => import('@/views/teacher/VaccinationsView.vue') },
        { path: 'holidays',        name: 'teacher-holidays',        component: () => import('@/views/teacher/HolidaysView.vue') },
        { path: 'reports',         name: 'teacher-reports',         component: () => import('@/views/teacher/ReportsView.vue') },
      ],
    },

    // ── Librarian ─────────────────────────────────────────
    {
      path: '/librarian',
      component: () => import('@/layouts/LibrarianLayout.vue'),
      meta: { requiresAuth: true, role: 'librarian' },
      children: [
        { path: '', redirect: '/librarian/dashboard' },
        { path: 'dashboard', name: 'librarian-dashboard', component: () => import('@/views/librarian/DashboardView.vue') },
        { path: 'books',     name: 'librarian-books',     component: () => import('@/views/librarian/BooksView.vue') },
        { path: 'borrows',   name: 'librarian-borrows',   component: () => import('@/views/librarian/BorrowsView.vue') },
        { path: 'overdue',   name: 'librarian-overdue',   component: () => import('@/views/librarian/OverdueView.vue') },
      ],
    },

    // ── Parent (public / anon) ────────────────────────────
    {
      path: '/parent',
      component: () => import('@/layouts/ParentLayout.vue'),
      meta: { public: true },
      children: [
        { path: '', name: 'parent-search', component: () => import('@/views/parent/SearchView.vue') },
        { path: 'student/:id', name: 'parent-student-detail', component: () => import('@/views/parent/StudentResultView.vue') },
      ],
    },

    // ── 404 ───────────────────────────────────────────────
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

// Navigation guard
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Initialize auth state if session is not loaded
  if (!auth.isLoggedIn) {
    console.log('Router: No logged in user, trying init...')
    await auth.init()
  }

  console.log('Router: target:', to.path, 'isLoggedIn:', auth.isLoggedIn, 'role:', auth.role)

  if (to.meta.public) return true

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    console.warn('Router: Requires auth but not logged in, redirecting to login')
    return { name: 'login' }
  }

  if (to.meta.role && auth.role !== to.meta.role) {
    console.warn('Router: Role mismatch. Expected:', to.meta.role, 'Found:', auth.role)
    return { name: 'unauthorized' }
  }

  // Academic Year Guard for Admin
  if (auth.role === 'admin' && !to.meta.public && to.name !== 'admin-academic-years') {
    const yearStore = useAcademicYearStore()
    if (!yearStore.selectedYearId) {
      console.warn('Router: Admin accessing pages without selected year, redirecting to academic-years')
      return { name: 'admin-academic-years' }
    }
  }

  return true
})

export default router
