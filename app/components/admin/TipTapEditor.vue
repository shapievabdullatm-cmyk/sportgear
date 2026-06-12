<script setup lang="ts">
import { Node, mergeAttributes } from '@tiptap/core'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import ImageExt from '@tiptap/extension-image'
import LinkExt from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
const { $api } = useApi()
const config = useRuntimeConfig()
const adminToken = useCookie<string | null>('admin_token')
const userToken = useCookie<string | null>('auth_token')

// ── VideoEmbed: YouTube / RuTube / VK / Дзен / OK (без NodeView — Tiptap рендерит iframe напрямую) ──
const VideoEmbed = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes: () => ({
    src: { default: null },
    platform: { default: null },
  }),
  parseHTML: () => [{
    tag: 'div[data-video-embed]',
    getAttrs: (node: any) => {
      let src = node.getAttribute('data-src')
      const platform = node.getAttribute('data-platform')
      // Fallback для legacy: если data-src отсутствует — берём src из вложенного iframe
      if (!src) {
        const iframe = node.querySelector('iframe')
        if (iframe) src = iframe.getAttribute('src')
      }
      return { src, platform }
    },
  }],
  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src || ''
    return ['div', mergeAttributes({
      'data-video-embed': '',
      'data-src': src,
      'data-platform': HTMLAttributes.platform || '',
      class: 'video-embed',
    }), ['iframe', {
      src,
      frameborder: '0',
      allowfullscreen: 'true',
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    }]]
  },
})

// ── VideoFile: загруженное видео — нативный <video controls> ──
const VideoFile = Node.create({
  name: 'videoFile',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes: () => ({
    src: { default: null },
  }),
  parseHTML: () => [{
    tag: 'video[data-video-file]',
    getAttrs: (node: any) => ({ src: node.getAttribute('src') }),
  }],
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes({
      'data-video-file': '',
      src: HTMLAttributes.src,
      controls: 'true',
      playsinline: 'true',
      preload: 'metadata',
      class: 'video-file',
    })]
  },
})

// ── LinkPreview: карточка ссылки — рендерится как <a> ──
const LinkPreview = Node.create({
  name: 'linkPreview',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes: () => ({
    href: { default: null },
    title: { default: null },
    description: { default: null },
    image: { default: null },
    domain: { default: null },
  }),
  parseHTML: () => [{
    tag: '[data-link-preview]',
    getAttrs: (node: any) => ({
      href: node.getAttribute('data-href') || node.getAttribute('href'),
      title: node.getAttribute('data-title'),
      description: node.getAttribute('data-description'),
      image: node.getAttribute('data-image'),
      domain: node.getAttribute('data-domain'),
    }),
  }],
  renderHTML({ HTMLAttributes: a }) {
    const inner: any[] = []
    if (a.image) inner.push(['div', { class: 'lp-img' }, ['img', { src: a.image, alt: a.title || '' }]])
    const body: any[] = []
    if (a.domain) body.push(['span', { class: 'lp-domain' }, a.domain])
    if (a.title) body.push(['strong', { class: 'lp-title' }, a.title])
    if (a.description) body.push(['p', { class: 'lp-desc' }, a.description])
    inner.push(['div', { class: 'lp-body' }, ...body])
    return ['a', {
      'data-link-preview': '',
      class: 'link-preview-block',
      href: a.href,
      'data-href': a.href,
      'data-title': a.title,
      'data-description': a.description,
      'data-image': a.image,
      'data-domain': a.domain,
      target: '_blank',
      rel: 'noopener noreferrer',
    }, ...inner]
  },
})

// ── HtmlDemo: с NodeView (live preview iframe в редакторе) ──
function encodeB64(str: string) { return btoa(unescape(encodeURIComponent(str))) }
function decodeB64(str: string) {
  try { return decodeURIComponent(escape(atob(str))) } catch { return '' }
}

const HtmlDemo = Node.create({
  name: 'htmlDemo',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes: () => ({
    code: { default: '' },
    height: { default: '420' },
  }),
  parseHTML: () => [{
    tag: 'div[data-html-demo]',
    getAttrs: (node: any) => ({
      code: decodeB64(node.getAttribute('data-code') || ''),
      height: node.getAttribute('data-height') || '420',
    }),
  }],
  renderHTML({ HTMLAttributes }) {
    return ['div', {
      'data-html-demo': '',
      'data-code': encodeB64(HTMLAttributes.code || ''),
      'data-height': HTMLAttributes.height || '420',
      class: 'html-demo-block',
    }]
  },
  addNodeView() {
    return ({ node: initNode }) => {
      let currentNode = initNode
      const dom = document.createElement('div')
      dom.className = 'html-demo-nv'
      dom.setAttribute('contenteditable', 'false')

      const head = document.createElement('div')
      head.className = 'html-demo-nv-head'
      head.innerHTML = `<span class="html-demo-nv-icon">&lt;/&gt;</span><span>HTML / CSS / JS демо · клик для редактирования</span>`

      const preview = document.createElement('iframe')
      preview.className = 'html-demo-nv-preview'
      preview.setAttribute('sandbox', 'allow-scripts allow-same-origin')
      preview.setAttribute('frameborder', '0')

      const render = (n: typeof initNode) => {
        preview.srcdoc = n.attrs.code || ''
        preview.style.height = `${parseInt(n.attrs.height || '420', 10) || 420}px`
      }
      render(currentNode)
      dom.append(head, preview)

      return {
        dom,
        update(updatedNode: any) {
          if (updatedNode.type.name !== 'htmlDemo') return false
          currentNode = updatedNode
          render(currentNode)
          return true
        },
      }
    }
  },
})

