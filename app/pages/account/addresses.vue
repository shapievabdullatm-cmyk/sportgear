<script setup lang="ts">
import type { Address } from '~/types'

definePageMeta({ middleware: 'auth' })

const { $api }     = useApi()
const addressStore = useAddressStore()
const toast        = useToastStore()

const menuOpenId      = ref<number | null>(null)
const showModal       = ref(false)
const editingId       = ref<number | null>(null)
const saving          = ref(false)
const saveErr         = ref('')
const confirmDeleteId = ref<number | null>(null)
const deletingId      = ref<number | null>(null)
const settingDefaultId = ref<number | null>(null)
const mapStatus       = ref<'loading' | 'ready' | 'error'>('loading')



// ── Form ─────────────────────────────────────────────────────────
const form = reactive({
    title:        'Дом',
    full_address: '',
    lat:          null as number | null,
    lon:          null as number | null,
    city:         null as string | null,
    street:       null as string | null,
    house:        null as string | null,
    apartment:    '',
    entrance:     '',
    floor:        '',
    intercom:     '',
    comment:      '',
    is_default:   false,
})

// ── Suggest (через backend) ───────────────────────────────────────
interface Suggestion { display: string; subtitle: string; value: string }
interface GeoResult  {
    full_address: string; lat: number; lon: number
    city: string | null;  street: string | null; house: string | null
}

const searchQuery     = ref('')
const suggestions     = ref<Suggestion[]>([])
const showSuggestions = ref(false)
let suggestTimer: ReturnType<typeof setTimeout> | null = null

