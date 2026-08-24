<template>
  <section class="contract-review">
    <header class="hero">
      <div>
        <p class="eyebrow">Investment OS · Binance Futures</p>
        <h2>合约复盘来源台账</h2>
        <p>对齐币安数据下载中心的四类 U 本位合约历史，并自动覆盖账户中全部可读取时间；只读采集，不生成下载任务、不发起交易。</p>
      </div>
      <div class="actions">
        <el-button type="primary" :loading="busy" :disabled="pending" @click="collect">开始高效采集</el-button>
        <el-button :loading="busy" :disabled="!pending" @click="importPending">导入插件暂存</el-button>
        <el-button v-if="pending" :disabled="busy" @click="discard">丢弃暂存</el-button>
        <el-button v-if="latest" :disabled="busy" @click="exportLatest(false)">导出正式来源包</el-button>
        <el-button v-if="latest" :disabled="busy" @click="exportLatest(true)">导出脱敏来源包</el-button>
      </div>
    </header>

    <el-alert :title="message" :type="messageType" :closable="false" show-icon />

    <section class="snapshot-import">
      <div>
        <strong>内置脱敏采集快照</strong>
        <p>币安 U 本位合约真实结构样本：订单 499、交易 197、持仓 48、资金流水 408，四类数据完整；仅用于结构审查，不代表当前账户。</p>
      </div>
      <el-button type="primary" plain :loading="busy" @click="importBundledSnapshot">导入内置脱敏快照（2026-08-24）</el-button>
    </section>

    <div class="branches">
      <div v-for="branch in branchList" :key="branch.label" class="branch">
        <span>{{ branch.label }}</span><strong>{{ branchStatus(branch.status) }}{{ branch.total || branch.status === 'completed' ? ` · ${branch.total}` : "" }}</strong>
        <small v-if="branch.pageCount || branch.windowsTotal || hasOrderSources(branch)">{{ branch.pageCount ? `${branch.pageCount} 页` : '' }}{{ branch.windowsTotal ? ` · ${branch.windowsCompleted || 0}/${branch.windowsTotal} 段` : '' }}{{ hasOrderSources(branch) ? ` · 基础单 ${branch.regularOrderCount} + 条件委托 ${branch.conditionalOrderCount}` : '' }}{{ branch.duplicateResponseCount ? ` · 去重 ${branch.duplicateResponseCount}` : '' }}</small>
      </div>
    </div>

    <template v-if="latest">
      <div class="summary-grid">
        <el-card v-for="item in totals" :key="item.label" shadow="never"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></el-card>
      </div>
      <p class="meta">采集于 {{ formatTime(latest.capturedAt) }} · 本地已留存 {{ archiveCount }} 批 · 协议 {{ latest.protocol }}</p>
      <p v-if="latest.historyRange" class="history-range">全量覆盖：{{ formatTime(latest.historyRange.startAt) }} — {{ formatTime(latest.historyRange.endAt) }} · 自动拆分 {{ latest.historyRange.windowCount }} 个 {{ latest.historyRange.windowDays }} 天窗口</p>
      <div class="coverage"><el-tag v-for="item in latest.coverage" :key="item.dataset" :type="item.completeness === 'complete' ? 'success' : 'warning'">{{ item.dataset }}：{{ item.completeness }} {{ item.completeRecordCount ?? 0 }}/{{ item.recordCount ?? 0 }}</el-tag></div>

      <el-tabs>
        <el-tab-pane label="订单历史"><el-table :data="latest.orderHistory" stripe><el-table-column prop="symbol" label="合约"/><el-table-column prop="side" label="买卖"/><el-table-column prop="positionSide" label="持仓方向"/><el-table-column prop="type" label="类型"/><el-table-column prop="status" label="状态"/><el-table-column label="官方来源"><template #default="scope"><el-tag size="small" type="success">{{ scope.row.recordType === 'conditionalOrderHistory' ? '条件委托' : '基础单' }}</el-tag></template></el-table-column><el-table-column prop="averagePrice" label="成交均价"/><el-table-column prop="executedQuantity" label="成交数量"/><el-table-column prop="updatedAt" label="更新时间"><template #default="scope">{{ formatTime(scope.row.updatedAt) }}</template></el-table-column></el-table></el-tab-pane>
        <el-tab-pane label="交易历史"><el-table :data="latest.tradeHistory" stripe><el-table-column prop="symbol" label="合约"/><el-table-column prop="side" label="买卖"/><el-table-column prop="positionSide" label="持仓方向"/><el-table-column prop="price" label="成交价"/><el-table-column prop="quantity" label="数量"/><el-table-column prop="realizedProfit" label="已实现盈亏"/><el-table-column prop="commission" label="手续费"/><el-table-column prop="time" label="时间"><template #default="scope">{{ formatTime(scope.row.time) }}</template></el-table-column></el-table></el-tab-pane>
        <el-tab-pane label="持仓历史"><el-table :data="latest.positionHistory" stripe><el-table-column prop="symbol" label="合约"/><el-table-column prop="positionSide" label="方向"/><el-table-column prop="status" label="状态"/><el-table-column prop="openedVolume" label="开仓量"/><el-table-column prop="averageOpenPrice" label="开仓均价"/><el-table-column prop="averageClosePrice" label="平仓均价"/><el-table-column prop="closingPnl" label="平仓盈亏"/><el-table-column prop="updatedAt" label="更新时间"><template #default="scope">{{ formatTime(scope.row.updatedAt) }}</template></el-table-column></el-table></el-tab-pane>
        <el-tab-pane label="资金流水"><el-table :data="latest.transactionHistory" stripe><el-table-column prop="time" label="时间"><template #default="scope">{{ formatTime(scope.row.time) }}</template></el-table-column><el-table-column prop="typeLabel" label="类型"/><el-table-column prop="symbol" label="合约"/><el-table-column prop="asset" label="资产"/><el-table-column prop="amount" label="金额"/><el-table-column prop="description" label="说明"/></el-table></el-tab-pane>
        <el-tab-pane label="当前账户快照"><el-table :data="latest.positions" stripe><el-table-column prop="symbol" label="合约"/><el-table-column prop="positionSide" label="方向"/><el-table-column prop="positionAmount" label="数量"/><el-table-column prop="entryPrice" label="开仓价"/><el-table-column prop="markPrice" label="标记价"/><el-table-column prop="leverage" label="杠杆"/><el-table-column prop="liquidationPrice" label="强平价"/><el-table-column prop="unrealizedProfit" label="未实现盈亏"/></el-table></el-tab-pane>
      </el-tabs>
    </template>
    <el-empty v-else description="尚无本地合约来源数据，请先采集并导入" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { toContractReviewDataset } from "../../crypto/adapter";
