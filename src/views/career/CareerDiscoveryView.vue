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

    <!-- 顶部四步操作流程与决策导航栏 -->
    <nav class="workflow-stepper-bar" aria-label="求职决策操作流程">
      <div
        class="stepper-item"
        :class="{ 'is-completed': !!profile, 'is-active': !profile }"
        @click="scrollToStep('step-1-resume')"
      >
        <div class="step-num">1</div>
        <div class="step-info">
          <div class="step-title">
            <span>简历管理与分析</span>
            <el-tag size="small" :type="profile ? 'success' : 'primary'" effect="plain" class="step-status-tag">
              {{ profile ? '已就绪 (v' + profile.version + ')' : '待上传' }}
            </el-tag>
          </div>
          <div class="step-desc">
            {{ profile ? profile.fileName : '本地解析 · 隐私优先' }}
          </div>
        </div>
      </div>

      <div class="stepper-arrow">➔</div>

      <div
        class="stepper-item is-core-step"
        :class="{ 'is-completed': directions.length > 0, 'is-active': !!profile && directions.length > 0 }"
        @click="scrollToStep('step-2-directions')"
      >
        <div class="step-num">2</div>
        <div class="step-info">
          <div class="step-title">
            <span>推荐搜索方向</span>
            <span class="core-step-badge">核心交互</span>
            <el-tag size="small" :type="directions.length ? 'success' : 'info'" effect="plain" class="step-status-tag">
              {{ directions.length ? directions.length + ' 条推荐' : '待生成' }}
            </el-tag>
          </div>
          <div class="step-desc">智能匹配 · 直达 BOSS 搜索</div>
        </div>
      </div>

      <div class="stepper-arrow">➔</div>

      <div
        class="stepper-item"
        :class="{ 'is-completed': !!profile }"
        @click="scrollToStep('step-3-evidence')"
      >
        <div class="step-num">3</div>
        <div class="step-info">
          <div class="step-title">
            <span>能力画像与佐证</span>
            <el-tag size="small" :type="profile ? 'primary' : 'info'" effect="plain" class="step-status-tag">
              {{ profile ? profile.capabilities.length + ' 项实证' : '待核验' }}
            </el-tag>
          </div>
          <div class="step-desc">原文证据 · 经历溯源</div>
        </div>
      </div>

      <div class="stepper-arrow">➔</div>

      <div
        class="stepper-item is-completed"
        @click="scrollToStep('step-4-snapshot')"
      >
        <div class="step-num">4</div>
        <div class="step-info">
          <div class="step-title">
            <span>公开招聘需求快照</span>
            <el-tag size="small" type="warning" effect="plain" class="step-status-tag">
              {{ publicJobs.length }} 条样本
            </el-tag>
          </div>
          <div class="step-desc">25 城探针 · 多维筛选</div>
        </div>
      </div>
    </nav>

    <!-- 阶段一：核心交互与决策区 (步骤 1 简历管理 ➔ 步骤 2 推荐搜索方向) -->
    <section class="workflow-zone zone-interactive">
      <div class="zone-badge-bar">
        <div class="badge-title-wrap">
          <span class="badge-pill core-action">🎯 核心交互与决策区</span>
          <span class="zone-heading">步骤 1 · 简历管理与分析 ➔ 步骤 2 · 推荐搜索方向</span>
        </div>
        <span class="zone-hint text-muted">
          优先聚焦核心输入与行动产出：上传简历或微调偏好后，即刻在此完成求职方向决策并一键跳转 BOSS 直聘精准检索
        </span>
      </div>

      <div class="career-layout">
        <!-- 步骤 1：简历管理与分析 -->
        <div id="step-1-resume" class="career-col left-col">
          <el-card shadow="never" class="career-card interactive-card">
            <template #header>
              <div class="card-header">
                <div class="title-with-step">
                  <el-tag size="small" type="primary" effect="dark" class="step-num-tag">步骤 1 · 输入</el-tag>
                  <span class="header-title">📄 简历管理与分析</span>
                </div>
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
            <!-- 已连接扩展：上传与处理区 -->
            <div v-else class="upload-zone">
              <!-- 一级层级：当前已加载简历核心状态卡片 -->
              <div v-if="profile" class="active-profile-card">
                <div class="active-profile-header">
                  <div class="file-icon">📄</div>
                  <div class="file-main">
                    <div class="file-title-row">
                      <span class="file-name font-semibold">{{ profile.fileName }}</span>
                      <el-tag size="small" type="success" effect="light">已生效</el-tag>
                    </div>
                    <div class="file-sub text-muted">
                      <span>更新时间：{{ formatDate(profile.updatedAt) }}</span>
                      <span class="text-mono ml-2">指纹: {{ profile.fingerprint.slice(0, 10) }}...</span>
                    </div>
                  </div>
                </div>

                <div class="active-profile-actions">
                  <el-button
                    size="small"
                    type="primary"
                    :loading="isProcessing"
                    @click="retryCurrentTask"
                  >
                    🔄 重新分析
                  </el-button>
                  <el-button
                    size="small"
                    :type="showUploadDropzone ? 'primary' : 'default'"
                    plain
                    @click="showUploadDropzone = !showUploadDropzone"
                  >
                    {{ showUploadDropzone ? "收起更换 ▴" : "更换文件 ▾" }}
                  </el-button>
                  <el-button
                    size="small"
                    :type="showPreferenceEdit ? 'primary' : 'default'"
                    plain
                    @click="showPreferenceEdit = !showPreferenceEdit"
                  >
                    {{ showPreferenceEdit ? "收起意向 ▴" : "🎯 意向偏好 ▾" }}
                  </el-button>
                </div>
              </div>

              <!-- 二级层级：文件选择与拖拽区（无简历时常驻，有简历时点击「更换文件」展开） -->
              <el-collapse-transition>
                <div
                  v-show="!profile || showUploadDropzone"
                  class="drop-area"
                  :class="{ 'is-dragover': isDragOver, 'is-disabled': isProcessing, 'mt-3': !!profile }"
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
                    {{ profile ? "点击或拖拽新文件替换当前简历" : "点击或拖拽上传简历 (DOCX / PDF)" }}
                  </div>
                  <div class="drop-desc">
                    支持 DOCX 及包含文字图层的 PDF 简历（纯图片扫描件暂不支持）
                  </div>
                </div>
              </el-collapse-transition>

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

              <!-- 一级层级：意向偏好摘要栏；二级层级：展开表单编辑 -->
              <div class="preferences-box">
                <div class="preferences-summary-row" @click="showPreferenceEdit = !showPreferenceEdit">
                  <div class="pref-summary-left">
                    <span class="pref-icon">🎯</span>
                    <span class="pref-summary-title font-medium">求职意向偏好：</span>
                    <el-tag size="small" type="info" effect="plain">
                      {{ preferences.city ? preferences.city : '城市不限' }}
                    </el-tag>
                    <el-tag size="small" type="info" effect="plain" class="ml-1">
                      {{ preferences.salaryExpectation ? preferences.salaryExpectation : '薪资不限' }}
                    </el-tag>
                  </div>
                  <el-button size="small" text type="primary">
                    {{ showPreferenceEdit ? '收起 ▴' : '编辑 ▾' }}
                  </el-button>
                </div>

                <el-collapse-transition>
                  <div v-show="!profile || showPreferenceEdit" class="preferences-edit-body">
                    <div class="pref-tip text-muted">
                      未填写的条件保持未知，不强制排查，亦不默认作为排除项
                    </div>
                    <div class="pref-inputs mt-2">
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
                </el-collapse-transition>
              </div>

              <!-- 清除本地数据操作 -->
              <div v-if="profile" class="clear-data-bar">
                <el-button size="small" text type="danger" @click="handleClearData">
                  清空本地简历与画像数据
                </el-button>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 步骤 2：推荐搜索方向（核心决策） -->
        <div id="step-2-directions" class="career-col right-col">
          <el-card shadow="never" class="career-card interactive-card">
            <template #header>
              <div class="card-header">
                <div class="title-with-step">
                  <el-tag size="small" type="success" effect="dark" class="step-num-tag">步骤 2 · 核心决策</el-tag>
                  <span class="header-title">🚀 推荐搜索方向</span>
                  <span class="core-step-badge">★ 核心行动交互</span>
                  <span class="header-sub text-muted">（点击直接携关键词前往 BOSS 直聘精准搜索）</span>
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
              <div class="empty-text font-medium">等待简历输入以生成匹配方向</div>
              <div class="empty-sub text-muted">
                请在左侧「步骤 1」上传简历或补充求职偏好，Gemini 将在此立即呈现为你定制的技术研发搜索方向与 BOSS 直聘精准检索入口。
              </div>
              <div class="empty-actions mt-3">
                <el-button type="primary" size="small" @click="triggerFileInput">
                  📤 立即上传简历
                </el-button>
              </div>
            </div>

            <div v-else-if="filteredDirections.length === 0" class="empty-direction-hint">
              <div class="empty-text">当前分类下暂无推荐方向</div>
            </div>

            <!-- 方向卡片列表（一级层级：核心决策与行动；二级层级：展开市场佐证与依据） -->
            <div v-else class="direction-cards-grid">
              <div
                v-for="dir in filteredDirections"
                :key="dir.id"
                class="direction-card"
                :class="{ 'is-adjacent': dir.isAdjacent }"
              >
                <!-- 一级决策主视图：方向、适合理由、证据摘要与 BOSS 搜索行动 -->
                <div class="direction-card-primary">
                  <div class="dir-title-row">
                    <div class="dir-title-left">
                      <h3 class="dir-title font-semibold">{{ dir.title }}</h3>
                      <el-tag size="small" :type="dir.isAdjacent ? 'warning' : 'success'" class="ml-2">
                        {{ dir.isAdjacent ? "相邻探索" : "市场支持" }}
                      </el-tag>
                    </div>
                    <el-tag size="small" type="info" effect="plain" class="dir-keyword-tag">
                      搜索词: {{ dir.bossSearchKeyword }}
                    </el-tag>
                  </div>

                  <div class="dir-fit-highlight">
                    <span class="label font-medium">🎯 为什么适合：</span>
                    <span class="text">{{ dir.fitReason }}</span>
                  </div>

                  <!-- 关键佐证与核查聚合指示条 -->
                  <div class="dir-meta-pills-row">
                    <span class="meta-pill">
                      📊 市场岗位佐证: <strong>{{ dir.supportingJobs ? dir.supportingJobs.length : 0 }}</strong> 个
                    </span>
                    <span v-if="dir.conditionsToVerify && dir.conditionsToVerify.length" class="meta-pill">
                      ❓ 待核查条件: <strong>{{ dir.conditionsToVerify.length }}</strong> 项
                    </span>
                  </div>

                  <!-- 决策操作栏：左侧展开佐证，右侧一键去 BOSS 搜索 -->
                  <div class="dir-action-bar">
                    <el-button
                      size="small"
                      text
                      type="primary"
                      @click="toggleDirectionEvidence(dir.id)"
                    >
                      {{ expandedDirectionEvidence[dir.id] ? "收起依据与出处佐证 ▴" : `展开依据与出处佐证 (${dir.supportingJobs ? dir.supportingJobs.length : 0}) ▾` }}
                    </el-button>

                    <el-button
                      type="primary"
                      size="default"
                      class="boss-search-btn"
                      @click="handleJumpToBoss(dir.bossSearchKeyword)"
                    >
                      前往 BOSS 搜索此方向 ↗
                    </el-button>
                  </div>
                </div>

                <!-- 二级详情视图：可折叠的市场依据、待核查项与逐条真实岗位佐证 -->
                <el-collapse-transition>
                  <div v-show="expandedDirectionEvidence[dir.id]" class="direction-card-secondary">
                    <!-- 市场依据 -->
                    <div class="dir-basis-box">
                      <div class="basis-title font-medium">📈 市场依据：</div>
                      <div class="basis-text text-muted">{{ dir.marketBasis }}</div>
                    </div>

                    <!-- 沟通待核实条件 -->
                    <div v-if="dir.conditionsToVerify && dir.conditionsToVerify.length" class="dir-verify-box mt-2">
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

                    <!-- 对应市场岗位佐证与原文引用 -->
                    <div v-if="dir.supportingJobs && dir.supportingJobs.length" class="supporting-jobs-box mt-2">
                      <div class="supporting-jobs-head">
                        <span>📊 市场真实岗位匹配佐证（{{ dir.supportingJobs.length }} 个）：</span>
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
                  </div>
                </el-collapse-transition>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </section>

    <!-- 阶段二：证据核验与市场底座 (步骤 3 能力画像 ➔ 步骤 4 招聘需求快照) -->
    <section class="workflow-zone zone-grounding mt-4">
      <div class="zone-badge-bar">
        <div class="badge-title-wrap">
          <span class="badge-pill neutral">🔍 证据核验与市场底座</span>
          <span class="zone-heading">步骤 3 · 能力画像与来源证据 ➔ 步骤 4 · 公开招聘需求快照</span>
        </div>
        <span class="zone-hint text-muted">
          深入下钻能力实证原文与全网热门技术研发岗位宏观需求探针，为求职决策提供客观、可溯源的底座支撑
        </span>
      </div>

      <div class="career-layout">
        <!-- 步骤 3：提取的能力画像与来源证据 -->
        <div id="step-3-evidence" class="career-col left-col">
          <el-card shadow="never" class="career-card grounding-card">
            <template #header>
              <div class="card-header">
                <div class="title-with-step">
                  <el-tag size="small" type="info" effect="plain" class="step-num-tag">步骤 3 · 原文佐证</el-tag>
                  <span class="header-title">🧠 提取的能力画像与来源证据</span>
                </div>
                <el-button v-if="profile" size="small" type="success" plain @click="handleSyncAutopilot">
                  同步至 BOSS 沟通助手
                </el-button>
              </div>
            </template>

            <template v-if="profile">
              <!-- 一级层级：基本画像度量与总述摘要 -->
              <div class="profile-overview-strip">
                <div class="overview-metric">
                  <span class="label">经验年限</span>
                  <span class="value font-semibold">{{ profile.workYears }}</span>
                </div>
                <div class="overview-metric">
                  <span class="label">学历背景</span>
                  <span class="value">{{ profile.education }}</span>
                </div>
                <div class="overview-metric flex-1">
                  <span class="label">求职意向</span>
                  <span class="value font-semibold text-primary">{{ profile.targetIntention }}</span>
                </div>
              </div>

              <!-- 画像总述 -->
              <div class="profile-summary-box">
                <div class="summary-label font-medium">📋 画像总述：</div>
                <div class="summary-content text-muted">{{ profile.summary }}</div>
              </div>

              <!-- 一级层级：实证技能全景标签云（实证 vs 自述） -->
              <div class="skills-matrix-bar">
                <div class="matrix-title-row">
                  <span class="matrix-title font-medium">🧩 技能图谱与实证概览</span>
                  <span class="text-muted" style="font-size: 11px;">
                    实证 {{ projectProvenCaps.length }} 项 · 自述 {{ selfStatedCaps.length }} 项
                  </span>
                </div>
                <div class="skills-tags-cluster">
                  <el-tag
                    v-for="cap in projectProvenCaps"
                    :key="cap.skillName"
                    size="small"
                    type="success"
                    effect="light"
                    class="skill-pill proven"
                    @click="activeEvidenceTab = 'capabilities'"
                  >
                    ✓ {{ cap.skillName }} (实证)
                  </el-tag>
                  <el-tag
                    v-for="cap in selfStatedCaps"
                    :key="cap.skillName"
                    size="small"
                    type="info"
                    effect="plain"
                    class="skill-pill stated"
                    @click="activeEvidenceTab = 'capabilities'"
                  >
                    {{ cap.skillName }}
                  </el-tag>
                </div>
              </div>

              <!-- 二级层级：分标签页下钻核查（技术实证 / 经历核查 / 未知项） -->
              <div class="evidence-tabs-section mt-3">
                <el-tabs v-model="activeEvidenceTab" class="evidence-segmented-tabs">
                  <!-- 标签页 1：技术实证列表 -->
                  <el-tab-pane :label="`🔍 技术实证 (${profile.capabilities.length})`" name="capabilities">
                    <div class="capabilities-compact-list">
                      <div
                        v-for="(cap, idx) in profile.capabilities"
                        :key="idx"
                        class="cap-compact-item"
                        :class="cap.evidenceType"
                      >
                        <div class="cap-header-line">
                          <span class="cap-name font-medium">{{ cap.skillName }}</span>
                          <el-tag size="small" :type="evidenceTagType(cap.evidenceType)">
                            {{ evidenceLabel(cap.evidenceType) }}
                          </el-tag>
                          <span class="cap-cat text-muted">[{{ cap.category }}]</span>
                        </div>
                        <div v-if="cap.quote" class="cap-quote-box text-muted">
                          “{{ cap.quote }}”
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>

                  <!-- 标签页 2：经历核验时间线 -->
                  <el-tab-pane :label="`💼 经历核验 (${profile.experiences.length})`" name="experiences">
                    <div class="experiences-compact-list">
                      <div
                        v-for="(exp, idx) in profile.experiences"
                        :key="idx"
                        class="experience-compact-card"
                      >
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
                  </el-tab-pane>

                  <!-- 标签页 3：未知信息与待核实项 -->
                  <el-tab-pane
                    :label="`❓ 未知项 (${profile.unknowns ? profile.unknowns.length : 0})`"
                    name="unknowns"
                  >
                    <div v-if="profile.unknowns && profile.unknowns.length" class="unknowns-box">
                      <ul class="unknowns-list">
                        <li v-for="(item, idx) in profile.unknowns" :key="idx" class="text-muted">
                          {{ item }}
                        </li>
                      </ul>
                    </div>
                    <div v-else class="text-muted p-2" style="font-size: 12px;">
                      简历信息完整，暂无待排查的未知盲区。
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </template>

            <!-- 尚未生成画像的占位引导 -->
            <div v-else class="empty-grounding-hint">
              <div class="empty-icon">📑</div>
              <div class="empty-title font-medium">尚未生成能力画像</div>
              <div class="empty-desc text-muted">
                在上方「步骤 1」上传简历后，Gemini 将在此展示工作年限、学历、项目实证技术栈及出处原文佐证，并支持一键同步至自动沟通助手。
              </div>
            </div>
          </el-card>
        </div>

        <!-- 步骤 4：公开招聘需求快照（热门技术研发岗位） -->
        <div id="step-4-snapshot" class="career-col right-col">
          <el-card shadow="never" class="career-card grounding-card">
            <template #header>
              <div class="card-header snapshot-header-wrap">
                <div class="header-left">
                  <div class="title-row">
                    <el-tag size="small" type="warning" effect="plain" class="step-num-tag">步骤 4 · 市场底座</el-tag>
                    <span class="header-title">🌐 公开招聘需求快照（热门技术研发岗位）</span>
                    <el-tag size="small" type="primary" effect="plain" class="ml-2">
                      共 {{ publicJobs.length }} 条去重样本
                    </el-tag>
                    <el-tag size="small" type="info" class="ml-2">
                      25 城公开落地页探针
                    </el-tag>
                  </div>
                  <div class="header-sub text-muted">
                    数据来源：BOSS 直聘 25 城免登录公开 SEO 落地页 · GitHub Actions 每日 06:17 自动抓取研发需求样本并严格去重
                  </div>
                </div>
                <div class="header-actions">
                  <el-button
                    size="small"
                    :type="showSnapshotRules ? 'primary' : 'default'"
                    plain
                    @click="showSnapshotRules = !showSnapshotRules"
                  >
                    {{ showSnapshotRules ? "收起采集规则 ▴" : "查看采集与去重规则 ▾" }}
                  </el-button>
                </div>
              </div>
            </template>

            <!-- 规则透明化展开面板 -->
            <el-collapse-transition>
              <div v-show="showSnapshotRules" class="snapshot-rules-panel">
                <div class="rules-panel-header">
                  <span class="rules-title">📐 底层真实采集、研发过滤去重与智能匹配规则白皮书</span>
                  <span class="rules-version text-muted text-mono">CRAWLER: zhipin.py · PIPELINE: ci.yml · SCHEDULE: 06:17 UTC+8</span>
                </div>
                
                <div class="rules-grid">
                  <div class="rule-box">
                    <div class="rule-box-title">1. 采样来源与公开页特性</div>
                    <div class="rule-box-content">
                      <p>抓取目标为 BOSS 直聘 <strong>25 个核心城市未登录公开静态落地页</strong>（<code>/beijing/</code>、<code>/shanghai/</code> 等，非站内全量搜索库）。未登录页面仅静态露出极少数名企推荐卡片（单城仅 0~3 条公开岗位），本快照如实呈现公开外显情况，不人为夸大市场热度。</p>
                      <div class="rule-tag-list mt-1">
                        <span class="tag-label">覆盖 25 城：</span>
                        <el-tag v-for="c in SNAPSHOT_TARGET_CITIES" :key="c" size="small" type="info" class="mr-1 mb-1">
                          {{ c }}
                        </el-tag>
                      </div>
                    </div>
                  </div>

                  <div class="rule-box">
                    <div class="rule-box-title">2. 热门技术研发岗位采样与白名单</div>
                    <div class="rule-box-content">
                      <p>爬虫以<strong>市场热门技术研发需求</strong>为核心目标（过滤非技术职位），白名单覆盖前端、后端、移动端、AI/大模型、全栈、数据工程与云原生等核心研发类别：</p>
                      <div class="rule-tag-list mt-1">
                        <el-tag v-for="m in SNAPSHOT_ROLE_MARKERS" :key="m" size="small" type="warning" effect="plain" class="mr-1 mb-1">
                          {{ m }}
                        </el-tag>
                      </div>
                      <p class="mt-1 text-muted" style="font-size: 11px;">
                        💡 <strong>职责分工</strong>：快照负责客观采集全网技术研发需求底池；<strong>具体求职搜索方向由上方 Gemini 结合候选人简历画像智能匹配推荐</strong>（无论候选人是前端、后端、AI、全栈均可匹配）。
                      </p>
                    </div>
                  </div>

                  <div class="rule-box">
                    <div class="rule-box-title">3. 去重机制与排序规则</div>
                    <div class="rule-box-content">
                      <p>• <strong>跨城市强去重</strong>：使用职位详情页唯一链接 <code>job_detail</code> 作为主键进行全局去重，多城重复展示仅保留一条。</p>
                      <p>• <strong>发布时间排序</strong>：依据页面微数据 <code>upDate / dateModified</code> 时间戳倒序排列，真实反映公开发布先后，并编排 <code>jobNum</code> 索引。</p>
                    </div>
                  </div>

                  <div class="rule-box">
                    <div class="rule-box-title">4. 真实性保障与 Gemini 智能匹配</div>
                    <div class="rule-box-content">
                      <p>• <strong>真实薪资口径</strong>：公开落地页常对薪资做防爬遮蔽，系统恪守真实原则不捏造，如实标注“薪资以 Boss 职位页为准”。</p>
                      <p>• <strong>Preserved 熔断保活</strong>：若 CI 采集遇反爬中断或有效数 &lt; 3 条，自动触发保护保留上一版稳定快照，绝不破坏前端。</p>
                      <p>• <strong>Gemini 简历驱动推荐</strong>：用户上传简历后，Gemini 提取个人结构化技术能力，对照本快照完成硬校验，生成精准的“市场支持方向”与“相邻探索方向”。</p>
                    </div>
                  </div>
                </div>
              </div>
            </el-collapse-transition>

            <!-- 数据概览与多维筛选工具栏（分层优化：精炼高频城市与技术栈，支持更多展开） -->
            <div class="snapshot-toolbar">
              <div class="snapshot-summary-bar">
                <div class="summary-left">
                  <span class="snapshot-desc">
                    呈现 <strong>{{ filteredPublicJobs.length }}</strong> / {{ publicJobs.length }} 条样本 · 
                    覆盖 <strong>{{ distinctCitiesInSnapshot.length }}</strong> 个城市 · 
                    涉及 <strong>{{ distinctCompaniesCount }}</strong> 家企业
                  </span>
                </div>
                <div class="summary-right text-muted">
                  <span v-if="snapshotLastTime" class="snapshot-time">
                    快照更新时间：{{ snapshotLastTime }}
                  </span>
                </div>
              </div>

              <div class="filter-controls-row">
                <div class="filter-search-box">
                  <el-input
                    v-model="snapshotSearchQuery"
                    placeholder="搜索职位名、企业、技能或工作区域..."
                    size="small"
                    clearable
                  >
                    <template #prefix>🔍</template>
                  </el-input>
                </div>

                <!-- 城市筛选：显示全部 + 前 5 城市，点击「更多城市」展开剩余 -->
                <div class="filter-pills-row">
                  <span class="filter-label">城市筛选：</span>
                  <el-button
                    size="small"
                    :type="snapshotSelectedCity === 'all' ? 'primary' : 'default'"
                    :plain="snapshotSelectedCity !== 'all'"
                    @click="snapshotSelectedCity = 'all'"
                  >
                    全部 ({{ publicJobs.length }})
                  </el-button>
                  <el-button
                    v-for="item in topCitiesInSnapshot"
                    :key="item.city"
                    size="small"
                    :type="snapshotSelectedCity === item.city ? 'primary' : 'default'"
                    :plain="snapshotSelectedCity !== item.city"
                    @click="snapshotSelectedCity = item.city"
                  >
                    {{ item.city }} ({{ item.count }})
                  </el-button>
                  <template v-if="showMoreCities">
                    <el-button
                      v-for="item in moreCitiesInSnapshot"
                      :key="item.city"
                      size="small"
                      :type="snapshotSelectedCity === item.city ? 'primary' : 'default'"
                      :plain="snapshotSelectedCity !== item.city"
                      @click="snapshotSelectedCity = item.city"
                    >
                      {{ item.city }} ({{ item.count }})
                    </el-button>
                  </template>
                  <el-button
                    v-if="hasMoreCities"
                    size="small"
                    text
                    type="primary"
                    @click="showMoreCities = !showMoreCities"
                  >
                    {{ showMoreCities ? '收起城市 ▴' : `更多 (${moreCitiesInSnapshot.length}) ▾` }}
                  </el-button>
                </div>

                <!-- 技术标签：显示全部 + 前 6 核心技术，点击「更多技术」展开剩余 -->
                <div class="filter-pills-row">
                  <span class="filter-label">技术标签：</span>
                  <el-button
                    size="small"
                    :type="snapshotSelectedSkill === 'all' ? 'primary' : 'default'"
                    :plain="snapshotSelectedSkill !== 'all'"
                    @click="snapshotSelectedSkill = 'all'"
                  >
                    全部
                  </el-button>
                  <el-button
                    v-for="item in topSkillsInSnapshot"
                    :key="item.skill"
                    size="small"
                    :type="snapshotSelectedSkill === item.skill ? 'primary' : 'default'"
                    :plain="snapshotSelectedSkill !== item.skill"
                    @click="snapshotSelectedSkill = item.skill"
                  >
                    {{ item.skill }} ({{ item.count }})
                  </el-button>
                  <template v-if="showMoreSkills">
                    <el-button
                      v-for="item in moreSkillsInSnapshot"
                      :key="item.skill"
                      size="small"
                      :type="snapshotSelectedSkill === item.skill ? 'primary' : 'default'"
                      :plain="snapshotSelectedSkill !== item.skill"
                      @click="snapshotSelectedSkill = item.skill"
                    >
                      {{ item.skill }} ({{ item.count }})
                    </el-button>
                  </template>
                  <el-button
                    v-if="hasMoreSkills"
                    size="small"
                    text
                    type="primary"
                    @click="showMoreSkills = !showMoreSkills"
                  >
                    {{ showMoreSkills ? '收起技术 ▴' : `更多 (${moreSkillsInSnapshot.length}) ▾` }}
                  </el-button>

                  <el-button
                    v-if="snapshotSearchQuery || snapshotSelectedCity !== 'all' || snapshotSelectedSkill !== 'all'"
                    size="small"
                    type="info"
                    text
                    @click="resetSnapshotFilters"
                  >
                    重置筛选
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 职位卡片列表（一级层级：核心岗位摘要与 BOSS 跳转；二级层级：点击展开详细标签与落地页源） -->
            <div v-if="filteredPublicJobs.length" class="public-jobs-list">
              <div
                v-for="job in displayedPublicJobs"
                :key="job.job_detail"
                class="public-job-item"
              >
                <div class="job-item-main">
                  <div class="job-title-line">
                    <span class="job-num-badge">#{{ job.jobNum }}</span>
                    <a :href="job.job_detail" target="_blank" class="job-link font-semibold">
                      {{ job.bossTitle }}
                    </a>
                    <el-tag size="small" type="success" effect="plain" class="job-city-tag">
                      {{ formatCityName(job) }}
                    </el-tag>
                    <span class="job-salary text-primary font-medium">{{ job.salaryDesc }}</span>
                  </div>
                  
                  <div class="job-company-line text-muted">
                    <span class="company-name font-medium">{{ job.brandName }}</span>
                    <span v-if="job.brandIndustry"> · {{ job.brandIndustry }}</span>
                    <span class="ml-2 font-mono" style="font-size: 11px;">
                      {{ (job.skills || []).slice(0, 3).join(" / ") }}
                    </span>
                  </div>

                  <!-- 可折叠的完整标签与落地页溯源 -->
                  <el-collapse-transition>
                    <div v-show="expandedJobDetails[job.job_detail]" class="job-details-expand-box">
                      <div v-if="job.jobDesc" class="job-desc-tags-line">
                        <span
                          v-for="(chip, chipIdx) in parseJobDescChips(job.jobDesc)"
                          :key="chipIdx"
                          class="desc-chip mr-1"
                        >
                          {{ chip }}
                        </span>
                      </div>
                      <div class="job-skills-line">
                        <el-tag v-for="sk in job.skills" :key="sk" size="small" class="mr-1">
                          {{ sk }}
                        </el-tag>
                      </div>
                      <div class="source-link mt-1">来源落地页: {{ job.sourcePage }}</div>
                    </div>
                  </el-collapse-transition>
                </div>

                <div class="job-item-action">
                  <el-button
                    size="small"
                    text
                    type="info"
                    @click="toggleJobDetail(job.job_detail)"
                  >
                    {{ expandedJobDetails[job.job_detail] ? '收起详情 ▴' : '详情 ▾' }}
                  </el-button>
                  <el-button
                    type="primary"
                    size="small"
                    plain
                    @click="handleJumpToBoss(job.bossTitle)"
                  >
                    前往 BOSS 搜相似 ↗
                  </el-button>
                </div>
              </div>

              <!-- 渐进展示更多按钮 -->
              <div v-if="filteredPublicJobs.length > 5" class="snapshot-pagination-bar">
                <el-button
                  size="small"
                  type="primary"
                  plain
                  class="load-more-btn"
                  @click="toggleSnapshotLimit"
                >
                  {{ hasMorePublicJobs ? `查看更多样本（当前已展示 ${displayedPublicJobs.length} / ${filteredPublicJobs.length} 条）▾` : '收起样本（显示前 5 条）▴' }}
                </el-button>
              </div>
            </div>

            <!-- 筛选无结果空状态 -->
            <div v-else class="snapshot-empty-wrap">
              <el-empty description="未找到符合当前筛选条件的公开招聘样本">
                <el-button type="primary" size="small" @click="resetSnapshotFilters">
                  清空筛选条件
                </el-button>
              </el-empty>
            </div>
          </el-card>
        </div>
      </div>
    </section>
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

