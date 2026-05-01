<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/formatDate'

const auth = useAuthStore()
const students = ref([])
const attendance = ref([])
const classInfo = ref(null)
const loading = ref(true)
const saving = ref(false)
const toast = ref(null)

const selectedDate = ref(new Date().toISOString().split('T')[0])
const bulkEntries = ref([])

onMounted(async () => {
  if (auth.teacherProfile) {
    await loadData()
  } else {
    setTimeout(async () => {
      if (auth.teacherProfile) await loadData()
      else loading.value = false
    }, 1000)
  }
})

async function loadData() {
  loading.value = true
  const teacherId = auth.teacherProfile.id

  const { data: classData } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacherId)
    .maybeSingle()
  
  if (classData) {
    classInfo.value = classData
    const { data } = await supabase
      .from('students')
      .select('id, full_name, gender')
      .eq('class_id', classData.id)
      .order('full_name')
    students.value = data || []
    await loadAttendance()
  }
  loading.value = false
}

async function loadAttendance() {
  if (!classInfo.value || !selectedDate.value) return
  
  const studentIds = students.value.map(s => s.id)
  const { data } = await supabase
    .from('attendances')
    .select('*')
    .in('student_id', studentIds)
    .eq('date', selectedDate.value)
  
  attendance.value = data || []
  
  // Prepare bulk entries
  const attMap = {}
  attendance.value.forEach(a => { attMap[a.student_id] = a })
  
  bulkEntries.value = students.value.map(s => {
    const existing = attMap[s.id]
    return {
      student_id: s.id,
      full_name: s.full_name,
      status: existing?.status || 'present',
      reason: existing?.reason || '',
      existing_id: existing?.id
    }
  })
}

async function save() {
  saving.value = true
  for (const entry of bulkEntries.value) {
    const payload = { 
      student_id: entry.student_id, 
      date: selectedDate.value, 
      status: entry.status, 
      reason: entry.reason 
    }
    
    if (entry.existing_id) {
      await supabase.from('attendances').update({ status: entry.status, reason: entry.reason }).eq('id', entry.existing_id)
    } else {
      await supabase.from('attendances').insert(payload)
    }
  }
  saving.value = false
  showToast('Attendance saved successfully!', 'success')
  await loadAttendance()
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

const summary = computed(() => {
  const s = { present: 0, absent: 0, late: 0, permission: 0 }
  bulkEntries.value.forEach(e => { s[e.status]++ })
  return s
})

function markAllPresent() {
  bulkEntries.value.forEach(e => {
    e.status = 'present'
    e.reason = ''
  })
}
</script>

<template>
  <div>
    <div class="toast-container">
      <div v-if="toast" class="toast" :class="`toast-${toast.type}`">{{ toast.type === 'success' ? '✅' : '❌' }} {{ toast.msg }}</div>
    </div>

    <div class="page-header">
      <div>
        <h1 class="page-title">Daily Attendance</h1>
        <p class="page-subtitle" v-if="classInfo">Marking for Class: <strong>{{ classInfo.class_name }}</strong></p>
      </div>
      <button v-if="classInfo" class="btn btn-primary" @click="save" :disabled="saving">
        {{ saving ? 'Saving…' : '💾 Save Attendance' }}
      </button>
    </div>

    <div v-if="loading" class="card card-body">
      <div v-for="i in 5" :key="i" class="skeleton" style="height:52px;margin-bottom:10px;border-radius:8px;"></div>
    </div>

    <div v-else-if="!classInfo" class="empty-state">
      <div class="empty-state-icon">🏫</div>
      <p class="empty-state-title">No Class Assigned</p>
    </div>

    <div v-else>
      <div class="card" style="margin-bottom:16px;">
        <div class="card-body" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;">
          <div class="form-group" style="width:200px;">
            <label class="form-label">កាលបរិច្ឆេទ (Date)</label>
            <input class="form-input" type="date" v-model="selectedDate" @change="loadAttendance" />
          </div>
          <button class="btn btn-ghost" @click="markAllPresent" :disabled="bulkEntries.length === 0" style="margin-top:14px; color:var(--primary-color);">
            ✅ គូសទាំងអស់ថាមានវត្តមាន
          </button>
          <div style="display:flex;gap:8px;flex:1;justify-content:flex-end;">
            <span class="badge badge-green">មក: {{ summary.present }}</span>
            <span class="badge badge-red">អវត្តមាន: {{ summary.absent }}</span>
            <span class="badge badge-yellow">យឺត: {{ summary.late }}</span>
            <span class="badge badge-blue">ច្បាប់: {{ summary.permission }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div v-if="bulkEntries.length === 0" class="empty-state">
          <div class="empty-state-icon">🎓</div>
          <p class="empty-state-title">No students found</p>
        </div>
        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr><th>Student</th><th>Status</th><th>Reason (if not present)</th></tr>
            </thead>
            <tbody>
              <tr v-for="entry in bulkEntries" :key="entry.student_id">
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div class="avatar" style="width:32px;height:32px;font-size:12px;">{{ initials(entry.full_name) }}</div>
                    <span style="font-weight:600;">{{ entry.full_name }}</span>
                  </div>
                </td>
                <td>
                  <div style="display:flex;gap:4px;">
                    <button 
                      v-for="s in ['present', 'absent', 'late', 'permission']" 
                      :key="s"
                      class="btn btn-sm"
                      :class="entry.status === s ? statusBadge(s).replace('badge-', 'btn-') : 'btn-ghost'"
                      style="font-size:11px;"
                      @click="entry.status = s"
                    >
                      {{ s.charAt(0).toUpperCase() + s.slice(1) }}
                    </button>
                  </div>
                </td>
                <td>
                  <input 
                    v-if="entry.status !== 'present'"
                    class="form-input" 
                    v-model="entry.reason" 
                    placeholder="e.g. Hospital, Travel" 
                    style="width:100%;max-width:200px;"
                  />
                  <span v-else style="color:var(--text-muted);font-size:12px;">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="bulkEntries.length > 0" class="card-footer" style="display:flex;justify-content:flex-end;">
          <button class="btn btn-primary" @click="save" :disabled="saving">
            {{ saving ? 'Saving…' : '💾 Save Attendance' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
