<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="overlay" @click.self="$emit('cancel')">
        <div class="modal">

          <!-- Header -->
          <div class="header">
            <div class="header-left">
              <span class="title">Редактор изображения</span>
              <span class="badge">600 × 900 · 2:3</span>
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
import { ref, watch, nextTick, computed, onUnmounted } from 'vue'

const props = defineProps<{ modelValue: boolean; src: string | null }>()
const emit  = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', blob: Blob, preview: string): void
}>()

// ─── Canvas refs ──────────────────────────────────────────────────────────────
const canvasWrap = ref<HTMLDivElement | null>(null)
const canvasEl   = ref<HTMLCanvasElement | null>(null)
let   ctx: CanvasRenderingContext2D | null = null

// ─── Image state ──────────────────────────────────────────────────────────────
const currentSrc = ref<string | null>(null)
let   img        = new Image()

// Transform state (image position & scale relative to canvas)
let   scale     = ref(1)
let   offsetX   = 0   // top-left corner of image in canvas coords
let   offsetY   = 0

// Rotation & flip
let   rotation  = 0   // degrees: 0, 90, 180, 270
let   flipH     = false
let   flipV     = false

// Frame (crop box) in canvas coords — computed once on resize
let   frameX = 0, frameY = 0, frameW = 0, frameH = 0

// Canvas display size
let   cW = 0, cH = 0

// Minimum scale: image must always cover the frame
let   minScale = 1

// ─── Zoom slider pct ─────────────────────────────────────────────────────────
const ZOOM_MAX  = 4   // max multiplier above minScale
const zoomPct = computed(() => {
  const range = minScale * ZOOM_MAX - minScale
  if (range <= 0) return 0
  return Math.round(((scale.value - minScale) / range) * 100)
})

// ─── Watch src ────────────────────────────────────────────────────────────────
watch(() => props.src, (val) => {
  if (val) {
    currentSrc.value = val
    loadImage(val)
  }
}, { immediate: true })

watch(() => props.modelValue, (val) => {
  if (val && currentSrc.value) {
    nextTick(() => initCanvas())
  }
})

// ─── Canvas init ──────────────────────────────────────────────────────────────
function initCanvas() {
  const wrap = canvasWrap.value
  const el   = canvasEl.value
  if (!wrap || !el) return

  const rect = wrap.getBoundingClientRect()
  cW = rect.width
  cH = rect.height

  // Retina
  const dpr = window.devicePixelRatio || 1
  el.width  = cW * dpr
  el.height = cH * dpr
  el.style.width  = cW + 'px'
  el.style.height = cH + 'px'

  ctx = el.getContext('2d')!
  ctx.scale(dpr, dpr)

  computeFrame()
  fitImage()
  draw()
}

// Frame = 2:3 box, max width within canvas with padding
function computeFrame() {
  const pad = 20
  const maxW = cW - pad * 2
  const maxH = cH - pad * 2
  const ratio = 2 / 3

  let fw = maxW
  let fh = fw / ratio
  if (fh > maxH) { fh = maxH; fw = fh * ratio }

  frameW = Math.floor(fw)
  frameH = Math.floor(fh)
  frameX = Math.floor((cW - frameW) / 2)
  frameY = Math.floor((cH - frameH) / 2)
}

// Fit image so it covers the frame exactly
function fitImage() {
  if (!img.naturalWidth) return
  rotation = 0; flipH = false; flipV = false

  const [iw, ih] = naturalSize()
  const scaleX = frameW / iw
  const scaleY = frameH / ih
  minScale     = Math.max(scaleX, scaleY)
  scale.value  = minScale

  // Center image on frame
  offsetX = frameX - (iw * scale.value - frameW) / 2
  offsetY = frameY - (ih * scale.value - frameH) / 2
}

// Natural size accounting for rotation
function naturalSize(): [number, number] {
  const rot90 = rotation % 180 !== 0
  return rot90
      ? [img.naturalHeight, img.naturalWidth]
      : [img.naturalWidth,  img.naturalHeight]
}

function loadImage(src: string) {
  img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    if (canvasEl.value) initCanvas()
  }
  img.src = src
}