// 模块 1：简历上传展开与意向偏好折叠控制
const showUploadDropzone = ref(false);
const showPreferenceEdit = ref(false);

// 模块 2：推荐方向展开证据与市场岗位控制
const expandedDirectionEvidence = ref<Record<string, boolean>>({});
const toggleDirectionEvidence = (dirId: string) => {
  expandedDirectionEvidence.value[dirId] = !expandedDirectionEvidence.value[dirId];
};

// 模块 3：能力画像分层标签页与技能实证控制
const activeEvidenceTab = ref<"capabilities" | "experiences" | "unknowns">("capabilities");
const projectProvenCaps = computed(() =>
  profile.value?.capabilities.filter((c) => c.evidenceType === "projectProven") || []
);
const selfStatedCaps = computed(() =>
  profile.value?.capabilities.filter((c) => c.evidenceType !== "projectProven") || []
);

// 模块 4：快照筛选紧凑折叠与列表渐进展示
const showMoreCities = ref(false);
const showMoreSkills = ref(false);
const snapshotDisplayLimit = ref(5);
const expandedJobDetails = ref<Record<string, boolean>>({});
const toggleJobDetail = (jobId: string) => {
  expandedJobDetails.value[jobId] = !expandedJobDetails.value[jobId];
};

// 25 目标城市与 15 岗位关键词（用于白皮书展示）
const SNAPSHOT_TARGET_CITIES = [
  "北京", "上海", "广州", "深圳", "杭州",
  "成都", "武汉", "南京", "苏州", "郑州",
  "青岛", "天津", "西安", "厦门", "长沙",
  "合肥", "重庆", "济南", "佛山", "东莞",
  "昆明", "南昌", "石家庄", "宁波", "福州",
];

