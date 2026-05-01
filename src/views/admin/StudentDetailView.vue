<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { formatDate, toInputDate } from '@/utils/formatDate'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale
)

const route = useRoute()
const router = useRouter()
const studentId = route.params.id

const student = ref(null)
const health = ref(null)
const checkups = ref([])
const growth = ref([])
const vaccinations = ref([])
const sickDays = ref([])
const loading = ref(true)
const saving = ref(false)
const toast = ref(null)
const activeTab = ref('health')

// Chart Options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top'
    }
  },
  scales: {
    y: {
      beginAtZero: false
    }
  }
}

// Growth Summary & Progress
const latestGrowth = computed(() => {
  if (growth.value.length === 0) return null
  return growth.value[0]
})

const growthHistory = computed(() => {
  return growth.value.map((g, index) => {
    const prev = growth.value[index + 1]
    return {
      ...g,
      heightDelta: prev ? (g.height - prev.height).toFixed(1) : null,
      weightDelta: prev ? (g.weight - prev.weight).toFixed(1) : null
    }
  })
})

// Sick Days form
const showSickDayModal = ref(false)
const sickDayForm = ref({ id: null, date: '', reason: '', duration: 1, notes: '' })

// Health form
const healthForm = ref({ id: null, blood_type: '', allergies: '', medical_conditions: '', emergency_contact_name: '', emergency_contact_phone: '', vaccination_complete: false })
const showCheckupModal = ref(false)
const checkupForm = ref({ id: null, date: '', type: '', result: '', vision: '', hearing: '', dental: '', notes: '' })
const showGrowthModal = ref(false)
const growthForm = ref({ id: null, date: '', age: '', height: '', weight: '' })
const showVaccineModal = ref(false)
const vaccineForm = ref({ id: null, name: '', description: '', completed: false, date: '' })

onMounted(async () => {
  await Promise.all([loadStudent(), loadHealth(), loadCheckups(), loadGrowth(), loadVaccinations(), loadSickDays()])
  loading.value = false
})

async function loadStudent() {
  const { data } = await supabase.from('students').select('*, classes(class_name), academic_years(year_name)').eq('id', studentId).single()
  student.value = data
}
async function loadHealth() {
  const { data } = await supabase.from('student_health').select('*').eq('student_id', studentId).maybeSingle()
  if (data) { health.value = data; Object.assign(healthForm.value, data) }
}
async function loadCheckups() {
  const { data } = await supabase.from('student_checkups').select('*').eq('student_id', studentId).order('date', { ascending: false })
  checkups.value = data || []
}
async function loadGrowth() {
  const { data } = await supabase.from('student_growth').select('*').eq('student_id', studentId).order('date', { ascending: false })
  growth.value = data || []
}
async function loadVaccinations() {
  const { data } = await supabase.from('student_vaccinations').select('*').eq('student_id', studentId).order('date', { ascending: false })
  vaccinations.value = data || []
}
async function loadSickDays() {
  const { data } = await supabase.from('student_sick_days').select('*').eq('student_id', studentId).order('date', { ascending: false })
  sickDays.value = data || []
}

async function saveHealth() {
  saving.value = true
  const payload = { ...healthForm.value, student_id: studentId, updated_at: new Date().toISOString().split('T')[0] }
  const { error } = health.value
    ? await supabase.from('student_health').update(payload).eq('id', health.value.id)
    : await supabase.from('student_health').insert(payload)
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast('Health info saved!', 'success')
  loadHealth()
}

async function saveCheckup() {
  saving.value = true
  const { id, ...payload } = { ...checkupForm.value, student_id: studentId }
  const { error } = id
    ? await supabase.from('student_checkups').update(payload).eq('id', id)
    : await supabase.from('student_checkups').insert(payload)
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast('Checkup saved!', 'success')
  showCheckupModal.value = false
  loadCheckups()
}

async function saveGrowth() {
  saving.value = true
  const { id, ...payload } = { ...growthForm.value, student_id: studentId }
  const { error } = id
    ? await supabase.from('student_growth').update(payload).eq('id', id)
    : await supabase.from('student_growth').insert(payload)
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast('Growth record saved!', 'success')
  showGrowthModal.value = false
  loadGrowth()
}

