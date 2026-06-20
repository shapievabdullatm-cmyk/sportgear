<template>
  <div class="catalog-filter">
    <!-- Header -->
    <div class="filter-header">
      <span class="filter-title">Фильтры</span>
      <button v-if="hasActiveFilters" @click="resetFilters" class="reset-btn">
        Сбросить
      </button>
    </div>

    <!-- Price Filter -->
    <div class="filter-section">
      <button @click="toggleSection('price')" class="section-header">
        <span>Цена</span>
        <svg
            class="chevron"
            :class="{ rotated: expandedSections.has('price') }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <div class="section-wrap" :class="{ open: expandedSections.has('price') }">
        <div class="section-inner">
        <div class="section-content">
          <button
              v-if="isMobile && isPriceActive"
              @click="resetPrice"
              class="filter-reset-link"
              type="button"
          >
            Сбросить
          </button>
          <div class="price-inputs">
            <div class="price-input-group">
              <label class="price-label">От</label>
              <input
                  v-model.number="localPriceMin"
                  type="number"
                  :min="priceRange.min"
                  :max="priceRange.max"
                  class="price-input"
                  @input="debouncedPriceChange"
              />
            </div>
            <div class="price-input-group">
              <label class="price-label">До</label>
              <input
                  v-model.number="localPriceMax"
                  type="number"
                  :min="priceRange.min"
                  :max="priceRange.max"
                  class="price-input"
                  @input="debouncedPriceChange"
              />
            </div>
          </div>

          <div class="price-slider">
            <input
                v-model.number="localPriceMin"
                type="range"
                :min="priceRange.min"
                :max="priceRange.max"
                :step="priceStep"
                class="range-input range-min"
                @input="debouncedPriceChange"
            />
            <input
                v-model.number="localPriceMax"
                type="range"
                :min="priceRange.min"
                :max="priceRange.max"
                :step="priceStep"
                class="range-input range-max"
                @input="debouncedPriceChange"
            />
            <div class="range-track">
              <div class="range-fill" :style="rangeFillStyle"></div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>

    <!-- Param Filters -->
    <div v-for="filter in filters" :key="filter.id" class="filter-section">
      <!-- BOOLEAN: inline-строка с тумблером, без аккордеона -->
      <label v-if="filter.filter_type === PARAM_TYPE.BOOLEAN" class="boolean-row">
        <span class="boolean-row-title">{{ filter.title }}</span>
        <span class="boolean-switch">
          <input
              type="checkbox"
              :checked="isBooleanFilterActive(filter.slug)"
              @change="toggleBooleanSwitch(filter.slug)"
              class="switch-checkbox"
          />
          <span class="switch-slider"></span>
        </span>
      </label>

      <template v-else>
      <button @click="toggleSection(filter.id)" class="section-header">
        <span>{{ filter.title }}</span>
        <svg
            class="chevron"
            :class="{ rotated: expandedSections.has(filter.id) }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <div class="section-wrap" :class="{ open: expandedSections.has(filter.id) }">
        <div class="section-inner">
        <div class="section-content">
          <button
              v-if="isMobile && isFilterActive(filter.slug)"
              @click="resetFilter(filter.slug)"
              class="filter-reset-link"
              type="button"
          >
            Сбросить
          </button>

          <!-- Options (COLOR, MULTISELECT) -->
          <template v-if="filter.has_options && filter.options?.length">
            <div v-if="filter.options.length >= 5" class="options-search-wrap">
              <svg class="options-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7"/>
                <line x1="16.5" y1="16.5" x2="22" y2="22"/>
              </svg>
              <input
                  v-model="optionSearch[filter.slug]"
                  type="text"
                  placeholder="Поиск..."
                  class="options-search-input"
              />
              <button
                  v-if="optionSearch[filter.slug]"
                  @click="optionSearch[filter.slug] = ''"
                  class="options-search-clear"
                  type="button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="options-list">
              <template v-if="filteredOptions(filter).length">
              <label v-for="option in getVisibleOptions(filter)" :key="option.id" class="option-item">
                <input
                    type="checkbox"
                    :checked="isOptionSelected(filter.slug, option.slug)"
                    @change="toggleOption(filter.slug, option.slug)"
                    class="option-checkbox"
                />
                <span class="option-checkmark"></span>
                <span
                    v-if="filter.filter_type === PARAM_TYPE.COLOR"
                    class="color-circle"
                    :style="{ background: getColorCss(option.value) }"
                ></span>
                <span class="option-label">
                  {{ filter.filter_type === PARAM_TYPE.COLOR ? getColorName(option.value) : option.value }}
                </span>
              </label>
              </template>
              <span v-else class="options-no-results">Ничего не найдено</span>
            </div>
            <button
                v-if="isMobile && hasMoreOptions(filter) && !optionSearch[filter.slug]"
                @click="openOptionsModal(filter.slug)"
                class="show-all-btn"
                type="button"
            >
              <span>Показать все ({{ filteredOptions(filter).length }})</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="show-all-arrow">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </template>

          <!-- Range (INTEGER, FLOAT) -->
          <template v-else-if="filter.filter_type === PARAM_TYPE.INTEGER || filter.filter_type === PARAM_TYPE.FLOAT">
            <div v-if="filter.min !== undefined && filter.max !== undefined" class="range-inputs">
              <div class="range-input-group">
                <label class="range-label">От</label>
                <input
                    :value="getParamRangeMin(filter.slug, filter.min)"
                    @input="updateParamRange(filter.slug, 'min', $event.target.value, filter.min, filter.max)"
                    type="number"
                    :min="filter.min"
                    :max="filter.max"
                    :step="filter.filter_type === PARAM_TYPE.FLOAT ? 0.1 : 1"
                    class="range-input-field"
                />
                <span v-if="filter.unit" class="range-unit">{{ filter.unit }}</span>
              </div>
              <div class="range-input-group">
                <label class="range-label">До</label>
                <input
                    :value="getParamRangeMax(filter.slug, filter.max)"
                    @input="updateParamRange(filter.slug, 'max', $event.target.value, filter.min, filter.max)"
                    type="number"
                    :min="filter.min"
                    :max="filter.max"
                    :step="filter.filter_type === PARAM_TYPE.FLOAT ? 0.1 : 1"
                    class="range-input-field"
                />
                <span v-if="filter.unit" class="range-unit">{{ filter.unit }}</span>
              </div>
            </div>
          </template>
        </div>
        </div>
      </div>
      </template>
    </div>

    <!-- Bottom sheet: все опции выбранной характеристики -->
    <Teleport to="body">
      <Transition name="sheet">
        <div
            v-if="activeModalFilter"
            class="options-modal-backdrop"
            @click="closeOptionsModal"
        >
          <div class="options-modal" @click.stop>
            <div class="options-modal-handle"></div>
            <div class="options-modal-header">
              <span class="options-modal-title">{{ activeModalFilter.title }}</span>
              <div class="options-modal-actions">
                <button
                    v-if="isFilterActive(activeModalFilter.slug)"
                    @click="resetFilter(activeModalFilter.slug)"
                    class="options-modal-reset"
                    type="button"
                >
                  Сбросить
                </button>
                <button
                    @click="closeOptionsModal"
                    class="options-modal-close"
                    aria-label="Закрыть"
                    type="button"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="(activeModalFilter.options?.length ?? 0) >= 5" class="options-modal-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7"/>
                <line x1="16.5" y1="16.5" x2="22" y2="22"/>
              </svg>
              <input
                  v-model="optionSearch[activeModalFilter.slug]"
                  type="text"
                  placeholder="Поиск..."
              />
              <button
                  v-if="optionSearch[activeModalFilter.slug]"
                  @click="optionSearch[activeModalFilter.slug] = ''"
                  class="options-modal-search-clear"
                  type="button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="options-modal-list">
              <template v-if="modalVisibleOptions.length">
                <label
                    v-for="option in modalVisibleOptions"
                    :key="option.id"
                    class="option-item"
                >
                  <input
                      type="checkbox"
                      :checked="isOptionSelected(activeModalFilter.slug, option.slug)"
                      @change="toggleOption(activeModalFilter.slug, option.slug)"
                      class="option-checkbox"
                  />
                  <span class="option-checkmark"></span>
                  <span
                      v-if="activeModalFilter.filter_type === PARAM_TYPE.COLOR"
                      class="color-circle"
                      :style="{ background: getColorCss(option.value) }"
                  ></span>
                  <span class="option-label">
                    {{ activeModalFilter.filter_type === PARAM_TYPE.COLOR ? getColorName(option.value) : option.value }}
                  </span>
                </label>
              </template>
              <span v-else class="options-no-results">Ничего не найдено</span>
            </div>

            <div class="options-modal-footer">
              <button @click="closeOptionsModal" class="options-modal-apply" type="button">
                Готово
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { optionColorCss, optionColorName } from '~/types/param'