const SNAPSHOT_ROLE_MARKERS = [
  "前端开发", "React / Vue", "JavaScript / TypeScript", "Android / iOS",
  "鸿蒙开发", "Flutter", "Java 后端", "Go / Golang", "Python", "C++",
  "微服务 / 云原生", "架构设计", "AI / 大模型", "算法工程师", "机器学习",
  "数据开发 / 大数据", "全栈工程师", "测试开发", "DevOps / SRE", "嵌入式"
];

const CITY_NAME_MAP: Record<string, string> = {
  beijing: "北京",
  shanghai: "上海",
  tianjin: "天津",
  xian: "西安",
  suzhou: "苏州",
  wuhan: "武汉",
  nanjing: "南京",
  zhengzhou: "郑州",
  qingdao: "青岛",
  hangzhou: "杭州",
  xiamen: "厦门",
  changsha: "长沙",
  chengdu: "成都",
  guangzhou: "广州",
  shenzhen: "深圳",
  hefei: "合肥",
  chongqing: "重庆",
  jinan: "济南",
  foshan: "佛山",
  dongguan: "东莞",
  kunming: "昆明",
  nanchang: "南昌",
  shijiazhuang: "石家庄",
  ningbo: "宁波",
  fuzhou: "福州",
};

// 市场快照多维筛选与规则面板控制状态
const showSnapshotRules = ref(false);
const snapshotSearchQuery = ref("");
const snapshotSelectedCity = ref("all");
const snapshotSelectedSkill = ref("all");

