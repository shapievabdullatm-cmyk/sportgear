<script setup lang="ts">
import type { Shop } from '~/stores/admin/shop'
import type {
    DeliveryMethod,
    OrderCreatePayload,
    PaymentMethod,
} from '~/types/order'

definePageMeta({ middleware: 'auth' })

const { $api } = useApi()
const cartStore    = useCartStore()
const addressStore = useAddressStore()
const orderStore   = useOrderStore()
const authStore    = useAuthStore()
const toast        = useToastStore()
const router       = useRouter()

const deliveryMethod = ref<DeliveryMethod>('courier')
const paymentMethod  = ref<PaymentMethod>('cash')

const customer = reactive({
    name:  '',
    phone: '',
    email: '',
})

const selectedAddressId = ref<number | null>(null)

const shops    = ref<Shop[]>([])
const shopsLoading = ref(false)
const selectedShopId = ref<number | null>(null)
const pickupSlotAt = ref<string | null>(null)  // ISO начала часа

// СДЭК: город + ПВЗ
interface CdekCity { code: number; city: string; region: string; full: string }
interface CdekPoint {
    code: string; name: string; address: string; address_full: string;
    work_time: string; phones: string[]; note: string;
    have_cash: boolean; have_cashless: boolean; is_dressing_room: boolean;
    lat: number; lon: number;
}

const cdekCityQuery   = ref('')
const cdekCityResults = ref<CdekCity[]>([])
const cdekCity        = ref<CdekCity | null>(null)
const cdekCityLoading = ref(false)
const cdekCityFocus   = ref(false)
let   cdekCityTimer: ReturnType<typeof setTimeout> | null = null

const cdekPoints       = ref<CdekPoint[]>([])
const cdekPointsLoading = ref(false)
const cdekSelectedPoint = ref<CdekPoint | null>(null)

// Триггерим поиск через watcher — стабильно реагирует на любой ввод (мышь, IME, paste)
watch(cdekCityQuery, (val) => {
    if (cdekCityTimer) clearTimeout(cdekCityTimer)

    // Если пользователь стёр / удалил выбранный город — сбрасываем точки
    if (cdekCity.value && val !== cdekCity.value.full) {
        cdekCity.value = null
        cdekPoints.value = []
        cdekSelectedPoint.value = null
    }

    const q = val.trim()
    if (q.length < 2) {
        cdekCityResults.value = []
        cdekCityLoading.value = false
        return
    }
    cdekCityLoading.value = true
    cdekCityFocus.value = true
    cdekCityTimer = setTimeout(async () => {
        try {
            cdekCityResults.value = await $api<CdekCity[]>(
                '/cdek/cities?q=' + encodeURIComponent(q)
            )
        } catch (e) {
            console.error('CDEK cities error', e)
            cdekCityResults.value = []
        } finally {
            cdekCityLoading.value = false
        }
    }, 300)
})

async function pickCdekCity(c: CdekCity) {
    cdekCity.value = c
    cdekCityQuery.value = c.full
    cdekCityResults.value = []
    cdekCityFocus.value = false
    cdekSelectedPoint.value = null
    cdekPointsLoading.value = true
    try {
        cdekPoints.value = await $api<CdekPoint[]>(
            '/cdek/pickup-points?city_code=' + c.code
        )
    } catch (e) {
        console.error('CDEK pvz error', e)
        cdekPoints.value = []
    } finally {
        cdekPointsLoading.value = false
    }
}

function resetCdekCity() {
    cdekCity.value = null
    cdekPoints.value = []
    cdekSelectedPoint.value = null
}

function onCdekCityBlur() {
    setTimeout(() => { cdekCityFocus.value = false }, 200)
}

// DOM-рефы карточек ПВЗ — чтобы скроллить их в видимую область
const pointCardRefs = new Map<string, HTMLElement>()
const cdekPointsScroll = ref<HTMLElement | null>(null)
function setPointRef(code: string, el: HTMLElement | null) {
    if (el) pointCardRefs.set(code, el)
    else pointCardRefs.delete(code)
}

function selectPoint(p: CdekPoint) {
    cdekSelectedPoint.value = p
    // Открыть балун на карте
    const item = cdekPlacemarks.find(x => x.point.code === p.code)
    if (item && cdekMap) {
        cdekMap.balloon.open(item.placemark.geometry.getCoordinates(), {
            contentHeader: p.name,
            contentBody:   `${escapeHtml(p.address_full || p.address)}<br><small>${escapeHtml(p.work_time)}</small>`,
        }).catch(() => {})
    }
}

// ── Яндекс.Карта для ПВЗ СДЭК ──────────────────────────────
const config = useRuntimeConfig()
const cdekMapContainer = ref<HTMLElement | null>(null)
let ym:      any = null
let cdekMap: any = null
let cdekPlacemarks: any[] = []

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

function destroyCdekMap() {
    cdekPlacemarks = []
    if (cdekMap) { try { cdekMap.destroy() } catch {}; cdekMap = null }
}

async function renderCdekMap() {
    if (!cdekMapContainer.value || !cdekPoints.value.length) return
    try {
        await loadYmaps()
    } catch {
        return
    }
    destroyCdekMap()

    const valid = cdekPoints.value.filter(p => p.lat && p.lon)
    if (!valid.length) return

    const center: [number, number] = valid[0]
        ? [valid[0].lat, valid[0].lon]
        : [55.75, 37.61]

    cdekMap = new ym.Map(cdekMapContainer.value, {
        center,
        zoom:     11,
        controls: ['zoomControl'],
    })

    cdekPlacemarks = valid.map((p) => {
        const placemark = new ym.Placemark(
            [p.lat, p.lon],
            {
                hintContent:    p.name,
                balloonContent: `<b>${escapeHtml(p.name)}</b><br>${escapeHtml(p.address_full || p.address)}<br><small>${escapeHtml(p.work_time)}</small>`,
            },
            {
                preset: cdekSelectedPoint.value?.code === p.code
                    ? 'islands#redIcon'
                    : 'islands#darkGreenIcon',
            }
        )
        placemark.events.add('click', () => {
            selectPoint(p)
        })
        cdekMap.geoObjects.add(placemark)
        return { placemark, point: p }
    })

    if (valid.length > 1) {
        cdekMap.setBounds(cdekMap.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 30 })
    }
}