const PARAM_TYPE = {
  STRING: 1,
  TEXT: 2,
  INTEGER: 3,
  FLOAT: 4,
  COLOR: 6,
  BOOLEAN: 7,
  MULTISELECT: 8,
} as const

interface ParamOption {
  id: number
  slug: string
  value: string
}

interface Filter {
  id: number
  title: string
  slug: string
  filter_type: number
  unit?: string | null
  has_options: boolean
  options?: ParamOption[]
  min?: number
  max?: number
}

interface Props {
  filters: Filter[]
  priceRange: { min: number; max: number }
  modelValue: {
    price_min?: number
    price_max?: number
    filters?: Record<string, string | string[] | { min: number; max: number }>
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: Props['modelValue']] }>()

const expandedSections = ref<Set<number | string>>(new Set(['price']))
const optionSearch = ref<Record<string, string>>({})
const optionsModalOpen = ref<string | null>(null)
const MOBILE_OPTIONS_LIMIT = 5

const activeModalFilter = computed<Filter | null>(() => {
  if (!optionsModalOpen.value) return null
  return props.filters.find(f => f.slug === optionsModalOpen.value) ?? null
})

const modalVisibleOptions = computed<ParamOption[]>(() => {
  if (!activeModalFilter.value) return []
  return filteredOptions(activeModalFilter.value)
})

