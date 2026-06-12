<script setup lang="ts">
definePageMeta({ middleware: 'guest' })

const auth      = useAuthStore()
const step      = ref<'phone' | 'code'>('phone')
const phone     = ref('')
const code      = ref('')
const codeDigits = ref<string[]>(['', '', '', ''])
const codeInputs = ref<HTMLInputElement[]>([])
const error     = ref('')
const debugCode = ref<number | null>(null)
const loading   = ref(false)

watch(codeDigits, (vals) => {
  code.value = vals.join('')
}, { deep: true })

watch(step, (v) => {
  if (v === 'code') {
    nextTick(() => codeInputs.value[0]?.focus())
  }
})

function handleDigitInput(e: Event, idx: number) {
  const input = e.target as HTMLInputElement
  const val = input.value.replace(/\D/g, '')

  if (val.length > 1) {
    const chars = val.slice(0, 4 - idx).split('')
    chars.forEach((c, i) => {
      if (idx + i < 4) codeDigits.value[idx + i] = c
    })
    const next = Math.min(idx + chars.length, 3)
    nextTick(() => codeInputs.value[next]?.focus())
    return
  }

  codeDigits.value[idx] = val
  if (val && idx < 3) {
    nextTick(() => codeInputs.value[idx + 1]?.focus())
  }
}

function handleDigitKeydown(e: KeyboardEvent, idx: number) {
  if (e.key === 'Backspace') {
    if (!codeDigits.value[idx] && idx > 0) {
      e.preventDefault()
      codeDigits.value[idx - 1] = ''
      nextTick(() => codeInputs.value[idx - 1]?.focus())
    }
  } else if (e.key === 'ArrowLeft' && idx > 0) {
    e.preventDefault()
    codeInputs.value[idx - 1]?.focus()
  } else if (e.key === 'ArrowRight' && idx < 3) {
    e.preventDefault()
    codeInputs.value[idx + 1]?.focus()
  } else if (e.key === 'Enter' && code.value.length === 4) {
    handleVerify()
  }
}

function handleDigitPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text') ?? ''
  const digits = text.replace(/\D/g, '').slice(0, 4).split('')
  digits.forEach((d, i) => { codeDigits.value[i] = d })
  const next = Math.min(digits.length, 3)
  nextTick(() => codeInputs.value[next]?.focus())
  if (digits.length === 4) handleVerify()
}

const captchaKey    = ref('')
const captchaImage  = ref('')
const captchaAnswer = ref('')

async function loadCaptcha() {
  if (!process.client) return
  error.value = ''
  try {
    const config = useRuntimeConfig()
    const res: any = await $fetch(`${config.public.apiBase}/captcha`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    captchaKey.value    = res.key
    captchaImage.value  = res.image
    captchaAnswer.value = ''
  } catch {
    error.value = 'Не удалось загрузить капчу. Убедитесь, что backend запущен.'
  }
}

onMounted(loadCaptcha)

function formatPhone(value: string) {
  let d = value.replace(/\D/g, '')
  if (d.startsWith('8')) d = '7' + d.slice(1)
  if (!d.startsWith('7')) d = '7' + d
  d = d.slice(0, 11)
  const p1 = d.slice(1, 4), p2 = d.slice(4, 7), p3 = d.slice(7, 9), p4 = d.slice(9, 11)
  let r = '+7'
  if (p1) r += ' ' + p1
  if (p2) r += ' ' + p2
  if (p3) r += ' ' + p3
  if (p4) r += ' ' + p4
  return r
}

function normalizePhone(value: string) {
  let d = value.replace(/\D/g, '')
  if (d.startsWith('8')) d = '7' + d.slice(1)
  if (!d.startsWith('7')) d = '7' + d
  return '+' + d
}

watch(phone, val => { phone.value = formatPhone(val) })

const isValidPhone   = computed(() => normalizePhone(phone.value).length === 12)
const isValidCaptcha = computed(() => captchaAnswer.value.trim().length > 0)
const canSubmit      = computed(() => isValidPhone.value && isValidCaptcha.value && !loading.value)

async function handleSend() {
  error.value   = ''
  loading.value = true
  try {
    const res = await auth.sendCode(normalizePhone(phone.value), captchaKey.value, captchaAnswer.value)
    if (res.debug_code) debugCode.value = res.debug_code
    step.value = 'code'
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Ошибка отправки'
    await loadCaptcha()
  } finally {
    loading.value = false
  }
}

async function handleVerify() {
  error.value   = ''
  loading.value = true
  try {
    await auth.verifyCode(normalizePhone(phone.value), code.value)
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Неверный код'
  } finally {
    loading.value = false
  }
}

function goBack() {
  step.value  = 'phone'
  code.value  = ''
  codeDigits.value = ['', '', '', '']
  error.value = ''
  debugCode.value = null
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div v-if="debugCode" class="debug-badge">
        DEV: код → <strong>{{ debugCode }}</strong>
      </div>

      <Transition name="step" mode="out-in">
        <!-- STEP PHONE -->
        <div v-if="step === 'phone'" key="phone" class="form-step">
          <h1 class="form-title">Вход</h1>
          <p class="form-sub">Введите номер — отправим SMS с кодом</p>

          <div v-if="error" class="form-error">{{ error }}</div>

          <div class="field">
            <label>Телефон</label>
            <input
              v-model="phone"
              type="tel"
              inputmode="numeric"
              placeholder="+7 999 123 45 67"
              @keyup.enter="handleSend"
            />
          </div>

          <div class="field">
            <label>Код с картинки</label>
            <div class="captcha-row">
              <div class="captcha-img-wrap">
                <img v-if="captchaImage" :src="captchaImage" alt="Капча" class="captcha-img" />
                <div v-else class="captcha-skeleton" />
                <button type="button" class="captcha-refresh" @click="loadCaptcha" title="Обновить капчу">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4v5h5M20 20v-5h-5M4.93 14.94A10 10 0 1 0 6.99 5.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <input
                v-model="captchaAnswer"
                type="text"
                inputmode="numeric"
                maxlength="4"
                placeholder="4 цифры"
                class="captcha-input"
                @keyup.enter="handleSend"
              />
            </div>
          </div>

          <button class="btn-primary" :disabled="!canSubmit" @click="handleSend">
            <span v-if="loading" class="btn-spinner" />
            <span>{{ loading ? 'Отправляем...' : 'Получить код' }}</span>
          </button>
        </div>

        <!-- STEP CODE -->
        <div v-else key="code" class="form-step">
          <h1 class="form-title">Введите код</h1>
          <p class="form-sub">Отправили SMS на <strong>{{ phone }}</strong></p>

          <div v-if="error" class="form-error">{{ error }}</div>

          <div class="field">
            <label>Код из SMS</label>
            <div class="otp-boxes" @paste="handleDigitPaste">
              <input
                v-for="(_, idx) in codeDigits"
                :key="idx"
                :ref="(el) => { if (el) codeInputs[idx] = el as HTMLInputElement }"
                :value="codeDigits[idx]"
                type="text"
                inputmode="numeric"
                maxlength="1"
                autocomplete="one-time-code"
                class="otp-box"
                :class="{ 'otp-box--filled': codeDigits[idx] }"
                @input="(e) => handleDigitInput(e, idx)"
                @keydown="(e) => handleDigitKeydown(e, idx)"
                @focus="(e) => (e.target as HTMLInputElement).select()"
              />
            </div>
          </div>

          <button class="btn-primary" :disabled="loading || code.length < 4" @click="handleVerify">
            <span v-if="loading" class="btn-spinner" />
            <span>{{ loading ? 'Проверяем...' : 'Войти' }}</span>
          </button>

          <button class="btn-ghost" @click="goBack">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L11 18M5 12L11 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Изменить номер
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  padding: 40px 20px 80px;
  font-family: 'Montserrat', sans-serif;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 16px;
  padding: 32px 28px;
}

.form-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0a0a0a;
  margin: 0 0 6px;
  line-height: 1.1;
}