// ── Editor ────────────────────────────────────────────────────────
const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    ImageExt.configure({ inline: false, allowBase64: false }),
    LinkExt.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
    Underline,
    Placeholder.configure({ placeholder: 'Начните писать статью...' }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Color,
    Highlight.configure({ multicolor: true }),
    VideoEmbed,
    VideoFile,
    LinkPreview,
    HtmlDemo,
  ],
  onUpdate: ({ editor }) => emit('update:modelValue', editor.getHTML()),
  onSelectionUpdate: ({ editor }) => updateBubbles(editor),
  editorProps: {
    attributes: { class: 'tiptap-content' },
    handleClickOn(view, pos, node, _nodePos, event) {
      // Двойной клик по html-demo / link-preview — открыть модалку
      if (node.type.name === 'htmlDemo') {
        const target = event.target as HTMLElement
        if (target.closest('.html-demo-nv-head')) {
          editingDemoPos.value = _nodePos
          demoCode.value = node.attrs.code || ''
          demoHeight.value = node.attrs.height || '420'
          demoModal.value = true
          return true
        }
      }
      return false
    },
  },
})

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val)
    editor.value.commands.setContent(val || '', false)
})

// ── Selection-based toolbar для node-блоков ──────────────────────
const nodeBubble = ref<{ visible: boolean; top: number; left: number; nodeName: string; pos: number }>({
  visible: false, top: 0, left: 0, nodeName: '', pos: -1,
})
const linkBubble = ref<{ visible: boolean; top: number; left: number; href: string }>({
  visible: false, top: 0, left: 0, href: '',
})
const linkEditMode = ref(false)
const linkEditValue = ref('')

function updateBubbles(ed: any) {
  if (!ed) return
  const { state, view } = ed
  const { selection } = state

  // Node selection — атом-нода выделена
  const isNodeSel = (selection as any).node !== undefined
  if (isNodeSel) {
    const nodeName = (selection as any).node.type.name
    if (['videoEmbed', 'videoFile', 'linkPreview', 'htmlDemo', 'image'].includes(nodeName)) {
      const dom = view.nodeDOM((selection as any).from) as HTMLElement | null
      const wrapRect = (view.dom as HTMLElement).getBoundingClientRect()
      if (dom) {
        const r = dom.getBoundingClientRect()
        nodeBubble.value = {
          visible: true,
          top: r.top - wrapRect.top - 38,
          left: r.left - wrapRect.left + r.width / 2,
          nodeName,
          pos: (selection as any).from,
        }
        linkBubble.value.visible = false
        return
      }
    }
  }
  nodeBubble.value.visible = false

  // Inline link
  if (ed.isActive('link')) {
    const href = ed.getAttributes('link').href || ''
    const { from } = state.selection
    const coords = view.coordsAtPos(from)
    const wrapRect = (view.dom as HTMLElement).getBoundingClientRect()
    linkBubble.value = {
      visible: true,
      top: coords.bottom - wrapRect.top + 6,
      left: coords.left - wrapRect.left,
      href,
    }
    if (!linkEditMode.value) linkEditValue.value = href
  } else {
    linkBubble.value.visible = false
    linkEditMode.value = false
  }
}

function nodeAction(action: 'edit' | 'remove') {
  if (!editor.value || !nodeBubble.value.visible) return
  const { nodeName, pos } = nodeBubble.value
  if (action === 'remove') {
    editor.value.chain().focus().setNodeSelection(pos).deleteSelection().run()
    nodeBubble.value.visible = false
    return
  }
  if (action === 'edit') {
    if (nodeName === 'videoEmbed') {
      const attrs = editor.value.state.doc.nodeAt(pos)?.attrs
      videoUrl.value = ''
      videoError.value = ''
      editingVideoPos.value = pos
      videoModal.value = true
    } else if (nodeName === 'linkPreview') {
      const attrs = editor.value.state.doc.nodeAt(pos)?.attrs
      if (!attrs) return
      editingLinkPos.value = pos
      linkUrl.value = attrs.href || ''
      linkPreviewData.value = {
        title: attrs.title, description: attrs.description, image: attrs.image, domain: attrs.domain,
      }
      linkError.value = ''
      linkModal.value = true
    } else if (nodeName === 'htmlDemo') {
      const attrs = editor.value.state.doc.nodeAt(pos)?.attrs
      if (!attrs) return
      editingDemoPos.value = pos
      demoCode.value = attrs.code || ''
      demoHeight.value = attrs.height || '420'
      demoModal.value = true
    }
  }
}

// ── Image upload ──────────────────────────────────────────────────
const imageInput = ref<HTMLInputElement>()
const uploadingImage = ref(false)

async function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !editor.value) return
  uploadingImage.value = true
  try {
    const fd = new FormData()
    fd.append('image', file)
    const res = await $api<{ url: string }>('/admin/blogs/upload-image', { method: 'POST', body: fd })
    editor.value.chain().focus().setImage({ src: res.url }).run()
  } finally {
    uploadingImage.value = false
    if (imageInput.value) imageInput.value.value = ''
  }
}

// ── Video file upload (через XHR — нужен прогресс) ────────────────
const videoFileInput = ref<HTMLInputElement>()
const uploadingVideo = ref(false)
const videoProgress = ref(0)
const videoStatus = ref('')
const videoUploadError = ref('')