// Перерисовываем карту при смене точек или выбора
watch(cdekPoints, async () => {
    await nextTick()
    renderCdekMap()
})

watch(cdekSelectedPoint, async (p) => {
    if (!p) return

    // Скроллим карточку в видимую область списка
    await nextTick()
    const card = pointCardRefs.get(p.code)
    if (card && cdekPointsScroll.value) {
        const scroller = cdekPointsScroll.value
        const cTop = card.offsetTop
        const cBottom = cTop + card.offsetHeight
        const sTop = scroller.scrollTop
        const sBottom = sTop + scroller.clientHeight
        if (cTop < sTop || cBottom > sBottom) {
            scroller.scrollTo({ top: cTop - 8, behavior: 'smooth' })
        }
    }

    // Подсветка и центрирование карты
    if (!cdekMap) return
    for (const { placemark, point } of cdekPlacemarks) {
        placemark.options.set('preset', point.code === p.code ? 'islands#redIcon' : 'islands#darkGreenIcon')
    }
    if (p.lat && p.lon) {
        cdekMap.panTo([p.lat, p.lon], { flying: true })
    }
})

onUnmounted(() => { destroyCdekMap(); destroyRpMap() })

function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c] || c))
}

// Почта России: город + отделение
interface RpCity { code: string; city: string; region: string; full: string }
interface RpOffice {
    index: string; name: string; address: string; address_full: string;
    work_time: string; phone: string; note: string;
    lat: number; lon: number;
}

const rpCityQuery   = ref('')
const rpCityResults = ref<RpCity[]>([])
const rpCity        = ref<RpCity | null>(null)
const rpCityLoading = ref(false)
const rpCityFocus   = ref(false)
let   rpCityTimer: ReturnType<typeof setTimeout> | null = null

const rpOffices        = ref<RpOffice[]>([])
const rpOfficesLoading = ref(false)
const rpSelectedOffice = ref<RpOffice | null>(null)

watch(rpCityQuery, (val) => {
    if (rpCityTimer) clearTimeout(rpCityTimer)
    if (rpCity.value && val !== rpCity.value.full) {
        rpCity.value = null
        rpOffices.value = []
        rpSelectedOffice.value = null
    }
    const q = val.trim()
    if (q.length < 2) {
        rpCityResults.value = []
        rpCityLoading.value = false
        return
    }
    rpCityLoading.value = true
    rpCityFocus.value = true
    rpCityTimer = setTimeout(async () => {
        try {
            rpCityResults.value = await $api<RpCity[]>(
                '/russian-post/cities?q=' + encodeURIComponent(q)
            )
        } catch (e) {
            console.error('RP cities error', e)
            rpCityResults.value = []
        } finally {
            rpCityLoading.value = false
        }
    }, 300)
})

async function pickRpCity(c: RpCity) {
    rpCity.value = c
    rpCityQuery.value = c.full
    rpCityResults.value = []
    rpCityFocus.value = false
    rpSelectedOffice.value = null
    rpOfficesLoading.value = true
    try {
        rpOffices.value = await $api<RpOffice[]>(
            '/russian-post/pickup-points?city_code=' + encodeURIComponent(c.code)
        )
    } catch (e) {
        console.error('RP offices error', e)
        rpOffices.value = []
    } finally {
        rpOfficesLoading.value = false
    }
}

function resetRpCity() {
    rpCity.value = null
    rpOffices.value = []
    rpSelectedOffice.value = null
}

function onRpCityBlur() {
    setTimeout(() => { rpCityFocus.value = false }, 200)
}

// DOM-рефы карточек отделений
const rpOfficeRefs = new Map<string, HTMLElement>()
const rpOfficesScroll = ref<HTMLElement | null>(null)
function setRpOfficeRef(index: string, el: HTMLElement | null) {
    if (el) rpOfficeRefs.set(index, el)
    else rpOfficeRefs.delete(index)
}

function selectRpOffice(o: RpOffice) {
    rpSelectedOffice.value = o
    const item = rpPlacemarks.find(x => x.office.index === o.index)
    if (item && rpMap) {
        rpMap.balloon.open(item.placemark.geometry.getCoordinates(), {
            contentHeader: o.name,
            contentBody:   `${escapeHtml(o.address_full || o.address)}<br><small>${escapeHtml(o.work_time)}</small>`,
        }).catch(() => {})
    }
}

const rpMapContainer = ref<HTMLElement | null>(null)
let rpMap: any = null
let rpPlacemarks: { placemark: any; office: RpOffice }[] = []

function destroyRpMap() {
    rpPlacemarks = []
    if (rpMap) { try { rpMap.destroy() } catch {}; rpMap = null }
}

async function renderRpMap() {
    if (!rpMapContainer.value || !rpOffices.value.length) return
    try { await loadYmaps() } catch { return }
    destroyRpMap()

    const valid = rpOffices.value.filter(o => o.lat && o.lon)
    if (!valid.length) return

    rpMap = new ym.Map(rpMapContainer.value, {
        center:   [valid[0].lat, valid[0].lon],
        zoom:     11,
        controls: ['zoomControl'],
    })

    rpPlacemarks = valid.map((o) => {
        const placemark = new ym.Placemark(
            [o.lat, o.lon],
            {
                hintContent:    o.name,
                balloonContent: `<b>${escapeHtml(o.name)}</b><br>${escapeHtml(o.address_full || o.address)}<br><small>${escapeHtml(o.work_time)}</small>`,
            },
            {
                preset: rpSelectedOffice.value?.index === o.index
                    ? 'islands#redIcon'
                    : 'islands#blueIcon',
            }
        )
        placemark.events.add('click', () => selectRpOffice(o))
        rpMap.geoObjects.add(placemark)
        return { placemark, office: o }
    })

    if (valid.length > 1) {
        rpMap.setBounds(rpMap.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 30 })
    }
}

watch(rpOffices, async () => {
    await nextTick()
    renderRpMap()
})

watch(rpSelectedOffice, async (o) => {
    if (!o) return
    await nextTick()
    const card = rpOfficeRefs.get(o.index)
    if (card && rpOfficesScroll.value) {
        const scroller = rpOfficesScroll.value
        const cTop = card.offsetTop
        const cBottom = cTop + card.offsetHeight
        const sTop = scroller.scrollTop
        const sBottom = sTop + scroller.clientHeight
        if (cTop < sTop || cBottom > sBottom) {
            scroller.scrollTo({ top: cTop - 8, behavior: 'smooth' })
        }
    }
    if (!rpMap) return
    for (const { placemark, office } of rpPlacemarks) {
        placemark.options.set('preset', office.index === o.index ? 'islands#redIcon' : 'islands#blueIcon')
    }
    if (o.lat && o.lon) rpMap.panTo([o.lat, o.lon], { flying: true })
})

