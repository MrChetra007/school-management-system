<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { formatDate, toInputDate } from '@/utils/formatDate'
import { CheckIcon, XCircleIcon, BookOpenIcon, CheckCircleIcon, ExclamationTriangleIcon, ClipboardDocumentListIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/vue/24/outline'

const books = ref([])
const borrows = ref([])
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const showBookModal = ref(false)
const isEdit = ref(false)
const deleteTarget = ref(null)
const toast = ref(null)
const activeTab = ref('books')

// Borrow modal
const showBorrowModal = ref(false)
const borrowForm = ref({ book_id: '', student_id: '', borrow_date: '', due_date: '', status: 'borrowed' })
const studentSearch = ref('')
const students = ref([])
const studentResults = ref([])

const emptyBook = () => ({ id: null, title: '', author: '', isbn: '', category: '', total_copies: 1, available_copies: 1 })
const bookForm = ref(emptyBook())

const filteredBooks = computed(() => {
  const q = search.value.toLowerCase()
  return books.value.filter(b => b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q) || (b.isbn || '').includes(q))
})

onMounted(async () => { await Promise.all([loadBooks(), loadBorrows(), loadStudents()]) })

async function loadBooks() {
  loading.value = true
  const { data } = await supabase.from('books').select('*').order('title')
  books.value = data || []
  loading.value = false
}
async function loadBorrows() {
  const { data } = await supabase.from('book_borrows').select('*, books(title), students(full_name)').order('borrow_date', { ascending: false })
  borrows.value = data || []
}
async function loadStudents() {
  const { data } = await supabase.from('students').select('id, full_name').order('full_name')
  students.value = data || []
}

function searchStudents() {
  const q = studentSearch.value.toLowerCase()
  studentResults.value = q.length > 1 ? students.value.filter(s => s.full_name.toLowerCase().includes(q)).slice(0, 8) : []
}

function selectStudent(s) {
  borrowForm.value.student_id = s.id
  studentSearch.value = s.full_name
  studentResults.value = []
}

function openAddBook() { isEdit.value = false; bookForm.value = emptyBook(); showBookModal.value = true }
function openEditBook(b) { isEdit.value = true; bookForm.value = { ...b }; showBookModal.value = true }

async function saveBook() {
  if (!bookForm.value.title.trim()) { showToast('Title is required', 'error'); return }
  saving.value = true
  const { id, ...payload } = bookForm.value
  const { error } = isEdit.value
    ? await supabase.from('books').update(payload).eq('id', id)
    : await supabase.from('books').insert(payload)
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast(isEdit.value ? 'Book updated!' : 'Book added!', 'success')
  showBookModal.value = false; loadBooks()
}

async function doDeleteBook() {
  const { error } = await supabase.from('books').delete().eq('id', deleteTarget.value.id)
  deleteTarget.value = null
  if (error) { showToast(error.message, 'error'); return }
  showToast('Book deleted', 'success'); loadBooks()
}

function openBorrow() {
  borrowForm.value = { book_id: '', student_id: '', borrow_date: new Date().toISOString().split('T')[0], due_date: '', status: 'borrowed' }
  studentSearch.value = ''
  showBorrowModal.value = true
}

async function saveBorrow() {
  if (!borrowForm.value.book_id || !borrowForm.value.student_id || !borrowForm.value.due_date) {
    showToast('Book, student, and due date are required', 'error'); return
  }
  saving.value = true
  const { error } = await supabase.from('book_borrows').insert(borrowForm.value)
  // decrement available_copies
  if (!error) {
    const book = books.value.find(b => b.id == borrowForm.value.book_id)
    if (book && book.available_copies > 0) {
      await supabase.from('books').update({ available_copies: book.available_copies - 1 }).eq('id', book.id)
    }
  }
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast('Book issued!', 'success')
  showBorrowModal.value = false; loadBooks(); loadBorrows()
}

async function returnBook(borrow) {
  const { error } = await supabase.from('book_borrows').update({ status: 'returned', return_date: new Date().toISOString().split('T')[0] }).eq('id', borrow.id)
  if (!error) {
    const book = books.value.find(b => b.id === borrow.book_id)
    if (book) await supabase.from('books').update({ available_copies: book.available_copies + 1 }).eq('id', book.id)
  }
  if (error) { showToast(error.message, 'error'); return }
  showToast('Book returned!', 'success'); loadBooks(); loadBorrows()
}

function showToast(msg, type = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3000)
}