function openOptionsModal(slug: string) {
  optionsModalOpen.value = slug
}

function closeOptionsModal() {
  optionsModalOpen.value = null
}

const isMobile = ref(false)
let mqList: MediaQueryList | null = null
const mqHandler = (e: MediaQueryListEvent) => { isMobile.value = e.matches }
onMounted(() => {
  mqList = window.matchMedia('(max-width: 768px)')
  isMobile.value = mqList.matches
  mqList.addEventListener('change', mqHandler)
})
onBeforeUnmount(() => {
  if (mqList) mqList.removeEventListener('change', mqHandler)
})

function getSelectedOptionSlugs(filterSlug: string): string[] {
  const v = props.modelValue.filters?.[filterSlug]
  if (typeof v === 'string') return v.split(',').filter(Boolean)
  if (Array.isArray(v)) return v
  return []
}

function getVisibleOptions(filter: Filter) {
  const all = filteredOptions(filter)
  if (!isMobile.value) return all
  if (optionSearch.value[filter.slug]) return all

  const selectedSet = new Set(getSelectedOptionSlugs(filter.slug))
  const visible: ParamOption[] = []
  const seen = new Set<string>()

  for (let i = 0; i < Math.min(MOBILE_OPTIONS_LIMIT, all.length); i++) {
    visible.push(all[i])
    seen.add(all[i].slug)
  }
  for (const opt of all) {
    if (selectedSet.has(opt.slug) && !seen.has(opt.slug)) {
      visible.push(opt)
      seen.add(opt.slug)
    }
  }
  return visible
}

function hasMoreOptions(filter: Filter): boolean {
  return filteredOptions(filter).length > MOBILE_OPTIONS_LIMIT
}

function isFilterActive(filterSlug: string): boolean {
  const v = props.modelValue.filters?.[filterSlug]
  if (v === undefined || v === null) return false
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'object') return true
  return v !== '' && v !== '0' && v !== 'false'
}

function resetFilter(filterSlug: string) {
  const newValue = { ...props.modelValue }
  if (newValue.filters?.[filterSlug] !== undefined) {
    newValue.filters = { ...newValue.filters }
    delete newValue.filters[filterSlug]
  }
  emit('update:modelValue', newValue)
}

const isPriceActive = computed(() =>
    props.modelValue.price_min !== undefined ||
    props.modelValue.price_max !== undefined
)

