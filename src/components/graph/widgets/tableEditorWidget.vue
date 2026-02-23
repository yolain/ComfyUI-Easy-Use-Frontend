<template>
  <div class="table-editor-widget" @mousedown.stop @wheel.stop>
    <!-- Toolbar -->
    <div class="tew-toolbar">
      <div class="tew-mode-tabs">
        <button :class="['tew-tab', mode === 'table' ? 'active' : '']" @click="switchMode('table')">
          <i class="pi pi-table"></i> 表格
        </button>
        <button :class="['tew-tab', mode === 'markdown' ? 'active' : '']" @click="switchMode('markdown')">
          <i class="pi pi-code"></i> Markdown
        </button>
      </div>
      <div class="tew-actions" v-if="mode === 'table'">
        <button class="tew-btn" @click="addRow" title="添加行">
          <i class="pi pi-plus"></i> 行
        </button>
        <button class="tew-btn" @click="addColumn" title="添加列">
          <i class="pi pi-plus"></i> 列
        </button>
      </div>
      <div class="tew-actions" v-else>
        <button class="tew-btn" @click="formatMarkdown" title="格式化">
          <i class="pi pi-align-left"></i> 格式化
        </button>
      </div>
    </div>

    <!-- Table Mode -->
    <div v-if="mode === 'table'" class="tew-table-wrapper">
      <table class="tew-table">
        <thead>
          <tr>
            <th class="tew-row-handle"></th>
            <th v-for="(header, ci) in tableData.headers" :key="'h' + ci" class="tew-header-cell" :style="{ width: colWidths[ci] }">
              <div class="tew-cell-inner">
                <input
                  class="tew-cell-input tew-header-input"
                  :value="header"
                  @input="updateHeader(ci, $event.target.value)"
                  @keydown.tab.prevent="focusNext($event, -1, ci)"
                  placeholder="列标题"
                />
                <button class="tew-col-del" @click="deleteColumn(ci)" title="删除列">×</button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in tableData.rows" :key="'r' + ri">
            <td class="tew-row-handle">
              <button class="tew-row-del" @click="deleteRow(ri)" title="删除行">×</button>
            </td>
            <td v-for="(cell, ci) in row" :key="'c' + ci" class="tew-body-cell" :style="{ width: colWidths[ci] }">
              <textarea
                class="tew-cell-input tew-cell-textarea"
                :value="cell"
                @input="updateCell(ri, ci, $event.target.value); autoResize($event.target)"
                @keydown.tab.prevent="focusNext($event, ri, ci)"
                rows="1"
              ></textarea>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Markdown Mode -->
    <div v-else class="tew-md-wrapper">
      <textarea
        class="tew-md-textarea"
        v-model="markdownText"
        @input="onMarkdownInput"
        placeholder="| 列1 | 列2 | 列3 |&#10;| --- | --- | --- |&#10;| 值1 | 值2 | 值3 |"
        spellcheck="false"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, nextTick, computed } from 'vue'

const { widget, node } = defineProps(['widget', 'node'])

// ── State ───────────────────────────────────────────────────────────────────
const mode = ref('table')

const tableData = reactive({
  headers: ['列1', '列2', '列3'],
  rows: [
    ['', '', ''],
    ['', '', ''],
  ],
})

const markdownText = ref('')

// ── Markdown utils ──────────────────────────────────────────────────────────
function tableToMarkdown(data) {
  const colWidths = data.headers.map((h, ci) => {
    let max = String(h).length
    for (const row of data.rows) {
      max = Math.max(max, String(row[ci] ?? '').replace(/\n/g, '<br>').length)
    }
    return Math.max(max, 3)
  })

  const pad = (str, len) => String(str).padEnd(len, ' ')

  const headerLine = '| ' + data.headers.map((h, i) => pad(h, colWidths[i])).join(' | ') + ' |'
  const sepLine    = '| ' + colWidths.map(w => '-'.repeat(w)).join(' | ') + ' |'
  const rowLines   = data.rows.map(
    row => '| ' + data.headers.map((_, i) => pad(String(row[i] ?? '').replace(/\n/g, '<br>'), colWidths[i])).join(' | ') + ' |'
  )
  return [headerLine, sepLine, ...rowLines].join('\n')
}

