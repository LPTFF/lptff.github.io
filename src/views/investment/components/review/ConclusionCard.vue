<template>
  <el-card shadow="never" class="conclusion-card" :class="{ 'is-needy': needy }">
    <div class="conclusion-head">
      <div>
        <div class="conclusion-question">{{ conclusion.questionLabel }}</div>
        <div class="conclusion-subject">{{ conclusion.subjectLabel }}</div>
      </div>
      <el-tag :type="statusType" effect="plain" size="small">{{ conclusion.statusLabel }}</el-tag>
    </div>

    <div v-if="conclusion.occurredAt || conclusion.directionLabel || conclusion.executionLabel" class="fact-line">
      <span v-if="conclusion.occurredAt">{{ conclusion.occurredAt }}</span>
      <span v-if="conclusion.directionLabel">{{ conclusion.directionLabel }}</span>
      <span v-if="conclusion.executionLabel">{{ conclusion.executionLabel }}</span>
    </div>

    <p class="conclusion-reason">{{ conclusion.reason }}</p>
    <div class="meaning-block">
      <p><strong>这意味着：</strong>{{ conclusion.meaning }}</p>
      <p><strong>不能证明：</strong>{{ conclusion.cannotProve }}</p>
    </div>
    <p v-if="conclusion.nextStep" class="next-step"><strong>下一步：</strong>{{ conclusion.nextStep }}</p>

    <div v-if="closed" class="resolution-bar">
      <el-tag type="success" effect="plain" size="small">本次处置：{{ conclusion.actionKindLabel }}</el-tag>
      <span v-if="conclusion.actionNote" class="resolved-note">{{ conclusion.actionNote }}</span>
      <el-button v-if="onRerun" size="small" link @click="onRerun">重新复盘</el-button>
    </div>
    <div v-else-if="waiting" class="resolution-bar">
      <el-tag type="warning" effect="plain" size="small">当前进度：{{ conclusion.actionKindLabel }}</el-tag>
      <span class="resolved-note">新执行事实或仓位快照到达后会自动重新判断。</span>
      <el-button v-if="onRerun" size="small" link @click="onRerun">重新复盘</el-button>
    </div>
    <div v-else-if="conclusion.primaryActionLabel || canWaitRecheck || canDismiss" class="resolution-bar">
      <el-button
        v-if="conclusion.primaryActionLabel"
        size="small"
        type="primary"
        plain
        @click="runPrimaryAction"
      >
        {{ conclusion.primaryActionLabel }} →
      </el-button>
      <el-button v-if="canWaitRecheck" size="small" @click="resolve('waiting_recheck')">已处理，等待复核</el-button>
      <el-button v-if="canDismiss" size="small" type="info" plain @click="onDismiss">带理由关闭</el-button>
    </div>

    <el-collapse v-if="hasDrilldown" class="conclusion-drilldown">
      <el-collapse-item title="查看证据、规则与数据边界">
        <div class="drill-row">
          <span class="drill-label">事实依据</span>
          <span class="drill-value">{{ conclusion.evidenceSummary }}</span>
        </div>
        <div v-if="conclusion.ruleVersionLabel" class="drill-row">
          <span class="drill-label">规则依据</span>
          <span class="drill-value">{{ conclusion.ruleVersionLabel }}</span>
        </div>
        <div v-if="conclusion.coverageWarnings.length" class="drill-row">
          <span class="drill-label">数据缺口</span>
          <span class="drill-value">{{ conclusion.coverageWarnings.join("；") }}</span>
        </div>
        <div v-if="conclusion.limitation" class="drill-row">
          <span class="drill-label">判断限制</span>
          <span class="drill-value">{{ conclusion.limitation }}</span>
        </div>
        <div v-if="conclusion.missingEvidence.length" class="drill-row">
          <span class="drill-label">还缺证据</span>
          <span class="drill-value">{{ conclusion.missingEvidence.join("；") }}</span>
        </div>
      </el-collapse-item>
    </el-collapse>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElMessageBox } from "element-plus";
