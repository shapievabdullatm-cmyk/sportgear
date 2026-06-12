<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBrandStore } from '~/stores/admin/brand'
import BrandImageEditorModal from '~/components/admin/BrandImageEditorModal.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const router = useRouter()
const route = useRoute()
const store = useBrandStore()

const id = Number(route.params.id)
const pageLoading = ref(true)

const form = reactive({ name: '', slug: '' })
const currentImage = ref(null)
const imageFile = ref(null)
const imagePreview = ref(null)
const doRemoveImage = ref(false)
const errors = ref({})
const submitting = ref(false)
const fileInput = ref(null)
const isDragging = ref(false)

// Editor state
const showEditor = ref(false)
const editorSrc = ref(null)
const pendingFile = ref(null)

onMounted(async () => {
  if (!store.brands.length) await store.fetchAll()
  const brand = store.brands.find(b => b.id === id)
  if (!brand) { router.push('/admin/brands'); return }
  form.name = brand.name
  form.slug = brand.slug
  currentImage.value = brand.image
  pageLoading.value = false
})

const isFormValid = computed(() => !!form.name.trim())

const shownImage = computed(() => {
  if (imagePreview.value) return imagePreview.value
  if (doRemoveImage.value) return null
  return currentImage.value
})

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 5

function validateFile(file) {
  if (!ALLOWED.includes(file.type)) {
    errors.value.image = 'Допустимые форматы: JPG, PNG, WebP'
    return false
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    errors.value.image = `Файл не должен превышать ${MAX_MB} МБ`
    return false
  }
  return true
}

function openEditorWithFile(file) {
  if (!validateFile(file)) return
  pendingFile.value = file
  editorSrc.value = URL.createObjectURL(file)
  showEditor.value = true
}

function openEditorForExisting() {
  console.log('openEditorForExisting called')
  console.log('shownImage.value:', shownImage.value)
  console.log('showEditor before:', showEditor.value)
  if (!shownImage.value) {
    console.log('No image to edit')
    return
  }
  editorSrc.value = shownImage.value
  showEditor.value = true
  console.log('showEditor after:', showEditor.value)
  console.log('editorSrc:', editorSrc.value)
}

function onEditorConfirm(blob, preview) {
  const ext = blob.type === 'image/png' ? 'png' : 'jpg'
  const name = pendingFile.value?.name ?? `brand-logo.${ext}`
  imageFile.value = new File([blob], name, { type: blob.type })
  imagePreview.value = preview
  doRemoveImage.value = false
  showEditor.value = false
  pendingFile.value = null
  editorSrc.value = null
  if (errors.value.image) delete errors.value.image
}

