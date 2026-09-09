<template>
  <div class="career-page">
    <!-- 顶部状态栏：扩展与 Gemini 运行环境感知 -->
    <section class="status-banner" :class="{ 'is-connected': bridgeStatus.connected }">
      <div class="banner-content">
        <div class="banner-title-group">
          <el-tag :type="bridgeStatus.connected ? 'success' : 'info'" effect="dark" size="small">
            {{ bridgeStatus.connected ? "助手扩展已连接" : "未连接扩展" }}
          </el-tag>
          <span class="banner-title">个人求职机会发现与职业决策工作台</span>
        </div>
        <div class="banner-info">
          <template v-if="bridgeStatus.connected">
            <span
              v-if="bridgeStatus.hasGeminiKey"
              class="key-status text-success"
              style="cursor: pointer"
              title="点击展开/编辑 Gemini 配置"
              @click="toggleGeminiConfig"
            >
              ✓ 已就绪 (Gemini: {{ bridgeStatus.model || "默认" }})
            </span>
            <span
              v-else
              class="key-status text-warning"
              style="cursor: pointer"
              title="点击配置 Gemini Key"
              @click="toggleGeminiConfig"
            >
              ⚠ 未配置 Gemini Key（点击配置）
            </span>
            <el-button
              size="small"
              :type="showGeminiConfig ? 'primary' : 'default'"
              @click="toggleGeminiConfig"
              class="ml-2"
            >
              {{ showGeminiConfig ? "收起配置" : "⚙ 配置 Gemini" }}
            </el-button>
          </template>
          <template v-else>
            <span class="text-muted">
              当前处于公开浏览模式。如需分析简历、提取画像并匹配机会，请在 Chrome 中加载本站助手扩展。
            </span>
          </template>
          <el-button size="small" :loading="checkingStatus" @click="refreshBridgeStatus" class="ml-2">
            刷新连接
          </el-button>
        </div>
      </div>
      <div class="banner-privacy-tip">
        🛡 隐私与本地优先：简历解析与画像提取均在浏览器和扩展内完成，直接通过用户已配置的 Gemini 接口处理，绝不上传到任何独立服务器。
      </div>

      <!-- 可展开编辑的 Gemini 配置模块 (参考 Boss 直聘 AI 沟通助手) -->
      <el-collapse-transition>
        <div v-if="bridgeStatus.connected && showGeminiConfig" class="gemini-config-section">
          <div class="gemini-config-card">
            <div class="config-card-header">
              <div class="title-wrap">
                <span class="cfg-icon">🤖</span>
                <span class="cfg-title">Gemini 模型与 API Key 配置</span>
                <el-tag size="small" :type="bridgeStatus.hasGeminiKey ? 'success' : 'danger'" class="ml-2">
                  {{ bridgeStatus.hasGeminiKey ? "已配置" : "未配置" }}
                </el-tag>
              </div>
              <div class="header-tips">
                💡 <strong>与 AI 沟通小助手保持一致</strong>：此处的 Gemini Key 与扩展内 BOSS 直聘「AI 沟通小助手」底层完全打通共用，两边只需要配置一次就能共用。密钥仅保存在当前 Chrome 扩展本地，绝不上传至任何独立服务器。
              </div>
            </div>

            <div class="config-form-grid">
              <!-- 模型选择 -->
              <div class="form-item">
                <label class="form-label">Gemini 模型</label>
                <el-select v-model="geminiForm.model" size="default" style="width: 100%" placeholder="选择模型">
                  <el-option value="gemini-3.7-flash" label="Gemini 3.7 Flash（最新推理推荐）" />
                  <el-option value="gemini-3.6-flash" label="Gemini 3.6 Flash（稳定推荐）" />
                  <el-option value="gemini-3.5-flash-lite" label="Gemini 3.5 Flash-Lite（默认轻量）" />
                </el-select>
              </div>

              <!-- Key 输入 -->
              <div class="form-item">
                <label class="form-label">Gemini Key</label>
                <div class="key-input-row">
                  <el-input
                    v-model="geminiForm.key"
                    :type="isKeyRevealed ? 'text' : 'password'"
                    size="default"
                    placeholder="请输入 Gemini Key"
                    clearable
                    class="key-secret-input"
                  />
                  <button
                    type="button"
                    class="lptff-reveal-btn"
                    :disabled="revealingKey"
                    @click="handleToggleRevealKey"
                    :title="isKeyRevealed ? '隐藏明文' : '显示明文'"
                  >
                    {{ isKeyRevealed ? "隐藏" : "显示" }}
                  </button>
                  <span v-if="bridgeStatus.hasGeminiKey" class="secret-state-badge">
                    已保存
                  </span>
                </div>
              </div>
            </div>

            <!-- 操作与状态反馈 -->
            <div class="config-card-actions">
              <div class="actions-left">
                <el-button
                  type="primary"
                  size="default"
                  :loading="testingGemini"
                  @click="handleSaveAndTestGemini"
                >
                  保存并测试连接
                </el-button>
                <el-button
                  size="default"
                  :loading="savingGemini"
                  @click="handleSaveGeminiOnly"
                >
                  仅保存
                </el-button>
                <el-button
                  v-if="bridgeStatus.hasGeminiKey"
                  type="danger"
                  plain
                  size="default"
                  :loading="clearingGemini"
                  @click="handleClearGeminiKey"
                >
                  清除 Key
                </el-button>
              </div>

              <div class="actions-right">
                <span
                  v-if="geminiTestFeedback"
                  class="test-feedback-pill"
                  :class="geminiTestSuccess ? 'is-success' : 'is-error'"
                >
                  {{ geminiTestFeedback }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-collapse-transition>
    </section>

    <!-- 主工作区：左侧分析与画像，右侧推荐方向与机会 -->
    <div class="career-layout">
      <!-- 个人端：简历上传与处理控制台 -->
      <div class="career-col left-col">
        <!-- 简历版本与上传卡片 -->
        <el-card shadow="never" class="career-card">
          <template #header>
            <div class="card-header">
              <span class="header-title">📄 简历管理与分析</span>
              <div v-if="profile" class="version-badge">
                <el-tag size="small" type="primary">v{{ profile.version }}</el-tag>
              </div>
            </div>
          </template>

          <!-- 尚未连接扩展时的醒目引导 -->
          <div v-if="!bridgeStatus.connected" class="not-connected-guide">
            <el-alert
              title="需要连接 LPTFF 助手扩展"
              type="info"
              :closable="false"
              show-icon
              description="简历深度解析、原文证据提取及市场机会匹配需复用扩展的 Gemini 本地能力。未连接扩展时仅可浏览右侧的公开招聘市场快照，不会伪造分析进度。"
            />
            <div class="guide-actions">
              <a href="https://github.com/LPTFF/lptff.github.io/tree/master/project-support/extension/lptff-investment-assistant" target="_blank" class="guide-link">
                查看扩展加载说明 →
              </a>
            </div>
          </div>

          <!-- 已连接扩展：上传与处理区 -->
          <div v-else class="upload-zone">
            <div v-if="profile" class="profile-meta-bar">
              <div class="meta-row">
                <span class="meta-label">已加载文档：</span>
                <span class="meta-value font-medium">{{ profile.fileName }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">更新时间：</span>
                <span class="meta-value">{{ formatDate(profile.updatedAt) }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">文本指纹：</span>
                <span class="meta-value text-mono text-muted">{{ profile.fingerprint.slice(0, 12) }}...</span>
              </div>
            </div>

            <!-- 文件选择与拖拽区 -->
            <div
              class="drop-area"
              :class="{ 'is-dragover': isDragOver, 'is-disabled': isProcessing }"
              @dragover.prevent="isDragOver = true"
              @dragleave.prevent="isDragOver = false"
              @drop.prevent="handleFileDrop"
              @click="triggerFileInput"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept=".docx,.pdf"
                style="display: none"
                @change="handleFileSelect"
              />
              <div class="drop-icon">📤</div>
              <div class="drop-title">
                {{ profile ? "点击或拖拽新文件更新简历" : "点击或拖拽上传简历 (DOCX / PDF)" }}
              </div>
              <div class="drop-desc">
                支持 DOCX 及包含文字图层的 PDF 简历（纯图片扫描件暂不支持）
              </div>
            </div>

            <!-- 分析进度条与状态机 -->
            <div v-if="isProcessing || processStep > 0" class="process-section">
              <el-steps :active="processStep" finish-status="success" simple size="small">
                <el-step title="文件解析" />
                <el-step title="能力提取" />
                <el-step title="市场比对" />
              </el-steps>
              <div v-if="processMessage" class="process-msg" :class="{ 'is-error': processError }">
                <span v-if="isProcessing" class="loading-spinner">⏳</span>
                {{ processMessage }}
              </div>
            </div>

            <!-- 异常与恢复 -->
            <div v-if="processError" class="error-action-box">
              <el-alert :title="processError" type="error" :closable="false" show-icon />
              <div class="retry-bar">
                <el-button size="small" type="primary" @click="retryCurrentTask">重新分析</el-button>
              </div>
            </div>

            <!-- 选填偏好（保留未知） -->
            <div class="preferences-box">
              <div class="preferences-header">
                <span class="pref-title">🎯 意向补充（选填）</span>
                <span class="pref-tip">未填写的条件保持未知，不强制排查，亦不默认作为排除项</span>
              </div>
              <div class="pref-inputs">
                <el-input
                  v-model="preferences.city"
                  size="small"
                  placeholder="期望城市（例如：上海、杭州、远程，留空不限）"
                  clearable
                  @change="handlePreferencesChange"
                />
                <el-input
                  v-model="preferences.salaryExpectation"
                  size="small"
                  placeholder="薪资预期（例如：25K+、年包30W，留空不限）"
                  clearable
                  @change="handlePreferencesChange"
                />
              </div>
            </div>

            <!-- 清除本地数据操作 -->
            <div v-if="profile" class="clear-data-bar">
              <el-button size="small" text type="danger" @click="handleClearData">
                清空本地简历与画像数据
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 可展开的能力画像与原文证据 -->
        <el-card v-if="profile" shadow="never" class="career-card mt-4">
          <template #header>
            <div class="card-header">
              <span class="header-title">🧠 提取的能力画像与来源证据</span>
              <el-button size="small" type="success" plain @click="handleSyncAutopilot">
                同步至 BOSS 沟通助手
              </el-button>
            </div>
          </template>

          <div class="profile-overview">
            <div class="overview-item">
              <span class="label">工作年限：</span>
              <span class="val font-semibold">{{ profile.workYears }}</span>
            </div>
            <div class="overview-item">
              <span class="label">学历：</span>
              <span class="val">{{ profile.education }}</span>
            </div>
            <div class="overview-item">
              <span class="label">求职意向：</span>
              <span class="val font-semibold text-primary">{{ profile.targetIntention }}</span>
            </div>
          </div>

          <div class="profile-summary-text">
            <strong>画像总述：</strong>{{ profile.summary }}
          </div>

          <el-collapse v-model="activeCollapsePanels" class="evidence-collapse">
            <!-- 技术栈与能力证据 -->
            <el-collapse-item title="🔍 技术栈实证与自述（含原文佐证）" name="capabilities">
              <div class="capabilities-list">
                <div
                  v-for="(cap, idx) in profile.capabilities"
                  :key="idx"
                  class="capability-item"
                  :class="cap.evidenceType"
                >
                  <div class="cap-header">
                    <span class="cap-name font-medium">{{ cap.skillName }}</span>
                    <el-tag size="small" :type="evidenceTagType(cap.evidenceType)">
                      {{ evidenceLabel(cap.evidenceType) }}
                    </el-tag>
                    <span class="cap-cat text-muted">[{{ cap.category }}]</span>
                  </div>
                  <div v-if="cap.quote" class="cap-quote">
                    “{{ cap.quote }}”
                  </div>
                </div>
              </div>
            </el-collapse-item>

            <!-- 工作与项目经历时间线 -->
            <el-collapse-item title="💼 项目与工作经历核验" name="experiences">
              <div class="experiences-list">
                <div v-for="(exp, idx) in profile.experiences" :key="idx" class="experience-card">
                  <div class="exp-title-row">
                    <span class="exp-comp font-semibold">{{ exp.companyOrProject }}</span>
                    <span class="exp-role text-primary"> · {{ exp.role }}</span>
                    <span class="exp-time text-muted">{{ exp.timeRange }}</span>
                  </div>
                  <div v-if="exp.techStack && exp.techStack.length" class="exp-tech-row">
                    <el-tag v-for="tech in exp.techStack" :key="tech" size="small" class="mr-1">
                      {{ tech }}
                    </el-tag>
                  </div>
                  <ul class="exp-resp-list">
                    <li v-for="(resp, rIdx) in exp.responsibilities" :key="rIdx">
                      {{ resp }}
                    </li>
                  </ul>
                  <div v-if="exp.quote" class="exp-quote text-muted">
                    出处佐证：{{ exp.quote }}
                  </div>
                </div>
              </div>
            </el-collapse-item>

            <!-- 未知信息与待核实项 -->
            <el-collapse-item v-if="profile.unknowns && profile.unknowns.length" title="❓ 简历未注明的未知信息" name="unknowns">
              <ul class="unknowns-list">
                <li v-for="(item, idx) in profile.unknowns" :key="idx" class="text-muted">
                  {{ item }}
                </li>
              </ul>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </div>

      <!-- 机会端：推荐搜索方向与公开市场快照 -->
      <div class="career-col right-col">
        <!-- 推荐方向展示面板 -->
        <el-card shadow="never" class="career-card">
          <template #header>
            <div class="card-header">
              <div>
                <span class="header-title">🚀 推荐搜索方向</span>
                <span class="header-sub text-muted">（点击方向可直接携关键词前往 BOSS 直聘精准搜索）</span>
              </div>
              <div v-if="directions.length" class="direction-filter-tabs">
                <el-radio-group v-model="directionFilter" size="small">
                  <el-radio-button label="all">全部 ({{ directions.length }})</el-radio-button>
                  <el-radio-button label="market">市场支持 ({{ marketSupportedCount }})</el-radio-button>
                  <el-radio-button label="adjacent">相邻探索 ({{ adjacentCount }})</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>

          <div v-if="!profile && directions.length === 0" class="empty-direction-hint">
            <div class="empty-icon">🧭</div>
            <div class="empty-text">上传简历并完成能力提取后，系统将结合实时市场需求推荐匹配方向</div>
          </div>

          <div v-else-if="filteredDirections.length === 0" class="empty-direction-hint">
            <div class="empty-text">当前分类下暂无推荐方向</div>
          </div>

          <!-- 方向卡片列表 -->
          <div v-else class="direction-cards-grid">
            <div
              v-for="dir in filteredDirections"
              :key="dir.id"
              class="direction-card"
              :class="{ 'is-adjacent': dir.isAdjacent }"
            >
              <div class="direction-card-top">
                <div class="dir-title-row">
                  <h3 class="dir-title">{{ dir.title }}</h3>
                  <el-tag size="small" :type="dir.isAdjacent ? 'warning' : 'success'">
                    {{ dir.isAdjacent ? "相邻探索" : "市场支持" }}
                  </el-tag>
                </div>
                <div class="dir-reason">
                  <strong>为什么适合：</strong>{{ dir.fitReason }}
                </div>
                <div class="dir-basis text-muted">
                  <strong>市场依据：</strong>{{ dir.marketBasis }}
                </div>
              </div>

              <!-- 沟通待核实条件 -->
              <div v-if="dir.conditionsToVerify && dir.conditionsToVerify.length" class="dir-verify-box">
                <span class="verify-title">待核实条件：</span>
                <el-tag
                  v-for="(cond, cIdx) in dir.conditionsToVerify"
                  :key="cIdx"
                  size="small"
                  type="info"
                  class="verify-tag"
                >
                  {{ cond }}
                </el-tag>
              </div>

              <!-- 市场支撑岗位与原文引用佐证 -->
              <div v-if="dir.supportingJobs && dir.supportingJobs.length" class="supporting-jobs-box">
                <div class="supporting-jobs-head">
                  <span>📊 对应市场岗位佐证（{{ dir.supportingJobs.length }} 个）：</span>
                </div>
                <div class="citation-cards">
                  <div v-for="(cite, cIdx) in dir.supportingJobs" :key="cIdx" class="citation-card">
                    <div class="citation-meta">
                      <span class="cite-company font-medium">{{ cite.brandName }}</span>
                      <span class="cite-title"> · {{ cite.jobTitle }}</span>
                      <span v-if="cite.salaryDesc" class="cite-salary text-primary">{{ cite.salaryDesc }}</span>
                    </div>
                    <blockquote class="citation-quote">
                      “{{ cite.exactQuote }}”
                    </blockquote>
                  </div>
                </div>
              </div>

              <!-- BOSS 搜索按钮 -->
              <div class="dir-action-footer">
                <el-button
                  type="primary"
                  @click="handleJumpToBoss(dir.bossSearchKeyword)"
                >
                  前往 BOSS 搜索此方向 ({{ dir.bossSearchKeyword }}) ↗
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 公开招聘市场快照浏览（无插件用户亦可查看） -->
        <el-card shadow="never" class="career-card mt-4">
          <template #header>
            <div class="card-header">
              <div>
                <span class="header-title">🌐 公开招聘市场需求快照</span>
                <span class="header-sub text-muted">（由 GitHub Actions 每日自动抓取去重）</span>
              </div>
              <el-tag size="small" type="info">共 {{ publicJobs.length }} 条样本</el-tag>
            </div>
          </template>

          <div class="snapshot-summary-bar">
            <span class="snapshot-desc text-muted">
              覆盖北上广深杭等 25 个主要城市公开展现页。本快照如实展示当前采样范围，不夸大市场热度。
            </span>
            <span v-if="snapshotLastTime" class="snapshot-time text-muted">
              最后更新：{{ snapshotLastTime }}
            </span>
          </div>

          <div class="public-jobs-list">
            <div v-for="job in publicJobs" :key="job.job_detail" class="public-job-item">
              <div class="job-item-main">
                <div class="job-title-line">
                  <a :href="job.job_detail" target="_blank" class="job-link font-semibold">
                    {{ job.bossTitle }}
                  </a>
                  <span class="job-salary text-primary">{{ job.salaryDesc }}</span>
                </div>
                <div class="job-company-line text-muted">
                  <span>{{ job.brandName }}</span>
                  <span v-if="job.brandIndustry"> · {{ job.brandIndustry }}</span>
                  <span v-if="job.sourcePage"> · {{ job.sourcePage.replace(/\//g, "") }}</span>
                </div>
                <div v-if="job.jobDesc" class="job-desc-line text-muted">
                  {{ job.jobDesc }}
                </div>
                <div class="job-skills-line">
                  <el-tag v-for="sk in job.skills" :key="sk" size="small" class="mr-1">
                    {{ sk }}
                  </el-tag>
                </div>
              </div>
              <div class="job-item-action">
                <el-button size="small" text @click="handleJumpToBoss(job.bossTitle)">
                  搜相似 ↗
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, toRaw } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type {
  CareerProfile,
  CareerDirection,
  CareerBridgeStatus,
  MarketJobItem,
  UserPreferences,
  EvidenceType,
} from "../../career/types";
import {
  checkCareerStatus,
  extractCareerProfile,
  matchCareerDirections,
  getSavedCareerData,
  clearCareerData,
  syncToBossAutopilot,
  getCareerGeminiConfig,
  revealCareerGeminiKey,
  saveCareerGeminiConfig,
  testCareerGemini,
  clearCareerGeminiKey,
} from "../../career/sync/career-bridge";
import { parseResumeFile } from "../../career/parser";
import publicJobsRaw from "../../data/zhipin.json";

const publicJobs = ref<MarketJobItem[]>(publicJobsRaw as MarketJobItem[]);

// 状态感知
const checkingStatus = ref(false);
const bridgeStatus = ref<CareerBridgeStatus>({
  connected: false,
  hasGeminiKey: false,
  model: "",
  currentProfileMeta: null,
});

// 可编辑 Gemini 配置状态
const showGeminiConfig = ref(false);
const geminiForm = ref({
  model: "gemini-3.5-flash-lite",
  key: "",
});
const isKeyRevealed = ref(false);
const revealingKey = ref(false);
const savingGemini = ref(false);
const testingGemini = ref(false);
const clearingGemini = ref(false);
const geminiTestFeedback = ref("");
const geminiTestSuccess = ref(false);

const loadSavedGeminiKey = async () => {
  if (!bridgeStatus.value.hasGeminiKey) return;
  try {
    const rawKey = await revealCareerGeminiKey();
    if (rawKey) {
      geminiForm.value.key = rawKey;
      isKeyRevealed.value = false;
    }
  } catch (err) {
    console.warn("读取已保存 Gemini Key 失败:", err);
  }
};

const toggleGeminiConfig = async () => {
  showGeminiConfig.value = !showGeminiConfig.value;
  if (showGeminiConfig.value) {
    geminiForm.value.model = bridgeStatus.value.model || "gemini-3.5-flash-lite";
    geminiTestFeedback.value = "";
    if (bridgeStatus.value.hasGeminiKey && !geminiForm.value.key) {
      await loadSavedGeminiKey();
    }
  }
};

const handleToggleRevealKey = async () => {
  if (isKeyRevealed.value) {
    isKeyRevealed.value = false;
    return;
  }
  if (!geminiForm.value.key && bridgeStatus.value.hasGeminiKey) {
    revealingKey.value = true;
    try {
      const rawKey = await revealCareerGeminiKey();
      if (rawKey) {
        geminiForm.value.key = rawKey;
      }
    } catch (err) {
      ElMessage.error(`读取 Key 失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      revealingKey.value = false;
    }
  }
  isKeyRevealed.value = true;
};

const handleSaveGeminiOnly = async () => {
  savingGemini.value = true;
  geminiTestFeedback.value = "";
  try {
    const payload: { model: string; geminiKey?: string } = {
      model: geminiForm.value.model,
    };
    if (geminiForm.value.key && geminiForm.value.key.trim()) {
      payload.geminiKey = geminiForm.value.key.trim();
    }
    const updated = await saveCareerGeminiConfig(payload);
    bridgeStatus.value.model = updated.model;
    bridgeStatus.value.hasGeminiKey = updated.hasGeminiKey;
    isKeyRevealed.value = false;
    geminiTestSuccess.value = true;
    geminiTestFeedback.value = `✓ 配置已保存 (模型: ${updated.model})`;
    ElMessage.success("Gemini 配置已更新，与 AI 沟通小助手保持一致");
  } catch (err) {
    geminiTestSuccess.value = false;
    geminiTestFeedback.value = `保存失败: ${err instanceof Error ? err.message : String(err)}`;
    ElMessage.error(geminiTestFeedback.value);
  } finally {
    savingGemini.value = false;
  }
};

const handleSaveAndTestGemini = async () => {
  testingGemini.value = true;
  geminiTestFeedback.value = "正在连接 Google Gemini API 进行测试...";
  geminiTestSuccess.value = false;
  try {
    const payload: { model: string; geminiKey?: string } = {
      model: geminiForm.value.model,
    };
    if (geminiForm.value.key && geminiForm.value.key.trim()) {
      payload.geminiKey = geminiForm.value.key.trim();
    }
    const testResult = await testCareerGemini(payload);
    bridgeStatus.value.model = testResult.model || geminiForm.value.model;
    bridgeStatus.value.hasGeminiKey = true;
    isKeyRevealed.value = false;
    geminiTestSuccess.value = true;
    const latency = testResult.durationMs ? `${testResult.durationMs}ms` : "响应正常";
    geminiTestFeedback.value = `✓ 连接成功！模型: ${testResult.model} (${latency})`;
    ElMessage.success(`Gemini 连接测试成功 (${latency})，与 AI 沟通小助手保持一致`);
  } catch (err) {
    geminiTestSuccess.value = false;
    geminiTestFeedback.value = `✗ 测试失败: ${err instanceof Error ? err.message : String(err)}`;
    ElMessage.error(geminiTestFeedback.value);
  } finally {
    testingGemini.value = false;
  }
};

const handleClearGeminiKey = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要清除 Chrome 扩展中保存的 Gemini API Key 吗？清除后将无法进行简历分析与 BOSS AI 自动沟通，直至重新配置。",
      "清除 Gemini Key",
      {
        confirmButtonText: "确定清除",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
    clearingGemini.value = true;
    await clearCareerGeminiKey();
    bridgeStatus.value.hasGeminiKey = false;
    geminiForm.value.key = "";
    isKeyRevealed.value = false;
    geminiTestFeedback.value = "已清除 Gemini Key";
    geminiTestSuccess.value = false;
    ElMessage.success("已清除 Gemini Key");
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error(`清除失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  } finally {
    clearingGemini.value = false;
  }
};

// 分析状态
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);
const isProcessing = ref(false);
const processStep = ref(0);
const processMessage = ref("");
const processError = ref("");
const lastUploadedFile = ref<File | null>(null);

// 画像与推荐
const profile = ref<CareerProfile | null>(null);
const directions = ref<CareerDirection[]>([]);
const directionFilter = ref<"all" | "market" | "adjacent">("all");
const activeCollapsePanels = ref<string[]>(["capabilities", "experiences"]);

// 偏好设置
const preferences = ref<UserPreferences>({
  city: "",
  salaryExpectation: "",
});

const snapshotLastTime = computed(() => {
  if (!publicJobs.value.length) return "";
  return publicJobs.value[0].time || publicJobs.value[0].capturedAt || "";
});

const marketSupportedCount = computed(
  () => directions.value.filter((d) => !d.isAdjacent).length
);
const adjacentCount = computed(
  () => directions.value.filter((d) => d.isAdjacent).length
);

const filteredDirections = computed(() => {
  if (directionFilter.value === "market") {
    return directions.value.filter((d) => !d.isAdjacent);
  }
  if (directionFilter.value === "adjacent") {
    return directions.value.filter((d) => d.isAdjacent);
  }
  return directions.value;
});

const refreshBridgeStatus = async () => {
  checkingStatus.value = true;
  try {
    bridgeStatus.value = await checkCareerStatus();
    if (bridgeStatus.value.connected) {
      if (bridgeStatus.value.model) {
        geminiForm.value.model = bridgeStatus.value.model;
      }
      if (bridgeStatus.value.hasGeminiKey) {
        await loadSavedGeminiKey();
      }
      await loadSavedData();
    }
  } finally {
    checkingStatus.value = false;
  }
};

const loadSavedData = async () => {
  try {
    const saved = await getSavedCareerData();
    if (saved.profile) {
      profile.value = saved.profile;
    }
    if (saved.directions && saved.directions.length) {
      directions.value = saved.directions;
    }
  } catch (error) {
    console.warn("读取本地缓存画像失败:", error);
  }
};

const triggerFileInput = () => {
  if (isProcessing.value) return;
  fileInputRef.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    startProcessFile(file);
  }
  target.value = "";
};

const handleFileDrop = (event: DragEvent) => {
  isDragOver.value = false;
  if (isProcessing.value) return;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    startProcessFile(file);
  }
};

const startProcessFile = async (file: File) => {
  if (!bridgeStatus.value.connected) {
    ElMessage.warning("请先加载并连接 LPTFF 助手扩展后再分析简历");
    return;
  }
  if (!bridgeStatus.value.hasGeminiKey) {
    showGeminiConfig.value = true;
    ElMessage.warning("尚未配置 Gemini Key，请在上方“配置 Gemini”面板中录入后重试");
    return;
  }

  lastUploadedFile.value = file;
  processError.value = "";
  isProcessing.value = true;
  processStep.value = 1;
  processMessage.value = `正在解析 ${file.name} 文本内容...`;

  try {
    // 1. 浏览器解析文本
    const parsed = await parseResumeFile(file);
    processStep.value = 2;
    processMessage.value = "Gemini 正在提取能力画像与原文佐证（严谨校验经历与技能）...";

    // 2. 提交扩展提取画像
    const extractedProfile = await extractCareerProfile(parsed.text, {
      fileName: parsed.fileName,
      fileSize: parsed.fileSize,
      fingerprint: parsed.fingerprint,
    });
    profile.value = extractedProfile;

    // 3. 市场方向匹配
    processStep.value = 3;
    processMessage.value = "正在对照公开招聘需求快照匹配搜索方向并校验原文引用...";

    const matchedDirections = await matchCareerDirections(
      toRaw(extractedProfile) || extractedProfile,
      toRaw(publicJobs.value),
      toRaw(preferences.value)
    );
    directions.value = matchedDirections;

    processStep.value = 4;
    processMessage.value = "分析与匹配完成！可查阅推荐方向并直接前往 BOSS 直聘精准搜索。";
    ElMessage.success("简历画像与推荐方向更新成功");
  } catch (error) {
    processError.value = error instanceof Error ? error.message : String(error);
    processMessage.value = `处理失败：${processError.value}`;
  } finally {
    isProcessing.value = false;
  }
};

const retryCurrentTask = () => {
  if (lastUploadedFile.value) {
    startProcessFile(lastUploadedFile.value);
  } else if (profile.value) {
    handlePreferencesChange();
  }
};

const handlePreferencesChange = async () => {
  if (!profile.value || !bridgeStatus.value.connected) return;
  isProcessing.value = true;
  processMessage.value = "偏好已调整，正在重新计算推荐方向...";
  try {
    directions.value = await matchCareerDirections(
      toRaw(profile.value) || profile.value,
      toRaw(publicJobs.value),
      toRaw(preferences.value)
    );
    processMessage.value = "推荐方向已重新计算";
    ElMessage.success("推荐方向已根据新偏好更新");
  } catch (error) {
    processError.value = error instanceof Error ? error.message : String(error);
  } finally {
    isProcessing.value = false;
  }
};

const handleJumpToBoss = (keyword: string) => {
  const cleanKeyword = encodeURIComponent(keyword.trim());
  let targetUrl = `https://www.zhipin.com/web/geek/job?query=${cleanKeyword}`;
  window.open(targetUrl, "_blank", "noopener,noreferrer");
};

const handleSyncAutopilot = async () => {
  if (!profile.value?.communicationProfileSnippet) {
    ElMessage.warning("当前画像未生成沟通摘要");
    return;
  }
  try {
    await syncToBossAutopilot(profile.value.communicationProfileSnippet);
    ElMessage.success("已将最新技术经历摘要同步至 BOSS 自动沟通助手参考画像");
  } catch (error) {
    ElMessage.error(`同步失败：${error instanceof Error ? error.message : String(error)}`);
  }
};

const handleClearData = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要清空本地保存的简历、能力画像与匹配缓存吗？此操作无法撤销。",
      "清空本地求职数据",
      {
        confirmButtonText: "确定清空",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
    await clearCareerData();
    profile.value = null;
    directions.value = [];
    processStep.value = 0;
    processMessage.value = "";
    ElMessage.success("本地求职数据已安全清除");
  } catch {
    // cancelled
  }
};

const evidenceLabel = (type: EvidenceType) => {
  if (type === "projectProven") return "项目实证";
  if (type === "selfStated") return "简历自述";
  return "待核实";
};

const evidenceTagType = (type: EvidenceType) => {
  if (type === "projectProven") return "success";
  if (type === "selfStated") return "info";
  return "warning";
};

const formatDate = (isoStr: string) => {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return isoStr;
  }
};

onMounted(() => {
  refreshBridgeStatus();
});
</script>

<style scoped>
.career-page {
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 16px 40px;
  box-sizing: border-box;
}

.status-banner {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px 20px;
  background-color: #f8fafc;
  margin-bottom: 24px;
  transition: all 0.3s;
}

.status-banner.is-connected {
  border-color: #c2e7b0;
  background-color: #f0f9eb;
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.banner-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.banner-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.banner-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.banner-privacy-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #64748b;
  border-top: 1px dashed #e2e8f0;
  padding-top: 8px;
}

/* Gemini 配置面板 */
.gemini-config-section {
  margin-top: 14px;
}

.gemini-config-card {
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.config-card-header {
  margin-bottom: 14px;
}

.title-wrap {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.cfg-icon {
  margin-right: 6px;
  font-size: 16px;
}

.header-tips {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.config-form-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 768px) {
  .config-form-grid {
    grid-template-columns: 1fr;
  }
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.key-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.key-secret-input {
  flex: 1;
}

.lptff-reveal-btn {
  flex: 0 0 auto;
  border: 0;
  border-radius: 8px;
  padding: 7px 14px;
  background: #edf7f3;
  color: #17624f;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  line-height: 1.4;
  transition: all 0.2s ease;
}

.lptff-reveal-btn:hover {
  background: #def0e9;
  color: #124e3f;
}

.lptff-reveal-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.secret-state-badge {
  flex: 0 0 auto;
  font-size: 13px;
  color: #14a67e;
  font-weight: 500;
  white-space: nowrap;
}

.config-card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.actions-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.actions-right {
  display: flex;
  align-items: center;
}

.test-feedback-pill {
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 4px;
  line-height: 1.4;
}

.test-feedback-pill.is-success {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.test-feedback-pill.is-error {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.career-layout {
  display: grid;
  grid-template-columns: 460px 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 1024px) {
  .career-layout {
    grid-template-columns: 1fr;
  }
}

.career-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.header-sub {
  font-size: 12px;
  margin-left: 6px;
}

.not-connected-guide {
  padding: 8px 0;
}

.guide-actions {
  margin-top: 14px;
  text-align: right;
}

.guide-link {
  color: #409eff;
  font-size: 13px;
  text-decoration: none;
}

.guide-link:hover {
  text-decoration: underline;
}

.profile-meta-bar {
  background: #f8fafc;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 14px;
  font-size: 13px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.meta-row:last-child {
  margin-bottom: 0;
}

.drop-area {
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #fafbfc;
}

.drop-area:hover,
.drop-area.is-dragover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.drop-area.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.drop-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.drop-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
}

.drop-desc {
  font-size: 12px;
  color: #94a3b8;
}

.process-section {
  margin-top: 18px;
}

.process-msg {
  margin-top: 10px;
  font-size: 13px;
  color: #409eff;
  display: flex;
  align-items: center;
  gap: 6px;
}

.process-msg.is-error {
  color: #f56c6c;
}

.error-action-box {
  margin-top: 14px;
}

.retry-bar {
  margin-top: 8px;
  text-align: right;
}

.preferences-box {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}

.preferences-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 10px;
}

.pref-title {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.pref-tip {
  font-size: 11px;
  color: #94a3b8;
}

.pref-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.clear-data-bar {
  margin-top: 14px;
  text-align: center;
}

/* 能力画像 */
.profile-overview {
  display: flex;
  gap: 16px;
  background: #f8fafc;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 13px;
}

.profile-summary-text {
  font-size: 13px;
  line-height: 1.6;
  color: #334155;
  margin-bottom: 14px;
}

.evidence-collapse {
  border-top: none;
}

.capabilities-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.capability-item {
  border: 1px solid #e2e8f0;
  border-left: 3px solid #94a3b8;
  border-radius: 6px;
  padding: 8px 12px;
  background-color: #fafbfc;
}

.capability-item.projectProven {
  border-left-color: #67c23a;
  background-color: #f6ffed;
}

.capability-item.selfStated {
  border-left-color: #409eff;
}

.cap-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.cap-quote {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
  background: rgba(0, 0, 0, 0.02);
  padding: 4px 8px;
  border-radius: 4px;
}

.experiences-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.experience-card {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 14px;
  background-color: #ffffff;
}

.exp-title-row {
  font-size: 14px;
  margin-bottom: 6px;
}

.exp-tech-row {
  margin-bottom: 6px;
}

.exp-resp-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #475569;
  line-height: 1.6;
}

.exp-quote {
  margin-top: 6px;
  font-size: 11px;
}

.unknowns-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.6;
}

/* 推荐方向 */
.empty-direction-hint {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
}

.direction-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.direction-card {
  border: 1px solid #dcdfe6;
  border-left: 4px solid #67c23a;
  border-radius: 8px;
  padding: 16px;
  background-color: #ffffff;
  transition: box-shadow 0.2s;
}

.direction-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.direction-card.is-adjacent {
  border-left-color: #e6a23c;
}

.dir-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dir-title {
  margin: 0;
  font-size: 16px;
  color: #1e293b;
}

.dir-reason {
  font-size: 13px;
  line-height: 1.6;
  color: #334155;
  margin-bottom: 4px;
}

.dir-basis {
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 10px;
}

.dir-verify-box {
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.verify-title {
  color: #64748b;
  font-weight: 500;
}

.supporting-jobs-box {
  background: #fafbfc;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.supporting-jobs-head {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.citation-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.citation-card {
  font-size: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 6px 10px;
}

.citation-meta {
  margin-bottom: 4px;
}

.citation-quote {
  margin: 0;
  padding-left: 8px;
  border-left: 2px solid #cbd5e1;
  color: #64748b;
  font-style: italic;
}

.dir-action-footer {
  text-align: right;
  margin-top: 12px;
}

/* 市场快照 */
.snapshot-summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.public-jobs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.public-job-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  background-color: #fafbfc;
}

.public-job-item:hover {
  background-color: #f1f5f9;
}

.job-item-main {
  flex: 1;
}

.job-title-line {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.job-link {
  color: #1e293b;
  text-decoration: none;
  font-size: 14px;
}

.job-link:hover {
  color: #409eff;
}

.job-company-line {
  font-size: 12px;
  margin-bottom: 4px;
}

.job-desc-line {
  font-size: 11px;
  margin-bottom: 6px;
}

.job-skills-line {
  display: flex;
  gap: 4px;
}

/* 工具类 */
.mt-4 { margin-top: 16px; }
.mr-1 { margin-right: 4px; }
.ml-2 { margin-left: 8px; }
.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }
.text-muted { color: #94a3b8; }
.text-primary { color: #409eff; }
.text-mono { font-family: monospace; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
</style>