// ─── Draw ─────────────────────────────────────────────────────────────────────
function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, cW, cH)

  const [iw, ih] = naturalSize()
  const dw = iw * scale.value
  const dh = ih * scale.value

  // Draw image
  ctx.save()
  // Translate to image center
  const cx = offsetX + dw / 2
  const cy = offsetY + dh / 2
  ctx.translate(cx, cy)
  if (rotation) ctx.rotate((rotation * Math.PI) / 180)
  if (flipH) ctx.scale(-1, 1)
  if (flipV) ctx.scale(1, -1)

  const srcW = img.naturalWidth
  const srcH = img.naturalHeight
  const drawW = (rotation % 180 !== 0) ? dh : dw
  const drawH = (rotation % 180 !== 0) ? dw : dh

  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
  ctx.restore()

  // Dark overlay outside frame
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  // Top
  ctx.fillRect(0, 0, cW, frameY)
  // Bottom
  ctx.fillRect(0, frameY + frameH, cW, cH - frameY - frameH)
  // Left
  ctx.fillRect(0, frameY, frameX, frameH)
  // Right
  ctx.fillRect(frameX + frameW, frameY, cW - frameX - frameW, frameH)
  ctx.restore()

  // Frame border
  ctx.save()
  ctx.strokeStyle = 'rgba(0,0,0,0.75)'
  ctx.lineWidth   = 1.5
  ctx.strokeRect(frameX, frameY, frameW, frameH)

  // Rule-of-thirds grid lines
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth   = 0.75
  for (let i = 1; i < 3; i++) {
    const x = frameX + (frameW / 3) * i
    const y = frameY + (frameH / 3) * i
    ctx.beginPath(); ctx.moveTo(x, frameY);        ctx.lineTo(x, frameY + frameH); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(frameX, y);        ctx.lineTo(frameX + frameW, y); ctx.stroke()
  }

  // Corner handles
  ctx.strokeStyle = '#1A1A1A'
  ctx.lineWidth   = 2.5
  const hs = 16
  const corners = [
    [frameX, frameY, 1, 1],
    [frameX + frameW, frameY, -1, 1],
    [frameX, frameY + frameH, 1, -1],
    [frameX + frameW, frameY + frameH, -1, -1],
  ] as [number, number, number, number][]
  for (const [x, y, dx, dy] of corners) {
    ctx.beginPath()
    ctx.moveTo(x + dx * hs, y)
    ctx.lineTo(x, y)
    ctx.lineTo(x, y + dy * hs)
    ctx.stroke()
  }
  ctx.restore()
}

// ─── Clamp offset so image always covers frame ────────────────────────────────
function clampOffset() {
  const [iw, ih] = naturalSize()
  const dw = iw * scale.value
  const dh = ih * scale.value

  // Left edge of image must be <= frameX
  const maxX = frameX
  // Right edge of image must be >= frameX + frameW
  const minX = frameX + frameW - dw
  // Top edge <= frameY
  const maxY = frameY
  // Bottom edge >= frameY + frameH
  const minY = frameY + frameH - dh

  offsetX = Math.min(maxX, Math.max(minX, offsetX))
  offsetY = Math.min(maxY, Math.max(minY, offsetY))
}

// ─── Mouse drag ───────────────────────────────────────────────────────────────
let dragging = false
let lastX = 0, lastY = 0

function onMouseDown(e: MouseEvent) {
  dragging = true
  lastX = e.clientX
  lastY = e.clientY
}
function onMouseMove(e: MouseEvent) {
  if (!dragging) return
  offsetX += e.clientX - lastX
  offsetY += e.clientY - lastY
  lastX = e.clientX
  lastY = e.clientY
  clampOffset()
  draw()
}
function onMouseUp() { dragging = false }

// ─── Mouse wheel zoom ─────────────────────────────────────────────────────────
function onWheel(e: WheelEvent) {
  const rect   = canvasEl.value!.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  const delta  = e.deltaY > 0 ? -0.08 : 0.08
  zoomAt(mouseX, mouseY, scale.value + scale.value * delta)
}

