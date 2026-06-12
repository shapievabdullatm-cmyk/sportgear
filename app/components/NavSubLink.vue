<template>
  <!-- NavSubLink.vue -->
  <NuxtLink
    :to="to"
    :class="[
      'group flex items-center gap-2 py-1.5 text-xs font-medium transition-colors duration-150',
      active ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-900'
    ]"
  >
    <span
      :class="[
        'w-1 h-1 rounded-full transition-all duration-200',
        active ? 'bg-zinc-900 scale-125' : 'bg-zinc-200 group-hover:bg-zinc-400'
      ]"
    />
    {{ label }}
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{
  to: string
  label: string
  active: boolean
}>()
</script>
