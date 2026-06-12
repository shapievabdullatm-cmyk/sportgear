import type { Category } from '~/stores/admin/category'

export function useParentDropdown(
    categories: Ref<Category[]>,
    selectedId: Ref<number | null>,
    excludeId?: number
) {
    const open = ref(false)
    const search = ref('')
    const dropdownRef = ref<HTMLElement | null>(null)

    const filtered = computed(() => {
        let list = excludeId
            ? categories.value.filter(c => c.id !== excludeId)
            : categories.value
        if (!search.value) return list
        const q = search.value.toLowerCase()
        return list.filter(c => c.title.toLowerCase().includes(q))
    })

    const selectedTitle = computed(() =>
        selectedId.value
            ? categories.value.find(c => c.id === selectedId.value)?.title ?? null
            : null
    )

    function toggle() { open.value = !open.value }

    function select(id: number | null) {
        selectedId.value = id
        open.value = false
        search.value = ''
    }

    function handleOutside(e: MouseEvent) {
        if (!dropdownRef.value?.contains(e.target as Node)) {
            open.value = false
        }
    }

    onMounted(() => document.addEventListener('click', handleOutside))
    onUnmounted(() => document.removeEventListener('click', handleOutside))

    return { open, search, dropdownRef, filtered, selectedTitle, toggle, select }
}