<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useAcademicYearStore } from '@/stores/academicYear'
import { toInputDate, formatDate } from '@/utils/formatDate'

const router = useRouter()
const auth = useAuthStore()
const yearStore = useAcademicYearStore()
const years = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const deleteTarget = ref(null)
const toast = ref(null)

const schoolInfo = ref({ name_khmer: 'សាលាបឋមសិក្សា ចំការមន', logo_url: null })

const emptyForm = () => ({ id: null, year_name: '', start_date: '', end_date: '', status: 'active' })
const form = ref(emptyForm())

async function loadSchoolInfo() {
  const { data } = await supabase.from('school_information').select('*').limit(1).single()
  if (data) schoolInfo.value = data
}

async function enterYear(y) {
  yearStore.setYear(y.id, y.year_name)
  router.push('/admin/dashboard')
}

async function handleLogout() {
  await auth.logout()
  yearStore.clearYear()
  router.push('/login')
}

onMounted(async () => {
  await Promise.all([load(), loadSchoolInfo()])
})

async function load() {
  loading.value = true
  const { data } = await supabase.from('academic_years').select('*').order('start_date', { ascending: false })
  years.value = data || []
  loading.value = false
}

function openAdd() { isEdit.value = false; form.value = emptyForm(); showModal.value = true }
function openEdit(y) { isEdit.value = true; form.value = { ...y, start_date: toInputDate(y.start_date), end_date: toInputDate(y.end_date) }; showModal.value = true }

async function save() {
  if (!form.value.year_name.trim() || !form.value.start_date || !form.value.end_date) {
    showToast('Name, start date, and end date are required', 'error'); return
  }
  saving.value = true
  const { id, ...payload } = form.value
  const { error } = isEdit.value
    ? await supabase.from('academic_years').update(payload).eq('id', id)
    : await supabase.from('academic_years').insert(payload)
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast(isEdit.value ? 'Year updated!' : 'Year added!', 'success')
  showModal.value = false; load()
}

async function doDelete() {
  const { error } = await supabase.from('academic_years').delete().eq('id', deleteTarget.value.id)
  deleteTarget.value = null
  if (error) { showToast(error.message, 'error'); return }
  showToast('Year deleted', 'success'); load()
}

function showToast(msg, type = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3000)
}
</script>