function resetPrice() {
  localPriceMin.value = props.priceRange.min
  localPriceMax.value = props.priceRange.max
  const newValue = { ...props.modelValue }
  newValue.price_min = undefined
  newValue.price_max = undefined
  emit('update:modelValue', newValue)
}

function filteredOptions(filter: Filter) {
  const q = optionSearch.value[filter.slug]?.toLowerCase().trim()
  if (!q || !filter.options) return filter.options ?? []
  return filter.options.filter(opt => {
    const label = filter.filter_type === PARAM_TYPE.COLOR
        ? getColorName(opt.value).toLowerCase()
        : opt.value.toLowerCase()
    return label.includes(q)
  })
}
const localPriceMin = ref(props.priceRange.min)
const localPriceMax = ref(props.priceRange.max)

watch(() => props.modelValue.price_min, (val) => {
  if (val === undefined) localPriceMin.value = props.priceRange.min
  else if (val !== localPriceMin.value) localPriceMin.value = val
})
watch(() => props.modelValue.price_max, (val) => {
  if (val === undefined) localPriceMax.value = props.priceRange.max
  else if (val !== localPriceMax.value) localPriceMax.value = val
})
watch(() => props.priceRange, (newRange) => {
  if (!props.modelValue.price_min) localPriceMin.value = newRange.min
  if (!props.modelValue.price_max) localPriceMax.value = newRange.max
}, { deep: true })

const priceStep = computed(() => {
  const range = props.priceRange.max - props.priceRange.min
  if (range > 10000) return 100
  if (range > 1000) return 10
  return 1
})

const rangeFillStyle = computed(() => {
  const { min, max } = props.priceRange
  const range = max - min
  if (range === 0) return { left: '0%', width: '100%' }
  return {
    left: `${((localPriceMin.value - min) / range) * 100}%`,
    width: `${((localPriceMax.value - min) / range) * 100 - ((localPriceMin.value - min) / range) * 100}%`,
  }
})

const hasActiveFilters = computed(() =>
    props.modelValue.price_min !== undefined ||
    props.modelValue.price_max !== undefined ||
    (props.modelValue.filters && Object.keys(props.modelValue.filters).length > 0)
)

function toggleSection(id: number | string) {
  expandedSections.value.has(id)
      ? expandedSections.value.delete(id)
      : expandedSections.value.add(id)
}

let priceTimeout: NodeJS.Timeout | null = null
function debouncedPriceChange() {
  if (priceTimeout) clearTimeout(priceTimeout)
  priceTimeout = setTimeout(() => {
    if (localPriceMin.value > localPriceMax.value) localPriceMin.value = localPriceMax.value
    const newValue = { ...props.modelValue }
    newValue.price_min = localPriceMin.value !== props.priceRange.min ? localPriceMin.value : undefined
    newValue.price_max = localPriceMax.value !== props.priceRange.max ? localPriceMax.value : undefined
    emit('update:modelValue', newValue)
  }, 300)
}

function isOptionSelected(filterSlug: string, optionSlug: string): boolean {
  const v = props.modelValue.filters?.[filterSlug]
  if (typeof v === 'string') {
    // Может быть одно значение "red" или несколько "red,blue"
    return v.split(',').includes(optionSlug)
  }
  if (Array.isArray(v)) {
    return v.includes(optionSlug)
  }
  return false
}

function toggleOption(filterSlug: string, optionSlug: string) {
  const newValue = { ...props.modelValue }
  if (!newValue.filters) newValue.filters = {}

  const cur = newValue.filters[filterSlug]
  let selectedSlugs: string[] = []

  if (typeof cur === 'string') {
    selectedSlugs = cur.split(',').filter(s => s)
  } else if (Array.isArray(cur)) {
    selectedSlugs = cur
  }

  const idx = selectedSlugs.indexOf(optionSlug)
  if (idx > -1) {
    selectedSlugs.splice(idx, 1)
  } else {
    selectedSlugs.push(optionSlug)
  }

  if (selectedSlugs.length === 0) {
    delete newValue.filters[filterSlug]
  } else {
    newValue.filters[filterSlug] = selectedSlugs
  }

  emit('update:modelValue', newValue)
}

