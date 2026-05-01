<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const studentName = ref('')
const dob = ref('')
const searching = ref(false)
const error = ref(null)

async function handleSearch() {
  if (!studentName.value || !dob.value) {
    error.value = 'សូមបញ្ជាក់ឈ្មោះ និង ថ្ងៃខែឆ្នាំកំណើត (Please enter name and DOB)'
    return
  }

  searching.value = true
  error.value = null

  try {
    const { data, error: err } = await supabase
      .from('students')
      .select('id, full_name, dob')
      .ilike('full_name', studentName.value.trim())
      .eq('dob', dob.value)
      .maybeSingle()

    if (err) throw err
    
    if (data) {
      router.push(`/parent/student/${data.id}`)
    } else {
      error.value = 'រកមិនឃើញសិស្សទេ សូមពិនិត្យឈ្មោះ និង ថ្ងៃកំណើតឡើងវិញ (Student not found. Please check name and DOB)'
    }
  } catch (err) {
    error.value = 'មានបញ្ហាបច្ចេកទេស (Technical error)'
    console.error(err)
  } finally {
    searching.value = false
  }
}
</script>

<template>
  <div class="search-view">
    <div class="search-card">
      <div class="search-header">
        <div class="search-icon">🔍</div>
        <h1 class="search-title">ស្វែងរកលទ្ធផលសិក្សាសិស្ស</h1>
        <p class="search-subtitle">Student Academic Search</p>
      </div>

      <form @submit.prevent="handleSearch" class="search-form">
        <div class="form-group">
          <label class="form-label">ឈ្មោះសិស្ស (Student Name)</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="studentName" 
            placeholder="ឈ្មោះពេញ (Full Name)"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">ថ្ងៃខែឆ្នាំកំណើត (Date of Birth)</label>
          <input 
            type="date" 
            class="form-input" 
            v-model="dob" 
            required
          />
        </div>

        <div v-if="error" class="error-msg">
          {{ error }}
        </div>

        <button type="submit" class="btn btn-primary btn-lg" :disabled="searching" style="width:100%; justify-content:center; margin-top:12px;">
          {{ searching ? 'កំពុងស្វែងរក...' : 'ស្វែងរក (Search)' }}
        </button>
      </form>
    </div>

    <div class="search-tips">
      <h3>សេចក្តីណែនាំ (Instructions):</h3>
      <ul>
        <li>សូមវាយឈ្មោះសិស្សឱ្យបានត្រឹមត្រូវតាមសំបុត្រកំណើត។</li>
        <li>ជ្រើសរើសថ្ងៃខែឆ្នាំកំណើតរបស់សិស្ស។</li>
        <li>ប្រព័ន្ធនឹងបង្ហាញព័ត៌មានវត្តមាន និង ពិន្ទុសិក្សា។</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.search-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 32px;
}

.search-card {
  background: white;
  padding: 40px;
  border-radius: 24px;
  box-shadow: var(--shadow-xl);
  max-width: 440px;
  width: 100%;
}

.search-header {
  text-align: center;
  margin-bottom: 32px;
}

.search-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.search-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.search-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.error-msg {
  padding: 12px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
}

.search-tips {
  max-width: 440px;
  width: 100%;
  color: var(--text-secondary);
}

.search-tips h3 {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.search-tips ul {
  padding-left: 20px;
  font-size: 13px;
}

.search-tips li {
  margin-bottom: 8px;
}
</style>
