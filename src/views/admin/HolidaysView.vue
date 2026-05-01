<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAcademicYearStore } from '@/stores/academicYear'
import { formatDate, toInputDate } from '@/utils/formatDate'

const yearStore = useAcademicYearStore()
const holidays = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const deleteTarget = ref(null)
const toast = ref(null)

const emptyForm = () => ({ id: null, name: '', start_date: '', end_date: '', academic_year_id: yearStore.selectedYearId })
const form = ref(emptyForm())

const filtered = computed(() => {
  return holidays.value
})

onMounted(async () => { await load() })

async function load() {
  loading.value = true
  const { data } = await supabase
    .from('school_holidays')
    .select('*, academic_years(year_name)')
    .eq('academic_year_id', yearStore.selectedYearId)
    .order('start_date', { ascending: false })
  holidays.value = data || []
  loading.value = false
}
function openAdd() { isEdit.value = false; form.value = emptyForm(); showModal.value = true }
function openEdit(h) {
  isEdit.value = true
  form.value = { ...h, start_date: toInputDate(h.start_date), end_date: toInputDate(h.end_date) }
  showModal.value = true
}
async function save() {
  if (!form.value.name.trim() || !form.value.start_date || !form.value.end_date) {
    showToast('Name, start date, and end date are required', 'error'); return
  }
  saving.value = true
  const { id, academic_years: _y, ...payload } = form.value
  const { error } = isEdit.value
    ? await supabase.from('school_holidays').update(payload).eq('id', id)
    : await supabase.from('school_holidays').insert(payload)
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast(isEdit.value ? 'Holiday updated!' : 'Holiday added!', 'success')
  showModal.value = false; load()
}
async function doDelete() {
  const { error } = await supabase.from('school_holidays').delete().eq('id', deleteTarget.value.id)
  deleteTarget.value = null
  if (error) { showToast(error.message, 'error'); return }
  showToast('Holiday deleted', 'success'); load()
}
function showToast(msg, type = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3000)
}
function dayCount(h) {
  const d = (new Date(h.end_date) - new Date(h.start_date)) / 86400000
  return Math.max(0, d + 1)
}
</script>

<template>
  <div>
    <div class="toast-container">
      <div v-if="toast" class="toast" :class="`toast-${toast.type}`">{{ toast.type === 'success' ? '✅' : '❌' }} {{ toast.msg }}</div>
    </div>
    <div class="page-header">
      <div><h1 class="page-title">School Holidays</h1><p class="page-subtitle">{{ holidays.length }} holidays defined</p></div>
      <button class="btn btn-primary" @click="openAdd">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Holiday
      </button>
    </div>

    <div class="filters-bar" style="display:none;"></div>

    <div class="card">
      <div v-if="loading" class="card-body">
        <div v-for="i in 4" :key="i" class="skeleton" style="height:44px;margin-bottom:10px;border-radius:8px;"></div>
      </div>
      <div v-else-if="filtered.length === 0" class="empty-state">
        <div class="empty-state-icon">🌴</div>
        <p class="empty-state-title">No holidays defined</p>
        <button class="btn btn-primary" @click="openAdd">Add Holiday</button>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead><tr><th>Holiday Name</th><th>Start Date</th><th>End Date</th><th>Duration</th><th>Academic Year</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="h in filtered" :key="h.id">
              <td style="font-weight:600;">🌴 {{ h.name }}</td>
              <td>{{ formatDate(h.start_date) }}</td>
              <td>{{ formatDate(h.end_date) }}</td>
              <td><span class="badge badge-blue">{{ dayCount(h) }} day{{ dayCount(h) !== 1 ? 's' : '' }}</span></td>
              <td><span class="badge badge-gray">{{ h.academic_years?.year_name || '—' }}</span></td>
              <td>
                <div class="table-actions">
                  <button class="btn btn-ghost btn-sm btn-icon" @click="openEdit(h)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="btn btn-danger btn-sm btn-icon" @click="deleteTarget = h">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">{{ isEdit ? 'Edit Holiday' : 'Add Holiday' }}</span>
          <button class="btn btn-ghost btn-sm btn-icon" @click="showModal = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group">
            <label class="form-label">Holiday Name *</label>
            <input class="form-input" v-model="form.name" placeholder="e.g. Khmer New Year" />
          </div>
          <div class="form-group">
            <label class="form-label">Start Date *</label>
            <input class="form-input" type="date" v-model="form.start_date" />
          </div>
          <div class="form-group">
            <label class="form-label">End Date *</label>
            <input class="form-input" type="date" v-model="form.end_date" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Holiday' }}</button>
        </div>
      </div>
    </div>

    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal" style="max-width:360px;">
        <div class="modal-body" style="text-align:center;padding:28px 24px;">
          <div style="font-size:40px;margin-bottom:12px;">🗑️</div>
          <h3 style="margin-bottom:8px;">Delete Holiday?</h3>
          <p style="color:var(--text-secondary);font-size:13px;">Delete <strong>{{ deleteTarget.name }}</strong>?</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="deleteTarget = null">Cancel</button>
          <button class="btn btn-danger" @click="doDelete">Yes, Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
