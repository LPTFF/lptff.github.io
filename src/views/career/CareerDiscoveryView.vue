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
                <a href="https://github.com/LPTFF/lptff.github.io/tree/master/extension" target="_blank" class="guide-link">
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
        <CareerMarketSnapshot :public-jobs="publicJobs" @open-platform="handleJumpToBoss" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { MarketJobItem } from "../../career/types";
import { useCareerWorkflow } from "../../career/composables/use-career-workflow";
import CareerMarketSnapshot from "./components/CareerMarketSnapshot.vue";
import publicJobsRaw from "@published/zhipin.json";

const publicJobs = ref<MarketJobItem[]>(publicJobsRaw as MarketJobItem[]);
const {
  showGeminiConfig,
  geminiForm,
  isKeyRevealed,
  revealingKey,
  savingGemini,
  testingGemini,
  clearingGemini,
  geminiTestFeedback,
  geminiTestSuccess,
  toggleGeminiConfig,
  handleToggleRevealKey,
  handleSaveGeminiOnly,
  handleSaveAndTestGemini,
  handleClearGeminiKey,
  checkingStatus,
  bridgeStatus,
  fileInputRef,
  isDragOver,
  isProcessing,
  processStep,
  processMessage,
  processError,
  profile,
  directions,
  directionFilter,
  preferences,
  showUploadDropzone,
  showPreferenceEdit,
  expandedDirectionEvidence,
  toggleDirectionEvidence,
  activeEvidenceTab,
  projectProvenCaps,
  selfStatedCaps,
  marketSupportedCount,
  adjacentCount,
  filteredDirections,
  refreshBridgeStatus,
  triggerFileInput,
  handleFileSelect,
  handleFileDrop,
  retryCurrentTask,
  handlePreferencesChange,
  handleJumpToBoss,
  handleSyncAutopilot,
  handleClearData,
  evidenceLabel,
  evidenceTagType,
  formatDate,
  scrollToStep,
} = useCareerWorkflow(publicJobs);
</script>

<style scoped src="./styles/shared.css" />
<style scoped src="./styles/career-page.css" />
