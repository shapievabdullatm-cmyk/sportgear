<template>
  <div class="bg-white border border-[#E8E6E0] rounded-xl p-4 sm:p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-[13px] font-semibold text-[#1A1A1A]">Изображения</h2>
        <p v-if="images.length" class="text-[11px] text-[#ABABAB] mt-0.5">
          {{ images.length }} {{ images.length === 1 ? 'фото' : 'фото' }}
        </p>
      </div>
      <span v-if="markedForDeletion?.size" class="text-[11px] text-red-400 font-medium">
        {{ markedForDeletion.size }} удалится
      </span>
    </div>

    <!-- Upload zone -->
    <label
        @dragenter.prevent="onUploadDragEnter"
        @dragover.prevent="onUploadDragOver"
        @dragleave.prevent="onUploadDragLeave"
        @drop.prevent="onFileDrop"
        class="flex flex-col items-center justify-center w-full h-24 sm:h-28 rounded-lg border-2 border-dashed cursor-pointer transition-colors"
        :class="uploadDragActive ? 'border-[#1A1A1A] bg-[#F5F4F0]' : 'border-[#E8E6E0] bg-[#FAFAF8] hover:border-[#C0BEB8]'"
    >
      <svg class="w-5 h-5 sm:w-6 sm:h-6 mb-1.5 sm:mb-2" :class="uploadDragActive ? 'text-[#1A1A1A]' : 'text-[#C0BEB8]'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
      </svg>
      <p class="text-[11px] sm:text-[12px] text-[#ABABAB] text-center px-2">
        <span v-if="!images.length"><span class="font-medium text-[#555]">Нажмите</span> или перетащите</span>
        <span v-else class="font-medium text-[#1A1A1A]">Добавить еще</span>
      </p>
      <input @change="onFileChange" type="file" multiple accept="image/*" class="hidden" />
    </label>

    <!-- Images grid -->
    <div v-if="images.length" class="space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">
          {{ isEditMode ? 'Загружено' : 'К загрузке' }}
        </p>
        <p class="text-[10px] text-[#C0BEB8]">
          <span class="hidden sm:inline">Перетащите для сортировки</span>
          <span class="sm:hidden">Удерживайте для сортировки</span>
        </p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
        <div
            v-for="(image, idx) in images"
            :key="image.id || `new-${idx}`"
            :data-index="idx"
            @touchstart="onTouchStart($event, idx)"
            @touchmove.prevent="onTouchMove"
            @touchend="onTouchEnd"
            @dragstart="onDragStart(idx)"
            @dragover.prevent="onDragOver(idx)"
            @drop.prevent="onDrop"
            @dragend="onDragEnd"
            draggable="true"
            class="relative group rounded-lg overflow-hidden border select-none transition-all duration-200"
            :class="[
              markedForDeletion?.has(image.id) ? 'border-red-300 opacity-50' : 'border-[#E8E6E0]',
              dragOverIndex === idx && dragFromIndex !== idx ? 'ring-2 ring-[#1A1A1A] ring-offset-1 scale-105' : '',
              dragFromIndex === idx ? 'opacity-40 scale-95' : '',
              touchDragging && touchDragIndex === idx ? 'opacity-40 scale-95 z-50' : '',
            ]"
            style="aspect-ratio: 3/4;"
        >
          <img :src="image.url || image.preview" class="w-full h-full object-cover pointer-events-none" draggable="false" />

          <!-- Position badge -->
          <div class="absolute top-1.5 left-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/70 flex items-center justify-center pointer-events-none z-10">
            <span class="text-[11px] sm:text-[12px] font-bold text-white leading-none">{{ idx + 1 }}</span>
          </div>

          <!-- Delete overlay for marked items -->
          <div v-if="markedForDeletion?.has(image.id)" class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <span class="bg-red-500 text-white text-[10px] font-semibold px-2 py-1 rounded-md">Удалится</span>
          </div>

          <!-- Action buttons -->
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 sm:group-hover:bg-black/30 transition-all flex items-center justify-center gap-1.5 sm:gap-2 z-20">
            <!-- Preview button -->
            <button
                v-if="!markedForDeletion?.has(image.id)"
                @click.prevent="$emit('preview', image.url || image.preview)"
                class="opacity-0 group-hover:opacity-100 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white text-[#1A1A1A] shadow-lg transition-opacity active:scale-95"
                title="Просмотр"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>

            <!-- Restore button (for marked items) -->
            <button
                v-if="markedForDeletion?.has(image.id)"
                @click.prevent="$emit('unmark', image.id)"
                class="opacity-0 group-hover:opacity-100 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white text-[#1A1A1A] shadow-lg transition-opacity active:scale-95"
                title="Отменить"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
              </svg>
            </button>

            <!-- Delete button -->
            <button
                v-if="!markedForDeletion?.has(image.id)"
                @click.prevent="handleDelete(image, idx)"
                class="opacity-0 group-hover:opacity-100 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white text-red-400 shadow-lg transition-opacity active:scale-95"
                title="Удалить"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
              </svg>
            </button>
          </div>

          <!-- Drag handle for mobile -->
          <div class="sm:hidden absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center pointer-events-none z-10">
            <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M8 9h8M8 15h8"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Mobile sort hint -->
      <p class="sm:hidden text-[10px] text-[#C0BEB8] text-center">
        Удерживайте изображение для изменения порядка
      </p>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <svg class="w-12 h-12 mx-auto mb-3 text-[#E8E6E0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <p class="text-[12px] text-[#C0BEB8]">Изображения не загружены</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductImage } from '~/types/product'

interface ImageItem extends Partial<ProductImage> {
  preview?: string
}

interface Props {
  images: ImageItem[]
  markedForDeletion?: Set<number>
  isEditMode?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:images': [images: ImageItem[]]
  'add-files': [files: File[]]
  'remove': [index: number]
  'preview': [url: string]
  'mark': [id: number]
  'unmark': [id: number]
}>()

// Upload state
const uploadDragActive = ref(false)
let uploadDragDepth = 0

// Drag & drop state (desktop)
const dragFromIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// Touch drag state (mobile)
const touchDragging = ref(false)
const touchDragIndex = ref<number | null>(null)
const touchStartY = ref(0)
const touchStartX = ref(0)
let touchMoveThreshold = 10 // pixels to move before starting drag

// Upload handlers
function onUploadDragEnter(e: DragEvent) {
  if (!e.dataTransfer?.types.includes('Files')) return
  uploadDragDepth++
  uploadDragActive.value = true
}

function onUploadDragOver(e: DragEvent) {
  if (!e.dataTransfer?.types.includes('Files')) return
  uploadDragActive.value = true
}

function onUploadDragLeave() {
  uploadDragDepth--
  if (uploadDragDepth <= 0) {
    uploadDragDepth = 0
    uploadDragActive.value = false
  }
}

function onFileDrop(e: DragEvent) {
  uploadDragDepth = 0
  uploadDragActive.value = false
  const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'))
  if (files.length) emit('add-files', files)
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length) emit('add-files', files)
  input.value = ''
}

