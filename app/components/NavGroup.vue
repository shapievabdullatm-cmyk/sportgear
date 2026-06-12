<template>
  <!-- ───── COLLAPSED MODE ───── -->
  <div
      v-if="collapsed"
      ref="triggerRef"
      class="relative"
      @mouseenter="openFlyout"
      @mouseleave="scheduleClose"
  >
    <!-- Icon button — подсвечивается если активная группа -->
    <button
        @click="$emit('toggle', name)"
        :class="[
        'w-full flex items-center justify-center p-2.5 rounded-lg transition-all duration-150',
        isOpen
          ? 'bg-zinc-900 text-white'
          : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900'
      ]"
    >
      <Icon :name="icon" class="w-4 h-4 shrink-0" />
    </button>

    <!-- Flyout через Teleport чтобы overflow sidebar не обрезал -->
    <Teleport v-if="isMounted" to="body">
      <Transition name="flyout">
        <div
            v-if="showFlyout"
            :style="flyoutStyle"
            class="fixed z-[9999] flyout-panel"
            @mouseenter="cancelClose"
            @mouseleave="scheduleClose"
        >
          <!-- Заголовок группы -->
          <div class="px-3 pt-3 pb-2.5 flex items-center gap-2">
            <Icon :name="icon" class="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <span class="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400">{{ label }}</span>
          </div>
          <div class="mx-3 border-t border-zinc-100" />
          <!-- Ссылки из slot -->
          <div class="flyout-links py-1.5 px-1.5">
            <slot />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>

  <!-- ───── EXPANDED MODE: аккордион ───── -->
  <div v-else class="space-y-0.5">
    <button
        @click="$emit('toggle', name)"
        :class="[
        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
        isOpen
          ? 'text-zinc-900 bg-zinc-50'
          : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
      ]"
    >
      <div class="flex items-center gap-3">
        <Icon :name="icon" class="w-4 h-4 shrink-0 opacity-50" />
        <span>{{ label }}</span>
      </div>
      <Icon
          name="heroicons:chevron-down"
          class="w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <div
        class="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        :style="{ maxHeight: isOpen ? contentHeight + 'px' : '0px', opacity: isOpen ? 1 : 0 }"
    >
      <div ref="content" class="ml-9 pb-1 space-y-0.5 pt-0.5">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  name: string
  icon: string
  label: string
  collapsed: boolean
  activeGroup: string | null
}>()

defineEmits(['toggle'])

// ── Аккордион (expanded) ───────────────────────────────────────
const content = ref<HTMLElement | null>(null)
const contentHeight = ref(0)
const isOpen = computed(() => props.activeGroup === props.name)

const updateHeight = () => {
  if (content.value) contentHeight.value = content.value.scrollHeight
}
onMounted(updateHeight)
watch(isOpen, async (val) => {
  if (val) { await nextTick(); updateHeight() }
})

// ── Flyout (collapsed) ─────────────────────────────────────────
const triggerRef = ref<HTMLElement | null>(null)
const showFlyout = ref(false)
const isMounted = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => { isMounted.value = true })
onUnmounted(() => { if (closeTimer) clearTimeout(closeTimer) })

// Сбрасываем flyout при разворачивании/сворачивании сайдбара
watch(() => props.collapsed, () => {
  showFlyout.value = false
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
})

const flyoutStyle = computed(() => {
  if (!triggerRef.value) return {}
  const r = triggerRef.value.getBoundingClientRect()
  return { top: `${r.top}px`, left: `${r.right + 6}px` }
})

const openFlyout = () => {
  // Только на десктопе
  if (typeof window !== 'undefined' && window.innerWidth < 768) return
  cancelClose()
  showFlyout.value = true
}

const scheduleClose = () => {
  closeTimer = setTimeout(() => { showFlyout.value = false }, 120)
}

const cancelClose = () => {
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
}
</script>

<style scoped>
/* ── Flyout панель ───────────────────────────────────────────── */
.flyout-panel {
  background: #ffffff;
  border: 1px solid #efefef;
  border-radius: 14px;
  min-width: 172px;
  padding-bottom: 6px;
  box-shadow:
      0 0 0 1px rgba(0,0,0,0.03),
      0 8px 24px rgba(0,0,0,0.08),
      0 2px 6px rgba(0,0,0,0.05);
}

/* ── Ссылки внутри flyout ────────────────────────────────────── */
.flyout-links :deep(a) {
  display: flex;
  align-items: center;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #71717a;
  transition: background 0.1s ease, color 0.1s ease;
  text-decoration: none;
  letter-spacing: -0.01em;
}
.flyout-links :deep(a:hover) {
  background: #f4f4f5;
  color: #09090b;
}
.flyout-links :deep(a.router-link-active),
.flyout-links :deep(a.router-link-exact-active) {
  background: #f4f4f5;
  color: #09090b;
  font-weight: 600;
}
/* Скрываем точку-индикатор из NavSubLink */
.flyout-links :deep(span.rounded-full) { display: none; }

/* ── Анимация ────────────────────────────────────────────────── */
.flyout-enter-active { transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.2,0,0,1); }
.flyout-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.flyout-enter-from   { opacity: 0; transform: translateX(-6px) scale(0.97); }
.flyout-leave-to     { opacity: 0; transform: translateX(-4px) scale(0.97); }
</style>