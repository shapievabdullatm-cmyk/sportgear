<script setup lang="ts">
import { ORDER_STATUS_LABELS, type OrderStatus } from '~/types/order'

const props = defineProps<{
    modelValue: OrderStatus
    loading?: boolean
    disabled?: boolean
    size?: 'sm' | 'md'
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', s: OrderStatus): void
    (e: 'change', s: OrderStatus): void
}>()

interface Meta { label: string; dot: string; pill: string }

const STATUS_META: Record<OrderStatus, Meta> = {
    new:        { label: ORDER_STATUS_LABELS.new,        dot: 'bg-blue-500',    pill: 'bg-blue-50 text-blue-700 border-blue-200' },
    confirmed:  { label: ORDER_STATUS_LABELS.confirmed,  dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    assembling: { label: ORDER_STATUS_LABELS.assembling, dot: 'bg-amber-500',   pill: 'bg-amber-50 text-amber-700 border-amber-200' },
    packed:     { label: ORDER_STATUS_LABELS.packed,     dot: 'bg-teal-500',    pill: 'bg-teal-50 text-teal-700 border-teal-200' },
    shipped:    { label: ORDER_STATUS_LABELS.shipped,    dot: 'bg-violet-500',  pill: 'bg-violet-50 text-violet-700 border-violet-200' },
    delivered:  { label: ORDER_STATUS_LABELS.delivered,  dot: 'bg-zinc-400',    pill: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
    cancelled:  { label: ORDER_STATUS_LABELS.cancelled,  dot: 'bg-rose-500',    pill: 'bg-rose-50 text-rose-700 border-rose-200' },
}

function transitionsFor(s: OrderStatus): OrderStatus[] {
    switch (s) {
        case 'new':        return ['confirmed', 'cancelled']
        case 'confirmed':  return ['assembling', 'cancelled']
        case 'assembling': return ['packed', 'cancelled']
        case 'packed':     return ['shipped', 'assembling', 'cancelled']
        case 'shipped':    return ['delivered', 'cancelled']
        default:           return []
    }
}

const allowed = computed(() => transitionsFor(props.modelValue))
const meta = computed(() => STATUS_META[props.modelValue])
const interactive = computed(() => !props.disabled && allowed.value.length > 0)

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref({ top: '0px', left: '0px', minWidth: '0px' })

function reposition() {
    const r = triggerRef.value?.getBoundingClientRect()
    if (!r) return
    const dropdownWidth = Math.max(r.width, 200)
    let left = r.left
    if (left + dropdownWidth > window.innerWidth - 8) {
        left = window.innerWidth - dropdownWidth - 8
    }
    dropdownStyle.value = {
        top: (r.bottom + 6) + 'px',
        left: left + 'px',
        minWidth: dropdownWidth + 'px',
    }
}

function toggle(e: Event) {
    e.stopPropagation()
    if (!interactive.value || props.loading) return
    if (isOpen.value) {
        isOpen.value = false
        return
    }
    reposition()
    isOpen.value = true
}

function select(s: OrderStatus, e: Event) {
    e.stopPropagation()
    isOpen.value = false
    emit('update:modelValue', s)
    emit('change', s)
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

const sizeClasses = computed(() => props.size === 'md'
    ? 'px-3 py-1.5 text-[12px]'
    : 'px-2.5 py-1 text-[11px]'
)
</script>

<template>
    <div class="relative inline-block" @click.stop>
        <button
            ref="triggerRef"
            type="button"
            :disabled="!interactive || loading"
            class="inline-flex items-center gap-1.5 rounded-full font-semibold border transition-all"
            :class="[
                meta.pill,
                sizeClasses,
                interactive ? 'cursor-pointer hover:shadow-sm hover:brightness-[0.97]' : 'cursor-default',
                loading ? 'opacity-70' : '',
            ]"
            @click="toggle"
        >
            <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="meta.dot" />
            <span>{{ meta.label }}</span>
            <svg v-if="interactive && !loading" class="w-3 h-3 opacity-60 transition-transform" :class="isOpen ? 'rotate-180' : ''" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 4.5L6 7.5L9 4.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg v-if="loading" class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M12 2 A 10 10 0 0 1 22 12" stroke-linecap="round" />
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
                    class="fixed z-[100] bg-white border border-[#E8E6E0] rounded-xl shadow-xl overflow-hidden"
                    @click.stop
                >
                    <div class="px-3 pt-2 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-[#999]">
                        Сменить на
                    </div>
                    <button
                        v-for="s in allowed"
                        :key="s"
                        type="button"
                        class="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left hover:bg-[#FAFAF8] transition-colors"
                        @click="select(s, $event)"
                    >
                        <span class="w-2 h-2 rounded-full shrink-0" :class="STATUS_META[s].dot" />
                        <span class="text-[#1A1A1A] font-medium">{{ STATUS_META[s].label }}</span>
                    </button>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>