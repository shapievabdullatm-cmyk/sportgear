<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShopStore, type Shop, type ShopPayload } from '~/stores/admin/shop'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const store = useShopStore()

const id = Number(route.params.id)

const shop = ref<Shop | null>(null)
const submitting = ref(false)
const serverErrors = ref<Record<string, string>>({})
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    shop.value = await store.fetchOne(id)
  } finally {
    loading.value = false
  }
}

await load()

async function save(payload: ShopPayload) {
  submitting.value = true
  serverErrors.value = {}
  try {
    await store.update(id, payload)
    router.push('/admin/shops')
  } catch (e: any) {
    const data = e?.data ?? e?.response?._data
    if (data?.errors) {
      serverErrors.value = Object.fromEntries(
          Object.entries(data.errors as Record<string, string[]>).map(([k, v]) => [k, v[0]])
      )
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
            to="/admin/shops"
            class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </NuxtLink>
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">
          {{ shop ? shop.name : 'Магазин' }}
        </h1>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-5 h-5 border-2 border-[#E8E6E0] border-t-[#1A1A1A] rounded-full animate-spin" />
    </div>

    <AdminShopForm
        v-else-if="shop"
        :initial="shop"
        :submitting="submitting"
        :server-errors="serverErrors"
        submit-label="Сохранить"
        @submit="save"
        @cancel="router.push('/admin/shops')"
    />
  </div>
</template>