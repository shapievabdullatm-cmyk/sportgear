<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
await navigateTo('/account/profile', { replace: true })
</script>
<template></template>