function onEditorCancel() {
  showEditor.value = false
  pendingFile.value = null
  editorSrc.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function handleImageChange(e) {
  const file = e.target.files[0]
  if (file) openEditorWithFile(file)
}

function clearNewImage() {
  imageFile.value = null
  imagePreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function removeImage() {
  doRemoveImage.value = true
  clearNewImage()
}

function undoRemove() {
  doRemoveImage.value = false
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
  if (file) openEditorWithFile(file)
}

async function save() {
  if (!isFormValid.value || submitting.value) return
  errors.value = {}
  submitting.value = true

  const fd = new FormData()
  fd.append('_method', 'PUT')
  fd.append('name', form.name)
  if (form.slug) fd.append('slug', form.slug)

  if (imageFile.value) {
    fd.append('image', imageFile.value)
  } else if (doRemoveImage.value) {
    fd.append('remove_image', '1')
  }

  try {
    await store.update(id, fd)
    router.push('/admin/brands')
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

    <!-- Image Editor Modal -->
    <BrandImageEditorModal
        v-model="showEditor"
        :src="editorSrc"
        @confirm="onEditorConfirm"
        @cancel="onEditorCancel"
    />

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink
            to="/admin/brands"
            class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </NuxtLink>
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Редактировать бренд</h1>
      </div>
    </div>

    <div v-if="pageLoading" class="flex justify-center py-12">
      <div class="w-5 h-5 border-2 border-[#E8E6E0] border-t-[#1A1A1A] rounded-full animate-spin" />
    </div>

    <div v-else class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden w-full sm:max-w-lg">

      <div
          class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
      >
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Логотип <span class="normal-case tracking-normal text-[#C0BEB8]">(400×200 · JPG, PNG, WebP · до 5 МБ)</span>
        </label>

        <div class="relative group">

          <div
              v-if="isDragging"
              class="absolute inset-0 z-10 bg-[#1A1A1A]/5 border-2 border-dashed border-[#1A1A1A] rounded-lg flex items-center justify-center backdrop-blur-[1px] transition-all duration-150"
          >
            <div class="bg-white px-4 py-2 rounded-full shadow-sm border border-[#E8E6E0] flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span class="text-[12px] font-medium text-[#1A1A1A]">Отпустите для загрузки</span>
            </div>
          </div>

          <div v-if="shownImage" class="relative w-full rounded-lg overflow-hidden bg-[#F0EEE9] mb-2 flex items-center justify-center p-4" style="aspect-ratio:2/1">
            <img :src="shownImage" alt="preview" class="max-w-full max-h-full object-contain" />

            <div class="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1.5 px-2.5 py-2 bg-gradient-to-t from-black/40 to-transparent flex-wrap opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
              <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#1A1A1A] hover:bg-white transition-colors"
                  @click="openEditorForExisting"
              >
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Редактировать
              </button>
              <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#1A1A1A] hover:bg-white transition-colors"
                  @click="fileInput.click()"
              >
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Заменить
              </button>
              <button
                  v-if="imageFile"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#1A1A1A] hover:bg-white transition-colors"
                  @click="clearNewImage"
              >
                Отменить
              </button>
              <button
                  v-else-if="currentImage"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-black/70 transition-colors"
                  @click="removeImage"
              >
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                Удалить
              </button>
            </div>
          </div>

          <div
              v-else-if="doRemoveImage"
              class="w-full rounded-lg border border-dashed border-[#E8E6E0] bg-[#FAFAF8] flex flex-col items-center justify-center gap-2 text-[#C0BEB8] mb-2 py-8"
              @click="fileInput.click()"
          >
            <span class="text-[12px]">Изображение будет удалено при сохранении</span>
            <button type="button" class="text-[11px] text-[#1A1A1A] underline underline-offset-2 hover:no-underline" @click.stop="undoRemove">Отменить</button>
          </div>

          <div
              v-else
              role="button"
              tabindex="0"
              class="w-full rounded-lg border-2 border-dashed bg-[#FAFAF8] transition-colors duration-150 flex flex-col items-center justify-center gap-2 cursor-pointer select-none py-8 sm:py-10 px-4 text-center"
              :class="isDragging
                ? 'border-[#1A1A1A] bg-[#F0EEE9] text-[#1A1A1A]'
                : 'border-[#E8E6E0] text-[#C0BEB8] hover:border-[#1A1A1A] hover:bg-white hover:text-[#888]'"
              @click="fileInput.click()"
              @keydown.enter.space.prevent="fileInput.click()"
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
              <p class="text-[13px] font-medium">Перетащите или нажмите для выбора</p>
              <p class="text-[11px] mt-0.5 opacity-70">JPG, PNG, WEBP — до 5 МБ</p>
            </div>
          </div>
        </div>

        <input ref="fileInput" type="file" accept="image/jpg,image/jpeg,image/png,image/webp" class="hidden" @change="handleImageChange" />

        <p v-if="imageFile" class="mt-1.5 text-[11px] text-[#888] truncate">Новый файл: {{ imageFile.name }}</p>
        <p v-if="errors.image" class="mt-1 text-[11px] text-red-400">{{ errors.image }}</p>
      </div>

      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Название <span class="text-red-400">*</span>
        </label>
        <input
            v-model="form.name"
            type="text"
            placeholder="Введите название бренда"
            maxlength="255"
            class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
            :class="{ 'border-red-300 bg-red-50': errors.name }"
        />
        <p v-if="errors.name" class="mt-1 text-[11px] text-red-400">{{ errors.name }}</p>
      </div>

      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Slug
        </label>
        <input
            v-model="form.slug"
            type="text"
            placeholder="Генерируется автоматически"
            maxlength="255"
            class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150 font-mono"
            :class="{ 'border-red-300 bg-red-50': errors.slug }"
        />
        <p v-if="errors.slug" class="mt-1 text-[11px] text-red-400">{{ errors.slug }}</p>
      </div>

      <div class="px-4 sm:px-5 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <NuxtLink
            to="/admin/brands"
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