async function onSearchInput() {
    if (searchQuery.value.length < 2) {
        suggestions.value = []; showSuggestions.value = false; return
    }
    if (suggestTimer) clearTimeout(suggestTimer)
    suggestTimer = setTimeout(async () => {
        try {
            const res = await $api<Suggestion[]>(
                `/geocoder/suggest?q=${encodeURIComponent(searchQuery.value)}`
            )
            suggestions.value     = res || []
            showSuggestions.value = suggestions.value.length > 0
        } catch { suggestions.value = [] }
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

// ── Geocode через backend ─────────────────────────────────────────
async function applyGeocode(query: string) {
    saveErr.value = ''
    try {
        const res = await $api<GeoResult>(
            `/geocoder/geocode?q=${encodeURIComponent(query)}`
        )
        form.full_address = res.full_address
        form.lat          = res.lat
        form.lon          = res.lon
        form.city         = res.city
        form.street       = res.street
        form.house        = res.house
        searchQuery.value     = res.full_address
        showSuggestions.value = false
        if (mapInst && ym) {
            setMark([res.lat, res.lon])
            mapInst.setCenter([res.lat, res.lon], 16, { duration: 300 })
        }
    } catch {}
}

// ── Геолокация ────────────────────────────────────────────────────
const locating = ref(false)

async function detectLocation() {
    if (!navigator.geolocation) { saveErr.value = 'Геолокация не поддерживается браузером'; return }
    locating.value = true
    saveErr.value  = ''
    navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
            const lat = coords.latitude
            const lon = coords.longitude
            // Сразу ставим маркер на точные GPS-координаты
            if (mapInst && ym) {
                setMark([lat, lon])
                mapInst.setCenter([lat, lon], 17, { duration: 300 })
            }
            // Геокодер нужен только для текста адреса — координаты не берём
            try {
                const res = await $api<GeoResult>(
                    `/geocoder/geocode?q=${encodeURIComponent(`${lon},${lat}`)}`
                )
                form.full_address = res.full_address
                form.lat          = lat
                form.lon          = lon
                form.city         = res.city
                form.street       = res.street
                form.house        = res.house
                searchQuery.value = res.full_address
                saveErr.value     = ''
            } catch {}
            locating.value = false
        },
        () => {
            saveErr.value  = 'Не удалось получить местоположение'
            locating.value = false
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
}

// ── Yandex Maps (только карта + клик) ────────────────────────────
const config       = useRuntimeConfig()
const mapContainer = ref<HTMLElement | null>(null)
let ym:      any   = null
let mapInst: any   = null
let plcmrk:  any   = null

function loadYmaps(): Promise<void> {
    return new Promise((resolve, reject) => {
        const w = window as any
        if (w.ymaps) { ym = w.ymaps; w.ymaps.ready(resolve); return }
        const script    = document.createElement('script')
        script.src      = `https://api-maps.yandex.ru/2.1/?apikey=${config.public.yandexMapsKey}&lang=ru_RU`
        script.async    = true
        script.onerror  = () => reject(new Error('map load failed'))
        script.onload   = () => { ym = w.ymaps; w.ymaps.ready(resolve) }
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
        const coords: [number, number] = e.get('coords') // [lat, lon]
        setMark(coords)
        await applyGeocode(`${coords[1]},${coords[0]}`) // geocoder ожидает lon,lat
    })
}

function setMark(coords: [number, number]) {
    if (plcmrk) mapInst.geoObjects.remove(plcmrk)
    plcmrk = new ym.Placemark(coords, {}, { preset: 'islands#redDotIcon' })
    mapInst.geoObjects.add(plcmrk)
    mapInst.panTo(coords, { flying: true })
}

// ── Modal ─────────────────────────────────────────────────────────
function resetForm() {
    Object.assign(form, {
        title: 'Дом', full_address: '', lat: null, lon: null,
        city: null, street: null, house: null,
        apartment: '', entrance: '', floor: '', intercom: '', comment: '', is_default: false,
    })
    searchQuery.value     = ''
    suggestions.value     = []
    showSuggestions.value = false
    mapStatus.value       = 'loading'
}

async function openModal(addr?: Address) {
    resetForm()
    editingId.value = addr?.id ?? null
    if (addr) {
        Object.assign(form, {
            title:        addr.title,
            full_address: addr.full_address,
            lat:          addr.lat,
            lon:          addr.lon,
            city:         addr.city,
            street:       addr.street,
            house:        addr.house,
            apartment:    addr.apartment ?? '',
            entrance:     addr.entrance  ?? '',
            floor:        addr.floor     ?? '',
            intercom:     addr.intercom  ?? '',
            comment:      addr.comment   ?? '',
            is_default:   addr.is_default,
        })
        searchQuery.value = addr.full_address
    }
    showModal.value = true
    await nextTick()
    try {
        await loadYmaps()
        initMap()
        if (addr?.lat && addr?.lon) {
            setMark([addr.lat, addr.lon])
            mapInst.setCenter([addr.lat, addr.lon], 16)
        }
        mapStatus.value = 'ready'
    } catch {
        mapStatus.value = 'error'
    }
}

function closeModal() {
    showModal.value = false
    editingId.value = null
    if (mapInst) { mapInst.destroy(); mapInst = null }
    plcmrk = null
}

// ── CRUD ──────────────────────────────────────────────────────────
async function saveAddress() {
    if (!form.full_address) { saveErr.value = 'Выберите адрес на карте или через поиск'; return }
    if (!form.house) { saveErr.value = 'Укажите адрес с номером дома'; return }
    saveErr.value = ''; saving.value = true
    const payload = {
        title:        form.title || 'Дом',
        full_address: form.full_address,
        lat:          form.lat,
        lon:          form.lon,
        city:         form.city      || null,
        street:       form.street    || null,
        house:        form.house     || null,
        apartment:    form.apartment || null,
        entrance:     form.entrance  || null,
        floor:        form.floor     || null,
        intercom:     form.intercom  || null,
        comment:      form.comment   || null,
        is_default:   form.is_default,
    }
    try {
        if (editingId.value) {
            await addressStore.updateAddress(editingId.value, payload)
            toast.success('Адрес обновлён')
        } else {
            await addressStore.addAddress(payload)
            toast.success('Адрес сохранён')
        }
        closeModal()
    } catch (e: any) {
        saveErr.value = e?.data?.message ?? 'Ошибка сохранения'
    } finally { saving.value = false }
}

async function deleteAddress(id: number) {
    confirmDeleteId.value = null
    deletingId.value = id
    try {
        await addressStore.removeAddress(id)
        toast.success('Адрес удалён')
    } catch {
        toast.error('Не удалось удалить адрес')
    } finally { deletingId.value = null }
}

async function setDefault(id: number) {
    settingDefaultId.value = id
    try {
        await addressStore.setDefaultAddress(id)
        toast.success('Основной адрес изменён')
    } catch {
        toast.error('Не удалось изменить основной адрес')
    } finally { settingDefaultId.value = null }
}

onMounted(() => {
    addressStore.fetchAddresses()
    document.addEventListener('click', () => { menuOpenId.value = null })
})
onUnmounted(() => {
    if (mapInst) { mapInst.destroy(); mapInst = null }
    document.removeEventListener('click', () => { menuOpenId.value = null })
})
</script>

<template>
    <AccountMobileHeader title="Адреса доставки" :back="true" />
    <div class="account-wrap">
        <AccountSidebar />

        <main class="account-main">
            <div class="page-head">
                <h2 class="section-title">Адреса доставки</h2>

                <button
                    class="add-btn"
                    :disabled="addressStore.addresses.length >= 100"
                    :title="addressStore.addresses.length >= 100 ? 'Достигнут лимит адресов' : undefined"
                    @click="openModal()"
                >+ Добавить адрес</button>
            </div>

            <!-- Скелетон -->
            <template v-if="addressStore.loading">
                <div class="addresses-list">
                    <div v-for="n in 3" :key="n" class="addr-card addr-skeleton">
                        <div class="skel skel-title" />
                        <div class="skel skel-line" />
                        <div class="skel skel-line skel-line--short" />
                    </div>
                </div>
            </template>

            <template v-else>
                <div v-if="!addressStore.addresses.length" class="empty-state">
                    У вас пока нет сохранённых адресов
                </div>

                <div v-else class="addresses-list">
                    <div v-for="addr in addressStore.addresses" :key="addr.id" class="addr-card">
                        <!-- Kebab menu -->
                        <div class="card-menu-wrap" @click.stop>
                            <button
                                class="kebab-btn"
                                :class="{ active: menuOpenId === addr.id }"
                                @click="menuOpenId = menuOpenId === addr.id ? null : addr.id"
                            >
                                <span /><span /><span />
                            </button>
                            <div v-if="menuOpenId === addr.id" class="card-menu">
                                <button
                                    v-if="!addr.is_default"
                                    class="card-menu-item"
                                    :disabled="settingDefaultId === addr.id"
                                    @click="setDefault(addr.id); menuOpenId = null"
                                >{{ settingDefaultId === addr.id ? '…' : 'Сделать основным' }}</button>
                                <button class="card-menu-item" @click="openModal(addr); menuOpenId = null">
                                    Редактировать
                                </button>
                                <template v-if="confirmDeleteId === addr.id">
                                    <div class="card-menu-confirm">
                                        <span>Удалить?</span>
                                        <button class="card-menu-item card-menu-item--danger" :disabled="deletingId === addr.id" @click="deleteAddress(addr.id)">
                                            {{ deletingId === addr.id ? '…' : 'Да' }}
                                        </button>
                                        <button class="card-menu-item" @click="confirmDeleteId = null">Нет</button>
                                    </div>
                                </template>
                                <button v-else class="card-menu-item card-menu-item--danger" @click="confirmDeleteId = addr.id">
                                    Удалить
                                </button>
                            </div>
                        </div>

                        <div class="addr-card-top">
                            <span class="addr-title">{{ addr.title }}</span>
                            <span v-if="addr.is_default" class="badge-default">Основной</span>
                        </div>
                        <p class="addr-full">{{ addr.full_address }}</p>
                        <p v-if="addr.apartment || addr.entrance || addr.floor || addr.intercom" class="addr-details">
                            <span v-if="addr.apartment">кв. {{ addr.apartment }}</span>
                            <span v-if="addr.entrance">подъезд {{ addr.entrance }}</span>
                            <span v-if="addr.floor">этаж {{ addr.floor }}</span>
                            <span v-if="addr.intercom">домофон {{ addr.intercom }}</span>
                        </p>
                        <p v-if="addr.comment" class="addr-comment">{{ addr.comment }}</p>
                    </div>
                </div>
            </template>
        </main>
    </div>

    <!-- Modal -->
    <Teleport to="body">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal-card">

                <!-- Header -->
                <div class="modal-header">
                    <span class="modal-title">{{ editingId ? 'Редактировать адрес' : 'Добавить адрес' }}</span>
                    <button class="modal-close" @click="closeModal">✕</button>
                </div>

                <!-- Two-column body -->
                <div class="modal-layout">

                    <!-- LEFT: карта -->
                    <div class="modal-map-col">
                        <div v-if="mapStatus === 'loading'" class="map-placeholder">Загрузка карты…</div>
                        <div v-else-if="mapStatus === 'error'" class="map-placeholder map-error">Не удалось загрузить карту</div>
                        <div v-show="mapStatus === 'ready'" ref="mapContainer" class="map-container" />
                    </div>

                    <!-- RIGHT: форма -->
                    <div class="modal-form-col">

                        <!-- Search -->
                        <div class="uf-field suggest-wrap">
                            <div class="search-label-row">
                                <span class="uf-label">Адрес</span>
                                <button class="locate-btn" :disabled="locating" @click="detectLocation">
                                    <svg v-if="!locating" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="9" stroke-dasharray="2 4"/></svg>
                                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                    {{ locating ? 'Определяем…' : 'Моё местоположение' }}
                                </button>
                            </div>
                            <input
                                v-model="searchQuery"
                                type="text"
                                class="uf-input"
                                placeholder="Начните вводить улицу..."
                                autocomplete="off"
                                @input="onSearchInput"
                                @blur="hideSuggestions"
                            />
                            <div v-if="showSuggestions && suggestions.length" class="suggest-dropdown">
                                <div
                                    v-for="s in suggestions"
                                    :key="s.value"
                                    class="suggest-item"
                                    @mousedown.prevent="selectSuggestion(s)"
                                >
                                    <span class="suggest-display">{{ s.display }}</span>
                                    <span v-if="s.subtitle" class="suggest-sub">{{ s.subtitle }}</span>
                                </div>
                            </div>
                        </div>

                        <p v-if="saveErr" class="form-error form-error--top">{{ saveErr }}</p>

                        <p v-if="form.full_address" class="selected-address">{{ form.full_address }}</p>
                        <p v-else-if="mapStatus === 'ready'" class="map-hint">Нажмите на карту или воспользуйтесь поиском</p>

                        <!-- Details grid -->
                        <div class="fields-grid">
                            <div class="uf-field">
                                <span class="uf-label">Квартира / офис</span>
                                <input v-model="form.apartment" type="text" class="uf-input" placeholder="42" />
                            </div>
                            <div class="uf-field">
                                <span class="uf-label">Подъезд</span>
                                <input v-model="form.entrance" type="text" class="uf-input" placeholder="1" />
                            </div>
                            <div class="uf-field">
                                <span class="uf-label">Этаж</span>
                                <input v-model="form.floor" type="text" class="uf-input" placeholder="5" />
                            </div>
                            <div class="uf-field">
                                <span class="uf-label">Домофон</span>
                                <input v-model="form.intercom" type="text" class="uf-input" placeholder="42К" />
                            </div>
                        </div>

                        <div class="uf-field">
                            <span class="uf-label">Название адреса</span>
                            <input v-model="form.title" type="text" class="uf-input" placeholder="Дом, Работа..." />
                        </div>

                        <div class="uf-field">
                            <span class="uf-label">Комментарий курьеру</span>
                            <input v-model="form.comment" type="text" class="uf-input" placeholder="Необязательно" />
                        </div>

                        <label class="default-check">
                            <input v-model="form.is_default" type="checkbox" />
                            Сделать основным адресом
                        </label>

                        <div class="modal-footer">
                            <button class="save-btn" :disabled="saving || !form.full_address" @click="saveAddress">
                                {{ saving ? 'Сохраняем…' : editingId ? 'Обновить' : 'Сохранить' }}
                            </button>
                            <button class="cancel-btn" @click="closeModal">Отмена</button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    </Teleport>
</template>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────── */
.account-wrap {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 0;
    min-height: calc(100vh - 120px);
    max-width: 1200px;
    margin: 0 auto;
    padding: 60px 40px;
}

.account-main { padding: 0 60px 0 0; }

/* ── Header ──────────────────────────────────────────────────────── */
.page-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
}

.section-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #aaa;
    margin: 0;
}

.add-btn {
    padding: 9px 20px;
    background: #111;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Montserrat', sans-serif;
    cursor: pointer;
    transition: opacity 0.15s;
}
.add-btn:hover { opacity: 0.8; }

/* ── Empty / list ────────────────────────────────────────────────── */
.empty-state { font-size: 14px; color: #bbb; padding: 40px 0; }

/* ── Skeleton ────────────────────────────────────────────────────── */
@keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
}
.skel {
    border-radius: 4px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 800px 100%;
    animation: shimmer 1.4s infinite;
}
.addr-skeleton { pointer-events: none; }
.skel-title       { height: 14px; width: 80px;  margin-bottom: 14px; }
.skel-line        { height: 12px; width: 100%; margin-bottom: 10px; }
.skel-line--short { width: 55%; }

.addresses-list { display: flex; flex-direction: column; gap: 14px; }

.addr-card {
    position: relative;
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    padding: 20px 24px;
    transition: border-color 0.15s;
}
.addr-card:hover { border-color: #e0e0e0; }

/* ── Kebab menu ──────────────────────────────────────────────────── */
.card-menu-wrap {
    position: absolute; top: 16px; right: 16px;
}

.kebab-btn {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; width: 28px; height: 28px; background: none; border: none;
    cursor: pointer; border-radius: 6px; padding: 0;
    transition: background 0.15s;
}
.kebab-btn span {
    display: block; width: 4px; height: 4px;
    background: #bbb; border-radius: 50%; transition: background 0.15s;
}
.kebab-btn:hover span,
.kebab-btn.active span { background: #111; }
.kebab-btn:hover,
.kebab-btn.active { background: #f5f5f5; }

.card-menu {
    position: absolute; top: calc(100% + 6px); right: 0;
    background: #fff; border: 1px solid #ebebeb; border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,.1); z-index: 50;
    min-width: 180px; overflow: hidden;
}

.card-menu-item {
    display: block; width: 100%; text-align: left;
    padding: 10px 16px; font-size: 13px; font-family: 'Montserrat', sans-serif;
    color: #111; background: none; border: none; cursor: pointer;
    transition: background 0.1s;
}
.card-menu-item:hover:not(:disabled) { background: #f8f8f8; }
.card-menu-item:disabled { opacity: 0.4; cursor: not-allowed; }
.card-menu-item--danger { color: #d14343; }
.card-menu-item + .card-menu-item { border-top: 1px solid #f5f5f5; }

.card-menu-confirm {
    display: flex; align-items: center; gap: 0;
    border-top: 1px solid #f5f5f5; padding: 6px 16px;
    font-size: 12px; color: #555;
}
.card-menu-confirm span { flex: 1; }
.card-menu-confirm .card-menu-item {
    padding: 4px 10px; width: auto; font-size: 12px; border-top: none;
}

.addr-card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }

.addr-title { font-size: 14px; font-weight: 600; color: #111; }

.badge-default {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; background: #111; color: #fff;
    padding: 3px 8px; border-radius: 4px;
}

.addr-full { font-size: 14px; color: #333; margin: 0 0 6px; line-height: 1.5; }

.addr-details {
    font-size: 13px; color: #888; margin: 0 0 4px;
    display: flex; flex-wrap: wrap; gap: 12px;
}

.addr-comment { font-size: 12px; color: #aaa; margin: 0 0 8px; font-style: italic; }


.add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Shared inputs ───────────────────────────────────────────────── */
.uf-field { margin-bottom: 20px; }

.uf-label {
    display: block; font-size: 11px; color: #aaa;
    letter-spacing: 0.06em; margin-bottom: 8px;
}

.uf-input {
    width: 100%; border: none; border-bottom: 1px solid #ddd;
    padding: 6px 0 10px; font-size: 15px; font-family: 'Montserrat', sans-serif;
    color: #111; background: transparent; outline: none;
    transition: border-color 0.15s; appearance: none;
}
.uf-input:focus { border-bottom-color: #111; }
.uf-input::placeholder { color: #ccc; }

.text-link {
    font-size: 12px; color: #999; background: none; border: none; padding: 0;
    cursor: pointer; text-decoration: underline; text-underline-offset: 3px;
    transition: color 0.15s; font-family: 'Montserrat', sans-serif;
}
.text-link:hover { color: #111; }

.save-btn {
    padding: 12px 28px; background: #111; color: #fff; border: none;
    border-radius: 6px; font-size: 13px; font-weight: 600;
    font-family: 'Montserrat', sans-serif; cursor: pointer; transition: opacity 0.15s;
}
.save-btn:hover   { opacity: 0.8; }
.save-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.cancel-btn {
    padding: 12px 20px; background: transparent; border: 1px solid #e0e0e0;
    border-radius: 6px; font-size: 13px; color: #777;
    font-family: 'Montserrat', sans-serif; cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
}
.cancel-btn:hover { border-color: #aaa; color: #111; }

.form-error { font-size: 12px; color: #d14343; margin-bottom: 12px; }
.form-error--top {
    background: #fff5f5; border: 1px solid #fcd0d0; border-radius: 6px;
    padding: 10px 14px; font-size: 13px;
}

/* ── Modal ───────────────────────────────────────────────────────── */
.modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.5);
    z-index: 1200; display: flex; align-items: center;
    justify-content: center; padding: 20px;
}

.modal-card {
    background: #fff; border-radius: 14px; width: 100%; max-width: 1000px;
    max-height: 92vh; display: flex; flex-direction: column;
    overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,.18);
}

.modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 28px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
}

.modal-title { font-size: 15px; font-weight: 700; letter-spacing: .03em; color: #111; }

.modal-close {
    background: none; border: none; font-size: 14px; color: #aaa;
    cursor: pointer; padding: 4px 8px; transition: color .15s; line-height: 1;
}
.modal-close:hover { color: #111; }

/* Two-column layout */
.modal-layout {
    display: grid;
    grid-template-columns: 1fr 420px;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}

.modal-map-col {
    position: relative;
    background: #f5f5f5;
}

.modal-form-col {
    padding: 24px 28px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    border-left: 1px solid #f0f0f0;
}

.modal-footer {
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
    display: flex; gap: 10px;
}

/* ── Map ─────────────────────────────────────────────────────────── */
.map-container {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
}

.map-placeholder {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; color: #aaa;
}
.map-error { color: #d14343; background: #fff5f5; }

.selected-address {
    font-size: 12px; color: #333; background: #f9f9f9; border-radius: 6px;
    padding: 8px 12px; margin-bottom: 16px; line-height: 1.5;
}

.map-hint { font-size: 12px; color: #bbb; margin-bottom: 16px; }

/* ── Search label row ────────────────────────────────────────────── */
.search-label-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 8px;
}
.search-label-row .uf-label { margin-bottom: 0; }

.locate-btn {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600; font-family: 'Montserrat', sans-serif;
    color: #555; background: none; border: none; padding: 0;
    cursor: pointer; letter-spacing: 0.03em; transition: color 0.15s;
}
.locate-btn:hover:not(:disabled) { color: #111; }
.locate-btn:disabled { opacity: 0.45; cursor: not-allowed; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }

/* ── Suggest dropdown ────────────────────────────────────────────── */
.suggest-wrap { position: relative; }

.suggest-dropdown {
    position: absolute; top: 100%; left: 0; right: 0;
    background: #fff; border: 1px solid #e8e8e8; border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,.1); z-index: 1100;
    max-height: 260px; overflow-y: auto; margin-top: 4px;
}

.suggest-item {
    padding: 10px 14px; cursor: pointer; transition: background 0.1s;
    display: flex; flex-direction: column; gap: 2px;
}
.suggest-item:hover { background: #f8f8f8; }
.suggest-item + .suggest-item { border-top: 1px solid #f2f2f2; }

.suggest-display { font-size: 13px; color: #111; }
.suggest-sub     { font-size: 11px; color: #aaa; }

/* ── Fields grid ─────────────────────────────────────────────────── */
.fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }

/* ── Default checkbox ────────────────────────────────────────────── */
.default-check {
    display: flex; align-items: center; gap: 8px; font-size: 13px;
    color: #555; cursor: pointer; margin-bottom: 16px;
    font-family: 'Montserrat', sans-serif;
}
.default-check input { cursor: pointer; }

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 1024px) {
    .account-wrap { padding: 40px 24px; }
    .account-main { padding: 0; }
}

@media (max-width: 768px) {
    /* Layout */
    .account-wrap  { grid-template-columns: 1fr; padding: 16px 16px 48px; }
    .account-main  { padding: 0; }
    .section-title { display: none; }

    /* Add button — full width */
    .page-head     { margin-bottom: 16px; }
    .add-btn       { width: 100%; padding: 14px 20px; border-radius: 12px; font-size: 14px; }

    /* Address cards */
    .addresses-list { gap: 10px; }
    .addr-card      { padding: 16px; border-radius: 12px; }
    .addr-full      { font-size: 13px; }
    .addr-details   { font-size: 12px; gap: 8px; }

    /* Modal — bottom sheet */
    .modal-overlay { align-items: flex-end; padding: 0; }
    .modal-card    {
        border-radius: 20px 20px 0 0;
        max-height: 95dvh;
        max-width: 100%;
    }
    .modal-header  { padding: 16px 20px; }
    .modal-layout  { grid-template-columns: 1fr; grid-template-rows: 220px 1fr; }
    .modal-map-col { min-height: 220px; }
    .modal-form-col {
        border-left: none;
        border-top: 1px solid #f0f0f0;
        padding: 20px;
    }
    .fields-grid   { grid-template-columns: 1fr; }
    .modal-footer  { flex-direction: column; gap: 8px; }
    .save-btn      { width: 100%; text-align: center; }
    .cancel-btn    { width: 100%; text-align: center; }
}
</style>