<template>
  <!-- Trigger Button -->
  <button
    v-if="sizeTable"
    @click="isOpen = true"
    class="size-table-trigger"
  >
    Таблица размеров
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  </button>

  <!-- Overlay -->
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="isOpen"
        @click="isOpen = false"
        class="drawer-overlay"
      />
    </Transition>
  </Teleport>

  <!-- Drawer -->
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isOpen" class="drawer">

        <!-- Close -->
        <button class="drawer-close" @click="isOpen = false" aria-label="Закрыть">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <!-- Title -->
        <h2 class="drawer-title">{{ sizeTable.name }}</h2>

        <!-- Table -->
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th
                  v-for="(header, index) in sizeTable.headers"
                  :key="index"
                >
                  <span class="th-main">{{ header }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, rowIndex) in sizeTable.rows"
                :key="rowIndex"
              >
                <td
                  v-for="(cell, cellIndex) in row.cells"
                  :key="cellIndex"
                  :class="{ 'td-first': cellIndex === 0 }"
                >
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { SizeTable } from '~/types/sizeTable'

defineProps<{
  sizeTable: SizeTable | null
}>()

const isOpen = ref(false)

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') isOpen.value = false
}

onMounted(() => document.addEventListener('keydown', handleEscape))
onUnmounted(() => document.removeEventListener('keydown', handleEscape))
</script>

<style scoped>
.size-table-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.2s;
}

.size-table-trigger:hover {
  color: #1a1a1a;
}

.size-table-trigger svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Overlay */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 1100;
}

/* Drawer panel */
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;
  max-width: 560px;
  background: #fff;
  z-index: 1101;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 32px 32px 48px;
  box-sizing: border-box;
}

.drawer-close {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f4f4;
  border: none;
  cursor: pointer;
  color: #666;
  border-radius: 50%;
  transition: background 0.2s, color 0.2s;
  padding: 0;
}

.drawer-close svg {
  width: 16px;
  height: 16px;
}

.drawer-close:hover {
  background: #1a1a1a;
  color: #fff;
}

.drawer-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 24px;
  padding-right: 44px;
  line-height: 1.3;
}

/* Table */
.table-wrap {
  overflow-x: auto;
  margin: 0 -4px;
  padding: 0 4px;
}

table {
  width: 100%;
  min-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

thead tr {
  border-bottom: 1px solid #e5e5e5;
}

th {
  padding: 10px 16px 10px 12px;
  text-align: left;
  font-weight: 400;
  vertical-align: bottom;
}

.th-main {
  display: block;
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
}

.th-unit {
  display: block;
  font-size: 10px;
  color: #999;
  font-weight: 400;
  letter-spacing: 0.05em;
  margin-top: 2px;
}

tbody tr {
  border-bottom: 1px solid #ebebeb;
  transition: background 0.15s;
}

tbody tr:last-child {
  border-bottom: none;
}

tbody tr:hover {
  background: #f5f5f5;
}

td {
  padding: 13px 16px 13px 12px;
  font-size: 14px;
  color: #1a1a1a;
  word-break: break-word;
}

.td-first {
  font-weight: 500;
}

/* Transitions */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>