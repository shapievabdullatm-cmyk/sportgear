<template>
  <Teleport to="body">
    <Transition name="scanner-fade">
      <div v-if="modelValue" class="scanner-overlay" @click.self="close">
        <div class="scanner-modal">
          <header class="scanner-header">
            <h2>Сканирование штрихкода</h2>
            <button class="close-btn" @click="close" aria-label="Закрыть">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </header>

          <div class="scanner-body">
            <!-- Видео-превью -->
            <div v-if="!error" class="video-wrap">
              <video ref="videoEl" class="video" playsinline muted autoplay />
              <div class="scan-frame">
                <div class="scan-line" />
              </div>
              <p class="hint">Наведите камеру на штрихкод товара</p>
            </div>

            <!-- Ошибка камеры -->
            <div v-else class="error-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#dc2626" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
              <p class="error-text">{{ error }}</p>
            </div>

            <!-- Ручной ввод -->
            <form class="manual-form" @submit.prevent="submitManual">
              <label class="manual-label">Или введите штрихкод вручную</label>
              <div class="manual-row">
                <input
                    v-model="manualCode"
                    type="text"
                    inputmode="numeric"
                    placeholder="Например, 4607017660048"
                    class="manual-input"
                />
                <button type="submit" class="manual-submit" :disabled="!manualCode.trim()">
                  Найти
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { DecodeHintType, BarcodeFormat } from '@zxing/library'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'detected', code: string): void
}>()

const videoEl = ref<HTMLVideoElement | null>(null)
const error = ref<string | null>(null)
const manualCode = ref('')

let controls: IScannerControls | null = null
let reader: BrowserMultiFormatReader | null = null

// Подтверждение: одно и то же значение должно прийти 2 раза подряд,
// чтобы исключить ложные срабатывания на плохих/смазанных штрихкодах.
let lastCode: string | null = null
let confirmCount = 0
const REQUIRED_CONFIRMS = 2

function close() {
  emit('update:modelValue', false)
}

function submitManual() {
  const code = manualCode.value.trim()
  if (!code) return
  emit('detected', code)
}

async function start() {
  error.value = null
  lastCode = null
  confirmCount = 0
  manualCode.value = ''

  // Камера доступна только в secure context (HTTPS или localhost).
  // На http://192.168.x.x браузер getUserMedia не отдаёт.
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    error.value = 'Камера недоступна по HTTP. Откройте сайт по HTTPS или с localhost.'
    return
  }

  const hints = new Map()
  // Поддерживаем самые ходовые товарные форматы
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF,
    BarcodeFormat.QR_CODE,
  ])
  // TRY_HARDER заставляет ZXing работать тщательнее с зашумлёнными снимками
  hints.set(DecodeHintType.TRY_HARDER, true)

  reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 })

  try {
    // Ждём появления элемента в DOM
    await nextTick()
    if (!videoEl.value) return

    controls = await reader.decodeFromVideoDevice(
        undefined, // авто-выбор: на мобиле обычно отдаёт заднюю камеру
        videoEl.value,
        (result, err) => {
          if (result) {
            const code = result.getText().trim()
            if (!code) return

            if (code === lastCode) {
              confirmCount++
            } else {
              lastCode = code
              confirmCount = 1
            }

            if (confirmCount >= REQUIRED_CONFIRMS) {
              emit('detected', code)
            }
          }
          // err игнорим — ZXing шлёт NotFoundException на каждый кадр без штрихкода
        }
    )
  } catch (e: any) {
    console.error('Scanner init error:', e)
    if (e?.name === 'NotAllowedError') {
      error.value = 'Доступ к камере запрещён. Разрешите доступ в настройках браузера.'
    } else if (e?.name === 'NotFoundError') {
      error.value = 'Камера не найдена на этом устройстве.'
    } else {
      error.value = 'Не удалось запустить камеру. Попробуйте ввести штрихкод вручную.'
    }
  }
}

function stop() {
  try {
    controls?.stop()
  } catch (_) { /* noop */ }
  controls = null
  reader = null
  lastCode = null
  confirmCount = 0
}

watch(() => props.modelValue, async (open) => {
  if (open) {
    await start()
  } else {
    stop()
  }
})

onBeforeUnmount(stop)
</script>

<style scoped>
.scanner-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.scanner-modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 32px);
}

.scanner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid #ebebeb;
}

.scanner-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #111;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
}

.close-btn:hover { color: #000; }

.scanner-body {
  padding: 16px;
  overflow-y: auto;
}

.video-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-frame {
  position: absolute;
  top: 50%;
  left: 10%;
  right: 10%;
  height: 32%;
  transform: translateY(-50%);
  border: 2px solid rgba(255, 255, 255, 0.85);
  border-radius: 10px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  overflow: hidden;
}

.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: #dc2626;
  box-shadow: 0 0 8px #dc2626;
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0%   { top: 6%; }
  50%  { top: 94%; }
  100% { top: 6%; }
}

.hint {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  margin: 0;
  pointer-events: none;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 12px;
  text-align: center;
}

.error-text {
  font-size: 14px;
  color: #555;
  margin: 0;
  line-height: 1.4;
}

.manual-form {
  margin-top: 16px;
}

.manual-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #999;
  margin-bottom: 8px;
}

.manual-row {
  display: flex;
  gap: 8px;
}

.manual-input {
  flex: 1;
  min-width: 0;
  border: 1px solid #d4d4d4;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  background: #fafafa;
}

.manual-input:focus {
  border-color: #111;
  background: #fff;
}

.manual-submit {
  background: #111;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.manual-submit:disabled {
  background: #999;
  cursor: not-allowed;
}

.scanner-fade-enter-active,
.scanner-fade-leave-active {
  transition: opacity 0.2s ease;
}
.scanner-fade-enter-from,
.scanner-fade-leave-to {
  opacity: 0;
}
</style>