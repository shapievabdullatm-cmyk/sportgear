<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSliderStore } from '~/stores/admin/slider'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const router = useRouter()
const route = useRoute()
const store = useSliderStore()

const id = Number(route.params.id)
const pageLoading = ref(true)

const form = reactive({ title: '', link: '' })

// Desktop image
const currentImage = ref(null)
const imageFile = ref(null)
const imagePreview = ref(null)
const doRemoveImage = ref(false)
const fileInput = ref(null)
const isDragging = ref(false)

// Mobile image
const currentMobileImage = ref(null)
const mobileImageFile = ref(null)
const mobileImagePreview = ref(null)
const doRemoveMobileImage = ref(false)
const mobileFileInput = ref(null)
const isMobileDragging = ref(false)

const errors = ref({})
const submitting = ref(false)

onMounted(async () => {
  if (!store.sliders.length) await store.fetchAll()
  const slider = store.sliders.find(s => s.id === id)
  if (!slider) { router.push('/admin/sliders'); return }
  form.title = slider.title
  form.link = slider.link
  currentImage.value = slider.image
  currentMobileImage.value = slider.mobile_image
  pageLoading.value = false
})

const isFormValid = computed(() => !!form.title.trim() && !!form.link.trim())

const shownImage = computed(() => {
  if (imagePreview.value) return imagePreview.value
  if (doRemoveImage.value) return null
  return currentImage.value
})

const shownMobileImage = computed(() => {
  if (mobileImagePreview.value) return mobileImagePreview.value
  if (doRemoveMobileImage.value) return null
  return currentMobileImage.value
})

function setFile(file) {
  if (!file.type.startsWith('image/')) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
  doRemoveImage.value = false
}

function handleImageChange(e) {
  const file = e.target.files[0]
  if (file) setFile(file)
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
  if (!e.currentTarget.contains(e.relatedTarget)) isDragging.value = false
}

function onDrop(e) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) setFile(file)
}

// Mobile image handlers
function setMobileFile(file) {
  if (!file.type.startsWith('image/')) return
  mobileImageFile.value = file
  mobileImagePreview.value = URL.createObjectURL(file)
  doRemoveMobileImage.value = false
}

function handleMobileImageChange(e) {
  const file = e.target.files[0]
  if (file) setMobileFile(file)
}

function clearNewMobileImage() {
  mobileImageFile.value = null
  mobileImagePreview.value = null
  if (mobileFileInput.value) mobileFileInput.value.value = ''
}

function removeMobileImage() {
  doRemoveMobileImage.value = true
  clearNewMobileImage()
}

function undoRemoveMobile() {
  doRemoveMobileImage.value = false
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
  fd.append('_method', 'PUT')
  fd.append('title', form.title)
  fd.append('link', form.link)

  if (imageFile.value) {
    fd.append('image', imageFile.value)
  } else if (doRemoveImage.value) {
    fd.append('remove_image', '1')
  }

  if (mobileImageFile.value) {
    fd.append('mobile_image', mobileImageFile.value)
  } else if (doRemoveMobileImage.value) {
    fd.append('remove_mobile_image', '1')
  }

  try {
    await store.update(id, fd)
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
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Редактировать слайдер</h1>
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
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">Изображение</label>

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

          <div v-if="shownImage" class="relative w-full rounded-lg overflow-hidden bg-[#F0EEE9] mb-2" style="aspect-ratio:16/7">
            <img :src="shownImage" alt="preview" class="w-full h-full object-cover" />

            <div class="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1.5 px-2.5 py-2 bg-gradient-to-t from-black/40 to-transparent flex-wrap opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
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

      <!-- Mobile image -->
      <div
          class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]"
          @dragover="onMobileDragOver"
          @dragleave="onMobileDragLeave"
          @drop="onMobileDrop"
      >
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-0.5">Мобильное изображение</label>
        <p class="text-[11px] text-[#C0BEB8] mb-2">Квадратное фото 500×500 для мобильных устройств</p>

        <div class="relative group">
          <div
              v-if="isMobileDragging"
              class="absolute inset-0 z-10 bg-[#1A1A1A]/5 border-2 border-dashed border-[#1A1A1A] rounded-lg flex items-center justify-center backdrop-blur-[1px] transition-all duration-150"
          >
            <div class="bg-white px-4 py-2 rounded-full shadow-sm border border-[#E8E6E0] flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span class="text-[12px] font-medium text-[#1A1A1A]">Отпустите для загрузки</span>
            </div>
          </div>

          <div v-if="shownMobileImage" class="relative rounded-lg overflow-hidden bg-[#F0EEE9] mb-2" style="width:120px;aspect-ratio:1/1">
            <img :src="shownMobileImage" alt="mobile preview" class="w-full h-full object-cover" />
            <div class="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 px-1.5 py-1.5 bg-gradient-to-t from-black/40 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
              <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-medium text-[#1A1A1A] hover:bg-white transition-colors"
                  @click="mobileFileInput.click()"
              >Заменить</button>
              <button
                  v-if="mobileImageFile"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-medium text-[#1A1A1A] hover:bg-white transition-colors"
                  @click="clearNewMobileImage"
              >Отменить</button>
              <button
                  v-else-if="currentMobileImage"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-black/70 transition-colors"
                  @click="removeMobileImage"
              >Удалить</button>
            </div>
          </div>

          <div
              v-else-if="doRemoveMobileImage"
              class="w-full rounded-lg border border-dashed border-[#E8E6E0] bg-[#FAFAF8] flex flex-col items-center justify-center gap-2 text-[#C0BEB8] mb-2 py-6"
              @click="mobileFileInput.click()"
          >
            <span class="text-[12px]">Изображение будет удалено при сохранении</span>
            <button type="button" class="text-[11px] text-[#1A1A1A] underline underline-offset-2 hover:no-underline" @click.stop="undoRemoveMobile">Отменить</button>
          </div>

          <div
              v-else
              role="button"
              tabindex="0"
              class="w-full rounded-lg border-2 border-dashed bg-[#FAFAF8] transition-colors duration-150 flex flex-col items-center justify-center gap-2 cursor-pointer select-none py-6 px-4 text-center"
              :class="isMobileDragging
                ? 'border-[#1A1A1A] bg-[#F0EEE9] text-[#1A1A1A]'
                : 'border-[#E8E6E0] text-[#C0BEB8] hover:border-[#1A1A1A] hover:bg-white hover:text-[#888]'"
              @click="mobileFileInput.click()"
              @keydown.enter.space.prevent="mobileFileInput.click()"
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
              <p class="text-[13px] font-medium">Перетащите или нажмите для выбора</p>
              <p class="text-[11px] mt-0.5 opacity-70">JPG, PNG, WEBP — до 5 МБ</p>
            </div>
          </div>
        </div>

        <input ref="mobileFileInput" type="file" accept="image/jpg,image/jpeg,image/png,image/webp" class="hidden" @change="handleMobileImageChange" />
        <p v-if="mobileImageFile" class="mt-1.5 text-[11px] text-[#888] truncate">Новый файл: {{ mobileImageFile.name }}</p>
        <p v-if="errors.mobile_image" class="mt-1 text-[11px] text-red-400">{{ errors.mobile_image }}</p>
      </div>

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
          {{ submitting ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>
  </div>
</template>