<template>
  <div class="tag-picker-row" aria-label="标签类别筛选">
    <span class="tag-label">{{ label || '全部标签类别' }}</span>
    <button class="tag-chip" :aria-pressed="modelValue === 'all'" @click="select('all')">全部 {{ total }}</button>
    <button v-for="tag in fixedTags" :key="tag.name" class="tag-chip" :aria-pressed="modelValue === tag.name" title="按数量排名前五，固定显示" @click="select(tag.name)">{{ tag.name }} {{ tag.count }}</button>
    <span v-for="tag in customTags" :key="tag.name" class="custom-tag">
      <button class="tag-chip" :aria-pressed="modelValue === tag.name" @click="select(tag.name)">{{ tag.name }} {{ tag.count }}</button>
      <button class="remove-tag" :aria-label="`移除标签：${tag.name}`" @click="remove(tag.name)">×</button>
    </span>
    <button class="tag-chip manage-tags" @click="openPicker">＋ 添加标签</button>
    <span v-if="storageError" role="status">{{ storageError }}</span>
    <el-drawer v-model="open" title="选择展示的标签" direction="rtl" size="min(480px, 100vw)" destroy-on-close>
      <p class="picker-help">前 5 名标签固定显示。搜索并勾选其他标签，添加到顶部后即可直接筛选；自选标签可随时移除。</p>
      <label class="search-label" for="tag-picker-search">搜索标签</label>
      <input id="tag-picker-search" v-model="search" class="tag-search" type="search" :placeholder="searchPlaceholder || '输入标签名称，如 VPS、年付'" autocomplete="off" />
      <div v-if="customTags.length" class="saved-tags">
        <h3>已添加 {{ customTags.length }}</h3>
        <span v-for="tag in customTags" :key="tag.name" class="saved-tag">{{ tag.name }} <button :aria-label="`从自选中移除：${tag.name}`" @click="remove(tag.name)">×</button></span>
      </div>
      <p role="status" class="picker-help">找到 {{ matches.length }} 个标签 · 待添加 {{ draft.length }} 个</p>
      <div class="tag-results">
        <label v-for="tag in matches" :key="tag.name" class="tag-option">
          <input type="checkbox" :checked="isFixed(tag.name) || customNames.includes(tag.name) || draft.includes(tag.name)" :disabled="isFixed(tag.name) || customNames.includes(tag.name)" @change="toggleDraft(tag.name)" />
          <span>{{ tag.name }}</span><small>{{ tag.count }} 条</small>
          <small v-if="isFixed(tag.name)">固定前五</small><small v-else-if="customNames.includes(tag.name)">已添加</small>
        </label>
        <p v-if="!matches.length" class="picker-help">没有匹配标签，试试其他关键词。</p>
      </div>
      <template #footer><button class="tag-chip" @click="open = false">取消</button> <button class="add-selected" :disabled="!draft.length" @click="addSelected">添加所选（{{ draft.length }}）</button></template>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { ElDrawer } from "element-plus";
const props = defineProps<{ domain: 'welfare' | 'pojie' | 'guide'; label?: string; searchPlaceholder?: string; options: { name: string; count: number }[]; modelValue: string; total: number }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const storageKey = `lptff-display-tags-v1:${props.domain}`;
const customNames = ref<string[]>([]), draft = ref<string[]>([]), search = ref(''), open = ref(false), storageError = ref('');
const fixedTags = computed(() => props.options.filter(tag => !["待分类", "其他福利"].includes(tag.name)).slice(0, 5));
const isFixed = (name: string) => fixedTags.value.some(tag => tag.name === name);
const customTags = computed(() => customNames.value.filter(name => !isFixed(name)).map(name => props.options.find(tag => tag.name === name) || { name, count: 0 }));
const matches = computed(() => props.options.filter(tag => tag.name.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase())));
const select = (name: string) => emit('update:modelValue', name);
function readSaved() {
  try {
    const names = JSON.parse(localStorage.getItem(storageKey) || '[]');
    customNames.value = Array.isArray(names) ? [...new Set<string>(names.filter(n => typeof n === 'string' && n.trim() && !(props.domain === 'welfare' && n === '其他福利')))] : [];
  } catch { customNames.value = []; }
}
function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(customNames.value)); storageError.value = ''; }
  catch { storageError.value = '本机保存失败，本次页面内仍可使用。'; }
}
function openPicker() { search.value = ''; draft.value = []; open.value = true; }
function toggleDraft(name: string) { draft.value = draft.value.includes(name) ? draft.value.filter(n => n !== name) : [...draft.value, name]; }
function addSelected() {
  customNames.value = [...new Set([...customNames.value, ...draft.value.filter(name => !isFixed(name) && props.options.some(tag => tag.name === name))])];
  save(); open.value = false; draft.value = [];
}
function remove(name: string) {
  customNames.value = customNames.value.filter(n => n !== name); draft.value = draft.value.filter(n => n !== name);
  if (props.modelValue === name && !isFixed(name)) select('all');
  save();
}
function sync(event: StorageEvent) { if (event.key === storageKey || event.key === null) readSaved(); }
watch(() => [...fixedTags.value.map(t => t.name), ...customNames.value], names => {
  if (props.modelValue !== 'all' && !names.includes(props.modelValue)) select('all');
});
onMounted(() => { readSaved(); window.addEventListener('storage', sync); });
onUnmounted(() => window.removeEventListener('storage', sync));
</script>
<style scoped>
.tag-picker-row { display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:10px;font-size:12px;color:#586c89; }
.tag-label { font-weight:600; }.tag-chip { font:inherit;border:1px solid #d4e0ef;border-radius:16px;padding:5px 10px;background:#f7f9fc;color:#526784;cursor:pointer; }
.tag-chip[aria-pressed="true"] { background:#409eff;color:white;border-color:#409eff; }
.custom-tag { display:inline-flex;align-items:center;gap:2px; }.remove-tag { border:0;background:transparent;color:#7b8ca2;cursor:pointer;padding:5px;font-size:16px; }
.manage-tags { border-style:dashed; }.picker-help { font-size:13px;line-height:1.8;color:#657389; }
.search-label { display:block;margin:14px 0 7px;font-size:13px; }.tag-search { width:100%;box-sizing:border-box;border:1px solid #ccd9e8;border-radius:8px;padding:10px;font:inherit; }
.saved-tags h3 { font-size:13px;margin:16px 0 8px; }.saved-tag { display:inline-flex;align-items:center;gap:5px;background:#edf5ff;border-radius:5px;padding:3px 6px;margin:3px;font-size:12px; }.saved-tag button { border:0;background:transparent;cursor:pointer;color:#526784; }
.tag-option { display:flex;align-items:center;gap:9px;padding:10px 4px;border-bottom:1px solid #edf1f5;font-size:13px;cursor:pointer; }.tag-option span { flex:1;overflow-wrap:anywhere; }.tag-option small { color:#7c8898; }.tag-option input { accent-color:#409eff; }
.add-selected { background:#409eff;border:1px solid #409eff;color:white;border-radius:7px;padding:8px 14px;cursor:pointer; }.add-selected:disabled { opacity:.5;cursor:default; }
button:focus-visible,input:focus-visible { outline:2px solid #277ac5;outline-offset:2px; }
</style>