const formatCityName = (job: MarketJobItem): string => {
  if (job.cityName) return job.cityName;
  if (!job.sourcePage) return "全网";
  const slug = job.sourcePage.replace(/\//g, "").toLowerCase();
  return CITY_NAME_MAP[slug] || slug;
};

const parseJobDescChips = (desc: string): string[] => {
  if (!desc) return [];
  return desc
    .split("·")
    .map((s) => s.trim())
    .filter((s) => Boolean(s));
};

const distinctCitiesInSnapshot = computed(() => {
  const map = new Map<string, number>();
  for (const job of publicJobs.value) {
    const city = formatCityName(job);
    map.set(city, (map.get(city) || 0) + 1);
  }
  return Array.from(map.entries()).map(([city, count]) => ({ city, count }));
});

const topCitiesInSnapshot = computed(() => distinctCitiesInSnapshot.value.slice(0, 5));
const moreCitiesInSnapshot = computed(() => distinctCitiesInSnapshot.value.slice(5));
const hasMoreCities = computed(() => distinctCitiesInSnapshot.value.length > 5);

const distinctSkillsInSnapshot = computed(() => {
  const map = new Map<string, number>();
  for (const job of publicJobs.value) {
    for (const skill of job.skills || []) {
      map.set(skill, (map.get(skill) || 0) + 1);
    }
  }
  return Array.from(map.entries()).map(([skill, count]) => ({ skill, count }));
});

const topSkillsInSnapshot = computed(() => distinctSkillsInSnapshot.value.slice(0, 6));
const moreSkillsInSnapshot = computed(() => distinctSkillsInSnapshot.value.slice(6));
const hasMoreSkills = computed(() => distinctSkillsInSnapshot.value.length > 6);

const distinctCompaniesCount = computed(() => {
  const set = new Set<string>();
  for (const job of publicJobs.value) {
    if (job.brandName) set.add(job.brandName);
  }
  return set.size;
});

const filteredPublicJobs = computed(() => {
  return publicJobs.value.filter((job) => {
    if (snapshotSelectedCity.value !== "all") {
      const city = formatCityName(job);
      if (city !== snapshotSelectedCity.value) return false;
    }
    if (snapshotSelectedSkill.value !== "all") {
      if (!job.skills || !job.skills.includes(snapshotSelectedSkill.value)) {
        return false;
      }
    }
    if (snapshotSearchQuery.value.trim()) {
      const q = snapshotSearchQuery.value.trim().toLowerCase();
      const city = formatCityName(job).toLowerCase();
      const title = (job.bossTitle || "").toLowerCase();
      const company = (job.brandName || "").toLowerCase();
      const industry = (job.brandIndustry || "").toLowerCase();
      const desc = (job.jobDesc || "").toLowerCase();
      const skills = (job.skills || []).join(" ").toLowerCase();
      const match =
        city.includes(q) ||
        title.includes(q) ||
        company.includes(q) ||
        industry.includes(q) ||
        desc.includes(q) ||
        skills.includes(q);
      if (!match) return false;
    }
    return true;
  });
});

const displayedPublicJobs = computed(() =>
  filteredPublicJobs.value.slice(0, snapshotDisplayLimit.value)
);

const hasMorePublicJobs = computed(
  () => filteredPublicJobs.value.length > snapshotDisplayLimit.value
);

const toggleSnapshotLimit = () => {
  if (snapshotDisplayLimit.value >= filteredPublicJobs.value.length) {
    snapshotDisplayLimit.value = 5;
  } else {
    snapshotDisplayLimit.value = filteredPublicJobs.value.length;
  }
};

const resetSnapshotFilters = () => {
  snapshotSearchQuery.value = "";
  snapshotSelectedCity.value = "all";
  snapshotSelectedSkill.value = "all";
  snapshotDisplayLimit.value = 5;
};

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
    showUploadDropzone.value = false;
    showPreferenceEdit.value = false;
    expandedDirectionEvidence.value = {};
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

const scrollToStep = (stepId: string) => {
  const el = document.getElementById(stepId);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("highlight-pulse");
    setTimeout(() => {
      el.classList.remove("highlight-pulse");
    }, 1200);
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

/* 流程导航栏 */
.workflow-stepper-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 16px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  overflow-x: auto;
  gap: 8px;
}

.stepper-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 170px;
  border: 1px solid transparent;
  user-select: none;
}

