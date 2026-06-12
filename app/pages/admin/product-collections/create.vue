<template>
  <div class="max-w-2xl space-y-6 mx-auto">

    <div class="flex items-center justify-between">
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Создать коллекцию</h1>
      <NuxtLink
          to="/admin/product-collections"
          class="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors duration-150"
      >
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Назад
      </NuxtLink>
    </div>

    <div class="bg-white border border-[#E8E6E0] rounded-xl p-5 space-y-4">
      <div>
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Название коллекции
        </label>
        <input
            v-model="name"
            type="text"
            placeholder="Например: Летняя коллекция 2026"
            class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
        />
      </div>

      <div class="flex items-center gap-2">
        <input
            v-model="isActive"
            type="checkbox"
            id="is-active"
            class="w-4 h-4 rounded border-[#E8E6E0] text-[#1A1A1A] focus:ring-0 focus:ring-offset-0"
        />
        <label for="is-active" class="text-[13px] text-[#1A1A1A] cursor-pointer">
          Активна (отображается на сайте)
        </label>
      </div>

      <div class="flex gap-2 pt-2">
        <button
            :disabled="!name.trim() || creating"
            @click="create"
            class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#333] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {{ creating ? 'Создание...' : 'Создать' }}
        </button>
        <NuxtLink
            to="/admin/product-collections"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E6E0] px-4 py-2.5 text-[13px] font-medium text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors duration-150"
        >
          Отмена
        </NuxtLink>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useApi()
const router = useRouter()

const name = ref('')
const isActive = ref(true)
const creating = ref(false)

async function create() {
  if (!name.value.trim() || creating.value) return

  creating.value = true
  try {
    const res = await $api<{ data: { id: number } }>('/admin/product-collections', {
      method: 'POST',
      body: {
        name: name.value.trim(),
        is_active: isActive.value
      }
    })

    // Переходим на страницу редактирования созданной коллекции
    await router.push(`/admin/product-collections/${res.data.id}`)
  } catch (e) {
    console.error('Create error:', e)
    alert('Ошибка при создании коллекции')
  } finally {
    creating.value = false
  }
}
</script>