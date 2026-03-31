<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import siteConfigs from './config/sites'

const APP_PARTITION = 'persist:my-apply-dashboard'
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2
const ZOOM_STEP = 0.1

function normalizeUrl(value) {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function createPanel(site) {
  const initialUrl = normalizeUrl(site?.url || '')

  return {
    key: site.id,
    title: site?.title || '未选择站点',
    inputUrl: initialUrl,
    currentUrl: initialUrl,
    zoom: 1,
    canGoBack: false,
    canGoForward: false,
    isLoading: false
  }
}

const panels = ref(siteConfigs.map(site => createPanel(site)))

const webviews = ref({})

const hasSites = computed(() => siteConfigs.length > 0)

const isSidebarVisible = ref(false)

let hideSidebarTimeout = null

function showSidebar() {
  if (hideSidebarTimeout) {
    clearTimeout(hideSidebarTimeout)
    hideSidebarTimeout = null
  }
  isSidebarVisible.value = true
}

function hideSidebar() {
  hideSidebarTimeout = setTimeout(() => {
    isSidebarVisible.value = false
  }, 300)
}

function scrollToPanel(panelKey) {
  const panelElement = document.getElementById(`panel-${panelKey}`)
  if (panelElement) {
    panelElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function panelByKey(key) {
  return panels.value.find((panel) => panel.key === key)
}

function setWebviewRef(key, el) {
  if (el) {
    webviews.value[key] = el
  } else {
    delete webviews.value[key]
  }
}

function syncPanelState(panel) {
  const view = webviews.value[panel.key]
  if (!view) return

  panel.canGoBack = view.canGoBack()
  panel.canGoForward = view.canGoForward()
}

function bindWebviewEvents(panel) {
  const view = webviews.value[panel.key]
  if (!view || view.dataset.bound === 'true') return

  view.dataset.bound = 'true'

  view.addEventListener('did-start-loading', () => {
    panel.isLoading = true
  })

  view.addEventListener('did-stop-loading', () => {
    panel.isLoading = false
    panel.currentUrl = view.getURL() || panel.currentUrl
    panel.inputUrl = panel.currentUrl
    syncPanelState(panel)
  })

  view.addEventListener('did-navigate', () => {
    panel.currentUrl = view.getURL() || panel.currentUrl
    panel.inputUrl = panel.currentUrl
    syncPanelState(panel)
  })

  view.addEventListener('did-navigate-in-page', () => {
    panel.currentUrl = view.getURL() || panel.currentUrl
    panel.inputUrl = panel.currentUrl
    syncPanelState(panel)
  })

  view.addEventListener('page-title-updated', (event) => {
    if (event.title) {
      panel.title = event.title
    }
  })

  view.addEventListener('new-window', (event) => {
    if (event.url) {
      window.electronAPI?.openSiteWindow(event.url)
    }
  })
}

function ensureWebview(panel) {
  nextTick(() => {
    const view = webviews.value[panel.key]
    if (!view) return

    bindWebviewEvents(panel)
    view.setZoomFactor(panel.zoom)
    syncPanelState(panel)
  })
}

function navigate(panel) {
  const nextUrl = normalizeUrl(panel.inputUrl)
  if (!nextUrl) return

  panel.currentUrl = nextUrl
  panel.inputUrl = nextUrl
}

function reload(panel) {
  const view = webviews.value[panel.key]
  if (view) {
    view.reload()
  }
}

function goBack(panel) {
  const view = webviews.value[panel.key]
  if (view?.canGoBack()) {
    view.goBack()
  }
}

function goForward(panel) {
  const view = webviews.value[panel.key]
  if (view?.canGoForward()) {
    view.goForward()
  }
}

function updateZoom(panel, nextZoom) {
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextZoom.toFixed(2))))
  panel.zoom = clamped

  const view = webviews.value[panel.key]
  if (view) {
    view.setZoomFactor(panel.zoom)
  }
}

function zoomIn(panel) {
  updateZoom(panel, panel.zoom + ZOOM_STEP)
}

function zoomOut(panel) {
  updateZoom(panel, panel.zoom - ZOOM_STEP)
}

function resetZoom(panel) {
  updateZoom(panel, 1)
}

function openInBrowser(panel) {
  if (!panel.currentUrl) return
  window.electronAPI?.openExternalBrowser(panel.currentUrl)
}

onMounted(() => {
  panels.value.forEach((panel) => ensureWebview(panel))
})
</script>

<template>
  <main class="app-shell">
    <div class="sidebar-trigger-area" @mouseenter="showSidebar"></div>
    
    <aside :class="['sidebar-nav', { visible: isSidebarVisible }]" @mouseenter="showSidebar" @mouseleave="hideSidebar">
      <nav class="nav-content">
        <div class="nav-header">
          <h2>站点导航</h2>
        </div>
        <ul class="nav-list">
          <li 
            v-for="site in siteConfigs" 
            :key="site.id"
            class="nav-item"
            @click="scrollToPanel(site.id)"
          >
            {{ site.title }}
          </li>
        </ul>
      </nav>
    </aside>

    <header class="top-bar">
      <div class="top-bar-content">
        <div class="sidebar-header">
          <p class="eyebrow">Electron Dashboard</p>
          <h1>招聘官网看板 </h1>
          <p class="sidebar-copy">
            已自动加载 {{ siteConfigs.length }} 个招聘官网，每个官网独立显示在卡片中。
          </p>
        </div>
      </div>
    </header>

    <section class="panel-stage">
      <article
        v-for="panel in panels"
        :key="panel.key"
        :id="`panel-${panel.key}`"
        :class="['browser-panel', { focused: true }]"
      >
        <header class="panel-header">
          <div class="panel-heading">
            <span class="panel-label">{{ panel.title }}</span>
            <strong>{{ panel.title }}</strong>
          </div>

          <div class="panel-actions">
            <button type="button" @click.stop="goBack(panel)" :disabled="!panel.canGoBack">后退</button>
            <button type="button" @click.stop="goForward(panel)" :disabled="!panel.canGoForward">前进</button>
            <button type="button" @click.stop="reload(panel)">刷新</button>
            <button type="button" @click.stop="zoomOut(panel)">缩小</button>
            <button type="button" @click.stop="zoomIn(panel)">放大</button>
            <button type="button" @click.stop="resetZoom(panel)">100%</button>
            <button type="button" @click.stop="openInBrowser(panel)">浏览器打开</button>
          </div>
        </header>

        <form class="address-bar" @submit.prevent="navigate(panel)">
          <input
            v-model.trim="panel.inputUrl"
            type="text"
            :placeholder="panel.currentUrl || '输入官网地址后回车'"
          />
          <button type="submit">打开</button>
          <span class="zoom-readout">{{ Math.round(panel.zoom * 100) }}%</span>
        </form>

        <div class="panel-status">
          <span :class="['status-dot', { loading: panel.isLoading }]" />
          <span class="status-text">
            {{ panel.isLoading ? '正在加载' : '已就绪' }}
          </span>
          <span class="status-url">{{ panel.currentUrl }}</span>
        </div>

        <div class="webview-shell">
          <webview
            :ref="(el) => setWebviewRef(panel.key, el)"
            :src="panel.currentUrl"
            class="site-webview"
            :partition="APP_PARTITION"
            allowpopups
            @dom-ready="ensureWebview(panel)"
          />
        </div>
      </article>
    </section>
  </main>
</template>
