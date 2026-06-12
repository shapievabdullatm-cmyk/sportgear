<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  accept?: string
  maxSize?: number // в MB
  type: 'image' | 'video'
  modelValue?: string // URL загруженного файла
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/*',
  maxSize: 10,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'upload-start': []
  'upload-complete': [url: string]
  'upload-error': [error: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const progress = ref(0)
const error = ref<string | null>(null)
const preview = ref<string | null>(null)
const isDragging = ref(false)

const acceptTypes = computed(() => {
  if (props.type === 'image') {
    return 'image/jpeg,image/jpg,image/png,image/webp'
  }
  return 'video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska,video/x-flv,video/x-ms-wmv'
})

const maxSizeBytes = computed(() => props.maxSize * 1024 * 1024)

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave(e: DragEvent) {
  if (!e.currentTarget || !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
    isDragging.value = false
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function handleFile(file: File) {
  error.value = null

  // Проверка типа
  const validTypes = acceptTypes.value.split(',')
  if (!validTypes.some(type => file.type.match(type.replace('*', '.*')))) {
    error.value = `Неверный тип файла. Разрешены: ${acceptTypes.value}`
    return
  }

  // Проверка размера
  if (file.size > maxSizeBytes.value) {
    error.value = `Файл слишком большой. Максимум ${props.maxSize} МБ`
    return
  }

  // Создаем превью для изображений
  if (props.type === 'image') {
    preview.value = URL.createObjectURL(file)
  }

  uploadFile(file)
}

async function uploadFile(file: File) {
  uploading.value = true
  progress.value = 0
  error.value = null
  emit('upload-start')

  const fd = new FormData()
  fd.append(props.type, file)

  const endpoint = props.type === 'image'
    ? '/admin/blogs/upload-image'
    : '/admin/blogs/upload-video'

  try {
    const xhr = new XMLHttpRequest()

    // Отслеживаем прогресс загрузки (клиент → сервер)
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        // Загрузка на сервер = 0-80%
        progress.value = Math.round((e.loaded / e.total) * 80)
      }
    })

    // Когда загрузка завершена, показываем обработку
    xhr.upload.addEventListener('load', () => {
      // Обработка на сервере = 80-95%
      progress.value = 85
    })

    // Обрабатываем завершение
    const response = await new Promise<{ url: string; path: string }>((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          progress.value = 100
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject(new Error(xhr.statusText))
        }
      })
      xhr.addEventListener('error', () => reject(new Error('Ошибка загрузки')))
      xhr.addEventListener('abort', () => reject(new Error('Загрузка отменена')))

      const config = useRuntimeConfig()
      const baseURL = config.public.apiBase || 'http://localhost:8000/api'

      xhr.open('POST', baseURL + endpoint)

      // Добавляем токен (приоритет у admin_token)
      const adminToken = useCookie('admin_token').value
      const authToken = useCookie('auth_token').value
      const token = adminToken || authToken

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }
      xhr.setRequestHeader('Accept', 'application/json')

      xhr.send(fd)
    })

    emit('update:modelValue', response.url)
    emit('upload-complete', response.url)
  } catch (e: any) {
    error.value = e.message || 'Ошибка загрузки'
    emit('upload-error', error.value)
  } finally {
    uploading.value = false
  }
}

function removeFile() {
  preview.value = null
  progress.value = 0
  error.value = null
  emit('update:modelValue', '')
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="space-y-2">
    <!-- Превью загруженного файла -->
    <div v-if="modelValue && !uploading" class="relative rounded-lg overflow-hidden bg-[#F0EEE9]">
      <img
        v-if="type === 'image'"
        :src="modelValue"
        alt="Uploaded"
        class="w-full h-auto"
      />
      <video
        v-else
        :src="modelValue"
        controls
        class="w-full h-auto"
      />
      <button
        type="button"
        class="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        @click="removeFile"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Зона загрузки -->
    <div
      v-else-if="!uploading"
      role="button"
      tabindex="0"
      class="w-full rounded-lg border-2 border-dashed bg-[#FAFAF8] transition-colors duration-150 flex flex-col items-center justify-center gap-2 cursor-pointer select-none py-6 px-4 text-center"
      :class="[
        isDragging
          ? 'border-[#1A1A1A] bg-[#F0EEE9] text-[#1A1A1A]'
          : error
            ? 'border-red-300 bg-red-50 text-red-400'
            : 'border-[#E8E6E0] text-[#C0BEB8] hover:border-[#1A1A1A] hover:bg-white hover:text-[#888]'
      ]"
      @click="triggerFileInput"
      @keydown.enter.space.prevent="triggerFileInput"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
           :class="isDragging ? 'bg-[#1A1A1A]/10' : 'bg-[#F0EEE9]'">
        <Icon
          :name="type === 'image' ? 'material-symbols:image-outline' : 'material-symbols:play-circle-outline'"
          class="w-5 h-5"
        />
      </div>
      <div>
        <p class="text-[13px] font-medium">
          {{ isDragging ? 'Отпустите файл' : `Загрузить ${type === 'image' ? 'изображение' : 'видео'}` }}
        </p>
        <p class="text-[11px] mt-0.5 opacity-70">
          {{ type === 'image' ? 'JPG, PNG, WEBP' : 'MP4, MOV, AVI, MKV и др.' }} — до {{ maxSize }} МБ
        </p>
      </div>
    </div>

    <!-- Прогресс загрузки -->
    <div v-else class="w-full rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] p-4">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-8 h-8 rounded-full bg-[#1A1A1A]/10 flex items-center justify-center">
          <div class="w-4 h-4 border-2 border-[#1A1A1A]/30 border-t-[#1A1A1A] rounded-full animate-spin" />
        </div>
        <div class="flex-1">
          <p class="text-[13px] font-medium text-[#1A1A1A]">Загрузка...</p>
          <p class="text-[11px] text-[#ABABAB]">{{ progress }}%</p>
        </div>
      </div>

      <!-- Прогресс-бар -->
      <div class="w-full h-2 bg-[#E8E6E0] rounded-full overflow-hidden">
        <div
          class="h-full bg-[#1A1A1A] transition-all duration-300 ease-out"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- Ошибка -->
    <p v-if="error" class="text-[11px] text-red-400">{{ error }}</p>

    <!-- Скрытый input -->
    <input
      ref="fileInput"
      type="file"
      :accept="acceptTypes"
      class="hidden"
      @change="onFileChange"
    />
  </div>
</template>