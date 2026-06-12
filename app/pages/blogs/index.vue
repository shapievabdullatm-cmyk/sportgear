<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Blog, BlogCategory } from '~/types/blog'

interface PaginatedBlogs {
  data: Blog[]
  meta: { current_page: number; last_page: number }
}

const { $api } = useApi()
const blogs = ref<Blog[]>([])
const categories = ref<BlogCategory[]>([])
const activeCategory = ref<string | null>(null)
const loading = ref(true)
const loadingMore = ref(false)
const currentPage = ref(1)
const hasMore = ref(false)

function buildUrl(page: number) {
  const params = new URLSearchParams({ page: String(page) })
  if (activeCategory.value) params.set('category', activeCategory.value)
  return `/blogs?${params}`
}

async function fetchBlogs(page: number) {
  const res = await $api<PaginatedBlogs>(buildUrl(page))
  return res
}

onMounted(async () => {
  try {
    const [blogsRes, catsRes] = await Promise.all([
      fetchBlogs(1),
      $api<{ data: BlogCategory[] } | BlogCategory[]>('/blog-categories'),
    ])
    blogs.value = blogsRes.data
    hasMore.value = blogsRes.meta.current_page < blogsRes.meta.last_page
    categories.value = Array.isArray(catsRes) ? catsRes : catsRes.data
  } finally {
    loading.value = false
  }
})

async function selectCategory(slug: string | null) {
  if (activeCategory.value === slug) return
  activeCategory.value = slug
  currentPage.value = 1
  loading.value = true
  try {
    const res = await fetchBlogs(1)
    blogs.value = res.data
    hasMore.value = res.meta.current_page < res.meta.last_page
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  loadingMore.value = true
  try {
    const nextPage = currentPage.value + 1
    const res = await fetchBlogs(nextPage)
    blogs.value.push(...res.data)
    currentPage.value = nextPage
    hasMore.value = res.meta.current_page < res.meta.last_page
  } finally {
    loadingMore.value = false
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-6xl mx-auto px-4 py-10 sm:py-16">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-6">Блог</h1>

        <!-- Category pills -->
        <div v-if="categories.length" class="flex flex-wrap gap-2">
          <button
            type="button"
            class="px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-150"
            :class="activeCategory === null
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-[#F0EEE9] text-[#666] hover:bg-[#E8E6E0]'"
            @click="selectCategory(null)"
          >
            Все
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            class="px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-150"
            :class="activeCategory === cat.slug
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-[#F0EEE9] text-[#666] hover:bg-[#E8E6E0]'"
            @click="selectCategory(cat.slug)"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="w-8 h-8 border-2 border-[#E8E6E0] border-t-[#1A1A1A] rounded-full animate-spin" />
      </div>

      <!-- Empty -->
      <div v-else-if="!blogs.length" class="bg-white border border-[#E8E6E0] rounded-xl px-6 py-20 text-center">
        <Icon name="material-symbols:article-outline" class="w-16 h-16 text-[#E8E6E0] mx-auto mb-4" />
        <p class="text-[15px] text-[#ABABAB]">Статьи пока не опубликованы</p>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <NuxtLink
          v-for="blog in blogs"
          :key="blog.id"
          :to="`/blogs/${blog.slug}`"
          class="group"
        >
          <!-- Banner -->
          <div class="relative w-full aspect-[16/10] bg-[#F0EEE9] rounded-lg overflow-hidden mb-3">
            <img
              v-if="blog.banner_image"
              :src="blog.banner_image"
              :alt="blog.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon name="material-symbols:article-outline" class="w-12 h-12 text-[#C0BEB8]" />
            </div>
          </div>

          <!-- Content -->
          <div class="space-y-1.5">
            <h2 class="text-[15px] font-medium text-[#1A1A1A] group-hover:text-[#666] transition-colors line-clamp-2 leading-snug">
              {{ blog.title }}
            </h2>

            <div class="text-[11px] text-[#ABABAB]">
              {{ formatDate(blog.published_at!) }}
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Load more -->
      <div v-if="hasMore" class="flex justify-center mt-10">
        <button
          type="button"
          :disabled="loadingMore"
          class="px-8 py-3 rounded-full text-[14px] font-medium bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          @click="loadMore"
        >
          <div v-if="loadingMore" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {{ loadingMore ? 'Загрузка...' : 'Загрузить ещё' }}
        </button>
      </div>
    </div>
  </div>
</template>