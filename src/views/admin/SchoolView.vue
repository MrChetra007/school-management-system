<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const info = ref(null)
const loading = ref(true)
const saving = ref(false)
const toast = ref(null)
const uploadingLogo = ref(false)

const form = ref({
  id: null, name_khmer: '', name_english: '', school_code: '',
  director_name: '', address: '', phone: '', email: '', logo_base64: ''
})

onMounted(load)

async function load() {
  loading.value = true
  const { data } = await supabase.from('school_information').select('*').limit(1).maybeSingle()
  if (data) {
    info.value = data
    Object.assign(form.value, data)
  }
  loading.value = false
}

async function uploadLogo(e) {
  const file = e.target.files[0]
  if (!file) return
  uploadingLogo.value = true
  const reader = new FileReader()
  reader.onload = (ev) => {
    form.value.logo_base64 = ev.target.result
    uploadingLogo.value = false
  }
  reader.readAsDataURL(file)
}

async function save() {
  saving.value = true
  const { id, ...payload } = form.value
  payload.updated_at = new Date().toISOString()
  let error
  if (info.value) {
    ;({ error } = await supabase.from('school_information').update(payload).eq('id', info.value.id))
  } else {
    ;({ error } = await supabase.from('school_information').insert(payload))
  }
  saving.value = false
  if (error) { showToast(error.message, 'error'); return }
  showToast('School information saved!', 'success')
  load()
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
      <div><h1 class="page-title">School Information</h1><p class="page-subtitle">Edit school name, logo, and contact details</p></div>
      <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? 'Saving…' : '💾 Save Changes' }}</button>
    </div>

    <div v-if="loading" class="card card-body">
      <div v-for="i in 5" :key="i" class="skeleton" style="height:44px;margin-bottom:14px;border-radius:8px;"></div>
    </div>

    <div v-else style="display:grid;grid-template-columns:1fr 2fr;gap:20px;">
      <!-- Logo card -->
      <div class="card">
        <div class="card-header"><span class="card-title">School Logo</span></div>
        <div class="card-body" style="display:flex;flex-direction:column;align-items:center;gap:16px;">
          <div style="width:120px;height:120px;border-radius:16px;border:2px dashed var(--border-default);display:flex;align-items:center;justify-content:center;overflow:hidden;background:#f8fafc;">
            <img v-if="form.logo_base64" :src="form.logo_base64" style="width:100%;height:100%;object-fit:contain;" />
            <span v-else style="font-size:40px;">🏫</span>
          </div>
          <label class="btn btn-ghost btn-sm" style="cursor:pointer;">
            {{ uploadingLogo ? 'Processing…' : '📷 Upload Logo' }}
            <input type="file" accept="image/*" style="display:none;" @change="uploadLogo" :disabled="uploadingLogo" />
          </label>
          <p style="font-size:11px;color:var(--text-muted);text-align:center;">Logo is stored as Base64 in the database</p>
        </div>
      </div>

      <!-- Details card -->
      <div class="card">
        <div class="card-header"><span class="card-title">School Details</span></div>
        <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">School Name (Khmer)</label>
            <input class="form-input khmer" v-model="form.name_khmer" placeholder="ឈ្មោះសាលារៀន" />
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">School Name (English)</label>
            <input class="form-input" v-model="form.name_english" placeholder="e.g. Sunrise Primary School" />
          </div>
          <div class="form-group">
            <label class="form-label">School Code</label>
            <input class="form-input" v-model="form.school_code" placeholder="e.g. SCH-001" />
          </div>
          <div class="form-group">
            <label class="form-label">Director Name</label>
            <input class="form-input" v-model="form.director_name" placeholder="Director's full name" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input class="form-input" v-model="form.phone" placeholder="012 345 678" />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" v-model="form.email" placeholder="school@edu.gov.kh" />
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Address</label>
            <textarea class="form-textarea" v-model="form.address" rows="3" placeholder="Full school address"></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