const comment = ref('')
const submitError = ref('')

async function loadShops() {
    if (shops.value.length) return
    shopsLoading.value = true
    try {
        shops.value = await $api<Shop[]>('/shops')
        if (shops.value.length && !selectedShopId.value) {
            selectedShopId.value = shops.value[0].id
        }
    } catch (e) {
        console.error('Не удалось загрузить магазины', e)
    } finally {
        shopsLoading.value = false
    }
}

// ── Загрузка корзины, адресов и магазинов ────────────────────────
onMounted(async () => {
    if (!cartStore.initialized) {
        await cartStore.fetchCart()
    }
    if (cartStore.isEmpty) {
        await router.replace('/cart')
        return
    }

    // Грузим адреса и магазины параллельно — оба нужны для разных способов доставки
    await Promise.all([
        addressStore.fetchAddresses(),
        loadShops(),
    ])

    if (addressStore.addresses.length) {
        const def = addressStore.addresses.find(a => a.is_default) ?? addressStore.addresses[0]
        selectedAddressId.value = def.id
    }

    // Префиллим имя/телефон из профиля
    if (authStore.user) {
        const first = authStore.user.first_name ?? ''
        const last  = authStore.user.last_name  ?? ''
        customer.name  = [first, last].filter(Boolean).join(' ').trim()
        customer.phone = authStore.user.phone ?? ''
        customer.email = authStore.user.email ?? ''
    }
})

const selectedAddress = computed(() =>
    addressStore.addresses.find(a => a.id === selectedAddressId.value) ?? null
)

const selectedShop = computed(() =>
    shops.value.find(s => s.id === selectedShopId.value) ?? null
)

// ── Слоты самовывоза ─────────────────────────────────────────────
interface SlotItem {
    iso: string
    label: string
    booked: number
    capacity: number
    disabled: boolean
    reason: 'past' | 'break' | 'full' | null
}
interface SlotDay { date: Date; label: string; slots: SlotItem[] }

function parseHM(s: string | null | undefined): { h: number; m: number } | null {
    if (!s) return null
    const m = s.match(/^(\d{1,2}):(\d{2})/)
    return m ? { h: Number(m[1]), m: Number(m[2]) } : null
}
function jsDayToIso(d: number): number { return d === 0 ? 7 : d }

const slotBookings = ref<Record<string, number>>({})
const slotCapacity = ref<number>(5)

async function loadSlotBookings(shopId: number) {
    try {
        const res = await $api<{ max_per_slot: number; bookings: Record<string, number> }>(
            `/shops/${shopId}/pickup-slot-bookings`
        )
        slotBookings.value = res.bookings ?? {}
        slotCapacity.value = res.max_per_slot ?? 5
    } catch (e) {
        console.error('Не удалось загрузить занятость слотов', e)
        slotBookings.value = {}
    }
}

watch(selectedShopId, (id) => {
    if (id) loadSlotBookings(id)
    else slotBookings.value = {}
}, { immediate: true })

const slotDays = computed<SlotDay[]>(() => {
    const shop = selectedShop.value
    if (!shop || !shop.working_hours || shop.pickup_enabled === false) return []

    const slotMin = shop.pickup_slot_minutes ?? 60
    const minLead = shop.pickup_min_lead_minutes ?? 120
    const advance = shop.pickup_advance_days ?? 7
    const capacity = shop.pickup_max_per_slot ?? 5

    const days: SlotDay[] = []
    const now = new Date()
    const minStart = new Date(now.getTime() + minLead * 60 * 1000)

    for (let i = 0; i < advance; i++) {
        const d = new Date(now)
        d.setDate(d.getDate() + i)
        d.setHours(0, 0, 0, 0)

        const dow = jsDayToIso(d.getDay())
        const wh = shop.working_hours.find(w => w.day === dow)
        if (!wh || !wh.is_open) continue

        const open  = parseHM(wh.open)
        const close = parseHM(wh.close)
        if (!open || !close) continue

        const breaks = (wh.break ?? []).map(b => ({
            from: parseHM(b.from),
            to:   parseHM(b.to),
        })).filter(b => b.from && b.to) as { from: { h: number; m: number }; to: { h: number; m: number } }[]

        const startMin = open.h * 60 + open.m
        const endMin   = close.h * 60 + close.m

        const slots: SlotItem[] = []
        for (let t = startMin; t + slotMin <= endMin; t += slotMin) {
            const slotStart = new Date(d)
            slotStart.setHours(0, t, 0, 0)
            const slotEnd = new Date(slotStart.getTime() + slotMin * 60 * 1000)

            // Перерыв (любое пересечение слота с перерывом)
            const slotStartMin = t
            const slotEndMin   = t + slotMin
            const inBreak = breaks.some(b => {
                const bs = b.from.h * 60 + b.from.m
                const be = b.to.h   * 60 + b.to.m
                return slotStartMin < be && slotEndMin > bs
            })

            const isPast = slotStart < minStart
            const iso = slotStart.toISOString()
            const booked = slotBookings.value[iso] ?? 0
            const isFull = booked >= capacity

            let reason: SlotItem['reason'] = null
            if (isPast)        reason = 'past'
            else if (inBreak)  reason = 'break'
            else if (isFull)   reason = 'full'

            slots.push({
                iso,
                label: formatRange(slotStart, slotEnd),
                booked,
                capacity,
                disabled: reason !== null,
                reason,
            })
        }

        if (slots.some(s => !s.disabled)) {
            const label = i === 0 ? 'Сегодня'
                : i === 1 ? 'Завтра'
                : d.toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: '2-digit' })
            days.push({ date: d, label, slots })
        }
    }

    return days
})

function formatRange(start: Date, end: Date): string {
    const fmt = (x: Date) => `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`
    return `${fmt(start)} – ${fmt(end)}`
}

