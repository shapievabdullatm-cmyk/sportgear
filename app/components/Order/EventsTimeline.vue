<script setup lang="ts">
import {
    ORDER_STATUS_LABELS,
    type OrderEvent,
    type OrderStatus,
} from '~/types/order'

const props = defineProps<{
    events: OrderEvent[]
    /** Заголовок блока — можно подменить */
    title?: string
}>()

const sorted = computed(() =>
    [...(props.events ?? [])].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
)

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function priceStr(n: number): string {
    return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
}

function statusLabel(value?: string | null): string {
    if (!value) return '—'
    return ORDER_STATUS_LABELS[value as OrderStatus] ?? value
}

function titleOf(d: Record<string, any> | null): string {
    if (!d) return ''
    const base = d.title ?? ''
    return d.size ? `${base} (${d.size})` : base
}

function describe(e: OrderEvent): string {
    const d = e.data ?? {}
    switch (e.type) {
        case 'created':
            return `Заказ создан${d.items_count ? ` — ${d.items_count} позиц.` : ''}`
        case 'status_changed':
            return `Статус: ${statusLabel(d.from)} → ${statusLabel(d.to)}`
        case 'item_added':
            return `Добавлена позиция «${titleOf(d)}» — ${d.quantity} шт × ${priceStr(d.price ?? 0)} ₽`
        case 'item_removed':
            return `Удалена позиция «${titleOf(d)}» (${d.quantity} шт × ${priceStr(d.price ?? 0)} ₽)`
        case 'item_updated': {
            const parts: string[] = []
            if (d.quantity_from !== d.quantity_to) {
                parts.push(`количество: ${d.quantity_from} → ${d.quantity_to}`)
            }
            if (Math.abs((d.price_from ?? 0) - (d.price_to ?? 0)) > 0.001) {
                parts.push(`цена: ${priceStr(d.price_from)} → ${priceStr(d.price_to)} ₽`)
            }
            return `Изменена позиция «${titleOf(d)}»${parts.length ? ' — ' + parts.join(', ') : ''}`
        }
        default:
            return e.type
    }
}

function dotClass(e: OrderEvent): string {
    switch (e.type) {
        case 'created':        return 'bg-blue-500'
        case 'status_changed':
            return e.data?.to === 'cancelled' ? 'bg-rose-500'
                : e.data?.to === 'delivered' ? 'bg-emerald-500'
                : 'bg-violet-500'
        case 'item_added':     return 'bg-emerald-500'
        case 'item_removed':   return 'bg-rose-500'
        case 'item_updated':   return 'bg-amber-500'
        default:               return 'bg-zinc-400'
    }
}
</script>

<template>
    <div v-if="sorted.length" class="ev-timeline">
        <div class="ev-title">{{ title ?? 'История изменений' }}</div>
        <ul class="ev-list">
            <li v-for="e in sorted" :key="e.id" class="ev-item">
                <span class="ev-dot" :class="dotClass(e)" />
                <div class="ev-body">
                    <div class="ev-text">{{ describe(e) }}</div>
                    <div class="ev-date">{{ formatDateTime(e.created_at) }}</div>
                </div>
            </li>
        </ul>
    </div>
</template>

<style scoped>
.ev-timeline { display: flex; flex-direction: column; }
.ev-title {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: #888; margin-bottom: 12px;
}
.ev-list {
    list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: 10px;
    position: relative;
}
.ev-list::before {
    content: '';
    position: absolute;
    left: 5px; top: 6px; bottom: 6px;
    width: 1px; background: #eee;
}
.ev-item {
    display: flex; align-items: flex-start; gap: 12px;
    position: relative;
}
.ev-dot {
    width: 11px; height: 11px; border-radius: 50%;
    margin-top: 5px; flex-shrink: 0;
    box-shadow: 0 0 0 3px #fff;
    position: relative; z-index: 1;
}
.ev-body { flex: 1; min-width: 0; }
.ev-text { font-size: 13px; color: #1a1a1a; line-height: 1.4; }
.ev-date { font-size: 11px; color: #999; margin-top: 2px; }
</style>