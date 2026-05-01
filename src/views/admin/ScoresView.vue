<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAcademicYearStore } from '@/stores/academicYear'
import { formatDate } from '@/utils/formatDate'

const yearStore = useAcademicYearStore()

// State
const classes = ref([])
const subjects = ref([])
const students = ref([])
const scores = ref([])
const loading = ref(true)

// Filters
const selectedClassId = ref(null)
const scoreType = ref('monthly') // monthly, semester
const selectedMonth = ref(new Date().getMonth() + 1) // 1-12
const selectedSemester = ref(1) // 1, 2

const months = [
  { id: 1, name: 'មករា (January)' },
  { id: 2, name: 'កុម្ភៈ (February)' },
  { id: 3, name: 'មីនា (March)' },
  { id: 4, name: 'មេសា (April)' },
  { id: 5, name: 'ឧសភា (May)' },
  { id: 6, name: 'មិថុនា (June)' },
  { id: 7, name: 'កក្កដា (July)' },
  { id: 8, name: 'សីហា (August)' },
  { id: 9, name: 'កញ្ញា (September)' },
  { id: 10, name: 'តុលា (October)' },
  { id: 11, name: 'វិច្ឆិកា (November)' },
  { id: 12, name: 'ធ្នូ (December)' }
]

// Computed: Pivot scores into student rows
const studentScores = computed(() => {
  if (!students.value.length) return []

  return students.value.map((student, index) => {
    const row = {
      index: index + 1,
      id: student.id,
      name: student.full_name,
      scores: {}
    }

    let total = 0
    let count = 0

    subjects.value.forEach(sub => {
      const match = scores.value.find(s => s.student_id === student.id && s.subject_id === sub.id)
      const val = match ? parseFloat(match.score) : null
      row.scores[sub.id] = val
      
      if (val !== null) {
        total += val
        count++
      }
    })

    row.average = count > 0 ? (total / count).toFixed(2) : '—'
    return row
  })
})

onMounted(init)

async function init() {
  loading.value = true
  await Promise.all([fetchClasses(), fetchSubjects()])
  if (classes.value.length > 0) {
    selectedClassId.value = classes.value[0].id
    await fetchData()
  }
  loading.value = false
}

async function fetchClasses() {
  const { data } = await supabase
    .from('classes')
    .select('id, class_name')
    .eq('academic_year_id', yearStore.selectedYearId)
    .order('class_name')
  classes.value = data || []
}

async function fetchSubjects() {
  const { data } = await supabase
    .from('subjects')
    .select('*')
    .order('subject_name')
  subjects.value = data || []
}

async function fetchData() {
  if (!selectedClassId.value) return
  loading.value = true

  // Fetch students
  const { data: sData } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('class_id', selectedClassId.value)
    .order('full_name')
  students.value = sData || []

  // Fetch scores
  let query = supabase
    .from('scores')
    .select('*')
    .eq('academic_year_id', yearStore.selectedYearId)
    .eq('score_type', scoreType.value)

  if (scoreType.value === 'monthly') {
    query = query.eq('month', selectedMonth.value)
  } else {
    query = query.eq('semester_number', selectedSemester.value)
  }

  const { data: scoreData } = await query
  scores.value = scoreData || []
  
  loading.value = false
}

// Watch filters
watch([selectedClassId, scoreType, selectedMonth, selectedSemester], () => {
  fetchData()
})

function handlePrint() {
  window.print()
}
</script>

