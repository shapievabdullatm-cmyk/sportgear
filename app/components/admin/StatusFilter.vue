<script setup lang="ts">
import { ORDER_STATUS_LABELS, type OrderStatus } from '~/types/order'

const props = defineProps<{
    modelValue: OrderStatus | ''
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', v: OrderStatus | ''): void
}>()

interface Option { value: OrderStatus | ''; label: string; dot: string | null }

const OPTIONS: Option[] = [
    { value: '',           label: 'Все статусы',                 dot: null },
    { value: 'new',        label: ORDER_STATUS_LABELS.new,        dot: 'bg-blue-500' },
    { value: 'confirmed',  label: ORDER_STATUS_LABELS.confirmed,  dot: 'bg-emerald-500' },
    { value: 'assembling', label: ORDER_STATUS_LABELS.assembling, dot: 'bg-amber-500' },
    { value: 'shipped',    label: ORDER_STATUS_LABELS.shipped,    dot: 'bg-violet-500' },
    { value: 'delivered',  label: ORDER_STATUS_LABELS.delivered,  dot: 'bg-zinc-400' },
    { value: 'cancelled',  label: ORDER_STATUS_LABELS.cancelled,  dot: 'bg-rose-500' },
]

const selected = computed(() => OPTIONS.find(o => o.value === props.modelValue) ?? OPTIONS[0])

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref({ top: '0px', left: '0px', minWidth: '0px' })

function reposition() {
    const r = triggerRef.value?.getBoundingClientRect()
    if (!r) return
    const w = Math.max(r.width, 200)
    let left = r.left
    if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8
    dropdownStyle.value = {
        top: (r.bottom + 6) + 'px',
        left: left + 'px',
        minWidth: w + 'px',
    }
}

function toggle() {
    if (isOpen.value) {
        isOpen.value = false
        return
    }
    reposition()
    isOpen.value = true
}

function pick(v: OrderStatus | '') {
    emit('update:modelValue', v)
    isOpen.value = false
}

function onDocMouseDown(e: MouseEvent) {
    if (!isOpen.value) return
    const t = e.target as Node
    if (triggerRef.value?.contains(t) || dropdownRef.value?.contains(t)) return
    isOpen.value = false
}

watch(isOpen, (v) => {
    if (!import.meta.client) return
    if (v) {
        window.addEventListener('scroll', reposition, true)
        window.addEventListener('resize', reposition)
    } else {
        window.removeEventListener('scroll', reposition, true)
        window.removeEventListener('resize', reposition)
    }
})

onMounted(() => document.addEventListener('mousedown', onDocMouseDown))
onBeforeUnmount(() => {
    document.removeEventListener('mousedown', onDocMouseDown)
    window.removeEventListener('scroll', reposition, true)
    window.removeEventListener('resize', reposition)
})
</script>

<template>
    <div class="relative w-full">
        <button
            ref="triggerRef"
            type="button"
            class="w-full inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-white text-[13px] text-[#1A1A1A] transition-colors"
            :class="isOpen ? 'border-[#1A1A1A] ring-2 ring-[#1A1A1A]/10' : 'border-[#E8E6E0] hover:border-[#1A1A1A]'"
            @click="toggle"
        >
            <span v-if="selected.dot" class="w-2 h-2 rounded-full shrink-0" :class="selected.dot" />
            <svg v-else class="w-3.5 h-3.5 text-[#888] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M6 12h12M10 18h4" />
            </svg>
            <span class="flex-1 text-left truncate">{{ selected.label }}</span>
            <svg class="w-3 h-3 text-[#888] shrink-0 transition-transform" :class="isOpen ? 'rotate-180' : ''" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 4.5L6 7.5L9 4.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        </button>

        <Teleport to="body">
            <Transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-1"
            >
                <div
                    v-if="isOpen"
                    ref="dropdownRef"
                    :style="dropdownStyle"
                    class="fixed z-[100] bg-white border border-[#E8E6E0] rounded-xl shadow-xl overflow-hidden py-1 max-h-80 overflow-y-auto"
                    @click.stop
                >
                    <button
                        v-for="opt in OPTIONS"
                        :key="opt.value"
                        type="button"
                        class="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#FAFAF8] transition-colors"
                        :class="opt.value === modelValue ? 'bg-[#FAFAF8]' : ''"
                        @click="pick(opt.value)"
                    >
                        <svg v-if="opt.value === modelValue" class="w-3.5 h-3.5 text-[#1A1A1A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span v-else class="w-3.5 h-3.5 shrink-0" />
                        <span v-if="opt.dot" class="w-1.5 h-1.5 rounded-full shrink-0" :class="opt.dot" />
                        <span v-else class="w-1.5 h-1.5 shrink-0" />
                        <span class="text-[#1A1A1A] font-medium">{{ opt.label }}</span>
                    </button>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>