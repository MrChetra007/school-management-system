<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/formatDate'
import { CheckIcon, ExclamationCircleIcon, ClockIcon, DocumentTextIcon, SunIcon, MoonIcon, BuildingOfficeIcon, UserGroupIcon, CheckCircleIcon, CalendarIcon, PencilSquareIcon, ChartBarIcon, AcademicCapIcon } from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const classInfo = ref(null)
const studentsCount = ref(0)
const attendanceToday = ref({ present: 0, total: 0 })
const recentScores = ref([])
const loading = ref(true)

const myAttendanceToday = ref(null)
const checkingIn = ref(false)

onMounted(async () => {
  if (auth.teacherProfile) {
    await Promise.all([loadData(), loadCheckInStatus()])
  } else {
    // Wait for auth to init if needed
    setTimeout(async () => {
      if (auth.teacherProfile) await Promise.all([loadData(), loadCheckInStatus()])
      else loading.value = false
    }, 1000)
  }
})

async function loadCheckInStatus() {
  if (!auth.teacherProfile) return
  const teacherId = auth.teacherProfile.id
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('teacher_attendances')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('date', today)
    .maybeSingle()
  myAttendanceToday.value = data
}

async function handleCheckIn() {
  checkingIn.value = true
  const { data, error } = await supabase.rpc('teacher_check_in')
  checkingIn.value = false
  if (error) {
    alert(error.message)
  } else {
    // RPC returns {status, check_in_time, turn, threshold}
    myAttendanceToday.value = data
  }
}

async function loadData() {
  loading.value = true
  const teacherId = auth.teacherProfile.id
  console.log('TeacherDashboard: Loading data for teacherId:', teacherId)
  
  // 1. Get Class Info (Filter by active academic year to avoid multiple rows)
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('*, academic_years!inner(year_name, status)')
    .eq('teacher_id', teacherId)
    .eq('academic_years.status', 'active')
    .maybeSingle()
  
  if (classError) {
    console.error('TeacherDashboard: Error fetching class:', classError)
  }

  if (classData) {
    console.log('TeacherDashboard: Class found:', classData)
    classInfo.value = classData
    
    // 2. Get Student Count
    const { count } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classData.id)
    studentsCount.value = count || 0

    // 3. Attendance Today
    const today = new Date().toISOString().split('T')[0]
    const { data: attData } = await supabase
      .from('attendances')
      .select('status, student_id, students!inner(class_id)')
      .eq('date', today)
      .eq('students.class_id', classData.id)
    
    if (attData) {
      attendanceToday.value.total = studentsCount.value
      attendanceToday.value.present = attData.filter(a => a.status === 'present').length
    }

    // 4. Recent Scores
    const { data: scoreData } = await supabase
      .from('scores')
      .select('*, students!inner(full_name, class_id), subjects(subject_name)')
      .eq('students.class_id', classData.id)
      .order('created_at', { ascending: false })
      .limit(5)
    recentScores.value = scoreData || []
  }

  loading.value = false
}