.form-sub {
  font-size: 13px;
  color: #888;
  margin: 0 0 28px;
  line-height: 1.5;
}

.form-sub strong {
  color: #111;
  font-weight: 600;
}

.form-error {
  font-size: 12px;
  font-weight: 500;
  color: #C1121C;
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.debug-badge {
  font-size: 11px;
  font-weight: 600;
  color: #0f8a5f;
  background: #f0fdf7;
  border: 1px solid #bbf0da;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 20px;
}

.field {
  margin-bottom: 18px;
}

.field label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #aaa;
  margin-bottom: 8px;
}

.field input {
  width: 100%;
  background: #f6f6f6;
  border: 1.5px solid transparent;
  border-radius: 10px;
  padding: 13px 16px;
  font-size: 16px; /* iOS Safari зумит при focus, если <16px */
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
  color: #111;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}

.field input:focus {
  background: #fff;
  border-color: #111;
}

.field input::placeholder {
  color: #ccc;
  font-weight: 400;
}

.otp-boxes {
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.otp-box {
  flex: 1;
  aspect-ratio: 1 / 1;
  max-width: 70px;
  background: #f6f6f6;
  border: 2px solid transparent;
  border-radius: 14px;
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  color: #111;
  outline: none;
  padding: 0;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
  caret-color: #111;
}

.otp-box:focus {
  background: #fff;
  border-color: #111;
  transform: translateY(-1px);
}

.otp-box--filled {
  background: #fff;
  border-color: #d8d8d8;
}

.otp-box--filled:focus {
  border-color: #111;
}

@media (max-width: 380px) {
  .otp-boxes { gap: 8px; }
  .otp-box { font-size: 24px; border-radius: 12px; }
}

.captcha-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.captcha-img-wrap {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  background: #f6f6f6;
  border-radius: 10px;
  overflow: hidden;
  min-height: 50px;
}

.captcha-img {
  flex: 1;
  height: 50px;
  object-fit: contain;
  display: block;
}

.captcha-skeleton {
  flex: 1;
  height: 50px;
  background: linear-gradient(90deg, #efefef 25%, #f8f8f8 50%, #efefef 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.captcha-refresh {
  flex-shrink: 0;
  width: 38px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.04);
  border: none;
  border-left: 1px solid #e8e8e8;
  cursor: pointer;
  color: #666;
  transition: background 0.15s, color 0.15s;
}
.captcha-refresh:hover { background: rgba(0,0,0,0.08); color: #111; }

.captcha-input {
  width: 100px !important;
  flex-shrink: 0;
  text-align: center;
  font-size: 18px !important;
  font-weight: 700 !important;
  letter-spacing: 0.15em !important;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}
.btn-primary:hover:not(:disabled) { opacity: 0.82; }
.btn-primary:active:not(:disabled) { transform: scale(0.99); }
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

.btn-ghost {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  color: #777;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: border-color 0.15s, color 0.15s;
}
.btn-ghost:hover { border-color: #bbb; color: #111; }

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

.step-enter-active,
.step-leave-active {
  transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.step-enter-from {
  opacity: 0;
  transform: translateX(12px);
}
.step-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 600px) {
  .login-page { padding: 20px 14px 80px; }
  .login-card {
    border: none;
    border-radius: 0;
    padding: 16px 4px;
  }
  .form-title { font-size: 24px; }
}
</style>