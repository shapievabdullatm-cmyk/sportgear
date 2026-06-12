<script setup>
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWarehouseStore } from '~/stores/admin/warehouse'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const router = useRouter()
const store = useWarehouseStore()

const form = reactive({
  external_id: '',
  title: '',
  is_active: true
})

const errors = ref({})
const submitting = ref(false)

const isFormValid = computed(() => !!form.title.trim())

async function save() {
  if (!isFormValid.value || submitting.value) return
  errors.value = {}
  submitting.value = true

  try {
    await store.store({
      external_id: form.external_id || null,
      title: form.title,
      is_active: form.is_active
    })
    router.push('/admin/warehouses')
  } catch (e) {
    const data = e?.data ?? e?.response?._data
    if (data?.errors) {
      errors.value = Object.fromEntries(
        Object.entries(data.errors).map(([k, v]) => [k, v[0]])
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
            to="/admin/warehouses"
            class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </NuxtLink>
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Новый склад</h1>
      </div>
    </div>

    <!-- Form card -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden w-full sm:max-w-lg">

      <!-- Title -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Название <span class="text-red-400">*</span>
        </label>
        <input
            v-model="form.title"
            type="text"
            placeholder="Введите название склада"
            maxlength="255"
            class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
            :class="{ 'border-red-300 bg-red-50': errors.title }"
        />
        <p v-if="errors.title" class="mt-1 text-[11px] text-red-400">{{ errors.title }}</p>
      </div>

      <!-- External ID -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          External ID (необязательно)
        </label>
        <input
            v-model="form.external_id"
            type="text"
            placeholder="Внешний идентификатор"
            maxlength="255"
            class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150 font-mono"
            :class="{ 'border-red-300 bg-red-50': errors.external_id }"
        />
        <p v-if="errors.external_id" class="mt-1 text-[11px] text-red-400">{{ errors.external_id }}</p>
        <p class="mt-1.5 text-[11px] text-[#ABABAB]">Идентификатор из внешней системы</p>
      </div>

      <!-- Is Active -->
      <div class="px-4 sm:px-5 py-4 border-b border-[#F0EEE9]">
        <label class="flex items-center justify-between cursor-pointer">
          <div>
            <div class="text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-1">Статус</div>
            <div class="text-[13px] text-[#1A1A1A]">Склад активен</div>
          </div>
          <button
              type="button"
              @click="form.is_active = !form.is_active"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
              :class="form.is_active ? 'bg-[#1A1A1A]' : 'bg-[#E8E6E0]'"
          >
            <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                :class="form.is_active ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </label>
      </div>

      <!-- Actions -->
      <div class="px-4 sm:px-5 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <NuxtLink
            to="/admin/warehouses"
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
          {{ submitting ? 'Сохранение...' : 'Создать' }}
        </button>
      </div>
    </div>
  </div>
</template>