function markdownToTable(md) {
  const lines = md.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return null

  const parseRow = line => line.replace(/^\||\|$/g, '').split('|').map(c => c.trim().replace(/<br\s*\/?>/gi, '\n'))

  const isSep = line => /^\|?[\s\-|:]+\|?$/.test(line)

  // Find header line and sep line
  let headerIdx = -1
  for (let i = 0; i < lines.length - 1; i++) {
    if (isSep(lines[i + 1])) { headerIdx = i; break }
  }
  if (headerIdx === -1) return null

  const headers = parseRow(lines[headerIdx])
  const rows = lines.slice(headerIdx + 2).map(parseRow)

  // Normalize row widths
  const cols = headers.length
  const normalised = rows.map(r => {
    while (r.length < cols) r.push('')
    return r.slice(0, cols)
  })

  return { headers, rows: normalised }
}

// ── Mode switching ───────────────────────────────────────────────────────────
function switchMode(target) {
  if (target === mode.value) return
  if (target === 'markdown') {
    markdownText.value = tableToMarkdown(tableData)
  } else {
    const parsed = markdownToTable(markdownText.value)
    if (parsed) {
      tableData.headers = parsed.headers
      tableData.rows    = parsed.rows
    }
  }
  mode.value = target
  syncWidget()
  if (target === 'table') {
    nextTick(() => resizeAllTextareas())
  }
}

// ── Table editing ────────────────────────────────────────────────────────────
// Measure rendered pixel width of a string (CJK ~14px, ASCII ~8px)
// Strips markdown bold markers (**...**) before measuring
function measurePx(text) {
  let px = 0
  for (const ch of String(text || '').replace(/\*\*/g, '')) {
    px += /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch) ? 14 : 8
  }
  return px
}

const MAX_COL_PX = 200
const MIN_COL_PX = 120

// Reactively compute each column's optimal width based on cell content only
const COL_PAD = 28   // horizontal padding inside each cell (px)
const colWidths = computed(() => {
  // Determine column count from row data, fall back to headers length
  const numCols = Math.max(
    tableData.headers.length,
    ...tableData.rows.map(r => r.length)
  )
  return Array.from({ length: numCols }, (_, ci) => {
    let maxPx = MIN_COL_PX
    // Only scan cell content to determine width
    for (const row of tableData.rows) {
      const cell = String(row[ci] ?? '')
      for (const line of cell.split('\n')) {
        maxPx = Math.max(maxPx, measurePx(line) + COL_PAD)
      }
    }
    // Clamp: auto-fit up to MAX_COL_PX; beyond that the cell will word-wrap
    return Math.min(maxPx, MAX_COL_PX) + 'px'
  })
})

function autoResize(textarea) {
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
  // Equalize all cells in the same row
  equalizeRowHeight(textarea.closest('tr'))
}

function equalizeRowHeight(tr) {
  if (!tr) return
  const textareas = Array.from(tr.querySelectorAll('.tew-cell-textarea'))
  if (textareas.length === 0) return
  textareas.forEach(ta => { ta.style.height = 'auto' })
  const maxH = Math.max(...textareas.map(ta => ta.scrollHeight))
  textareas.forEach(ta => { ta.style.height = maxH + 'px' })
}

function updateHeader(ci, val) {
  tableData.headers[ci] = val
  syncWidget()
}

function updateCell(ri, ci, val) {
  tableData.rows[ri][ci] = val
  syncWidget()
}

function addRow() {
  tableData.rows.push(Array(tableData.headers.length).fill(''))
  syncWidget()
}

function addColumn() {
  tableData.headers.push(`列${tableData.headers.length + 1}`)
  tableData.rows.forEach(r => r.push(''))
  syncWidget()
}