const attendancePercent = computed(() => {
  if (attendanceToday.value.total === 0) return 0
  return Math.round((attendanceToday.value.present / attendanceToday.value.total) * 100)
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Teacher Dashboard</h1>
        <p class="page-subtitle" v-if="classInfo">Welcome back! Managing <strong>{{ classInfo.class_name }}</strong> ({{ classInfo.academic_years?.year_name }})</p>
        <p class="page-subtitle" v-else>Welcome back! You are not assigned to any class yet.</p>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <!-- Check-in Status -->
        <div v-if="myAttendanceToday" class="badge" :class="myAttendanceToday.status === 'present' ? 'badge-green' : 'badge-yellow'" style="padding:10px 16px; flex-direction:column; align-items:flex-start; gap:2px; height:auto;">
          <div style="font-weight:700;"><template v-if="myAttendanceToday.status === 'present'"><CheckIcon class="w-4 h-4" /> មានវត្តមាន</template><template v-else><ExclamationCircleIcon class="w-4 h-4" /> យឺត</template></div>
          <div style="font-size:11px; opacity:0.8;">
            <ClockIcon class="w-3 h-3" /> {{ new Date(myAttendanceToday.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            <span v-if="myAttendanceToday.note" title="Admin Note"> <DocumentTextIcon class="w-3 h-3" /></span>
          </div>
        </div>
        <!-- Check-in Button -->
        <button v-else class="btn btn-primary" style="padding:10px 24px; font-weight:bold; box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);" @click="handleCheckIn" :disabled="checkingIn">
          {{ checkingIn ? 'កំពុងបញ្ចូល...' : 'ចូលធ្វើការ (Check-in)' }}
        </button>

        <div v-if="classInfo" class="badge badge-blue" style="padding:10px 16px;">
          <template v-if="classInfo.turn === 'morning'"><SunIcon class="w-4 h-4" /> វេនព្រឹក</template><template v-else><MoonIcon class="w-4 h-4" /> វេនល្ងាច</template>
        </div>
      </div>
    </div>

    <div v-if="loading" class="card card-body">
      <div class="skeleton" style="height:100px; margin-bottom:20px;"></div>
      <div class="grid-cols-3" style="gap:20px;">
        <div class="skeleton" style="height:120px;"></div>
        <div class="skeleton" style="height:120px;"></div>
        <div class="skeleton" style="height:120px;"></div>
      </div>
    </div>

    <div v-else-if="!classInfo" class="empty-state">
      <BuildingOfficeIcon class="w-12 h-12 text-gray-400" />
      <p class="empty-state-title">No Class Assigned</p>
      <p class="empty-state-desc">Please contact the administrator to assign you to a class.</p>
    </div>

    <div v-else>
      <!-- Stats Grid -->
      <div class="grid-cols-3" style="margin-bottom:24px;">
        <div class="stat-card">
          <div class="stat-icon" style="background:#e0f2fe;color:#0ea5e9;"><UserGroupIcon class="w-6 h-6" /></div>
          <div class="stat-info">
            <div class="stat-label">My Students</div>
            <div class="stat-value">{{ studentsCount }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4;color:#22c55e;"><CheckCircleIcon class="w-6 h-6" /></div>
          <div class="stat-info">
            <div class="stat-label">Attendance Today</div>
            <div class="stat-value">{{ attendancePercent }}%</div>
            <div class="stat-desc">{{ attendanceToday.present }} / {{ attendanceToday.total }} present</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fff7ed;color:#f97316;"><CalendarIcon class="w-6 h-6" /></div>
          <div class="stat-info">
            <div class="stat-label">Today</div>
            <div class="stat-value" style="font-size:18px;">{{ formatDate(new Date()) }}</div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns: 2fr 1fr; gap:20px;">
        <!-- Recent Activity / Scores -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Recent Scores Entered</span>
            <router-link to="/teacher/scores" class="btn btn-ghost btn-sm">View All</router-link>
          </div>
          <div class="card-body">
            <div v-if="recentScores.length === 0" class="empty-state" style="padding:40px;">
              <p style="color:var(--text-muted);">No scores recorded yet for this class.</p>
            </div>
            <div v-else class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Student</th><th>Subject</th><th>Type</th><th>Score</th></tr>
                </thead>
                <tbody>
                  <tr v-for="s in recentScores" :key="s.id">
                    <td style="font-weight:600;">{{ s.students?.full_name }}</td>
                    <td>{{ s.subjects?.subject_name }}</td>
                    <td><span class="badge badge-gray">{{ s.score_type }}</span></td>
                    <td><span class="badge" :class="s.score >= 50 ? 'badge-green' : 'badge-red'">{{ s.score }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card">
          <div class="card-header"><span class="card-title">Quick Actions</span></div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:12px;">
            <button class="btn btn-primary w-full" @click="$router.push('/teacher/attendance')">
              <PencilSquareIcon class="w-4 h-4" /> Mark Attendance
            </button>
            <button class="btn btn-secondary w-full" @click="$router.push('/teacher/scores')">
              <ChartBarIcon class="w-4 h-4" /> Enter Scores
            </button>
            <button class="btn btn-ghost w-full" @click="$router.push('/teacher/students')">
              <AcademicCapIcon class="w-4 h-4" /> View Students
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
