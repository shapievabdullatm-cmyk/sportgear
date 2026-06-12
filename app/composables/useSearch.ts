import { ref, watch } from 'vue'
import type { Ref } from 'vue'

interface SearchProduct {
  id: number
  title: string
  slug: string
  article: string | null
  price: number
  old_price: number | null
  images: { url: string }[]
  category: {
    id: number
    title: string
    slug: string
  } | null
}

interface SearchCategory {
  id: number
  title: string
  slug: string
  image: string | null
}

interface SearchResults {
  products: SearchProduct[]
  categories: SearchCategory[]
  suggestions: string[]
}

export function useSearch() {
  const query = ref('')
  const results = ref<SearchResults>({
    products: [],
    categories: [],
    suggestions: []
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const { $api } = useApi()

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const search = async (searchQuery: string) => {
    query.value = searchQuery

    if (searchQuery.length < 1) {
      // Загружаем популярные подсказки
      await loadSuggestions('')
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await $api<SearchResults>('/search', {
        params: { q: searchQuery }
      })

      results.value = response
    } catch (e) {
      error.value = 'Ошибка поиска'
      console.error('Search error:', e)
    } finally {
      isLoading.value = false
    }
  }

  const loadSuggestions = async (searchQuery: string) => {
    try {
      const response = await $api<{ suggestions: string[] }>('/search/suggestions', {
        params: { q: searchQuery }
      })

      results.value.suggestions = response.suggestions
    } catch (e) {
      console.error('Suggestions error:', e)
    }
  }

  const debouncedSearch = (searchQuery: string, delay = 300) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      search(searchQuery)
    }, delay)
  }

  const clear = () => {
    query.value = ''
    results.value = {
      products: [],
      categories: [],
      suggestions: []
    }
    error.value = null
  }

  return {
    query,
    results,
    isLoading,
    error,
    search,
    debouncedSearch,
    loadSuggestions,
    clear
  }
}