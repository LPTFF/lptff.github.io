<template>
  <div class="live2d-view">
    <h2 class="page-title">看板娘</h2>
    <p class="page-desc">
      复刻自 2018–2019 年 hexo 博客时代的 live2d 看板娘，开启后在站点右下角悬浮展示，可点击模型触发随机动作，移动端不显示（沿用旧站设定）。共 {{ models.length }} 款官方免费示例模型可选。
    </p>

    <div class="control-card">
      <div class="control-row">
        <span class="control-label">全站显示看板娘</span>
        <el-switch v-model="enabled" :loading="switching" @change="handleToggle" />
      </div>
      <p class="control-tip">{{ enabled ? "看板娘正在站点右下角待命" : "看板娘已休息，开启后随设置在全站显示" }}</p>
      <el-alert
        v-if="errorMessage"
        type="error"
        :title="errorMessage"
        show-icon
        :closable="false"
        class="load-error"
      />
    </div>

    <div class="info-card">
      <div class="info-head">选择模型</div>
      <div class="model-list">
        <div
          v-for="model in models"
          :key="model.id"
          class="model-card"
          :class="{ active: model.id === selectedModel }"
          @click="handleSelectModel(model.id)"
        >
          <img
            v-lazy-preview="model.preview"
            :alt="model.name"
            class="model-preview"
            decoding="async"
          />
          <span class="model-name">{{ model.name }}</span>
          <el-tag v-if="model.id === selectedModel" size="small" type="success">当前</el-tag>
        </div>
      </div>
      <p class="control-tip">{{ enabled ? "切换后立即生效，无需刷新" : "已记录选择，开启看板娘后展示该模型" }}</p>
    </div>

    <div class="info-card">
      <div class="info-head">来源说明</div>
      <ul class="info-list">
        <li>hijiki 模型与运行库提取自仓库历史分支 hexo-backup；其余模型来自 live2d-widget 生态的官方免费示例模型包（Cubism2 时代官方示例素材，遵循各自的使用许可，限个人非商用），全本地加载、无外部 CDN 依赖</li>
        <li>初始化参数沿用旧站配置：右侧悬浮、150×300、idle 待机动作 + 8 组点击动作</li>
        <li>显示状态记忆在浏览器本地（localStorage），不影响其他访客</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, type Directive } from "vue";
import { ElSwitch, ElAlert, ElMessage, ElTag } from "element-plus";
import {
  loadLive2dModels,
  Live2dModelOption,
  isLive2dEnabled,
  getSelectedModelId,
  enableLive2d,
  disableLive2d,
  switchLive2dModel,
} from "../../../utils/live2d";

const enabled = ref(false);
const switching = ref(false);
const errorMessage = ref("");
const models = ref<Live2dModelOption[]>([]);
const selectedModel = ref("hijiki");
const failedPreviews = new Set<HTMLImageElement>();

const loadPreview = (image: HTMLImageElement) => {
  const source = image.dataset.previewSrc;
  if (!source || image.dataset.previewLoading === "1") return;
  image.dataset.previewLoading = "1";
  image.src = source;
};

const handlePreviewLoad = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement;
  delete image.dataset.previewLoading;
  failedPreviews.delete(image);
  previewObserver.unobserve(image);
};

const handlePreviewError = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement;
  delete image.dataset.previewLoading;
  image.removeAttribute("src");
  failedPreviews.add(image);
  previewObserver.unobserve(image);
};

const previewObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const image = entry.target as HTMLImageElement;
      loadPreview(image);
    });
  },
  { rootMargin: "120px 0px" },
);

const retryFailedPreviews = () => {
  failedPreviews.forEach((image) => previewObserver.observe(image));
};

const vLazyPreview: Directive<HTMLImageElement, string | undefined> = {
  mounted(image, binding) {
    if (!binding.value) return;
    image.dataset.previewSrc = binding.value;
    image.addEventListener("load", handlePreviewLoad);
    image.addEventListener("error", handlePreviewError);
    previewObserver.observe(image);
  },
  updated(image, binding) {
    if (!binding.value || binding.value === binding.oldValue) return;
    image.removeAttribute("src");
    image.dataset.previewSrc = binding.value;
    previewObserver.observe(image);
  },
  unmounted(image) {
    previewObserver.unobserve(image);
    failedPreviews.delete(image);
    image.removeEventListener("load", handlePreviewLoad);
    image.removeEventListener("error", handlePreviewError);
  },
};

onMounted(async () => {
  window.addEventListener("online", retryFailedPreviews);
  enabled.value = isLive2dEnabled();
  models.value = await loadLive2dModels();
  selectedModel.value = await getSelectedModelId();
});

onBeforeUnmount(() => {
  window.removeEventListener("online", retryFailedPreviews);
  previewObserver.disconnect();
  failedPreviews.clear();
});

const handleToggle = async (value: string | number | boolean) => {
  errorMessage.value = "";
  if (value) {
    switching.value = true;
    try {
      await enableLive2d();
      ElMessage.success("看板娘已上线");
    } catch (error) {
      enabled.value = false;
      errorMessage.value = error instanceof Error ? error.message : "看板娘开启失败";
    } finally {
      switching.value = false;
    }
  } else {
    disableLive2d();
  }
};

const handleSelectModel = async (modelId: string) => {
  if (modelId === selectedModel.value) return;
  selectedModel.value = modelId;
  await switchLive2dModel(modelId);
  if (isLive2dEnabled()) ElMessage.success("看板娘已换装");
};
</script>

<style scoped>
.live2d-view {
  max-width: 760px;
  margin: 0 auto;
  padding: 8px 16px 40px;
}

.page-title {
  margin: 12px 0;
  font-size: 22px;
  font-weight: 600;
}

.page-desc {
  margin: 0 0 20px;
  color: #666;
  line-height: 1.7;
}

.control-card,
.info-card {
  padding: 16px 20px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background-color: var(--el-bg-color);
}

.info-card {
  margin-top: 16px;
}

.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.control-label {
  font-size: 15px;
  font-weight: 600;
}

.control-tip {
  margin: 10px 0 0;
  color: #888;
  font-size: 13px;
}

.load-error {
  margin-top: 12px;
}

.info-head {
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 600;
}

.model-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.model-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid var(--el-border-color-light);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.model-card:hover {
  border-color: var(--el-color-primary-light-5);
}

.model-card.active {
  border-color: var(--el-color-primary);
}

.model-preview {
  width: 90px;
  height: 120px;
  object-fit: contain;
  background: linear-gradient(135deg, var(--el-fill-color-light), var(--el-fill-color-lighter));
  border-radius: 6px;
}

.model-name {
  font-size: 13px;
  color: #333;
}

.info-list {
  margin: 0;
  padding-left: 18px;
  color: #555;
  line-height: 1.8;
}
</style>