function deleteRow(ri) {
  if (tableData.rows.length <= 1) return
  tableData.rows.splice(ri, 1)
  syncWidget()
}

function deleteColumn(ci) {
  if (tableData.headers.length <= 1) return
  tableData.headers.splice(ci, 1)
  tableData.rows.forEach(r => r.splice(ci, 1))
  syncWidget()
}

// Tab / Enter navigation
function focusNext(event, ri, ci, enterKey = false) {
  nextTick(() => {
    const table = event.target.closest('table')
    if (!table) return
    const inputs = Array.from(table.querySelectorAll('.tew-cell-input'))
    const idx = inputs.indexOf(event.target)
    if (idx === -1) return
    const step = enterKey ? tableData.headers.length : 1
    const next = inputs[idx + step]
    if (next) next.focus()
  })
}

// ── Markdown editing ─────────────────────────────────────────────────────────
let mdTimer = null
function onMarkdownInput() {
  clearTimeout(mdTimer)
  mdTimer = setTimeout(() => {
    syncWidget()
  }, 300)
}

function formatMarkdown() {
  const parsed = markdownToTable(markdownText.value)
  if (parsed) {
    tableData.headers = parsed.headers
    tableData.rows    = parsed.rows
    markdownText.value = tableToMarkdown(tableData)
  }
  syncWidget()
}

// ── Widget serialization ──────────────────────────────────────────────────────
function getMarkdownValue() {
  if (mode.value === 'markdown') {
    return markdownText.value
  }
  return tableToMarkdown(tableData)
}

function buildSaveValue() {
  return JSON.stringify({
    mode: mode.value,
    headers: tableData.headers,
    rows: tableData.rows,
    markdown: mode.value === 'markdown' ? markdownText.value : tableToMarkdown(tableData),
  })
}

function loadSaveValue(raw) {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (data && data.headers) {
      tableData.headers = data.headers
      tableData.rows    = data.rows || []
      mode.value = data.mode || 'table'
      markdownText.value = data.markdown || tableToMarkdown(tableData)
      nextTick(() => resizeAllTextareas())
      return
    }
  } catch (_) {}
  // raw might be pure markdown
  if (typeof raw === 'string' && raw.includes('|')) {
    const parsed = markdownToTable(raw)
    if (parsed) {
      tableData.headers  = parsed.headers
      tableData.rows     = parsed.rows
      markdownText.value = raw
      nextTick(() => resizeAllTextareas())
    }
  }
}

function resizeAllTextareas() {
  const table = document.querySelector('.tew-table')
  if (!table) return
  const rows = Array.from(table.querySelectorAll('tbody tr'))
  rows.forEach(tr => equalizeRowHeight(tr))
}

function syncWidget() {
  if (widget) widget.value = buildSaveValue()
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  // Load initial value from node
  if (widget?.value) {
    loadSaveValue(widget.value)
  }

  // serializeValue is called by ComfyUI to get the value to send to backend
  widget.serializeValue = async ({ node }, index) => {
    const md = getMarkdownValue()
    if (node?.widgets_values) {
      node.widgets_values[index] = md
      node.widgets[index].value  = buildSaveValue()
    }
    return md
  }

  // Watch widget value changes (e.g. from workflow load)
  watch(
    () => widget.value,
    (newVal) => {
      if (newVal !== buildSaveValue()) {
        loadSaveValue(newVal)
      }
    }
  )
})
</script>