const selectedDayIdx = ref(0)
watch([selectedShopId, slotDays], () => {
    selectedDayIdx.value = 0
    if (pickupSlotAt.value) {
        const exists = slotDays.value.some(d => d.slots.some(s => s.iso === pickupSlotAt.value && !s.disabled))
        if (!exists) pickupSlotAt.value = null
    }
}, { flush: 'post' })

const itemsTotal = computed(() =>
    cartStore.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
)

const canSubmit = computed(() => {
    if (!customer.name.trim() || !customer.phone.trim()) return false
    if (cartStore.isEmpty) return false

    if (deliveryMethod.value === 'courier' && !selectedAddress.value) return false
    if (deliveryMethod.value === 'pickup'  && (!selectedShopId.value || !pickupSlotAt.value)) return false
    if (deliveryMethod.value === 'cdek'    && !cdekSelectedPoint.value) return false
    if (deliveryMethod.value === 'russian_post' && !rpSelectedOffice.value) return false

    return true
})

function formatPrice(n: number): string {
    return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
}

async function submit() {
    if (!canSubmit.value) return
    submitError.value = ''

    const payload: OrderCreatePayload = {
        delivery_method: deliveryMethod.value,
        payment_method:  paymentMethod.value,
        customer_name:   customer.name.trim(),
        customer_phone:  customer.phone.trim(),
        customer_email:  customer.email.trim() || null,
        comment:         comment.value.trim() || null,
    }

    if (deliveryMethod.value === 'courier' && selectedAddress.value) {
        const a = selectedAddress.value
        payload.address_full = a.full_address
        payload.address_lat  = a.lat
        payload.address_lon  = a.lon
        payload.city         = a.city
        payload.street       = a.street
        payload.house        = a.house
        payload.apartment    = a.apartment ?? null
        payload.entrance     = a.entrance  ?? null
        payload.floor        = a.floor     ?? null
        payload.intercom     = a.intercom  ?? null
    } else if (deliveryMethod.value === 'pickup') {
        payload.shop_id        = selectedShopId.value
        payload.pickup_slot_at = pickupSlotAt.value
    } else if (deliveryMethod.value === 'cdek' && cdekSelectedPoint.value) {
        payload.cdek_pvz_code = cdekSelectedPoint.value.code
        payload.address_full  = cdekSelectedPoint.value.address_full || cdekSelectedPoint.value.address
        payload.city          = cdekCity.value?.city ?? null
    } else if (deliveryMethod.value === 'russian_post' && rpSelectedOffice.value) {
        payload.russian_post_index = rpSelectedOffice.value.index
        payload.address_full       = rpSelectedOffice.value.address_full || rpSelectedOffice.value.address
        payload.city               = rpCity.value?.city ?? null
    }

    try {
        const order = await orderStore.create(payload)
        cartStore.$reset()
        toast.success(`Заказ ${order.number} оформлен`)
        await router.replace(`/account/orders/${order.id}`)
    } catch (e: any) {
        submitError.value = e?.data?.message
            ?? Object.values(e?.data?.errors ?? {}).flat()[0]
            ?? 'Не удалось оформить заказ'
    }
}

useHead({ title: 'Оформление заказа' })
</script>

