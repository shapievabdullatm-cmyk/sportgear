<template>
  <header class="mobile-header">
    <button v-if="back" class="back-btn" @click="router.back()">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    </button>
    <h1 class="page-title" :class="{ 'page-title--centered': !back }">{{ title }}</h1>
  </header>
</template>

<script setup lang="ts">
defineProps<{ title: string; back?: boolean }>()
const router = useRouter()
</script>

<style scoped>
.mobile-header { display: none; }

@media (max-width: 768px) {
  .mobile-header {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 20px 20px 0;
    max-width: 1200px;
    margin: 0 auto;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: #111;
    padding: 6px;
    margin-left: -6px;
    border-radius: 6px;
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .back-btn:hover { background: #f5f5f5; }

  .page-title {
    font-size: 18px;
    font-weight: 700;
    color: #111;
    letter-spacing: -0.01em;
    margin: 0;
  }
}
</style>