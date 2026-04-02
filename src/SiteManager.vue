<script setup>
import { ref, onMounted } from 'vue'
import siteConfigs from './config/sites'

const SITES_STORAGE_KEY = 'my-apply-dashboard-sites'

// 本地存储的站点列表
const sites = ref([...siteConfigs])

// 加载保存的站点配置
function loadSites() {
  try {
    const saved = localStorage.getItem(SITES_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        sites.value = parsed
      }
    }
  } catch (e) {
    console.error('加载站点配置失败:', e)
  }
}

// 保存站点到本地存储和文件
async function saveSites() {
  try {
    localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(sites.value))
    
    if (window.electronAPI?.saveSitesConfig) {
      const result = await window.electronAPI.saveSitesConfig(sites.value)
      if (!result.success) {
        throw new Error(result.error)
      }
    }
  } catch (e) {
    console.error('保存失败:', e)
    alert('保存失败：' + e.message)
    throw e
  }
}

onMounted(() => {
  loadSites()
})

// 控制显示编辑表单
const showForm = ref(false)
const editingSite = ref(null)
const formMode = ref('add') // 'add' or 'edit'

// 表单数据
const formData = ref({
  id: '',
  title: '',
  url: ''
})

// 打开新增表单
function openAddForm() {
  formMode.value = 'add'
  formData.value = {
    id: '',
    title: '',
    url: ''
  }
  editingSite.value = null
  showForm.value = true
}

// 打开编辑表单
function openEditForm(site) {
  formMode.value = 'edit'
  editingSite.value = site
  formData.value = {
    id: site.id,
    title: site.title,
    url: site.url
  }
  showForm.value = true
}

// 关闭表单
function closeForm() {
  showForm.value = false
  editingSite.value = null
}

// 生成唯一 ID
function generateId(title) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 7)
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${slug}-${timestamp}-${random}`
}

// 保存站点（新增或编辑）
async function saveSite() {
  if (!formData.value.title.trim() || !formData.value.url.trim()) {
    alert('请填写完整信息')
    return
  }

  if (formMode.value === 'add') {
    const newSite = {
      id: generateId(formData.value.title),
      title: formData.value.title.trim(),
      url: formData.value.url.trim()
    }
    sites.value.push(newSite)
  } else {
    const index = sites.value.findIndex(s => s.id === editingSite.value.id)
    if (index !== -1) {
      sites.value[index] = {
        ...sites.value[index],
        title: formData.value.title.trim(),
        url: formData.value.url.trim()
      }
    }
  }

  await saveSites()
  closeForm()
}

// 删除站点
async function deleteSite(site) {
  if (confirm(`确定要删除 "${site.title}" 吗？此操作不可恢复。`)) {
    sites.value = sites.value.filter(s => s.id !== site.id)
    await saveSites()
  }
}

// 重置为默认配置
async function resetToDefault() {
  if (confirm('确定要重置为默认配置吗？所有自定义修改将丢失。')) {
    sites.value = [...siteConfigs]
    localStorage.removeItem(SITES_STORAGE_KEY)
    await saveSites()
  }
}

// 导出配置
function exportConfig() {
  const dataStr = JSON.stringify(sites.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sites-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

// 导入配置
async function importConfig(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const imported = JSON.parse(e.target.result)
      if (Array.isArray(imported)) {
        sites.value = imported
        await saveSites()
      } else {
        alert('无效的配置文件格式')
      }
    } catch (err) {
      alert('配置文件解析失败')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}
</script>

<template>
  <div class="site-manager">
    <header class="manager-header">
      <h2>站点管理</h2>
      <div class="header-actions">
        <button @click="openAddForm" class="btn-add">新增站点</button>
        <button @click="resetToDefault" class="btn-reset">重置默认</button>
        <button @click="exportConfig" class="btn-export">导出配置</button>
        <label for="import-file" class="btn-import">导入配置</label>
        <input 
          id="import-file" 
          type="file" 
          accept=".json" 
          @change="importConfig" 
          style="display: none"
        />
        <button @click="$emit('close')" class="btn-close">返回主页</button>
      </div>
    </header>

    <div class="sites-list">
      <div v-for="(site, index) in sites" :key="site.id" class="site-item">
        <div class="site-info">
          <div class="site-index">{{ index + 1 }}</div>
          <div class="site-details">
            <h3>{{ site.title }}</h3>
            <p class="site-url">{{ site.url }}</p>
          </div>
        </div>
        <div class="site-actions">
          <button @click="openEditForm(site)" class="btn-edit">编辑</button>
          <button @click="deleteSite(site)" class="btn-delete">删除</button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑表单弹窗 -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-content">
        <h3>{{ formMode === 'add' ? '新增站点' : '编辑站点' }}</h3>
        <form @submit.prevent="saveSite">
          <div class="form-group">
            <label for="site-title">站点名称</label>
            <input
              id="site-title"
              v-model="formData.title"
              type="text"
              placeholder="例如：网易校园招聘"
              required
            />
          </div>
          <div class="form-group">
            <label for="site-url">站点 URL</label>
            <input
              id="site-url"
              v-model="formData.url"
              type="url"
              placeholder="https://..."
              required
            />
          </div>
          <div class="form-actions">
            <button type="button" @click="closeForm" class="btn-cancel">取消</button>
            <button type="submit" class="btn-save">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.site-manager {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.manager-header h2 {
  font-size: 1.5rem;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.header-actions button,
.header-actions label {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
}

.header-actions button:hover,
.header-actions label:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.btn-add {
  background: #10b981 !important;
  color: white !important;
  border-color: #059669 !important;
}

.btn-add:hover {
  background: #059669 !important;
}

.btn-reset {
  background: #f59e0b !important;
  color: white !important;
  border-color: #d97706 !important;
}

.btn-reset:hover {
  background: #d97706 !important;
}

.btn-export {
  background: #3b82f6 !important;
  color: white !important;
  border-color: #2563eb !important;
}

.btn-export:hover {
  background: #2563eb !important;
}

.btn-import {
  background: #8b5cf6 !important;
  color: white !important;
  border-color: #7c3aed !important;
  display: inline-block;
}

.btn-import:hover {
  background: #7c3aed !important;
}

.btn-close {
  background: #6b7280 !important;
  color: white !important;
  border-color: #4b5563 !important;
}

.btn-close:hover {
  background: #4b5563 !important;
}

.sites-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.site-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.site-item:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateX(4px);
}

.site-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.site-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
}

.site-details h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #1f2937;
}

.site-url {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  word-break: break-all;
}

.site-actions {
  display: flex;
  gap: 0.5rem;
}

.site-actions button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
}

.btn-edit:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
}

.btn-delete:hover {
  background: #fef2f2;
  border-color: #ef4444;
  color: #dc2626;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.form-actions button {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #d1d5db;
}

.btn-cancel {
  background: white;
  color: #374151;
}

.btn-cancel:hover {
  background: #f3f4f6;
}

.btn-save {
  background: #10b981;
  color: white;
  border-color: #059669;
}

.btn-save:hover {
  background: #059669;
}
</style>
