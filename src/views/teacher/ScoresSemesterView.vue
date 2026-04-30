<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { gradeFromScore } from '@/utils/scoreCalculator'

const auth = useAuthStore()
const students = ref([])
const subjects = ref([])
const classInfo = ref(null)
const loading = ref(true)
const saving = ref(false)
const toast = ref(null)

const selectedSemester = ref(1)
const selectedSubject = ref('')
const bulkEntries = ref([])

onMounted(async () => {
  if (auth.teacherProfile) {
    await loadData()
  } else {
    setTimeout(async () => {
      if (auth.teacherProfile) await loadData()
      else loading.value = false
    }, 1000)
  }
})

async function loadData() {
  loading.value = true
  const teacherId = auth.teacherProfile.id

  const { data: classData } = await supabase
    .from('classes')
    .select('*, academic_years(id, year_name)')
    .eq('teacher_id', teacherId)
    .maybeSingle()
  
  if (classData) {
    classInfo.value = classData
    
    // Get Subjects
    const { data: subData } = await supabase.from('subjects').select('*').order('subject_name')
    subjects.value = subData || []
    if (subjects.value.length > 0) selectedSubject.value = subjects.value[0].id

    // Get Students
    const { data: stuData } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('class_id', classData.id)
      .order('full_name')
    students.value = stuData || []
    
    await loadScores()
  }
  loading.value = false
}

async function loadScores() {
  if (!classInfo.value || !selectedSubject.value || !selectedSemester.value) return
  
  const studentIds = students.value.map(s => s.id)
  const { data } = await supabase
    .from('scores')
    .select('*')
    .in('student_id', studentIds)
    .eq('subject_id', selectedSubject.value)
    .eq('semester', selectedSemester.value)
    .eq('score_type', 'semester')
  
  const scoreMap = {}
  data?.forEach(s => { scoreMap[s.student_id] = s })
  
  bulkEntries.value = students.value.map(s => {
    const existing = scoreMap[s.id]
    return {
      student_id: s.id,
      full_name: s.full_name,
      score: existing?.score ?? '',
      existing_id: existing?.id
    }
  })
}

async function save() {
  if (!selectedSubject.value) { showToast('Select a subject first', 'error'); return }
  saving.value = true
  
  for (const entry of bulkEntries.value) {
    if (entry.score === '' || entry.score === null) continue
    
    const payload = {
      student_id: entry.student_id,
      subject_id: selectedSubject.value,
      academic_year_id: classInfo.value.academic_year_id,
      score_type: 'semester',
      semester: selectedSemester.value,
      score: Number(entry.score)
    }
    
    if (entry.existing_id) {
      await supabase.from('scores').update({ score: payload.score }).eq('id', entry.existing_id)
    } else {
      await supabase.from('scores').insert(payload)
    }
  }
  
  saving.value = false
  showToast('Semester scores saved!', 'success')
  await loadScores()
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
        <h1 class="page-title">Semester Scores</h1>
        <p class="page-subtitle" v-if="classInfo">Class: <strong>{{ classInfo.class_name }}</strong></p>
      </div>
      <button v-if="classInfo" class="btn btn-primary" @click="save" :disabled="saving">
        {{ saving ? 'Saving…' : '💾 Save Semester Scores' }}
      </button>
    </div>

    <div v-if="loading" class="card card-body">
      <div v-for="i in 5" :key="i" class="skeleton" style="height:52px;margin-bottom:10px;border-radius:8px;"></div>
    </div>

    <div v-else-if="!classInfo" class="empty-state">
      <div class="empty-state-icon">🏫</div>
      <p class="empty-state-title">No Class Assigned</p>
    </div>

    <div v-else>
      <div class="card" style="margin-bottom:16px;">
        <div class="card-body" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;">
          <div class="form-group" style="width:180px;">
            <label class="form-label">Semester</label>
            <select class="form-select" v-model="selectedSemester" @change="loadScores">
              <option :value="1">Semester 1</option>
              <option :value="2">Semester 2</option>
            </select>
          </div>
          <div class="form-group" style="width:200px;">
            <label class="form-label">Subject</label>
            <select class="form-select" v-model="selectedSubject" @change="loadScores">
              <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.subject_name }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div v-if="bulkEntries.length === 0" class="empty-state">
          <div class="empty-state-icon">🎓</div>
          <p class="empty-state-title">No students found</p>
        </div>
        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr><th>Student</th><th style="width:150px;">Semester Score (0-100)</th><th style="width:100px;">Grade</th></tr>
            </thead>
            <tbody>
              <tr v-for="entry in bulkEntries" :key="entry.student_id">
                <td style="font-weight:600;">{{ entry.full_name }}</td>
                <td>
                  <input 
                    type="number"
                    class="form-input" 
                    v-model="entry.score" 
                    min="0" max="100"
                    placeholder="Score…"
                    @keyup.enter="save"
                  />
                </td>
                <td>
                  <span v-if="entry.score !== ''" class="badge" :class="Number(entry.score) >= 50 ? 'badge-green' : 'badge-red'">
                    {{ gradeFromScore(entry.score) }}
                  </span>
                  <span v-else>—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="bulkEntries.length > 0" class="card-footer" style="display:flex;justify-content:flex-end;">
          <button class="btn btn-primary" @click="save" :disabled="saving">
            {{ saving ? 'Saving…' : '💾 Save Scores' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
