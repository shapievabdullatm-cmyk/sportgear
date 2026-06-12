<template>
  <div class="max-w-4xl space-y-6">
    <AdminAppToast
        :show="toast.show.value"
        :progress="toast.progress.value"
        title="Сохранено"
        subtitle="Категория успешно обновлена"
        @close="toast.close"
    />

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Редактирование категории</h1>
      <NuxtLink
          to="/admin/categories"
          class="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors duration-150"
      >
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Назад
      </NuxtLink>
    </div>

    <!-- Card -->
    <div v-if="store.currentCategory" class="bg-white border border-[#E8E6E0] rounded-xl p-6 space-y-5">

      <!-- Title -->
      <div class="space-y-1.5">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">Заголовок</label>
        <input
            v-model="form.title"
            type="text"
            placeholder="Введите заголовок"
            class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
        />
      </div>

      <!-- Parent -->
      <div class="space-y-1.5">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">Родительская категория</label>
        <AdminParentDropdown
            v-model="form.parent_id"
            :categories="store.availableCategories"
            :exclude-id="store.currentCategory.id"
        />
      </div>

      <div class="border-t border-[#F0EEE9]"></div>

      <!-- Image dropzone -->
      <div class="space-y-1.5">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">
          Фото категории
          <span class="normal-case tracking-normal text-[#C0BEB8]">(600×900 · JPG, PNG, WebP · до 5 МБ)</span>
        </label>

        <!-- Preview (новый файл или существующий) -->
        <div v-if="imagePreview" class="relative w-[120px] h-[180px] rounded-lg overflow-hidden border border-[#E8E6E0] group">
          <img :src="imagePreview" alt="preview" class="w-full h-full object-cover" />
          <button
              type="button"
              @click="removeImage"
              class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          >
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Dropzone (когда нет фото) -->
        <div
            v-else
            class="relative flex flex-col items-center justify-center gap-2 w-full h-36 rounded-lg border-2 border-dashed border-[#E8E6E0] bg-[#FAFAF8] hover:border-[#1A1A1A] hover:bg-white transition-colors duration-150 cursor-pointer"
            :class="{ 'border-[#1A1A1A] bg-white': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
            @click="fileInput?.click()"
        >
          <svg class="w-6 h-6 text-[#C0BEB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 10l-4-4m0 0L8 10m4-4v12"/>
          </svg>
          <span class="text-[12px] text-[#ABABAB]">Перетащите файл или <span class="text-[#1A1A1A] underline underline-offset-2">выберите</span></span>
          <input ref="fileInput" type="file" accept=".jpg,.jpeg,.png,.webp" class="hidden" @change="onFileChange" />
        </div>

        <p v-if="imageError" class="text-[11px] text-red-500">{{ imageError }}</p>
      </div>

      <div class="border-t border-[#F0EEE9]"></div>

      <!-- SEO -->
      <SeoFields v-model="seoData" />

      <div class="border-t border-[#F0EEE9]"></div>

      <!-- Params -->
      <div class="space-y-3">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">Атрибуты</label>
        <AdminParamSelector v-model="selectedParamItems" :params="store.availableParams" />
      </div>

      <div class="border-t border-[#F0EEE9]"></div>

      <!-- Save -->
      <div class="flex justify-end">
        <button
            type="button"
            :disabled="submitting"
            @click="submit"
            class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#333] transition-colors duration-150 disabled:opacity-50"
        >
          {{ submitting ? 'Сохранение...' : 'Сохранить изменения' }}
        </button>
      </div>
    </div>

    <div v-else-if="store.loading" class="text-center py-12 text-[13px] text-[#C0BEB8]">
      Загрузка...
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ParamItem } from '~/stores/admin/category'
import { useCategoryStore } from '~/stores/admin/category'
import SeoFields from '~/components/admin/SeoFields.vue'

definePageMeta({ layout: 'admin', middleware: 'admin', })

const route    = useRoute()
const store    = useCategoryStore()
const toast    = useToast()
const { $api } = useApi()

const id = Number(route.params.id)

await store.fetchEdit(id)

const submitting   = ref(false)
const isDragging   = ref(false)
const imageError   = ref<string | null>(null)
const imageFile    = ref<File | null>(null)     // новый файл для загрузки
const removeFlag   = ref(false)                 // явное удаление текущего фото
const fileInput    = ref<HTMLInputElement | null>(null)

// Показываем либо превью нового файла, либо существующее фото категории
const imagePreview = ref<string | null>(store.currentCategory?.image ?? null)

const form = reactive({
  title:            String(store.currentCategory?.title            ?? ''),
  parent_id:        (store.currentCategory?.parent_id              ?? null) as number | null,
  meta_title:       String(store.currentCategory?.meta_title       ?? ''),
  meta_description: String(store.currentCategory?.meta_description ?? ''),
  keywords:         String(store.currentCategory?.keywords         ?? ''),
})

// ── SEO data ──────────────────────────────────────────────────────────────────
const seoData = computed({
  get: () => ({
    meta_title: form.meta_title,
    meta_description: form.meta_description,
    meta_keywords: form.keywords,
  }),
  set: (val) => {
    form.meta_title = val.meta_title
    form.meta_description = val.meta_description
    form.keywords = val.meta_keywords
  }
})

const selectedParamItems = ref<ParamItem[]>(
    [...(store.currentCategory?.param_items ?? [])].sort((a, b) => a.sort - b.sort)
)

// ─── Image handling ───────────────────────────────────────────────────────────

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB  = 5

function validateAndSetFile(file: File) {
  imageError.value = null
  if (!ALLOWED.includes(file.type)) {
    imageError.value = 'Допустимые форматы: JPG, PNG, WebP'
    return
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    imageError.value = `Файл не должен превышать ${MAX_MB} МБ`
    return
  }
  removeFlag.value   = false
  imageFile.value    = file
  imagePreview.value = URL.createObjectURL(file)
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) validateAndSetFile(file)
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) validateAndSetFile(file)
}

function removeImage() {
  imageFile.value    = null
  imagePreview.value = null
  removeFlag.value   = true  // сообщаем бэкенду удалить текущее фото
  if (fileInput.value) fileInput.value.value = ''
}

// ─── Submit ───────────────────────────────────────────────────────────────────

async function submit() {
  if (!form.title.trim()) return
  submitting.value = true
  try {
    const fd = new FormData()

    // Laravel method spoofing: PATCH через POST + _method
    fd.append('_method',          'PATCH')
    fd.append('title',            form.title.trim())
    fd.append('meta_title',       form.meta_title)
    fd.append('meta_description', form.meta_description)
    fd.append('keywords',         form.keywords)

    // Явно передаём parent_id: пустая строка сигнализирует Laravel об удалении родителя
    fd.append('parent_id', form.parent_id !== null ? String(form.parent_id) : '')

    if (imageFile.value) {
      fd.append('image', imageFile.value)
    } else if (removeFlag.value) {
      fd.append('remove_image', '1')
    }

    selectedParamItems.value.forEach((item, idx) => {
      fd.append(`param_items[${idx}][id]`,   String(item.id))
      fd.append(`param_items[${idx}][sort]`, String(idx))
    })

    await $api(`/admin/categories/${id}`, { method: 'POST', body: fd })

    toast.open()
  } finally {
    submitting.value = false
  }
}
</script>