function uploadVideoXhr(file: File): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const base = (config.public.apiBase as string).replace(/\/$/, '')
    xhr.open('POST', `${base}/admin/blogs/upload-video`)
    const token = adminToken.value ?? userToken.value
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.withCredentials = true
    xhr.timeout = 30 * 60 * 1000 // 30 минут

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        videoProgress.value = Math.round((e.loaded / e.total) * 100)
        videoStatus.value = videoProgress.value < 100 ? 'Загрузка…' : 'Конвертация на сервере…'
      }
    }
    xhr.upload.onload = () => { videoStatus.value = 'Конвертация на сервере…' }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)) }
        catch { reject(new Error('Некорректный ответ сервера')) }
      } else {
        let msg = `Ошибка загрузки (${xhr.status})`
        try {
          const body = JSON.parse(xhr.responseText)
          if (body.message) msg = body.message
        } catch {}
        reject(new Error(msg))
      }
    }
    xhr.onerror = () => reject(new Error('Сетевая ошибка'))
    xhr.ontimeout = () => reject(new Error('Превышено время ожидания'))

    const fd = new FormData()
    fd.append('video', file)
    xhr.send(fd)
  })
}

async function handleVideoFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !editor.value) return
  uploadingVideo.value = true
  videoProgress.value = 0
  videoStatus.value = 'Загрузка…'
  videoUploadError.value = ''
  try {
    const res = await uploadVideoXhr(file)
    editor.value.chain().focus().insertContent([
      { type: 'videoFile', attrs: { src: res.url } },
      { type: 'paragraph' },
    ]).run()
  } catch (err: any) {
    videoUploadError.value = err?.message || 'Не удалось загрузить видео'
  } finally {
    uploadingVideo.value = false
    if (videoFileInput.value) videoFileInput.value.value = ''
  }
}

