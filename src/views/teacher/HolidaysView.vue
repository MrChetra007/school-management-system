<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/formatDate'

const holidays = ref([])
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  const { data } = await supabase
    .from('school_holidays')
    .select('*, academic_years(year_name)')
    .order('start_date', { ascending: false })
  holidays.value = data || []
  loading.value = false
})

function dayCount(h) {
  const d = (new Date(h.end_date) - new Date(h.start_date)) / 86400000
  return Math.max(0, Math.round(d) + 1)
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">School Holidays</h1>
        <p class="page-subtitle">Scheduled breaks and public holidays</p>
      </div>
    </div>

    <div v-if="loading" class="card card-body">
      <div v-for="i in 5" :key="i" class="skeleton" style="height:48px;margin-bottom:10px;border-radius:8px;"></div>
    </div>

    <div v-else class="card">
      <div v-if="holidays.length === 0" class="empty-state">
        <div class="empty-state-icon">🌴</div>
        <p class="empty-state-title">No holidays scheduled</p>
      </div>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr><th>Holiday Name</th><th>Start Date</th><th>End Date</th><th>Duration</th><th>Academic Year</th></tr>
          </thead>
          <tbody>
            <tr v-for="h in holidays" :key="h.id">
              <td style="font-weight:600;">🌴 {{ h.name }}</td>
              <td>{{ formatDate(h.start_date) }}</td>
              <td>{{ formatDate(h.end_date) }}</td>
              <td><span class="badge badge-blue">{{ dayCount(h) }} day{{ dayCount(h) !== 1 ? 's' : '' }}</span></td>
              <td><span class="badge badge-gray">{{ h.academic_years?.year_name || '—' }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
