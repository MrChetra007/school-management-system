<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAcademicYearStore } from '@/stores/academicYear'
import { formatDate } from '@/utils/formatDate'

const yearStore = useAcademicYearStore()

// State
const teachers = ref([])
const attendances = ref([])
const holidays = ref([])
const loading = ref(true)

// Filters
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())

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

// Grid Logic
const daysInMonth = computed(() => {
  return new Date(selectedYear.value, selectedMonth.value, 0).getDate()
})

const daysArray = computed(() => {
  return Array.from({ length: daysInMonth.value }, (_, i) => i + 1)
})

const attendanceMatrix = computed(() => {
  if (!teachers.value.length) return []

  return teachers.value.map((teacher, idx) => {
    const row = {
      index: idx + 1,
      id: teacher.id,
      name: teacher.full_name,
      days: {},
      summary: { present: 0, absent: 0, late: 0, permission: 0 }
    }

    daysArray.value.forEach(day => {
      const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const match = attendances.value.find(a => a.teacher_id === teacher.id && a.date === dateStr)
      
      if (match) {
        row.days[day] = match.status
        row.summary[match.status]++
      } else {
        row.days[day] = null
      }
    })

    const totalTracked = row.summary.present + row.summary.absent + row.summary.late + row.summary.permission
    row.rate = totalTracked > 0 ? Math.round((row.summary.present / totalTracked) * 100) : 0
    
    return row
  })
})

onMounted(init)

async function init() {
  loading.value = true
  await Promise.all([loadTeachers(), fetchHolidays()])
  await fetchData()
  loading.value = false
}

async function loadTeachers() {
  const { data } = await supabase.from('teachers').select('id, full_name').order('full_name')
  teachers.value = data || []
}

async function fetchHolidays() {
  const { data } = await supabase
    .from('school_holidays')
    .select('*')
    .eq('academic_year_id', yearStore.selectedYearId)
  holidays.value = data || []
}

async function fetchData() {
  if (!teachers.value.length) return
  loading.value = true

  const startDate = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-01`
  const endDate = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${daysInMonth.value}`
  
  const { data: aData } = await supabase
    .from('teacher_attendances')
    .select('*')
    .in('teacher_id', teachers.value.map(t => t.id))
    .gte('date', startDate)
    .lte('date', endDate)
  
  attendances.value = aData || []
  loading.value = false
}

watch([selectedMonth, selectedYear], fetchData)

function isHoliday(day) {
  const dateStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const date = new Date(dateStr)
  if (date.getDay() === 0) return true // Sunday is holiday
  
  return holidays.value.some(h => {
    const start = new Date(h.start_date)
    const end = new Date(h.end_date)
    return date >= start && date <= end
  })
}

