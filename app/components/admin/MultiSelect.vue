<template>
  <div class="relative">
    <!-- Selected chips -->
    <div v-if="selectedOptions.length" class="flex flex-wrap gap-1.5 mb-2">
      <button
          v-for="option in selectedOptions"
          :key="option.value"
          @click.prevent="removeOption(option.value)"
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#1A1A1A] text-white text-[11px] font-medium hover:bg-[#333] transition-colors"
      >
        <span
            v-if="showColors && option.color"
            class="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
            :style="{ background: option.color }"
        />
        {{ option.label }}
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Search input -->
    <input
        v-model="searchQuery"
        @focus="isOpen = true"
        @blur="onBlur"
        :placeholder="placeholder"
        class="field-input"
        type="text"
    />

    <!-- Dropdown -->
    <ul
        v-if="isOpen && availableOptions.length"
        class="absolute z-30 mt-1 w-full bg-white border border-[#E8E6E0] rounded-xl shadow-xl max-h-56 overflow-y-auto"
    >
      <li
          v-for="option in availableOptions"
          :key="option.value"
          @mousedown.prevent="toggleOption(option.value)"
          class="px-3.5 py-2.5 text-[13px] text-[#1A1A1A] hover:bg-[#F5F4F0] cursor-pointer transition-colors flex items-center justify-between"
      >
        <span class="flex items-center gap-2">
          <span
              v-if="showColors && option.color"
              class="w-4 h-4 rounded-full border-2 border-black/10 shrink-0"
              :style="{ background: option.color }"
          />
          {{ option.label }}
        </span>
        <svg v-if="isSelected(option.value)" class="w-4 h-4 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
interface Option {
  value: number | string
  label: string
  color?: string  // Опциональное поле для цвета
}

interface Props {
  modelValue: (number | string)[]
  options: Option[]
  placeholder?: string
  showColors?: boolean  // Показывать ли цветовые круги
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Начните вводить для поиска...',
  showColors: false
})

const emit = defineEmits<{
  'update:modelValue': [value: (number | string)[]]
}>()

const searchQuery = ref('')
const isOpen = ref(false)

const selectedOptions = computed(() => {
  return props.options.filter(opt => props.modelValue.includes(opt.value))
})

const availableOptions = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const filtered = query
      ? props.options.filter(opt => opt.label.toLowerCase().includes(query))
      : props.options

  // Показываем все опции, но выделяем выбранные
  return filtered
})

function isSelected(value: number | string): boolean {
  return props.modelValue.includes(value)
}

function toggleOption(value: number | string) {
  const newValue = [...props.modelValue]
  const index = newValue.indexOf(value)

  if (index === -1) {
    newValue.push(value)
  } else {
    newValue.splice(index, 1)
  }

  emit('update:modelValue', newValue)
  searchQuery.value = ''
}

function removeOption(value: number | string) {
  const newValue = props.modelValue.filter(v => v !== value)
  emit('update:modelValue', newValue)
}

function onBlur() {
  setTimeout(() => {
    isOpen.value = false
  }, 160)
}
</script>

<style scoped>
.field-input {
  @apply w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors;
}
</style>