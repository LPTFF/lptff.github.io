<template>
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
                    @click="emit('open-platform', job.bossTitle)"
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
</template>

<script setup lang="ts">
import { toRef } from "vue";
import type { MarketJobItem } from "../../../career/types";
import { useMarketSnapshot } from "../../../career/composables/use-market-snapshot";
import { SNAPSHOT_TARGET_CITIES, SNAPSHOT_ROLE_MARKERS, formatCityName, parseJobDescChips } from "../../../career/market";
import { startTask } from "../../../utils/observation";

const props = defineProps<{ publicJobs: MarketJobItem[] }>();
const emit = defineEmits<{ "open-platform": [keyword: string] }>();
const { snapshotLastTime, showMoreCities, showMoreSkills, snapshotDisplayLimit, expandedJobDetails, toggleJobDetail, showSnapshotRules, snapshotSearchQuery, snapshotSelectedCity, snapshotSelectedSkill, distinctCitiesInSnapshot, topCitiesInSnapshot, moreCitiesInSnapshot, hasMoreCities, distinctSkillsInSnapshot, topSkillsInSnapshot, moreSkillsInSnapshot, hasMoreSkills, distinctCompaniesCount, filteredPublicJobs, displayedPublicJobs, hasMorePublicJobs, toggleSnapshotLimit, resetSnapshotFilters } = useMarketSnapshot(toRef(props, "publicJobs"), (outcome) => {
  startTask("career", "filter_jobs").finish(outcome);
});
</script>

<style scoped src="../styles/shared.css" />
<style scoped>
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

</style>
