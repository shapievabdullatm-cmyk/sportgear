<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  html?: string
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)

function renderDemo() {
  if (!iframeRef.value) return
  if (!props.html) return

  const doc = iframeRef.value.contentDocument || iframeRef.value.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(props.html)
  doc.close()

  // Автоматическая подстройка высоты iframe
  setTimeout(() => {
    if (iframeRef.value && doc.body) {
      const height = doc.body.scrollHeight
      iframeRef.value.style.height = `${Math.max(height, 200)}px`
    }
  }, 200)
}

onMounted(() => {
  renderDemo()
})

watch(() => props.html, () => {
  renderDemo()
})
</script>

<template>
  <div class="demo-block border border-[#E8E6E0] rounded-xl overflow-hidden bg-white">
    <iframe
      ref="iframeRef"
      sandbox="allow-scripts allow-same-origin"
      class="w-full border-0"
      style="min-height: 200px;"
    />
  </div>
</template>

<style scoped>
.demo-block iframe {
  display: block;
}
</style>