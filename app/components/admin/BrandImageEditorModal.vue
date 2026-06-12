<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="overlay" @click.self="$emit('cancel')">
        <div class="modal">

          <!-- Header -->
          <div class="header">
            <div class="header-left">
              <span class="title">Редактор логотипа</span>
              <span class="badge">400 × 200 · 2:1</span>
            </div>
            <button class="close-btn" @click="$emit('cancel')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- CROP CANVAS -->
          <div class="canvas-wrap" ref="canvasWrap">
            <canvas
                ref="canvasEl"
                class="crop-canvas"
                @mousedown="onMouseDown"
                @mousemove="onMouseMove"
                @mouseup="onMouseUp"
                @mouseleave="onMouseUp"
                @wheel.prevent="onWheel"
                @touchstart.prevent="onTouchStart"
                @touchmove.prevent="onTouchMove"
                @touchend="onTouchEnd"
            />
          </div>

          <!-- Controls -->
          <div class="controls">
            <!-- Rotate -->
            <div class="ctrl-group">
              <span class="ctrl-lbl">Поворот</span>
              <div class="ctrl-row">
                <button class="ic-btn" title="-90°" @click="rotateImg(-90)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
                <button class="ic-btn" title="+90°" @click="rotateImg(90)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-9-9 9.75 9.75 0 016.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                </button>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Flip -->
            <div class="ctrl-group">
              <span class="ctrl-lbl">Отражение</span>
              <div class="ctrl-row">
                <button class="ic-btn" title="По горизонтали" @click="flipImg('h')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M4 8l3 4-3 4M20 8l-3 4 3 4"/></svg>
                </button>
                <button class="ic-btn" title="По вертикали" @click="flipImg('v')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M8 4l4 3 4-3M8 20l4-3 4 3"/></svg>
                </button>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Zoom -->
            <div class="ctrl-group zoom-ctrl">
              <span class="ctrl-lbl">Масштаб</span>
              <div class="ctrl-row">
                <button class="ic-btn" @click="changeZoom(-0.1)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </button>
                <input type="range" class="z-slider" min="0" max="100" step="1" :value="zoomPct" @input="onSliderInput" />
                <button class="ic-btn" @click="changeZoom(0.1)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </button>
                <span class="z-lbl">{{ Math.round(scale * 100) }}%</span>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Reset -->
            <button class="ic-btn reset-btn" @click="resetView">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 2v6h6M21.5 22v-6h-6"/><path d="M22 11.5A10 10 0 003.2 7.2M2 12.5a10 10 0 0018.8 4.2"/></svg>
              Сброс
            </button>
          </div>

          <!-- Footer -->
          <div class="footer">
            <button class="btn-cancel" @click="$emit('cancel')">Отмена</button>
            <button class="btn-apply" @click="applyResult">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Применить
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  modelValue: boolean
  src: string | null
}>()

const emit = defineEmits<{
  confirm: [blob: Blob, preview: string]
  cancel: []
}>()

// Размеры для брендов: 400x200 (соотношение 2:1)
const TARGET_W = 400
const TARGET_H = 200

const canvasEl = ref<HTMLCanvasElement | null>(null)
const canvasWrap = ref<HTMLDivElement | null>(null)

let ctx: CanvasRenderingContext2D | null = null
let img: HTMLImageElement | null = null

// Transform state
const offsetX = ref(0)
const offsetY = ref(0)
const scale = ref(1)
const rotation = ref(0)
const flipH = ref(false)
const flipV = ref(false)

// Drag state
let isDragging = false
let dragStartX = 0
let dragStartY = 0
let dragOffsetX = 0
let dragOffsetY = 0

// Touch state
let lastTouchDist = 0

const zoomPct = ref(50)

watch(() => props.modelValue, async (show) => {
  console.log('BrandImageEditorModal watch triggered:', show, 'src:', props.src)
  if (show && props.src) {
    await nextTick()
    try {
      await loadImage(props.src)
      console.log('Image loaded successfully')
    } catch (e) {
      console.error('Failed to load image in watch:', e)
    }
  }
})

