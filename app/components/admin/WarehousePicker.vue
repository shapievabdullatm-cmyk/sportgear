<script setup lang="ts">
interface Warehouse { id: number; title: string }
interface Stock { warehouse_id: number; quantity: number; reserved_quantity: number }

const props = defineProps<{
    modelValue: number | null
    warehouses: Warehouse[]
    stocks?: Stock[]
    quantity?: number
    loading?: boolean
    disabled?: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', id: number): void
    (e: 'change', id: number): void
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref({ top: '0px', left: '0px', minWidth: '0px' })

const selected = computed(() => props.warehouses.find(w => w.id === props.modelValue) ?? null)

function availableAt(id: number): number | null {
    const s = props.stocks?.find(s => s.warehouse_id === id)
    return s ? Math.max(0, s.quantity - s.reserved_quantity) : null
}

function reposition() {
    const r = triggerRef.value?.getBoundingClientRect()
    if (!r) return
    const w = Math.max(r.width, 240)
    let left = r.left
    if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8
    dropdownStyle.value = {
        top: (r.bottom + 6) + 'px',
        left: left + 'px',
        minWidth: w + 'px',
    }
}

function toggle(e: Event) {
    e.stopPropagation()
    if (props.disabled || props.loading) return
    if (isOpen.value) {
        isOpen.value = false
        return
    }
    reposition()
    isOpen.value = true
}

function select(id: number, e: Event) {
    e.stopPropagation()
    isOpen.value = false
    if (id === props.modelValue) return
    emit('update:modelValue', id)
    emit('change', id)
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
    <div class="relative inline-block w-full sm:w-auto">
        <button
            ref="triggerRef"
            type="button"
            :disabled="disabled || loading"
            class="w-full sm:w-auto inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border bg-white text-[12px] text-[#1A1A1A] transition-colors min-w-[180px]"
            :class="[
                disabled
                    ? 'border-[#E8E6E0] bg-[#FAFAF8] text-[#999] cursor-not-allowed'
                    : 'border-[#E8E6E0] hover:border-[#1A1A1A]',
                isOpen ? 'border-[#1A1A1A] ring-2 ring-[#1A1A1A]/10' : '',
            ]"
            @click="toggle"
        >
            <svg class="w-3.5 h-3.5 shrink-0" :class="disabled ? 'text-[#C0BEB8]' : 'text-[#888]'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10m0-10L4 7" />
            </svg>
            <span class="flex-1 text-left truncate">
                <span v-if="selected">{{ selected.title }}</span>
                <span v-else class="text-[#999]">Не выбран</span>
            </span>
            <svg v-if="!loading" class="w-3 h-3 shrink-0 transition-transform" :class="[isOpen ? 'rotate-180' : '', disabled ? 'text-[#C0BEB8]' : 'text-[#888]']" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 4.5L6 7.5L9 4.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg v-else class="w-3 h-3 animate-spin shrink-0 text-[#888]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
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
                    class="fixed z-[100] bg-white border border-[#E8E6E0] rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto py-1"
                    @click.stop
                >
                    <div v-if="!warehouses.length" class="px-3 py-3 text-[11px] text-[#888] text-center">
                        Нет складов
                    </div>
                    <button
                        v-for="w in warehouses"
                        :key="w.id"
                        type="button"
                        class="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#FAFAF8] transition-colors"
                        :class="w.id === modelValue ? 'bg-[#FAFAF8]' : ''"
                        @click="select(w.id, $event)"
                    >
                        <svg v-if="w.id === modelValue" class="w-3.5 h-3.5 text-[#1A1A1A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span v-else class="w-3.5 h-3.5 shrink-0" />
                        <span class="flex-1 text-left truncate text-[#1A1A1A]">{{ w.title }}</span>
                        <template v-if="availableAt(w.id) !== null">
                            <span
                                class="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                                :class="(availableAt(w.id) ?? 0) >= (quantity ?? 1)
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'"
                                :title="`Доступно на складе: ${availableAt(w.id)}`"
                            >{{ availableAt(w.id) }} шт</span>
                        </template>
                    </button>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>