.stepper-item:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.stepper-item.is-active {
  background: #f0f9ff;
  border-color: #bae6fd;
}

.stepper-item.is-core-step {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.stepper-item.is-core-step:hover {
  background: #dcfce7;
  border-color: #86efac;
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.stepper-item.is-active .step-num {
  background: #0284c7;
  color: #ffffff;
}

.stepper-item.is-completed .step-num {
  background: #10b981;
  color: #ffffff;
}

.stepper-item.is-core-step .step-num {
  background: #059669;
  color: #ffffff;
}

.step-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.step-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.step-desc {
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}

.core-step-badge {
  font-size: 10px;
  background: #fef08a;
  color: #854d0e;
  border: 1px solid #fde047;
  border-radius: 4px;
  padding: 1px 5px;
  font-weight: 700;
}

.step-status-tag {
  font-size: 10px;
  padding: 0 4px;
  height: 18px;
  line-height: 18px;
}

.stepper-arrow {
  color: #cbd5e1;
  font-size: 14px;
  user-select: none;
  flex-shrink: 0;
}

/* 阶段工作区 */
.workflow-zone {
  margin-bottom: 24px;
}

.zone-badge-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 2px;
}

.badge-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.badge-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
  letter-spacing: 0.2px;
}

.badge-pill.core-action {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.badge-pill.neutral {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.badge-pill.grounding {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.zone-heading {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.zone-hint {
  font-size: 12px;
}

.title-with-step {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.step-num-tag {
  font-weight: 700;
  font-size: 11px;
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

.interactive-card {
  border-top: 3px solid #3b82f6;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.right-col .interactive-card {
  border-top-color: #10b981;
}

.grounding-card {
  border-top: 3px solid #64748b;
  background: #ffffff;
}

.right-col .grounding-card {
  border-top-color: #8b5cf6;
}

.empty-grounding-hint {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-grounding-hint .empty-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.empty-grounding-hint .empty-title {
  font-size: 14px;
  color: #475569;
  margin-bottom: 6px;
}

.empty-grounding-hint .empty-desc {
  font-size: 12px;
  line-height: 1.6;
  max-width: 380px;
  margin: 0 auto;
}

@keyframes stepPulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.5); }
  50% { transform: scale(1.008); box-shadow: 0 0 0 8px rgba(64, 158, 255, 0); }
  100% { transform: scale(1); box-shadow: none; }
}

.highlight-pulse {
  animation: stepPulse 1s ease;
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

/* 当前已就绪简历卡片（一级分层） */
.active-profile-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.active-profile-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 28px;
  line-height: 1;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px;
}

.file-main {
  flex: 1;
  min-width: 0;
}

.file-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.file-name {
  font-size: 14px;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-sub {
  font-size: 11px;
  color: #64748b;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.active-profile-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #cbd5e1;
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

/* 意向偏好摘要栏（折叠与展开） */
.preferences-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.preferences-summary-row:hover {
  background: #f1f5f9;
}

.pref-summary-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.pref-icon {
  font-size: 14px;
}

.pref-summary-title {
  color: #334155;
}

.preferences-edit-body {
  margin-top: 10px;
  padding: 10px 12px;
  background: #fafbfc;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
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

/* 能力画像（分层与实证概览） */
.profile-overview-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 12px;
}

.overview-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.overview-metric .label {
  font-size: 11px;
  color: #94a3b8;
}

.overview-metric .value {
  font-size: 13px;
  color: #1e293b;
}

.profile-summary-box {
  background: #fafbfc;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 12px;
  font-size: 12px;
}

.summary-label {
  color: #334155;
  margin-bottom: 4px;
}

.summary-content {
  line-height: 1.6;
}

.skills-matrix-bar {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.matrix-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.matrix-title {
  font-size: 12px;
  color: #334155;
}

.skills-tags-cluster {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-pill {
  cursor: pointer;
  transition: transform 0.15s ease;
}

.skill-pill:hover {
  transform: translateY(-1px);
}

.skill-pill.proven {
  font-weight: 500;
}

.evidence-segmented-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

.capabilities-compact-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 480px;
  overflow-y: auto;
  padding-right: 4px;
}

.cap-compact-item {
  background: #fafbfc;
  border: 1px solid #f1f5f9;
  border-left: 3px solid #94a3b8;
  border-radius: 6px;
  padding: 8px 10px;
}

.cap-compact-item.projectProven {
  border-left-color: #10b981;
  background-color: #f0fdf4;
}

.cap-compact-item.selfStated {
  border-left-color: #3b82f6;
  background-color: #f0f7ff;
}

.cap-header-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.cap-name {
  color: #1e293b;
}

.cap-cat {
  font-size: 11px;
}

.cap-quote-box {
  margin-top: 4px;
  font-size: 11px;
  font-style: italic;
  padding-left: 6px;
  border-left: 2px solid #cbd5e1;
}

.experiences-compact-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 480px;
  overflow-y: auto;
  padding-right: 4px;
}

.experience-compact-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 12px;
}

.exp-title-row {
  font-size: 13px;
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

.unknowns-box {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 6px;
  padding: 10px 12px;
}

.unknowns-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.6;
}

.empty-grounding-hint {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-grounding-hint .empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.empty-grounding-hint .empty-title {
  font-size: 14px;
  margin-bottom: 6px;
}

.empty-grounding-hint .empty-desc {
  font-size: 12px;
  max-width: 360px;
  margin: 0 auto;
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
  border: 1px solid #e2e8f0;
  border-left: 4px solid #10b981;
  border-radius: 8px;
  padding: 14px 16px;
  background-color: #ffffff;
  transition: all 0.2s ease;
}

.direction-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

.direction-card.is-adjacent {
  border-left-color: #f59e0b;
}

.direction-card-primary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dir-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.dir-title-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.dir-title {
  margin: 0;
  font-size: 15px;
  color: #1e293b;
}

.dir-keyword-tag {
  font-family: monospace;
  font-size: 12px;
}

.dir-fit-highlight {
  font-size: 13px;
  line-height: 1.6;
  color: #1e293b;
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.dir-fit-highlight .label {
  color: #1d4ed8;
}

.dir-meta-pills-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.meta-pill {
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.dir-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.boss-search-btn {
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.25);
}

.direction-card-secondary {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dir-basis-box {
  background: #fdfbf7;
  border: 1px solid #fef3c7;
  border-radius: 6px;
  padding: 8px 12px;
}

.basis-title {
  font-size: 12px;
  color: #b45309;
  margin-bottom: 4px;
}

.basis-text {
  font-size: 12px;
  line-height: 1.55;
  color: #475569;
}

.dir-verify-box {
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 6px;
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
  padding: 8px 10px;
}

.citation-meta {
  margin-bottom: 4px;
}

.cite-company {
  color: #1e293b;
}

.cite-title {
  color: #475569;
}

.cite-salary {
  margin-left: 6px;
  font-weight: 500;
}

.citation-quote {
  margin: 0;
  padding-left: 8px;
  border-left: 2px solid #cbd5e1;
  color: #64748b;
  font-style: italic;
  line-height: 1.5;
}

/* 市场快照 */
.snapshot-header-wrap {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

.title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.snapshot-rules-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.rules-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.rules-title {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.rules-version {
  font-size: 11px;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.rule-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px 12px;
}

.rule-box-title {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.rule-box-content {
  font-size: 12px;
  color: #64748b;
  line-height: 1.55;
}

.rule-box-content p {
  margin: 0 0 4px 0;
}

.rule-tag-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
}

.tag-label {
  font-size: 11px;
  color: #94a3b8;
  margin-right: 4px;
}

.snapshot-toolbar {
  margin-bottom: 16px;
}

.snapshot-summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.filter-controls-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fafbfc;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  padding: 12px 14px;
}

.filter-search-box {
  max-width: 440px;
}

.filter-pills-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
}

.filter-label {
  color: #64748b;
  font-weight: 500;
  min-width: 68px;
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
  padding: 12px 16px;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  background-color: #fafbfc;
  transition: all 0.2s ease;
}

.public-job-item:hover {
  background-color: #ffffff;
  border-color: #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.job-item-main {
  flex: 1;
}

.job-title-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 6px;
}

.job-num-badge {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.job-city-tag {
  font-weight: 600;
}

.job-salary {
  font-size: 12px;
  white-space: nowrap;
  background: #f0f7ff;
  border: 1px solid #d0e7ff;
  padding: 1px 8px;
  border-radius: 4px;
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
  margin-bottom: 6px;
}

.company-name {
  color: #334155;
}

.source-link {
  font-family: monospace;
  font-size: 11px;
  color: #94a3b8;
}

.job-desc-tags-line {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.desc-chip {
  font-size: 11px;
  color: #475569;
  background: #edf2f7;
  padding: 2px 8px;
  border-radius: 4px;
}

.job-skills-line {
  display: flex;
  gap: 4px;
}

.job-details-expand-box {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e2e8f0;
}

.snapshot-pagination-bar {
  text-align: center;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}

.load-more-btn {
  width: 100%;
  max-width: 400px;
  font-weight: 500;
}

.snapshot-empty-wrap {
  padding: 24px 0;
}

/* 工具类 */
.mt-1 { margin-top: 4px; }
.mb-1 { margin-bottom: 4px; }
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
