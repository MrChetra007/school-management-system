<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { BookOpenIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowUpTrayIcon, PlusIcon } from '@heroicons/vue/24/outline'

const stats = ref({
  totalBooks: 0,
  availableBooks: 0,
  borrowedBooks: 0,
  overdueBooks: 0
})
const loading = ref(true)
const recentBorrows = ref([])

onMounted(async () => {
  await loadStats()
})

async function loadStats() {
  loading.value = true
  
  // 1. Total & Available
  const { data: bookData } = await supabase.from('books').select('total_copies, available_copies')
  if (bookData) {
    stats.value.totalBooks = bookData.reduce((a, b) => a + b.total_copies, 0)
    stats.value.availableBooks = bookData.reduce((a, b) => a + b.available_copies, 0)
  }

  // 2. Borrowed status
  const { count: borrowedCount } = await supabase
    .from('book_borrows')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'borrowed')
  stats.value.borrowedBooks = borrowedCount || 0

  // 3. Overdue status
  const { count: overdueCount } = await supabase
    .from('book_borrows')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'overdue')
  stats.value.overdueBooks = overdueCount || 0

  // 4. Recent Borrows
  const { data: recent } = await supabase
    .from('book_borrows')
    .select('*, books(title), students(full_name)')
    .order('borrow_date', { ascending: false })
    .limit(5)
  recentBorrows.value = recent || []

  loading.value = false
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Library Dashboard</h1>
        <p class="page-subtitle">Managing school literature and borrowing records</p>
      </div>
    </div>

    <div v-if="loading" class="card card-body">
      <div class="skeleton" style="height:120px; margin-bottom:20px;"></div>
      <div class="skeleton" style="height:200px;"></div>
    </div>

    <div v-else>
      <div class="grid-cols-4" style="margin-bottom:24px;">
        <div class="stat-card">
          <div class="stat-icon" style="background:#e0f2fe;color:#0ea5e9;"><BookOpenIcon class="w-6 h-6" /></div>
          <div class="stat-info">
            <div class="stat-label">Total Books</div>
            <div class="stat-value">{{ stats.totalBooks }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4;color:#22c55e;"><CheckCircleIcon class="w-6 h-6" /></div>
          <div class="stat-info">
            <div class="stat-label">Available</div>
            <div class="stat-value">{{ stats.availableBooks }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fff7ed;color:#f97316;"><BookOpenIcon class="w-6 h-6" /></div>
          <div class="stat-info">
            <div class="stat-label">Borrowed</div>
            <div class="stat-value">{{ stats.borrowedBooks }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef2f2;color:#ef4444;"><ExclamationTriangleIcon class="w-6 h-6" /></div>
          <div class="stat-info">
            <div class="stat-label">Overdue</div>
            <div class="stat-value" style="color:#ef4444;">{{ stats.overdueBooks }}</div>
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Recent Borrowing Activity</span>
            <router-link to="/librarian/borrows" class="btn btn-ghost btn-sm">View All</router-link>
          </div>
          <div class="card-body">
            <div v-if="recentBorrows.length === 0" class="empty-state" style="padding:40px;">
              <p style="color:var(--text-muted);">No recent activity recorded.</p>
            </div>
            <div v-else class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Student</th><th>Book</th><th>Due Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  <tr v-for="b in recentBorrows" :key="b.id">
                    <td style="font-weight:600;">{{ b.students?.full_name }}</td>
                    <td>{{ b.books?.title }}</td>
                    <td>{{ new Date(b.due_date).toLocaleDateString() }}</td>
                    <td><span class="badge" :class="b.status === 'borrowed' ? 'badge-yellow' : b.status === 'overdue' ? 'badge-red' : 'badge-green'">{{ b.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Quick Actions</span></div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:12px;">
            <button class="btn btn-primary w-full" @click="$router.push('/librarian/borrows')">
              <ArrowUpTrayIcon class="w-4 h-4" /> Issue a Book
            </button>
            <button class="btn btn-secondary w-full" @click="$router.push('/librarian/books')">
              <PlusIcon class="w-4 h-4" /> Add New Book
            </button>
            <button class="btn btn-ghost w-full" @click="$router.push('/librarian/overdue')">
              <ExclamationTriangleIcon class="w-4 h-4" /> Check Overdue
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
