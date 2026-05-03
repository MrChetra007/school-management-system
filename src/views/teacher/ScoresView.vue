<script setup>
import { CalendarIcon, TrophyIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Student Scores</h1>
        <p class="page-subtitle">Enter and manage monthly or semester assessments</p>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
      <router-link to="/teacher/scores/monthly" class="card hover-card" style="text-decoration:none;">
        <div class="card-body" style="text-align:center; padding:48px 24px;">
          <CalendarIcon class="w-12 h-12 text-gray-400" style="margin-bottom:16px;" />
          <h2 style="font-size:20px; font-weight:800; color:var(--text-primary); margin-bottom:8px;">Monthly Scores</h2>
          <p style="color:var(--text-secondary); font-size:14px;">Enter regular monthly marks for all subjects</p>
          <div class="btn btn-secondary" style="margin-top:24px;">Open Monthly Entry</div>
        </div>
      </router-link>

      <router-link to="/teacher/scores/semester" class="card hover-card" style="text-decoration:none;">
        <div class="card-body" style="text-align:center; padding:48px 24px;">
          <TrophyIcon class="w-12 h-12 text-gray-400" style="margin-bottom:16px;" />
          <h2 style="font-size:20px; font-weight:800; color:var(--text-primary); margin-bottom:8px;">Semester Exams</h2>
          <p style="color:var(--text-secondary); font-size:14px;">Record end-of-semester final examination results</p>
          <div class="btn btn-primary" style="margin-top:24px;">Open Semester Entry</div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.hover-card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.hover-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}
</style>
