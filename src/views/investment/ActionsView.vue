<template>
  <div class="actions-view">
    <div class="actions-head">
      <h3>需要处理</h3>
      <el-tag type="warning" effect="plain">{{ state.pendingActions }} 待处理</el-tag>
    </div>

    <el-empty v-if="!state.actions.length" description="当前没有需要你做出的投资判断。" />

    <div v-else class="action-list">
      <el-card v-for="a in state.actions" :key="a.id" shadow="never" class="action-card">
        <template #header>
          <div class="action-head">
            <el-tag :type="actionTag(a.type)" size="small" effect="plain">{{ actionLabel(a.type) }}</el-tag>
            <span class="action-title">{{ a.title || "—" }}</span>
            <el-tag :type="statusTag(a.status)" size="small">{{ statusLabel(a.status) }}</el-tag>
          </div>
        </template>
        <p class="action-detail">{{ a.detail || "—" }}</p>
        <p class="action-meta">创建于 {{ a.createdAt }}{{ a.policyId ? ` · 关联规则 ${a.policyId}` : "" }}</p>

        <div v-if="a.status === 'open'" class="action-actions">
          <template v-if="a.type === 'POLICY_TRIGGER'">
            <el-button size="small" @click="resolve(a.id, 'pause-new')">暂停新增</el-button>
            <el-button size="small" type="primary" @click="goAdjust(a)">调整 Policy</el-button>
            <el-button size="small" @click="resolve(a.id, 'ignore')">暂时忽略</el-button>
          </template>
          <template v-else-if="a.type === 'ABNORMAL_TRANSACTION' || a.type === 'UNCLASSIFIED_TRANSACTION'">
            <span class="action-hint">这是：</span>
            <el-button size="small" @click="resolveWithReason(a.id, '临时机会')">临时机会</el-button>
            <el-button size="small" @click="resolveWithReason(a.id, '调整策略')">调整策略</el-button>
            <el-button size="small" @click="resolveWithReason(a.id, '操作错误')">操作错误</el-button>
            <el-button size="small" @click="resolveWithReason(a.id, '其他')">其他</el-button>
          </template>
          <template v-else>
            <el-button size="small" @click="resolve(a.id, 'ignore')">标记已处理</el-button>
          </template>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useInvestmentOS } from "../../investment/composables/use-investment-os";
import type { Action, ActionType, ActionStatus } from "../../investment/domain";

const router = useRouter();
const { state, processAction } = useInvestmentOS();

async function resolve(id: string, resolution: "pause-new" | "adjust-policy" | "ignore") {
  await processAction(id, resolution);
  ElMessage.success(resolution === "ignore" ? "已忽略" : "已处理");
}

async function resolveWithReason(id: string, reason: string) {
  await processAction(id, "adjust-policy");
  ElMessage.success(`已记录：${reason}`);
}

function goAdjust(a: Action) {
  if (a.policyId) router.push("/investment/policies");
}

const ACTION_TAG: Record<ActionType, "warning" | "danger" | "info"> = {
  POLICY_TRIGGER: "warning",
  RISK_REVIEW: "warning",
  UNCLASSIFIED_TRANSACTION: "info",
  ABNORMAL_TRANSACTION: "danger",
  DATA_REQUIRED: "info",
};
const STATUS_TAG: Record<ActionStatus, "warning" | "success" | "info"> = { open: "warning", resolved: "success", ignored: "info" };

function actionLabel(t: ActionType): string {
  return {
    POLICY_TRIGGER: "规则触发",
    RISK_REVIEW: "风险复核",
    UNCLASSIFIED_TRANSACTION: "未分类交易",
    ABNORMAL_TRANSACTION: "异常交易",
    DATA_REQUIRED: "数据不足",
  }[t];
}
function actionTag(t: ActionType): "warning" | "danger" | "info" {
  return ACTION_TAG[t];
}
function statusLabel(s: ActionStatus): string {
  return { open: "待处理", resolved: "已处理", ignored: "已忽略" }[s];
}
function statusTag(s: ActionStatus): "warning" | "success" | "info" {
  return STATUS_TAG[s];
}
</script>

<style scoped>
.actions-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.actions-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.actions-head h3 {
  margin: 0;
}
.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.action-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.action-title {
  font-weight: 500;
  flex: 1;
}
.action-detail,
.action-meta {
  margin: 4px 0;
  color: var(--el-text-color-regular);
}
.action-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.action-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.action-hint {
  color: var(--el-text-color-regular);
  font-size: 13px;
  margin-right: 4px;
}
</style>
