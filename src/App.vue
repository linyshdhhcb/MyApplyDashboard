<script setup>
import { computed, ref } from 'vue'
import siteConfigs from './config/sites'

const MIN_SCALE = 0.6
const MAX_SCALE = 1.8
const SCALE_STEP = 0.1

function normalizeUrl(url) {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

const panels = ref(
  siteConfigs.map((site, index) => ({
    id: site.id ?? `site-${index + 1}`,
    title: site.title || `站点 ${index + 1}`,
    inputUrl: normalizeUrl(site.url),
    currentUrl: normalizeUrl(site.url),
    scale: 1,
    reloadSeed: 0
  }))
)

const isEmpty = computed(() => panels.value.length === 0)

function refreshPanel(panel) {
  panel.reloadSeed += 1
}

function zoomIn(panel) {
  panel.scale = Math.min(MAX_SCALE, Number((panel.scale + SCALE_STEP).toFixed(2)))
}

function zoomOut(panel) {
  panel.scale = Math.max(MIN_SCALE, Number((panel.scale - SCALE_STEP).toFixed(2)))
}

function resetZoom(panel) {
  panel.scale = 1
}

function navigate(panel) {
  const nextUrl = normalizeUrl(panel.inputUrl)
  if (!nextUrl) return
  panel.inputUrl = nextUrl
  panel.currentUrl = nextUrl
  refreshPanel(panel)
}

function openExternal(panel) {
  if (!panel.currentUrl) return
  window.open(panel.currentUrl, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <main class="dashboard">
    <header class="dashboard-header">
      <h1>网站投稿看板</h1>
      <p>地址配置于 <code>src/config/sites.js</code>，默认多开，支持每个窗口独立操作。</p>
    </header>

    <section v-if="isEmpty" class="empty-state">
      <p>没有读取到有效网址，请检查 <code>src/config/sites.js</code> 配置站点。</p>
    </section>

    <section v-else class="panel-grid">
      <article v-for="panel in panels" :key="panel.id" class="panel-card">
        <div class="panel-toolbar">
          <strong class="panel-title">{{ panel.title }}</strong>

          <div class="toolbar-actions">
            <button type="button" @click="refreshPanel(panel)">刷新</button>
            <button type="button" @click="zoomOut(panel)">缩小</button>
            <button type="button" @click="zoomIn(panel)">放大</button>
            <button type="button" @click="resetZoom(panel)">1:1</button>
            <button type="button" @click="openExternal(panel)">新开</button>
            <span class="zoom-label">{{ Math.round(panel.scale * 100) }}%</span>
          </div>
        </div>

        <form class="url-form" @submit.prevent="navigate(panel)">
          <input v-model.trim="panel.inputUrl" type="text" :placeholder="panel.currentUrl || '请输入网址（例如 https://example.com）'" />
          <button type="submit">跳转</button>
        </form>

        <div class="frame-shell">
          <iframe
            :key="`${panel.id}-${panel.reloadSeed}`"
            :src="panel.currentUrl"
            class="site-frame"
            :style="{
              transform: `scale(${panel.scale})`,
              width: `calc(100% / ${panel.scale})`,
              height: `calc(100% / ${panel.scale})`
            }"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
        </div>
      </article>
    </section>
  </main>
</template>