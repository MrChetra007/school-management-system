<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/formatDate'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { AcademicCapIcon, CheckCircleIcon, BookOpenIcon, StarIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'

const stats = ref({
  students: 0,
  teachers: 0,
  avgAttendance: 0,
  avgScore: 0,
  booksBorrowed: 0
})
const loading = ref(true)

onMounted(async () => {
  await loadStats()
})

async function loadStats() {
  loading.value = true
  
  // Basic counts
  const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true })
  const { count: teacherCount } = await supabase.from('teachers').select('*', { count: 'exact', head: true })
  
  // Attendance avg (mock logic for now or simple query)
  const { data: attData } = await supabase.from('attendances').select('status')
  if (attData && attData.length > 0) {
    const present = attData.filter(a => a.status === 'present').length
    stats.value.avgAttendance = Math.round((present / attData.length) * 100)
  }

  // Score avg
  const { data: scoreData } = await supabase.from('scores').select('score')
  if (scoreData && scoreData.length > 0) {
    const total = scoreData.reduce((acc, s) => acc + s.score, 0)
    stats.value.avgScore = Math.round(total / scoreData.length)
  }

  // Books
  const { count: borrowCount } = await supabase.from('book_borrows').select('*', { count: 'exact', head: true, filter: 'status.eq.borrowed' })
  
  stats.value.students = studentCount || 0
  stats.value.teachers = teacherCount || 0
  stats.value.booksBorrowed = borrowCount || 0
  
  loading.value = false
}

function exportPDF(title, type) {
  const doc = jsPDF()
  doc.setFontSize(20)
  doc.text('Sunrise Primary School', 105, 20, { align: 'center' })
  doc.setFontSize(14)
  doc.text(title, 105, 30, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`Generated on: ${formatDate(new Date())}`, 105, 36, { align: 'center' })
  
  doc.setFontSize(12)
  doc.text(`This is a summary report for ${type}.`, 20, 50)
  doc.text(`Total Students: ${stats.value.students}`, 20, 60)
  doc.text(`Average Attendance: ${stats.value.avgAttendance}%`, 20, 70)
  doc.text(`Average Academic Score: ${stats.value.avgScore}/100`, 20, 80)
  
  doc.save(`${type.toLowerCase()}_report_${Date.now()}.pdf`)
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Reports Center</h1>
        <p class="page-subtitle">Generate and download school-wide performance reports</p>
      </div>
    </div>

    <div v-if="loading" class="card card-body">
      <div v-for="i in 4" :key="i" class="skeleton" style="height:60px;margin-bottom:20px;border-radius:12px;"></div>
    </div>

    <div v-else>
      <!-- Quick Stats Grid -->
      <div class="grid-cols-4" style="margin-bottom:24px;">
        <div class="stat-card">
          <div class="stat-icon" style="background:#e0f2fe;color:#0ea5e9;"><AcademicCapIcon class="w-6 h-6" /></div>
          <div class="stat-info">
            <div class="stat-label">Enrollment</div>
            <div class="stat-value">{{ stats.students }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4;color:#22c55e;"><CheckCircleIcon class="w-6 h-6" /></div>
          <div class="stat-info">
            <div class="stat-label">Attendance</div>
            <div class="stat-value">{{ stats.avgAttendance }}%</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fefce8;color:#eab308;"><StarIcon class="w-6 h-6" /></div>
          <div class="stat-info">
            <div class="stat-label">Avg Score</div>
            <div class="stat-value">{{ stats.avgScore }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#faf5ff;color:#a855f7;"><BookOpenIcon class="w-6 h-6" /></div>
          <div class="stat-info">
            <div class="stat-label">Books Out</div>
            <div class="stat-value">{{ stats.booksBorrowed }}</div>
          </div>
        </div>
      </div>

      <!-- Report Generator Sections -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:20px;">
        
        <!-- Attendance Report -->
        <div class="card">
          <div class="card-header"><span class="card-title">Attendance Reports</span></div>
          <div class="card-body">
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Generate detailed attendance summaries by class or month.</p>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <button class="btn btn-ghost" style="justify-content:flex-start;" @click="exportPDF('Monthly Attendance Summary', 'Attendance')">
                <DocumentTextIcon class="w-4 h-4" /> Monthly Summary (PDF)
              </button>
              <button class="btn btn-ghost" style="justify-content:flex-start;" @click="exportPDF('Class Attendance Ranking', 'Attendance')">
                <DocumentTextIcon class="w-4 h-4" /> Class Ranking (PDF)
              </button>
            </div>
          </div>
        </div>

        <!-- Academic Report -->
        <div class="card">
          <div class="card-header"><span class="card-title">Academic Reports</span></div>
          <div class="card-body">
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Analyze student performance across subjects and classes.</p>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <button class="btn btn-ghost" style="justify-content:flex-start;" @click="exportPDF('Grade Distribution Report', 'Academics')">
                <DocumentTextIcon class="w-4 h-4" /> Grade Distribution (PDF)
              </button>
              <button class="btn btn-ghost" style="justify-content:flex-start;" @click="exportPDF('Subject Performance Analytics', 'Academics')">
                <DocumentTextIcon class="w-4 h-4" /> Subject Analytics (PDF)
              </button>
            </div>
          </div>
        </div>

        <!-- Financial Report -->
        <div class="card">
          <div class="card-header"><span class="card-title">Financial Reports</span></div>
          <div class="card-body">
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Review school budget, income, and expenditures.</p>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <button class="btn btn-ghost" style="justify-content:flex-start;" @click="exportPDF('Quarterly Budget Report', 'Finance')">
                <DocumentTextIcon class="w-4 h-4" /> Quarterly Review (PDF)
              </button>
              <button class="btn btn-ghost" style="justify-content:flex-start;" @click="exportPDF('Expense Breakdown', 'Finance')">
                <DocumentTextIcon class="w-4 h-4" /> Expense Breakdown (PDF)
              </button>
            </div>
          </div>
        </div>

        <!-- Inventory Report -->
        <div class="card">
          <div class="card-header"><span class="card-title">Inventory Reports</span></div>
          <div class="card-body">
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Track school assets and stock levels.</p>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <button class="btn btn-ghost" style="justify-content:flex-start;" @click="exportPDF('Low Stock Alert Report', 'Inventory')">
                <DocumentTextIcon class="w-4 h-4" /> Low Stock Alerts (PDF)
              </button>
              <button class="btn btn-ghost" style="justify-content:flex-start;" @click="exportPDF('Asset Valuation List', 'Inventory')">
                <DocumentTextIcon class="w-4 h-4" /> Full Asset List (PDF)
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
