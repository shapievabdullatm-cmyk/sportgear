<template>
  <div class="space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-[13px] font-semibold text-[#1A1A1A]">Адреса</h2>
      <button
          type="button"
          @click="openModal()"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-[#555] hover:text-[#1A1A1A] border border-[#E8E6E0] rounded-lg hover:border-[#C0BEB8] transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Добавить адрес
      </button>
    </div>

    <!-- Empty -->
    <p v-if="!modelValue.length" class="text-[12px] text-[#ABABAB]">Адресов пока нет.</p>

    <!-- Compact cards grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <div
          v-for="(addr, idx) in modelValue"
          :key="addr._key ?? addr.id ?? idx"
          class="relative bg-white border rounded-xl p-3.5 cursor-pointer transition-colors hover:border-[#C0BEB8]"
          :class="addr.is_default ? 'border-[#1A1A1A]' : 'border-[#E8E6E0]'"
          @click="openModal(idx)"
      >
        <!-- Kebab -->
        <div class="absolute top-2.5 right-2.5" @click.stop>
          <button
              type="button"
              class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors"
              @click="menuIdx = menuIdx === idx ? null : idx"
          >
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
          <div
              v-if="menuIdx === idx"
              class="absolute right-0 top-full mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-lg z-10 min-w-[180px] overflow-hidden"
          >
            <button
                v-if="!addr.is_default"
                type="button"
                @click="setDefault(idx); menuIdx = null"
                class="block w-full text-left px-3.5 py-2 text-[12px] text-[#1A1A1A] hover:bg-[#FAFAF8] border-b border-[#F0EEE9]"
            >Сделать основным</button>
            <button
                type="button"
                @click="openModal(idx); menuIdx = null"
                class="block w-full text-left px-3.5 py-2 text-[12px] text-[#1A1A1A] hover:bg-[#FAFAF8] border-b border-[#F0EEE9]"
            >Редактировать</button>
            <button
                type="button"
                @click="removeAddress(idx); menuIdx = null"
                class="block w-full text-left px-3.5 py-2 text-[12px] text-red-500 hover:bg-red-50"
            >Удалить</button>
          </div>
        </div>

        <!-- Title + default badge -->
        <div class="flex items-center gap-2 mb-1.5 pr-8">
          <span class="text-[13px] font-semibold text-[#1A1A1A] truncate">{{ addr.title || 'Без названия' }}</span>
          <span v-if="addr.is_default" class="text-[9px] font-semibold uppercase tracking-wider bg-[#1A1A1A] text-white px-1.5 py-0.5 rounded">
            Основной
          </span>
        </div>

        <!-- Full address -->
        <p class="text-[12px] text-[#555] line-clamp-2 mb-1">{{ addr.full_address || '—' }}</p>

        <!-- Details -->
        <p
            v-if="addr.apartment || addr.entrance || addr.floor || addr.intercom"
            class="text-[11px] text-[#ABABAB] flex flex-wrap gap-x-2"
        >
          <span v-if="addr.apartment">кв. {{ addr.apartment }}</span>
          <span v-if="addr.entrance">подъезд {{ addr.entrance }}</span>
          <span v-if="addr.floor">этаж {{ addr.floor }}</span>
          <span v-if="addr.intercom">домофон {{ addr.intercom }}</span>
        </p>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
            v-if="modalOpen"
            class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            @click.self="closeModal"
        >
          <div class="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-[#E8E6E0] shrink-0">
              <h3 class="text-[15px] font-semibold text-[#1A1A1A]">
                {{ editingIdx === null ? 'Новый адрес' : 'Редактировать адрес' }}
              </h3>
              <button
                  type="button"
                  @click="closeModal"
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- Body (two columns) -->
            <div class="flex-1 grid grid-cols-1 md:grid-cols-[1fr_380px] overflow-hidden min-h-0">

              <!-- LEFT: map -->
              <div class="relative bg-[#F5F5F5] min-h-[260px] md:min-h-0">
                <div v-if="mapStatus === 'loading'" class="absolute inset-0 flex items-center justify-center text-[13px] text-[#ABABAB]">
                  Загрузка карты…
                </div>
                <div v-else-if="mapStatus === 'error'" class="absolute inset-0 flex items-center justify-center text-[13px] text-red-500 bg-red-50">
                  Не удалось загрузить карту
                </div>
                <div v-show="mapStatus === 'ready'" ref="mapContainer" class="absolute inset-0" />
              </div>

              <!-- RIGHT: form -->
              <div class="overflow-y-auto p-6 border-t md:border-t-0 md:border-l border-[#E8E6E0] flex flex-col">

                <!-- Search + locate -->
                <div class="relative mb-3">
                  <div class="flex items-center justify-between mb-1.5">
                    <label class="field-label">Адрес</label>
                    <button
                        type="button"
                        :disabled="locating"
                        @click="detectLocation"
                        class="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[#555] hover:text-[#1A1A1A] disabled:opacity-50"
                    >
                      <svg v-if="!locating" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                        <circle cx="12" cy="12" r="9" stroke-dasharray="2 4"/>
                      </svg>
                      <svg v-else class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      {{ locating ? 'Определяем…' : 'Моё местоположение' }}
                    </button>
                  </div>
                  <input
                      v-model="searchQuery"
                      type="text"
                      autocomplete="off"
                      placeholder="Начните вводить улицу..."
                      class="field-input"
                      @input="onSearchInput"
                      @blur="hideSuggestions"
                  />
                  <div
                      v-if="showSuggestions && suggestions.length"
                      class="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto"
                  >
                    <button
                        v-for="s in suggestions"
                        :key="s.value"
                        type="button"
                        @mousedown.prevent="selectSuggestion(s)"
                        class="block w-full text-left px-3.5 py-2.5 hover:bg-[#FAFAF8] border-b border-[#F0EEE9] last:border-0"
                    >
                      <div class="text-[12px] text-[#1A1A1A] truncate">{{ s.display }}</div>
                      <div v-if="s.subtitle" class="text-[10px] text-[#ABABAB] truncate">{{ s.subtitle }}</div>
                    </button>
                  </div>
                </div>

                <!-- Error -->
                <p v-if="errorMsg" class="text-[12px] text-red-500 mb-2">{{ errorMsg }}</p>

                <!-- Selected address preview -->
                <p v-if="form.full_address" class="text-[12px] text-[#1A1A1A] bg-[#FAFAF8] rounded-lg px-3 py-2 mb-3 leading-relaxed">
                  {{ form.full_address }}
                </p>
                <p v-else-if="mapStatus === 'ready'" class="text-[12px] text-[#ABABAB] mb-3">
                  Нажмите на карту или используйте поиск
                </p>

                <!-- Title -->
                <div class="space-y-1 mb-3">
                  <label class="field-label">Название</label>
                  <input v-model="form.title" type="text" placeholder="Дом, Работа..." class="field-input" />
                </div>

                <!-- Details grid -->
                <div class="grid grid-cols-2 gap-3 mb-3">
                  <div class="space-y-1">
                    <label class="field-label">Кв./офис</label>
                    <input v-model="form.apartment" type="text" class="field-input" />
                  </div>
                  <div class="space-y-1">
                    <label class="field-label">Подъезд</label>
                    <input v-model="form.entrance" type="text" class="field-input" />
                  </div>
                  <div class="space-y-1">
                    <label class="field-label">Этаж</label>
                    <input v-model="form.floor" type="text" class="field-input" />
                  </div>
                  <div class="space-y-1">
                    <label class="field-label">Домофон</label>
                    <input v-model="form.intercom" type="text" class="field-input" />
                  </div>
                </div>

                <!-- Comment -->
                <div class="space-y-1 mb-3">
                  <label class="field-label">Комментарий курьеру</label>
                  <input v-model="form.comment" type="text" placeholder="Необязательно" class="field-input" />
                </div>

                <!-- Default -->
                <label class="inline-flex items-center gap-2 cursor-pointer mb-4">
                  <input v-model="form.is_default" type="checkbox" class="w-4 h-4 accent-[#1A1A1A]" />
                  <span class="text-[12px] text-[#555]">Сделать основным адресом</span>
                </label>

                <!-- Footer -->
                <div class="mt-auto pt-4 border-t border-[#E8E6E0] flex gap-2">
                  <button
                      type="button"
                      @click="saveAddress"
                      :disabled="!form.full_address"
                      class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#333] transition-colors disabled:opacity-50"
                  >
                    {{ editingIdx === null ? 'Добавить' : 'Применить' }}
                  </button>
                  <button
                      type="button"
                      @click="closeModal"
                      class="px-4 py-2.5 rounded-lg border border-[#E8E6E0] text-[13px] font-medium text-[#555] hover:text-[#1A1A1A] hover:border-[#C0BEB8] transition-colors"
                  >
                    Отмена
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, reactive, ref } from 'vue'
import type { AdminAddress } from '~/stores/admin/user'

