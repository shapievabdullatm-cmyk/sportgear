<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const { $pwa } = useNuxtApp() as { $pwa?: any }

const deferredPrompt = ref<any>(null)
const showBanner = ref(false)
const STORAGE_KEY = 'rage:pwa-install-dismissed'

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

function onBeforeInstall(e: Event) {
  e.preventDefault()
  if (isStandalone()) return
  if (sessionStorage.getItem(STORAGE_KEY)) return
  deferredPrompt.value = e
  showBanner.value = true
}

function onInstalled() {
  showBanner.value = false
  deferredPrompt.value = null
}

async function install() {
  const evt = deferredPrompt.value
  if (!evt) return
  showBanner.value = false
  try {
    await evt.prompt()
    await evt.userChoice
  } finally {
    deferredPrompt.value = null
  }
}

function dismiss() {
  showBanner.value = false
  try { sessionStorage.setItem(STORAGE_KEY, '1') } catch {}
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstall)
  window.addEventListener('appinstalled', onInstalled)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  window.removeEventListener('appinstalled', onInstalled)
})

const needsRefresh = computed(() => Boolean($pwa?.needRefresh))
function reloadApp() {
  $pwa?.updateServiceWorker?.()
}
</script>

<template>
  <div v-if="showBanner" class="pwa-banner" role="dialog" aria-label="Установить приложение Rage">
    <img src="/pwa-192x192.png" alt="" class="pwa-banner__icon" />
    <div class="pwa-banner__text">
      <strong>Установить Rage</strong>
      <span>Быстрый доступ с главного экрана</span>
    </div>
    <button class="pwa-banner__install" @click="install">Установить</button>
    <button class="pwa-banner__close" @click="dismiss" aria-label="Закрыть">×</button>
  </div>

  <div v-if="needsRefresh" class="pwa-update" role="status">
    <span>Доступна новая версия</span>
    <button class="pwa-update__btn" @click="reloadApp">Обновить</button>
  </div>
</template>

<style scoped>
.pwa-banner {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 84px);
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14), 0 1px 3px rgba(15, 23, 42, 0.06);
  border: 1px solid #eee;
}
@media (min-width: 1025px) {
  .pwa-banner {
    left: auto;
    right: 24px;
    bottom: 24px;
    width: 360px;
  }
}
.pwa-banner__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
}
.pwa-banner__text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.pwa-banner__text strong { font-size: 14px; color: #111; }
.pwa-banner__text span  { font-size: 12px; color: #777; }
.pwa-banner__install {
  background: #C1121C;
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}
.pwa-banner__close {
  background: none;
  border: none;
  font-size: 22px;
  line-height: 1;
  color: #999;
  cursor: pointer;
  padding: 0 4px;
  flex-shrink: 0;
}

.pwa-update {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
  transform: translateX(-50%);
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #111;
  color: #fff;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 13px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
}
.pwa-update__btn {
  background: #C1121C;
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
</style>