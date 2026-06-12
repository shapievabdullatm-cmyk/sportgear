import { reactive } from 'vue'
import type { ResolvedParam } from '~/types/product'
import { PARAM_TYPE } from '~/types/product'

export interface ParamValue {
    value: string | number | null
    option_id: number | null
    option_ids: number[]
}

export function useProductParams() {
    const { $api } = useApi()

    const resolvedParams = ref<ResolvedParam[]>([])
    // reactive() вместо ref() — Vue 3 гарантирует глубокую реактивность вложенных массивов (option_ids)
    const paramValues = reactive<Record<number, ParamValue>>({})
    const paramsLoading = ref(false)

    function resetParamValues() {
        // Удаляем все существующие ключи
        Object.keys(paramValues).forEach(k => delete paramValues[Number(k)])
    }

    function initParamValues(params: ResolvedParam[]) {
        resetParamValues()
        params.forEach(p => {
            paramValues[p.id] = {
                value:      p.value      ?? null,
                option_id:  p.option_id  ?? null,
                option_ids: Array.isArray(p.option_ids) ? [...p.option_ids] : [],
            }
        })
    }

    async function loadParams(categoryId: number, productId?: number) {
        if (!categoryId) {
            resolvedParams.value = []
            resetParamValues()
            return
        }

        resolvedParams.value = []
        resetParamValues()
        paramsLoading.value  = true

        try {
            const query = productId ? `?product_id=${productId}` : ''
            // Бэкенд автоматически возвращает параметры с учетом иерархии (ParamResolver::resolveForCategory)
            const data  = await $api<{ params: ResolvedParam[] }>(
                `/admin/categories/${categoryId}/params${query}`
            )
            resolvedParams.value = data.params || []
            initParamValues(data.params || [])
        } catch (e) {
            console.error('[useProductParams] loadParams error:', e)
            resolvedParams.value = []
            resetParamValues()
        } finally {
            paramsLoading.value = false
        }
    }

    /** Безопасный геттер — всегда возвращает объект, даже если ключа ещё нет */
    function pv(id: number): ParamValue {
        if (!paramValues[id]) {
            paramValues[id] = { value: null, option_id: null, option_ids: [] }
        }
        return paramValues[id]
    }

    function appendParamsToFormData(fd: FormData) {
        if (!resolvedParams.value.length) {
            console.warn('[useProductParams] No params to append - resolvedParams is empty')
            return
        }

        resolvedParams.value.forEach((p, idx) => {
            const val = pv(p.id)

            fd.append(`params[${idx}][param_id]`,    String(p.id))
            fd.append(`params[${idx}][filter_type]`, String(p.filter_type))
            fd.append(`params[${idx}][multiple]`,    p.multiple ? '1' : '0')

            // Если is_size = true, то всегда одиночный выбор (даже если multiple=true)
            const isSingleChoice = !p.multiple || p.is_size

            if (isSingleChoice) {
                // Одиночная опция (COLOR с multiple=false, MULTISELECT с is_size=true)
                if (p.has_options && val.option_id !== null && val.option_id !== undefined) {
                    fd.append(`params[${idx}][option_id]`, String(val.option_id))
                } else if (!p.has_options) {
                    // Скалярное значение (STRING, TEXT, INTEGER, FLOAT, BOOLEAN)
                    if (val.value !== null && val.value !== undefined && val.value !== '') {
                        fd.append(`params[${idx}][value]`, String(val.value))
                    }
                }
            } else {
                // Множественный выбор (MULTISELECT с is_size=false, COLOR с multiple=true)
                if (val.option_ids && val.option_ids.length) {
                    val.option_ids.forEach(id =>
                        fd.append(`params[${idx}][option_ids][]`, String(id))
                    )
                }
            }
        })

        console.log('[useProductParams] Appended', resolvedParams.value.length, 'params to FormData')
    }

    return {
        PARAM_TYPE,
        resolvedParams,
        paramValues,
        paramsLoading,
        loadParams,
        appendParamsToFormData,
        resetParamValues,
        pv,
    }
}