function isBooleanFilterActive(filterSlug: string): boolean {
  const v = props.modelValue.filters?.[filterSlug]
  return v === 'true' || v === '1'
}

function toggleBooleanSwitch(filterSlug: string) {
  const newValue = { ...props.modelValue }
  if (!newValue.filters) newValue.filters = {}

  const isActive = isBooleanFilterActive(filterSlug)
  if (isActive) {
    // Выключаем фильтр - удаляем его полностью (показываем все)
    delete newValue.filters[filterSlug]
  } else {
    // Включаем фильтр - устанавливаем значение 'true'
    newValue.filters[filterSlug] = 'true'
  }

  emit('update:modelValue', newValue)
}

function getParamRangeMin(filterSlug: string, defaultMin: number): number {
  const v = props.modelValue.filters?.[filterSlug]
  return (v && typeof v === 'object' && 'min' in v) ? v.min : defaultMin
}

function getParamRangeMax(filterSlug: string, defaultMax: number): number {
  const v = props.modelValue.filters?.[filterSlug]
  return (v && typeof v === 'object' && 'max' in v) ? v.max : defaultMax
}

function updateParamRange(filterSlug: string, type: 'min' | 'max', value: string, defaultMin: number, defaultMax: number) {
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return
  const newValue = { ...props.modelValue }
  if (!newValue.filters) newValue.filters = {}
  const cur = newValue.filters[filterSlug]
  const rangeValue = (cur && typeof cur === 'object' && 'min' in cur) ? { ...cur } : { min: defaultMin, max: defaultMax }
  rangeValue[type] = numValue
  if (rangeValue.min === defaultMin && rangeValue.max === defaultMax) delete newValue.filters[filterSlug]
  else newValue.filters[filterSlug] = rangeValue
  emit('update:modelValue', newValue)
}

function resetFilters() {
  localPriceMin.value = props.priceRange.min
  localPriceMax.value = props.priceRange.max
  emit('update:modelValue', {})
}

function getColorCss(value: string): string { return optionColorCss(value) }
function getColorName(value: string): string { return optionColorName(value) }
</script>

<style scoped>
.catalog-filter {
  position: sticky;
  top: 20px;
}

/* Header */
.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: 4px;
  border-bottom: 1px solid #e5e5e5;
}

.filter-title {
  font-size: 13px;
  font-weight: 600;
  color: #111;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.reset-btn {
  font-size: 12px;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.reset-btn:hover {
  color: #111;
}

/* Sections */
.filter-section {
  border-bottom: 1px solid #e5e5e5;
}

.section-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.28s ease;
}

.section-wrap.open {
  grid-template-rows: 1fr;
}

.section-inner {
  overflow: hidden;
  min-height: 0;
}

.section-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #111;
}

.section-header:hover {
  color: #555;
}

.chevron {
  width: 14px;
  height: 14px;
  color: #aaa;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.section-content {
  padding-bottom: 14px;
}

/* Price inputs */
.price-inputs {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 14px;
}

.price-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-label,
.range-label {
  font-size: 11px;
  color: #aaa;
}

.price-input,
.range-input-field {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  font-size: 14px;
  color: #111;
  background: #EDEDEF;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}

.price-input:focus,
.range-input-field:focus {
  border-color: #1A1A1A;
}


/* Slider */
.price-slider {
  position: relative;
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 9px;
}

.range-track {
  position: absolute;
  left: 9px;
  right: 9px;
  height: 1px;
  background: #ddd;
  pointer-events: none;
}

.range-fill {
  position: absolute;
  height: 100%;
  background: #111;
}

.range-input {
  position: absolute;
  left: 9px;
  right: 9px;
  height: 1px;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #111;
  cursor: pointer;
  pointer-events: all;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #111;
}

.range-input::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #111;
  cursor: pointer;
  pointer-events: all;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #111;
}

.range-min { z-index: 1; }
.range-max { z-index: 2; }

/* Options */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}

.options-list::-webkit-scrollbar {
  width: 4px;
}

.options-list::-webkit-scrollbar-track {
  background: transparent;
}

.options-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}

.options-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.option-item:hover .option-label {
  color: #555;
}

.option-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.option-checkmark {
  width: 18px;
  height: 18px;
  border: 1.5px solid #d4d4d4;
  border-radius: 5px;
  background: #fff;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.option-item:hover .option-checkmark {
  border-color: #C1121C;
}

