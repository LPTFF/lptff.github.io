<template>
  <el-dialog
    v-model="visible"
    title="我的空间 · 私人工作台入口"
    :width="dialogWidth"
    :append-to-body="true"
    class="private-portal-dialog"
  >
    <div class="portal-body">
      <el-alert
        title="独立私有系统安全说明"
        type="info"
        :closable="false"
        show-icon
        description="公开网站为纯静态托管，不存储您的私有记录或凭据。私人工作台运行在您的专属家庭服务器或本地电脑上，采用独立会话保护。"
      />

      <div class="form-section">
        <label class="form-label">工作台服务地址 (Origin)</label>
        <el-input
          v-model="portalUrl"
          placeholder="例如: http://127.0.0.1:8765/app/ 或 http://192.168.1.100:8765/app/"
          clearable
        >
          <template #append>
            <el-button @click="checkStatus" :loading="checking">检测连接</el-button>
          </template>
        </el-input>

        <!-- 快捷地址 -->
        <div class="quick-addresses">
          <span class="quick-label">快捷切换：</span>
          <el-tag size="small" class="quick-tag" @click="setPreset('http://127.0.0.1:8765/app/')">
            本机 (127.0.0.1:8765)
          </el-tag>
          <el-tag size="small" class="quick-tag" @click="promptLanIp">
            手机局域网直连 (Wi-Fi)
          </el-tag>
        </div>

        <div class="status-indicator">
          <span class="status-dot" :class="connectionStatus"></span>
          <span class="status-text">{{ statusMessage }}</span>
        </div>

        <!-- 离线时的友好启动指引 -->
        <div v-if="connectionStatus === 'offline'" class="server-help-box">
          <div class="help-title">💡 提示：本地服务未启动？</div>
          <div class="help-desc">请在电脑上双击工作目录下的 <code>启动我的空间.bat</code>，或在终端执行：</div>
          <div class="command-row">
            <code class="command-code">python tools/private-platform/platform-cli.py serve</code>
            <el-button size="small" type="primary" link @click="copyCommand">
              {{ copied ? "已复制！" : "复制命令" }}
            </el-button>
          </div>
        </div>
      </div>

      <div class="feature-notes">
        <h4>架构设计与访问规则：</h4>
        <ul>
          <li><strong>首要模式（局域网直连）</strong>：电脑与手机在同一 Wi-Fi 或 Tailscale 组网下直接通信，零延迟、零云端成本、数据物理不出网。</li>
          <li><strong>中继服务仅为备用</strong>：云主机零知识中继仅用于外出且无 VPN 时的应急访问，日常使用<strong>不是必选项</strong>。</li>
          <li><strong>双重强认证</strong>：重要发布与关键修改支持手机 WebAuthn / Passkey 生物识别二次断言。</li>
        </ul>
      </div>

      <div class="export-section">
        <h4>本机历史数据迁移</h4>
        <p class="export-hint">
          如果您此前在本机浏览器（localStorage）中保存了资讯分析或复盘状态，可在此导出为标准数据包，用于导入家庭私有平台。
        </p>
        <el-button size="small" type="primary" plain @click="exportLocalStorageData">
          导出本机浏览器数据包 (.json)
        </el-button>
        <span v-if="exportMsg" class="export-msg">{{ exportMsg }}</span>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="enterPortal">
          进入我的空间
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { ElDialog, ElButton, ElInput, ElAlert, ElTag } from "element-plus";
import { exportBrowserDataPackage } from "../utils/browserDataMigration";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const dialogWidth = computed(() => {
  if (typeof window !== "undefined" && window.innerWidth < 580) {
    return "92%";
  }
  return "560px";
});

const DEFAULT_URL = "http://127.0.0.1:8765/app/";
const STORAGE_KEY = "lptff-private-portal-url";

const portalUrl = ref(DEFAULT_URL);
const checking = ref(false);
const connectionStatus = ref<"unknown" | "online" | "offline">("unknown");
const statusMessage = ref("未检测服务状态");
const exportMsg = ref("");
const copied = ref(false);

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && saved.trim()) {
    portalUrl.value = saved.trim();
  }
});

watch(visible, (newVal) => {
  if (newVal) {
    checkStatus();
  }
});