<style scoped>
.table-editor-widget {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  font-size: 12px;
  color: var(--fg-color, #e0e0e0);
  background: var(--comfy-menu-bg, #1e1e1e);
  border-radius: 6px;
  overflow: hidden;
}

/* Toolbar */
.tew-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  flex-shrink: 0;
  gap: 8px;
}

.tew-mode-tabs {
  display: flex;
  gap: 4px;
  background: var(--comfy-menu-bg, #1a1a1a);
  padding: 2px;
  border-radius: 6px;
  border: 1px solid var(--border-color, #333);
}

.tew-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--descrip-text, #999);
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.tew-tab:hover {
  color: var(--fg-color, #fff);
}
.tew-tab.active {
  background: var(--comfy-input-bg, #333);
  color: var(--p-primary-color, #4a9eff);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.tew-actions {
  display: flex;
  gap: 6px;
}

.tew-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid var(--border-color, #444);
  border-radius: 4px;
  background: var(--comfy-menu-bg, #2a2a2a);
  color: var(--fg-color, #ccc);
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s ease;
}
.tew-btn:hover {
  background: var(--comfy-input-bg, #3a3a3a);
  border-color: var(--p-primary-color, #4a9eff);
  color: var(--p-primary-color, #4a9eff);
}

/* Table mode */
.tew-table-wrapper {
  flex: 1;
  overflow: auto;
  padding: 8px;
  background: var(--comfy-menu-bg, #1e1e1e);
}

.tew-table {
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  width: auto;
  border: 1px solid var(--border-color, #333);
  border-radius: 4px;
  overflow: hidden;
}

.tew-row-handle {
  width: 24px;
  padding: 0;
  text-align: center;
  background: var(--comfy-input-bg, #252525);
  border-bottom: 1px solid var(--border-color, #333);
  border-right: 1px solid var(--border-color, #333);
}

.tew-header-cell {
  padding: 4px 6px;
  border-bottom: 1px solid var(--border-color, #333);
  border-right: 1px solid var(--border-color, #333);
  background: var(--comfy-input-bg, #252525);
}
.tew-header-cell:last-child {
  border-right: none;
}

.tew-cell-inner {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tew-body-cell {
  padding: 0;
  border-bottom: 1px solid var(--border-color, #333);
  border-right: 1px solid var(--border-color, #333);
  background: var(--comfy-menu-bg, #1e1e1e);
  transition: background 0.2s;
}
.tew-body-cell:last-child {
  vertical-align: top;
  border-right: none;
}
.tew-table tbody tr:last-child .tew-body-cell,
.tew-table tbody tr:last-child .tew-row-handle {
  border-bottom: none;
}
.tew-table tbody tr:hover .tew-body-cell {
  background: var(--comfy-input-bg, #2a2a2a);
}

.tew-cell-input {
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  outline: none;
  color: var(--fg-color, #e0e0e0);
  font-size: 12px;
  padding: 6px 8px;
  box-sizing: border-box;
  transition: all 0.2s;
}
.tew-cell-input:focus {
  background: var(--comfy-input-bg, #252535);
  border-color: var(--p-primary-color, #4a9eff);
}

.tew-cell-textarea {
  resize: none;
  min-height: 28px;
  font-family: inherit;
  line-height: 1.4;
  vertical-align: top;
  overflow: hidden;
  box-sizing: border-box;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
}

.tew-header-input {
  font-weight: 600;
  color: var(--p-primary-color, #6ab0ff);
  flex: 1;
  padding: 4px 6px;
}

.tew-col-del,
.tew-row-del {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--error-text, #ff6b6b);
  font-size: 14px;
  line-height: 1;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}
.tew-header-cell:hover .tew-col-del,
.tew-table tbody tr:hover .tew-row-del {
  opacity: 0.6;
}
.tew-col-del:hover,
.tew-row-del:hover {
  opacity: 1 !important;
  background: rgba(255, 107, 107, 0.15);
}

/* Markdown mode */
.tew-md-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px;
  overflow: hidden;
  background: var(--comfy-menu-bg, #1e1e1e);
}

.tew-md-textarea {
  flex: 1;
  width: 100%;
  background: var(--comfy-input-bg, #151515);
  border: 1px solid var(--border-color, #333);
  border-radius: 4px;
  color: var(--fg-color, #d4d4d4);
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  background: var(--comfy-input-bg, #252525);
  border-top: 1px solid var(--border-color, #3a3a3a);
  flex-shrink: 0;
}

.tew-output-label {
  color: var(--p-primary-color, #4a9eff);
  font-weight: 500;
  opacity: 0.8;
}
</style>
