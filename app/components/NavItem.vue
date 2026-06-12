<template>
  <div ref="triggerRef" class="relative" @mouseenter="onEnter" @mouseleave="onLeave">
    <NuxtLink
        :to="to"
        :class="[
        'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
        collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
        active
          ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/10'
          : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
      ]"
    >
      <Icon :name="icon" class="w-4 h-4 shrink-0" :class="active ? '' : 'opacity-50'" />
      <span v-if="!collapsed">{{ label }}</span>
    </NuxtLink>

    <Teleport v-if="isMounted" to="body">
      <Transition name="nav-tip">
        <div
            v-if="showTip && collapsed"
            :style="tipStyle"
            class="fixed z-[9999] nav-tip-panel"
            @mouseenter="cancelClose"
            @mouseleave="onLeave"
        >
          {{ label }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  to: string
  icon: string
  label: string
  collapsed: boolean
  active: boolean
}>()

const triggerRef = ref<HTMLElement | null>(null)
const showTip = ref(false)
const isMounted = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => { isMounted.value = true })
onUnmounted(() => { if (closeTimer) clearTimeout(closeTimer) })

const tipStyle = computed(() => {
  if (!triggerRef.value) return {}
  const r = triggerRef.value.getBoundingClientRect()
  return {
    top: `${r.top + r.height / 2}px`,
    left: `${r.right + 6}px`,
    transform: 'translateY(-50%)',
  }
})

const onEnter = () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) return
  cancelClose()
  showTip.value = true
}

const onLeave = () => {
  closeTimer = setTimeout(() => { showTip.value = false }, 100)
}

const cancelClose = () => {
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
}
</script>

<style scoped>
.nav-tip-panel {
  background: #ffffff;
  border: 1px solid #efefef;
  border-radius: 9px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #09090b;
  white-space: nowrap;
  letter-spacing: -0.01em;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.03), 0 6px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
}
.nav-tip-enter-active { transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.2,0,0,1); }
.nav-tip-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.nav-tip-enter-from { opacity: 0; transform: translateY(-50%) translateX(-6px) scale(0.96); }
.nav-tip-leave-to   { opacity: 0; transform: translateY(-50%) translateX(-4px) scale(0.96); }
</style>