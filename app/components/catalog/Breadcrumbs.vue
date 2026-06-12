<template>
  <nav v-if="breadcrumbs && breadcrumbs.length > 0" class="breadcrumbs">
    <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
      <NuxtLink
          v-if="index < breadcrumbs.length - 1"
          :to="'/catalog/' + crumb.slug"
          class="breadcrumb-item"
      >
        {{ crumb.title }}
      </NuxtLink>
      <span v-else class="breadcrumb-item active">{{ crumb.title }}</span>
      <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator">/</span>
    </template>
  </nav>
</template>

<script setup lang="ts">
interface Breadcrumb {
  id: number
  title: string
  slug: string
}

defineProps<{
  breadcrumbs: Breadcrumb[]
}>()
</script>

<style scoped>
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 12px;
  flex-wrap: wrap;
}

.breadcrumb-item {
  color: #aaa;
  text-decoration: none;
  transition: color 0.2s;
  white-space: nowrap;
}

.breadcrumb-item:hover:not(.active) {
  color: #333;
}

.breadcrumb-item.active {
  color: #111;
  font-weight: 500;
}

.breadcrumb-separator {
  color: #ccc;
  font-size: 12px;
  user-select: none;
}
</style>