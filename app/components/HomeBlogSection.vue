<script setup lang="ts">
import type { Blog } from '~/types/blog'

const { $api } = useApi()

const latestBlogs = ref<Blog[]>([])
const blogsLoading = ref(true)
const blogsFetched = ref(false)

onMounted(async () => {
  try {
    const res = await $api<{ data: Blog[] } | Blog[]>('/blogs/latest')
    latestBlogs.value = Array.isArray(res) ? res : res.data
    blogsFetched.value = true
  } finally {
    blogsLoading.value = false
  }
})

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

</script>

<template>
  <section v-if="!blogsFetched || latestBlogs.length > 0" class="max-w-7xl mx-auto px-4 py-8 sm:py-12">
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <h2 class="text-[17px] sm:text-2xl font-bold text-[#1A1A1A]">Блог</h2>
      <NuxtLink
          to="/blogs"
          class="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1A1A1A] text-[12px] font-medium text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
      >
        Все статьи
        <Icon name="material-symbols:arrow-forward" class="w-3.5 h-3.5" />
      </NuxtLink>
    </div>

    <!-- Skeleton -->
    <div v-if="!blogsFetched && latestBlogs.length === 0" class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-4">
      <div v-for="n in 3" :key="`skeleton-${n}`" class="blog-skeleton">
        <div class="blog-skeleton-image"></div>
        <div class="blog-skeleton-content">
          <div class="blog-skeleton-title"></div>
          <div class="blog-skeleton-title-short"></div>
          <div class="blog-skeleton-date"></div>
        </div>
      </div>
    </div>

    <!-- Real blogs -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-4">
      <NuxtLink
          v-for="blog in latestBlogs"
          :key="blog.id"
          :to="`/blogs/${blog.slug}`"
          class="group"
      >
        <!-- Banner -->
        <div class="relative w-full aspect-[16/10] bg-[#1A1A1A] rounded-md overflow-hidden">
          <img
              v-if="blog.banner_image"
              :src="blog.banner_image"
              :alt="blog.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <Icon name="material-symbols:article-outline" class="w-8 h-8 text-[#555]" />
          </div>

          <!-- Тёмный градиент снизу -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

          <!-- Текст внутри фото снизу -->
          <div class="absolute bottom-0 left-0 right-0 p-3 space-y-0.5">
            <h3 class="text-[13px] sm:text-[14px] font-medium text-white group-hover:text-white/80 transition-colors line-clamp-2 leading-snug">
              {{ blog.title }}
            </h3>
            <div class="text-[10px] sm:text-[11px] text-white/60">
              {{ formatDate(blog.published_at!) }}
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Mobile "All articles" button -->
    <NuxtLink
        to="/blogs"
        class="sm:hidden w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#1A1A1A] text-[12px] font-medium text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
    >
      Все статьи
      <Icon name="material-symbols:arrow-forward" class="w-3.5 h-3.5" />
    </NuxtLink>
  </section>
</template>

<style scoped>
.blog-skeleton {
  display: flex;
  flex-direction: column;
}

.blog-skeleton-image {
  width: 100%;
  aspect-ratio: 16 / 10;
  background: linear-gradient(90deg, #e8e8e8 25%, #f2f2f2 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 8px;
  margin-bottom: 12px;
}

.blog-skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.blog-skeleton-title {
  width: 100%;
  height: 15px;
  background: linear-gradient(90deg, #e8e8e8 25%, #f2f2f2 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 3px;
}

.blog-skeleton-title-short {
  width: 70%;
  height: 15px;
  background: linear-gradient(90deg, #e8e8e8 25%, #f2f2f2 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 3px;
}

.blog-skeleton-date {
  width: 80px;
  height: 11px;
  background: linear-gradient(90deg, #e8e8e8 25%, #f2f2f2 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 2px;
  margin-top: 2px;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>