<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBlogStore } from '~/stores/admin/blog'
import { useBlogCategoryStore } from '~/stores/admin/blogCategory'
import TipTapEditor from '~/components/admin/TipTapEditor.vue'
import SeoFields from '~/components/admin/SeoFields.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const router = useRouter()
const route = useRoute()
const store = useBlogStore()
const categoryStore = useBlogCategoryStore()

const blogId = computed(() => parseInt(route.params.id as string))

const form = reactive({
  blog_category_id: null as number | null,
  title: '',
  slug: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  is_published: false,
})

const content = ref('')
const existingBanner = ref<string | null>(null)
const bannerFile = ref<File | null>(null)
const bannerPreview = ref<string | null>(null)
const removeBannerFlag = ref(false)
const errors = ref<Record<string, string>>({})
const saveError = ref('')
const submitting = ref(false)
const loading = ref(true)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function hasContent(html: string) {
  if (!html) return false
  if (html.replace(/<[^>]*>/g, '').trim().length > 0) return true
  return /data-(video-embed|html-demo|link-preview)|<img\s/.test(html)
}
const isFormValid = computed(() => !!form.title.trim() && hasContent(content.value))

// SEO data computed
const seoData = computed({
  get: () => ({
    meta_title: form.meta_title,
    meta_description: form.meta_description,
    meta_keywords: form.meta_keywords,
  }),
  set: (val) => {
    form.meta_title = val.meta_title
    form.meta_description = val.meta_description
    form.meta_keywords = val.meta_keywords
  }
})

onMounted(async () => {
  try {
    const [{ blog }] = await Promise.all([
      store.fetchOne(blogId.value),
      categoryStore.fetchAll(),
    ])
    form.blog_category_id = blog.category?.id ?? null
    form.title = blog.title
    form.slug = blog.slug || ''
    form.meta_title = blog.meta_title || ''
    form.meta_description = blog.meta_description || ''
    form.meta_keywords = blog.meta_keywords || ''
    form.is_published = blog.is_published
    content.value = blog.content || ''
    existingBanner.value = blog.banner_image
  } finally {
    loading.value = false
  }
})

function handleBannerChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  setFile(file)
}

function setFile(file: File) {
  if (!file.type.startsWith('image/')) return
  bannerFile.value = file
  bannerPreview.value = URL.createObjectURL(file)
  removeBannerFlag.value = false
  if (errors.value.banner_image) delete errors.value.banner_image
}