import type { ReviewConclusionView } from "../../../../investment/composables/selectors";

const props = defineProps<{
  conclusion: ReviewConclusionView;
  needy?: boolean;
  onResolve?: (actionId: string, kind: "acknowledged" | "waiting_execution" | "waiting_confirmation" | "waiting_recheck" | "resolved" | "dismissed_with_reason", note?: string) => void;
  onPrimaryAction?: (conclusion: ReviewConclusionView) => void;
  onRerun?: () => void;
}>();

const closed = computed(() => Boolean(
  props.conclusion.actionKind
  && ["acknowledged", "resolved", "dismissed_with_reason"].includes(props.conclusion.actionKind),
));
const waiting = computed(() => Boolean(
  props.conclusion.actionKind
  && ["waiting_execution", "waiting_confirmation", "waiting_recheck"].includes(props.conclusion.actionKind),
));
const canWaitRecheck = computed(() => Boolean(
  props.needy
  && props.conclusion.actionId
  && !["record_review", "link_plan"].includes(props.conclusion.primaryAction ?? ""),
));
const canDismiss = computed(() => Boolean(props.needy && props.conclusion.actionId));
const statusType = computed<"success" | "warning" | "info" | "danger">(() => {
  if (props.needy) return "danger";
  if (props.conclusion.status === "VALID") return "success";
  return "warning";
});

function resolve(kind: "acknowledged" | "waiting_confirmation" | "waiting_recheck"): void {
  if (!props.conclusion.actionId || !props.onResolve) return;
  props.onResolve(props.conclusion.actionId, kind);
}

function runPrimaryAction(): void {
  if (props.conclusion.primaryAction === "record_review") {
    resolve("acknowledged");
    return;
  }
  if (props.conclusion.primaryAction === "wait_confirmation" && props.conclusion.actionId) {
    resolve("waiting_confirmation");
    return;
  }
  props.onPrimaryAction?.(props.conclusion);
}

async function onDismiss(): Promise<void> {
  if (!props.conclusion.actionId || !props.onResolve) return;
  let note = "";
  try {
    const result = await ElMessageBox.prompt(
      "请记录关闭理由。它只关闭本次复盘事项，不会改变真实交易状态。",
      "带理由关闭",
      { confirmButtonText: "确认关闭", cancelButtonText: "取消" },
    );
    note = result?.value ?? "";
  } catch {
    return;
  }
  props.onResolve(props.conclusion.actionId, "dismissed_with_reason", note);
}

function onRerun(): void {
  props.onRerun?.();
}

const hasDrilldown = computed(() =>
  Boolean(props.conclusion.evidenceSummary)
  || Boolean(props.conclusion.ruleVersionLabel)
  || props.conclusion.coverageWarnings.length > 0
  || Boolean(props.conclusion.limitation)
  || props.conclusion.missingEvidence.length > 0,
);
</script>

<style scoped>
.conclusion-card {
  margin-bottom: 8px;
}
.conclusion-card.is-needy {
  border-left: 3px solid var(--el-color-danger);
}
.conclusion-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.conclusion-question {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.conclusion-subject {
  margin-top: 2px;
  font-weight: 600;
}
.fact-line {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.fact-line span + span::before {
  content: "·";
  margin-right: 8px;
}
.conclusion-reason {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.meaning-block {
  margin-top: 8px;
  padding: 8px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.meaning-block p,
.next-step {
  margin: 2px 0;
}
.next-step {
  margin-top: 8px;
  font-size: 12px;
}
.resolution-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.resolved-note {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.conclusion-drilldown {
  margin-top: 6px;
  border-top: none;
}
.drill-row {
  display: flex;
  gap: 8px;
  font-size: 12px;
  margin: 3px 0;
}
.drill-label {
  color: var(--el-text-color-secondary);
  min-width: 64px;
}
.drill-value {
  word-break: break-word;
}
</style>