<template>
  <div class="standalone-page">
    <div class="toast-container">
      <div v-if="toast" class="toast" :class="`toast-${toast.type}`">{{ toast.type === 'success' ? '✅' : '❌' }} {{ toast.msg }}</div>
    </div>

    <!-- Standalone Header -->
    <header class="standalone-header">
      <div class="header-content">
        <div class="school-brand">
          <div class="school-logo">🏫</div>
          <h1 class="school-name">{{ schoolInfo.name_khmer }}</h1>
        </div>
        <button class="btn btn-ghost logout-btn" @click="handleLogout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          ចាកចេញ
        </button>
      </div>
    </header>

    <main class="standalone-main">
      <div class="content-wrapper">
        <div class="selection-header">
          <h2 class="selection-title">សូមជ្រើសរើសឆ្នាំសិក្សា</h2>
          <p class="selection-subtitle">Select an academic year to manage school data</p>
          <button class="btn btn-primary add-btn" @click="openAdd">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            បន្ថែមឆ្នាំសិក្សា
          </button>
        </div>

        <div v-if="loading" class="year-grid">
          <div v-for="i in 3" :key="i" class="skeleton year-card-skeleton"></div>
        </div>

        <div v-else-if="years.length === 0" class="empty-state">
          <div class="empty-state-icon">📅</div>
          <p class="empty-state-title">មិនទាន់មានឆ្នាំសិក្សានៅឡើយទេ</p>
          <button class="btn btn-primary" @click="openAdd">បង្កើតឆ្នាំសិក្សាដំបូង</button>
        </div>

        <div v-else class="year-grid">
          <div v-for="y in years" :key="y.id" class="year-card" :class="{ 'active': y.id === yearStore.selectedYearId }">
            <div class="year-card-header">
              <span class="year-name">{{ y.year_name }}</span>
              <span class="badge" :class="y.status === 'active' ? 'badge-green' : 'badge-gray'">{{ y.status === 'active' ? 'កំពុងដំណើរការ' : 'បានបញ្ចប់' }}</span>
            </div>
            <div class="year-card-body">
              <div class="date-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>{{ formatDate(y.start_date) }} - {{ formatDate(y.end_date) }}</span>
              </div>
            </div>
            <div class="year-card-footer">
              <div class="card-actions">
                <button class="btn btn-ghost btn-sm btn-icon" @click="openEdit(y)" title="កែប្រែ">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-ghost btn-sm btn-icon btn-danger-hover" @click="deleteTarget = y" title="លុប">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </button>
              </div>
              <button class="btn btn-primary" @click="enterYear(y)">
                ចូលទៅកាន់ទិន្នន័យ
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">{{ isEdit ? 'កែប្រែឆ្នាំសិក្សា' : 'បន្ថែមឆ្នាំសិក្សា' }}</span>
          <button class="btn btn-ghost btn-sm btn-icon" @click="showModal = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group">
            <label class="form-label">ឈ្មោះឆ្នាំសិក្សា *</label>
            <input class="form-input" v-model="form.year_name" placeholder="e.g. ឆ្នាំសិក្សា 2024-2025" />
          </div>
          <div class="form-group">
            <label class="form-label">ថ្ងៃចាប់ផ្តើម *</label>
            <input class="form-input" type="date" v-model="form.start_date" />
          </div>
          <div class="form-group">
            <label class="form-label">ថ្ងៃបញ្ចប់ *</label>
            <input class="form-input" type="date" v-model="form.end_date" />
          </div>
          <div class="form-group">
            <label class="form-label">ស្ថានភាព</label>
            <select class="form-select" v-model="form.status">
              <option value="active">Active (កំពុងដំណើរការ)</option>
              <option value="inactive">Inactive (បានបញ្ចប់)</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showModal = false">បោះបង់</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? 'កំពុងរក្សាទុក…' : isEdit ? 'រក្សាទុក' : 'បន្ថែម' }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal" style="max-width:380px;">
        <div class="modal-body" style="text-align:center;padding:28px 24px;">
          <div style="font-size:40px;margin-bottom:12px;">🗑️</div>
          <h3 style="margin-bottom:8px;">លុបឆ្នាំសិក្សា?</h3>
          <p style="color:var(--text-secondary);font-size:13px;">តើអ្នកពិតជាចង់លុប <strong>{{ deleteTarget.year_name }}</strong> មែនទេ? រាល់ទិន្នន័យពាក់ព័ន្ធទាំងអស់នឹងត្រូវប៉ះពាល់។</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="deleteTarget = null">បោះបង់</button>
          <button class="btn btn-danger" @click="doDelete">បាទ លុប</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.standalone-page {
  min-height: 100vh;
  background-color: var(--bg-secondary);
  display: flex;
  flex-direction: column;
}

.standalone-header {
  background-color: white;
  border-bottom: 1px solid var(--border-default);
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.school-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.school-logo {
  font-size: 24px;
  background: var(--primary-50);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.school-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.logout-btn {
  color: var(--text-secondary);
  gap: 8px;
}

.standalone-main {
  flex: 1;
  padding: 48px 24px;
}

.content-wrapper {
  max-width: 1000px;
  margin: 0 auto;
}

.selection-header {
  text-align: center;
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.selection-title {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.selection-subtitle {
  color: var(--text-secondary);
  font-size: 15px;
  margin-bottom: 24px;
}

.year-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.year-card {
  background: white;
  border-radius: 16px;
  border: 1px solid var(--border-default);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.year-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.year-card.active {
  border-color: var(--primary-color);
  background: var(--primary-50);
}

.year-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.year-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.date-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.year-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.btn-danger-hover:hover {
  background: #fee2e2;
  color: #dc2626;
}

.year-card-skeleton {
  height: 200px;
}

@media (max-width: 640px) {
  .selection-title { font-size: 24px; }
  .year-grid { grid-template-columns: 1fr; }
  .header-content .school-name { display: none; }
}
</style>
