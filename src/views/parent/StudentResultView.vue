<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/formatDate'
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const studentId = route.params.id
const student = ref(null)
const loading = ref(true)
const attendance = ref({ present: 0, absent: 0, late: 0, permission: 0 })
const scores = ref([])
const growth = ref(null)

onMounted(loadData)

async function loadData() {
  loading.value = true
  try {
    // 1. Fetch Student Info
    const { data: stu } = await supabase
      .from('students')
      .select('*, classes(class_name)')
      .eq('id', studentId)
      .single()
    student.value = stu

    // 2. Fetch Attendance Summary
    const { data: att } = await supabase
      .from('student_attendances')
      .select('status')
      .eq('student_id', studentId)
    
    if (att) {
      attendance.value = att.reduce((acc, curr) => {
        acc[curr.status]++
        return acc
      }, { present: 0, absent: 0, late: 0, permission: 0 })
    }

    // 3. Fetch Recent Scores
    const { data: sc } = await supabase
      .from('scores')
      .select('*, subjects(subject_name)')
      .eq('student_id', studentId)
      .order('month', { ascending: false })
      .limit(10)
    scores.value = sc || []

    // 4. Fetch Latest Growth
    const { data: grow } = await supabase
      .from('student_growth')
      .select('*')
      .eq('student_id', studentId)
      .order('check_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    growth.value = grow

  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="student-result-view">
    <div v-if="loading" class="skeleton" style="height:400px; border-radius:24px;"></div>
    
    <div v-else-if="!student" class="empty-state">
      <QuestionMarkCircleIcon class="w-12 h-12 text-gray-400" />
      <p class="empty-state-title">រកមិនឃើញព័ត៌មានសិស្សទេ (Student details not found)</p>
      <router-link to="/parent" class="btn btn-primary mt-4">Go Back</router-link>
    </div>

    <div v-else class="result-content">
      <!-- Profile Header -->
      <div class="profile-card card">
        <div class="profile-header">
          <div class="avatar-large">{{ student.full_name.charAt(0) }}</div>
          <div>
            <h1 class="student-name">{{ student.full_name }}</h1>
            <div class="student-meta">
              <span class="badge badge-blue">ថ្នាក់: {{ student.classes?.class_name }}</span>
              <span>ភេទ: {{ student.gender === 'M' ? 'ប្រុស' : 'ស្រី' }}</span>
              <span>ថ្ងៃកំណើត: {{ formatDate(student.dob) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <!-- Attendance Stats -->
        <div class="card stats-card">
          <h3 class="card-title">វត្តមាន (Attendance)</h3>
          <div class="attendance-summary">
            <div class="att-item present">
              <span class="att-count">{{ attendance.present }}</span>
              <span class="att-label">វត្តមាន</span>
            </div>
            <div class="att-item absent">
              <span class="att-count">{{ attendance.absent }}</span>
              <span class="att-label">អវត្តមាន</span>
            </div>
            <div class="att-item permission">
              <span class="att-count">{{ attendance.permission }}</span>
              <span class="att-label">ច្បាប់</span>
            </div>
          </div>
        </div>

        <!-- Health/Growth -->
        <div class="card stats-card">
          <h3 class="card-title">សុខភាព & ការលូតលាស់ (Health)</h3>
          <div v-if="growth" class="growth-info">
            <div class="growth-item">
              <span class="growth-label">កម្ពស់ (Height)</span>
              <span class="growth-value">{{ growth.height_cm }} cm</span>
            </div>
            <div class="growth-item">
              <span class="growth-label">ទម្ងន់ (Weight)</span>
              <span class="growth-value">{{ growth.weight_kg }} kg</span>
            </div>
            <p class="last-check">កាលបរិច្ឆេទពិនិត្យ: {{ formatDate(growth.check_date) }}</p>
          </div>
          <p v-else class="empty-text">មិនទាន់មានទិន្នន័យ (No data)</p>
        </div>
      </div>

      <!-- Score Table -->
      <div class="card score-card">
        <h3 class="card-title">លទ្ធផលសិក្សាចុងក្រោយ (Recent Scores)</h3>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>មុខវិជ្ជា (Subject)</th>
                <th>ខែ/ឆមាស (Period)</th>
                <th>ពិន្ទុ (Score)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in scores" :key="s.id">
                <td style="font-weight:700;">{{ s.subjects?.subject_name }}</td>
                <td>{{ s.score_type === 'monthly' ? `ខែទី ${s.month}` : `ឆមាសទី ${s.semester}` }}</td>
                <td :class="{ 'text-danger': s.score < 50 }">
                  <span class="score-badge">{{ s.score }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.student-result-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-card {
  padding: 32px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #3b82f6 100%);
  color: white;
  border: none;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-large {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 800;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.student-name {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 8px;
}

.student-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  opacity: 0.9;
  align-items: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.attendance-summary {
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
}

.att-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.att-count {
  font-size: 24px;
  font-weight: 800;
}

.att-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.att-item.present { color: #16a34a; }
.att-item.absent { color: #dc2626; }
.att-item.permission { color: #2563eb; }

.growth-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.growth-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-default);
}

.growth-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.growth-value {
  font-weight: 700;
}

.last-check {
  font-size: 11px;
  color: var(--text-muted);
  text-align: right;
}

.score-badge {
  background: var(--bg-secondary);
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 800;
}

.text-danger { color: #dc2626; }

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .profile-header { flex-direction: column; text-align: center; }
  .student-meta { justify-content: center; flex-wrap: wrap; }
}
</style>
