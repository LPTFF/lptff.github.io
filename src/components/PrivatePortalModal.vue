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
          placeholder="例如: http://192.168.1.100:5800/app/ 或 http://127.0.0.1:8765/app/"
          clearable
        >
          <template #append>
            <el-button @click="checkStatus" :loading="checking">检测连接</el-button>
          </template>
        </el-input>

        <!-- 快捷地址 -->
        <div class="quick-addresses">
          <span class="quick-label">快捷切换：</span>
          <el-tag
            size="small"
            class="quick-tag"
            :type="isHomeServer ? 'primary' : 'info'"
            :effect="isHomeServer ? 'dark' : 'plain'"
            @click="setPreset('http://192.168.1.100:5800/app/')"
          >
            🏠 家庭服务器 (7×24h 常驻)
          </el-tag>
          <el-tag
            size="small"
            class="quick-tag"
            :type="isLocalhost ? 'primary' : 'info'"
            :effect="isLocalhost ? 'dark' : 'plain'"
            @click="setPreset('http://127.0.0.1:8765/app/')"
          >
            💻 本机开发 (按需手动启动)
          </el-tag>
          <el-tag
            size="small"
            class="quick-tag"
            type="info"
            effect="plain"
            @click="promptLanIp"
          >
            📱 局域网/Tailscale 自定义
          </el-tag>
        </div>

        <div class="status-indicator">
          <span class="status-dot" :class="connectionStatus"></span>
          <span class="status-text">{{ statusMessage }}</span>
          <el-button
            v-if="isHttpsToHttp"
            size="small"
            type="primary"
            link
            @click="testPingInNewTab"
            style="margin-left: 8px; font-size: 12px;"
          >
            在新标签页验证连通性
          </el-button>
        </div>

        <!-- 针对线上 HTTPS 访问本地/局域网 HTTP 的智能说明 -->
        <div v-if="isHttpsToHttp" class="mixed-content-box">
          <div class="mixed-title">🛡️ 浏览器跨协议（Mixed Content）安全机制说明</div>
          <div class="mixed-desc">
            当前页面运行在公网 HTTPS 环境中，浏览器安全机制禁止前端在后台静默向局域网或本地发起跨协议探测请求。
            <strong>这并非服务故障</strong>。
            <template v-if="!isLocalhost">
              家庭私有服务已在宿主机后台 <strong>7×24 小时常驻运行</strong>，只要您的设备与服务器处于同一 Wi-Fi 或已开启 Tailscale VPN，直接点击下方<strong>【进入我的空间】</strong>即可在新标签页正常直连打开！
            </template>
            <template v-else>
              若您已在电脑上手动运行了本地服务，直接点击下方<strong>【进入我的空间】</strong>即可在新标签页直连打开！
            </template>
          </div>
        </div>

        <!-- 针对离线状态的智能排障与启动指引 -->
        <div v-if="connectionStatus === 'offline'" class="server-help-box">
          <!-- 情况 1：针对家庭服务器或局域网环境 -->
          <template v-if="!isLocalhost">
            <div class="help-title">💡 提示：家庭服务器连接失败？</div>
            <div class="help-desc">
              家庭服务器（Ubuntu 24.04 LTS）默认已配置为 <strong>7×24 小时后台常驻守护服务</strong>，无需且不应在电脑上手动执行批处理。请按序排查：
            </div>
            <ul class="help-list">
              <li><strong>同一 Wi-Fi</strong>：确认电脑或手机当前已连接至家庭同一无线路由器局域网；</li>
              <li><strong>外出远程</strong>：若在室外或使用蜂窝网络，请确保已打开手机/电脑上的 Tailscale 或 VPN 异地组网；</li>
              <li><strong>宿主机状态</strong>：若网络正常仍无法打开，可在服务器执行 <code>systemctl status resource-collector.service</code> 检查服务状态。</li>
            </ul>
          </template>

          <!-- 情况 2：针对本机按需开发模式 (127.0.0.1 / localhost) -->
          <template v-else>
            <div class="help-title">💡 提示：本机开发服务未启动？</div>
            <div class="help-desc">
              本机模式用于个人电脑上的本地功能调试与人工接管，<strong>属于按需手动启动</strong>。请在电脑上双击 <code>全栈项目/启动我的空间.bat</code>，或在终端执行：
            </div>
            <div class="command-row">
              <code class="command-code">python qinglongBackup/tools/private-platform/platform-cli.py serve</code>
              <el-button size="small" type="primary" link @click="copyCommand">
                {{ copied ? "已复制！" : "复制命令" }}
              </el-button>
            </div>
          </template>
        </div>
      </div>

      <div class="feature-notes">
        <h4>架构设计与访问规则：</h4>
        <ul>
          <li><strong>首要模式（局域网直连）</strong>：家庭服务器（192.168.1.100:5800）常驻后台，手机与电脑在同一 Wi-Fi 或 Tailscale 组网下直接通信，零延迟、零云端成本、数据物理不出网。</li>
          <li><strong>本机开发模式</strong>：日常按需手动启动，仅用于本地环境演练、单机离线接管或代码开发。</li>
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