const saveUrl = () => {
  if (portalUrl.value.trim()) {
    localStorage.setItem(STORAGE_KEY, portalUrl.value.trim());
  }
};

const setPreset = (url: string) => {
  portalUrl.value = url;
  checkStatus();
};

const promptLanIp = () => {
  const currentOrigin = portalUrl.value.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  const defaultVal = currentOrigin !== "127.0.0.1" && currentOrigin !== "localhost" ? currentOrigin : "192.168.1.";
  const ip = window.prompt("请输入电脑在局域网中的 IP 地址 (例如 192.168.1.100)：", defaultVal);
  if (ip && ip.trim()) {
    portalUrl.value = `http://${ip.trim()}:8765/app/`;
    checkStatus();
  }
};

const copyCommand = async () => {
  try {
    await navigator.clipboard.writeText("python tools/private-platform/platform-cli.py serve");
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    copied.value = false;
  }
};

const checkStatus = async () => {
  checking.value = true;
  saveUrl();
  try {
    const target = new URL(portalUrl.value);
    const healthUrl = `${target.origin}/api/health`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const resp = await fetch(healthUrl, {
      method: "GET",
      mode: "cors",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (resp.ok) {
      connectionStatus.value = "online";
      statusMessage.value = "服务在线已连接 (HTTP 200)";
    } else {
      connectionStatus.value = "online";
      statusMessage.value = `服务在线 (状态码 ${resp.status})`;
    }
  } catch (err: any) {
    // Fallback: try ping or no-cors
    try {
      const target = new URL(portalUrl.value);
      const pingUrl = `${target.origin}/api/ping`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      await fetch(pingUrl, { method: "GET", mode: "no-cors", signal: controller.signal });
      clearTimeout(timer);
      connectionStatus.value = "online";
      statusMessage.value = "服务在线已响应网络请求";
    } catch {
      connectionStatus.value = "offline";
      statusMessage.value = "无法连接服务（可能服务未启动或网络不通）";
    }
  } finally {
    checking.value = false;
  }
};

const enterPortal = () => {
  saveUrl();
  const url = portalUrl.value.trim() || DEFAULT_URL;
  window.open(url, "_blank", "noopener,noreferrer");
  visible.value = false;
};

const exportLocalStorageData = () => {
  try {
    const pkg = exportBrowserDataPackage();
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lptff-browser-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    exportMsg.value = `已导出 ${pkg.summary.total_records} 条本地记录与分析`;
  } catch (err: any) {
    exportMsg.value = `导出失败: ${err?.message || "未知错误"}`;
  }
};
</script>

<style scoped>
.portal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.quick-addresses {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  flex-wrap: wrap;
}

.quick-label {
  color: #909399;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.quick-tag:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-top: 2px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #909399;
}

.status-dot.online {
  background-color: #67c23a;
}

.status-dot.offline {
  background-color: #f56c6c;
}

.status-text {
  color: #606266;
}

.server-help-box {
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12px;
  color: #606266;
  margin-top: 6px;
}

.help-title {
  font-weight: 600;
  color: #f56c6c;
  margin-bottom: 4px;
}

.help-desc {
  margin-bottom: 6px;
  color: #5a5e66;
}

.help-desc code {
  background: #faecd8;
  color: #e6a23c;
  padding: 1px 5px;
  border-radius: 4px;
}

.command-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.command-code {
  font-family: monospace;
  font-size: 12px;
  color: #303133;
  flex: 1;
}

.feature-notes {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.feature-notes h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #1e293b;
}

.feature-notes ul {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #475569;
  line-height: 1.6;
}

.export-section {
  border-top: 1px dashed #e2e8f0;
  padding-top: 12px;
}

.export-section h4 {
  margin: 0 0 4px 0;
  font-size: 13px;
  color: #1e293b;
}

.export-hint {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 8px 0;
}

.export-msg {
  margin-left: 12px;
  font-size: 12px;
  color: #67c23a;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:global(.private-portal-dialog) {
  max-width: 94vw !important;
  margin-top: 5vh !important;
}

@media (max-width: 580px) {
  :global(.private-portal-dialog .el-dialog__body) {
    padding: 12px 14px !important;
  }
}
</style>