async function saveVaccine() {
  saving.value = true
  const { id, ...payload } = { ...vaccineForm.value, student_id: studentId }
  const { error } = id
    ? await supabase.from('student_vaccinations').update(payload).eq('id', id)
    : await supabase.from('student_vaccinations').insert(payload)
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast('Vaccination saved!', 'success')
  showVaccineModal.value = false
  loadVaccinations()
}

async function saveSickDay() {
  saving.value = true
  const { id, ...payload } = { ...sickDayForm.value, student_id: studentId }
  const { error } = id
    ? await supabase.from('student_sick_days').update(payload).eq('id', id)
    : await supabase.from('student_sick_days').insert(payload)
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast('Sick day saved!', 'success')
  showSickDayModal.value = false
  loadSickDays()
}

async function deleteSickDay(id) {
  if (!confirm('Are you sure you want to delete this sick day record?')) return
  const { error } = await supabase.from('student_sick_days').delete().eq('id', id)
  if (error) { showToast(error.message, 'error'); return }
  showToast('Sick day deleted', 'success')
  loadSickDays()
}

function openCheckup(c = null) {
  checkupForm.value = c ? { ...c, date: toInputDate(c.date) } : { id: null, date: '', type: '', result: '', vision: '', hearing: '', dental: '', notes: '' }
  showCheckupModal.value = true
}
function openGrowth(g = null) {
  growthForm.value = g ? { ...g, date: toInputDate(g.date) } : { id: null, date: '', age: '', height: '', weight: '' }
  showGrowthModal.value = true
}
function openVaccine(v = null) {
  vaccineForm.value = v ? { ...v, date: toInputDate(v.date) } : { id: null, name: '', description: '', completed: false, date: '' }
  showVaccineModal.value = true
}
function openSickDay(s = null) {
  sickDayForm.value = s ? { ...s, date: toInputDate(s.date) } : { id: null, date: '', reason: '', duration: 1, notes: '' }
  showSickDayModal.value = true
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

    <!-- Back button -->
    <div style="margin-bottom:16px;">
      <button class="btn btn-ghost btn-sm" @click="router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back
      </button>
    </div>

    <div v-if="loading" class="card card-body">
      <div v-for="i in 4" :key="i" class="skeleton" style="height:48px;margin-bottom:14px;border-radius:8px;"></div>
    </div>

    <template v-else-if="student">
      <!-- Student profile card -->
      <div class="card" style="margin-bottom:20px;">
        <div class="card-body" style="display:flex;align-items:center;gap:20px;">
          <div class="avatar avatar-xl">{{ initials(student.full_name) }}</div>
          <div style="flex:1;">
            <h2 style="font-size:22px;font-weight:700;margin-bottom:4px;">{{ student.full_name }}</h2>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <span class="badge" :class="student.gender === 'Male' ? 'badge-blue' : 'badge-red'">{{ student.gender || '—' }}</span>
              <span class="badge badge-gray">{{ formatDate(student.dob) }}</span>
              <span class="badge badge-purple">{{ student.classes?.class_name || 'No class' }}</span>
              <span v-if="student.is_scholarship" class="badge badge-green">Scholarship</span>
              <span v-if="student.is_disability" class="badge badge-yellow">Disability</span>
            </div>
          </div>
          <div style="text-align:right;font-size:12px;color:var(--text-muted);">
            <div>ID: {{ student.real_id || '—' }}</div>
            <div>{{ student.academic_years?.year_name || '' }}</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <div class="tab-item" :class="{ active: activeTab === 'health' }" @click="activeTab = 'health'">❤️ Health</div>
        <div class="tab-item" :class="{ active: activeTab === 'checkups' }" @click="activeTab = 'checkups'">🏥 Checkups</div>
        <div class="tab-item" :class="{ active: activeTab === 'growth' }" @click="activeTab = 'growth'">📏 Growth</div>
        <div class="tab-item" :class="{ active: activeTab === 'vaccinations' }" @click="activeTab = 'vaccinations'">💉 Vaccinations</div>
        <div class="tab-item" :class="{ active: activeTab === 'sickdays' }" @click="activeTab = 'sickdays'">🤒 Sick Days</div>
      </div>

      <!-- Health profile -->
      <div v-if="activeTab === 'health'" class="card">
        <div class="card-header"><span class="card-title">Health Profile</span><button class="btn btn-primary btn-sm" @click="saveHealth" :disabled="saving">{{ saving ? 'Saving…' : '💾 Save' }}</button></div>
        <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div class="form-group">
            <label class="form-label">Blood Type</label>
            <select class="form-select" v-model="healthForm.blood_type">
              <option value="">— Select —</option>
              <option v-for="t in ['A+','A-','B+','B-','AB+','AB-','O+','O-']" :key="t">{{ t }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Vaccination Complete</label>
            <select class="form-select" v-model="healthForm.vaccination_complete">
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Allergies</label>
            <textarea class="form-textarea" v-model="healthForm.allergies" rows="2" placeholder="e.g. Peanuts, Penicillin…"></textarea>
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Medical Conditions</label>
            <textarea class="form-textarea" v-model="healthForm.medical_conditions" rows="2" placeholder="Known conditions…"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Emergency Contact Name</label>
            <input class="form-input" v-model="healthForm.emergency_contact_name" />
          </div>
          <div class="form-group">
            <label class="form-label">Emergency Contact Phone</label>
            <input class="form-input" v-model="healthForm.emergency_contact_phone" />
          </div>
        </div>
      </div>

      <!-- Checkups -->
      <div v-if="activeTab === 'checkups'">
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
          <button class="btn btn-primary btn-sm" @click="openCheckup()">+ Add Checkup</button>
        </div>
        <div class="card">
          <div v-if="checkups.length === 0" class="empty-state"><div class="empty-state-icon">🏥</div><p class="empty-state-title">No checkups recorded</p></div>
          <div v-else class="table-wrapper">
            <table>
              <thead><tr><th>Date</th><th>Type</th><th>Result</th><th>Vision</th><th>Hearing</th><th>Dental</th><th>Notes</th><th></th></tr></thead>
              <tbody>
                <tr v-for="c in checkups" :key="c.id">
                  <td>{{ formatDate(c.date) }}</td>
                  <td>{{ c.type || '—' }}</td>
                  <td>{{ c.result || '—' }}</td>
                  <td>{{ c.vision || '—' }}</td>
                  <td>{{ c.hearing || '—' }}</td>
                  <td>{{ c.dental || '—' }}</td>
                  <td>{{ c.notes || '—' }}</td>
                  <td><button class="btn btn-ghost btn-sm btn-icon" @click="openCheckup(c)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Growth -->
      <div v-if="activeTab === 'growth'">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 class="card-title">Growth Tracking</h3>
          <button class="btn btn-primary btn-sm" @click="openGrowth()">+ Add Record</button>
        </div>

        <!-- Summary Cards -->
        <div v-if="latestGrowth" class="grid-cols-3" style="margin-bottom:20px; gap:16px;">
          <div class="stat-card">
            <div class="stat-icon" style="background:#eff6ff;color:#3b82f6;">📏</div>
            <div class="stat-info">
              <div class="stat-label">Latest Height</div>
              <div class="stat-value">{{ latestGrowth.height }} <span style="font-size:14px;font-weight:500;">cm</span></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#ecfdf5;color:#10b981;">⚖️</div>
            <div class="stat-info">
              <div class="stat-label">Latest Weight</div>
              <div class="stat-value">{{ latestGrowth.weight }} <span style="font-size:14px;font-weight:500;">kg</span></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#fff7ed;color:#f97316;">📅</div>
            <div class="stat-info">
              <div class="stat-label">Last Check</div>
              <div class="stat-value" style="font-size:18px;margin-top:8px;">{{ formatDate(latestGrowth.date) }}</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div v-if="growth.length === 0" class="empty-state"><div class="empty-state-icon">📏</div><p class="empty-state-title">No growth records</p></div>
          <div v-else class="table-wrapper">
            <table>
              <thead><tr><th>Date</th><th>Age</th><th>Height (cm)</th><th>Weight (kg)</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="g in growthHistory" :key="g.id">
                  <td>{{ formatDate(g.date) }}</td>
                  <td>{{ g.age || '—' }}</td>
                  <td>
                    <div style="font-weight:600;display:flex;align-items:center;gap:8px;">
                      {{ g.height }}
                      <span v-if="g.heightDelta" :style="{ color: g.heightDelta > 0 ? '#10b981' : '#ef4444', fontSize: '11px' }">
                        ({{ g.heightDelta > 0 ? '+' : '' }}{{ g.heightDelta }})
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style="font-weight:600;display:flex;align-items:center;gap:8px;">
                      {{ g.weight }}
                      <span v-if="g.weightDelta" :style="{ color: g.weightDelta > 0 ? '#10b981' : '#ef4444', fontSize: '11px' }">
                        ({{ g.weightDelta > 0 ? '+' : '' }}{{ g.weightDelta }})
                      </span>
                    </div>
                  </td>
                  <td><button class="btn btn-ghost btn-sm btn-icon" @click="openGrowth(g)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Vaccinations -->
      <div v-if="activeTab === 'vaccinations'">
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
          <button class="btn btn-primary btn-sm" @click="openVaccine()">+ Add Vaccine</button>
        </div>
        <div class="card">
          <div v-if="vaccinations.length === 0" class="empty-state"><div class="empty-state-icon">💉</div><p class="empty-state-title">No vaccinations recorded</p></div>
          <div v-else class="table-wrapper">
            <table>
              <thead><tr><th>Vaccine</th><th>Description</th><th>Date</th><th>Status</th><th></th></tr></thead>
              <tbody>
                <tr v-for="v in vaccinations" :key="v.id">
                  <td style="font-weight:600;">{{ v.name }}</td>
                  <td>{{ v.description || '—' }}</td>
                  <td>{{ formatDate(v.date) }}</td>
                  <td><span class="badge" :class="v.completed ? 'badge-green' : 'badge-yellow'">{{ v.completed ? '✅ Completed' : '⏳ Pending' }}</span></td>
                  <td><button class="btn btn-ghost btn-sm btn-icon" @click="openVaccine(v)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Sick Days -->
      <div v-if="activeTab === 'sickdays'">
        <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
          <button class="btn btn-primary btn-sm" @click="openSickDay()">+ Add Sick Day</button>
        </div>
        <div class="card">
          <div v-if="sickDays.length === 0" class="empty-state"><div class="empty-state-icon">🤒</div><p class="empty-state-title">No sick days recorded</p></div>
          <div v-else class="table-wrapper">
            <table>
              <thead><tr><th>Date</th><th>Reason</th><th>Duration (days)</th><th>Notes</th><th></th></tr></thead>
              <tbody>
                <tr v-for="s in sickDays" :key="s.id">
                  <td>{{ formatDate(s.date) }}</td>
                  <td>{{ s.reason || '—' }}</td>
                  <td><span class="badge badge-red">{{ s.duration || 1 }} day{{ s.duration > 1 ? 's' : '' }}</span></td>
                  <td>{{ s.notes || '—' }}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-ghost btn-sm btn-icon" @click="openSickDay(s)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      <button class="btn btn-danger btn-sm btn-icon" @click="deleteSickDay(s.id)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Modals -->
    <div v-if="showCheckupModal" class="modal-overlay" @click.self="showCheckupModal=false">
      <div class="modal modal-lg">
        <div class="modal-header"><span class="modal-title">{{ checkupForm.id ? 'Edit' : 'Add' }} Checkup</span><button class="btn btn-ghost btn-sm btn-icon" @click="showCheckupModal=false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
        <div class="modal-body" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div class="form-group"><label class="form-label">Date</label><input class="form-input" type="date" v-model="checkupForm.date"/></div>
          <div class="form-group"><label class="form-label">Type</label><input class="form-input" v-model="checkupForm.type" placeholder="e.g. Annual, Dental"/></div>
          <div class="form-group"><label class="form-label">Result</label><input class="form-input" v-model="checkupForm.result"/></div>
          <div class="form-group"><label class="form-label">Vision</label><input class="form-input" v-model="checkupForm.vision" placeholder="e.g. 20/20"/></div>
          <div class="form-group"><label class="form-label">Hearing</label><input class="form-input" v-model="checkupForm.hearing"/></div>
          <div class="form-group"><label class="form-label">Dental</label><input class="form-input" v-model="checkupForm.dental"/></div>
          <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Notes</label><textarea class="form-textarea" v-model="checkupForm.notes" rows="2"></textarea></div>
        </div>
        <div class="modal-footer"><button class="btn btn-ghost" @click="showCheckupModal=false">Cancel</button><button class="btn btn-primary" @click="saveCheckup" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button></div>
      </div>
    </div>

    <div v-if="showGrowthModal" class="modal-overlay" @click.self="showGrowthModal=false">
      <div class="modal" style="max-width:420px;">
        <div class="modal-header"><span class="modal-title">{{ growthForm.id ? 'Edit' : 'Add' }} Growth Record</span><button class="btn btn-ghost btn-sm btn-icon" @click="showGrowthModal=false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
        <div class="modal-body" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Date</label><input class="form-input" type="date" v-model="growthForm.date"/></div>
          <div class="form-group"><label class="form-label">Age</label><input class="form-input" type="number" v-model="growthForm.age"/></div>
          <div class="form-group"><label class="form-label">Height (cm)</label><input class="form-input" type="number" step="0.1" v-model="growthForm.height"/></div>
          <div class="form-group"><label class="form-label">Weight (kg)</label><input class="form-input" type="number" step="0.1" v-model="growthForm.weight"/></div>
        </div>
        <div class="modal-footer"><button class="btn btn-ghost" @click="showGrowthModal=false">Cancel</button><button class="btn btn-primary" @click="saveGrowth" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button></div>
      </div>
    </div>

    <div v-if="showVaccineModal" class="modal-overlay" @click.self="showVaccineModal=false">
      <div class="modal" style="max-width:420px;">
        <div class="modal-header"><span class="modal-title">{{ vaccineForm.id ? 'Edit' : 'Add' }} Vaccination</span><button class="btn btn-ghost btn-sm btn-icon" @click="showVaccineModal=false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group"><label class="form-label">Vaccine Name *</label><input class="form-input" v-model="vaccineForm.name" placeholder="e.g. Hepatitis B"/></div>
          <div class="form-group"><label class="form-label">Description</label><input class="form-input" v-model="vaccineForm.description"/></div>
          <div class="form-group"><label class="form-label">Date</label><input class="form-input" type="date" v-model="vaccineForm.date"/></div>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;"><input type="checkbox" v-model="vaccineForm.completed" style="width:15px;height:15px;"/> Completed</label>
        </div>
        <div class="modal-footer"><button class="btn btn-ghost" @click="showVaccineModal=false">Cancel</button><button class="btn btn-primary" @click="saveVaccine" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button></div>
      </div>
    </div>
    <div v-if="showSickDayModal" class="modal-overlay" @click.self="showSickDayModal=false">
      <div class="modal" style="max-width:420px;">
        <div class="modal-header"><span class="modal-title">{{ sickDayForm.id ? 'Edit' : 'Add' }} Sick Day</span><button class="btn btn-ghost btn-sm btn-icon" @click="showSickDayModal=false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group"><label class="form-label">Date</label><input class="form-input" type="date" v-model="sickDayForm.date"/></div>
          <div class="form-group"><label class="form-label">Reason *</label><input class="form-input" v-model="sickDayForm.reason" placeholder="e.g. Flu, Stomach ache"/></div>
          <div class="form-group"><label class="form-label">Duration (days)</label><input class="form-input" type="number" v-model="sickDayForm.duration"/></div>
          <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" v-model="sickDayForm.notes" rows="2"></textarea></div>
        </div>
        <div class="modal-footer"><button class="btn btn-ghost" @click="showSickDayModal=false">Cancel</button><button class="btn btn-primary" @click="saveSickDay" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button></div>
      </div>
    </div>
  </div>
</template>