interface AdminAddressForm extends AdminAddress {
  _key?: string
}

interface Suggestion { display: string; subtitle: string; value: string }
interface GeoResult {
  full_address: string
  lat: number
  lon: number
  city: string | null
  street: string | null
  house: string | null
}

const props = defineProps<{
  modelValue: AdminAddressForm[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AdminAddressForm[]]
}>()

const { $api } = useApi()
const config   = useRuntimeConfig()

// ── List state ─────────────────────────────────────────────────────────
const menuIdx = ref<number | null>(null)

function genKey() {
  return Math.random().toString(36).slice(2, 10)
}

function emitUpdate(next: AdminAddressForm[]) {
  emit('update:modelValue', next)
}

function setDefault(idx: number) {
  const next = props.modelValue.map((a, i) => ({ ...a, is_default: i === idx }))
  emitUpdate(next)
}

function removeAddress(idx: number) {
  const next = props.modelValue.filter((_, i) => i !== idx)
  if (next.length && !next.some(a => a.is_default)) {
    next[0] = { ...next[0], is_default: true }
  }
  emitUpdate(next)
}

// ── Modal state ────────────────────────────────────────────────────────
const modalOpen   = ref(false)
const editingIdx  = ref<number | null>(null)
const errorMsg    = ref('')

const form = reactive({
  title:        'Дом',
  full_address: '',
  lat:          null as number | null,
  lon:          null as number | null,
  city:         null as string | null,
  street:       null as string | null,
  house:        '' as string | null,
  apartment:    '',
  entrance:     '',
  floor:        '',
  intercom:     '',
  comment:      '',
  is_default:   false,
})