// ── Inline link bubble actions ────────────────────────────────────
function setInlineLink() {
  if (!editor.value) return
  const has = editor.value.isActive('link')
  if (has) {
    linkEditMode.value = true
    linkEditValue.value = editor.value.getAttributes('link').href ?? ''
    updateBubbles(editor.value)
    return
  }
  const { from, to } = editor.value.state.selection
  if (from === to) {
    const url = window.prompt('URL ссылки')
    if (url) editor.value.chain().focus().insertContent(`<a href="${url.replace(/"/g, '&quot;')}">${url}</a>`).run()
    return
  }
  const url = window.prompt('URL ссылки', '')
  if (url) editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

function applyLinkEdit() {
  if (!editor.value) return
  const url = linkEditValue.value.trim()
  if (!url) {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
  } else {
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
  linkEditMode.value = false
  updateBubbles(editor.value)
}

function unsetInlineLink() {
  if (!editor.value) return
  editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
  linkBubble.value.visible = false
  linkEditMode.value = false
}

function openInlineLink() {
  if (linkBubble.value.href) window.open(linkBubble.value.href, '_blank', 'noopener,noreferrer')
}

// ── Video embed modal ─────────────────────────────────────────────
const videoModal = ref(false)
const videoUrl = ref('')
const videoError = ref('')
const editingVideoPos = ref<number | null>(null)

function parseVideoUrl(url: string): { embedUrl: string; platform: string } | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { embedUrl: `https://www.youtube.com/embed/${yt[1]}`, platform: 'youtube' }
  const rt = url.match(/rutube\.ru\/(?:video|embed|play\/embed)\/([a-zA-Z0-9]+)/)
  if (rt) return { embedUrl: `https://rutube.ru/play/embed/${rt[1]}`, platform: 'rutube' }
  const vk = url.match(/(?:vk\.com|vkvideo\.ru)\/video(-?\d+_\d+)/)
  if (vk) {
    const [oid, id] = vk[1].split('_')
    return { embedUrl: `https://vkvideo.ru/video_ext.php?oid=${oid}&id=${id}&hd=2`, platform: 'vk' }
  }
  const dz = url.match(/dzen\.ru\/video\/watch\/([a-zA-Z0-9]+)/)
  if (dz) return { embedUrl: `https://dzen.ru/embed/${dz[1]}`, platform: 'dzen' }
  const ok = url.match(/ok\.ru\/video\/(\d+)/)
  if (ok) return { embedUrl: `https://ok.ru/videoembed/${ok[1]}`, platform: 'ok' }
  return null
}

function insertVideo() {
  videoError.value = ''
  const info = parseVideoUrl(videoUrl.value.trim())
  if (!info) { videoError.value = 'Не удалось распознать ссылку. Поддерживаются YouTube, RuTube, VK, Дзен, OK'; return }
  const pos = editingVideoPos.value
  editingVideoPos.value = null
  if (pos !== null) {
    editor.value?.chain().focus()
      .setNodeSelection(pos)
      .updateAttributes('videoEmbed', { src: info.embedUrl, platform: info.platform })
      .run()
  } else {
    editor.value?.chain().focus().insertContent([
      { type: 'videoEmbed', attrs: { src: info.embedUrl, platform: info.platform } },
      { type: 'paragraph' },
    ]).run()
  }
  videoModal.value = false
  videoUrl.value = ''
}

function openVideoModal() { videoUrl.value = ''; videoError.value = ''; editingVideoPos.value = null; videoModal.value = true }

// ── Link Preview modal ────────────────────────────────────────────
const linkModal = ref(false)
const linkUrl = ref('')
const linkPreviewData = ref<{ title: string | null; description: string | null; image: string | null; domain: string | null } | null>(null)
const loadingLink = ref(false)
const linkError = ref('')
const editingLinkPos = ref<number | null>(null)

async function fetchLinkPreview() {
  if (!linkUrl.value.startsWith('http')) { linkError.value = 'Введите полный URL (с https://)'; return }
  linkError.value = ''
  loadingLink.value = true
  try {
    const data = await $api<{ title: string | null; description: string | null; image: string | null; domain: string | null }>(
      '/admin/blogs/fetch-link-preview',
      { method: 'POST', body: { url: linkUrl.value } }
    )
    linkPreviewData.value = data
  } catch {
    linkError.value = 'Не удалось загрузить превью'
  } finally {
    loadingLink.value = false
  }
}

function insertLinkPreview() {
  if (!linkPreviewData.value) return
  const pos = editingLinkPos.value
  editingLinkPos.value = null
  const attrs = { href: linkUrl.value, ...linkPreviewData.value }
  if (pos !== null) {
    editor.value?.chain().focus().setNodeSelection(pos).updateAttributes('linkPreview', attrs).run()
  } else {
    editor.value?.chain().focus().insertContent([
      { type: 'linkPreview', attrs },
      { type: 'paragraph' },
    ]).run()
  }
  linkModal.value = false
  linkUrl.value = ''
  linkPreviewData.value = null
}

function openLinkModal() {
  linkUrl.value = ''; linkPreviewData.value = null; linkError.value = ''
  editingLinkPos.value = null; linkModal.value = true
}

// ── HTML Demo modal ───────────────────────────────────────────────
const demoModal = ref(false)
const demoCode = ref('')
const demoHeight = ref('420')
const demoPreviewKey = ref(0)
const editingDemoPos = ref<number | null>(null)

function openDemoModal() {
  demoCode.value = ''; demoHeight.value = '420'
  editingDemoPos.value = null; demoModal.value = true
}

function insertDemo() {
  if (!demoCode.value.trim()) return
  const pos = editingDemoPos.value
  editingDemoPos.value = null
  if (pos !== null) {
    editor.value?.chain().focus()
      .setNodeSelection(pos)
      .updateAttributes('htmlDemo', { code: demoCode.value, height: demoHeight.value })
      .run()
  } else {
    editor.value?.chain().focus().insertContent([
      { type: 'htmlDemo', attrs: { code: demoCode.value, height: demoHeight.value } },
      { type: 'paragraph' },
    ]).run()
  }
  demoModal.value = false
}

function refreshDemoPreview() { demoPreviewKey.value++ }

// ── Color picker ──────────────────────────────────────────────────
const colorInput = ref<HTMLInputElement>()
function pickColor() { colorInput.value?.click() }
function applyColor(e: Event) {
  const color = (e.target as HTMLInputElement).value
  editor.value?.chain().focus().setColor(color).run()
}

onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div class="tiptap-editor border border-[#E8E6E0] rounded-xl overflow-hidden bg-white relative">
    <!-- ── Toolbar ─────────────────────────────────────────────── -->
    <div class="tiptap-toolbar flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-[#E8E6E0] bg-[#FAFAF8]">
      <!-- Headings -->
      <button type="button" class="tb-btn tb-text font-bold" title="Заголовок H1"
        :class="{ active: editor?.isActive('heading', { level: 1 }) }"
        @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()">H1</button>
      <button type="button" class="tb-btn tb-text font-bold" title="Заголовок H2"
        :class="{ active: editor?.isActive('heading', { level: 2 }) }"
        @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
      <button type="button" class="tb-btn tb-text font-bold" title="Заголовок H3"
        :class="{ active: editor?.isActive('heading', { level: 3 }) }"
        @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>

      <div class="tb-sep" />

      <button type="button" class="tb-btn tb-text font-bold" title="Жирный"
        :class="{ active: editor?.isActive('bold') }"
        @click="editor?.chain().focus().toggleBold().run()">B</button>
      <button type="button" class="tb-btn tb-text italic" title="Курсив"
        :class="{ active: editor?.isActive('italic') }"
        @click="editor?.chain().focus().toggleItalic().run()">I</button>
      <button type="button" class="tb-btn tb-text underline" title="Подчёркнутый"
        :class="{ active: editor?.isActive('underline') }"
        @click="editor?.chain().focus().toggleUnderline().run()">U</button>
      <button type="button" class="tb-btn tb-text line-through" title="Зачёркнутый"
        :class="{ active: editor?.isActive('strike') }"
        @click="editor?.chain().focus().toggleStrike().run()">S</button>

      <button type="button" class="tb-btn" title="Выделение"
        :class="{ active: editor?.isActive('highlight') }"
        @click="editor?.chain().focus().toggleHighlight().run()">
        <Icon name="material-symbols:format-ink-highlighter-outline" class="w-4 h-4" />
      </button>

      <button type="button" class="tb-btn" title="Цвет текста" @click="pickColor">
        <Icon name="material-symbols:format-color-text" class="w-4 h-4" />
      </button>
      <input ref="colorInput" type="color" class="hidden" @change="applyColor" />

      <div class="tb-sep" />

      <button type="button" class="tb-btn" title="По левому краю"
        :class="{ active: editor?.isActive({ textAlign: 'left' }) }"
        @click="editor?.chain().focus().setTextAlign('left').run()">
        <Icon name="material-symbols:format-align-left" class="w-4 h-4" />
      </button>
      <button type="button" class="tb-btn" title="По центру"
        :class="{ active: editor?.isActive({ textAlign: 'center' }) }"
        @click="editor?.chain().focus().setTextAlign('center').run()">
        <Icon name="material-symbols:format-align-center" class="w-4 h-4" />
      </button>
      <button type="button" class="tb-btn" title="По правому краю"
        :class="{ active: editor?.isActive({ textAlign: 'right' }) }"
        @click="editor?.chain().focus().setTextAlign('right').run()">
        <Icon name="material-symbols:format-align-right" class="w-4 h-4" />
      </button>

      <div class="tb-sep" />

      <button type="button" class="tb-btn" title="Ссылка"
        :class="{ active: editor?.isActive('link') }"
        @click="setInlineLink">
        <Icon name="material-symbols:link" class="w-4 h-4" />
      </button>

      <button type="button" class="tb-btn" title="Маркированный список"
        :class="{ active: editor?.isActive('bulletList') }"
        @click="editor?.chain().focus().toggleBulletList().run()">
        <Icon name="material-symbols:format-list-bulleted" class="w-4 h-4" />
      </button>
      <button type="button" class="tb-btn" title="Нумерованный список"
        :class="{ active: editor?.isActive('orderedList') }"
        @click="editor?.chain().focus().toggleOrderedList().run()">
        <Icon name="material-symbols:format-list-numbered" class="w-4 h-4" />
      </button>

      <button type="button" class="tb-btn" title="Цитата"
        :class="{ active: editor?.isActive('blockquote') }"
        @click="editor?.chain().focus().toggleBlockquote().run()">
        <Icon name="material-symbols:format-quote" class="w-4 h-4" />
      </button>
      <button type="button" class="tb-btn" title="Блок кода"
        :class="{ active: editor?.isActive('codeBlock') }"
        @click="editor?.chain().focus().toggleCodeBlock().run()">
        <Icon name="material-symbols:code" class="w-4 h-4" />
      </button>
      <button type="button" class="tb-btn" title="Разделитель"
        @click="editor?.chain().focus().setHorizontalRule().run()">
        <Icon name="material-symbols:horizontal-rule" class="w-4 h-4" />
      </button>

      <div class="tb-sep" />

      <button type="button" class="tb-btn" title="Изображение" :disabled="uploadingImage"
        @click="imageInput?.click()">
        <div v-if="uploadingImage" class="w-4 h-4 border-2 border-[#C0BEB8] border-t-[#1A1A1A] rounded-full animate-spin" />
        <Icon v-else name="material-symbols:image-outline" class="w-4 h-4" />
      </button>
      <input ref="imageInput" type="file" accept="image/jpg,image/jpeg,image/png,image/webp" class="hidden" @change="handleImageUpload" />

      <button type="button" class="tb-btn" title="Видео по ссылке (YouTube, VK, RuTube...)" @click="openVideoModal">
        <Icon name="material-symbols:play-circle-outline" class="w-4 h-4" />
      </button>

      <button type="button" class="tb-btn" title="Загрузить своё видео"
        :disabled="uploadingVideo"
        @click="videoFileInput?.click()">
        <div v-if="uploadingVideo" class="w-4 h-4 border-2 border-[#C0BEB8] border-t-[#1A1A1A] rounded-full animate-spin" />
        <Icon v-else name="material-symbols:upload-file-outline" class="w-4 h-4" />
      </button>
      <input ref="videoFileInput" type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska,video/x-flv,video/x-ms-wmv" class="hidden" @change="handleVideoFileUpload" />

      <button type="button" class="tb-btn" title="Карточка ссылки" @click="openLinkModal">
        <Icon name="material-symbols:open-in-new" class="w-4 h-4" />
      </button>

      <button type="button" class="tb-btn" title="HTML/CSS/JS демо" @click="openDemoModal">
        <Icon name="material-symbols:code-blocks-outline" class="w-4 h-4" />
      </button>

      <div class="tb-sep" />

      <button type="button" class="tb-btn" title="Отменить" :disabled="!editor?.can().undo()"
        @click="editor?.chain().focus().undo().run()">
        <Icon name="material-symbols:undo" class="w-4 h-4" />
      </button>
      <button type="button" class="tb-btn" title="Повторить" :disabled="!editor?.can().redo()"
        @click="editor?.chain().focus().redo().run()">
        <Icon name="material-symbols:redo" class="w-4 h-4" />
      </button>
    </div>

    <EditorContent :editor="editor" />

    <!-- ── Floating toolbar над выделенным блоком ──────────────── -->
    <div v-if="nodeBubble.visible" class="node-bubble"
      :style="{ top: nodeBubble.top + 'px', left: nodeBubble.left + 'px' }"
      @mousedown.prevent>
      <button v-if="['videoEmbed', 'linkPreview', 'htmlDemo'].includes(nodeBubble.nodeName)"
        type="button" class="nb-btn" title="Редактировать" @click="nodeAction('edit')">✎ Редактировать</button>
      <button type="button" class="nb-btn nb-btn--danger" title="Удалить" @click="nodeAction('remove')">✕ Удалить</button>
    </div>

    <!-- ── Inline link bubble ──────────────────────────────────── -->
    <div v-if="linkBubble.visible" class="link-bubble"
      :style="{ top: linkBubble.top + 'px', left: linkBubble.left + 'px' }"
      @mousedown.prevent>
      <template v-if="!linkEditMode">
        <span class="link-bubble-href" :title="linkBubble.href">{{ linkBubble.href }}</span>
        <button type="button" class="link-bubble-btn" title="Изменить" @click="linkEditMode = true; linkEditValue = linkBubble.href">✎</button>
        <button type="button" class="link-bubble-btn" title="Открыть" @click="openInlineLink">↗</button>
        <button type="button" class="link-bubble-btn link-bubble-btn--danger" title="Убрать ссылку" @click="unsetInlineLink">✕</button>
      </template>
      <template v-else>
        <input v-model="linkEditValue" class="link-bubble-input" placeholder="https://..."
          @keydown.enter="applyLinkEdit" @keydown.esc="linkEditMode = false" />
        <button type="button" class="link-bubble-btn" title="Применить" @click="applyLinkEdit">✓</button>
        <button type="button" class="link-bubble-btn" title="Отмена" @click="linkEditMode = false">✕</button>
      </template>
    </div>

    <!-- ── Video upload progress overlay ───────────────────────── -->
    <div v-if="uploadingVideo" class="video-upload-overlay">
      <div class="video-upload-card">
        <div class="text-[13px] font-medium text-[#1A1A1A] mb-1">{{ videoStatus }}</div>
        <div class="text-[11px] text-[#ABABAB] mb-3">Большие файлы могут конвертироваться несколько минут</div>
        <div class="video-upload-bar">
          <div class="video-upload-bar-fill" :style="{ width: videoProgress + '%' }" />
        </div>
        <div class="text-[12px] text-[#ABABAB] mt-2">{{ videoProgress }}%</div>
      </div>
    </div>
    <div v-if="videoUploadError" class="video-upload-error" @click="videoUploadError = ''">
      {{ videoUploadError }} <span class="underline ml-1">закрыть</span>
    </div>
  </div>

  <!-- ── Video embed modal ──────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="videoModal" class="modal-overlay" @click.self="videoModal = false">
      <div class="modal-box">
        <div class="modal-head">
          <span>{{ editingVideoPos !== null ? 'Изменить URL видео' : 'Вставить видео' }}</span>
          <button type="button" class="modal-close" @click="videoModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">Поддерживаются: YouTube, RuTube, VK Видео, Дзен, Одноклассники</p>
          <input v-model="videoUrl" type="text"
            placeholder="https://www.youtube.com/watch?v=..."
            class="modal-input" @keydown.enter="insertVideo" />
          <p v-if="videoError" class="modal-error">{{ videoError }}</p>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn-cancel" @click="videoModal = false">Отмена</button>
          <button type="button" class="btn-primary" :disabled="!videoUrl.trim()" @click="insertVideo">{{ editingVideoPos !== null ? 'Сохранить' : 'Вставить' }}</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Link Preview modal ─────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="linkModal" class="modal-overlay" @click.self="linkModal = false">
      <div class="modal-box">
        <div class="modal-head">
          <span>{{ editingLinkPos !== null ? 'Изменить карточку ссылки' : 'Карточка ссылки' }}</span>
          <button type="button" class="modal-close" @click="linkModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="flex gap-2">
            <input v-model="linkUrl" type="url" placeholder="https://example.com" class="modal-input flex-1" @keydown.enter="fetchLinkPreview" />
            <button type="button" class="btn-primary shrink-0" :disabled="loadingLink || !linkUrl" @click="fetchLinkPreview">
              <span v-if="loadingLink" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span v-else>Загрузить</span>
            </button>
          </div>
          <p v-if="linkError" class="modal-error">{{ linkError }}</p>

          <div v-if="linkPreviewData" class="mt-3 border border-[#E8E6E0] rounded-lg overflow-hidden">
            <img v-if="linkPreviewData.image" :src="linkPreviewData.image" class="w-full h-40 object-cover" />
            <div class="p-3 space-y-1">
              <p v-if="linkPreviewData.domain" class="text-[11px] text-[#ABABAB] uppercase tracking-wider">{{ linkPreviewData.domain }}</p>
              <p class="text-[13px] font-semibold text-[#1A1A1A]">{{ linkPreviewData.title || '—' }}</p>
              <p v-if="linkPreviewData.description" class="text-[12px] text-[#666] line-clamp-2">{{ linkPreviewData.description }}</p>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn-cancel" @click="linkModal = false">Отмена</button>
          <button type="button" class="btn-primary" :disabled="!linkPreviewData" @click="insertLinkPreview">{{ editingLinkPos !== null ? 'Сохранить' : 'Вставить' }}</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── HTML Demo modal ────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="demoModal" class="modal-overlay" @click.self="demoModal = false">
      <div class="modal-box modal-box--wide">
        <div class="modal-head">
          <span>{{ editingDemoPos !== null ? 'Редактировать демо' : 'HTML / CSS / JS демо' }}</span>
          <button type="button" class="modal-close" @click="demoModal = false">✕</button>
        </div>
        <div class="modal-body demo-layout">
          <div class="demo-col">
            <div class="demo-col-label">Код</div>
            <textarea v-model="demoCode" class="demo-textarea"
              placeholder="<!DOCTYPE html>&#10;<html>...&#10;</html>"
              spellcheck="false" />
            <div class="flex items-center gap-2 mt-2">
              <label class="text-[11px] text-[#ABABAB]">Высота (px):</label>
              <input v-model="demoHeight" type="number" min="100" max="1200" class="modal-input w-24 py-1 text-[12px]" />
              <button type="button" class="btn-cancel text-[12px] py-1 px-3" @click="refreshDemoPreview">Обновить превью</button>
            </div>
          </div>
          <div class="demo-col">
            <div class="demo-col-label">Результат</div>
            <iframe :key="demoPreviewKey" :srcdoc="demoCode"
              :style="{ height: demoHeight + 'px' }"
              sandbox="allow-scripts allow-same-origin"
              class="demo-preview-frame" frameborder="0" />
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn-cancel" @click="demoModal = false">Отмена</button>
          <button type="button" class="btn-primary" :disabled="!demoCode.trim()" @click="insertDemo">{{ editingDemoPos !== null ? 'Сохранить' : 'Вставить в статью' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
.tiptap-content {
  min-height: 400px;
  padding: 20px;
  outline: none;
  font-size: 15px;
  line-height: 1.75;
  color: #1A1A1A;
  font-family: 'Montserrat', sans-serif;
}
.tiptap-content p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left; color: #C0BEB8; pointer-events: none; height: 0;
}
.tiptap-content > * + * { margin-top: 0.75em; }
.tiptap-content h1 { font-size: 1.875rem; font-weight: 700; line-height: 1.2; }
.tiptap-content h2 { font-size: 1.5rem; font-weight: 700; line-height: 1.3; }
.tiptap-content h3 { font-size: 1.25rem; font-weight: 700; line-height: 1.4; }
.tiptap-content p { margin: 0; }
.tiptap-content ul { list-style: disc; padding-left: 1.5em; }
.tiptap-content ol { list-style: decimal; padding-left: 1.5em; }
.tiptap-content li + li { margin-top: 0.25em; }
.tiptap-content blockquote { border-left: 4px solid #1A1A1A; padding: 4px 0 4px 1em; font-style: italic; color: #555; }
.tiptap-content pre { background: #1A1A1A; color: #a8ff78; padding: 1em 1.25em; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; }
.tiptap-content pre code { background: none; padding: 0; color: inherit; font-size: inherit; }
.tiptap-content code { background: #F0EEE9; padding: 0.15em 0.4em; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
.tiptap-content hr { border: none; border-top: 1px solid #E8E6E0; margin: 2em 0; }
.tiptap-content img { max-width: 100%; height: auto; border-radius: 8px; display: block; }
.tiptap-content a { color: #1A1A1A; text-decoration: underline; text-underline-offset: 3px; }
.tiptap-content strong { font-weight: 700; }
.tiptap-content mark { background: #fff3b0; border-radius: 3px; padding: 0.1em 0.2em; }

/* Selection ring для атом-нодов */
.tiptap-content .ProseMirror-selectednode { outline: 2px solid #1A1A1A; outline-offset: 3px; border-radius: 10px; }

/* ── Video embed (iframe — нативный плеер хостинга) ─────────────── */
.tiptap-content .video-embed,
.video-embed {
  position: relative;
  margin: 1.5em 0;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 — надёжнее aspect-ratio */
  height: 0;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}
.tiptap-content .video-embed iframe,
.video-embed iframe {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  border: 0;
  display: block;
}

/* ── Video file (нативный HTML5 плеер) ──────────────────────────── */
.tiptap-content video[data-video-file],
video[data-video-file] {
  width: 100%;
  max-height: 600px;
  display: block;
  margin: 1.5em 0;
  border-radius: 12px;
  background: #000;
}

/* ── Link preview card ───────────────────────────────────────────── */
.tiptap-content .link-preview-block,
.link-preview-block {
  display: grid;
  grid-template-columns: 200px 1fr;
  border: 1px solid #E8E6E0;
  border-radius: 12px;
  overflow: hidden;
  margin: 1.5em 0;
  background: #fff;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.tiptap-content .link-preview-block:hover,
.link-preview-block:hover { border-color: #1A1A1A; box-shadow: 0 4px 14px rgba(0,0,0,.05); }
.tiptap-content .link-preview-block .lp-img,
.link-preview-block .lp-img { background: #F0EEE9; overflow: hidden; }
.tiptap-content .link-preview-block .lp-img img,
.link-preview-block .lp-img img { width: 100%; height: 100%; object-fit: cover; display: block; min-height: 120px; }
.tiptap-content .link-preview-block .lp-body,
.link-preview-block .lp-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 6px; min-width: 0; justify-content: center; }
.tiptap-content .link-preview-block .lp-domain,
.link-preview-block .lp-domain { font-size: 11px; color: #ABABAB; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
.tiptap-content .link-preview-block .lp-title,
.link-preview-block .lp-title { font-size: 15px; font-weight: 600; color: #1A1A1A; line-height: 1.3; }
.tiptap-content .link-preview-block .lp-desc,
.link-preview-block .lp-desc { font-size: 13px; color: #666; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* ── HTML demo NodeView (live preview в редакторе) ──────────────── */
.html-demo-nv {
  position: relative;
  margin: 1.5em 0;
  border: 1px solid #E8E6E0;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}
.html-demo-nv-head {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px;
  background: #FAFAF8;
  border-bottom: 1px solid #E8E6E0;
  font-size: 11px; font-weight: 600;
  color: #888;
  text-transform: uppercase; letter-spacing: 0.06em;
  cursor: pointer;
}
.html-demo-nv-head:hover { background: #F0EEE9; color: #1A1A1A; }
.html-demo-nv-icon { font-family: monospace; color: #1A1A1A; font-size: 13px; }
.html-demo-nv-preview { width: 100%; border: 0; display: block; background: #fff; }
</style>

<style scoped>
.tb-btn {
  display: flex; align-items: center; justify-content: center;
  min-width: 28px; height: 28px; padding: 0 5px;
  border-radius: 5px; border: none; background: none;
  color: #666; cursor: pointer;
  transition: background 0.12s, color 0.12s;
  font-family: 'Montserrat', sans-serif; font-size: 13px;
}
.tb-btn:hover:not(:disabled) { background: #F0EEE9; color: #1A1A1A; }
.tb-btn.active { background: #1A1A1A; color: #fff; }
.tb-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.tb-text { min-width: 26px; }
.tb-sep { width: 1px; height: 20px; background: #E8E6E0; margin: 0 2px; }

/* ── Floating node toolbar ───────────────────────────────────────── */
.node-bubble {
  position: absolute;
  transform: translateX(-50%);
  display: flex; gap: 4px;
  padding: 4px;
  background: #1A1A1A;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0,0,0,.2);
  z-index: 50;
}
.nb-btn {
  background: rgba(255,255,255,.1);
  border: none; border-radius: 5px;
  color: #fff; font-size: 11px; font-weight: 600;
  padding: 6px 10px;
  cursor: pointer;
  transition: background 0.12s;
}
.nb-btn:hover { background: rgba(255,255,255,.22); }
.nb-btn--danger:hover { background: #d14343; }

/* ── Inline link bubble ──────────────────────────────────────────── */
.link-bubble {
  position: absolute;
  display: flex; align-items: center; gap: 4px;
  padding: 6px 8px;
  background: #1A1A1A;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0,0,0,.18);
  z-index: 50;
  max-width: calc(100% - 40px);
}
.link-bubble-href {
  color: #fff; font-size: 12px;
  max-width: 240px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
  padding: 2px 6px;
}
.link-bubble-input {
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 5px; color: #fff;
  padding: 4px 8px; font-size: 12px;
  width: 240px; outline: none;
}
.link-bubble-input:focus { border-color: rgba(255,255,255,.5); background: rgba(255,255,255,.15); }
.link-bubble-input::placeholder { color: rgba(255,255,255,.4); }
.link-bubble-btn {
  width: 24px; height: 24px;
  background: rgba(255,255,255,.1);
  border: none; border-radius: 5px;
  color: #fff; font-size: 13px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s;
}
.link-bubble-btn:hover { background: rgba(255,255,255,.25); }
.link-bubble-btn--danger:hover { background: #d14343; }

/* ── Video upload progress overlay ───────────────────────────────── */
.video-upload-overlay {
  position: absolute; inset: 0;
  background: rgba(255,255,255,.9);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.video-upload-card {
  background: #fff;
  border: 1px solid #E8E6E0;
  border-radius: 12px;
  padding: 20px 24px;
  min-width: 280px;
  box-shadow: 0 12px 32px rgba(0,0,0,.08);
}
.video-upload-bar {
  width: 100%; height: 6px;
  background: #F0EEE9;
  border-radius: 4px;
  overflow: hidden;
}
.video-upload-bar-fill {
  height: 100%; background: #1A1A1A;
  transition: width 0.2s;
}
.video-upload-error {
  position: absolute;
  bottom: 12px; left: 12px; right: 12px;
  background: #FFF1F1;
  border: 1px solid #E5B6B6;
  color: #b34343;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  z-index: 50;
  cursor: pointer;
}

/* ── Modals ──────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 2000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-box {
  background: #fff; border-radius: 14px; width: 100%; max-width: 480px;
  box-shadow: 0 24px 64px rgba(0,0,0,.18); display: flex; flex-direction: column;
  max-height: 90vh; overflow: hidden;
}
.modal-box--wide { max-width: 900px; }
.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #F0EEE9;
  font-size: 14px; font-weight: 600; color: #1A1A1A; flex-shrink: 0;
}
.modal-close { background: none; border: none; color: #ABABAB; cursor: pointer; font-size: 14px; padding: 2px 6px; }
.modal-close:hover { color: #1A1A1A; }
.modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
.modal-hint { font-size: 12px; color: #ABABAB; margin-bottom: 10px; }
.modal-input {
  width: 100%; border: 1px solid #E8E6E0; border-radius: 8px;
  padding: 9px 12px; font-size: 13px; font-family: 'Montserrat', sans-serif;
  color: #1A1A1A; outline: none; background: #FAFAF8;
  transition: border-color 0.15s;
}
.modal-input:focus { border-color: #1A1A1A; background: #fff; }
.modal-error { font-size: 12px; color: #d14343; margin-top: 6px; }
.modal-foot {
  padding: 12px 20px; border-top: 1px solid #F0EEE9;
  display: flex; justify-content: flex-end; gap: 8px; flex-shrink: 0;
}
.btn-primary {
  padding: 9px 20px; background: #1A1A1A; color: #fff; border: none;
  border-radius: 8px; font-size: 13px; font-weight: 600;
  font-family: 'Montserrat', sans-serif; cursor: pointer; transition: opacity 0.15s;
  display: flex; align-items: center; gap: 6px;
}
.btn-primary:hover:not(:disabled) { opacity: 0.82; }
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-cancel {
  padding: 9px 16px; background: transparent; border: 1px solid #E8E6E0;
  border-radius: 8px; font-size: 13px; color: #888;
  font-family: 'Montserrat', sans-serif; cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.btn-cancel:hover { border-color: #aaa; color: #1A1A1A; }

.demo-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; min-height: 0; }
.demo-col { display: flex; flex-direction: column; min-width: 0; }
.demo-col-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #ABABAB; margin-bottom: 8px; }
.demo-textarea {
  flex: 1; min-height: 300px; width: 100%;
  border: 1px solid #E8E6E0; border-radius: 8px;
  padding: 12px; font-size: 12px; font-family: 'Courier New', monospace;
  color: #1A1A1A; background: #FAFAF8; outline: none; resize: vertical;
  line-height: 1.6;
}
.demo-textarea:focus { border-color: #1A1A1A; background: #fff; }
.demo-preview-frame { width: 100%; border: 1px solid #E8E6E0; border-radius: 8px; background: #fff; }

@media (max-width: 640px) {
  .demo-layout { grid-template-columns: 1fr; }
}
</style>