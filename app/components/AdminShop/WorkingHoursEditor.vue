<script setup lang="ts">
import { computed } from 'vue'
import type { WorkingHoursDay } from '~/stores/admin/shop'

interface Props {
  modelValue: WorkingHoursDay[] | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: WorkingHoursDay[]]
}>()

const DAYS = [
  { day: 1, short: 'Пн', full: 'Понедельник' },
  { day: 2, short: 'Вт', full: 'Вторник' },
  { day: 3, short: 'Ср', full: 'Среда' },
  { day: 4, short: 'Чт', full: 'Четверг' },
  { day: 5, short: 'Пт', full: 'Пятница' },
  { day: 6, short: 'Сб', full: 'Суббота' },
  { day: 7, short: 'Вс', full: 'Воскресенье' },
]

function defaultDay(dayNum: number): WorkingHoursDay {
  return {
    day: dayNum,
    is_open: true,
    open: '10:00',
    close: '22:00',
    break: [],
    note: null,
  }
}

const hours = computed<WorkingHoursDay[]>(() => {
  const existing = props.modelValue ?? []
  return DAYS.map(d => {
    const found = existing.find(h => h.day === d.day)
    return found ?? defaultDay(d.day)
  })
})

function emitDay(dayNum: number, patch: Partial<WorkingHoursDay>) {
  const next = hours.value.map(h =>
      h.day === dayNum ? { ...h, ...patch } : h
  )
  emit('update:modelValue', next)
}

function toggleOpen(dayNum: number, val: boolean) {
  emitDay(dayNum, val
      ? { is_open: true,  open: hours.value.find(h => h.day === dayNum)?.open ?? '10:00', close: hours.value.find(h => h.day === dayNum)?.close ?? '22:00' }
      : { is_open: false }
  )
}

function setBreakEnabled(dayNum: number, enabled: boolean) {
  if (enabled) {
    emitDay(dayNum, { break: [{ from: '14:00', to: '15:00' }] })
  } else {
    emitDay(dayNum, { break: [] })
  }
}

function setBreak(dayNum: number, field: 'from' | 'to', value: string) {
  const day = hours.value.find(h => h.day === dayNum)
  const current = day?.break?.[0] ?? { from: '14:00', to: '15:00' }
  emitDay(dayNum, { break: [{ ...current, [field]: value }] })
}

function applyToAll(sourceDayNum: number) {
  const src = hours.value.find(h => h.day === sourceDayNum)
  if (!src) return
  const next = hours.value.map(h => ({
    ...h,
    is_open: src.is_open,
    open: src.open,
    close: src.close,
    break: src.break ? [...src.break] : [],
  }))
  emit('update:modelValue', next)
}

function applyWeekdays(sourceDayNum: number) {
  const src = hours.value.find(h => h.day === sourceDayNum)
  if (!src) return
  const next = hours.value.map(h => h.day <= 5
      ? { ...h, is_open: src.is_open, open: src.open, close: src.close, break: src.break ? [...src.break] : [] }
      : h
  )
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="space-y-2">
    <div
        v-for="d in DAYS"
        :key="d.day"
        class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-lg bg-[#FAFAF8] border border-[#E8E6E0]"
    >
      <!-- Day label + toggle -->
      <div class="flex items-center gap-3 sm:w-40 shrink-0">
        <button
            type="button"
            @click="toggleOpen(d.day, !hours.find(h => h.day === d.day)?.is_open)"
            class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 shrink-0"
            :class="hours.find(h => h.day === d.day)?.is_open ? 'bg-[#1A1A1A]' : 'bg-[#E8E6E0]'"
        >
          <span
              class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200"
              :class="hours.find(h => h.day === d.day)?.is_open ? 'translate-x-[18px]' : 'translate-x-0.5'"
          />
        </button>
        <div class="text-[13px] font-medium text-[#1A1A1A] min-w-[28px]">{{ d.short }}</div>
        <div class="text-[11px] text-[#ABABAB] hidden sm:block">{{ d.full }}</div>
      </div>

      <!-- Time inputs / Closed -->
      <template v-if="hours.find(h => h.day === d.day)?.is_open">
        <div class="flex items-center gap-2 flex-1 flex-wrap">
          <input
              type="time"
              :value="hours.find(h => h.day === d.day)?.open || '10:00'"
              @input="emitDay(d.day, { open: ($event.target as HTMLInputElement).value })"
              class="time-input"
          />
          <span class="text-[12px] text-[#ABABAB]">—</span>
          <input
              type="time"
              :value="hours.find(h => h.day === d.day)?.close || '22:00'"
              @input="emitDay(d.day, { close: ($event.target as HTMLInputElement).value })"
              class="time-input"
          />

          <!-- Break -->
          <label class="inline-flex items-center gap-1.5 ml-1 cursor-pointer">
            <input
                type="checkbox"
                :checked="!!hours.find(h => h.day === d.day)?.break?.length"
                @change="setBreakEnabled(d.day, ($event.target as HTMLInputElement).checked)"
                class="rounded border-[#E8E6E0] text-[#1A1A1A] focus:ring-0 focus:ring-offset-0"
            />
            <span class="text-[12px] text-[#888]">перерыв</span>
          </label>
          <template v-if="hours.find(h => h.day === d.day)?.break?.length">
            <input
                type="time"
                :value="hours.find(h => h.day === d.day)?.break?.[0]?.from || '14:00'"
                @input="setBreak(d.day, 'from', ($event.target as HTMLInputElement).value)"
                class="time-input"
            />
            <span class="text-[12px] text-[#ABABAB]">—</span>
            <input
                type="time"
                :value="hours.find(h => h.day === d.day)?.break?.[0]?.to || '15:00'"
                @input="setBreak(d.day, 'to', ($event.target as HTMLInputElement).value)"
                class="time-input"
            />
          </template>

          <!-- Apply buttons -->
          <div class="ml-auto flex items-center gap-1.5">
            <button
                type="button"
                @click="applyWeekdays(d.day)"
                class="text-[10px] uppercase tracking-wider text-[#ABABAB] hover:text-[#1A1A1A] transition-colors"
                title="Применить это расписание ко всем будним дням (Пн–Пт)"
            >
              на будни
            </button>
            <span class="text-[10px] text-[#E8E6E0]">·</span>
            <button
                type="button"
                @click="applyToAll(d.day)"
                class="text-[10px] uppercase tracking-wider text-[#ABABAB] hover:text-[#1A1A1A] transition-colors"
                title="Применить это расписание ко всем дням недели"
            >
              на все
            </button>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="text-[12px] text-[#C0BEB8] italic flex-1">Выходной</div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.time-input {
  @apply px-2.5 py-1.5 rounded-md border border-[#E8E6E0] bg-white text-[12px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A] transition-colors font-mono w-[88px];
}
</style>