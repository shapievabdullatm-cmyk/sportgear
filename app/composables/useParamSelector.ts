import type { CategoryParam, ParamItem } from '~/stores/admin/category'

export function useParamSelector(params: Ref<CategoryParam[]>, initialItems: ParamItem[] = []) {
    const search = ref('')
    const dragIndex = ref<number | null>(null)
    const dragOver = ref<number | null>(null)
    const selectedParamItems = ref<ParamItem[]>([...initialItems])

    const isMobile = computed(() =>
        typeof window !== 'undefined' && window.innerWidth < 768
    )

    const selectedParamIdsSet = computed(() =>
        new Set(selectedParamItems.value.map(i => i.id))
    )

    const filteredParams = computed(() => {
        if (!search.value) return params.value
        const q = search.value.toLowerCase()
        return params.value.filter(p => p.title.toLowerCase().includes(q))
    })

    function paramById(id: number): CategoryParam | undefined {
        return params.value.find(p => p.id === id)
    }

    function toggleParam(id: number, checked: boolean) {
        const idx = selectedParamItems.value.findIndex(i => i.id === id)
        if (checked && idx === -1) {
            selectedParamItems.value.push({ id, sort: selectedParamItems.value.length })
        } else if (!checked && idx !== -1) {
            selectedParamItems.value.splice(idx, 1)
        }
    }

    function removeParam(id: number) {
        selectedParamItems.value = selectedParamItems.value.filter(i => i.id !== id)
    }

    function onDragStart(index: number) {
        dragIndex.value = index
    }

    function onDrop(index: number) {
        if (dragIndex.value === null || dragIndex.value === index) {
            dragOver.value = null
            return
        }
        const item = selectedParamItems.value.splice(dragIndex.value, 1)[0]
        if (item !== undefined) {
            selectedParamItems.value.splice(index, 0, item)
        }
        dragIndex.value = null
        dragOver.value = null
    }

    function moveUp(index: number) {
        if (index === 0) return
        const arr: ParamItem[] = [...selectedParamItems.value]
        const prev = arr[index - 1]
        const curr = arr[index]
        if (prev === undefined || curr === undefined) return
        arr[index - 1] = curr
        arr[index] = prev
        selectedParamItems.value = arr
    }

    function moveDown(index: number) {
        if (index === selectedParamItems.value.length - 1) return
        const arr: ParamItem[] = [...selectedParamItems.value]
        const curr = arr[index]
        const next = arr[index + 1]
        if (curr === undefined || next === undefined) return
        arr[index] = next
        arr[index + 1] = curr
        selectedParamItems.value = arr
    }

    function getParamItemsPayload(): ParamItem[] {
        return selectedParamItems.value.map((i, idx) => ({ id: i.id, sort: idx }))
    }

    function reset() {
        selectedParamItems.value = []
        search.value = ''
    }

    return {
        search,
        dragIndex,
        dragOver,
        selectedParamItems,
        isMobile,
        selectedParamIdsSet,
        filteredParams,
        paramById,
        toggleParam,
        removeParam,
        onDragStart,
        onDrop,
        moveUp,
        moveDown,
        getParamItemsPayload,
        reset,
    }
}