const HOME_SERVER_URL = "http://192.168.1.100:5800/app/";
const LOCAL_DEV_URL = "http://127.0.0.1:8765/app/";
const DEFAULT_URL = HOME_SERVER_URL;
const STORAGE_KEY = "lptff-private-portal-url";

const portalUrl = ref(DEFAULT_URL);
const checking = ref(false);
const connectionStatus = ref<"unknown" | "online" | "offline" | "notice">("unknown");
const statusMessage = ref("未检测服务状态");
const exportMsg = ref("");
const copied = ref(false);

const isHttpsPage = computed(() => {
  return typeof window !== "undefined" && window.location.protocol === "https:";
});

const isTargetHttp = computed(() => {
  try {
    const raw = portalUrl.value.trim();
    if (!raw) return false;
    const u = new URL(raw.startsWith("http") ? raw : `http://${raw}`);
    return u.protocol === "http:";
  } catch {
    return false;
  }
});

const isHttpsToHttp = computed(() => {
  return isHttpsPage.value && isTargetHttp.value;
});

const isLocalhost = computed(() => {
  try {
    const raw = portalUrl.value.trim();
    if (!raw) return false;
    const u = new URL(raw.startsWith("http") ? raw : `http://${raw}`);
    return u.hostname === "127.0.0.1" || u.hostname === "localhost" || u.hostname === "::1";
  } catch {
    return false;
  }
});

const isHomeServer = computed(() => {
  try {
    const raw = portalUrl.value.trim();
    if (!raw) return false;
    const u = new URL(raw.startsWith("http") ? raw : `http://${raw}`);
    return (u.hostname === "192.168.1.100" && (u.port === "5800" || !u.port)) || portalUrl.value.includes("192.168.1.100");
  } catch {
    return false;
  }
});

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  // If user previously had 127.0.0.1 default, upgrade them to the always-on home server
  if (saved && saved.trim() && saved.trim() !== LOCAL_DEV_URL) {
    portalUrl.value = saved.trim();
  } else {
    portalUrl.value = HOME_SERVER_URL;
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
  const currentOrigin = portalUrl.value.replace(/^https?:\/\//, "").split("/")[0];
  const defaultVal = currentOrigin !== "127.0.0.1:8765" && currentOrigin !== "localhost:8765" ? currentOrigin : "192.168.1.100:5800";
  const ip = window.prompt("请输入局域网直连或 Tailscale 虚拟 IP 与端口 (例如 192.168.1.100:5800 或 100.x.x.x:5800)：", defaultVal);
  if (ip && ip.trim()) {
    const clean = ip.trim();
    if (clean.includes(":")) {
      portalUrl.value = `http://${clean}/app/`;
    } else {
      portalUrl.value = `http://${clean}:5800/app/`;
    }
    checkStatus();
  }
};

const copyCommand = async () => {
  try {
    await navigator.clipboard.writeText("python qinglongBackup/tools/private-platform/platform-cli.py serve");
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    copied.value = false;
  }
};

const testPingInNewTab = () => {
  try {
    const raw = portalUrl.value.trim() || DEFAULT_URL;
    const target = new URL(raw.startsWith("http") ? raw : `http://${raw}`);
    window.open(`${target.origin}/api/ping`, "_blank", "noopener,noreferrer");
  } catch {
    // ignore
  }
};

const checkStatus = async () => {
  saveUrl();
  const rawUrl = portalUrl.value.trim();
  if (!rawUrl) {
    connectionStatus.value = "unknown";
    statusMessage.value = "请输入工作台服务地址";
    return;
  }

  let target: URL;
  try {
    target = new URL(rawUrl.startsWith("http") ? rawUrl : `http://${rawUrl}`);
  } catch {
    connectionStatus.value = "offline";
    statusMessage.value = "地址格式无效（请包含 http:// 或 https://）";
    return;
  }

  // 线上 HTTPS 页面访问本地/局域网 HTTP：现代浏览器禁止主动后台跨协议探测
  if (isHttpsPage.value && target.protocol === "http:") {
    connectionStatus.value = "notice";
    statusMessage.value = "线上 HTTPS 模式（可直接点击进入）";
    return;
  }

  checking.value = true;
  try {
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
  } catch {
    // Fallback: try ping or no-cors
    try {
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
  const raw = portalUrl.value.trim() || DEFAULT_URL;
  const url = raw.startsWith("http") ? raw : `http://${raw}`;
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
  flex-wrap: wrap;
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

.status-dot.notice {
  background-color: #e6a23c;
}

.status-text {
  color: #606266;
}

.mixed-content-box {
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
  line-height: 1.6;
}

.mixed-title {
  font-weight: 600;
  color: #e6a23c;
  margin-bottom: 4px;
}

.mixed-desc {
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

.help-list {
  margin: 6px 0 0 0;
  padding-left: 18px;
  color: #606266;
  font-size: 12px;
  line-height: 1.7;
}

.help-list li {
  margin-bottom: 3px;
}

.help-list code {
  background: #faecd8;
  color: #e6a23c;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
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
