<template>
  <div v-if="sizeTable" class="bg-white border border-[#E8E6E0] rounded-xl p-5">
    <h3 class="text-[14px] font-semibold text-[#1A1A1A] mb-4">{{ sizeTable.name }}</h3>

    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b-2 border-[#1A1A1A]">
            <th
              v-for="(header, index) in sizeTable.headers"
              :key="`header-${index}`"
              class="px-4 py-3 text-left text-[12px] font-semibold text-[#1A1A1A] uppercase tracking-wide"
            >
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in sizeTable.rows"
            :key="`row-${rowIndex}`"
            class="border-b border-[#E8E6E0] last:border-0 hover:bg-[#FAFAF8] transition-colors"
          >
            <td
              v-for="(cell, cellIndex) in row.cells"
              :key="`cell-${rowIndex}-${cellIndex}`"
              class="px-4 py-3 text-[13px] text-[#1A1A1A]"
              :class="cellIndex === 0 ? 'font-medium' : ''"
            >
              {{ cell }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SizeTable } from '~/types/sizeTable'

defineProps<{
  sizeTable: SizeTable | null
}>()
</script>