<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from 'vue'
import type { Shop, ShopPayload, WorkingHoursDay } from '~/stores/admin/shop'
import type { Warehouse } from '~/stores/admin/warehouse'

interface Props {
  initial?: Shop | null
  submitting?: boolean
  serverErrors?: Record<string, string>
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  initial: null,
  submitting: false,
  serverErrors: () => ({}),
  submitLabel: 'Сохранить',
})

const emit = defineEmits<{
  submit: [payload: ShopPayload]
  cancel: []
}>()

const { $api } = useApi()

const form = reactive({
  external_id: '',
  slug: '',
  name: '',
  description: '',
  address: '',
  city: '',
  latitude: null as number | null,
  longitude: null as number | null,
  phone: '',
  email: '',
  working_hours: null as WorkingHoursDay[] | null,
  is_active: true,
  sort_order: null as number | null,
  warehouse_ids: [] as number[],

  // Самовывоз
  pickup_enabled: true,
  pickup_min_lead_minutes: 120,
  pickup_slot_minutes: 60,
  pickup_max_per_slot: 5,
  pickup_advance_days: 7,
})

function hydrate(shop: Shop) {
  form.external_id   = shop.external_id ?? ''
  form.slug          = shop.slug ?? ''
  form.name          = shop.name ?? ''
  form.description   = shop.description ?? ''
  form.address       = shop.address ?? ''
  form.city          = shop.city ?? ''
  form.latitude      = shop.latitude ?? null
  form.longitude     = shop.longitude ?? null
  form.phone         = shop.phone ?? ''
  form.email         = shop.email ?? ''
  form.working_hours = shop.working_hours ?? null
  form.is_active     = shop.is_active
  form.sort_order    = shop.sort_order ?? null
  form.warehouse_ids = (shop.warehouses ?? []).map(w => w.id)
  form.pickup_enabled          = shop.pickup_enabled ?? true
  form.pickup_min_lead_minutes = shop.pickup_min_lead_minutes ?? 120
  form.pickup_slot_minutes     = shop.pickup_slot_minutes ?? 60
  form.pickup_max_per_slot     = shop.pickup_max_per_slot ?? 5
  form.pickup_advance_days     = shop.pickup_advance_days ?? 7
}

if (props.initial) hydrate(props.initial)

watch(() => props.initial, (val) => {
  if (val) hydrate(val)
})

// ── Warehouses список ─────────────────────────────────────────────
const warehouses = ref<Warehouse[]>([])
const warehouseOptions = computed(() =>
    warehouses.value.map(w => ({ value: w.id, label: w.title + (w.is_active ? '' : ' (неактивен)') }))
)

onMounted(async () => {
  try {
    const res = await $api<Warehouse[] | { data: Warehouse[] }>('/admin/warehouses')
    warehouses.value = Array.isArray(res) ? res : res.data
  } catch {
    warehouses.value = []
  }
})

// ── Адрес: автодополнение через Яндекс геокодер ───────────────────
interface Suggestion { display: string; subtitle: string; value: string }
interface GeoResult  { full_address: string; lat: number; lon: number; city: string | null }

const suggestions = ref<Suggestion[]>([])
const showSuggestions = ref(false)
let suggestTimer: ReturnType<typeof setTimeout> | null = null
const geocoding = ref(false)

function onAddressInput() {
  const q = form.address.trim()
  if (q.length < 2) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }
  if (suggestTimer) clearTimeout(suggestTimer)
  suggestTimer = setTimeout(async () => {
    try {
      const res = await $api<Suggestion[]>(`/geocoder/suggest?q=${encodeURIComponent(q)}`)
      suggestions.value = res || []
      showSuggestions.value = suggestions.value.length > 0
    } catch {
      suggestions.value = []
    }
  }, 300)
}

function hideSuggestionsSoon() {
  setTimeout(() => { showSuggestions.value = false }, 200)
}

async function pickSuggestion(s: Suggestion) {
  form.address = s.value
  showSuggestions.value = false
  await resolveCoords(s.value)
}

async function resolveCoords(query?: string) {
  const q = (query ?? form.address).trim()
  if (!q) return
  geocoding.value = true
  try {
    const res = await $api<GeoResult>(`/geocoder/geocode?q=${encodeURIComponent(q)}`)
    if (res) {
      form.latitude = res.lat
      form.longitude = res.lon
      if (res.city && !form.city) form.city = res.city
      form.address = res.full_address || form.address
    }
  } catch {
    // silent
  } finally {
    geocoding.value = false
  }
}