.option-checkbox:focus-visible + .option-checkmark {
  box-shadow: 0 0 0 3px rgba(193, 18, 28, 0.18);
}

.option-checkbox:checked + .option-checkmark {
  background: #C1121C;
  border-color: #C1121C;
}

.option-checkbox:checked + .option-checkmark::after {
  content: '';
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-top: -2px;
}

.option-label {
  font-size: 13px;
  color: #111;
  user-select: none;
}

.color-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #ddd;
  flex-shrink: 0;
}

/* Boolean inline row (no accordion) */
.boolean-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  font-size: 13px;
  font-weight: 500;
  color: #111;
  cursor: pointer;
}

.boolean-row-title {
  flex: 1;
  min-width: 0;
}

/* Boolean switch */
.boolean-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch-checkbox {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ddd;
  transition: 0.3s;
  border-radius: 24px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.switch-checkbox:checked + .switch-slider {
  background-color: #C1121C;
}

.switch-checkbox:checked + .switch-slider:before {
  transform: translateX(20px);
}

.switch-description {
  font-size: 13px;
  color: #111;
  user-select: none;
}

/* Range inputs */
.range-inputs {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.range-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.range-unit {
  position: absolute;
  right: 14px;
  bottom: 11px;
  font-size: 12px;
  color: #aaa;
  pointer-events: none;
}

/* Option search */
.options-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #EDEDEF;
  border: 1px solid transparent;
  border-radius: 12px;
  margin-bottom: 10px;
  padding: 8px 12px;
  transition: border-color 0.15s;
}

.options-search-wrap:focus-within {
  border-color: #1A1A1A;
}

.options-search-icon {
  width: 14px;
  height: 14px;
  color: #999;
  flex-shrink: 0;
  transition: color 0.15s;
}

.options-search-wrap:focus-within .options-search-icon {
  color: #1A1A1A;
}

.options-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #111;
  padding: 0;
  min-width: 0;
}

.options-search-input::placeholder {
  color: #bbb;
}

.options-search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #bbb;
  flex-shrink: 0;
  transition: color 0.15s;
}

.options-search-clear:hover {
  color: #555;
}

.options-search-clear svg {
  width: 11px;
  height: 11px;
}

.options-no-results {
  font-size: 12px;
  color: #bbb;
  padding: 2px 0;
}

/* Per-filter reset link */
.filter-reset-link {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  padding: 4px 0;
  margin: -2px 0 10px auto;
  font-size: 13px;
  color: #C1121C;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: rgba(193, 18, 28, 0.4);
  transition: text-decoration-color 0.15s, color 0.15s;
}

.filter-reset-link:active,
.filter-reset-link:hover {
  text-decoration-color: #C1121C;
}

.section-content {
  display: flex;
  flex-direction: column;
}

/* Show all options button */
.show-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 10px 0 2px;
  margin-top: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #C1121C;
  cursor: pointer;
  align-self: flex-start;
  transition: opacity 0.15s;
}

.show-all-btn:active {
  opacity: 0.7;
}

.show-all-arrow {
  width: 13px;
  height: 13px;
}

/* Bottom-sheet modal */
.options-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.options-modal {
  background: #fff;
  width: 100%;
  max-width: 560px;
  max-height: 88vh;
  border-radius: 18px 18px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.18);
}

.options-modal-handle {
  width: 36px;
  height: 4px;
  background: #E8E6E0;
  border-radius: 2px;
  margin: 8px auto 0;
  flex-shrink: 0;
}

.options-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 14px;
  border-bottom: 1px solid #E8E6E0;
  flex-shrink: 0;
  gap: 12px;
}

.options-modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #1A1A1A;
  letter-spacing: -0.01em;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.options-modal-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.options-modal-reset {
  background: none;
  border: none;
  padding: 6px 4px;
  font-size: 13px;
  color: #C1121C;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: rgba(193, 18, 28, 0.4);
}

.options-modal-reset:active {
  text-decoration-color: #C1121C;
}

.options-modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: #F5F4F0;
  border-radius: 50%;
  cursor: pointer;
  color: #1A1A1A;
  flex-shrink: 0;
}

