<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import type { Blog } from '~/types/blog'

const route = useRoute()
const { $api } = useApi()

const blog = ref<Blog | null>(null)
const loading = ref(true)
const notFound = ref(false)
const error = ref(false)

onMounted(async () => {
  try {
    const slug = route.params.slug as string
    const res = await $api<{ data: Blog } | Blog>(`/blogs/${slug}`)
    blog.value = 'data' in res ? res.data : res

    useHead({
      title: blog.value.meta_title || blog.value.title,
      meta: blog.value.meta_description
        ? [{ name: 'description', content: blog.value.meta_description }]
        : [],
    })
  } catch (e: any) {
    if (e?.statusCode === 404) notFound.value = true
    else error.value = true
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Process HTML demo blocks after v-html renders
function processDemoBlocks() {
  document.querySelectorAll<HTMLElement>('.blog-content [data-html-demo]').forEach((el) => {
    if (el.dataset.demoBound) return
    el.dataset.demoBound = '1'
    const encoded = el.getAttribute('data-code') || ''
    const height = el.getAttribute('data-height') || '420'
    let code = ''
    try { code = decodeURIComponent(escape(atob(encoded))) } catch {}
    const iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin')
    iframe.setAttribute('srcdoc', code)
    iframe.setAttribute('frameborder', '0')
    iframe.style.cssText = `width:100%;height:${height}px;border:1px solid #E8E6E0;border-radius:10px;display:block;margin:1.5em 0;`
    el.replaceWith(iframe)
  })
}

// Старые статьи могут содержать <div data-link-preview> вместо <a> — навешиваем клик
function processLegacyLinkPreviews() {
  document.querySelectorAll<HTMLElement>('.blog-content div[data-link-preview]').forEach((el) => {
    const href = el.getAttribute('data-href') || el.getAttribute('href')
    if (!href || el.dataset.lpBound) return
    el.dataset.lpBound = '1'
    el.style.cursor = 'pointer'
    el.addEventListener('click', () => window.open(href, '_blank', 'noopener,noreferrer'))
  })
}

watch(() => blog.value, async () => {
  await nextTick()
  processDemoBlocks()
  processLegacyLinkPreviews()
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="w-8 h-8 border-2 border-[#E8E6E0] border-t-[#1A1A1A] rounded-full animate-spin" />
    </div>

    <!-- Not Found -->
    <div v-else-if="notFound" class="max-w-4xl mx-auto px-4 py-20 text-center">
      <Icon name="material-symbols:article-outline" class="w-20 h-20 text-[#E8E6E0] mx-auto mb-4" />
      <h1 class="text-2xl font-bold text-[#1A1A1A] mb-2">Статья не найдена</h1>
      <p class="text-[15px] text-[#ABABAB] mb-6">Возможно, она была удалена или перемещена</p>
      <NuxtLink to="/blogs" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1A1A1A] text-white text-[13px] font-medium hover:bg-[#333] transition-colors">
        <Icon name="material-symbols:arrow-back" class="w-4 h-4" />
        Вернуться к блогу
      </NuxtLink>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-4xl mx-auto px-4 py-20 text-center">
      <Icon name="material-symbols:error-outline" class="w-20 h-20 text-[#E8E6E0] mx-auto mb-4" />
      <h1 class="text-2xl font-bold text-[#1A1A1A] mb-2">Что-то пошло не так</h1>
      <p class="text-[15px] text-[#ABABAB] mb-6">Попробуйте обновить страницу</p>
    </div>

    <!-- Article -->
    <article v-else-if="blog" class="max-w-4xl mx-auto px-4 py-12">
      <!-- Back -->
      <NuxtLink to="/blogs" class="inline-flex items-center gap-2 text-[13px] text-[#ABABAB] hover:text-[#1A1A1A] transition-colors mb-8">
        <Icon name="material-symbols:arrow-back" class="w-4 h-4" />
        Все статьи
      </NuxtLink>

      <!-- Header -->
      <header class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <span v-if="blog.category" class="text-[12px] font-medium text-[#ABABAB] uppercase tracking-wider">
            {{ blog.category.name }}
          </span>
          <span class="text-[12px] text-[#ABABAB]">{{ formatDate(blog.published_at!) }}</span>
        </div>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A] leading-tight">
          {{ blog.title }}
        </h1>
      </header>

      <!-- Banner -->
      <div v-if="blog.banner_image" class="w-full rounded-2xl overflow-hidden mb-12 bg-[#F0EEE9]">
        <img :src="blog.banner_image" :alt="blog.title" class="w-full h-auto" />
      </div>

      <!-- Content -->
      <div v-if="blog.content" class="blog-content" v-html="blog.content" />

      <!-- Footer -->
      <footer class="mt-16 pt-8 border-t border-[#E8E6E0]">
        <NuxtLink to="/blogs" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F0EEE9] text-[#1A1A1A] text-[13px] font-medium hover:bg-[#E8E6E0] transition-colors">
          <Icon name="material-symbols:arrow-back" class="w-4 h-4" />
          Вернуться к блогу
        </NuxtLink>
      </footer>
    </article>
  </div>
</template>

<style>
.blog-content {
  font-size: 16px;
  line-height: 1.8;
  color: #1A1A1A;
}

.blog-content > * + * { margin-top: 1em; }

.blog-content h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; margin-top: 1.5em; }
.blog-content h2 { font-size: 1.625rem; font-weight: 700; line-height: 1.3; margin-top: 1.5em; }
.blog-content h3 { font-size: 1.25rem; font-weight: 700; line-height: 1.4; margin-top: 1.25em; }

.blog-content p { margin: 0; }

.blog-content ul { list-style: disc; padding-left: 1.75em; }
.blog-content ol { list-style: decimal; padding-left: 1.75em; }
.blog-content li + li { margin-top: 0.3em; }

.blog-content blockquote {
  border-left: 4px solid #1A1A1A;
  padding: 6px 0 6px 1.25em;
  margin: 1.5em 0;
  font-style: italic;
  color: #555;
  font-size: 1.05em;
}

.blog-content pre {
  background: #1A1A1A;
  color: #a8ff78;
  padding: 1.25em 1.5em;
  border-radius: 10px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  margin: 1.5em 0;
}
.blog-content pre code { background: none; padding: 0; color: inherit; font-size: inherit; }

.blog-content code {
  background: #F0EEE9;
  padding: 0.15em 0.45em;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.875em;
}

.blog-content hr {
  border: none;
  border-top: 1px solid #E8E6E0;
  margin: 2.5em 0;
}

.blog-content img {
  max-width: 100%;
  border-radius: 10px;
  display: block;
  margin: 1.5em auto;
}

.blog-content a {
  color: #1A1A1A;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: opacity 0.15s;
}
.blog-content a:hover { opacity: 0.6; }

.blog-content strong { font-weight: 700; }
.blog-content em { font-style: italic; }
.blog-content u { text-decoration: underline; text-underline-offset: 3px; }
.blog-content s { text-decoration: line-through; }
.blog-content mark { background: #fff3b0; border-radius: 3px; padding: 0.1em 0.2em; }

/* ── Video embed (iframe — нативный плеер хостинга) ─────────────── */
.blog-content .video-embed {
  position: relative;
  margin: 1.5em 0;
  width: 100%;
  padding-bottom: 56.25%;
  height: 0;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}
.blog-content .video-embed iframe {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  border: 0;
  display: block;
}

/* ── Video embed (старый формат — fallback для уже сохранённых статей) ── */
.blog-content .video-embed-block {
  margin: 1.5em 0;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}
.blog-content .video-embed-inner {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
}
.blog-content .video-embed-inner iframe {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  border: none;
}

/* ── Загруженное своё видео — нативный HTML5 плеер ──────────────── */
.blog-content video[data-video-file],
.blog-content .video-file {
  width: 100%;
  max-height: 600px;
  display: block;
  margin: 1.5em 0;
  border-radius: 12px;
  background: #000;
}

/* ── Link preview карточка (новый формат — <a>) ─────────────────── */
.blog-content .link-preview-block {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 0;
  border: 1px solid #E8E6E0;
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  margin: 1.5em 0;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
.blog-content .link-preview-block:hover {
  border-color: #1A1A1A;
  box-shadow: 0 6px 20px rgba(0,0,0,.06);
}
.blog-content .link-preview-block .lp-img {
  background: #F0EEE9;
  overflow: hidden;
}
.blog-content .link-preview-block .lp-img img {
  width: 100%; height: 100%; object-fit: cover; display: block; min-height: 130px;
}
.blog-content .link-preview-block .lp-body {
  padding: 18px 22px;
  display: flex; flex-direction: column; gap: 8px;
  min-width: 0;
  justify-content: center;
}
.blog-content .link-preview-block .lp-domain {
  font-size: 11px; color: #ABABAB;
  text-transform: uppercase; letter-spacing: 0.08em;
  font-weight: 600;
}
.blog-content .link-preview-block .lp-title {
  font-size: 16px; font-weight: 600; color: #1A1A1A;
  line-height: 1.35;
  text-decoration: none;
}
.blog-content .link-preview-block .lp-desc {
  font-size: 13px; color: #666; margin: 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  line-height: 1.5;
}
@media (max-width: 600px) {
  .blog-content .link-preview-block {
    grid-template-columns: 1fr;
  }
  .blog-content .link-preview-block .lp-img img { height: 180px; }
}
</style>