<template>
    <div class="checkout-page">
        <div class="checkout-container">
            <h1 class="checkout-title">Оформление заказа</h1>

            <div class="checkout-grid">
                <div class="checkout-form">
                    <!-- Контактные данные -->
                    <section class="block">
                        <h2 class="block-title">Контактные данные</h2>
                        <div class="grid-2">
                            <div class="uf-field">
                                <span class="uf-label">Имя</span>
                                <input v-model="customer.name" type="text" class="uf-input" placeholder="Как к вам обращаться" />
                            </div>
                            <div class="uf-field">
                                <span class="uf-label">Телефон</span>
                                <input v-model="customer.phone" type="tel" class="uf-input" placeholder="+7..." />
                            </div>
                            <div class="uf-field full">
                                <span class="uf-label">Email (необязательно)</span>
                                <input v-model="customer.email" type="email" class="uf-input" placeholder="you@example.com" />
                            </div>
                        </div>
                    </section>

                    <!-- Доставка -->
                    <section class="block">
                        <h2 class="block-title">Способ доставки</h2>

                        <div class="method-list">
                            <label class="method-item" :class="{ active: deliveryMethod === 'courier' }">
                                <input v-model="deliveryMethod" type="radio" value="courier" />
                                <span class="method-title">Курьер по адресу</span>
                                <span class="method-sub">Доставка по вашему адресу</span>
                            </label>
                            <label class="method-item" :class="{ active: deliveryMethod === 'pickup' }">
                                <input v-model="deliveryMethod" type="radio" value="pickup" />
                                <span class="method-title">Самовывоз из магазина</span>
                                <span class="method-sub">Забрать в одной из наших точек</span>
                            </label>
                            <label class="method-item" :class="{ active: deliveryMethod === 'cdek' }">
                                <input v-model="deliveryMethod" type="radio" value="cdek" />
                                <span class="method-title">СДЭК</span>
                                <span class="method-sub">Доставка до пункта выдачи</span>
                            </label>
                            <label class="method-item" :class="{ active: deliveryMethod === 'russian_post' }">
                                <input v-model="deliveryMethod" type="radio" value="russian_post" />
                                <span class="method-title">Почта России</span>
                                <span class="method-sub">До отделения почты</span>
                            </label>
                        </div>

                        <!-- Courier: выбор адреса -->
                        <div v-if="deliveryMethod === 'courier'" class="delivery-details">
                            <div v-if="!addressStore.addresses.length" class="empty-hint">
                                У вас нет сохранённых адресов.
                                <NuxtLink to="/account/addresses" class="text-link">Добавить адрес</NuxtLink>
                            </div>
                            <div v-else class="address-list">
                                <label
                                    v-for="addr in addressStore.addresses"
                                    :key="addr.id"
                                    class="address-item"
                                    :class="{ active: selectedAddressId === addr.id }"
                                >
                                    <input v-model="selectedAddressId" type="radio" :value="addr.id" />
                                    <div class="address-info">
                                        <div class="address-title">
                                            {{ addr.title }}
                                            <span v-if="addr.is_default" class="badge-default">Основной</span>
                                        </div>
                                        <div class="address-full">{{ addr.full_address }}</div>
                                        <div v-if="addr.apartment || addr.entrance || addr.floor" class="address-extra">
                                            <span v-if="addr.apartment">кв. {{ addr.apartment }}</span>
                                            <span v-if="addr.entrance">подъезд {{ addr.entrance }}</span>
                                            <span v-if="addr.floor">этаж {{ addr.floor }}</span>
                                        </div>
                                    </div>
                                </label>
                                <NuxtLink to="/account/addresses" class="text-link manage-addresses">
                                    Управлять адресами →
                                </NuxtLink>
                            </div>
                        </div>

                        <!-- Pickup: выбор магазина + слот -->
                        <div v-else-if="deliveryMethod === 'pickup'" class="delivery-details">
                            <div v-if="shopsLoading" class="muted">Загружаем список магазинов…</div>
                            <div v-else-if="!shops.length" class="empty-hint">Нет доступных магазинов для самовывоза</div>
                            <template v-else>
                                <div class="shop-list">
                                    <label
                                        v-for="shop in shops"
                                        :key="shop.id"
                                        class="address-item"
                                        :class="{ active: selectedShopId === shop.id }"
                                    >
                                        <input v-model="selectedShopId" type="radio" :value="shop.id" />
                                        <div class="address-info">
                                            <div class="address-title">{{ shop.name }}</div>
                                            <div v-if="shop.address" class="address-full">{{ shop.address }}</div>
                                            <div v-if="shop.phone" class="address-extra">{{ shop.phone }}</div>
                                        </div>
                                    </label>
                                </div>

                                <!-- Часовые слоты -->
                                <div v-if="selectedShop" class="slot-picker">
                                    <div class="slot-label">Когда заберёте</div>

                                    <div v-if="selectedShop.pickup_enabled === false" class="empty-hint">
                                        Самовывоз в этом магазине временно недоступен
                                    </div>
                                    <div v-else-if="!slotDays.length" class="empty-hint">
                                        Нет доступных слотов
                                    </div>

                                    <template v-else>
                                        <div class="slot-days">
                                            <button
                                                v-for="(d, idx) in slotDays"
                                                :key="idx"
                                                type="button"
                                                class="slot-day"
                                                :class="{ active: selectedDayIdx === idx }"
                                                @click="selectedDayIdx = idx"
                                            >{{ d.label }}</button>
                                        </div>

                                        <div class="slot-grid">
                                            <button
                                                v-for="s in slotDays[selectedDayIdx].slots"
                                                :key="s.iso"
                                                type="button"
                                                class="slot-btn"
                                                :class="{
                                                    active: pickupSlotAt === s.iso,
                                                    disabled: s.disabled,
                                                }"
                                                :disabled="s.disabled"
                                                :title="s.reason === 'past' ? 'Прошедшее время'
                                                    : s.reason === 'break' ? 'Технический перерыв'
                                                    : s.reason === 'full' ? 'Слот занят'
                                                    : ''"
                                                @click="pickupSlotAt = s.iso"
                                            >
                                                <span>{{ s.label }}</span>
                                                <span v-if="s.reason === 'full'" class="slot-badge slot-badge--full">Занято</span>
                                                <span
                                                    v-else-if="s.booked > 0 && s.capacity > 1 && s.reason === null"
                                                    class="slot-badge"
                                                >{{ s.capacity - s.booked }} мест</span>
                                            </button>
                                        </div>
                                    </template>
                                </div>
                            </template>
                        </div>

                        <!-- CDEK -->
                        <div v-else-if="deliveryMethod === 'cdek'" class="delivery-details">
                            <!-- Город: либо чип-индикатор, либо поле поиска -->
                            <div v-if="cdekCity" class="cdek-city-chip">
                                <span class="cdek-city-icon">📍</span>
                                <div class="cdek-city-text">
                                    <div class="cdek-city-name">{{ cdekCity.city }}</div>
                                    <div v-if="cdekCity.region" class="cdek-city-region">{{ cdekCity.region }}</div>
                                </div>
                                <button
                                    type="button"
                                    class="cdek-city-clear"
                                    @click="resetCdekCity(); cdekCityQuery = ''"
                                    aria-label="Сменить город"
                                >✕</button>
                            </div>
                            <div v-else class="uf-field cdek-city-field">
                                <span class="uf-label">Город</span>
                                <input
                                    v-model="cdekCityQuery"
                                    @focus="cdekCityFocus = true"
                                    @blur="onCdekCityBlur"
                                    type="text"
                                    class="uf-input"
                                    placeholder="Начните вводить город…"
                                    autocomplete="off"
                                />
                                <div
                                    v-if="cdekCityFocus && (cdekCityLoading || cdekCityResults.length)"
                                    class="cdek-dropdown"
                                >
                                    <div v-if="cdekCityLoading" class="muted small p-2">Ищем…</div>
                                    <button
                                        v-for="c in cdekCityResults"
                                        :key="c.code"
                                        type="button"
                                        class="cdek-dropdown-item"
                                        @mousedown.prevent="pickCdekCity(c)"
                                    >
                                        <span class="cdek-dd-title">{{ c.city }}</span>
                                        <span v-if="c.region" class="cdek-dd-sub">{{ c.region }}</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Список ПВЗ + карта -->
                            <template v-if="cdekCity">
                                <div class="slot-label" style="margin-top:16px; display:flex; justify-content:space-between; align-items:baseline">
                                    <span>Пункт выдачи</span>
                                    <span v-if="cdekPoints.length" class="muted small">
                                        Найдено: {{ cdekPoints.length }}
                                    </span>
                                </div>
                                <div v-if="cdekPointsLoading" class="muted">Загружаем ПВЗ…</div>
                                <div v-else-if="!cdekPoints.length" class="empty-hint">
                                    В этом городе нет пунктов выдачи СДЭК
                                </div>
                                <template v-else>
                                    <div class="cdek-layout">
                                        <div ref="cdekPointsScroll" class="cdek-points">
                                            <label
                                                v-for="p in cdekPoints"
                                                :key="p.code"
                                                :ref="el => setPointRef(p.code, el as HTMLElement | null)"
                                                class="address-item cdek-point-card"
                                                :class="{ active: cdekSelectedPoint?.code === p.code }"
                                            >
                                                <input
                                                    type="radio"
                                                    :checked="cdekSelectedPoint?.code === p.code"
                                                    @change="selectPoint(p)"
                                                />
                                                <div class="address-info">
                                                    <div class="address-title">{{ p.name }}</div>
                                                    <div class="address-full">{{ p.address_full || p.address }}</div>
                                                    <div v-if="p.work_time" class="address-extra">{{ p.work_time }}</div>
                                                    <div v-if="p.have_cash || p.have_cashless || p.is_dressing_room" class="cdek-tags">
                                                        <span v-if="p.have_cash" class="cdek-tag">Наличные</span>
                                                        <span v-if="p.have_cashless" class="cdek-tag">Картой</span>
                                                        <span v-if="p.is_dressing_room" class="cdek-tag">Примерка</span>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                        <div ref="cdekMapContainer" class="cdek-map" />
                                    </div>

                                    <!-- Sticky footer с выбранным ПВЗ -->
                                    <div v-if="cdekSelectedPoint" class="cdek-selected-bar">
                                        <div class="cdek-selected-icon">✓</div>
                                        <div class="cdek-selected-text">
                                            <div class="cdek-selected-title">{{ cdekSelectedPoint.name }}</div>
                                            <div class="cdek-selected-sub">{{ cdekSelectedPoint.address_full || cdekSelectedPoint.address }}</div>
                                        </div>
                                    </div>
                                </template>
                            </template>
                        </div>

                        <!-- Russian Post -->
                        <div v-else-if="deliveryMethod === 'russian_post'" class="delivery-details">
                            <div v-if="rpCity" class="cdek-city-chip">
                                <span class="cdek-city-icon">📍</span>
                                <div class="cdek-city-text">
                                    <div class="cdek-city-name">{{ rpCity.city }}</div>
                                    <div v-if="rpCity.region" class="cdek-city-region">{{ rpCity.region }}</div>
                                </div>
                                <button
                                    type="button"
                                    class="cdek-city-clear"
                                    @click="resetRpCity(); rpCityQuery = ''"
                                    aria-label="Сменить город"
                                >✕</button>
                            </div>
                            <div v-else class="uf-field cdek-city-field">
                                <span class="uf-label">Город</span>
                                <input
                                    v-model="rpCityQuery"
                                    @focus="rpCityFocus = true"
                                    @blur="onRpCityBlur"
                                    type="text"
                                    class="uf-input"
                                    placeholder="Начните вводить город…"
                                    autocomplete="off"
                                />
                                <div
                                    v-if="rpCityFocus && (rpCityLoading || rpCityResults.length)"
                                    class="cdek-dropdown"
                                >
                                    <div v-if="rpCityLoading" class="muted small p-2">Ищем…</div>
                                    <button
                                        v-for="c in rpCityResults"
                                        :key="c.code"
                                        type="button"
                                        class="cdek-dropdown-item"
                                        @mousedown.prevent="pickRpCity(c)"
                                    >
                                        <span class="cdek-dd-title">{{ c.city }}</span>
                                        <span v-if="c.region" class="cdek-dd-sub">{{ c.region }}</span>
                                    </button>
                                </div>
                            </div>

                            <template v-if="rpCity">
                                <div class="slot-label" style="margin-top:16px; display:flex; justify-content:space-between; align-items:baseline">
                                    <span>Отделение</span>
                                    <span v-if="rpOffices.length" class="muted small">
                                        Найдено: {{ rpOffices.length }}
                                    </span>
                                </div>
                                <div v-if="rpOfficesLoading" class="muted">Загружаем отделения…</div>
                                <div v-else-if="!rpOffices.length" class="empty-hint">
                                    В этом городе нет отделений Почты России
                                </div>
                                <template v-else>
                                    <div class="cdek-layout">
                                        <div ref="rpOfficesScroll" class="cdek-points">
                                            <label
                                                v-for="o in rpOffices"
                                                :key="o.index"
                                                :ref="el => setRpOfficeRef(o.index, el as HTMLElement | null)"
                                                class="address-item cdek-point-card"
                                                :class="{ active: rpSelectedOffice?.index === o.index }"
                                            >
                                                <input
                                                    type="radio"
                                                    :checked="rpSelectedOffice?.index === o.index"
                                                    @change="selectRpOffice(o)"
                                                />
                                                <div class="address-info">
                                                    <div class="address-title">
                                                        {{ o.name }}
                                                        <span class="rp-index">{{ o.index }}</span>
                                                    </div>
                                                    <div class="address-full">{{ o.address_full || o.address }}</div>
                                                    <div v-if="o.work_time" class="address-extra">{{ o.work_time }}</div>
                                                </div>
                                            </label>
                                        </div>
                                        <div ref="rpMapContainer" class="cdek-map" />
                                    </div>

                                    <div v-if="rpSelectedOffice" class="cdek-selected-bar">
                                        <div class="cdek-selected-icon">✓</div>
                                        <div class="cdek-selected-text">
                                            <div class="cdek-selected-title">{{ rpSelectedOffice.name }} · {{ rpSelectedOffice.index }}</div>
                                            <div class="cdek-selected-sub">{{ rpSelectedOffice.address_full || rpSelectedOffice.address }}</div>
                                        </div>
                                    </div>
                                </template>
                            </template>
                        </div>
                    </section>

                    <!-- Оплата -->
                    <section class="block">
                        <h2 class="block-title">Оплата</h2>
                        <div class="method-list">
                            <label class="method-item" :class="{ active: paymentMethod === 'cash' }">
                                <input v-model="paymentMethod" type="radio" value="cash" />
                                <span class="method-title">Наличными при получении</span>
                            </label>
                            <label class="method-item" :class="{ active: paymentMethod === 'card_on_delivery' }">
                                <input v-model="paymentMethod" type="radio" value="card_on_delivery" />
                                <span class="method-title">Картой при получении</span>
                            </label>
                        </div>
                    </section>

                    <!-- Комментарий -->
                    <section class="block">
                        <h2 class="block-title">Комментарий к заказу</h2>
                        <textarea
                            v-model="comment"
                            class="uf-textarea"
                            rows="3"
                            placeholder="Пожелания по сборке, удобному времени доставки и т.п."
                        />
                    </section>
                </div>

                <!-- Сводка -->
                <aside class="checkout-summary">
                    <div class="summary-card">
                        <h3 class="summary-title">Ваш заказ</h3>

                        <div class="summary-items">
                            <div v-for="item in cartStore.items" :key="item.id" class="summary-row">
                                <div class="summary-item-info">
                                    <div class="summary-item-title">{{ item.title }}</div>
                                    <div class="summary-item-meta">
                                        <span v-if="item.size">Размер: {{ item.size }}</span>
                                        <span>× {{ item.quantity }}</span>
                                    </div>
                                </div>
                                <div class="summary-item-price">{{ formatPrice(item.price * item.quantity) }} ₽</div>
                            </div>
                        </div>

                        <div class="summary-divider" />

                        <div class="summary-line">
                            <span>Товары ({{ cartStore.count }})</span>
                            <span>{{ formatPrice(itemsTotal) }} ₽</span>
                        </div>
                        <div class="summary-line">
                            <span>Доставка</span>
                            <span>Уточняется</span>
                        </div>

                        <div class="summary-divider" />

                        <div class="summary-total">
                            <span>К оплате</span>
                            <span>{{ formatPrice(itemsTotal) }} ₽</span>
                        </div>

                        <p v-if="submitError" class="form-error">{{ submitError }}</p>

                        <button
                            class="btn-submit"
                            :disabled="!canSubmit || orderStore.submitting"
                            @click="submit"
                        >
                            {{ orderStore.submitting ? 'Оформляем…' : 'Подтвердить заказ' }}
                        </button>

                        <NuxtLink to="/cart" class="back-to-cart">← Вернуться в корзину</NuxtLink>
                    </div>
                </aside>
            </div>
        </div>
    </div>
