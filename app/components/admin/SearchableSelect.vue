<template>
  <div class="relative">
    <input
        :value="isOpen ? searchQuery : selectedLabel"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        :placeholder="placeholder"
        class="field-input pr-8"
        type="text"
    />
    <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#C0BEB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <polyline points="6 9 12 15 18 9"/>
    </svg>

    <ul
        v-if="isOpen && filteredOptions.length"
        class="absolute z-30 mt-1 w-full bg-white border border-[#E8E6E0] rounded-xl shadow-xl max-h-56 overflow-y-auto"
    >
      <li
          v-for="option in filteredOptions"
          :key="option.value"
          @mousedown.prevent="selectOption(option)"
          class="px-3.5 py-2.5 text-[13px] text-[#1A1A1A] hover:bg-[#F5F4F0] cursor-pointer transition-colors flex items-center gap-2.5"
          :class="option.value === modelValue ? 'font-semibold bg-[#F5F4F0]' : ''"
      >
        <div
            v-if="option.color"
            class="w-5 h-5 rounded border border-[#E8E6E0] shrink-0"
            :style="{ background: option.color }"
        />
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
interface Option {
  value: number | string | null
  label: string
  color?: string
}

interface Props {
  modelValue: number | string | null
  options: Option[]
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Начните вводить...'
})

const emit = defineEmits<{
  'update:modelValue': [value: number | string | null]
}>()

const searchQuery = ref('')
const isOpen = ref(false)

const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue)
  return selected?.label ?? ''
})

const filteredOptions = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return query
      ? props.options.filter(opt => opt.label.toLowerCase().includes(query))
      : props.options
})

function selectOption(option: Option) {
  emit('update:modelValue', option.value)
  searchQuery.value = ''
  isOpen.value = false
}

function onFocus() {
  searchQuery.value = ''
  isOpen.value = true
}

function onInput(event: Event) {
  searchQuery.value = (event.target as HTMLInputElement).value
  isOpen.value = true
}

function onBlur() {
  setTimeout(() => {
    isOpen.value = false
    searchQuery.value = ''
  }, 160)
}
</script>

<style scoped>
.field-input {
  @apply w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors;
}

.field-input::placeholder {
  color: #6B6B6B;
  opacity: 1;
}
</style>