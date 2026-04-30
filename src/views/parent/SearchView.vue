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
        <div style="font-size: 48px; margin-bottom: 16px;">🎓</div>
        <h1 style="font-size: 24px; font-weight: 800; color: var(--primary-color);">Parent Portal</h1>
        <p style="color: var(--text-secondary); margin-top: 8px;">Enter student details to view records</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="form-group">
          <label class="form-label">Student ID or Full Name</label>
          <input 
            class="form-input" 
            v-model="studentIdOrName" 
            placeholder="e.g. S-001 or Sok Dara" 
            @keyup.enter="search"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Date of Birth</label>
          <input 
            class="form-input" 
            type="date" 
            v-model="dob" 
            @keyup.enter="search"
          />
        </div>

        <div v-if="errorMsg" style="background: #fef2f2; color: #ef4444; padding: 12px; border-radius: 8px; font-size: 13px; text-align: center;">
          ⚠️ {{ errorMsg }}
        </div>

        <button class="btn btn-primary w-full" style="height: 48px; font-size: 16px;" @click="search" :disabled="loading">
          {{ loading ? 'Searching…' : '🔍 Find Student' }}
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