function removeBanner() {
  bannerFile.value = null
  bannerPreview.value = null
  existingBanner.value = null
  removeBannerFlag.value = true
  if (fileInput.value) fileInput.value.value = ''
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave(e: DragEvent) {
  if (!e.currentTarget || !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
    isDragging.value = false
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) setFile(file)
}

async function save() {
  if (!isFormValid.value || submitting.value) return
  errors.value = {}
  submitting.value = true

  const fd = new FormData()
  fd.append('_method', 'PUT')
  fd.append('blog_category_id', form.blog_category_id ? String(form.blog_category_id) : '')
  fd.append('title', form.title)
  if (form.slug) fd.append('slug', form.slug)
  if (bannerFile.value) fd.append('banner_image', bannerFile.value)
  if (removeBannerFlag.value) fd.append('remove_banner', '1')
  fd.append('content', content.value)
  if (form.meta_title) fd.append('meta_title', form.meta_title)
  if (form.meta_description) fd.append('meta_description', form.meta_description)
  if (form.meta_keywords) fd.append('meta_keywords', form.meta_keywords)
  fd.append('is_published', form.is_published ? '1' : '0')

  try {
    saveError.value = ''
    await store.update(blogId.value, fd)
    router.push('/admin/blogs')
  } catch (e: any) {
    const data = e?.data ?? e?.response?._data
    if (data?.errors) {
      errors.value = Object.fromEntries(
        Object.entries(data.errors).map(([k, v]: [string, any]) => [k, v[0]])
      )
    } else {
      saveError.value = data?.message ?? 'Произошла ошибка при сохранении'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/admin/blogs"
          class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </NuxtLink>
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Редактировать статью</h1>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-2 border-[#E8E6E0] border-t-[#1A1A1A] rounded-full animate-spin" />
    </div>

    <!-- Form -->
    <div v-else class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden w-full max-w-4xl">

      <!-- Banner upload -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Баннер
        </label>

        <div v-if="bannerPreview || existingBanner" class="relative w-full rounded-lg overflow-hidden bg-[#F0EEE9] mb-2" style="aspect-ratio:2/1">
          <img :src="bannerPreview || existingBanner!" alt="preview" class="w-full h-full object-cover" />
          <button
            type="button"
            class="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            @click="removeBanner"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div
          v-else
          role="button"
          tabindex="0"
          class="w-full rounded-lg border-2 border-dashed bg-[#FAFAF8] transition-colors duration-150 flex flex-col items-center justify-center gap-2 cursor-pointer select-none py-8 px-4 text-center"
          :class="[
            isDragging
              ? 'border-[#1A1A1A] bg-[#F0EEE9] text-[#1A1A1A]'
              : errors.banner_image
                ? 'border-red-300 bg-red-50 text-red-400'
                : 'border-[#E8E6E0] text-[#C0BEB8] hover:border-[#1A1A1A] hover:bg-white hover:text-[#888]'
          ]"
          @click="fileInput?.click()"
          @keydown.enter.space.prevent="fileInput?.click()"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
               :class="isDragging ? 'bg-[#1A1A1A]/10' : 'bg-[#F0EEE9]'">
            <Icon name="material-symbols:upload" class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[13px] font-medium">
              {{ isDragging ? 'Отпустите файл' : 'Перетащите или нажмите для выбора' }}
            </p>
            <p class="text-[11px] mt-0.5 opacity-70">JPG, PNG, WEBP — до 5 МБ</p>
          </div>
        </div>

        <input ref="fileInput" type="file" accept="image/jpg,image/jpeg,image/png,image/webp" class="hidden" @change="handleBannerChange" />
        <p v-if="errors.banner_image" class="mt-1.5 text-[11px] text-red-400">{{ errors.banner_image }}</p>
      </div>

      <!-- Category -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Категория
        </label>
        <select
          v-model="form.blog_category_id"
          class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors appearance-none cursor-pointer"
        >
          <option :value="null">— Без категории —</option>
          <option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <!-- Title -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Заголовок <span class="text-red-400">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          placeholder="Введите заголовок статьи"
          maxlength="255"
          class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
          :class="{ 'border-red-300 bg-red-50': errors.title }"
        />
        <p v-if="errors.title" class="mt-1 text-[11px] text-red-400">{{ errors.title }}</p>
      </div>

      <!-- Slug -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Slug (URL)
        </label>
        <input
          v-model="form.slug"
          type="text"
          placeholder="Оставьте пустым для автогенерации"
          maxlength="255"
          class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
          :class="{ 'border-red-300 bg-red-50': errors.slug }"
        />
        <p v-if="errors.slug" class="mt-1 text-[11px] text-red-400">{{ errors.slug }}</p>
      </div>

      <!-- Content Editor -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-3">
          Контент <span class="text-red-400">*</span>
        </label>
        <ClientOnly><TipTapEditor v-model="content" /></ClientOnly>
        <p v-if="errors.content" class="mt-2 text-[11px] text-red-400">{{ errors.content }}</p>
      </div>

      <!-- SEO Fields -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <SeoFields v-model="seoData" />
      </div>

      <!-- Publish -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.is_published"
            type="checkbox"
            class="w-4 h-4 rounded border-[#E8E6E0] text-[#1A1A1A] focus:ring-[#1A1A1A] focus:ring-offset-0"
          />
          <span class="text-[13px] text-[#1A1A1A]">Опубликовать</span>
        </label>
      </div>

      <!-- Actions -->
      <div class="px-4 sm:px-5 py-4 flex flex-col gap-3">
        <p v-if="saveError" class="text-[13px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{{ saveError }}</p>
        <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <NuxtLink
          to="/admin/blogs"
          class="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-[13px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors duration-150"
        >
          Отмена
        </NuxtLink>
        <button
          :disabled="!isFormValid || submitting"
          class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-colors duration-150"
          :class="isFormValid && !submitting
            ? 'bg-[#1A1A1A] text-white hover:bg-[#333] cursor-pointer'
            : 'bg-[#F0EEE9] text-[#C0BEB8] cursor-not-allowed'"
          @click="save"
        >
          <div v-if="submitting" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {{ submitting ? 'Сохранение...' : 'Сохранить' }}
        </button>
        </div>
      </div>
    </div>
  </div>
</template>