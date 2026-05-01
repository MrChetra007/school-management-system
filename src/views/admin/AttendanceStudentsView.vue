<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAcademicYearStore } from '@/stores/academicYear'
import { toInputDate, formatDate } from '@/utils/formatDate'

// Data
const yearStore = useAcademicYearStore()
const students = ref([])
const classes = ref([])
const attendance = ref([])
const loading = ref(true)
const saving = ref(false)
const toast = ref(null)

// Filters
const selectedDate = ref(new Date().toISOString().split('T')[0])
const selectedClass = ref('')

// For bulk entry mode
const bulkMode = ref(false)
const bulkEntries = ref([]) // [{ student_id, status, reason }]

const filteredStudents = computed(() => {
  if (!selectedClass.value) return []
  return students.value.filter(s => s.class_id === selectedClass.value)
})

const attendanceMap = computed(() => {
  const map = {}
  attendance.value.forEach(a => { map[a.student_id] = a })
  return map
})

onMounted(async () => { await Promise.all([loadClasses(), loadStudents()]) })

async function loadStudents() {
  const { data } = await supabase
    .from('students')
    .select('id, full_name, gender, class_id')
    .eq('academic_year_id', yearStore.selectedYearId)
    .order('full_name')
  students.value = data || []
}
async function loadClasses() {
  const { data } = await supabase
    .from('classes')
    .select('id, class_name')
    .eq('academic_year_id', yearStore.selectedYearId)
    .order('class_name')
  classes.value = data || []
}

async function loadAttendance() {
  if (!selectedClass.value || !selectedDate.value) return
  loading.value = true
  const studentIds = filteredStudents.value.map(s => s.id)
  const { data } = await supabase
    .from('attendances')
    .select('*')
    .in('student_id', studentIds)
    .eq('date', selectedDate.value)
  attendance.value = data || []
  loading.value = false
}

async function onClassChange() {
  await loadAttendance()
  // Pre-populate bulk entries
  bulkEntries.value = filteredStudents.value.map(s => {
    const existing = attendanceMap.value[s.id]
    return { student_id: s.id, status: existing?.status || 'present', reason: existing?.reason || '', existing_id: existing?.id }
  })
}

async function saveBulk() {
  if (!selectedClass.value || !selectedDate.value) { showToast('Select a class and date', 'error'); return }
  saving.value = true
  for (const entry of bulkEntries.value) {
    const payload = { student_id: entry.student_id, date: selectedDate.value, status: entry.status, reason: entry.reason }
    if (entry.existing_id) {
      await supabase.from('attendances').update({ status: entry.status, reason: entry.reason }).eq('id', entry.existing_id)
    } else {
      await supabase.from('attendances').insert(payload)
    }
  }
  saving.value = false
  showToast('Attendance saved!', 'success')
  await loadAttendance()
  bulkEntries.value = bulkEntries.value.map(e => ({
    ...e,
    existing_id: attendanceMap.value[e.student_id]?.id || e.existing_id
  }))
}

function statusBadge(status) {
  const map = { present: 'badge-green', absent: 'badge-red', late: 'badge-yellow', permission: 'badge-blue' }
  return map[status] || 'badge-gray'
}

function showToast(msg, type = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3000)
}

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
</script>

<template>
  <div>
    <div class="toast-container">
      <div v-if="toast" class="toast" :class="`toast-${toast.type}`">{{ toast.type === 'success' ? '✅' : '❌' }} {{ toast.msg }}</div>
    </div>

    <div class="page-header">
      <div><h1 class="page-title">Student Attendance</h1><p class="page-subtitle">View and manage daily attendance by class</p></div>
    </div>

    <!-- Filters -->
    <div class="card" style="margin-bottom:16px;">
      <div class="card-body" style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;">
        <div class="form-group" style="flex:1;min-width:160px;">
          <label class="form-label">Date</label>
          <input class="form-input" type="date" v-model="selectedDate" @change="loadAttendance" />
        </div>
        <div class="form-group" style="flex:1;min-width:200px;">
          <label class="form-label">Class</label>
          <select class="form-select" v-model="selectedClass" @change="onClassChange">
            <option value="">— Select class —</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.class_name }}</option>
          </select>
        </div>
        <button v-if="selectedClass" class="btn btn-primary" @click="saveBulk" :disabled="saving">
          {{ saving ? 'Saving…' : '💾 Save Attendance' }}
        </button>
      </div>
    </div>

    <!-- Prompt to select class -->
    <div v-if="!selectedClass" class="empty-state" style="padding:60px 20px;">
      <div class="empty-state-icon">📋</div>
      <p class="empty-state-title">Select a class to mark attendance</p>
    </div>

    <!-- Attendance table -->
    <div v-else class="card">
      <div class="card-header">
        <span class="card-title">{{ classes.find(c => c.id === selectedClass)?.class_name }} — {{ selectedDate }}</span>
        <div style="display:flex;gap:8px;">
          <span class="badge badge-green">Present: {{ bulkEntries.filter(e => e.status === 'present').length }}</span>
          <span class="badge badge-red">Absent: {{ bulkEntries.filter(e => e.status === 'absent').length }}</span>
          <span class="badge badge-yellow">Late: {{ bulkEntries.filter(e => e.status === 'late').length }}</span>
          <span class="badge badge-blue">Permission: {{ bulkEntries.filter(e => e.status === 'permission').length }}</span>
        </div>
      </div>
      <div v-if="loading" class="card-body">
        <div v-for="i in 5" :key="i" class="skeleton" style="height:44px;margin-bottom:10px;border-radius:8px;"></div>
      </div>
      <div v-else-if="bulkEntries.length === 0" class="empty-state">
        <div class="empty-state-icon">🎓</div>
        <p class="empty-state-title">No students in this class</p>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead><tr><th>Student</th><th>Status</th><th>Reason</th></tr></thead>
          <tbody>
            <tr v-for="(entry, idx) in bulkEntries" :key="entry.student_id">
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div class="avatar" style="width:30px;height:30px;font-size:11px;">{{ initials(filteredStudents[idx]?.full_name) }}</div>
                  <span style="font-weight:600;font-size:13px;">{{ filteredStudents[idx]?.full_name }}</span>
                </div>
              </td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button
                    v-for="s in ['present', 'absent', 'late', 'permission']"
                    :key="s"
                    class="btn btn-sm"
                    :class="entry.status === s ? statusBadge(s).replace('badge-', 'btn-') : 'btn-ghost'"
                    :style="entry.status === s ? 'font-weight:700;' : 'opacity:0.5;'"
                    @click="entry.status = s"
                  >{{ s.charAt(0).toUpperCase() + s.slice(1) }}</button>
                </div>
              </td>
              <td>
                <input
                  v-if="entry.status !== 'present'"
                  class="form-input"
                  v-model="entry.reason"
                  placeholder="Reason…"
                  style="width:180px;"
                />
                <span v-else style="color:var(--text-muted);font-size:12px;">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="bulkEntries.length > 0" style="padding:12px 20px;border-top:1px solid var(--border-default);display:flex;justify-content:flex-end;">
        <button class="btn btn-primary" @click="saveBulk" :disabled="saving">{{ saving ? 'Saving…' : '💾 Save Attendance' }}</button>
      </div>
    </div>
  </div>
</template>