function resetForm() {
  Object.assign(form, {
    title: 'Дом', full_address: '', lat: null, lon: null,
    city: null, street: null, house: '',
    apartment: '', entrance: '', floor: '', intercom: '', comment: '', is_default: false,
  })
  searchQuery.value     = ''
  suggestions.value     = []
  showSuggestions.value = false
  errorMsg.value        = ''
  mapStatus.value       = 'loading'
}

async function openModal(idx: number | null = null) {
  resetForm()
  editingIdx.value = idx

  if (idx !== null) {
    const a = props.modelValue[idx]
    Object.assign(form, {
      title:        a.title ?? 'Дом',
      full_address: a.full_address ?? '',
      lat:          a.lat ?? null,
      lon:          a.lon ?? null,
      city:         a.city ?? null,
      street:       a.street ?? null,
      house:        a.house ?? '',
      apartment:    a.apartment ?? '',
      entrance:     a.entrance ?? '',
      floor:        a.floor ?? '',
      intercom:     a.intercom ?? '',
      comment:      a.comment ?? '',
      is_default:   !!a.is_default,
    })
    searchQuery.value = a.full_address ?? ''
  } else if (props.modelValue.length === 0) {
    form.is_default = true
  }

  modalOpen.value = true
  await nextTick()

  try {
    await loadYmaps()
    initMap()
    if (form.lat && form.lon) {
      setMark([form.lat, form.lon])
      mapInst?.setCenter([form.lat, form.lon], 16)
    }
    mapStatus.value = 'ready'
  } catch {
    mapStatus.value = 'error'
  }
}

function closeModal() {
  modalOpen.value = false
  editingIdx.value = null
  destroyMap()
}

function saveAddress() {
  if (!form.full_address) { errorMsg.value = 'Выберите адрес на карте или через поиск'; return }
  if (!form.house) { errorMsg.value = 'В адресе должен быть номер дома'; return }

  const payload: AdminAddressForm = {
    ...(editingIdx.value !== null ? props.modelValue[editingIdx.value] : { _key: genKey() } as AdminAddressForm),
    title:        form.title || 'Дом',
    full_address: form.full_address,
    lat:          form.lat,
    lon:          form.lon,
    city:         form.city,
    street:       form.street,
    house:        form.house || '',
    apartment:    form.apartment || null,
    entrance:     form.entrance  || null,
    floor:        form.floor     || null,
    intercom:     form.intercom  || null,
    comment:      form.comment   || null,
    is_default:   form.is_default,
  }

  let next: AdminAddressForm[]
  if (editingIdx.value !== null) {
    next = props.modelValue.slice()
    next[editingIdx.value] = payload
  } else {
    next = [...props.modelValue, payload]
  }

  // Гарантируем, что только один is_default
  if (payload.is_default) {
    next = next.map(a => a === payload ? a : { ...a, is_default: false })
  } else if (!next.some(a => a.is_default)) {
    next[0] = { ...next[0], is_default: true }
  }

  emitUpdate(next)
  closeModal()
}

// ── Suggest ────────────────────────────────────────────────────────────
const searchQuery     = ref('')
const suggestions     = ref<Suggestion[]>([])
const showSuggestions = ref(false)
let suggestTimer: ReturnType<typeof setTimeout> | null = null