async function loadImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image()
    // Только устанавливаем crossOrigin для внешних URL
    if (src.startsWith('http') && !src.includes(window.location.hostname)) {
      image.crossOrigin = 'anonymous'
    }
    image.onload = () => {
      img = image
      initCanvas()
      resetView()
      resolve()
    }
    image.onerror = (e) => {
      console.error('Failed to load image:', src, e)
      reject(e)
    }
    image.src = src
  })
}

function initCanvas() {
  if (!canvasEl.value || !canvasWrap.value) return
  const c = canvasEl.value
  const dpr = window.devicePixelRatio || 1

  const wrapW = canvasWrap.value.clientWidth
  const wrapH = canvasWrap.value.clientHeight

  c.width = wrapW * dpr
  c.height = wrapH * dpr
  c.style.width = wrapW + 'px'
  c.style.height = wrapH + 'px'

  ctx = c.getContext('2d')
  if (ctx) ctx.scale(dpr, dpr)
}

function resetView() {
  if (!img || !canvasEl.value) return
  const cw = canvasEl.value.clientWidth
  const ch = canvasEl.value.clientHeight

  const imgAspect = img.width / img.height
  const cropAspect = TARGET_W / TARGET_H

  let fitScale: number
  if (imgAspect > cropAspect) {
    fitScale = ch / img.height
  } else {
    fitScale = cw / img.width
  }

  scale.value = fitScale
  offsetX.value = cw / 2
  offsetY.value = ch / 2
  rotation.value = 0
  flipH.value = false
  flipV.value = false

  zoomPct.value = 50
  render()
}

function render() {
  if (!ctx || !img || !canvasEl.value) return
  const cw = canvasEl.value.clientWidth
  const ch = canvasEl.value.clientHeight

  ctx.clearRect(0, 0, cw, ch)

  // Checkerboard
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, cw, ch)
  const tileSize = 16
  ctx.fillStyle = '#e0e0e0'
  for (let y = 0; y < ch; y += tileSize) {
    for (let x = 0; x < cw; x += tileSize) {
      if ((x / tileSize + y / tileSize) % 2 === 0) {
        ctx.fillRect(x, y, tileSize, tileSize)
      }
    }
  }

  ctx.save()
  ctx.translate(offsetX.value, offsetY.value)
  ctx.rotate((rotation.value * Math.PI) / 180)
  ctx.scale(
      scale.value * (flipH.value ? -1 : 1),
      scale.value * (flipV.value ? -1 : 1)
  )
  ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height)
  ctx.restore()

  // Crop frame
  const frameW = TARGET_W
  const frameH = TARGET_H
  const fx = (cw - frameW) / 2
  const fy = (ch - frameH) / 2

  ctx.strokeStyle = '#1A1A1A'
  ctx.lineWidth = 2
  ctx.strokeRect(fx, fy, frameW, frameH)

  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  ctx.fillRect(0, 0, cw, fy)
  ctx.fillRect(0, fy + frameH, cw, ch - fy - frameH)
  ctx.fillRect(0, fy, fx, frameH)
  ctx.fillRect(fx + frameW, fy, cw - fx - frameW, frameH)
}

// Mouse events
function onMouseDown(e: MouseEvent) {
  isDragging = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragOffsetX = offsetX.value
  dragOffsetY = offsetY.value
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging) return
  offsetX.value = dragOffsetX + (e.clientX - dragStartX)
  offsetY.value = dragOffsetY + (e.clientY - dragStartY)
  render()
}

function onMouseUp() {
  isDragging = false
}

function onWheel(e: WheelEvent) {
  const delta = e.deltaY > 0 ? -0.05 : 0.05
  changeZoom(delta)
}

// Touch events
function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    isDragging = true
    dragStartX = e.touches[0].clientX
    dragStartY = e.touches[0].clientY
    dragOffsetX = offsetX.value
    dragOffsetY = offsetY.value
  } else if (e.touches.length === 2) {
    isDragging = false
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    lastTouchDist = Math.sqrt(dx * dx + dy * dy)
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 1 && isDragging) {
    offsetX.value = dragOffsetX + (e.touches[0].clientX - dragStartX)
    offsetY.value = dragOffsetY + (e.touches[0].clientY - dragStartY)
    render()
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (lastTouchDist > 0) {
      const delta = (dist - lastTouchDist) * 0.01
      changeZoom(delta)
    }
    lastTouchDist = dist
  }
}

