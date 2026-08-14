<template>
  <div class="data-view">
    <el-card shadow="never" class="section">
      <template #header>数据采集与管理</template>
      <p class="guide-copy">插件采集完成后会生成一次性待导入数据；导入成功后暂存自动清除，Ledger 中的数据仍保留。需要纠正旧批次时可先清除投资事实再重新采集。</p>
      <div class="guide-actions">
        <el-button type="primary" :loading="state.collecting" :disabled="state.syncing" @click="startCollection">重新采集投资数据</el-button>
        <el-button :loading="state.syncing" :disabled="state.collecting" @click="syncFromExtension">读取待导入数据</el-button>
        <el-button @click="downloadPlugin">下载 Investment 插件</el-button>
        <el-button text type="primary" @click="showInstallSteps = !showInstallSteps">{{ showInstallSteps ? "收起安装步骤" : "查看安装步骤" }}</el-button>
      </div>
      <el-alert v-if="pluginHint" :type="pluginHint.type" :title="pluginHint.title" :description="pluginHint.desc" show-icon :closable="false" class="guide-hint" />
      <ol v-if="showInstallSteps" class="install-steps">
        <li>解压下载的 zip，在 <code>chrome://extensions</code> 开启开发者模式并加载插件。</li>
        <li>登录天天基金，回到本页点击“重新采集投资数据”，等待持仓、基金详情和全部交易分页采集完成。</li>
        <li>进度显示“新批次等待导入”后，点击“读取待导入数据”。导入后插件暂存会清除，但 Ledger 数据仍保留。</li>
      </ol>
    </el-card>

    <!-- Data Health -->
    <el-card shadow="never" class="section">
      <template #header>数据健康</template>
      <el-empty v-if="!state.coverage.length" description="尚无数据覆盖记录，请先同步" />
      <div v-else class="health-list">
        <div v-for="c in state.coverage" :key="c.dataset" class="health-row">
          <span class="dataset-label">{{ datasetLabel(c.dataset) }}</span>
          <el-progress
            :percentage="completenessPct(c.completeness)"
            :status="progressStatus(c.completeness)"
            :stroke-width="14"
            class="health-bar"
          />
          <el-tag :type="completenessTag(c.completeness)" size="small" effect="plain">{{ completenessLabel(c.completeness) }}</el-tag>
        </div>
      </div>
    </el-card>

    <!-- Coverage 时间轴 -->
    <el-card shadow="never" class="section">
      <template #header>数据覆盖范围</template>
      <el-empty v-if="!state.coverage.length" description="无覆盖数据" />
      <div v-else class="range-list">
        <div v-for="c in state.coverage" :key="c.dataset" class="range-row">
          <span class="dataset-label">{{ datasetLabel(c.dataset) }}</span>
          <span v-if="c.knownRanges.length" class="range-text">
            {{ c.knownRanges.map((r) => `${r.start} ~ ${r.end}`).join("，") }}
          </span>
          <span v-else class="range-text empty">无已知范围</span>
        </div>
      </div>
    </el-card>

    <!-- 数据缺口影响 -->
    <el-card shadow="never" class="section">
      <template #header>数据缺口影响</template>
      <el-empty v-if="!gaps.length" description="数据完整，无缺口" />
      <div v-else class="gap-list">
        <el-alert
          v-for="g in gaps"
          :key="g.dataset"
          type="warning"
          show-icon
          :closable="false"
          class="gap-alert"
        >
          <template #title>
            {{ datasetLabel(g.dataset) }}：{{ completenessLabel(g.completeness) }}
          </template>
          <div class="gap-detail">
            <p><strong>缺少：</strong>{{ g.missingRanges.join("；") }}</p>
            <p><strong>影响：</strong>{{ g.impact }}</p>
            <p><strong>不影响：</strong>{{ g.notAffected }}</p>
            <p class="gap-recover"><strong>恢复指引：</strong>{{ g.recover }}</p>
            <el-button
              size="small"
              type="primary"
              :loading="state.collecting"
              :disabled="state.syncing"
              @click="startCollection"
            >去重新采集</el-button>
          </div>
        </el-alert>
      </div>
    </el-card>

    <el-card shadow="never" class="section danger-section">
      <template #header>重新录入与本地删除</template>
      <p class="guide-copy">清除后不会自动采集或导入。默认只删除账户、持仓、交易、盈亏、Coverage 和派生结果，保留你定义的规则。</p>
      <div class="guide-actions">
        <el-button type="warning" plain @click="confirmClearFacts">清除投资事实并重新录入</el-button>
        <el-button type="danger" plain @click="confirmClearEverything">清空全部本地数据</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import { usePluginGuide } from "../../investment/composables/use-plugin-guide";
