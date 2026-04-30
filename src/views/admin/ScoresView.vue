<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Academic Scores</h1>
        <p class="page-subtitle">Manage school-wide student assessments</p>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
      <div class="card hover-card">
        <div class="card-body" style="text-align:center; padding:48px 24px;">
          <div style="font-size:48px; margin-bottom:16px;">📅</div>
          <h2 style="font-size:20px; font-weight:800; color:var(--text-primary); margin-bottom:8px;">Monthly Reports</h2>
          <p style="color:var(--text-secondary); font-size:14px;">Review monthly marks by class and subject</p>
          <div class="btn btn-secondary" style="margin-top:24px;" @click="$router.push('/admin/reports')">View Monthly Reports</div>
        </div>
      </div>

      <div class="card hover-card">
        <div class="card-body" style="text-align:center; padding:48px 24px;">
          <div style="font-size:48px; margin-bottom:16px;">🏆</div>
          <h2 style="font-size:20px; font-weight:800; color:var(--text-primary); margin-bottom:8px;">Semester Results</h2>
          <p style="color:var(--text-secondary); font-size:14px;">Review final examination results school-wide</p>
          <div class="btn btn-primary" style="margin-top:24px;" @click="$router.push('/admin/reports')">View Semester Results</div>
        </div>
      </div>
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
