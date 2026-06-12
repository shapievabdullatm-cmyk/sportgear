<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container" :class="{ mobile: isMobile }">
      <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[toast.type]"
          @click="handleToastClick(toast)"
      >
        <div class="toast-content">
          <div class="toast-message">{{ toast.message }}</div>
          <div v-if="toast.action" class="toast-action">{{ toast.action }}</div>
        </div>

        <button class="toast-close" @click.stop="removeToast(toast.id)">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { useToastStore } from '~/stores/toast'
import { storeToRefs } from 'pinia'

const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)

const isMobile = ref(false)

onMounted(() => {
  isMobile.value = window.innerWidth <= 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768
  })
})

function handleToastClick(toast: any) {
  if (toast.link) {
    navigateTo(toast.link)
    toastStore.removeToast(toast.id)
  }
}

function removeToast(id: string) {
  toastStore.removeToast(id)
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast-container.mobile {
  top: auto;
  bottom: 80px;
  left: 20px;
  right: 20px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #1a1a1a;
  border-radius: 1px;
  padding: 14px 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  min-width: 280px;
  max-width: 380px;
  pointer-events: all;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.toast-container.mobile .toast {
  min-width: auto;
  max-width: 100%;
}

.toast:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-message {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 0;
}

.toast-action {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
  margin-top: 2px;
}

.toast-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.2s;
}

.toast-close:hover {
  color: #ffffff;
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-container.mobile .toast-enter-from {
  transform: translateY(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-container.mobile .toast-leave-to {
  transform: translateY(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>