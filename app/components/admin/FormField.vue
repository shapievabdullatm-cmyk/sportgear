<!-- components/admin/ui/FormField.vue -->
<template>
  <div class="form-field" :class="{ 'has-error': error }">
    <label v-if="label" class="field-label">{{ label }}</label>
    <slot />
    <p v-if="hint || $slots.hint" class="field-hint">
      <slot name="hint">{{ hint }}</slot>
    </p>
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  error?: string
  hint?: string
}>()
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #48484f;
}

.field-hint {
  font-size: 12px;
  color: #8e8e99;
  margin: 0;
  text-align: right;
}

.field-error {
  font-size: 12px;
  color: #ef4444;
  margin: 0;
}

.has-error :deep(.field-input),
.has-error :deep(.param-input),
.has-error :deep(.param-select) {
  border-color: #ef4444;
}
</style>