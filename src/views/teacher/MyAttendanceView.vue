<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/formatDate'
import { ClipboardDocumentListIcon } from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const attendance = ref([])
const loading = ref(true)

onMounted(async () => {
  if (auth.teacherProfile) {
    await loadAttendance()
  } else {
    setTimeout(async () => {
      if (auth.teacherProfile) await loadAttendance()
      else loading.value = false
    }, 1000)
  }
})

async function loadAttendance() {
  loading.value = true
  const { data } = await supabase
    .from('teacher_attendances')
    .select('*')
    .eq('teacher_id', auth.teacherProfile.id)
    .order('date', { ascending: false })
  attendance.value = data || []
  loading.value = false
}

function statusBadge(status) {
  const map = { present: 'badge-green', absent: 'badge-red', late: 'badge-yellow', permission: 'badge-blue' }
  return map[status] || 'badge-gray'
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">My Attendance</h1>
        <p class="page-subtitle">Your personal attendance records</p>
      </div>
    </div>

    <div v-if="loading" class="card card-body">
      <div v-for="i in 5" :key="i" class="skeleton" style="height:48px;margin-bottom:10px;border-radius:8px;"></div>
    </div>

    <div v-else class="card">
      <div v-if="attendance.length === 0" class="empty-state">
        <ClipboardDocumentListIcon class="w-12 h-12 text-gray-400" />
        <p class="empty-state-title">No records found</p>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Check-in Time</th>
              <th>Note / Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in attendance" :key="a.id">
              <td>{{ formatDate(a.date) }}</td>
              <td><span class="badge" :class="statusBadge(a.status)">{{ a.status }}</span></td>
              <td style="font-family:monospace;">{{ a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' }}</td>
              <td style="font-size:13px; color:var(--text-secondary);">
                <span v-if="a.note" class="badge badge-gray" :title="a.note">Override: {{ a.note }}</span>
                <span v-else-if="!a.check_in_time && a.status !== 'present'">—</span>
                <span v-else-if="!a.check_in_time">Auto</span>
                <span v-else>Self</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
