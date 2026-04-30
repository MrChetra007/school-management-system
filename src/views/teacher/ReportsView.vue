<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/formatDate'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const auth = useAuthStore()
const classInfo = ref(null)
const students = ref([])
const loading = ref(true)

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
    .select('*, academic_years(year_name)')
    .eq('teacher_id', teacherId)
    .maybeSingle()
  
  if (classData) {
    classInfo.value = classData
    const { data: stuData } = await supabase
      .from('students')
      .select('id, full_name, real_id, gender')
      .eq('class_id', classData.id)
      .order('full_name')
    students.value = stuData || []
  }
  loading.value = false
}

function printClassList() {
  const doc = jsPDF()
  doc.setFontSize(18)
  doc.text(`${classInfo.value.class_name} - Student List`, 105, 20, { align: 'center' })
  doc.setFontSize(12)
  doc.text(`Academic Year: ${classInfo.value.academic_years?.year_name}`, 105, 28, { align: 'center' })
  doc.text(`Teacher: ${auth.teacherProfile.full_name}`, 105, 34, { align: 'center' })
  
  const body = students.value.map((s, idx) => [idx + 1, s.real_id || '—', s.full_name, s.gender])
  
  doc.autoTable({
    startY: 45,
    head: [['#', 'ID', 'Student Name', 'Gender']],
    body: body,
  })
  
  doc.save(`${classInfo.value.class_name}_student_list.pdf`)
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Class Reports</h1>
        <p class="page-subtitle" v-if="classInfo">Generating reports for <strong>{{ classInfo.class_name }}</strong></p>
      </div>
    </div>

    <div v-if="loading" class="card card-body">
      <div class="skeleton" style="height:100px; margin-bottom:20px;"></div>
    </div>

    <div v-else-if="!classInfo" class="empty-state">
      <div class="empty-state-icon">📊</div>
      <p class="empty-state-title">No Class Assigned</p>
    </div>

    <div v-else>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
        
        <div class="card">
          <div class="card-header"><span class="card-title">Student Records</span></div>
          <div class="card-body">
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Download the official list of students in your class.</p>
            <button class="btn btn-ghost w-full" style="justify-content:flex-start;" @click="printClassList">
              📄 Download Student List (PDF)
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Attendance Summary</span></div>
          <div class="card-body">
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">View monthly attendance trends for your class.</p>
            <button class="btn btn-ghost w-full" style="justify-content:flex-start;" disabled>
              📊 Attendance Trends (Coming Soon)
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Grade Distribution</span></div>
          <div class="card-body">
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Analyze the average performance of your students.</p>
            <button class="btn btn-ghost w-full" style="justify-content:flex-start;" disabled>
              📈 Score Distribution (Coming Soon)
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