</template>

<style scoped>
.checkout-page {
    min-height: calc(100vh - 200px);
    padding: 40px 20px;
    background: #fafafa;
    overflow-x: clip;
}
.checkout-container { max-width: 1200px; margin: 0 auto; min-width: 0; }
.checkout-title {
    font-size: 32px; font-weight: 700; margin: 0 0 30px; color: #1a1a1a;
}

.checkout-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 30px;
    align-items: start;
}
.checkout-grid > * { min-width: 0; }

.checkout-form { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

.block {
    background: #fff; border-radius: 12px; padding: 24px;
    min-width: 0;
}
.block-title {
    font-size: 13px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: #aaa; margin: 0 0 20px;
}

.grid-2 {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px;
}
.grid-2 .full { grid-column: 1 / -1; }

.uf-field { margin-bottom: 16px; }
.uf-label {
    display: block; font-size: 11px; color: #aaa;
    letter-spacing: 0.06em; margin-bottom: 8px;
}
.uf-input {
    width: 100%; border: none; border-bottom: 1px solid #ddd;
    padding: 6px 0 10px; font-size: 15px;
    color: #111; background: transparent; outline: none;
    transition: border-color 0.15s;
}
.uf-input:focus { border-bottom-color: #111; }
.uf-input::placeholder { color: #ccc; }

.uf-textarea {
    width: 100%; border: 1px solid #e5e5e5; border-radius: 8px;
    padding: 12px 14px; font: inherit; resize: vertical; outline: none;
    transition: border-color 0.15s;
}
.uf-textarea:focus { border-color: #111; }

/* Методы (доставка/оплата) */
.method-list {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    margin-bottom: 16px;
}
.method-item {
    display: flex; flex-direction: column; gap: 4px;
    padding: 14px 16px; border: 1px solid #e5e5e5; border-radius: 8px;
    cursor: pointer; transition: all 0.15s;
}
.method-item input { display: none; }
.method-item.active { border-color: #111; background: #fafaf8; }
.method-title { font-size: 14px; font-weight: 600; color: #111; }
.method-sub { font-size: 12px; color: #888; }

/* Детали по способу доставки */
.delivery-details { margin-top: 8px; min-width: 0; }
.address-list, .shop-list {
    display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;
}
.address-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 16px; border: 1px solid #e5e5e5; border-radius: 8px;
    cursor: pointer; transition: all 0.15s;
}
.address-item.active { border-color: #111; background: #fafaf8; }
.address-item input { margin-top: 4px; accent-color: #111; }
.address-info { flex: 1; min-width: 0; }
.address-title {
    font-size: 14px; font-weight: 600; color: #111;
    display: flex; align-items: center; gap: 8px;
}
.address-full {
    font-size: 13px; color: #444; margin-top: 4px; line-height: 1.4;
}
.address-extra {
    font-size: 12px; color: #888; margin-top: 4px;
    display: flex; flex-wrap: wrap; gap: 10px;
}
.badge-default {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; background: #111; color: #fff;
    padding: 2px 7px; border-radius: 4px;
}
.manage-addresses {
    align-self: flex-start; margin-top: 4px; font-size: 12px;
}

.empty-hint {
    font-size: 13px; color: #888;
    padding: 16px; border: 1px dashed #e5e5e5; border-radius: 8px;
}

/* Слот-пикер */
.slot-picker { margin-top: 16px; min-width: 0; }
.slot-label {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: #888; margin-bottom: 10px;
}
.slot-days {
    display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;
    margin-bottom: 12px;
    max-width: 100%;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
}
.slot-day {
    flex: 0 0 auto; padding: 8px 14px;
    border: 1px solid #e5e5e5; border-radius: 8px;
    background: #fff; color: #444; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.slot-day:hover { border-color: #ccc; }
.slot-day.active { background: #111; color: #fff; border-color: #111; }

.slot-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px;
}
.slot-btn {
    padding: 9px 10px; border: 1px solid #e5e5e5; border-radius: 8px;
    background: #fff; color: #111; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.15s;
    display: flex; flex-direction: column; align-items: center; gap: 3px;
}
.slot-badge {
    font-size: 10px; font-weight: 500; color: #888;
}
.slot-btn.active .slot-badge { color: #fff; opacity: 0.8; }
.slot-badge--full { color: #c0392b; }

/* CDEK город + дропдаун */
.cdek-city-field { position: relative; }

/* Чип выбранного города */
.cdek-city-chip {
    display: flex; align-items: center; gap: 12px;
    background: #fafaf8; border: 1px solid #efece5;
    border-radius: 10px; padding: 10px 12px 10px 14px;
}
.cdek-city-icon { font-size: 18px; line-height: 1; }
.cdek-city-text { flex: 1; min-width: 0; }
.cdek-city-name { font-size: 14px; font-weight: 600; color: #111; }
.cdek-city-region { font-size: 12px; color: #888; margin-top: 1px; }
.cdek-city-clear {
    width: 28px; height: 28px; border-radius: 999px;
    border: none; background: #fff; color: #888;
    font-size: 12px; cursor: pointer; transition: all 0.15s;
}
.cdek-city-clear:hover { background: #fee; color: #c0392b; }

.cdek-dropdown {
    position: absolute; top: 100%; left: 0; right: 0;
    background: #fff; border: 1px solid #e5e5e5; border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,.08);
    z-index: 100; margin-top: 4px; max-height: 280px; overflow-y: auto;
}
.cdek-dropdown-item {
    display: flex; flex-direction: column; gap: 2px; align-items: flex-start;
    width: 100%; padding: 10px 14px; text-align: left;
    background: none; border: none; cursor: pointer;
    border-bottom: 1px solid #f2f2f2;
}
.cdek-dropdown-item:last-child { border-bottom: none; }
.cdek-dropdown-item:hover { background: #fafaf8; }
.cdek-dd-title { font-size: 13px; color: #111; font-weight: 600; }
.cdek-dd-sub   { font-size: 11px; color: #888; }

.cdek-points { display: flex; flex-direction: column; gap: 8px; }
.cdek-layout {
    display: grid; grid-template-columns: minmax(280px, 1fr) 1.2fr;
    gap: 14px; align-items: stretch;
    height: 480px;
}
.cdek-layout .cdek-points {
    height: 100%; overflow-y: auto;
    padding-right: 6px;
    scrollbar-width: thin;
}
.cdek-map {
    width: 100%; height: 100%;
    border-radius: 10px; overflow: hidden;
    background: #f5f5f5; border: 1px solid #e5e5e5;
}

/* Sticky-итог по выбранному ПВЗ */
.cdek-selected-bar {
    margin-top: 12px;
    display: flex; align-items: center; gap: 12px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 10px; padding: 12px 14px;
}
.cdek-selected-icon {
    width: 28px; height: 28px; border-radius: 999px;
    background: #16a34a; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.cdek-selected-text { flex: 1; min-width: 0; }
.cdek-selected-title { font-size: 13px; font-weight: 700; color: #111; }
.cdek-selected-sub   { font-size: 12px; color: #555; margin-top: 2px; }

.cdek-point-card { transition: border-color 0.15s, background-color 0.15s; }
.cdek-point-card.active { border-color: #16a34a; background: #f0fdf4; }

.rp-index {
    display: inline-block; margin-left: 6px;
    padding: 1px 7px; border-radius: 4px;
    background: #1f6fdb; color: #fff;
    font-family: 'SF Mono', Menlo, monospace;
    font-size: 11px; font-weight: 600;
}

@media (max-width: 768px) {
    .cdek-layout { grid-template-columns: 1fr; height: auto; }
    .cdek-layout .cdek-points { max-height: 320px; height: auto; }
    .cdek-map { height: 300px; }
}
.cdek-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.cdek-tag {
    font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 999px;
    background: #f0f0f0; color: #555;
}
.p-2 { padding: 8px; }
.slot-btn:hover:not(:disabled) { border-color: #111; }
.slot-btn.active { background: #111; color: #fff; border-color: #111; }
.slot-btn.disabled, .slot-btn:disabled {
    background: #f5f5f5; color: #ccc; cursor: not-allowed;
    text-decoration: line-through;
}
.muted { font-size: 13px; color: #888; }
.muted.small { font-size: 12px; margin-top: 8px; }

.text-link {
    color: #111; text-decoration: underline; text-underline-offset: 3px;
}

/* Summary */
.checkout-summary {
    position: sticky; top: 120px;
}
.summary-card {
    background: #fff; border-radius: 12px; padding: 24px;
}
.summary-title {
    font-size: 18px; font-weight: 700; margin: 0 0 16px; color: #111;
}
.summary-items { display: flex; flex-direction: column; gap: 12px; }
.summary-row {
    display: flex; gap: 12px; align-items: flex-start;
}
.summary-item-info { flex: 1; min-width: 0; }
.summary-item-title {
    font-size: 13px; font-weight: 500; color: #111;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.summary-item-meta {
    font-size: 12px; color: #888; margin-top: 2px;
    display: flex; gap: 10px;
}
.summary-item-price {
    font-size: 13px; font-weight: 600; color: #111; white-space: nowrap;
}

.summary-divider { height: 1px; background: #f0f0f0; margin: 20px 0; }

.summary-line {
    display: flex; justify-content: space-between;
    font-size: 14px; color: #555; margin-bottom: 10px;
}
.summary-total {
    display: flex; justify-content: space-between;
    font-size: 18px; font-weight: 700; color: #111;
    margin-bottom: 18px;
}

.btn-submit {
    width: 100%; padding: 16px; background: #111; color: #fff;
    border: none; border-radius: 10px; font-size: 15px; font-weight: 600;
    cursor: pointer; transition: opacity 0.2s;
}
.btn-submit:hover:not(:disabled) { opacity: 0.85; }
.btn-submit:disabled { opacity: 0.35; cursor: not-allowed; }

.back-to-cart {
    display: block; text-align: center; margin-top: 14px;
    font-size: 13px; color: #888; text-decoration: none;
}
.back-to-cart:hover { color: #111; }

.form-error {
    background: #fff5f5; border: 1px solid #fcd0d0;
    color: #d14343; border-radius: 6px;
    padding: 10px 14px; font-size: 13px; margin-bottom: 12px;
}

@media (max-width: 1024px) {
    .checkout-grid { grid-template-columns: 1fr; }
    .checkout-summary { position: static; }
}
@media (max-width: 640px) {
    .checkout-page { padding: 24px 12px; }
    .checkout-title { font-size: 24px; }
    .block { padding: 16px; }

    .grid-2, .method-list { grid-template-columns: 1fr; }

    /* Слоты — не дают грид-колонкам быть жёстко 110px и вылезать за экран */
    .slot-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
    }
    .slot-btn {
        padding: 8px 4px;
        font-size: 11px;
        min-width: 0;
        word-break: break-word;
    }
    .slot-btn > span:first-child { white-space: nowrap; }
    .slot-badge { font-size: 9px; }

    .slot-days {
        gap: 6px;
        margin-left: -4px; margin-right: -4px;
        padding-left: 4px; padding-right: 4px;
    }
    .slot-day { padding: 7px 12px; font-size: 12px; }
}
@media (max-width: 380px) {
    .slot-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>