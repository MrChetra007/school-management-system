<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAcademicYearStore } from '@/stores/academicYear'
import { toInputDate, formatDate } from '@/utils/formatDate'

const router = useRouter()
const yearStore = useAcademicYearStore()
const years = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const deleteTarget = ref(null)
const toast = ref(null)

const emptyForm = () => ({ id: null, year_name: '', start_date: '', end_date: '', status: 'active' })
const form = ref(emptyForm())

async function enterYear(y) {
  yearStore.setYear(y.id, y.year_name)
  router.push('/admin/dashboard')
}

onMounted(load)

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
  <div>
    <div class="toast-container">
      <div v-if="toast" class="toast" :class="`toast-${toast.type}`">{{ toast.type === 'success' ? '✅' : '❌' }} {{ toast.msg }}</div>
    </div>
    <div class="page-header">
      <div><h1 class="page-title">Academic Years</h1><p class="page-subtitle">Manage school year periods</p></div>
      <button class="btn btn-primary" @click="openAdd">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Year
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="card-body">
        <div v-for="i in 3" :key="i" class="skeleton" style="height:44px;margin-bottom:10px;border-radius:8px;"></div>
      </div>
      <div v-else-if="years.length === 0" class="empty-state">
        <div class="empty-state-icon">📅</div>
        <p class="empty-state-title">No academic years yet</p>
        <button class="btn btn-primary" @click="openAdd">Add Year</button>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead><tr><th>Year Name</th><th>Start Date</th><th>End Date</th><th>Status</th><th style="text-align:right;">Actions</th></tr></thead>
          <tbody>
            <tr v-for="y in years" :key="y.id">
              <td style="font-weight:600;">{{ y.year_name }}</td>
              <td>{{ formatDate(y.start_date) }}</td>
              <td>{{ formatDate(y.end_date) }}</td>
              <td><span class="badge" :class="y.status === 'active' ? 'badge-green' : 'badge-gray'">{{ y.status }}</span></td>
              <td>
                <div class="table-actions" style="justify-content:flex-end;">
                  <button class="btn btn-primary btn-sm" @click="enterYear(y)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    មើល
                  </button>
                  <button class="btn btn-ghost btn-sm btn-icon" @click="openEdit(y)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="btn btn-danger btn-sm btn-icon" @click="deleteTarget = y">
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
          <span class="modal-title">{{ isEdit ? 'Edit Academic Year' : 'Add Academic Year' }}</span>
          <button class="btn btn-ghost btn-sm btn-icon" @click="showModal = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group">
            <label class="form-label">Year Name *</label>
            <input class="form-input" v-model="form.year_name" placeholder="e.g. 2024-2025" />
          </div>
          <div class="form-group">
            <label class="form-label">Start Date *</label>
            <input class="form-input" type="date" v-model="form.start_date" />
          </div>
          <div class="form-group">
            <label class="form-label">End Date *</label>
            <input class="form-input" type="date" v-model="form.end_date" />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" v-model="form.status">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Year' }}</button>
        </div>
      </div>
    </div>

    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal" style="max-width:360px;">
        <div class="modal-body" style="text-align:center;padding:28px 24px;">
          <div style="font-size:40px;margin-bottom:12px;">🗑️</div>
          <h3 style="margin-bottom:8px;">Delete Year?</h3>
          <p style="color:var(--text-secondary);font-size:13px;">Delete <strong>{{ deleteTarget.year_name }}</strong>? All related data (classes, students, scores) will be affected.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="deleteTarget = null">Cancel</button>
          <button class="btn btn-danger" @click="doDelete">Yes, Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