// ─── Touch ────────────────────────────────────────────────────────────────────
let lastTouchX = 0, lastTouchY = 0
let lastPinchDist = 0

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    lastTouchX = e.touches[0].clientX
    lastTouchY = e.touches[0].clientY
  } else if (e.touches.length === 2) {
    lastPinchDist = pinchDist(e)
  }
}
function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 1) {
    const dx = e.touches[0].clientX - lastTouchX
    const dy = e.touches[0].clientY - lastTouchY
    offsetX += dx; offsetY += dy
    lastTouchX = e.touches[0].clientX
    lastTouchY = e.touches[0].clientY
    clampOffset(); draw()
  } else if (e.touches.length === 2) {
    const dist    = pinchDist(e)
    const ratio   = dist / lastPinchDist
    const midX    = (e.touches[0].clientX + e.touches[1].clientX) / 2
    const midY    = (e.touches[0].clientY + e.touches[1].clientY) / 2
    const rect    = canvasEl.value!.getBoundingClientRect()
    zoomAt(midX - rect.left, midY - rect.top, scale.value * ratio)
    lastPinchDist = dist
  }
}
function onTouchEnd() {}
function pinchDist(e: TouchEvent) {
  const dx = e.touches[0].clientX - e.touches[1].clientX
  const dy = e.touches[0].clientY - e.touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

// ─── Zoom at point ────────────────────────────────────────────────────────────
function zoomAt(px: number, py: number, newScale: number) {
  const maxScale  = minScale * ZOOM_MAX
  const clamped   = Math.max(minScale, Math.min(maxScale, newScale))
  const ratio     = clamped / scale.value
  // Zoom toward point
  offsetX = px - (px - offsetX) * ratio
  offsetY = py - (py - offsetY) * ratio
  scale.value = clamped
  clampOffset()
  draw()
}

// ─── Zoom controls ────────────────────────────────────────────────────────────
function changeZoom(delta: number) {
  const newScale = scale.value + scale.value * delta
  const cx = frameX + frameW / 2
  const cy = frameY + frameH / 2
  zoomAt(cx, cy, newScale)
}

function onSliderInput(e: Event) {
  const pct      = Number((e.target as HTMLInputElement).value) / 100
  const maxScale = minScale * ZOOM_MAX
  const newScale = minScale + pct * (maxScale - minScale)
  const cx = frameX + frameW / 2
  const cy = frameY + frameH / 2
  zoomAt(cx, cy, newScale)
}

// ─── Rotate ───────────────────────────────────────────────────────────────────
function rotateImg(deg: number) {
  rotation = ((rotation + deg) % 360 + 360) % 360
  // After rotation natural size swaps, recalc minScale
  const [iw, ih] = naturalSize()
  const scaleX   = frameW / iw
  const scaleY   = frameH / ih
  minScale       = Math.max(scaleX, scaleY)
  if (scale.value < minScale) scale.value = minScale
  // Re-center
  offsetX = frameX - (iw * scale.value - frameW) / 2
  offsetY = frameY - (ih * scale.value - frameH) / 2
  clampOffset()
  draw()
}

// ─── Flip ─────────────────────────────────────────────────────────────────────
function flipImg(axis: 'h' | 'v') {
  if (axis === 'h') flipH = !flipH
  else              flipV = !flipV
  draw()
}

// ─── Reset ────────────────────────────────────────────────────────────────────
function resetView() {
  rotation = 0; flipH = false; flipV = false
  fitImage()
  draw()
}

// ─── Apply / export ───────────────────────────────────────────────────────────
function applyResult() {
  const out  = document.createElement('canvas')
  out.width  = 600
  out.height = 900
  const octx = out.getContext('2d')!

  // Crop: what part of the drawn image falls inside frameX/Y/W/H
  // offsetX/Y = top-left of scaled image in canvas coords
  const [iw, ih] = naturalSize()
  const dw = iw * scale.value
  const dh = ih * scale.value

  // Draw the same way as draw() but clipped to frame, scaled to 600x900
  octx.save()
  const scaleToOutput = 600 / frameW

  // Shift so frame origin maps to (0,0) in output
  octx.translate(-frameX * scaleToOutput, -frameY * scaleToOutput)
  octx.scale(scaleToOutput, scaleToOutput)

  const cx = offsetX + dw / 2
  const cy = offsetY + dh / 2
  octx.translate(cx, cy)
  if (rotation) octx.rotate((rotation * Math.PI) / 180)
  if (flipH) octx.scale(-1, 1)
  if (flipV) octx.scale(1, -1)

  const drawW = (rotation % 180 !== 0) ? dh : dw
  const drawH = (rotation % 180 !== 0) ? dw : dh
  octx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
  octx.restore()

  out.toBlob((blob) => {
    if (!blob) return
    emit('confirm', blob, out.toDataURL('image/png'))
  }, 'image/png')
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.modal {
  background: #fff; border-radius: 18px;
  width: 100%; max-width: 800px; max-height: 94vh;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,0.25);
}

/* Header */
.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 15px 20px 11px; border-bottom: 1px solid #F0EEE9; flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.title { font-size: 14.5px; font-weight: 600; color: #1A1A1A; }
.badge {
  font-size: 11px; font-weight: 500; color: #888;
  background: #F5F4F0; border: 1px solid #E8E6E0;
  border-radius: 5px; padding: 2px 8px;
}
.close-btn {
  width: 30px; height: 30px; border-radius: 7px; border: none;
  background: #F5F4F0; color: #888; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.close-btn:hover { background: #ECEAE4; color: #1A1A1A; }

/* Canvas */
.canvas-wrap {
  flex: 1; min-height: 0;
  background: #F0EEE9;
  position: relative;
}
.crop-canvas {
  display: block; width: 100%; height: 100%;
  cursor: grab; touch-action: none;
}
.crop-canvas:active { cursor: grabbing; }

/* Controls */
.controls {
  display: flex; align-items: center; flex-wrap: wrap; gap: 2px;
  padding: 9px 20px; border-top: 1px solid #F0EEE9; flex-shrink: 0;
}
.ctrl-group { display: flex; align-items: center; gap: 7px; padding: 0 10px; }
.ctrl-group:first-child { padding-left: 0; }
.ctrl-lbl { font-size: 10.5px; font-weight: 500; color: #ABABAB; text-transform: uppercase; letter-spacing: 0.07em; white-space: nowrap; }
.ctrl-row { display: flex; align-items: center; gap: 4px; }
.divider { width: 1px; height: 22px; background: #F0EEE9; flex-shrink: 0; }
.ic-btn {
  width: 28px; height: 28px; border: 1px solid #E8E6E0;
  border-radius: 6px; background: #FAFAF8; color: #555;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.12s; flex-shrink: 0;
}
.ic-btn:hover { border-color: #1A1A1A; color: #1A1A1A; background: #fff; }
.reset-btn { width: auto; padding: 0 10px; gap: 5px; font-size: 11.5px; font-weight: 500; }

.zoom-ctrl { flex: 1; min-width: 180px; }
.z-slider {
  flex: 1; -webkit-appearance: none; height: 3px;
  background: #E8E6E0; border-radius: 99px; outline: none; cursor: pointer;
}
.z-slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 13px; height: 13px;
  border-radius: 50%; background: #1A1A1A; cursor: pointer;
}
.z-lbl { font-size: 11px; color: #888; min-width: 38px; text-align: right; font-variant-numeric: tabular-nums; }

/* Footer */
.footer {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 8px; padding: 12px 20px; border-top: 1px solid #F0EEE9; flex-shrink: 0;
}
.btn-cancel {
  padding: 7px 16px; border: 1px solid #E8E6E0; border-radius: 8px;
  background: #fff; font-size: 13px; font-weight: 500; color: #666;
  cursor: pointer; transition: all 0.13s;
}
.btn-cancel:hover { border-color: #1A1A1A; color: #1A1A1A; }
.btn-apply {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 18px; background: #1A1A1A; color: #fff;
  border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background 0.13s;
}
.btn-apply:hover { background: #333; }

/* Transition */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-active .modal, .modal-fade-leave-active .modal { transition: transform 0.2s ease, opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .modal, .modal-fade-leave-to .modal { transform: scale(0.97) translateY(6px); opacity: 0; }
</style>