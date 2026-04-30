<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/formatDate'

const route = useRoute()
const router = useRouter()
const studentId = route.params.id
const student = ref(null)
const loading = ref(true)
const activeTab = ref('overview')

// Data for tabs
const attendance = ref([])
const scores = ref([])
const health = ref({ growth: [], vaccinations: [], sickDays: [] })

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  // 1. Student Info
  const { data: stu } = await supabase
    .from('students')
    .select('*, classes(class_name, academic_years(year_name))')
    .eq('id', studentId)
    .single()
  
  if (!stu) { router.push('/parent/search'); return }
  student.value = stu

  // 2. Attendance
  const { data: att } = await supabase.from('attendances').select('*').eq('student_id', studentId).order('date', { ascending: false })
  attendance.value = att || []

  // 3. Scores
  const { data: scr } = await supabase.from('scores').select('*, subjects(subject_name)').eq('student_id', studentId).order('month', { ascending: false })
  scores.value = scr || []

  // 4. Health
  const { data: gr } = await supabase.from('student_growth').select('*').eq('student_id', studentId).order('date', { ascending: false })
  const { data: vac } = await supabase.from('student_vaccinations').select('*').eq('student_id', studentId).order('date', { ascending: false })
  const { data: sick } = await supabase.from('student_sick_days').select('*').eq('student_id', studentId).order('date', { ascending: false })
  
  health.value = { growth: gr || [], vaccinations: vac || [], sickDays: sick || [] }
  
  loading.value = false
}

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
</script>

<template>
  <div>
    <div v-if="loading" class="card card-body">
      <div class="skeleton" style="height:200px; margin-bottom:20px;"></div>
      <div class="skeleton" style="height:400px;"></div>
    </div>

    <div v-else-if="student">
      <!-- Header / Overview -->
      <div class="card" style="margin-bottom:24px; padding:24px; border-bottom: 4px solid var(--primary-color);">
        <div style="display:flex; gap:24px; align-items:center;">
          <div class="avatar" style="width:80px; height:80px; font-size:24px;">{{ initials(student.full_name) }}</div>
          <div style="flex:1;">
            <h1 style="font-size:24px; font-weight:800; color:var(--text-primary);">{{ student.full_name }}</h1>
            <div style="display:flex; gap:12px; margin-top:8px; flex-wrap:wrap;">
              <span class="badge badge-blue">ID: {{ student.real_id || '—' }}</span>
              <span class="badge badge-gray">Class: {{ student.classes?.class_name }}</span>
              <span class="badge badge-gray">{{ student.classes?.academic_years?.year_name }}</span>
            </div>
          </div>
          <button class="btn btn-ghost" @click="router.push('/parent/search')">Back to Search</button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <div class="tab-item" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">📊 Overview</div>
        <div class="tab-item" :class="{ active: activeTab === 'attendance' }" @click="activeTab = 'attendance'">📅 Attendance</div>
        <div class="tab-item" :class="{ active: activeTab === 'scores' }" @click="activeTab = 'scores'">⭐ Scores</div>
        <div class="tab-item" :class="{ active: activeTab === 'health' }" @click="activeTab = 'health'">🩺 Health</div>
      </div>

      <!-- Tab Content -->
      <div class="card">
        
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="card-body">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:32px;">
            <div>
              <h3 style="font-size:16px; margin-bottom:16px; font-weight:700;">Student Information</h3>
              <div style="display:flex; flex-direction:column; gap:12px;">
                <div style="display:flex; justify-content:space-between; font-size:13px;">
                  <span style="color:var(--text-secondary);">Gender</span>
                  <span style="font-weight:600;">{{ student.gender }}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:13px;">
                  <span style="color:var(--text-secondary);">Date of Birth</span>
                  <span style="font-weight:600;">{{ formatDate(student.dob) }}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:13px;">
                  <span style="color:var(--text-secondary);">Address</span>
                  <span style="font-weight:600;">{{ student.address || '—' }}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 style="font-size:16px; margin-bottom:16px; font-weight:700;">Performance Summary</h3>
              <div class="grid-cols-2" style="gap:16px;">
                <div style="padding:16px; background:#f0fdf4; border-radius:12px; text-align:center;">
                  <div style="font-size:11px; color:#166534; font-weight:700; text-transform:uppercase;">Attendance</div>
                  <div style="font-size:24px; font-weight:800; color:#15803d; margin-top:4px;">98%</div>
                </div>
                <div style="padding:16px; background:#eff6ff; border-radius:12px; text-align:center;">
                  <div style="font-size:11px; color:#1e40af; font-weight:700; text-transform:uppercase;">Avg Grade</div>
                  <div style="font-size:24px; font-weight:800; color:#1d4ed8; margin-top:4px;">B+</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Attendance Tab -->
        <div v-if="activeTab === 'attendance'" class="table-wrapper">
          <table v-if="attendance.length > 0">
            <thead><tr><th>Date</th><th>Status</th><th>Reason</th></tr></thead>
            <tbody>
              <tr v-for="a in attendance" :key="a.id">
                <td>{{ formatDate(a.date) }}</td>
                <td><span class="badge" :class="a.status === 'present' ? 'badge-green' : 'badge-red'">{{ a.status }}</span></td>
                <td>{{ a.reason || '—' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">No attendance records found.</div>
        </div>

        <!-- Scores Tab -->
        <div v-if="activeTab === 'scores'" class="table-wrapper">
          <table v-if="scores.length > 0">
            <thead><tr><th>Subject</th><th>Type</th><th>Month/Sem</th><th>Score</th></tr></thead>
            <tbody>
              <tr v-for="s in scores" :key="s.id">
                <td style="font-weight:600;">{{ s.subjects?.subject_name }}</td>
                <td><span class="badge badge-gray">{{ s.score_type }}</span></td>
                <td>{{ s.score_type === 'monthly' ? s.month : 'Semester ' + s.semester }}</td>
                <td><span class="badge" :class="s.score >= 50 ? 'badge-green' : 'badge-red'">{{ s.score }}</span></td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">No scores recorded yet.</div>
        </div>

        <!-- Health Tab -->
        <div v-if="activeTab === 'health'" class="card-body">
          <div style="display:flex; flex-direction:column; gap:32px;">
            <!-- Growth -->
            <div>
              <h4 style="font-size:14px; font-weight:700; margin-bottom:12px;">📈 Growth Records</h4>
              <div class="table-wrapper" style="border:1px solid var(--border-default); border-radius:8px;">
                <table>
                  <thead><tr><th>Date</th><th>Height (cm)</th><th>Weight (kg)</th></tr></thead>
                  <tbody>
                    <tr v-for="g in health.growth" :key="g.id">
                      <td>{{ formatDate(g.date) }}</td>
                      <td>{{ g.height }}</td>
                      <td>{{ g.weight }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <!-- Sick Days -->
            <div>
              <h4 style="font-size:14px; font-weight:700; margin-bottom:12px;">🤒 Sick Days</h4>
              <div class="table-wrapper" style="border:1px solid var(--border-default); border-radius:8px;">
                <table>
                  <thead><tr><th>Date</th><th>Duration</th><th>Reason</th></tr></thead>
                  <tbody>
                    <tr v-for="s in health.sickDays" :key="s.id">
                      <td>{{ formatDate(s.date) }}</td>
                      <td>{{ s.duration }} days</td>
                      <td>{{ s.reason }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
