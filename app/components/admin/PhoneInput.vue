<template>
  <input
      :value="display"
      type="tel"
      inputmode="tel"
      placeholder="+7 (___) ___-__-__"
      :class="inputClass"
      @input="onInput"
      @keydown="onKeydown"
      @paste="onPaste"
      @focus="onFocus"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string | null
  inputClass?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const digits = ref('')

function extractDigits(raw: string | null | undefined): string {
  if (!raw) return ''
  // Если строка уже с префиксом "+7" — берём только хвост,
  // иначе emit/watch цикл дублировал бы семёрку.
  if (raw.startsWith('+7')) {
    return raw.slice(2).replace(/\D+/g, '').slice(0, 10)
  }
  let d = raw.replace(/\D+/g, '')
  // 11 цифр с национальным префиксом 7 или 8 — режем первый знак
  if (d.length === 11 && (d[0] === '7' || d[0] === '8')) d = d.slice(1)
  return d.slice(0, 10)
}

watch(
    () => props.modelValue,
    (v) => { digits.value = extractDigits(v) },
    { immediate: true }
)

const display = computed(() => {
  const d = digits.value
  if (!d) return ''
  let out = '+7 ('
  out += d.slice(0, 3)
  if (d.length >= 3) out += ')'
  if (d.length > 3) out += ' ' + d.slice(3, 6)
  if (d.length > 6) out += '-' + d.slice(6, 8)
  if (d.length > 8) out += '-' + d.slice(8, 10)
  return out
})

function emitChange() {
  emit('update:modelValue', digits.value ? '+7' + digits.value : '')
}

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  digits.value = extractDigits(v)
  emitChange()
}

function onKeydown(e: KeyboardEvent) {
  // Backspace — стираем последнюю цифру
  if (e.key === 'Backspace') {
    if (digits.value.length > 0) {
      e.preventDefault()
      digits.value = digits.value.slice(0, -1)
      emitChange()
    }
  }
  // Запрещаем буквы и спецсимволы (кроме навигации и системных)
  if (
      e.key.length === 1 &&
      !/[0-9]/.test(e.key) &&
      !e.ctrlKey && !e.metaKey
  ) {
    e.preventDefault()
  }
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text') ?? ''
  digits.value = extractDigits(text)
  emitChange()
}

function onFocus(e: FocusEvent) {
  // при фокусе на пустое поле — ставим курсор в конец
  const el = e.target as HTMLInputElement
  setTimeout(() => {
    const pos = el.value.length
    el.setSelectionRange(pos, pos)
  }, 0)
}
</script>