// Desktop drag & drop
function onDragStart(index: number) {
  dragFromIndex.value = index
}

function onDragOver(index: number) {
  dragOverIndex.value = index
}

function onDrop() {
  const from = dragFromIndex.value
  const to = dragOverIndex.value
  if (from === null || to === null || from === to) return

  const newImages = [...props.images]
  const [item] = newImages.splice(from, 1)
  newImages.splice(to, 0, item)
  emit('update:images', newImages)

  dragFromIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  dragFromIndex.value = null
  dragOverIndex.value = null
}

// Mobile touch drag
function onTouchStart(e: TouchEvent, index: number) {
  const touch = e.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  touchDragIndex.value = index
}

function onTouchMove(e: TouchEvent) {
  if (touchDragIndex.value === null) return

  const touch = e.touches[0]
  const deltaX = Math.abs(touch.clientX - touchStartX.value)
  const deltaY = Math.abs(touch.clientY - touchStartY.value)

  // Start dragging if moved beyond threshold
  if (!touchDragging.value && (deltaX > touchMoveThreshold || deltaY > touchMoveThreshold)) {
    touchDragging.value = true
  }

  if (touchDragging.value) {
    // Find element under touch point
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    const imageCard = element?.closest('[data-index]') as HTMLElement
    if (imageCard) {
      const targetIndex = parseInt(imageCard.dataset.index || '-1')
      if (targetIndex >= 0 && targetIndex !== touchDragIndex.value) {
        dragOverIndex.value = targetIndex
      }
    }
  }
}

function onTouchEnd() {
  if (touchDragging.value && touchDragIndex.value !== null && dragOverIndex.value !== null) {
    const from = touchDragIndex.value
    const to = dragOverIndex.value
    if (from !== to) {
      const newImages = [...props.images]
      const [item] = newImages.splice(from, 1)
      newImages.splice(to, 0, item)
      emit('update:images', newImages)
    }
  }

  touchDragging.value = false
  touchDragIndex.value = null
  dragOverIndex.value = null
}

// Delete handler
function handleDelete(image: ImageItem, index: number) {
  if (image.id && props.isEditMode) {
    emit('mark', image.id)
  } else {
    emit('remove', index)
  }
}
</script>