import type { BinanceSourceCapture, ContractReviewDataset } from "../../crypto/domain";
import { getBinanceStaging, getBinanceStatus, acknowledgeBinanceStaging, discardBinanceStaging, startBinanceCollection } from "../../crypto/extension-sync";
import { ContractReviewLedger } from "../../crypto/ledger";
import bundledSnapshotUrl from "../../../project-support/fixtures/crypto/binance-source-desensitized.json?url";

interface Branch { label: string; status: string; total: number; pageCount?: number; windowsCompleted?: number; windowsTotal?: number; regularOrderCount?: number; conditionalOrderCount?: number; duplicateResponseCount?: number }
interface ExtensionStatus { pending: boolean; receipt?: { status: string }; collection?: { running: boolean; branches?: Record<string, Branch> } }
const ledger = new ContractReviewLedger();
const latest = ref<ContractReviewDataset>();
const archiveCount = ref(0);
const pending = ref(false);
const busy = ref(false);
const message = ref("正在检查插件与本地台账…");
const messageType = ref<"info" | "success" | "warning" | "error">("info");
const branchList = ref<Branch[]>([]);
const totals = computed(() => latest.value ? [
  { label: "订单历史", value: latest.value.orderHistory.length }, { label: "交易历史", value: latest.value.tradeHistory.length },
  { label: "持仓历史", value: latest.value.positionHistory.length }, { label: "资金流水", value: latest.value.transactionHistory.length },
  { label: "当前头寸", value: latest.value.positions.length }, { label: "权益资产", value: latest.value.equity.length },
] : []);
const formatTime = (value: string | number) => value ? new Date(value).toLocaleString("zh-CN") : "—";
const branchStatus = (value: string) => ({ pending: "等待", running: "进行中", completed: "完成", partial: "部分完成" }[value] || value);
const hasOrderSources = (branch: Branch) => Number(branch.regularOrderCount) + Number(branch.conditionalOrderCount) > 0;

