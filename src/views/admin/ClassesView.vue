<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { formatDate, toInputDate } from '@/utils/formatDate'

const classes = ref([])
const teachers = ref([])
const academicYears = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const deleteTarget = ref(null)
const toast = ref(null)
const search = ref('')

const emptyForm = () => ({ id: null, class_name: '', teacher_id: '', academic_year_id: '', turn: 'morning' })
const form = ref(emptyForm())

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return classes.value.filter(c => c.class_name.toLowerCase().includes(q))
})

onMounted(async () => {
  await Promise.all([loadClasses(), loadTeachers(), loadYears()])
})

async function loadClasses() {
  loading.value = true
  const { data } = await supabase.from('classes').select('*, teachers(full_name), academic_years(year_name)').order('class_name')
  classes.value = data || []
  loading.value = false
}
async function loadTeachers() {
  const { data } = await supabase.from('teachers').select('id, full_name').order('full_name')
  teachers.value = data || []
}
async function loadYears() {
  const { data } = await supabase.from('academic_years').select('id, year_name').order('year_name', { ascending: false })
  academicYears.value = data || []
}

function openAdd() { isEdit.value = false; form.value = emptyForm(); showModal.value = true }
function openEdit(c) { isEdit.value = true; form.value = { ...c }; showModal.value = true }

async function save() {
  if (!form.value.class_name.trim()) { showToast('Class name is required', 'error'); return }
  saving.value = true
  const { id, teachers: _t, academic_years: _y, ...payload } = form.value
  const { error } = isEdit.value
    ? await supabase.from('classes').update(payload).eq('id', id)
    : await supabase.from('classes').insert(payload)
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast(isEdit.value ? 'Class updated!' : 'Class added!', 'success')
  showModal.value = false
  loadClasses()
}

async function doDelete() {
  const { error } = await supabase.from('classes').delete().eq('id', deleteTarget.value.id)
  deleteTarget.value = null
  if (error) { showToast(error.message, 'error'); return }
  showToast('Class deleted', 'success')
  loadClasses()
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
      <div><h1 class="page-title">Classes</h1><p class="page-subtitle">{{ classes.length }} active classes</p></div>
      <button class="btn btn-primary" @click="openAdd">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Class
      </button>
    </div>

    <div class="filters-bar">
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="form-input" v-model="search" placeholder="Search classes…" />
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="card-body">
        <div v-for="i in 5" :key="i" class="skeleton" style="height:44px;margin-bottom:10px;border-radius:8px;"></div>
      </div>
      <div v-else-if="filtered.length === 0" class="empty-state">
        <div class="empty-state-icon">🏫</div>
        <p class="empty-state-title">No classes yet</p>
        <button class="btn btn-primary" @click="openAdd">Add Class</button>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead><tr><th>Class Name</th><th>Teacher</th><th>Academic Year</th><th>Turn</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="c in filtered" :key="c.id">
              <td style="font-weight:600;">{{ c.class_name }}</td>
              <td>{{ c.teachers?.full_name || '—' }}</td>
              <td>{{ c.academic_years?.year_name || '—' }}</td>
              <td>
                <span class="badge" :class="c.turn === 'morning' ? 'badge-blue' : 'badge-yellow'">
                  {{ c.turn === 'morning' ? '🌅 Morning' : '🌇 Afternoon' }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button class="btn btn-ghost btn-sm btn-icon" @click="openEdit(c)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="btn btn-danger btn-sm btn-icon" @click="deleteTarget = c">
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
          <span class="modal-title">{{ isEdit ? 'Edit Class' : 'Add Class' }}</span>
          <button class="btn btn-ghost btn-sm btn-icon" @click="showModal = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group">
            <label class="form-label">Class Name *</label>
            <input class="form-input" v-model="form.class_name" placeholder="e.g. Grade 1A" />
          </div>
          <div class="form-group">
            <label class="form-label">Teacher</label>
            <select class="form-select" v-model="form.teacher_id">
              <option value="">— None —</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.full_name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Academic Year</label>
            <select class="form-select" v-model="form.academic_year_id">
              <option value="">— Select —</option>
              <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.year_name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Turn</label>
            <select class="form-select" v-model="form.turn">
              <option value="morning">🌅 Morning</option>
              <option value="afternoon">🌇 Afternoon</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Class' }}</button>
        </div>
      </div>
    </div>

    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal" style="max-width:360px;">
        <div class="modal-body" style="text-align:center;padding:28px 24px;">
          <div style="font-size:40px;margin-bottom:12px;">🗑️</div>
          <h3 style="margin-bottom:8px;">Delete Class?</h3>
          <p style="color:var(--text-secondary);font-size:13px;">Delete <strong>{{ deleteTarget.class_name }}</strong>?</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="deleteTarget = null">Cancel</button>
          <button class="btn btn-danger" @click="doDelete">Yes, Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
