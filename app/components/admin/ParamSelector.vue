<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

    <!-- Available params -->
    <div class="border border-[#E8E6E0] rounded-lg overflow-hidden">
      <div class="p-2 border-b border-[#F0EEE9] bg-[#FAFAF8]">
        <input
            v-model="search"
            type="text"
            placeholder="Поиск атрибута..."
            class="w-full px-3 py-2 rounded-md border border-[#E8E6E0] bg-white text-[12px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] transition-colors"
        />
      </div>
      <div class="max-h-64 overflow-y-auto divide-y divide-[#F0EEE9]">
        <label
            v-for="param in filteredParams"
            :key="param.id"
            class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#FAFAF8] transition-colors"
        >
          <div
              @click.prevent="toggleParam(param.id, !selectedParamIdsSet.has(param.id))"
              class="w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors cursor-pointer"
              :class="selectedParamIdsSet.has(param.id) ? 'bg-[#1A1A1A] border-[#1A1A1A]' : 'border-[#C0BEB8] bg-white'"
          >
            <svg v-if="selectedParamIdsSet.has(param.id)" class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span class="text-[13px] text-[#1A1A1A]">
            {{ param.title }}
            <span class="text-[#ABABAB] text-[11px]">({{ param.type_label }})</span>
          </span>
        </label>
        <div v-if="!filteredParams.length" class="px-4 py-8 text-center text-[12px] text-[#C0BEB8]">
          Ничего не найдено
        </div>
      </div>
    </div>

    <!-- Selected params -->
    <div class="border border-[#E8E6E0] rounded-lg overflow-hidden">
      <div class="px-4 py-2.5 bg-[#FAFAF8] border-b border-[#F0EEE9] text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">
        Выбранные
        <span class="normal-case tracking-normal font-normal text-[#C0BEB8] ml-1">
          {{ isMobile ? '(↑↓)' : '(перетащите)' }}
        </span>
      </div>

      <div v-if="selectedParamItems.length" class="max-h-64 overflow-y-auto divide-y divide-[#F0EEE9]">
        <div
            v-for="(item, index) in selectedParamItems"
            :key="item.id"
            class="flex items-center gap-2 px-4 py-2.5 group"
            :class="dragOver === index ? 'bg-[#F5F4F0]' : ''"
            :draggable="!isMobile"
            @dragstart="!isMobile && onDragStart(index)"
            @dragover.prevent="dragOver = index"
            @dragleave="dragOver = null"
            @drop="!isMobile && onDrop(index)"
        >
          <svg v-if="!isMobile" class="w-3.5 h-3.5 text-[#C0BEB8] cursor-grab shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="16" y2="6"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="8" y1="18" x2="16" y2="18"/>
          </svg>

          <span class="flex-1 text-[13px] text-[#1A1A1A] min-w-0 truncate">
            {{ paramById(item.id)?.title }}
            <span class="text-[#ABABAB] text-[11px]">({{ paramById(item.id)?.type_label }})</span>
          </span>

          <div v-if="isMobile" class="flex gap-0.5 shrink-0">
            <button type="button" @click="moveUp(index)" :disabled="index === 0" class="w-6 h-6 flex items-center justify-center rounded text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] disabled:opacity-30 transition-colors">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button type="button" @click="moveDown(index)" :disabled="index === selectedParamItems.length - 1" class="w-6 h-6 flex items-center justify-center rounded text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] disabled:opacity-30 transition-colors">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>

          <button type="button" @click="removeParam(item.id)" class="w-6 h-6 flex items-center justify-center rounded text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors shrink-0">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-else class="px-4 py-8 text-center text-[12px] text-[#C0BEB8]">
        Атрибуты не выбраны
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CategoryParam, ParamItem } from '~/stores/admin/category'

const props = defineProps<{
  params: CategoryParam[]
  modelValue: ParamItem[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ParamItem[]): void
}>()

const {
  search,
  dragOver,
  selectedParamItems,
  isMobile,
  selectedParamIdsSet,
  filteredParams,
  paramById,
  toggleParam,
  removeParam,
  onDragStart,
  onDrop,
  moveUp,
  moveDown,
} = useParamSelector(toRef(props, 'params'))

// Sync from parent (initial load / hydration)
watch(
    () => props.modelValue,
    (val) => {
      if (JSON.stringify(val) !== JSON.stringify(selectedParamItems.value)) {
        selectedParamItems.value = [...val]
      }
    },
    { immediate: true }
)

// Sync to parent on every change
watch(selectedParamItems, (val) => emit('update:modelValue', [...val]), { deep: true })
</script>