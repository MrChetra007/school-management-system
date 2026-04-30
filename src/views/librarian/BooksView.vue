<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const books = ref([])
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const showModal = ref(false)
const isEdit = ref(false)
const deleteTarget = ref(null)
const toast = ref(null)

const emptyForm = () => ({ id: null, title: '', author: '', isbn: '', category: '', total_copies: 1, available_copies: 1 })
const form = ref(emptyForm())

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return books.value.filter(b => 
    b.title.toLowerCase().includes(q) || 
    (b.author || '').toLowerCase().includes(q) ||
    (b.isbn || '').includes(q)
  )
})

onMounted(load)

async function load() {
  loading.value = true
  const { data } = await supabase.from('books').select('*').order('title')
  books.value = data || []
  loading.value = false
}

function openAdd() {
  isEdit.value = false
  form.value = emptyForm()
  showModal.value = true
}

function openEdit(b) {
  isEdit.value = true
  form.value = { ...b }
  showModal.value = true
}

async function save() {
  if (!form.value.title.trim()) { showToast('Title is required', 'error'); return }
  saving.value = true
  const { id, ...payload } = form.value
  const { error } = isEdit.value
    ? await supabase.from('books').update(payload).eq('id', id)
    : await supabase.from('books').insert(payload)
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast(isEdit.value ? 'Book updated!' : 'Book added!', 'success')
  showModal.value = false
  load()
}

async function doDelete() {
  const { error } = await supabase.from('books').delete().eq('id', deleteTarget.value.id)
  deleteTarget.value = null
  if (error) { showToast(error.message, 'error'); return }
  showToast('Book deleted', 'success')
  load()
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
      <div>
        <h1 class="page-title">Manage Books</h1>
        <p class="page-subtitle">Add, edit, or remove books from the library</p>
      </div>
      <button class="btn btn-primary" @click="openAdd">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Book
      </button>
    </div>

    <div class="filters-bar">
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="form-input" v-model="search" placeholder="Search by title, author, or ISBN…" />
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="card-body">
        <div v-for="i in 5" :key="i" class="skeleton" style="height:52px;margin-bottom:10px;border-radius:8px;"></div>
      </div>
      <div v-else-if="filtered.length === 0" class="empty-state">
        <div class="empty-state-icon">📚</div>
        <p class="empty-state-title">No books found</p>
        <button class="btn btn-primary" @click="openAdd">Add First Book</button>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr><th>Title</th><th>Author</th><th>ISBN</th><th>Total</th><th>Available</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="b in filtered" :key="b.id">
              <td style="font-weight:600;">{{ b.title }}</td>
              <td>{{ b.author || '—' }}</td>
              <td style="font-size:12px;color:var(--text-muted);">{{ b.isbn || '—' }}</td>
              <td>{{ b.total_copies }}</td>
              <td><span class="badge" :class="b.available_copies > 0 ? 'badge-green' : 'badge-red'">{{ b.available_copies }}</span></td>
              <td>
                <div class="table-actions">
                  <button class="btn btn-ghost btn-sm btn-icon" @click="openEdit(b)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="btn btn-danger btn-sm btn-icon" @click="deleteTarget = b">
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
          <span class="modal-title">{{ isEdit ? 'Edit Book' : 'Add Book' }}</span>
          <button class="btn btn-ghost btn-sm btn-icon" @click="showModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Title *</label>
            <input class="form-input" v-model="form.title" placeholder="Book Title" />
          </div>
          <div class="form-group">
            <label class="form-label">Author</label>
            <input class="form-input" v-model="form.author" placeholder="Author Name" />
          </div>
          <div class="form-group">
            <label class="form-label">ISBN</label>
            <input class="form-input" v-model="form.isbn" placeholder="ISBN Number" />
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <input class="form-input" v-model="form.category" placeholder="e.g. Science, Literature" />
          </div>
          <div class="form-group">
            <label class="form-label">Total Copies</label>
            <input class="form-input" type="number" v-model="form.total_copies" min="1" />
          </div>
          <div class="form-group">
            <label class="form-label">Available Copies</label>
            <input class="form-input" type="number" v-model="form.available_copies" min="0" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal" style="max-width:360px;">
        <div class="modal-body" style="text-align:center;padding:28px 24px;">
          <div style="font-size:40px;margin-bottom:12px;">🗑️</div>
          <h3 style="margin-bottom:8px;">Delete Book?</h3>
          <p style="color:var(--text-secondary);font-size:13px;">Delete <strong>{{ deleteTarget.title }}</strong>? This will also remove its borrowing history.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="deleteTarget = null">Cancel</button>
          <button class="btn btn-danger" @click="doDelete">Yes, Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
