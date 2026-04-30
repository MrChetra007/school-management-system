<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()

const stats = ref({ students: 0, teachers: 0, classes: 0, books: 0, budget_income: 0, budget_expense: 0 })
const recentStudents = ref([])
const overdueBooks = ref([])
const loading = ref(true)

onMounted(async () => {
  await Promise.all([loadStats(), loadRecentStudents(), loadOverdueBooks()])
  loading.value = false
})

async function loadStats() {
  const [s, t, c, b, inc, exp] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase.from('teachers').select('id', { count: 'exact', head: true }),
    supabase.from('classes').select('id', { count: 'exact', head: true }),
    supabase.from('books').select('id', { count: 'exact', head: true }),
    supabase.from('budget_transactions').select('amount').eq('type', 'income'),
    supabase.from('budget_transactions').select('amount').eq('type', 'expense'),
  ])
  stats.value.students = s.count ?? 0
  stats.value.teachers = t.count ?? 0
  stats.value.classes  = c.count ?? 0
  stats.value.books    = b.count ?? 0
  stats.value.budget_income  = (inc.data || []).reduce((a, r) => a + Number(r.amount), 0)
  stats.value.budget_expense = (exp.data || []).reduce((a, r) => a + Number(r.amount), 0)
}

async function loadRecentStudents() {
  const { data } = await supabase.from('students').select('id, full_name, gender, created_at').order('created_at', { ascending: false }).limit(5)
  recentStudents.value = data || []
}

async function loadOverdueBooks() {
  const { data } = await supabase
    .from('book_borrows')
    .select('id, due_date, students(full_name), books(title)')
    .eq('status', 'overdue')
    .limit(5)
  overdueBooks.value = data || []
}

function fmt(n) {
  return Number(n).toLocaleString()
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB')
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Welcome back — here's what's happening today</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid-cols-4" style="margin-bottom:20px;">
      <div class="stat-card">
        <div class="stat-icon" style="background:#dbeafe;">👨‍🎓</div>
        <div class="stat-info">
          <div class="stat-label">Total Students</div>
          <div class="stat-value">{{ loading ? '—' : fmt(stats.students) }}</div>
          <div class="stat-sub">Enrolled this year</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#d1fae5;">👩‍🏫</div>
        <div class="stat-info">
          <div class="stat-label">Teachers</div>
          <div class="stat-value">{{ loading ? '—' : fmt(stats.teachers) }}</div>
          <div class="stat-sub">Active staff</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#ede9fe;">🏫</div>
        <div class="stat-info">
          <div class="stat-label">Classes</div>
          <div class="stat-value">{{ loading ? '—' : fmt(stats.classes) }}</div>
          <div class="stat-sub">Active classes</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fef3c7;">📚</div>
        <div class="stat-info">
          <div class="stat-label">Library Books</div>
          <div class="stat-value">{{ loading ? '—' : fmt(stats.books) }}</div>
          <div class="stat-sub">In collection</div>
        </div>
      </div>
    </div>

    <!-- Budget row -->
    <div class="grid-cols-2" style="margin-bottom:20px;">
      <div class="stat-card">
        <div class="stat-icon" style="background:#d1fae5;">💰</div>
        <div class="stat-info">
          <div class="stat-label">Total Income</div>
          <div class="stat-value" style="color:#059669;">${{ loading ? '—' : fmt(stats.budget_income) }}</div>
          <div class="stat-sub">Budget transactions</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fee2e2;">💸</div>
        <div class="stat-info">
          <div class="stat-label">Total Expenses</div>
          <div class="stat-value" style="color:#dc2626;">${{ loading ? '—' : fmt(stats.budget_expense) }}</div>
          <div class="stat-sub">Budget transactions</div>
        </div>
      </div>
    </div>

    <!-- Recent students + Overdue books -->
    <div class="grid-cols-2">
      <!-- Recent students -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Recent Students</span>
          <button class="btn btn-secondary btn-sm" @click="router.push('/admin/students')">View all</button>
        </div>
        <div v-if="loading" class="card-body">
          <div v-for="i in 4" :key="i" class="skeleton" style="height:36px;margin-bottom:10px;border-radius:8px;"></div>
        </div>
        <div v-else-if="recentStudents.length === 0" class="empty-state">
          <div class="empty-state-icon">🎓</div>
          <p class="empty-state-title">No students yet</p>
        </div>
        <div v-else class="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Gender</th><th>Added</th></tr></thead>
            <tbody>
              <tr v-for="s in recentStudents" :key="s.id" style="cursor:pointer;" @click="router.push('/admin/students/'+s.id)">
                <td>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <div class="avatar" style="width:28px;height:28px;font-size:11px;">{{ s.full_name.charAt(0) }}</div>
                    {{ s.full_name }}
                  </div>
                </td>
                <td><span class="badge" :class="s.gender==='Male'?'badge-blue':'badge-red'">{{ s.gender || '—' }}</span></td>
                <td>{{ fmtDate(s.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Overdue books -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Overdue Books</span>
          <button class="btn btn-secondary btn-sm" @click="router.push('/admin/library')">View all</button>
        </div>
        <div v-if="loading" class="card-body">
          <div v-for="i in 4" :key="i" class="skeleton" style="height:36px;margin-bottom:10px;border-radius:8px;"></div>
        </div>
        <div v-else-if="overdueBooks.length === 0" class="empty-state">
          <div class="empty-state-icon">✅</div>
          <p class="empty-state-title">No overdue books</p>
        </div>
        <div v-else class="table-wrapper">
          <table>
            <thead><tr><th>Book</th><th>Student</th><th>Due</th></tr></thead>
            <tbody>
              <tr v-for="b in overdueBooks" :key="b.id">
                <td>{{ b.books?.title }}</td>
                <td>{{ b.students?.full_name }}</td>
                <td><span class="badge badge-red">{{ fmtDate(b.due_date) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="card" style="margin-top:20px;">
      <div class="card-header"><span class="card-title">Quick Actions</span></div>
      <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap;">
        <button class="btn btn-primary" @click="router.push('/admin/students')">➕ Add Student</button>
        <button class="btn btn-secondary" @click="router.push('/admin/teachers')">➕ Add Teacher</button>
        <button class="btn btn-secondary" @click="router.push('/admin/attendance/students')">📋 Take Attendance</button>
        <button class="btn btn-secondary" @click="router.push('/admin/budget')">💰 Add Transaction</button>
        <button class="btn btn-secondary" @click="router.push('/admin/reports')">🖨 Print Report</button>
      </div>
    </div>
  </div>
</template>