// ── Validation ────────────────────────────────────────────────────
const isValid = computed(() => !!form.name.trim())

function err(field: string): string | null {
  return props.serverErrors?.[field] || null
}

function buildPayload(): ShopPayload {
  return {
    external_id:   form.external_id.trim() || null,
    slug:          form.slug.trim() || null,
    name:          form.name.trim(),
    description:   form.description.trim() || null,
    address:       form.address.trim() || null,
    city:          form.city.trim() || null,
    latitude:      form.latitude,
    longitude:     form.longitude,
    phone:         form.phone.trim() || null,
    email:         form.email.trim() || null,
    working_hours: form.working_hours,
    is_active:     form.is_active,
    sort_order:    form.sort_order ?? undefined,
    warehouse_ids: form.warehouse_ids,

    pickup_enabled:          form.pickup_enabled,
    pickup_min_lead_minutes: form.pickup_min_lead_minutes,
    pickup_slot_minutes:     form.pickup_slot_minutes,
    pickup_max_per_slot:     form.pickup_max_per_slot,
    pickup_advance_days:     form.pickup_advance_days,
  }
}

function onSubmit() {
  if (!isValid.value || props.submitting) return
  emit('submit', buildPayload())
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="space-y-4 sm:space-y-5">

    <!-- Основное -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <div class="px-4 sm:px-5 py-3 border-b border-[#F0EEE9] bg-[#FAFAF8]">
        <div class="text-[11px] font-medium uppercase tracking-[0.1em] text-[#888]">Основное</div>
      </div>

      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="lbl">Название <span class="text-red-400">*</span></label>
        <input
            v-model="form.name"
            type="text"
            placeholder="Например: Магазин на Тверской"
            maxlength="255"
            class="field-input"
            :class="{ 'border-red-300 bg-red-50': err('name') }"
        />
        <p v-if="err('name')" class="err">{{ err('name') }}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-0 border-b border-[#F0EEE9]">
        <div class="px-4 sm:px-5 py-4 sm:border-r border-[#F0EEE9]">
          <label class="lbl">Slug (URL)</label>
          <input
              v-model="form.slug"
              type="text"
              placeholder="auto-generated если пусто"
              maxlength="255"
              class="field-input font-mono"
              :class="{ 'border-red-300 bg-red-50': err('slug') }"
          />
          <p v-if="err('slug')" class="err">{{ err('slug') }}</p>
        </div>
        <div class="px-4 sm:px-5 py-4 border-t sm:border-t-0 border-[#F0EEE9]">
          <label class="lbl">External ID</label>
          <input
              v-model="form.external_id"
              type="text"
              placeholder="Внешний идентификатор"
              maxlength="255"
              class="field-input font-mono"
              :class="{ 'border-red-300 bg-red-50': err('external_id') }"
          />
          <p v-if="err('external_id')" class="err">{{ err('external_id') }}</p>
        </div>
      </div>

      <div class="px-4 sm:px-5 py-4">
        <label class="lbl">Описание</label>
        <textarea
            v-model="form.description"
            rows="3"
            placeholder="Краткое описание магазина"
            class="field-input resize-none"
        />
      </div>
    </div>

    <!-- Адрес и координаты -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <div class="px-4 sm:px-5 py-3 border-b border-[#F0EEE9] bg-[#FAFAF8]">
        <div class="text-[11px] font-medium uppercase tracking-[0.1em] text-[#888]">Адрес и координаты</div>
      </div>

      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9] relative">
        <label class="lbl">Адрес</label>
        <div class="relative">
          <input
              v-model="form.address"
              @input="onAddressInput"
              @blur="hideSuggestionsSoon"
              type="text"
              placeholder="Начните вводить адрес..."
              class="field-input pr-24"
          />
          <button
              type="button"
              @click="resolveCoords()"
              :disabled="!form.address.trim() || geocoding"
              class="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-[#888] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              title="Определить координаты по адресу"
          >
            <div v-if="geocoding" class="w-3 h-3 border-2 border-[#E8E6E0] border-t-[#1A1A1A] rounded-full animate-spin" />
            <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Найти
          </button>
        </div>

        <!-- Suggestions dropdown -->
        <ul
            v-if="showSuggestions && suggestions.length"
            class="absolute z-20 left-4 sm:left-5 right-4 sm:right-5 mt-1 bg-white border border-[#E8E6E0] rounded-xl shadow-xl max-h-64 overflow-y-auto"
        >
          <li
              v-for="(s, i) in suggestions"
              :key="i"
              @mousedown.prevent="pickSuggestion(s)"
              class="px-3.5 py-2.5 hover:bg-[#F5F4F0] cursor-pointer transition-colors border-b border-[#F0EEE9] last:border-0"
          >
            <div class="text-[13px] text-[#1A1A1A]">{{ s.display }}</div>
            <div v-if="s.subtitle" class="text-[11px] text-[#ABABAB] mt-0.5 truncate">{{ s.subtitle }}</div>
          </li>
        </ul>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-0 border-b border-[#F0EEE9]">
        <div class="px-4 sm:px-5 py-4 sm:border-r border-[#F0EEE9]">
          <label class="lbl">Город</label>
          <input v-model="form.city" type="text" placeholder="Москва" maxlength="255" class="field-input" />
        </div>
        <div class="px-4 sm:px-5 py-4 sm:border-r border-t sm:border-t-0 border-[#F0EEE9]">
          <label class="lbl">Широта (lat)</label>
          <input
              v-model.number="form.latitude"
              type="number"
              step="0.0000001"
              placeholder="55.7558"
              class="field-input font-mono"
              :class="{ 'border-red-300 bg-red-50': err('latitude') }"
          />
          <p v-if="err('latitude')" class="err">{{ err('latitude') }}</p>
        </div>
        <div class="px-4 sm:px-5 py-4 border-t sm:border-t-0 border-[#F0EEE9]">
          <label class="lbl">Долгота (lng)</label>
          <input
              v-model.number="form.longitude"
              type="number"
              step="0.0000001"
              placeholder="37.6173"
              class="field-input font-mono"
              :class="{ 'border-red-300 bg-red-50': err('longitude') }"
          />
          <p v-if="err('longitude')" class="err">{{ err('longitude') }}</p>
        </div>
      </div>
    </div>

    <!-- Контакты -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <div class="px-4 sm:px-5 py-3 border-b border-[#F0EEE9] bg-[#FAFAF8]">
        <div class="text-[11px] font-medium uppercase tracking-[0.1em] text-[#888]">Контакты</div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-0">
        <div class="px-4 sm:px-5 py-4 sm:border-r border-[#F0EEE9]">
          <label class="lbl">Телефон</label>
          <input
              v-model="form.phone"
              type="text"
              placeholder="+7 (495) 000-00-00"
              class="field-input"
          />
        </div>
        <div class="px-4 sm:px-5 py-4 border-t sm:border-t-0 border-[#F0EEE9]">
          <label class="lbl">Email</label>
          <input
              v-model="form.email"
              type="email"
              placeholder="store@example.com"
              class="field-input"
              :class="{ 'border-red-300 bg-red-50': err('email') }"
          />
          <p v-if="err('email')" class="err">{{ err('email') }}</p>
        </div>
      </div>
    </div>

    <!-- График работы -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <div class="px-4 sm:px-5 py-3 border-b border-[#F0EEE9] bg-[#FAFAF8]">
        <div class="text-[11px] font-medium uppercase tracking-[0.1em] text-[#888]">График работы</div>
      </div>
      <div class="px-4 sm:px-5 py-4">
        <AdminShopWorkingHoursEditor
            :model-value="form.working_hours"
            @update:model-value="(v) => form.working_hours = v"
        />
      </div>
    </div>

    <!-- Склады -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <div class="px-4 sm:px-5 py-3 border-b border-[#F0EEE9] bg-[#FAFAF8]">
        <div class="text-[11px] font-medium uppercase tracking-[0.1em] text-[#888]">Привязанные склады</div>
      </div>
      <div class="px-4 sm:px-5 py-4">
        <AdminMultiSelect
            v-model="form.warehouse_ids"
            :options="warehouseOptions"
            placeholder="Выберите склады для магазина..."
        />
        <p class="mt-1.5 text-[11px] text-[#ABABAB]">К магазину можно привязать несколько складов</p>
      </div>
    </div>

    <!-- Самовывоз: настройки -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <div class="px-4 sm:px-5 py-3 border-b border-[#F0EEE9] bg-[#FAFAF8] flex items-center justify-between">
        <div class="text-[11px] font-medium uppercase tracking-[0.1em] text-[#888]">Самовывоз</div>
        <label class="flex items-center gap-2 cursor-pointer">
          <span class="text-[12px] text-[#666]">Доступен</span>
          <button
              type="button"
              :class="['relative w-10 h-5 rounded-full transition-colors', form.pickup_enabled ? 'bg-[#1A1A1A]' : 'bg-[#E8E6E0]']"
              @click="form.pickup_enabled = !form.pickup_enabled"
          >
            <span :class="['absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all', form.pickup_enabled ? 'left-[1.375rem]' : 'left-0.5']" />
          </button>
        </label>
      </div>
      <div :class="['grid grid-cols-1 sm:grid-cols-2 gap-0', form.pickup_enabled ? '' : 'opacity-50 pointer-events-none']">
        <div class="px-4 sm:px-5 py-4 sm:border-r border-[#F0EEE9]">
          <label class="lbl">Минимум до забора, мин</label>
          <input
              v-model.number="form.pickup_min_lead_minutes"
              type="number" min="0" max="10080" step="15"
              placeholder="120"
              class="field-input"
          />
          <p class="mt-1 text-[11px] text-[#ABABAB]">За сколько минут до самого слота клиент может его выбрать. 120 = за 2 часа.</p>
        </div>
        <div class="px-4 sm:px-5 py-4 border-t sm:border-t-0 border-[#F0EEE9]">
          <label class="lbl">Длительность слота, мин</label>
          <select
              v-model.number="form.pickup_slot_minutes"
              class="field-input"
          >
            <option :value="15">15 минут</option>
            <option :value="30">30 минут</option>
            <option :value="60">1 час</option>
            <option :value="90">1,5 часа</option>
            <option :value="120">2 часа</option>
            <option :value="180">3 часа</option>
            <option :value="240">4 часа</option>
          </select>
        </div>
        <div class="px-4 sm:px-5 py-4 border-t sm:border-r border-[#F0EEE9]">
          <label class="lbl">Заказов на слот, макс</label>
          <input
              v-model.number="form.pickup_max_per_slot"
              type="number" min="1" max="1000"
              placeholder="5"
              class="field-input"
          />
          <p class="mt-1 text-[11px] text-[#ABABAB]">Когда слот заполняется — он становится недоступен для новых заказов.</p>
        </div>
        <div class="px-4 sm:px-5 py-4 border-t border-[#F0EEE9]">
          <label class="lbl">На сколько дней вперёд, дн</label>
          <input
              v-model.number="form.pickup_advance_days"
              type="number" min="1" max="30"
              placeholder="7"
              class="field-input"
          />
          <p class="mt-1 text-[11px] text-[#ABABAB]">Клиент видит слоты только на ближайшие N дней.</p>
        </div>
      </div>
    </div>

    <!-- Прочее: статус + сортировка -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <div class="px-4 sm:px-5 py-3 border-b border-[#F0EEE9] bg-[#FAFAF8]">
        <div class="text-[11px] font-medium uppercase tracking-[0.1em] text-[#888]">Параметры</div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-0">
        <div class="px-4 sm:px-5 py-4 sm:border-r border-[#F0EEE9]">
          <label class="lbl">Порядок сортировки</label>
          <input
              v-model.number="form.sort_order"
              type="number"
              min="0"
              placeholder="0"
              class="field-input"
          />
        </div>
        <div class="px-4 sm:px-5 py-4 border-t sm:border-t-0 border-[#F0EEE9]">
          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <div class="lbl mb-1">Статус</div>
              <div class="text-[13px] text-[#1A1A1A]">Магазин активен</div>
            </div>
            <button
                type="button"
                @click="form.is_active = !form.is_active"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                :class="form.is_active ? 'bg-[#1A1A1A]' : 'bg-[#E8E6E0]'"
            >
              <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                  :class="form.is_active ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </label>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
      <button
          type="button"
          @click="emit('cancel')"
          class="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-[13px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors duration-150"
      >
        Отмена
      </button>
      <button
          type="submit"
          :disabled="!isValid || submitting"
          class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-colors duration-150"
          :class="isValid && !submitting
            ? 'bg-[#1A1A1A] text-white hover:bg-[#333] cursor-pointer'
            : 'bg-[#F0EEE9] text-[#C0BEB8] cursor-not-allowed'"
      >
        <div v-if="submitting" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        {{ submitting ? 'Сохранение...' : submitLabel }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.lbl { @apply block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2; }
.field-input {
  @apply w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150;
}
.err { @apply mt-1 text-[11px] text-red-400; }
</style>