function getStatusChar(status) {
  const map = { present: 'មក', absent: 'អ', late: 'យ', permission: 'ច' }
  return map[status] || ''
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <div class="attendance-grid-view">
    <div class="page-header no-print">
      <div>
        <h1 class="page-title">អវត្តមានគ្រូបង្រៀន (Teacher Attendance)</h1>
        <p class="page-subtitle">Monthly tracking for school staff</p>
      </div>
      <button class="btn btn-primary" @click="handlePrint" :disabled="loading || !teachers.length">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        បោះពុម្ព (Print)
      </button>
    </div>

    <!-- Filters -->
    <div class="card filters-card no-print">
      <div class="card-body filter-grid">
        <div class="form-group">
          <label class="form-label">ជ្រើសរើសខែ (Month)</label>
          <select class="form-select" v-model="selectedMonth">
            <option v-for="m in months" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">ឆ្នាំ (Year)</label>
          <input type="number" class="form-input" v-model="selectedYear" />
        </div>
      </div>
    </div>

    <!-- Grid Legend -->
    <div class="legend no-print">
      <div class="legend-item"><span class="box present">មក</span> មក (Present)</div>
      <div class="legend-item"><span class="box absent">អ</span> អវត្តមាន (Absent)</div>
      <div class="legend-item"><span class="box late">យ</span> យឺត (Late)</div>
      <div class="legend-item"><span class="box permission">ច</span> ច្បាប់ (Permission)</div>
      <div class="legend-item"><span class="box holiday"></span> ថ្ងៃឈប់សម្រាក (Holiday/Sunday)</div>
    </div>

    <!-- Attendance Grid -->
    <div class="card main-table-card">
      <div v-if="loading" class="card-body">
        <div v-for="i in 5" :key="i" class="skeleton" style="height:40px; margin-bottom:12px; border-radius:8px;"></div>
      </div>

      <div v-else-if="teachers.length === 0" class="empty-state">
        <div class="empty-state-icon">👩‍🏫</div>
        <p class="empty-state-title">មិនទាន់មានគ្រូបង្រៀននៅក្នុងប្រព័ន្ធទេ</p>
      </div>

      <div v-else class="table-wrapper horizontal-scroll">
        <table class="grid-table">
          <thead>
            <tr>
              <th rowspan="2" class="sticky-col">ឈ្មោះគ្រូបង្រៀន</th>
              <th v-for="day in daysArray" :key="day" :class="{ 'holiday-head': isHoliday(day) }">{{ day }}</th>
              <th colspan="4" class="text-center summary-header">សរុប (Total)</th>
              <th rowspan="2" class="text-center">%</th>
            </tr>
            <tr>
              <th v-for="day in daysArray" :key="day" class="day-subhead" :class="{ 'holiday-head': isHoliday(day) }">
                {{ ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស'][new Date(selectedYear, selectedMonth-1, day).getDay()] }}
              </th>
              <th class="sum-col present">មក</th>
              <th class="sum-col absent">អ</th>
              <th class="sum-col late">យ</th>
              <th class="sum-col permission">ច</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in attendanceMatrix" :key="row.id">
              <td class="sticky-col font-khmer">{{ row.name }}</td>
              <td v-for="day in daysArray" :key="day" class="day-cell" :class="{ 'holiday': isHoliday(day) }">
                <span :class="row.days[day]">{{ getStatusChar(row.days[day]) }}</span>
              </td>
              <td class="text-center font-bold">{{ row.summary.present }}</td>
              <td class="text-center font-bold text-danger">{{ row.summary.absent }}</td>
              <td class="text-center font-bold text-warning">{{ row.summary.late }}</td>
              <td class="text-center font-bold text-info">{{ row.summary.permission }}</td>
              <td class="text-center font-bold" :class="{ 'text-danger': row.rate < 90 }">{{ row.rate }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Print Header -->
    <div class="print-only report-header">
      <div class="report-title">បញ្ជីវត្តមានគ្រូបង្រៀនប្រចាំខែ</div>
      <div class="report-meta">
        <span>សាលាបឋមសិក្សា: ចំការមន</span>
        <span>ខែ: {{ months.find(m => m.id === selectedMonth)?.name }} ឆ្នាំ {{ selectedYear }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.attendance-grid-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.legend {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding: 0 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.box {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.box.present { background: #dcfce7; color: #166534; }
.box.absent { background: #fee2e2; color: #991b1b; }
.box.late { background: #fef9c3; color: #854d0e; }
.box.permission { background: #dbeafe; color: #1e40af; }
.box.holiday { background: #f3f4f6; }

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
}

.grid-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.grid-table th, .grid-table td {
  border: 1px solid var(--border-default);
  padding: 8px 4px;
  text-align: center;
  min-width: 32px;
}

.grid-table th {
  background: var(--bg-secondary);
  font-weight: 700;
}

.day-subhead {
  font-size: 10px;
  color: var(--text-secondary);
}

.sticky-col {
  position: sticky;
  left: 0;
  background: white;
  z-index: 10;
  min-width: 180px !important;
  text-align: left !important;
  padding-left: 16px !important;
  box-shadow: 2px 0 5px rgba(0,0,0,0.05);
}

tr:hover td.sticky-col {
  background: var(--bg-secondary);
}

.day-cell {
  padding: 0 !important;
}

.day-cell span {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
}

.present { background: #dcfce7; color: #166534; }
.absent { background: #fee2e2; color: #991b1b; }
.late { background: #fef9c3; color: #854d0e; }
.permission { background: #dbeafe; color: #1e40af; }
.holiday, .holiday-head { background: #f3f4f6 !important; }

.font-khmer { font-family: 'Hanuman', serif; font-weight: 600; }
.text-danger { color: #dc2626; }
.text-warning { color: #d97706; }
.text-info { color: #2563eb; }
.font-bold { font-weight: 700; }

.summary-header { background: #f8fafc !important; }
.sum-col { font-size: 11px; }

/* Print Styles */
@media print {
  .no-print { display: none !important; }
  .attendance-grid-view { padding: 0 !important; margin: 0 !important; }
  .card { border: none !important; box-shadow: none !important; }
  .grid-table { font-size: 9px; }
  .grid-table th, .grid-table td { padding: 2px !important; border: 1px solid #000; }
  .sticky-col { position: static !important; min-width: 120px !important; }
  .present { background: #e8f5e9 !important; -webkit-print-color-adjust: exact; }
  .absent { background: #ffebee !important; -webkit-print-color-adjust: exact; }
  .holiday, .holiday-head { background: #eee !important; -webkit-print-color-adjust: exact; }
  
  .report-header { text-align: center; margin-bottom: 20px; }
  .report-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
  .report-meta { display: flex; justify-content: center; gap: 20px; font-size: 12px; }
}

.print-only { display: none; }
@media print { .print-only { display: block; } }
</style>