import { buildCoverageGaps } from "../../investment/composables/selectors";
import type { CoverageDataset, DataCoverage } from "../../investment/domain";

const { state, syncFromExtension, startCollection, clearImportedFacts, clearEverything } = useInvestmentOS();
const { pluginHint, downloadPlugin } = usePluginGuide();
const showInstallSteps = ref(false);

const gaps = computed(() => buildCoverageGaps([...state.coverage]));

async function confirmClearFacts(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      "将删除账户、持仓、交易、每日盈亏、Coverage、导入记录和派生结果，同时丢弃插件待导入批次；你定义的规则及规则版本会保留。此操作不可恢复。",
      "清除投资事实并重新录入",
      { type: "warning", confirmButtonText: "确认清除事实", cancelButtonText: "取消" },
    );
    await clearImportedFacts();
    ElMessage.success("投资事实已清除，用户规则已保留");
  } catch (error) {
    if (error !== "cancel" && error !== "close") ElMessage.error(error instanceof Error ? error.message : "清除失败");
  }
}

async function confirmClearEverything(): Promise<void> {
  try {
    await ElMessageBox.prompt(
      "这会删除 Investment Ledger 的所有投资事实、规则和规则版本。请输入“清空全部”确认。",
      "清空全部本地数据",
      {
        type: "error",
        confirmButtonText: "永久清空",
        cancelButtonText: "取消",
        inputPattern: /^清空全部$/,
        inputErrorMessage: "请输入“清空全部”",
      },
    );
    await clearEverything();
    ElMessage.success("Investment Ledger 已全部清空");
  } catch (error) {
    if (error !== "cancel" && error !== "close") ElMessage.error(error instanceof Error ? error.message : "清空失败");
  }
}

function datasetLabel(dataset: CoverageDataset): string {
  return { account: "账户", holdings: "持仓", dailyPnl: "每日盈亏", transactions: "交易历史", fundDetail: "基金详情" }[dataset];
}

const PCT: Record<DataCoverage["completeness"], number> = { complete: 100, partial: 55, unknown: 20 };
const STATUS: Record<DataCoverage["completeness"], "success" | "warning" | "exception"> = { complete: "success", partial: "warning", unknown: "exception" };
const TAG: Record<DataCoverage["completeness"], "success" | "warning" | "info"> = { complete: "success", partial: "warning", unknown: "info" };
const LABEL: Record<DataCoverage["completeness"], string> = { complete: "完整", partial: "部分", unknown: "未知" };

function completenessLabel(c: DataCoverage["completeness"]): string {
  return LABEL[c];
}

function completenessPct(c: DataCoverage["completeness"]): number {
  return PCT[c];
}

function progressStatus(c: DataCoverage["completeness"]): "success" | "warning" | "exception" {
  return STATUS[c];
}

function completenessTag(c: DataCoverage["completeness"]): "success" | "warning" | "info" {
  return TAG[c];
}
</script>

<style scoped>
.data-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section {
  width: 100%;
}
.guide-copy {
  margin: 0 0 14px;
  color: var(--el-text-color-regular);
  line-height: 1.7;
}
.guide-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.guide-hint {
  margin-top: 14px;
}
.install-steps {
  margin: 14px 0 0;
  padding-left: 20px;
  color: var(--el-text-color-regular);
  line-height: 1.8;
}
.install-steps code {
  color: var(--el-color-primary);
}
.health-list,
.range-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.health-row,
.range-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dataset-label {
  width: 96px;
  flex-shrink: 0;
  color: var(--el-text-color-regular);
}
.health-bar {
  flex: 1;
}
.range-text {
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.range-text.empty {
  color: var(--el-text-color-secondary);
}
.danger-section {
  border-color: var(--el-color-warning-light-5);
}
.gap-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.gap-detail p {
  margin: 4px 0;
  font-size: 13px;
}
.gap-recover {
  color: var(--el-color-success);
}
</style>
