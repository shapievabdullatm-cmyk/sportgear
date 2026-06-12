// types/param.ts

// ── Enum ─────────────────────────────────────────────────────────────────────

export enum ParamFilterType {
    STRING      = 1,
    TEXT        = 2,
    INTEGER     = 3,
    FLOAT       = 4,
    COLOR       = 6,
    BOOLEAN     = 7,
    MULTISELECT = 8,
}

/** Типы, у которых есть список опций */
export const TYPES_WITH_OPTIONS = new Set([
    ParamFilterType.MULTISELECT,
    ParamFilterType.COLOR,
])

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface ParamOption {
    id?: number
    slug?: string
    value: string
    sort?: number
}

export interface Param {
    id: number | null
    title: string
    slug: string
    label?: string | null
    filter_type: ParamFilterType
    filter_type_title?: string
    has_options?: boolean
    supports_unit?: boolean
    unit?: string | null
    is_filterable: boolean
    is_searchable: boolean
    is_comparable: boolean
    is_size: boolean
    sort: number
    options: ParamOption[]
}

export interface FilterTypeItem {
    value: number
    title: string
    hasOptions: boolean
    supportsUnit: boolean
}

// ── Color Value (stored as JSON in ParamOption.value) ────────────────────────

export type ColorKind = 'solid' | 'dual' | 'gradient'

export interface ColorValue {
    name: string
    type: ColorKind
    color1: string
    color2?: string
    angle?: number
    stops?: string[]
}

export const COLOR_KINDS: { value: ColorKind; label: string }[] = [
    { value: 'solid',    label: 'Сплошной'  },
    { value: 'dual',     label: 'Двойной'   },
    { value: 'gradient', label: 'Градиент'  },
]

export function parseColorValue(value: string): ColorValue | null {
    try {
        const p = JSON.parse(value)
        if (!p) return null

        // Поддержка обоих форматов
        // Формат 1: { name, type, color1, color2, angle }
        if (p.color1) {
            return {
                name:   p.name   ?? '',
                type:   p.type   ?? 'solid',
                color1: p.color1 ?? '#000000',
                color2: p.color2,
                angle:  p.angle  ?? 135,
                stops:  p.stops,
            }
        }

        // Формат 2: { type, angle, stops: [{ color }] }
        if (p.stops && Array.isArray(p.stops)) {
            return {
                name:   p.name ?? '',
                type:   p.type ?? 'solid',
                color1: p.stops[0]?.color ?? '#000000',
                color2: p.stops[1]?.color,
                angle:  p.angle ?? 135,
                stops:  p.stops,
            }
        }

        return null
    } catch { return null }
}

export function serializeColorValue(cv: ColorValue): string {
    const out: Record<string, unknown> = { name: cv.name, type: cv.type, color1: cv.color1 }
    if (cv.type !== 'solid') out.color2 = cv.color2 ?? '#ffffff'
    if (cv.type === 'gradient') {
        out.angle = cv.angle ?? 135
        if (cv.stops) out.stops = cv.stops
    }
    return JSON.stringify(out)
}

export function colorValueToCss(cv: ColorValue): string {
    if (cv.type === 'solid')    return cv.color1
    if (cv.type === 'dual')     return `linear-gradient(90deg, ${cv.color1} 50%, ${cv.color2 ?? '#fff'} 50%)`

    // Градиент - используем массив stops если есть
    if (cv.stops && cv.stops.length > 0) {
        const n = cv.stops.length
        const parts = cv.stops.map((color, i) => `${color} ${Math.round(i / (n - 1) * 100)}%`).join(', ')
        return `linear-gradient(${cv.angle ?? 135}deg, ${parts})`
    }

    // Fallback если stops нет
    return `linear-gradient(${cv.angle ?? 135}deg, ${cv.color1}, ${cv.color2 ?? '#fff'})`
}

export function optionColorCss(value: string): string {
    const cv = parseColorValue(value)
    return cv ? colorValueToCss(cv) : '#E8E6E0'
}

export function optionColorName(value: string): string {
    try { return JSON.parse(value)?.name ?? value } catch { return value }
}

// ── Slug utils ────────────────────────────────────────────────────────────────

const TRANSLIT: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
    'и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh',
    'щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
}

export function slugify(text: string): string {
    let s = text.toLowerCase().trim()
    s = s.replace(/[а-яёъ]/g, (ch) => TRANSLIT[ch] ?? '')
    s = s.replace(/[^a-z0-9\s-]/g, '')
    s = s.replace(/[\s_-]+/g, '-')
    return s.replace(/^-+|-+$/g, '') || 'param'
}