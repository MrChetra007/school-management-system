<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAcademicYearStore } from '@/stores/academicYear'
import { toInputDate, formatDate } from '@/utils/formatDate'

const yearStore = useAcademicYearStore()
const currentTab = ref('school')
const loading = ref(false)
const saving = ref(false)
const toast = ref(null)

const tabs = [
  { id: 'school', label: '🏫 School Info' },
  { id: 'years', label: '📅 Academic Years' },
  { id: 'subjects', label: '📚 Subjects' },
  { id: 'holidays', label: '🗓️ Holidays' },
  { id: 'attendance', label: '⏰ Attendance Config' },
]

function showToast(msg, type = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3000)
}

// ── SCHOOL INFO ───────────────────────────────────────────
const schoolForm = ref({
  id: null, name_khmer: '', name_english: '', school_code: '',
  director_name: '', address: '', phone: '', email: '', logo_base64: ''
})
const uploadingLogo = ref(false)

async function loadSchool() {
  loading.value = true
  const { data, error } = await supabase.from('school_information').select('*').limit(1).maybeSingle()
  if (error) {
    console.error('Error loading school info:', error)
    showToast(error.message, 'error')
  }
  if (data) Object.assign(schoolForm.value, data)
  loading.value = false
}

async function saveSchool() {
  saving.value = true
  const { id, ...payload } = schoolForm.value
  payload.updated_at = new Date().toISOString()
  const { error } = id 
    ? await supabase.from('school_information').update(payload).eq('id', id)
    : await supabase.from('school_information').insert(payload)
  saving.value = false
  if (error) showToast(error.message, 'error')
  else showToast('School info saved!')
}

async function uploadLogo(e) {
  const file = e.target.files[0]
  if (!file) return
  uploadingLogo.value = true
  const reader = new FileReader()
  reader.onload = (ev) => {
    schoolForm.value.logo_base64 = ev.target.result
    uploadingLogo.value = false
  }
  reader.readAsDataURL(file)
}

// ── ACADEMIC YEARS ────────────────────────────────────────
const years = ref([])
const yearModal = ref(false)
const isYearEdit = ref(false)
const yearForm = ref({ id: null, year_name: '', start_date: '', end_date: '', status: 'active' })
const yearDeleteTarget = ref(null)

async function loadYears() {
  loading.value = true
  const { data } = await supabase.from('academic_years').select('*').order('start_date', { ascending: false })
  years.value = data || []
  loading.value = false
}

function openAddYear() { isYearEdit.value = false; yearForm.value = { id: null, year_name: '', start_date: '', end_date: '', status: 'active' }; yearModal.value = true }
function openEditYear(y) { isYearEdit.value = true; yearForm.value = { ...y, start_date: toInputDate(y.start_date), end_date: toInputDate(y.end_date) }; yearModal.value = true }

async function saveYear() {
  if (!yearForm.value.year_name.trim() || !yearForm.value.start_date || !yearForm.value.end_date) {
    showToast('Missing required fields', 'error'); return
  }
  saving.value = true
  const { id, ...payload } = yearForm.value
  const { error } = isYearEdit.value
    ? await supabase.from('academic_years').update(payload).eq('id', id)
    : await supabase.from('academic_years').insert(payload)
  saving.value = false
  if (error) showToast(error.message, 'error')
  else { showToast('Year saved!'); yearModal.value = false; loadYears() }
}

async function deleteYear() {
  const { error } = await supabase.from('academic_years').delete().eq('id', yearDeleteTarget.value.id)
  if (error) showToast(error.message, 'error')
  else { showToast('Year deleted'); yearDeleteTarget.value = null; loadYears() }
}

// ── SUBJECTS ──────────────────────────────────────────────
const subjects = ref([])
const subjectModal = ref(false)
const isSubjectEdit = ref(false)
const subjectForm = ref({ id: null, subject_name: '' })
const subjectDeleteTarget = ref(null)

async function loadSubjects() {
  loading.value = true
  const { data, error } = await supabase.from('subjects').select('*').order('subject_name')
  if (error) {
    console.error('Error loading subjects:', error)
    showToast(error.message, 'error')
  }
  subjects.value = data || []
  loading.value = false
}

function openAddSubject() { isSubjectEdit.value = false; subjectForm.value = { id: null, subject_name: '' }; subjectModal.value = true }
function openEditSubject(s) { isSubjectEdit.value = true; subjectForm.value = { ...s }; subjectModal.value = true }

