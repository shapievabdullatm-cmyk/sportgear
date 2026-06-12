<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBrandOriginStore } from '~/stores/admin/brand-origin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const router = useRouter()
const route = useRoute()
const store = useBrandOriginStore()

const id = computed(() => Number(route.params.id))
const form = reactive({ name: '', slug: '' })
const flagFile = ref(null)
const flagPreview = ref(null)
const existingFlagUrl = ref(null)
const errors = ref({})
const submitting = ref(false)
const loading = ref(true)
const fileInput = ref(null)
const isDragging = ref(false)

const isFormValid = computed(() => !!form.name.trim())

const ALLOWED = ['image/jpeg', 'image/png', 'image/svg+xml']
const MAX_MB = 2

onMounted(async () => {
  try {
    const { $api } = useApi()
    const data = await $api(`/admin/brand-origins/${id.value}`)
    const origin = data.data || data
    form.name = origin.name
    form.slug = origin.slug || ''
    existingFlagUrl.value = origin.flag_url
    if (origin.flag_url) {
      flagPreview.value = origin.flag_url
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

function validateFile(file) {
  if (!ALLOWED.includes(file.type)) {
    errors.value.flag = 'Допустимые форматы: JPG, PNG, SVG'
    return false
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    errors.value.flag = `Файл не должен превышать ${MAX_MB} МБ`
    return false
  }
  return true
}

function handleFlagChange(e) {
  const file = e.target.files[0]
  if (file && validateFile(file)) {
    flagFile.value = file
    flagPreview.value = URL.createObjectURL(file)
    if (errors.value.flag) delete errors.value.flag
  }
}

function removeFlag() {
  flagFile.value = null
  flagPreview.value = null
  existingFlagUrl.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function changeFlag() {
  fileInput.value?.click()
}

function onDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isDragging.value = false
  }
}

function onDrop(e) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && validateFile(file)) {
    flagFile.value = file
    flagPreview.value = URL.createObjectURL(file)
    if (errors.value.flag) delete errors.value.flag
  }
}

async function save() {
  if (!isFormValid.value || submitting.value) return
  errors.value = {}
  submitting.value = true

  const fd = new FormData()
  fd.append('name', form.name)
  if (form.slug) fd.append('slug', form.slug)
  fd.append('_method', 'PUT')
  if (flagFile.value) fd.append('flag', flagFile.value)

  try {
    await store.update(id.value, fd)
    router.push('/admin/brand-origins')
  } catch (e) {
    const data = e?.data ?? e?.response?._data
    if (data?.errors) errors.value = Object.fromEntries(
        Object.entries(data.errors).map(([k, v]) => [k, v[0]])
    )
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink
            to="/admin/brand-origins"
            class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </NuxtLink>
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Редактировать родину бренда</h1>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-5 h-5 border-2 border-[#E8E6E0] border-t-[#1A1A1A] rounded-full animate-spin" />
    </div>

    <!-- Form card -->
    <div v-else class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden w-full sm:max-w-lg">

      <!-- Flag upload -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Флаг <span class="normal-case tracking-normal text-[#C0BEB8]">(JPG, PNG, SVG · до 2 МБ)</span>
        </label>

        <!-- Preview -->
        <div v-if="flagPreview" class="relative w-full rounded-lg overflow-hidden bg-[#F0EEE9] mb-2 flex items-center justify-center p-4 group" style="aspect-ratio:2/1">
          <img :src="flagPreview" alt="preview" class="max-w-full max-h-full object-contain" />

          <!-- Change button -->
          <button
              type="button"
              @click="changeFlag"
              class="absolute top-2 right-10 w-7 h-7 flex items-center justify-center rounded-md bg-white/90 text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity"
              title="Заменить"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </button>

          <!-- Remove button -->
          <button
              type="button"
              @click="removeFlag"
              class="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-md bg-black/40 text-white hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
              title="Удалить"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Drop zone -->
        <div
            v-else
            role="button"
            tabindex="0"
            class="w-full rounded-lg border-2 border-dashed bg-[#FAFAF8] transition-colors duration-150 flex flex-col items-center justify-center gap-2 cursor-pointer select-none py-8 sm:py-10 px-4 text-center"
            :class="[
              isDragging
                ? 'border-[#1A1A1A] bg-[#F0EEE9] text-[#1A1A1A]'
                : errors.flag
                  ? 'border-red-300 bg-red-50 text-red-400'
                  : 'border-[#E8E6E0] text-[#C0BEB8] hover:border-[#1A1A1A] hover:bg-white hover:text-[#888]'
            ]"
            @click="fileInput.click()"
            @keydown.enter.space.prevent="fileInput.click()"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
        >
          <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
               :class="isDragging ? 'bg-[#1A1A1A]/10' : 'bg-[#F0EEE9]'">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div>
            <p class="text-[13px] font-medium">
              {{ isDragging ? 'Отпустите файл' : 'Перетащите или нажмите для выбора' }}
            </p>
            <p class="text-[11px] mt-0.5 opacity-70">JPG, PNG, SVG — до 2 МБ</p>
          </div>
        </div>

        <input ref="fileInput" type="file" accept="image/jpg,image/jpeg,image/png,image/svg+xml" class="hidden" @change="handleFlagChange" />
        <p v-if="errors.flag" class="mt-1.5 text-[11px] text-red-400">{{ errors.flag }}</p>
      </div>

      <!-- Name -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Название <span class="text-red-400">*</span>
        </label>
        <input
            v-model="form.name"
            type="text"
            placeholder="Введите название страны"
            maxlength="255"
            class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
            :class="{ 'border-red-300 bg-red-50': errors.name }"
        />
        <p v-if="errors.name" class="mt-1 text-[11px] text-red-400">{{ errors.name }}</p>
      </div>

      <!-- Slug -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Slug <span class="normal-case tracking-normal text-[#C0BEB8]">(оставьте пустым для автогенерации)</span>
        </label>
        <input
            v-model="form.slug"
            type="text"
            placeholder="Автоматически из названия"
            maxlength="255"
            class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150 font-mono"
            :class="{ 'border-red-300 bg-red-50': errors.slug }"
        />
        <p v-if="errors.slug" class="mt-1 text-[11px] text-red-400">{{ errors.slug }}</p>
      </div>

      <!-- Actions -->
      <div class="px-4 sm:px-5 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <NuxtLink
            to="/admin/brand-origins"
            class="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-[13px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors duration-150"
        >
          Отмена
        </NuxtLink>
        <button
            :disabled="!isFormValid || submitting"
            class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-colors duration-150"
            :class="isFormValid && !submitting
                        ? 'bg-[#1A1A1A] text-white hover:bg-[#333] cursor-pointer'
                        : 'bg-[#F0EEE9] text-[#C0BEB8] cursor-not-allowed'"
            @click="save"
        >
          <div v-if="submitting" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {{ submitting ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>
  </div>
</template>