<template>
  <div class="scores-view">
    <div class="page-header no-print">
      <div>
        <h1 class="page-title">ពិន្ទុសិស្ស (Student Scores)</h1>
        <p class="page-subtitle">View and analyze student academic performance</p>
      </div>
      <button class="btn btn-primary" @click="handlePrint" :disabled="loading || !students.length">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        បោះពុម្ព (Print)
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="card filters-card no-print">
      <div class="card-body filter-grid">
        <div class="form-group">
          <label class="form-label">ជ្រើសរើសថ្នាក់ (Class)</label>
          <select class="form-select" v-model="selectedClassId">
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.class_name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">ប្រភេទពិន្ទុ (Score Type)</label>
          <select class="form-select" v-model="scoreType">
            <option value="monthly">ប្រចាំខែ (Monthly)</option>
            <option value="semester">ប្រចាំឆមាស (Semester)</option>
          </select>
        </div>

        <div v-if="scoreType === 'monthly'" class="form-group">
          <label class="form-label">ជ្រើសរើសខែ (Month)</label>
          <select class="form-select" v-model="selectedMonth">
            <option v-for="m in months" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
        </div>

        <div v-else class="form-group">
          <label class="form-label">ជ្រើសរើសឆមាស (Semester)</label>
          <select class="form-select" v-model="selectedSemester">
            <option :value="1">ឆមាសទី ១ (Semester 1)</option>
            <option :value="2">ឆមាសទី ២ (Semester 2)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Scores Table -->
    <div class="card main-table-card">
      <div class="card-header no-print">
        <div class="table-info">
          <span class="badge badge-blue">{{ students.length }} សិស្ស</span>
          <span class="badge badge-gray">{{ subjects.length }} មុខវិជ្ជា</span>
        </div>
      </div>

      <div v-if="loading" class="card-body">
        <div v-for="i in 5" :key="i" class="skeleton" style="height:40px; margin-bottom:12px; border-radius:8px;"></div>
      </div>

      <div v-else-if="!selectedClassId" class="empty-state">
        <div class="empty-state-icon">🏫</div>
        <p class="empty-state-title">សូមជ្រើសរើសថ្នាក់ដើម្បីមើលពិន្ទុ</p>
      </div>

      <div v-else-if="students.length === 0" class="empty-state">
        <div class="empty-state-icon">👥</div>
        <p class="empty-state-title">មិនមានសិស្សនៅក្នុងថ្នាក់នេះទេ</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="scores-table">
          <thead>
            <tr>
              <th width="50">ល.រ</th>
              <th>ឈ្មោះសិស្ស</th>
              <th v-for="sub in subjects" :key="sub.id" class="text-center">{{ sub.subject_name }}</th>
              <th class="text-center highlight-col">មធ្យមភាគ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in studentScores" :key="row.id">
              <td class="text-secondary">{{ row.index }}</td>
              <td class="font-bold">{{ row.name }}</td>
              <td v-for="sub in subjects" :key="sub.id" class="text-center">
                {{ row.scores[sub.id] !== null ? row.scores[sub.id] : '—' }}
              </td>
              <td class="text-center highlight-col font-bold" :class="{ 'text-danger': parseFloat(row.average) < 5 }">
                {{ row.average }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Print-only Report Header -->
    <div class="print-only report-header">
      <div class="report-title-kh">បញ្ជីពិន្ទុសិស្សប្រចាំ{{ scoreType === 'monthly' ? 'ខែ' : 'ឆមាស' }}</div>
      <div class="report-meta">
        <span>ថ្នាក់: {{ classes.find(c => c.id === selectedClassId)?.class_name }}</span>
        <span>ឆ្នាំសិក្សា: {{ yearStore.selectedYearName }}</span>
        <span>{{ scoreType === 'monthly' ? 'ខែ: ' + months.find(m => m.id === selectedMonth)?.name : 'ឆមាស: ' + selectedSemester }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scores-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.main-table-card {
  min-height: 400px;
}

.table-info {
  display: flex;
  gap: 8px;
}

.scores-table {
  width: 100%;
  border-collapse: collapse;
}

.scores-table th {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 12px 16px;
  border-bottom: 2px solid var(--border-default);
}

.scores-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-default);
  font-size: 14px;
}

.text-center { text-align: center; }
.font-bold { font-weight: 700; }
.text-danger { color: #dc2626; }

.highlight-col {
  background-color: var(--primary-50);
  color: var(--primary-color);
}

/* Print Styles */
@media print {
  .no-print { display: none !important; }
  .standalone-page, .main-content { padding: 0 !important; margin: 0 !important; background: white !important; }
  .card { border: none !important; box-shadow: none !important; }
  .table-wrapper { overflow: visible !important; }
  .scores-table { border: 1px solid #ddd; }
  .scores-table th, .scores-table td { border: 1px solid #ddd; padding: 8px; font-size: 11px; }
  .highlight-col { background: #f0f7ff !important; -webkit-print-color-adjust: exact; }
  
  .report-header {
    text-align: center;
    margin-bottom: 20px;
  }
  .report-title-kh {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  .report-meta {
    display: flex;
    justify-content: center;
    gap: 30px;
    font-size: 14px;
  }
}

.print-only { display: none; }
@media print { .print-only { display: block; } }
</style>