function desensitizeCapture(value: unknown): unknown {
  const identifierKey = /^(?:historyId|algoId|orderId|clientOrderId|tradeId|positionId|transactionId|recordId)$/;
  const identifiers = new Map<string, string>();
  let sequence = 0;
  const collect = (item: unknown, key = "") => {
    if (Array.isArray(item)) return item.forEach((entry) => collect(entry, key));
    if (item && typeof item === "object") return Object.entries(item).forEach(([name, entry]) => collect(entry, name));
    const text = item === undefined || item === null ? "" : String(item);
    if (identifierKey.test(key) && text.length >= 6 && !identifiers.has(text)) {
      sequence += 1;
      identifiers.set(text, `ID-${String(sequence).padStart(4, "0")}`);
    }
  };
  collect(value);
  const mask = (item: unknown, key = ""): unknown => {
    if (Array.isArray(item)) return item.map((entry) => mask(entry, key));
    if (item && typeof item === "object") return Object.fromEntries(Object.entries(item).map(([name, entry]) => [name, mask(entry, name)]));
    if (item === undefined || item === null) return item;
    return identifierKey.test(key) && identifiers.has(String(item)) ? identifiers.get(String(item)) : item;
  };
  return mask(value);
}

function exportLatest(desensitized: boolean) {
  if (!latest.value) return;
  const payload = desensitized ? desensitizeCapture(latest.value.rawCapture) : latest.value.rawCapture;
  const stamp = latest.value.capturedAt.replace(/[:.]/g, "-");
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `binance-source-capture-${stamp}${desensitized ? "-desensitized" : ""}.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  message.value = desensitized ? "脱敏正式来源包已从本地台账导出。" : "正式来源包已从本地台账导出。";
  messageType.value = "success";
}

async function loadLocal() { const all = await ledger.list(); latest.value = all[0]; archiveCount.value = all.length; }
async function importBundledSnapshot() {
  busy.value = true;
  message.value = "正在读取并校验内置币安脱敏快照…";
  messageType.value = "info";
  try {
    const response = await fetch(bundledSnapshotUrl);
    if (!response.ok) throw new Error(`读取内置脱敏快照失败：HTTP ${response.status}`);
    const capture = await response.json() as BinanceSourceCapture;
    const dataset = toContractReviewDataset(capture);
    await ledger.put(dataset);
    if (pending.value) {
      const discarded = await discardBinanceStaging();
      if (!discarded.ok) throw new Error(discarded.error || "快照已导入，但插件旧暂存清理失败");
      pending.value = false;
    }
    await loadLocal();
    try { await refreshStatus(); } catch { /* 快照导入不依赖扩展在线 */ }
    message.value = `已导入内置脱敏快照：订单历史 ${dataset.orderHistory.length}、交易历史 ${dataset.tradeHistory.length}、持仓历史 ${dataset.positionHistory.length}、资金流水 ${dataset.transactionHistory.length} 条；仅用于结构审查。`;
    messageType.value = "success";
  } catch (error) {
    message.value = error instanceof Error ? error.message : "导入内置脱敏快照失败";
    messageType.value = "error";
  } finally {
    busy.value = false;
  }
}
async function refreshStatus() {
  const response = await getBinanceStatus<ExtensionStatus>();
  if (!response.ok || !response.status) throw new Error(response.error || "无法读取插件状态");
  pending.value = response.status.pending;
  branchList.value = Object.values(response.status.collection?.branches || {});
  if (response.status.collection?.running) message.value = "正在并行采集四类合约历史与账户快照，完成后自动导入本地台账。";
  else if (pending.value) { message.value = "插件已有一批正式来源包等待导入。"; messageType.value = "warning"; }
  else if (response.status.receipt?.status === "imported") { message.value = "插件暂存已确认清除，本地台账是当前事实来源。"; messageType.value = "success"; }
  else message.value = latest.value ? "本地台账已就绪，可重新采集获得新快照。" : "插件已连接，尚无待导入来源包。";
}
async function importPending() {
  busy.value = true;
  try {
    const response = await getBinanceStaging();
    if (!response.ok) throw new Error(response.error || "读取暂存失败");
    if (!response.staging?.capture) throw new Error("插件没有待导入的币安来源包");
    const dataset = toContractReviewDataset(response.staging.capture);
    await ledger.put(dataset);
    const acknowledgement = await acknowledgeBinanceStaging();
    if (!acknowledgement.ok) throw new Error(acknowledgement.error || "本地已写入，但插件暂存确认失败");
    await loadLocal();
    pending.value = false;
    await refreshStatus();
    const corePartial = dataset.coverage.some((item) => ["orderHistory", "tradeHistory", "positionHistory", "transactionHistory"].includes(item.dataset) && item.completeness !== "complete");
    message.value = `已写入本地台账：订单历史 ${dataset.orderHistory.length}、交易历史 ${dataset.tradeHistory.length}、持仓历史 ${dataset.positionHistory.length}、资金流水 ${dataset.transactionHistory.length} 条。${corePartial ? "来源仍有归档缺口，请查看数据质量说明。" : ""}`;
    messageType.value = corePartial ? "warning" : "success";
  } catch (error) { message.value = error instanceof Error ? error.message : "导入失败"; messageType.value = "error"; }
  finally { busy.value = false; }
}
async function collect() {
  busy.value = true;
  branchList.value = [
    { label: "合约订单历史", status: "running", total: 0 },
    { label: "交易历史", status: "running", total: 0 },
    { label: "持仓历史", status: "running", total: 0 },
    { label: "资金流水", status: "running", total: 0 },
    { label: "账户与行情快照", status: "running", total: 0 },
  ];
  message.value = "正在准备后台采集页，四类历史与账户快照将并行采集。";
  messageType.value = "info";
  try {
    const response = await startBinanceCollection();
    if (!response.ok) throw new Error(response.error || "启动失败");
    message.value = "正在并行采集四类合约历史与账户快照，完成后自动写入本地台账。";
    for (let attempt = 0; attempt < 45; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
      const status = await getBinanceStatus<ExtensionStatus>();
      if (!status.ok || !status.status) continue;
      pending.value = status.status.pending;
      branchList.value = Object.values(status.status.collection?.branches || {});
      if (pending.value) {
        busy.value = false;
        await importPending();
        return;
      }
      if (!status.status.collection?.running && attempt > 5) throw new Error("后台采集未生成来源包，请确认币安合约页仍保持登录状态");
    }
    throw new Error("等待采集完成超时，请检查插件状态");
  }
  catch (error) { message.value = error instanceof Error ? error.message : "启动失败"; messageType.value = "error"; }
  finally { busy.value = false; }
}
async function discard() { busy.value = true; try { await discardBinanceStaging(); pending.value = false; message.value = "插件暂存已丢弃，本地历史台账不受影响。"; messageType.value = "info"; } finally { busy.value = false; } }
onMounted(async () => { try { await loadLocal(); await refreshStatus(); } catch (error) { message.value = error instanceof Error ? error.message : "初始化失败"; messageType.value = "warning"; } });
</script>

<style scoped>
.contract-review{display:grid;gap:18px}.hero{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding:22px;border:1px solid #e4e7ed;border-radius:10px;background:#f8fafc}.hero h2{margin:3px 0 8px}.hero p{margin:0;color:#606266}.eyebrow{color:#409eff!important;font-weight:700}.actions{display:flex;flex-wrap:wrap;justify-content:flex-end}.snapshot-import{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:14px 16px;border:1px solid #d9ecff;border-radius:9px;background:#f4f9ff}.snapshot-import p{margin:5px 0 0;color:#606266}.snapshot-import .el-button{flex:none}.branches{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.branch{display:grid;grid-template-columns:1fr auto;gap:4px 8px;padding:12px;border:1px solid #ebeef5;border-radius:8px;background:#f8fafc}.branch small{grid-column:1/-1;color:#909399}.summary-grid :deep(.el-card__body){display:flex;justify-content:space-between}.summary-grid strong{font-size:22px}.meta{margin:0;color:#909399}.history-range{margin:0;padding:10px 12px;border-radius:8px;background:#ecf5ff;color:#337ecc}.coverage{display:flex;flex-wrap:wrap;gap:8px}@media(max-width:1100px){.branches{grid-template-columns:repeat(2,1fr)}}@media(max-width:760px){.hero,.snapshot-import{flex-direction:column;align-items:flex-start}.actions{justify-content:flex-start}.branches,.summary-grid{grid-template-columns:1fr}}
</style>
