<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/formatDate'

const teachers = ref([])
const attendance = ref([])
const loading = ref(true)
const saving = ref(false)
const toast = ref(null)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const showModal = ref(false)
const editEntry = ref(null)

const attendanceMap = computed(() => {
  const map = {}
  attendance.value.forEach(a => { map[a.teacher_id] = a })
  return map
})

onMounted(async () => { await loadTeachers() })

async function loadTeachers() {
  loading.value = true
  const { data } = await supabase.from('teachers').select('id, full_name, gender').order('full_name')
  teachers.value = data || []
  await loadAttendance()
}

async function loadAttendance() {
  const { data } = await supabase.from('teacher_attendances').select('*').eq('date', selectedDate.value)
  attendance.value = data || []
  loading.value = false
}

function statusBadge(status) {
  const map = { present: 'badge-green', absent: 'badge-red', late: 'badge-yellow', permission: 'badge-blue' }
  return map[status] || 'badge-gray'
}

function openEdit(teacher) {
  const existing = attendanceMap.value[teacher.id]
  editEntry.value = {
    teacher_id: teacher.id,
    teacher_name: teacher.full_name,
    status: existing?.status || 'present',
    existing_id: existing?.id
  }
  showModal.value = true
}

async function saveEntry() {
  saving.value = true
  const { teacher_id, status, existing_id, teacher_name } = editEntry.value
  const payload = { teacher_id, date: selectedDate.value, status }
  const { error } = existing_id
    ? await supabase.from('teacher_attendances').update({ status }).eq('id', existing_id)
    : await supabase.from('teacher_attendances').insert(payload)
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast('Attendance saved!', 'success')
  showModal.value = false
  await loadAttendance()
}

function showToast(msg, type = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3000)
}

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const summary = computed(() => {
  const s = { present: 0, absent: 0, late: 0, permission: 0, unmarked: 0 }
  teachers.value.forEach(t => {
    const a = attendanceMap.value[t.id]
    if (a) s[a.status]++
    else s.unmarked++
  })
  return s
})
</script>

<template>
  <div>
    <div class="toast-container">
      <div v-if="toast" class="toast" :class="`toast-${toast.type}`">{{ toast.type === 'success' ? '✅' : '❌' }} {{ toast.msg }}</div>
    </div>

    <div class="page-header">
      <div><h1 class="page-title">Teacher Attendance</h1><p class="page-subtitle">Daily attendance tracking for all teachers</p></div>
    </div>

    <!-- Date picker -->
    <div class="card" style="margin-bottom:16px;">
      <div class="card-body" style="display:flex;gap:14px;align-items:flex-end;">
        <div class="form-group">
          <label class="form-label">Date</label>
          <input class="form-input" type="date" v-model="selectedDate" @change="loadAttendance" style="width:180px;" />
        </div>
        <div style="display:flex;gap:8px;margin-left:auto;">
          <span class="badge badge-green">Present: {{ summary.present }}</span>
          <span class="badge badge-red">Absent: {{ summary.absent }}</span>
          <span class="badge badge-yellow">Late: {{ summary.late }}</span>
          <span class="badge badge-blue">Permission: {{ summary.permission }}</span>
          <span class="badge badge-gray">Unmarked: {{ summary.unmarked }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="card-body">
        <div v-for="i in 5" :key="i" class="skeleton" style="height:48px;margin-bottom:10px;border-radius:8px;"></div>
      </div>
      <div v-else-if="teachers.length === 0" class="empty-state">
        <div class="empty-state-icon">👩‍🏫</div>
        <p class="empty-state-title">No teachers found</p>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead><tr><th>Teacher</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="t in teachers" :key="t.id">
              <td>
                <div style="display:flex;align-items:center;gap:10px;">
                  <div class="avatar">{{ initials(t.full_name) }}</div>
                  <div>
                    <div style="font-weight:600;font-size:13px;">{{ t.full_name }}</div>
                    <div style="font-size:11px;color:var(--text-muted);">{{ t.gender || '' }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span v-if="attendanceMap[t.id]" class="badge" :class="statusBadge(attendanceMap[t.id].status)">
                  {{ attendanceMap[t.id].status }}
                </span>
                <span v-else class="badge badge-gray">Not marked</span>
              </td>
              <td>
                <button class="btn btn-ghost btn-sm" @click="openEdit(t)">
                  {{ attendanceMap[t.id] ? 'Edit' : 'Mark' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mark modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal" style="max-width:400px;">
        <div class="modal-header">
          <span class="modal-title">Mark Attendance — {{ editEntry?.teacher_name }}</span>
          <button class="btn btn-ghost btn-sm btn-icon" @click="showModal = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Status</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
              <button
                v-for="s in ['present', 'absent', 'late', 'permission']"
                :key="s"
                class="btn"
                :class="editEntry.status === s ? 'btn-primary' : 'btn-ghost'"
                @click="editEntry.status = s"
              >{{ s.charAt(0).toUpperCase() + s.slice(1) }}</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary" @click="saveEntry" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