function availBadge(b) {
  if (b.available_copies === 0) return 'badge-red'
  if (b.available_copies < b.total_copies) return 'badge-yellow'
  return 'badge-green'
}

const stats = computed(() => ({
  total: books.value.reduce((a, b) => a + b.total_copies, 0),
  available: books.value.reduce((a, b) => a + b.available_copies, 0),
  borrowed: borrows.value.filter(b => b.status === 'borrowed').length,
  overdue: borrows.value.filter(b => b.status === 'overdue').length,
}))
</script>

<template>
  <div>
    <div class="toast-container">
      <div v-if="toast" class="toast" :class="`toast-${toast.type}`"><CheckIcon v-if="toast.type === 'success'" class="w-4 h-4" /><XCircleIcon v-else class="w-4 h-4" /> {{ toast.msg }}</div>
    </div>

    <div class="page-header">
      <div><h1 class="page-title">Library</h1><p class="page-subtitle">Books and borrowing management</p></div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-secondary" @click="openBorrow"><ArrowUpTrayIcon class="w-4 h-4" /> Issue Book</button>
        <button class="btn btn-primary" @click="openAddBook">+ Add Book</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid-cols-4" style="margin-bottom:20px;">
      <div class="stat-card"><div class="stat-icon" style="background:#dbeafe;"><BookOpenIcon class="w-6 h-6" /></div><div class="stat-info"><div class="stat-label">Total Copies</div><div class="stat-value">{{ stats.total }}</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#d1fae5;"><CheckCircleIcon class="w-6 h-6" /></div><div class="stat-info"><div class="stat-label">Available</div><div class="stat-value" style="color:#059669;">{{ stats.available }}</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fef3c7;"><BookOpenIcon class="w-6 h-6" /></div><div class="stat-info"><div class="stat-label">Borrowed</div><div class="stat-value">{{ stats.borrowed }}</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fee2e2;"><ExclamationTriangleIcon class="w-6 h-6" /></div><div class="stat-info"><div class="stat-label">Overdue</div><div class="stat-value" style="color:#dc2626;">{{ stats.overdue }}</div></div></div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <div class="tab-item" :class="{ active: activeTab === 'books' }" @click="activeTab = 'books'"><BookOpenIcon class="w-4 h-4" /> Books</div>
      <div class="tab-item" :class="{ active: activeTab === 'borrows' }" @click="activeTab = 'borrows'"><ClipboardDocumentListIcon class="w-4 h-4" /> Borrow Records</div>
    </div>

    <!-- Books table -->
    <div v-if="activeTab === 'books'">
      <div class="filters-bar">
        <div class="search-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="form-input" v-model="search" placeholder="Search by title, author, ISBN…" />
        </div>
      </div>
      <div class="card">
        <div v-if="loading" class="card-body"><div v-for="i in 5" :key="i" class="skeleton" style="height:44px;margin-bottom:10px;border-radius:8px;"></div></div>
        <div v-else-if="filteredBooks.length === 0" class="empty-state"><div class="empty-state-icon"><BookOpenIcon class="w-12 h-12 text-gray-400" /></div><p class="empty-state-title">No books found</p><button class="btn btn-primary" @click="openAddBook">Add Book</button></div>
        <div v-else class="table-wrapper">
          <table>
            <thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th>Total</th><th>Available</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-for="b in filteredBooks" :key="b.id">
                <td style="font-weight:600;">{{ b.title }}</td>
                <td>{{ b.author || '—' }}</td>
                <td style="font-size:12px;color:var(--text-muted);">{{ b.isbn || '—' }}</td>
                <td><span v-if="b.category" class="badge badge-blue">{{ b.category }}</span><span v-else>—</span></td>
                <td>{{ b.total_copies }}</td>
                <td><span class="badge" :class="availBadge(b)">{{ b.available_copies }}</span></td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-ghost btn-sm btn-icon" @click="openEditBook(b)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button class="btn btn-danger btn-sm btn-icon" @click="deleteTarget = b"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Borrows table -->
    <div v-if="activeTab === 'borrows'" class="card">
      <div v-if="borrows.length === 0" class="empty-state"><div class="empty-state-icon"><ClipboardDocumentListIcon class="w-12 h-12 text-gray-400" /></div><p class="empty-state-title">No borrow records</p></div>
      <div v-else class="table-wrapper">
        <table>
          <thead><tr><th>Book</th><th>Student</th><th>Borrow Date</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="b in borrows" :key="b.id">
              <td style="font-weight:600;">{{ b.books?.title }}</td>
              <td>{{ b.students?.full_name }}</td>
              <td>{{ formatDate(b.borrow_date) }}</td>
              <td>{{ formatDate(b.due_date) }}</td>
              <td>
                <span class="badge" :class="b.status === 'returned' ? 'badge-green' : b.status === 'overdue' ? 'badge-red' : 'badge-yellow'">
                  {{ b.status }}
                </span>
              </td>
              <td>
                <button v-if="b.status === 'borrowed' || b.status === 'overdue'" class="btn btn-success btn-sm" @click="returnBook(b)">Return</button>
                <span v-else class="badge badge-green"><CheckIcon class="w-4 h-4" /></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Book Modal -->
    <div v-if="showBookModal" class="modal-overlay" @click.self="showBookModal=false">
      <div class="modal">
        <div class="modal-header"><span class="modal-title">{{ isEdit ? 'Edit Book' : 'Add Book' }}</span><button class="btn btn-ghost btn-sm btn-icon" @click="showBookModal=false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
        <div class="modal-body" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Title *</label><input class="form-input" v-model="bookForm.title"/></div>
          <div class="form-group"><label class="form-label">Author</label><input class="form-input" v-model="bookForm.author"/></div>
          <div class="form-group"><label class="form-label">ISBN</label><input class="form-input" v-model="bookForm.isbn"/></div>
          <div class="form-group"><label class="form-label">Category</label><input class="form-input" v-model="bookForm.category"/></div>
          <div class="form-group"><label class="form-label">Total Copies</label><input class="form-input" type="number" v-model="bookForm.total_copies" min="1"/></div>
          <div class="form-group"><label class="form-label">Available Copies</label><input class="form-input" type="number" v-model="bookForm.available_copies" min="0"/></div>
        </div>
        <div class="modal-footer"><button class="btn btn-ghost" @click="showBookModal=false">Cancel</button><button class="btn btn-primary" @click="saveBook" :disabled="saving">{{ saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Book' }}</button></div>
      </div>
    </div>

    <!-- Borrow Modal -->
    <div v-if="showBorrowModal" class="modal-overlay" @click.self="showBorrowModal=false">
      <div class="modal">
        <div class="modal-header"><span class="modal-title">Issue Book</span><button class="btn btn-ghost btn-sm btn-icon" @click="showBorrowModal=false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group">
            <label class="form-label">Book *</label>
            <select class="form-select" v-model="borrowForm.book_id">
              <option value="">— Select book —</option>
              <option v-for="b in books.filter(b => b.available_copies > 0)" :key="b.id" :value="b.id">{{ b.title }} ({{ b.available_copies }} avail.)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Student *</label>
            <input class="form-input" v-model="studentSearch" @input="searchStudents" placeholder="Type student name…"/>
            <div v-if="studentResults.length > 0" style="border:1px solid var(--border-default);border-radius:8px;margin-top:4px;background:white;box-shadow:var(--shadow-md);overflow:hidden;">
              <div v-for="s in studentResults" :key="s.id" style="padding:8px 12px;cursor:pointer;font-size:13px;" @click="selectStudent(s)" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">{{ s.full_name }}</div>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Borrow Date</label><input class="form-input" type="date" v-model="borrowForm.borrow_date"/></div>
          <div class="form-group"><label class="form-label">Due Date *</label><input class="form-input" type="date" v-model="borrowForm.due_date"/></div>
        </div>
        <div class="modal-footer"><button class="btn btn-ghost" @click="showBorrowModal=false">Cancel</button><button class="btn btn-primary" @click="saveBorrow" :disabled="saving">{{ saving ? 'Saving…' : 'Issue Book' }}</button></div>
      </div>
    </div>

    <!-- Delete confirm -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget=null">
      <div class="modal" style="max-width:360px;">
        <div class="modal-body" style="text-align:center;padding:28px 24px;"><div><TrashIcon class="w-10 h-10 text-red-500" /></div><h3 style="margin-bottom:8px;">Delete Book?</h3><p style="color:var(--text-secondary);font-size:13px;">Delete <strong>{{ deleteTarget.title }}</strong>?</p></div>
        <div class="modal-footer"><button class="btn btn-ghost" @click="deleteTarget=null">Cancel</button><button class="btn btn-danger" @click="doDeleteBook">Yes, Delete</button></div>
      </div>
    </div>
  </div>
</template>
