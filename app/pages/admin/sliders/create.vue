<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSliderStore } from '~/stores/admin/slider'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const router = useRouter()
const store = useSliderStore()

const form = reactive({ title: '', link: '' })

// Desktop image
const imageFile = ref(null)
const imagePreview = ref(null)
const fileInput = ref(null)
const isDragging = ref(false)

// Mobile image
const mobileImageFile = ref(null)
const mobileImagePreview = ref(null)
const mobileFileInput = ref(null)
const isMobileDragging = ref(false)

const errors = ref({})
const submitting = ref(false)

const isFormValid = computed(() => !!form.title.trim() && !!form.link.trim() && !!imageFile.value)

function handleImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  setFile(file)
}

function setFile(file) {
  if (!file.type.startsWith('image/')) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
  if (errors.value.image) delete errors.value.image
}

function removeImage() {
  imageFile.value = null
  imagePreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function onDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) isDragging.value = false
}

function onDrop(e) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) setFile(file)
}

// Mobile image handlers
function handleMobileImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  setMobileFile(file)
}

function setMobileFile(file) {
  if (!file.type.startsWith('image/')) return
  mobileImageFile.value = file
  mobileImagePreview.value = URL.createObjectURL(file)
  if (errors.value.mobile_image) delete errors.value.mobile_image
}

function removeMobileImage() {
  mobileImageFile.value = null
  mobileImagePreview.value = null
  if (mobileFileInput.value) mobileFileInput.value.value = ''
}

function onMobileDragOver(e) {
  e.preventDefault()
  isMobileDragging.value = true
}

function onMobileDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) isMobileDragging.value = false
}

function onMobileDrop(e) {
  e.preventDefault()
  isMobileDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) setMobileFile(file)
}

async function save() {
  if (!isFormValid.value || submitting.value) return
  errors.value = {}
  submitting.value = true

  const fd = new FormData()
  fd.append('title', form.title)
  fd.append('link', form.link)
  fd.append('image', imageFile.value)
  if (mobileImageFile.value) fd.append('mobile_image', mobileImageFile.value)

  try {
    await store.store(fd)
    router.push('/admin/sliders')
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
            to="/admin/sliders"
            class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </NuxtLink>
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Новый слайдер</h1>
      </div>
    </div>

    <!-- Form card -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden w-full sm:max-w-lg">

      <!-- Image upload -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Изображение <span class="text-red-400">*</span>
        </label>

        <!-- Preview -->
        <div v-if="imagePreview" class="relative w-full rounded-lg overflow-hidden bg-[#F0EEE9] mb-2" style="aspect-ratio:16/7">
          <img :src="imagePreview" alt="preview" class="w-full h-full object-cover" />
          <button
              type="button"
              class="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              @click="removeImage"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div class="absolute bottom-2 left-3 text-[11px] text-white/70 truncate max-w-[80%]">{{ imageFile?.name }}</div>
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
                : errors.image
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
            <p class="text-[11px] mt-0.5 opacity-70">JPG, PNG, WEBP — до 5 МБ</p>
          </div>
        </div>

        <input ref="fileInput" type="file" accept="image/jpg,image/jpeg,image/png,image/webp" class="hidden" @change="handleImageChange" />
        <p v-if="errors.image" class="mt-1.5 text-[11px] text-red-400">{{ errors.image }}</p>
      </div>

      <!-- Mobile image upload -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-0.5">
          Мобильное изображение
        </label>
        <p class="text-[11px] text-[#C0BEB8] mb-2">Квадратное фото 500×500 для мобильных устройств</p>

        <!-- Preview -->
        <div v-if="mobileImagePreview" class="relative rounded-lg overflow-hidden bg-[#F0EEE9] mb-2" style="width:120px;aspect-ratio:1/1">
          <img :src="mobileImagePreview" alt="mobile preview" class="w-full h-full object-cover" />
          <button
              type="button"
              class="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              @click="removeMobileImage"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Drop zone -->
        <div
            v-else
            role="button"
            tabindex="0"
            class="w-full rounded-lg border-2 border-dashed bg-[#FAFAF8] transition-colors duration-150 flex flex-col items-center justify-center gap-2 cursor-pointer select-none py-6 px-4 text-center"
            :class="[
              isMobileDragging
                ? 'border-[#1A1A1A] bg-[#F0EEE9] text-[#1A1A1A]'
                : errors.mobile_image
                  ? 'border-red-300 bg-red-50 text-red-400'
                  : 'border-[#E8E6E0] text-[#C0BEB8] hover:border-[#1A1A1A] hover:bg-white hover:text-[#888]'
            ]"
            @click="mobileFileInput.click()"
            @keydown.enter.space.prevent="mobileFileInput.click()"
            @dragover="onMobileDragOver"
            @dragleave="onMobileDragLeave"
            @drop="onMobileDrop"
        >
          <div class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
               :class="isMobileDragging ? 'bg-[#1A1A1A]/10' : 'bg-[#F0EEE9]'">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div>
            <p class="text-[13px] font-medium">
              {{ isMobileDragging ? 'Отпустите файл' : 'Перетащите или нажмите' }}
            </p>
            <p class="text-[11px] mt-0.5 opacity-70">JPG, PNG, WEBP — до 5 МБ</p>
          </div>
        </div>

        <input ref="mobileFileInput" type="file" accept="image/jpg,image/jpeg,image/png,image/webp" class="hidden" @change="handleMobileImageChange" />
        <p v-if="errors.mobile_image" class="mt-1.5 text-[11px] text-red-400">{{ errors.mobile_image }}</p>
      </div>

      <!-- Title -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Заголовок <span class="text-red-400">*</span>
        </label>
        <input
            v-model="form.title"
            type="text"
            placeholder="Введите заголовок"
            maxlength="255"
            class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
            :class="{ 'border-red-300 bg-red-50': errors.title }"
        />
        <p v-if="errors.title" class="mt-1 text-[11px] text-red-400">{{ errors.title }}</p>
      </div>

      <!-- Link -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Ссылка <span class="text-red-400">*</span>
        </label>
        <input
            v-model="form.link"
            type="url"
            placeholder="https://..."
            maxlength="500"
            class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
            :class="{ 'border-red-300 bg-red-50': errors.link }"
        />
        <p v-if="errors.link" class="mt-1 text-[11px] text-red-400">{{ errors.link }}</p>
      </div>

      <!-- Actions -->
      <div class="px-4 sm:px-5 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <NuxtLink
            to="/admin/sliders"
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
          {{ submitting ? 'Сохранение...' : 'Создать' }}
        </button>
      </div>
    </div>
  </div>
</template>