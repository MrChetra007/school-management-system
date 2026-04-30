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
const activeTab = ref('health')

const attendance = ref([])
const scores = ref([])
const health = ref({ growth: [], vaccinations: [], sickDays: [] })

onMounted(async () => { await loadData() })

async function loadData() {
  loading.value = true
  const { data: stu } = await supabase.from('students').select('*, classes(class_name)').eq('id', studentId).single()
  if (!stu) { router.push('/teacher/students'); return }
  student.value = stu

  const [att, scr, gr, vac, sick] = await Promise.all([
    supabase.from('attendances').select('*').eq('student_id', studentId).order('date', { ascending: false }),
    supabase.from('scores').select('*, subjects(subject_name)').eq('student_id', studentId).order('month', { ascending: false }),
    supabase.from('student_growth').select('*').eq('student_id', studentId).order('date', { ascending: false }),
    supabase.from('student_vaccinations').select('*').eq('student_id', studentId).order('date', { ascending: false }),
    supabase.from('student_sick_days').select('*').eq('student_id', studentId).order('date', { ascending: false })
  ])
  
  attendance.value = att.data || []
  scores.value = scr.data || []
  health.value = { growth: gr.data || [], vaccinations: vac.data || [], sickDays: sick.data || [] }
  loading.value = false
}

function initials(name) { return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }
</script>

<template>
  <div>
    <div v-if="loading" class="card card-body">
      <div class="skeleton" style="height:200px; margin-bottom:20px;"></div>
      <div class="skeleton" style="height:400px;"></div>
    </div>
    <div v-else-if="student">
      <div class="card" style="margin-bottom:24px; padding:24px;">
        <div style="display:flex; gap:24px; align-items:center;">
          <div class="avatar" style="width:80px; height:80px; font-size:24px;">{{ initials(student.full_name) }}</div>
          <div style="flex:1;">
            <h1 style="font-size:24px; font-weight:800; color:var(--text-primary);">{{ student.full_name }}</h1>
            <div style="display:flex; gap:12px; margin-top:8px;">
              <span class="badge badge-blue">ID: {{ student.real_id || '—' }}</span>
              <span class="badge badge-gray">Class: {{ student.classes?.class_name }}</span>
            </div>
          </div>
          <button class="btn btn-ghost" @click="router.back()">Back</button>
        </div>
      </div>

      <div class="tabs">
        <div class="tab-item" :class="{ active: activeTab === 'health' }" @click="activeTab = 'health'">🩺 Health</div>
        <div class="tab-item" :class="{ active: activeTab === 'attendance' }" @click="activeTab = 'attendance'">📅 Attendance</div>
        <div class="tab-item" :class="{ active: activeTab === 'scores' }" @click="activeTab = 'scores'">⭐ Scores</div>
      </div>

      <div class="card">
        <div v-if="activeTab === 'health'" class="card-body">
          <div style="display:flex; flex-direction:column; gap:32px;">
            <div><h4 style="font-weight:700; margin-bottom:12px;">Growth</h4>
              <div class="table-wrapper"><table><thead><tr><th>Date</th><th>Height</th><th>Weight</th></tr></thead>
              <tbody><tr v-for="g in health.growth" :key="g.id"><td>{{ formatDate(g.date) }}</td><td>{{ g.height }}</td><td>{{ g.weight }}</td></tr></tbody></table></div>
            </div>
            <div><h4 style="font-weight:700; margin-bottom:12px;">Vaccinations</h4>
              <div class="table-wrapper"><table><thead><tr><th>Date</th><th>Vaccine</th><th>Status</th></tr></thead>
              <tbody><tr v-for="v in health.vaccinations" :key="v.id"><td>{{ formatDate(v.date) }}</td><td>{{ v.name }}</td><td><span class="badge" :class="v.completed ? 'badge-green' : 'badge-yellow'">{{ v.completed ? 'Done' : 'Pending' }}</span></td></tr></tbody></table></div>
            </div>
          </div>
        </div>
        <div v-if="activeTab === 'attendance'" class="table-wrapper">
          <table><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody><tr v-for="a in attendance" :key="a.id"><td>{{ formatDate(a.date) }}</td><td><span class="badge" :class="a.status === 'present' ? 'badge-green' : 'badge-red'">{{ a.status }}</span></td></tr></tbody></table>
        </div>
        <div v-if="activeTab === 'scores'" class="table-wrapper">
          <table><thead><tr><th>Subject</th><th>Type</th><th>Score</th></tr></thead><tbody><tr v-for="s in scores" :key="s.id"><td>{{ s.subjects?.subject_name }}</td><td>{{ s.score_type }}</td><td>{{ s.score }}</td></tr></tbody></table>
        </div>
      </div>
    </div>
  </div>
</template>