async function saveSubject() {
  if (!subjectForm.value.subject_name.trim()) { showToast('Name required', 'error'); return }
  saving.value = true
  const { id, ...payload } = subjectForm.value
  const { error } = isSubjectEdit.value
    ? await supabase.from('subjects').update(payload).eq('id', id)
    : await supabase.from('subjects').insert(payload)
  saving.value = false
  if (error) showToast(error.message, 'error')
  else { showToast('Subject saved!'); subjectModal.value = false; loadSubjects() }
}

async function deleteSubject() {
  const { error } = await supabase.from('subjects').delete().eq('id', subjectDeleteTarget.value.id)
  if (error) showToast(error.message, 'error')
  else { showToast('Subject deleted'); subjectDeleteTarget.value = null; loadSubjects() }
}

// ── HOLIDAYS ──────────────────────────────────────────────
const holidays = ref([])
const holidayModal = ref(false)
const isHolidayEdit = ref(false)
const holidayForm = ref({ id: null, name: '', start_date: '', end_date: '', academic_year_id: yearStore.selectedYearId })
const holidayDeleteTarget = ref(null)

async function loadHolidays() {
  loading.value = true
  const { data } = await supabase.from('school_holidays').select('*').eq('academic_year_id', yearStore.selectedYearId).order('start_date', { ascending: false })
  holidays.value = data || []
  loading.value = false
}

function openAddHoliday() { isHolidayEdit.value = false; holidayForm.value = { id: null, name: '', start_date: '', end_date: '', academic_year_id: yearStore.selectedYearId }; holidayModal.value = true }
function openEditHoliday(h) { isHolidayEdit.value = true; holidayForm.value = { ...h, start_date: toInputDate(h.start_date), end_date: toInputDate(h.end_date) }; holidayModal.value = true }

async function saveHoliday() {
  if (!holidayForm.value.name.trim() || !holidayForm.value.start_date || !holidayForm.value.end_date) {
    showToast('Required fields missing', 'error'); return
  }
  saving.value = true
  const { id, ...payload } = holidayForm.value
  const { error } = isHolidayEdit.value
    ? await supabase.from('school_holidays').update(payload).eq('id', id)
    : await supabase.from('school_holidays').insert(payload)
  saving.value = false
  if (error) showToast(error.message, 'error')
  else { showToast('Holiday saved!'); holidayModal.value = false; loadHolidays() }
}

async function deleteHoliday() {
  const { error } = await supabase.from('school_holidays').delete().eq('id', holidayDeleteTarget.value.id)
  if (error) showToast(error.message, 'error')
  else { showToast('Holiday deleted'); holidayDeleteTarget.value = null; loadHolidays() }
}

// ── ATTENDANCE CONFIG ─────────────────────────────────────
const attConfig = ref({
  id: null,
  morning_start: '07:00',
  morning_late_threshold: '07:15',
  evening_start: '13:00',
  evening_late_threshold: '13:15'
})

async function loadAttConfig() {
  loading.value = true
  const { data } = await supabase.from('school_settings').select('*').limit(1).single()
  if (data) Object.assign(attConfig.value, data)
  loading.value = false
}

async function saveAttConfig() {
  saving.value = true
  const { id, ...payload } = attConfig.value
  payload.updated_at = new Date().toISOString()
  const { error } = await supabase.from('school_settings').update(payload).eq('id', id)
  saving.value = false
  if (error) showToast(error.message, 'error')
  else showToast('Attendance config saved!')
}

// Lifecycle
onMounted(() => {
  loadSchool()
})

function switchTab(id) {
  currentTab.value = id
  if (id === 'school') loadSchool()
  if (id === 'years') loadYears()
  if (id === 'subjects') loadSubjects()
  if (id === 'holidays') loadHolidays()
  if (id === 'attendance') loadAttConfig()
}

</script>

