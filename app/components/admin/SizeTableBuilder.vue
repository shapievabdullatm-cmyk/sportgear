<template>
  <div class="space-y-4">
    <!-- Table Name -->
    <div>
      <label class="block text-[13px] font-medium text-[#1A1A1A] mb-2">
        Название таблицы <span class="text-red-500">*</span>
      </label>
      <input
        v-model="localTable.name"
        type="text"
        placeholder="Например: Таблица размеров одежды"
        class="w-full bg-white border border-[#E8E6E0] rounded-xl px-4 py-2.5 text-[13px] placeholder-[#C0BEB8] focus:outline-none focus:border-[#1A1A1A] transition-colors"
      />
    </div>

    <!-- Headers -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="text-[13px] font-medium text-[#1A1A1A]">
          Заголовки колонок
        </label>
        <button
          @click="addColumn"
          type="button"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F0EEE9] text-[#1A1A1A] text-[12px] font-medium hover:bg-[#E8E6E0] transition-colors"
        >
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Добавить колонку
        </button>
      </div>
      <div class="flex gap-2 flex-wrap">
        <div
          v-for="(header, index) in localTable.headers"
          :key="`header-${index}`"
          class="flex items-center gap-2 bg-white border border-[#E8E6E0] rounded-lg px-3 py-2"
        >
          <input
            v-model="localTable.headers[index]"
            type="text"
            :placeholder="`Колонка ${index + 1}`"
            class="w-32 bg-transparent text-[13px] focus:outline-none"
          />
          <button
            @click="removeColumn(index)"
            type="button"
            class="text-[#C0BEB8] hover:text-red-500 transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Table Preview -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="text-[13px] font-medium text-[#1A1A1A]">
          Данные таблицы
        </label>
        <button
          @click="addRow"
          type="button"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F0EEE9] text-[#1A1A1A] text-[12px] font-medium hover:bg-[#E8E6E0] transition-colors"
        >
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Добавить строку
        </button>
      </div>

      <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse min-w-[600px]">
            <thead>
              <tr class="bg-[#FAFAF8] border-b border-[#E8E6E0]">
                <th class="px-4 py-3 text-left text-[11px] font-semibold text-[#888] uppercase tracking-wide w-12">
                  #
                </th>
                <th
                  v-for="(header, index) in localTable.headers"
                  :key="`th-${index}`"
                  class="px-4 py-3 text-left text-[11px] font-semibold text-[#888] uppercase tracking-wide"
                >
                  {{ header || `Колонка ${index + 1}` }}
                </th>
                <th class="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, rowIndex) in localTable.rows"
                :key="`row-${rowIndex}`"
                class="border-b border-[#F0EEE9] last:border-0 hover:bg-[#FAFAF8] transition-colors"
              >
                <td class="px-4 py-3 text-[11px] text-[#C0BEB8] font-mono">
                  {{ rowIndex + 1 }}
                </td>
                <td
                  v-for="(cell, cellIndex) in row.cells"
                  :key="`cell-${rowIndex}-${cellIndex}`"
                  class="px-4 py-3"
                >
                  <input
                    v-model="row.cells[cellIndex]"
                    type="text"
                    :placeholder="`Значение`"
                    class="w-full bg-transparent border-b border-transparent text-[13px] focus:outline-none focus:border-[#1A1A1A] transition-colors py-1"
                  />
                </td>
                <td class="px-4 py-3">
                  <button
                    @click="removeRow(rowIndex)"
                    type="button"
                    class="text-[#C0BEB8] hover:text-red-500 transition-colors"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/>
                      <path d="M14 11v6"/>
                    </svg>
                  </button>
                </td>
              </tr>
              <tr v-if="!localTable.rows.length">
                <td :colspan="localTable.headers.length + 2" class="px-4 py-8 text-center text-[13px] text-[#C0BEB8]">
                  Нет строк. Нажмите "Добавить строку" чтобы начать.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Status -->
    <div class="flex items-center gap-3">
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          v-model="localTable.is_active"
          type="checkbox"
          class="sr-only peer"
        />
        <div class="w-9 h-5 bg-[#E8E6E0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1A1A1A]"></div>
      </label>
      <span class="text-[13px] text-[#1A1A1A]">Активна</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SizeTableFormData, SizeTableRow } from '~/types/sizeTable'

const props = defineProps<{
  modelValue: SizeTableFormData
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SizeTableFormData]
}>()

const localTable = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const addColumn = () => {
  localTable.value.headers.push('')
  // Add empty cell to all existing rows
  localTable.value.rows.forEach(row => {
    row.cells.push('')
  })
}

const removeColumn = (index: number) => {
  if (localTable.value.headers.length <= 1) {
    alert('Должна быть хотя бы одна колонка')
    return
  }
  localTable.value.headers.splice(index, 1)
  // Remove cell from all rows
  localTable.value.rows.forEach(row => {
    row.cells.splice(index, 1)
  })
}

const addRow = () => {
  const newRow: SizeTableRow = {
    cells: new Array(localTable.value.headers.length).fill('')
  }
  localTable.value.rows.push(newRow)
}

const removeRow = (index: number) => {
  localTable.value.rows.splice(index, 1)
}
</script>