<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAcademicYearStore } from '@/stores/academicYear'
import { formatDate, toInputDate } from '@/utils/formatDate'

const yearStore = useAcademicYearStore()
const transactions = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const deleteTarget = ref(null)
const toast = ref(null)
const filterType = ref('')

const emptyForm = () => ({ id: null, type: 'income', date: '', description: '', category: '', amount: '', note: '', academic_year_id: yearStore.selectedYearId })
const form = ref(emptyForm())

const filtered = computed(() => {
  let list = transactions.value
  if (filterType.value) list = list.filter(t => t.type === filterType.value)
  return list
})

const totalIncome = computed(() => filtered.value.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0))
const totalExpense = computed(() => filtered.value.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0))
const balance = computed(() => totalIncome.value - totalExpense.value)

onMounted(async () => { await load() })

async function load() {
  loading.value = true
  const { data } = await supabase
    .from('budget_transactions')
    .select('*, academic_years(year_name)')
    .eq('academic_year_id', yearStore.selectedYearId)
    .order('date', { ascending: false })
  transactions.value = data || []
  loading.value = false
}
function openAdd() { isEdit.value = false; form.value = emptyForm(); showModal.value = true }
function openEdit(t) { isEdit.value = true; form.value = { ...t, date: toInputDate(t.date) }; showModal.value = true }
async function save() {
  if (!form.value.date || !form.value.amount) { showToast('Date and amount are required', 'error'); return }
  saving.value = true
  const { id, academic_years: _y, ...payload } = form.value
  const { error } = isEdit.value
    ? await supabase.from('budget_transactions').update(payload).eq('id', id)
    : await supabase.from('budget_transactions').insert(payload)
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast(isEdit.value ? 'Transaction updated!' : 'Transaction added!', 'success')
  showModal.value = false; load()
}
async function doDelete() {
  const { error } = await supabase.from('budget_transactions').delete().eq('id', deleteTarget.value.id)
  deleteTarget.value = null
  if (error) { showToast(error.message, 'error'); return }
  showToast('Transaction deleted', 'success'); load()
}
function showToast(msg, type = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3000)
}
function fmt(n) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
</script>

<template>
  <div>
    <div class="toast-container">
      <div v-if="toast" class="toast" :class="`toast-${toast.type}`">{{ toast.type === 'success' ? '✅' : '❌' }} {{ toast.msg }}</div>
    </div>
    <div class="page-header">
      <div><h1 class="page-title">Budget</h1><p class="page-subtitle">Income and expense tracking</p></div>
      <button class="btn btn-primary" @click="openAdd">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Transaction
      </button>
    </div>

    <!-- Summary cards -->
    <div class="grid-cols-3" style="margin-bottom:20px;">
      <div class="stat-card">
        <div class="stat-icon" style="background:#d1fae5;">💰</div>
        <div class="stat-info">
          <div class="stat-label">Total Income</div>
          <div class="stat-value" style="color:#059669;font-size:20px;">${{ fmt(totalIncome) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fee2e2;">💸</div>
        <div class="stat-info">
          <div class="stat-label">Total Expenses</div>
          <div class="stat-value" style="color:#dc2626;font-size:20px;">${{ fmt(totalExpense) }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" :style="`background:${balance >= 0 ? '#dbeafe' : '#fee2e2'}`">⚖️</div>
        <div class="stat-info">
          <div class="stat-label">Balance</div>
          <div class="stat-value" :style="`color:${balance >= 0 ? '#1d4ed8' : '#dc2626'};font-size:20px;`">${{ fmt(balance) }}</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <select class="form-select" v-model="filterType" style="width:160px;">
        <option value="">All Types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
    </div>

    <div class="card">
      <div v-if="loading" class="card-body">
        <div v-for="i in 5" :key="i" class="skeleton" style="height:44px;margin-bottom:10px;border-radius:8px;"></div>
      </div>
      <div v-else-if="filtered.length === 0" class="empty-state">
        <div class="empty-state-icon">💳</div>
        <p class="empty-state-title">No transactions found</p>
        <button class="btn btn-primary" @click="openAdd">Add Transaction</button>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Category</th><th>Amount</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="t in filtered" :key="t.id">
              <td>{{ formatDate(t.date) }}</td>
              <td><span class="badge" :class="t.type === 'income' ? 'badge-green' : 'badge-red'">{{ t.type === 'income' ? '📈 Income' : '📉 Expense' }}</span></td>
              <td style="font-size:13px;">{{ t.description || '—' }}</td>
              <td><span v-if="t.category" class="badge badge-gray">{{ t.category }}</span><span v-else>—</span></td>
              <td style="font-weight:700;" :style="`color:${t.type === 'income' ? '#059669' : '#dc2626'}`">
                {{ t.type === 'income' ? '+' : '-' }}${{ fmt(t.amount) }}
              </td>
              <td>
                <div class="table-actions">
                  <button class="btn btn-ghost btn-sm btn-icon" @click="openEdit(t)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="btn btn-danger btn-sm btn-icon" @click="deleteTarget = t">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <span class="modal-title">{{ isEdit ? 'Edit Transaction' : 'Add Transaction' }}</span>
          <button class="btn btn-ghost btn-sm btn-icon" @click="showModal = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="modal-body" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-select" v-model="form.type">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date *</label>
            <input class="form-input" type="date" v-model="form.date" />
          </div>
          <div class="form-group">
            <label class="form-label">Amount *</label>
            <input class="form-input" type="number" v-model="form.amount" placeholder="0.00" min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <input class="form-input" v-model="form.category" placeholder="e.g. Supplies, Salary…" />
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Description</label>
            <input class="form-input" v-model="form.description" placeholder="Brief description" />
          </div>
          <div class="form-group">
            <label class="form-label">Note</label>
            <input class="form-input" v-model="form.note" placeholder="Optional note" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Transaction' }}</button>
        </div>
      </div>
    </div>

    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal" style="max-width:360px;">
        <div class="modal-body" style="text-align:center;padding:28px 24px;">
          <div style="font-size:40px;margin-bottom:12px;">🗑️</div>
          <h3 style="margin-bottom:8px;">Delete Transaction?</h3>
          <p style="color:var(--text-secondary);font-size:13px;">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="deleteTarget = null">Cancel</button>
          <button class="btn btn-danger" @click="doDelete">Yes, Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
