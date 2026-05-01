<script setup>
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const studentIdOrName = ref('')
const dob = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function search() {
  if (!studentIdOrName.value || !dob.value) {
    errorMsg.value = 'Please enter both ID/Name and Date of Birth'
    return
  }
  
  loading.value = true
  errorMsg.value = ''
  
  // Search by real_id OR full_name AND matching dob
  const { data, error } = await supabase
    .from('students')
    .select('id')
    .or(`real_id.eq.${studentIdOrName.value},full_name.ilike.%${studentIdOrName.value}%`)
    .eq('dob', dob.value)
    .maybeSingle()
  
  loading.value = false
  
  if (data) {
    router.push(`/parent/student/${data.id}`)
  } else {
    errorMsg.value = 'Student not found. Please check the details and try again.'
  }
}
</script>

<template>
  <div style="min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
    <div class="card" style="width: 100%; max-width: 450px; padding: 32px; box-shadow: var(--shadow-xl);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 64px; height: 64px; background: var(--primary-50); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 32px;">🎓</div>
        <h1 style="font-size: 22px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">មើលព័ត៌មានកូន</h1>
        <p style="color: var(--text-secondary); margin-top: 8px; font-size: 13px;">បញ្ចូលឈ្មោះ និងថ្ងៃខែឆ្នាំកំណើត</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="form-group">
          <label class="form-label">អត្តសញ្ញាណប័ណ្ណ ឬឈ្មោះពេញ</label>
          <input 
            class="form-input" 
            v-model="studentIdOrName" 
            placeholder="ឧទាហរណ៍៖ S-001 ឬ សុខ ចន្ថា" 
            @keyup.enter="search"
          />
        </div>

        <div class="form-group">
          <label class="form-label">ថ្ងៃខែឆ្នាំកំណើត</label>
          <input 
            class="form-input" 
            type="date" 
            v-model="dob" 
            @keyup.enter="search"
          />
        </div>

        <div v-if="errorMsg" class="badge badge-red" style="padding: 12px; border-radius: 8px; font-size: 13px; text-align: center; display: block;">
          ⚠️ {{ errorMsg }}
        </div>

        <button class="btn btn-primary w-full" style="height: 44px; font-size: 15px; font-weight: 700;" @click="search" :disabled="loading">
          {{ loading ? 'កំពុងស្វែងរក...' : '🔍 ស្វែងរកសិស្ស' }}
        </button>
      </div>

      <div style="margin-top: 32px; border-top: 1px solid var(--border-default); padding-top: 24px; text-align: center;">
        <p style="font-size: 12px; color: var(--text-muted);">
          Forgot student details? Please contact the school office.
        </p>
      </div>
    </div>
  </div>
</template>