.options-modal-close svg {
  width: 18px;
  height: 18px;
}

.options-modal-close:active {
  background: #E8E6E0;
}

.options-modal-search {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 20px;
  padding: 12px 14px;
  background: #EDEDEF;
  border: 1px solid transparent;
  border-radius: 12px;
  flex-shrink: 0;
  transition: border-color 0.15s;
}

.options-modal-search:focus-within {
  border-color: #1A1A1A;
}

.options-modal-search > svg {
  width: 16px;
  height: 16px;
  color: #999;
  flex-shrink: 0;
  transition: color 0.15s;
}

.options-modal-search:focus-within > svg {
  color: #1A1A1A;
}

.options-modal-search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #1A1A1A;
  padding: 0;
  min-width: 0;
}

.options-modal-search input::placeholder {
  color: #bbb;
}

.options-modal-search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #bbb;
  flex-shrink: 0;
}

.options-modal-search-clear svg {
  width: 14px;
  height: 14px;
}

.options-modal-list {
  flex: 1;
  overflow-y: auto;
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.options-modal-list .option-item {
  padding: 6px 0;
  gap: 12px;
}

.options-modal-list .option-label {
  font-size: 15px;
}

.options-modal-list .option-checkmark {
  width: 22px;
  height: 22px;
  border-radius: 6px;
}

.options-modal-list .option-checkbox:checked + .option-checkmark::after {
  width: 5px;
  height: 10px;
  border-width: 0 2.5px 2.5px 0;
  margin-top: -2px;
}

.options-modal-list .color-circle {
  width: 22px;
  height: 22px;
}

.options-modal-footer {
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid #E8E6E0;
  flex-shrink: 0;
}

.options-modal-apply {
  width: 100%;
  padding: 14px 20px;
  background: #1A1A1A;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.options-modal-apply:active {
  background: #333;
}

/* Sheet transitions */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.28s ease;
}

.sheet-enter-active .options-modal,
.sheet-leave-active .options-modal {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .options-modal,
.sheet-leave-to .options-modal {
  transform: translateY(100%);
}

@media (max-width: 768px) {
  .catalog-filter {
    position: static;
    margin-bottom: 0;
    padding: 8px 20px 88px;
  }

  /* Drawer уже показывает заголовок "Фильтры" и кнопку закрытия — не дублируем здесь */
  .filter-header {
    display: none;
  }

  .filter-section {
    border-bottom-color: #ECEAE4;
  }

  .section-header,
  .boolean-row {
    padding: 16px 0;
    font-size: 15px;
    font-weight: 500;
  }

  .chevron {
    width: 16px;
    height: 16px;
  }

  .section-content {
    padding-bottom: 18px;
  }

  /* Бóльшие тач-таргеты на мобильных */
  .option-item {
    padding: 6px 0;
    gap: 12px;
  }

  .option-label,
  .switch-description {
    font-size: 14px;
  }

  .option-checkmark {
    width: 22px;
    height: 22px;
    border-radius: 6px;
  }

  .option-checkbox:checked + .option-checkmark::after {
    width: 5px;
    height: 10px;
    border-width: 0 2.5px 2.5px 0;
    margin-top: -2px;
  }

  .color-circle {
    width: 22px;
    height: 22px;
  }

  .options-list {
    gap: 4px;
    max-height: none;
    overflow-y: visible;
    padding-right: 0;
  }

  /* font-size: 16px предотвращает zoom при фокусе input'ов на iOS */
  .price-input,
  .range-input-field {
    font-size: 16px;
    padding: 12px 14px;
  }

  .options-search-wrap {
    padding: 10px 14px;
  }

  .options-search-input {
    font-size: 16px;
    padding: 0;
  }

  .price-label,
  .range-label {
    font-size: 12px;
  }

  .price-inputs,
  .range-inputs {
    gap: 14px;
  }

  .price-slider {
    height: 36px;
    margin-top: 4px;
  }

  /* Сделать ползунки чуть крупнее для тач-взаимодействия */
  .range-input::-webkit-slider-thumb {
    width: 18px;
    height: 18px;
  }

  .range-input::-moz-range-thumb {
    width: 18px;
    height: 18px;
  }

  .options-search-input {
    padding: 6px 0;
  }
}
</style>