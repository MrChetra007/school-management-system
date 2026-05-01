<script setup>
import { RouterView, RouterLink, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="parent-layout">
    <!-- Top Nav -->
    <header class="parent-header">
      <RouterLink to="/parent" class="parent-brand">
        <div class="parent-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="18" height="18">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span class="parent-brand-name">School Portal</span>
      </RouterLink>
      <div class="parent-header-right">
        <span class="badge badge-blue">Parent / Guardian</span>
      </div>
    </header>

    <!-- Content -->
    <main class="parent-content">
      <RouterView />
    </main>

    <!-- Footer -->
    <footer class="parent-footer">
      <p>© {{ new Date().getFullYear() }} School Management System — Parent Portal</p>
    </footer>
  </div>
</template>

<style scoped>
.parent-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-app);
}

.parent-header {
  height: auto;
  padding: 32px 24px;
  background: transparent;
  border-bottom: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: none;
}

.parent-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.parent-logo {
  width: 48px;
  height: 48px;
  background: var(--primary-500);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.parent-brand-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
}

.parent-header-right { display: none; }

.parent-content {
  flex: 1;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
  padding: 0 20px 40px;
}

.parent-footer {
  text-align: center;
  padding: 16px;
  font-size: 12px;
  color: var(--text-muted);
  border-top: 1px solid var(--border-default);
  background: white;
}

@media (max-width: 768px) {
  .parent-content { padding: 20px 16px; }
  .parent-header { padding: 0 16px; }
}
</style>
