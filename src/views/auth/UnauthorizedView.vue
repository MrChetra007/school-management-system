<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

function goBack() {
  if (auth.isLoggedIn) {
    const role = auth.role
    if (role === 'admin')     router.push('/admin/dashboard')
    else if (role === 'teacher')   router.push('/teacher/dashboard')
    else if (role === 'librarian') router.push('/librarian/dashboard')
  } else {
    router.push('/login')
  }
}
</script>

<template>
  <div class="unauth-page">
    <div class="unauth-card">
      <div class="unauth-icon">🚫</div>
      <h1 class="unauth-title">Access Denied</h1>
      <p class="unauth-desc">
        You don't have permission to access this page.<br/>
        Please contact your administrator if you believe this is an error.
      </p>
      <button class="btn btn-primary" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Go Back
      </button>
    </div>
  </div>
</template>

<style scoped>
.unauth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-app);
}

.unauth-card {
  text-align: center;
  background: white;
  border-radius: 20px;
  padding: 60px 40px;
  box-shadow: var(--shadow-xl);
  max-width: 400px;
  width: 100%;
  border: 1px solid var(--border-default);
  animation: card-in 0.3s ease;
}

@keyframes card-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

.unauth-icon { font-size: 56px; margin-bottom: 16px; }
.unauth-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}
.unauth-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 28px;
}
</style>
