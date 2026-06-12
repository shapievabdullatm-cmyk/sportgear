<template>
  <Transition name="toast">
    <div v-if="visible" class="toast-wrap">
      <div class="toast-card">

        <!-- Icon -->
        <div class="toast-icon">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <polyline points="1.5 6 4.5 9 10.5 3" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- Text -->
        <div class="toast-text">
          <span class="toast-title">{{ title }}</span>
          <span class="toast-subtitle">{{ subtitle }}</span>
        </div>

        <!-- Close -->
        <button class="toast-close" @click="handleClose" aria-label="Закрыть">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>

      </div>

      <!-- Progress bar -->
      <div class="toast-progress-track">
        <div class="toast-progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{
  show: boolean
  progress: number
  title: string
  subtitle: string
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

// Internal visibility — follows `show` but also allows auto-close
const visible = ref(props.show)

watch(() => props.show, (val) => {
  visible.value = val
})

// Auto-dismiss when progress reaches 0
watch(() => props.progress, (val) => {
  if (val <= 0 && visible.value) {
    visible.value = false
    emit('close')
  }
})

function handleClose() {
  visible.value = false
  emit('close')
}
</script>

<style scoped>
.toast-wrap {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  width: 288px;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
  box-shadow:
      0 1px 2px rgba(0,0,0,0.06),
      0 4px 16px rgba(0,0,0,0.10),
      0 0 0 1px rgba(0,0,0,0.07);
  background: #fff;
}

.toast-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}

/* Icon circle */
.toast-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1A1A1A;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Text block */
.toast-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.toast-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #1A1A1A;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.toast-subtitle {
  font-size: 11px;
  color: #9A9A9A;
  line-height: 1.3;
}

/* Close button */
.toast-close {
  color: #C0BEB8;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
}
.toast-close:hover {
  color: #1A1A1A;
  background: #F5F4F2;
}

/* Progress track */
.toast-progress-track {
  height: 2px;
  background: #F0EEE9;
  width: 100%;
}

.toast-progress-fill {
  height: 100%;
  background: #1A1A1A;
  transition: width 0.1s linear;
}

/* Transition */
.toast-enter-active {
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.97);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>