function onTouchEnd() {
  isDragging = false
  lastTouchDist = 0
}

// Controls
function rotateImg(deg: number) {
  rotation.value = (rotation.value + deg) % 360
  render()
}

function flipImg(dir: 'h' | 'v') {
  if (dir === 'h') flipH.value = !flipH.value
  else flipV.value = !flipV.value
  render()
}

function changeZoom(delta: number) {
  scale.value = Math.max(0.1, Math.min(5, scale.value + delta))
  zoomPct.value = Math.round(((scale.value - 0.1) / 4.9) * 100)
  render()
}

function onSliderInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  zoomPct.value = val
  scale.value = 0.1 + (val / 100) * 4.9
  render()
}

async function applyResult() {
  if (!canvasEl.value || !ctx) return

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = TARGET_W
  tempCanvas.height = TARGET_H
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx || !img) return

  const cw = canvasEl.value.clientWidth
  const ch = canvasEl.value.clientHeight
  const fx = (cw - TARGET_W) / 2
  const fy = (ch - TARGET_H) / 2

  tempCtx.save()
  tempCtx.translate(-fx, -fy)
  tempCtx.translate(offsetX.value, offsetY.value)
  tempCtx.rotate((rotation.value * Math.PI) / 180)
  tempCtx.scale(
      scale.value * (flipH.value ? -1 : 1),
      scale.value * (flipV.value ? -1 : 1)
  )
  tempCtx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height)
  tempCtx.restore()

  tempCanvas.toBlob((blob) => {
    if (blob) {
      const preview = tempCanvas.toDataURL('image/png')
      emit('confirm', blob, preview)
    }
  }, 'image/png')
}
</script>

<style scoped>
.overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm;
}

.modal {
  @apply bg-white rounded-2xl shadow-2xl w-[95vw] max-w-2xl max-h-[90vh] flex flex-col;
}

.header {
  @apply flex items-center justify-between px-5 py-4 border-b border-[#E8E6E0];
}

.header-left {
  @apply flex items-center gap-2.5;
}

.title {
  @apply text-[14px] font-semibold text-[#1A1A1A];
}

.badge {
  @apply text-[11px] font-mono text-[#ABABAB] bg-[#F0EEE9] px-2 py-0.5 rounded;
}

.close-btn {
  @apply w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors;
}

.canvas-wrap {
  @apply relative flex-1 overflow-hidden bg-[#FAFAF8];
  min-height: 300px;
}

.crop-canvas {
  @apply w-full h-full cursor-move;
}

.controls {
  @apply flex items-center gap-3 px-5 py-3.5 border-t border-[#E8E6E0] overflow-x-auto;
}

.ctrl-group {
  @apply flex items-center gap-2 shrink-0;
}

.ctrl-lbl {
  @apply text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider;
}

.ctrl-row {
  @apply flex items-center gap-1.5;
}

.ic-btn {
  @apply w-7 h-7 flex items-center justify-center rounded-md text-[#888] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors;
}

.reset-btn {
  @apply gap-1.5 px-2.5 text-[11px] font-medium;
}

.divider {
  @apply w-px h-5 bg-[#E8E6E0] shrink-0;
}

.zoom-ctrl {
  @apply flex-1 min-w-[200px];
}

.z-slider {
  @apply flex-1 h-1 bg-[#E8E6E0] rounded-full appearance-none cursor-pointer;
}

.z-slider::-webkit-slider-thumb {
  @apply appearance-none w-3.5 h-3.5 bg-[#1A1A1A] rounded-full cursor-pointer;
}

.z-slider::-moz-range-thumb {
  @apply w-3.5 h-3.5 bg-[#1A1A1A] rounded-full border-0 cursor-pointer;
}

.z-lbl {
  @apply text-[11px] font-mono text-[#888] min-w-[45px] text-right;
}

.footer {
  @apply flex items-center justify-end gap-2 px-5 py-4 border-t border-[#E8E6E0];
}

.btn-cancel {
  @apply px-4 py-2 text-[13px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors rounded-lg;
}

.btn-apply {
  @apply flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-[#1A1A1A] hover:bg-[#333] transition-colors rounded-lg;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>