async function onSearchInput() {
  if (searchQuery.value.length < 2) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }
  if (suggestTimer) clearTimeout(suggestTimer)
  suggestTimer = setTimeout(async () => {
    try {
      const res = await $api<Suggestion[]>(
          `/geocoder/suggest?q=${encodeURIComponent(searchQuery.value)}`
      )
      suggestions.value     = res || []
      showSuggestions.value = suggestions.value.length > 0
    } catch {
      suggestions.value = []
    }
  }, 300)
}

function hideSuggestions() {
  setTimeout(() => { showSuggestions.value = false }, 250)
}

async function selectSuggestion(s: Suggestion) {
  searchQuery.value     = s.display
  showSuggestions.value = false
  await applyGeocode(s.value)
}

// ── Geocode ────────────────────────────────────────────────────────────
async function applyGeocode(query: string) {
  errorMsg.value = ''
  try {
    const res = await $api<GeoResult>(
        `/geocoder/geocode?q=${encodeURIComponent(query)}`
    )
    form.full_address = res.full_address
    form.lat          = res.lat
    form.lon          = res.lon
    form.city         = res.city
    form.street       = res.street
    form.house        = res.house ?? ''
    searchQuery.value     = res.full_address
    showSuggestions.value = false
    if (mapInst && ym) {
      setMark([res.lat, res.lon])
      mapInst.setCenter([res.lat, res.lon], 16, { duration: 300 })
    }
  } catch {
    errorMsg.value = 'Не удалось определить адрес'
  }
}

// ── Locate (browser geolocation) ───────────────────────────────────────
const locating = ref(false)

async function detectLocation() {
  if (!navigator.geolocation) {
    errorMsg.value = 'Геолокация не поддерживается браузером'
    return
  }
  locating.value = true
  errorMsg.value = ''
  navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = coords.latitude
        const lon = coords.longitude
        if (mapInst && ym) {
          setMark([lat, lon])
          mapInst.setCenter([lat, lon], 17, { duration: 300 })
        }
        try {
          const res = await $api<GeoResult>(
              `/geocoder/geocode?q=${encodeURIComponent(`${lon},${lat}`)}`
          )
          form.full_address = res.full_address
          form.lat          = lat
          form.lon          = lon
          form.city         = res.city
          form.street       = res.street
          form.house        = res.house ?? ''
          searchQuery.value = res.full_address
        } catch {
          errorMsg.value = 'Не удалось определить адрес'
        }
        locating.value = false
      },
      () => {
        errorMsg.value = 'Не удалось получить местоположение'
        locating.value = false
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
}

// ── Yandex Maps ────────────────────────────────────────────────────────
const mapContainer = ref<HTMLElement | null>(null)
const mapStatus    = ref<'loading' | 'ready' | 'error'>('loading')
let ym: any      = null
let mapInst: any = null
let plcmrk: any  = null

function loadYmaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as any
    if (w.ymaps) { ym = w.ymaps; w.ymaps.ready(resolve); return }
    const script   = document.createElement('script')
    script.src     = `https://api-maps.yandex.ru/2.1/?apikey=${config.public.yandexMapsKey}&lang=ru_RU`
    script.async   = true
    script.onerror = () => reject(new Error('map load failed'))
    script.onload  = () => { ym = w.ymaps; w.ymaps.ready(resolve) }
    document.head.appendChild(script)
  })
}

function initMap() {
  if (!mapContainer.value || !ym) return
  mapInst = new ym.Map(mapContainer.value, {
    center:   [42.9849, 47.5047],
    zoom:     13,
    controls: ['zoomControl', 'geolocationControl'],
  })
  mapInst.events.add('click', async (e: any) => {
    const coords: [number, number] = e.get('coords')
    setMark(coords)
    await applyGeocode(`${coords[1]},${coords[0]}`)
  })
}

function setMark(coords: [number, number]) {
  if (!mapInst || !ym) return
  if (plcmrk) mapInst.geoObjects.remove(plcmrk)
  plcmrk = new ym.Placemark(coords, {}, { preset: 'islands#redDotIcon' })
  mapInst.geoObjects.add(plcmrk)
  mapInst.panTo(coords, { flying: true })
}

function destroyMap() {
  if (mapInst) { mapInst.destroy(); mapInst = null }
  plcmrk = null
}

onUnmounted(destroyMap)
</script>

<style scoped>
.field-label { @apply block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]; }
.field-input { @apply w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors; }

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active > div, .modal-leave-active > div { transition: transform 0.2s ease; }
.modal-enter-from > div, .modal-leave-to > div { transform: scale(0.98); }
</style>