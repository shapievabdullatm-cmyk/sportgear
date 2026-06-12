<template>
  <div class="relative" ref="dropdownRef">
    <button
        type="button"
        @click="toggle"
        class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-left outline-none hover:border-[#C0BEB8] transition-colors duration-150"
        :class="open ? 'border-[#1A1A1A] bg-white' : ''"
    >
      <span :class="modelValue ? 'text-[#1A1A1A]' : 'text-[#C0BEB8]'">
        {{ selectedTitle ?? '— Без родителя —' }}
      </span>
      <svg
          class="w-3.5 h-3.5 shrink-0 text-[#ABABAB] transition-transform duration-150"
          :class="open ? 'rotate-180' : ''"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <Transition name="dropdown">
      <div v-if="open" class="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-[#E8E6E0] rounded-lg shadow-sm z-20 overflow-hidden">
        <div class="p-2 border-b border-[#F0EEE9]">
          <input
              v-model="search"
              type="text"
              placeholder="Поиск..."
              class="w-full px-3 py-2 rounded-md border border-[#E8E6E0] bg-[#FAFAF8] text-[12px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors"
          />
        </div>
        <div class="max-h-52 overflow-y-auto">
          <button
              type="button"
              @click="select(null)"
              class="dropdown-item w-full"
              :class="modelValue === null ? 'bg-[#F5F4F0] font-medium' : ''"
          >
            <span>— Без родителя —</span>
            <svg v-if="modelValue === null" class="w-3.5 h-3.5 shrink-0 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>

          <template v-if="filtered.length">
            <button
                v-for="c in filtered"
                :key="c.id"
                type="button"
                @click="select(c.id)"
                class="dropdown-item w-full"
                :class="modelValue === c.id ? 'bg-[#F5F4F0] font-medium' : ''"
            >
              <span>{{ c.title }}</span>
              <svg v-if="modelValue === c.id" class="w-3.5 h-3.5 shrink-0 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </template>
          <div v-else class="px-4 py-5 text-center text-[12px] text-[#C0BEB8]">Ничего не найдено</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Category } from '~/stores/admin/category'

const props = defineProps<{
  categories: Category[]
  modelValue: number | null
  excludeId?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

const selectedId = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const { open, search, dropdownRef, filtered, selectedTitle, toggle, select } =
    useParentDropdown(toRef(props, 'categories'), selectedId, props.excludeId)
</script>

<style scoped>
.dropdown-item {
  @apply flex items-center justify-between px-3.5 py-2.5 text-[13px] text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors duration-100 cursor-pointer;
}
.dropdown-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>