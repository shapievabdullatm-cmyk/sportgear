<template>
  <div class="space-y-4">
    <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">SEO</label>

    <div class="space-y-1.5">
      <label class="field-label">Мета заголовок</label>
      <input
        :value="modelValue.meta_title"
        @input="updateField('meta_title', ($event.target as HTMLInputElement).value)"
        type="text"
        placeholder="Мета заголовок (до 255 символов)"
        class="field-input"
      />
    </div>

    <div class="space-y-1.5">
      <label class="field-label">Мета описание</label>
      <textarea
        :value="modelValue.meta_description"
        @input="updateField('meta_description', ($event.target as HTMLTextAreaElement).value)"
        rows="2"
        placeholder="Мета описание"
        class="field-input resize-none"
      />
    </div>

    <div class="space-y-1.5">
      <label class="field-label">Ключевые слова</label>
      <div class="field-input min-h-[68px] flex flex-wrap gap-2 items-center">
        <div
          v-for="(keyword, index) in keywords"
          :key="index"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F4F0] border border-[#E8E6E0] rounded-lg text-[13px] text-[#1A1A1A]"
        >
          <span>{{ keyword }}</span>
          <button
            @click="removeKeyword(index)"
            type="button"
            class="text-[#C0BEB8] hover:text-[#1A1A1A] transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <input
          v-model="keywordInput"
          @keydown="handleKeywordInput"
          @input="handleKeywordChange"
          type="text"
          placeholder="Введите ключевое слово и нажмите запятую"
          class="flex-1 min-w-[200px] bg-transparent outline-none text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SeoData {
  meta_title: string
  meta_description: string
  meta_keywords: string
}

interface Props {
  modelValue: SeoData
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: SeoData]
}>()

const keywordInput = ref('')

const keywords = computed(() => {
  return props.modelValue.meta_keywords
    ? props.modelValue.meta_keywords.split(',').map(k => k.trim()).filter(k => k)
    : []
})

function updateField(field: keyof SeoData, value: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

function handleKeywordInput(e: KeyboardEvent) {
  if (e.key === ',' || e.key === 'Enter') {
    e.preventDefault()
    const value = keywordInput.value.trim()
    if (value) {
      const newKeywords = [...keywords.value, value]
      updateField('meta_keywords', newKeywords.join(', '))
      keywordInput.value = ''
    }
  }
}

function handleKeywordChange(e: Event) {
  const input = e.target as HTMLInputElement
  const value = input.value

  // Если введена запятая, добавляем ключевое слово
  if (value.includes(',')) {
    const parts = value.split(',')
    const keyword = parts[0].trim()

    if (keyword) {
      const newKeywords = [...keywords.value, keyword]
      updateField('meta_keywords', newKeywords.join(', '))
    }

    keywordInput.value = ''
  }
}

function removeKeyword(index: number) {
  const newKeywords = keywords.value.filter((_, i) => i !== index)
  updateField('meta_keywords', newKeywords.join(', '))
}
</script>

<style scoped>
.field-label {
  @apply block text-[11px] text-[#ABABAB];
}

.field-input {
  @apply w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150;
}
</style>
