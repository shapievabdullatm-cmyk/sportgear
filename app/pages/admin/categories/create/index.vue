<template>
  <div class="max-w-4xl space-y-6 mx-auto">
    <AdminAppToast
        :show="toast.show.value"
        :progress="toast.progress.value"
        title="Создано"
        subtitle="Категория успешно создана"
        @close="toast.close"
    />

    <!-- Image Editor Modal -->
    <AdminImageEditorModal
        v-model="showEditor"
        :src="editorSrc"
        @confirm="onEditorConfirm"
        @cancel="onEditorCancel"
    />

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Создание категории</h1>
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
    <div class="bg-white border border-[#E8E6E0] rounded-xl p-6 space-y-5">

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
        <AdminParentDropdown v-model="form.parent_id" :categories="store.availableCategories" />
      </div>

      <div class="border-t border-[#F0EEE9]"></div>

      <!-- Image dropzone -->
      <div class="space-y-1.5">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">
          Фото категории
          <span class="normal-case tracking-normal text-[#C0BEB8]">(600×900 · JPG, PNG, WebP · до 5 МБ)</span>
        </label>

        <!-- Preview -->
        <div v-if="imagePreview" class="relative w-[120px] h-[180px] rounded-lg overflow-hidden border border-[#E8E6E0] group">
          <!-- Checkerboard for transparent images -->
          <div class="absolute inset-0"
               style="background-image: linear-gradient(45deg,#e0e0e0 25%,transparent 25%),linear-gradient(-45deg,#e0e0e0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e0e0e0 75%),linear-gradient(-45deg,transparent 75%,#e0e0e0 75%);background-size:12px 12px;background-position:0 0,0 6px,6px -6px,-6px 0">
          </div>
          <img :src="imagePreview" alt="preview" class="relative w-full h-full object-cover" />
          <!-- Edit button -->
          <button
              type="button"
              @click="openEditorForExisting"
              class="absolute top-1.5 right-8 z-10 w-6 h-6 rounded flex items-center justify-center bg-white/90 text-[#1A1A1A] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              title="Редактировать"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
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

        <!-- Dropzone -->
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

      <!-- Submit -->
      <div class="flex justify-end">
        <button
            type="button"
            :disabled="submitting"
            @click="submit"
            class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#333] transition-colors duration-150 disabled:opacity-50"
        >
          {{ submitting ? 'Создание...' : 'Создать категорию' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ParamItem } from '~/stores/admin/category'
import { useCategoryStore } from '~/stores/admin/category'
import ImageEditorModal from '~/components/admin/ImageEditorModal.vue'
import SeoFields from '~/components/admin/SeoFields.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const store      = useCategoryStore()
const toast      = useToast()
const { $api }   = useApi()
const router     = useRouter()

const submitting         = ref(false)
const isDragging         = ref(false)
const imageFile          = ref<File | null>(null)
const imagePreview       = ref<string | null>(null)
const imageError         = ref<string | null>(null)
const fileInput          = ref<HTMLInputElement | null>(null)
const selectedParamItems = ref<ParamItem[]>([])

// ─── Editor state ─────────────────────────────────────────────────────────────
const showEditor  = ref(false)
const editorSrc   = ref<string | null>(null)
// Temporary store for the raw file before editing
const pendingFile = ref<File | null>(null)

const form = reactive({
  title:            '',
  parent_id:        null as number | null,
  meta_title:       '',
  meta_description: '',
  keywords:         '',
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

await store.fetchCreate()

// ─── Image handling ───────────────────────────────────────────────────────────

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB  = 5

function validateFile(file: File): boolean {
  imageError.value = null
  if (!ALLOWED.includes(file.type)) {
    imageError.value = 'Допустимые форматы: JPG, PNG, WebP'
    return false
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    imageError.value = `Файл не должен превышать ${MAX_MB} МБ`
    return false
  }
  return true
}

function openEditorWithFile(file: File) {
  if (!validateFile(file)) return
  pendingFile.value = file
  editorSrc.value   = URL.createObjectURL(file)
  showEditor.value  = true
}

function openEditorForExisting() {
  if (!imagePreview.value) return
  editorSrc.value  = imagePreview.value
  showEditor.value = true
}

function onEditorConfirm(blob: Blob, preview: string) {
  // Convert blob to File
  const ext  = blob.type === 'image/png' ? 'png' : 'jpg'
  const name = pendingFile.value?.name ?? `image.${ext}`
  imageFile.value    = new File([blob], name, { type: blob.type })
  imagePreview.value = preview
  showEditor.value   = false
  pendingFile.value  = null
  editorSrc.value    = null
}

function onEditorCancel() {
  showEditor.value  = false
  pendingFile.value = null
  editorSrc.value   = null
  // Reset file input so user can re-select
  if (fileInput.value) fileInput.value.value = ''
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) openEditorWithFile(file)
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) openEditorWithFile(file)
}

function removeImage() {
  imageFile.value    = null
  imagePreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

// ─── Submit ───────────────────────────────────────────────────────────────────

async function submit() {
  if (!form.title.trim()) return
  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('title',     form.title.trim())
    fd.append('meta_title',       form.meta_title)
    fd.append('meta_description', form.meta_description)
    fd.append('keywords',         form.keywords)
    if (form.parent_id !== null) fd.append('parent_id', String(form.parent_id))
    if (imageFile.value) fd.append('image', imageFile.value)

    selectedParamItems.value.forEach((item, idx) => {
      fd.append(`param_items[${idx}][id]`,   String(item.id))
      fd.append(`param_items[${idx}][sort]`, String(idx))
    })

    await $api('/admin/categories', { method: 'POST', body: fd })

    toast.open()
    form.title = ''
    form.parent_id = null
    form.meta_title = ''
    form.meta_description = ''
    form.keywords = ''
    selectedParamItems.value = []
    removeImage()
  } finally {
    submitting.value = false
  }
}
</script>