<template>
  <div class="settings-page">
    <div class="toast-container">
      <div v-if="toast" class="toast" :class="`toast-${toast.type}`">{{ toast.type === 'success' ? '✅' : '❌' }} {{ toast.msg }}</div>
    </div>

    <div class="page-header">
      <div><h1 class="page-title">Settings</h1><p class="page-subtitle">Configure school information, academic years, and system rules</p></div>
    </div>

    <!-- Tab Navigation -->
    <div class="tabs-nav">
      <button 
        v-for="tab in tabs" :key="tab.id"
        class="tab-btn" :class="{ active: currentTab === tab.id }"
        @click="switchTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="tab-content" style="margin-top:20px;">
      
      <!-- 🏫 Tab: School Information -->
      <div v-if="currentTab === 'school'" class="tab-pane">
        <div class="card">
          <div class="card-header"><span class="card-title">School Details</span><button class="btn btn-primary btn-sm" @click="saveSchool" :disabled="saving">{{ saving ? 'Saving...' : '💾 Save' }}</button></div>
          <div class="card-body" style="display:grid;grid-template-columns:200px 1fr;gap:24px;">
            <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
              <div class="logo-box">
                <img v-if="schoolForm.logo_base64" :src="schoolForm.logo_base64" />
                <span v-else style="font-size:40px;">🏫</span>
              </div>
              <label class="btn btn-ghost btn-sm">
                {{ uploadingLogo ? '...' : 'Upload Logo' }}
                <input type="file" @change="uploadLogo" hidden accept="image/*" />
              </label>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
              <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Name (Khmer)</label><input class="form-input khmer" v-model="schoolForm.name_khmer" /></div>
              <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Name (English)</label><input class="form-input" v-model="schoolForm.name_english" /></div>
              <div class="form-group"><label class="form-label">Code</label><input class="form-input" v-model="schoolForm.school_code" /></div>
              <div class="form-group"><label class="form-label">Director</label><input class="form-input" v-model="schoolForm.director_name" /></div>
              <div class="form-group"><label class="form-label">Phone</label><input class="form-input" v-model="schoolForm.phone" /></div>
              <div class="form-group"><label class="form-label">Email</label><input class="form-input" v-model="schoolForm.email" /></div>
              <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Address</label><textarea class="form-textarea" v-model="schoolForm.address" rows="2"></textarea></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 📅 Tab: Academic Years -->
      <div v-if="currentTab === 'years'" class="tab-pane">
        <div class="card">
          <div class="card-header"><span class="card-title">Academic Years</span><button class="btn btn-primary btn-sm" @click="openAddYear">+ Add Year</button></div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Year Name</th><th>Dates</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="y in years" :key="y.id">
                  <td><strong>{{ y.year_name }}</strong></td>
                  <td>{{ formatDate(y.start_date) }} - {{ formatDate(y.end_date) }}</td>
                  <td><span class="badge" :class="y.status === 'active' ? 'badge-green' : 'badge-gray'">{{ y.status }}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" @click="openEditYear(y)">Edit</button>
                    <button class="btn btn-ghost btn-sm text-danger" @click="yearDeleteTarget = y">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 📚 Tab: Subjects -->
      <div v-if="currentTab === 'subjects'" class="tab-pane">
        <div class="card">
          <div class="card-header"><span class="card-title">Subjects</span><button class="btn btn-primary btn-sm" @click="openAddSubject">+ Add Subject</button></div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>#</th><th>Subject Name</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="(s, idx) in subjects" :key="s.id">
                  <td>{{ idx + 1 }}</td>
                  <td><strong>{{ s.subject_name }}</strong></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" @click="openEditSubject(s)">Edit</button>
                    <button class="btn btn-ghost btn-sm text-danger" @click="subjectDeleteTarget = s">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 🗓️ Tab: Holidays -->
      <div v-if="currentTab === 'holidays'" class="tab-pane">
        <div class="card">
          <div class="card-header"><span class="card-title">Holidays ({{ yearStore.selectedYearName }})</span><button class="btn btn-primary btn-sm" @click="openAddHoliday">+ Add Holiday</button></div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Start</th><th>End</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="h in holidays" :key="h.id">
                  <td><strong>🌴 {{ h.name }}</strong></td>
                  <td>{{ formatDate(h.start_date) }}</td>
                  <td>{{ formatDate(h.end_date) }}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm" @click="openEditHoliday(h)">Edit</button>
                    <button class="btn btn-ghost btn-sm text-danger" @click="holidayDeleteTarget = h">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ⏰ Tab: Attendance Config -->
      <div v-if="currentTab === 'attendance'" class="tab-pane">
        <div class="card" style="max-width:600px;">
          <div class="card-header"><span class="card-title">Attendance Thresholds</span><button class="btn btn-primary btn-sm" @click="saveAttConfig" :disabled="saving">{{ saving ? 'Saving...' : '💾 Save' }}</button></div>
          <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div class="form-group" style="grid-column:1/-1;margin-bottom:0;"><h4 style="color:var(--primary-color);">Morning Shift</h4></div>
            <div class="form-group"><label class="form-label">Shift Start</label><input type="time" class="form-input" v-model="attConfig.morning_start" /></div>
            <div class="form-group"><label class="form-label">Late Threshold</label><input type="time" class="form-input" v-model="attConfig.morning_late_threshold" /></div>
            
            <div class="form-group" style="grid-column:1/-1;margin-bottom:0;padding-top:10px;border-top:1px solid var(--border-default);"><h4 style="color:var(--primary-color);">Evening Shift</h4></div>
            <div class="form-group"><label class="form-label">Shift Start</label><input type="time" class="form-input" v-model="attConfig.evening_start" /></div>
            <div class="form-group"><label class="form-label">Late Threshold</label><input type="time" class="form-input" v-model="attConfig.evening_late_threshold" /></div>
            
            <div style="grid-column:1/-1;background:var(--primary-50);padding:12px;border-radius:8px;font-size:12px;color:var(--primary-700);">
              ℹ️ <strong>How it works:</strong> If a teacher checks in <em>after</em> the threshold time, they are automatically marked as <strong>Late</strong>. Otherwise, they are <strong>Present</strong>.
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- MODALS (Simplified for brevity) -->
    <div v-if="yearModal" class="modal-overlay" @click.self="yearModal = false">
      <div class="modal" style="max-width:400px;">
        <div class="modal-header"><span class="modal-title">Academic Year</span></div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:12px;">
          <div class="form-group"><label class="form-label">Name</label><input class="form-input" v-model="yearForm.year_name" /></div>
          <div class="form-group"><label class="form-label">Start</label><input type="date" class="form-input" v-model="yearForm.start_date" /></div>
          <div class="form-group"><label class="form-label">End</label><input type="date" class="form-input" v-model="yearForm.end_date" /></div>
          <div class="form-group"><label class="form-label">Status</label><select class="form-select" v-model="yearForm.status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>
        <div class="modal-footer"><button class="btn btn-ghost" @click="yearModal = false">Cancel</button><button class="btn btn-primary" @click="saveYear">Save</button></div>
      </div>
    </div>

    <div v-if="subjectModal" class="modal-overlay" @click.self="subjectModal = false">
      <div class="modal" style="max-width:400px;">
        <div class="modal-header"><span class="modal-title">Subject</span></div>
        <div class="modal-body"><div class="form-group"><label class="form-label">Name</label><input class="form-input" v-model="subjectForm.subject_name" /></div></div>
        <div class="modal-footer"><button class="btn btn-ghost" @click="subjectModal = false">Cancel</button><button class="btn btn-primary" @click="saveSubject">Save</button></div>
      </div>
    </div>

    <div v-if="holidayModal" class="modal-overlay" @click.self="holidayModal = false">
      <div class="modal" style="max-width:400px;">
        <div class="modal-header"><span class="modal-title">Holiday</span></div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:12px;">
          <div class="form-group"><label class="form-label">Name</label><input class="form-input" v-model="holidayForm.name" /></div>
          <div class="form-group"><label class="form-label">Start</label><input type="date" class="form-input" v-model="holidayForm.start_date" /></div>
          <div class="form-group"><label class="form-label">End</label><input type="date" class="form-input" v-model="holidayForm.end_date" /></div>
        </div>
        <div class="modal-footer"><button class="btn btn-ghost" @click="holidayModal = false">Cancel</button><button class="btn btn-primary" @click="saveHoliday">Save</button></div>
      </div>
    </div>

    <!-- DELETE CONFIRMS -->
    <div v-if="yearDeleteTarget" class="modal-overlay"><div class="modal" style="max-width:320px;padding:20px;text-align:center;"><h3>Delete Year?</h3><div class="modal-footer"><button class="btn btn-ghost" @click="yearDeleteTarget = null">Cancel</button><button class="btn btn-danger" @click="deleteYear">Delete</button></div></div></div>
    <div v-if="subjectDeleteTarget" class="modal-overlay"><div class="modal" style="max-width:320px;padding:20px;text-align:center;"><h3>Delete Subject?</h3><div class="modal-footer"><button class="btn btn-ghost" @click="subjectDeleteTarget = null">Cancel</button><button class="btn btn-danger" @click="deleteSubject">Delete</button></div></div></div>
    <div v-if="holidayDeleteTarget" class="modal-overlay"><div class="modal" style="max-width:320px;padding:20px;text-align:center;"><h3>Delete Holiday?</h3><div class="modal-footer"><button class="btn btn-ghost" @click="holidayDeleteTarget = null">Cancel</button><button class="btn btn-danger" @click="deleteHoliday">Delete</button></div></div></div>

  </div>
</template>

<style scoped>
.settings-page { padding: 0; }
.tabs-nav {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border-default);
  padding: 0 4px;
}
.tab-btn {
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn:hover { color: var(--primary-color); }
.tab-btn.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}
.logo-box {
  width: 120px;
  height: 120px;
  background: #f1f5f9;
  border: 2px dashed var(--border-default);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.logo-box img { width: 100%; height: 100%; object-fit: contain; }
.text-danger { color: #dc2626; }
</style>
