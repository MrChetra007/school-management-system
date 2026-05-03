<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { formatDate, toInputDate } from '@/utils/formatDate'
import { CheckIcon, XCircleIcon, ExclamationTriangleIcon, TrashIcon, CubeIcon } from '@heroicons/vue/24/outline'

const items = ref([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const deleteTarget = ref(null)
const toast = ref(null)
const search = ref('')
const filterCategory = ref('')

const emptyForm = () => ({
  id: null, name: '', category: '', quantity: 0, min_stock: 0,
  location: '', condition: '', description: '', notes: '', last_updated: ''
})
const form = ref(emptyForm())

const categories = computed(() => [...new Set(items.value.map(i => i.category).filter(Boolean))])

const filtered = computed(() => {
  let list = items.value
  if (filterCategory.value) list = list.filter(i => i.category === filterCategory.value)
  const q = search.value.toLowerCase()
  if (q) list = list.filter(i => i.name.toLowerCase().includes(q))
  return list
})

const lowStockCount = computed(() => items.value.filter(i => i.quantity <= i.min_stock).length)

onMounted(load)

async function load() {
  loading.value = true
  const { data } = await supabase.from('inventory_items').select('*').order('name')
  items.value = data || []
  loading.value = false
}

function openAdd() { isEdit.value = false; form.value = emptyForm(); showModal.value = true }
function openEdit(i) {
  isEdit.value = true
  form.value = { ...i, last_updated: toInputDate(i.last_updated) }
  showModal.value = true
}

async function save() {
  if (!form.value.name.trim()) { showToast('Name is required', 'error'); return }
  saving.value = true
  const { id, ...payload } = form.value
  payload.last_updated = new Date().toISOString().split('T')[0]
  const { error } = isEdit.value
    ? await supabase.from('inventory_items').update(payload).eq('id', id)
    : await supabase.from('inventory_items').insert(payload)
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast(isEdit.value ? 'Item updated!' : 'Item added!', 'success')
  showModal.value = false; load()
}

async function doDelete() {
  const { error } = await supabase.from('inventory_items').delete().eq('id', deleteTarget.value.id)
  deleteTarget.value = null
  if (error) { showToast(error.message, 'error'); return }
  showToast('Item deleted', 'success'); load()
}

function showToast(msg, type = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3000)
}

function stockStatus(item) {
  if (item.quantity === 0) return { label: 'Out of stock', cls: 'badge-red' }
  if (item.quantity <= item.min_stock) return { label: 'Low stock', cls: 'badge-yellow' }
  return { label: 'In stock', cls: 'badge-green' }
}
</script>

<template>
  <div>
    <div class="toast-container">
      <div v-if="toast" class="toast" :class="`toast-${toast.type}`"><CheckIcon v-if="toast.type === 'success'" class="w-4 h-4" /><XCircleIcon v-else class="w-4 h-4" /> {{ toast.msg }}</div>
    </div>

    <div class="page-header">
      <div>
        <h1 class="page-title">Inventory</h1>
        <p class="page-subtitle">{{ items.length }} items tracked<span v-if="lowStockCount > 0" style="color:#f59e0b;margin-left:8px;"><ExclamationTriangleIcon class="w-4 h-4 inline" /> {{ lowStockCount }} low stock</span></p>
      </div>
      <button class="btn btn-primary" @click="openAdd">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Item
      </button>
    </div>

    <!-- Alert banner for low stock -->
    <div v-if="lowStockCount > 0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;font-size:13px;color:#92400e;">
      <ExclamationTriangleIcon class="w-4 h-4" /> <strong>{{ lowStockCount }} item(s)</strong> are at or below minimum stock level and need restocking.
    </div>

    <div class="filters-bar">
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="form-input" v-model="search" placeholder="Search items…" />
      </div>
      <select class="form-select" v-model="filterCategory" style="width:180px;">
        <option value="">All Categories</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>

    <div class="card">
      <div v-if="loading" class="card-body">
        <div v-for="i in 5" :key="i" class="skeleton" style="height:48px;margin-bottom:10px;border-radius:8px;"></div>
      </div>
      <div v-else-if="filtered.length === 0" class="empty-state">
        <div class="empty-state-icon"><CubeIcon class="w-12 h-12 text-gray-400" /></div>
        <p class="empty-state-title">No items found</p>
        <button class="btn btn-primary" @click="openAdd">Add Item</button>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead><tr><th>Item Name</th><th>Category</th><th>Quantity</th><th>Min Stock</th><th>Location</th><th>Condition</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="item in filtered" :key="item.id">
              <td>
                <div style="font-weight:600;font-size:13px;">{{ item.name }}</div>
                <div v-if="item.description" style="font-size:11px;color:var(--text-muted);">{{ item.description }}</div>
              </td>
              <td><span v-if="item.category" class="badge badge-blue">{{ item.category }}</span><span v-else>—</span></td>
              <td style="font-weight:700;font-size:15px;">{{ item.quantity }}</td>
              <td style="color:var(--text-muted);">{{ item.min_stock }}</td>
              <td style="font-size:13px;">{{ item.location || '—' }}</td>
              <td style="font-size:13px;">{{ item.condition || '—' }}</td>
              <td><span class="badge" :class="stockStatus(item).cls">{{ stockStatus(item).label }}</span></td>
              <td>
                <div class="table-actions">
                  <button class="btn btn-ghost btn-sm btn-icon" @click="openEdit(item)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="btn btn-danger btn-sm btn-icon" @click="deleteTarget = item">
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
          <span class="modal-title">{{ isEdit ? 'Edit Item' : 'Add Item' }}</span>
          <button class="btn btn-ghost btn-sm btn-icon" @click="showModal = false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="modal-body" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Item Name *</label>
            <input class="form-input" v-model="form.name" placeholder="e.g. Whiteboard Marker" />
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <input class="form-input" v-model="form.category" placeholder="e.g. Stationery" list="cat-list" />
            <datalist id="cat-list">
              <option v-for="c in categories" :key="c" :value="c" />
            </datalist>
          </div>
          <div class="form-group">
            <label class="form-label">Condition</label>
            <select class="form-select" v-model="form.condition">
              <option value="">— Select —</option>
              <option>Good</option><option>Fair</option><option>Poor</option><option>Damaged</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity</label>
            <input class="form-input" type="number" v-model="form.quantity" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Minimum Stock Alert</label>
            <input class="form-input" type="number" v-model="form.min_stock" min="0" />
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Location</label>
            <input class="form-input" v-model="form.location" placeholder="e.g. Storage Room A, Shelf 2" />
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Description / Notes</label>
            <textarea class="form-textarea" v-model="form.description" rows="2" placeholder="Optional details"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Item' }}</button>
        </div>
      </div>
    </div>

    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal" style="max-width:360px;">
        <div class="modal-body" style="text-align:center;padding:28px 24px;">
          <div><TrashIcon class="w-10 h-10 text-red-500" /></div>
          <h3 style="margin-bottom:8px;">Delete Item?</h3>
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
