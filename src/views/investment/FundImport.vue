<template>
  <div class="fund-import">
    <el-card shadow="never" class="plugin-card">
      <template #header>
        <div class="card-head">
          <span>用浏览器插件采集数据</span>
          <el-tag type="primary" effect="plain" size="small">天天基金 · 主动采集 · 不存账号</el-tag>
        </div>
      </template>

      <div class="plugin-intro">
        登录天天基金后，用浏览器插件主动导出你的持仓数据为 <code>fund-data.json</code>，再到本页上传。
        插件只在你主动点击时读取当前页 DOM，不后台运行、不保存账号密码、不向任何服务器发送数据。
      </div>

      <div class="plugin-actions">
        <el-button type="primary" :icon="Download" @click="downloadPlugin">下载采集插件（zip）</el-button>
        <el-button text type="primary" :icon="Document" @click="goDocs">查看协议文档</el-button>
      </div>

      <el-alert
        v-if="pluginHint"
        class="plugin-hint"
        :type="pluginHint.type"
        :title="pluginHint.title"
        :description="pluginHint.desc"
        show-icon
        :closable="false"
      />

      <ol class="plugin-steps">
        <li>解压 zip，打开 <code>chrome://extensions</code>，开启「开发者模式」，「加载已解压的扩展程序」选择解压后的目录。</li>
        <li>登录天天基金，进入「我的资产 - 持仓」（类似 <code>trade.1234567.com.cn/myAssets/hold</code>）。</li>
        <li>点击工具栏扩展图标「导出基金数据」（或页面右下角浮动按钮），浏览器下载 <code>fund-data.json</code>。</li>
        <li>回到本页，将 <code>fund-data.json</code> 拖入下方导入区。</li>
      </ol>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-head">
          <span>导入基金数据</span>
          <el-tag type="success" effect="plain" size="small">纯前端 · 不上传服务器</el-tag>
        </div>
      </template>

      <el-upload
        drag
        :auto-upload="false"
        :show-file-list="false"
        accept=".json,application/json"
        :on-change="onChange"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将 fund-data.json 拖到此处，或<em>点击选择文件</em></div>
        <template #tip>
          <div class="el-upload__tip">
            仅支持 fund-data.json 标准协议文件；数据保存在浏览器 localStorage。
          </div>
        </template>
      </el-upload>

      <div class="actions">
        <el-button :icon="Download" @click="useExample">加载示例数据</el-button>
        <el-button :icon="Document" @click="goDocs">查看协议文档</el-button>
      </div>

      <el-alert
        v-if="result && !result.ok"
        class="alert"
        type="error"
        :title="'数据校验未通过'"
        :description="result.errors.join('；')"
        show-icon
        :closable="false"
      />
      <el-alert
        v-if="result && result.ok"
        class="alert"
        type="success"
        title="导入成功"
        :description="`已解析 ${result.data?.holdings.length ?? 0} 只基金、${result.data?.transactions.length ?? 0} 条交易，即将跳转资产总览。`"
        show-icon
        :closable="false"
      />
    </el-card>

    <el-card shadow="never" class="proto">
      <template #header>协议字段说明</template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="version">协议版本，如 "1.0"</el-descriptions-item>
        <el-descriptions-item label="updateTime">数据更新时间 YYYY-MM-DD</el-descriptions-item>
        <el-descriptions-item label="account">账户总览：totalAsset / totalProfit / profitRate</el-descriptions-item>
        <el-descriptions-item label="holdings">持仓数组：code/name/amount/profit/profitRate/ratio</el-descriptions-item>
        <el-descriptions-item label="transactions">交易数组：date/type/fundCode/fundName/amount</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-dialog v-model="docsVisible" title="基金数据协议文档" width="80%" top="6vh" destroy-on-close>
      <MarkdownRawContent :content="protocolMdRaw" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { UploadFilled, Download, Document } from "@element-plus/icons-vue";
import type { UploadFile } from "element-plus";
import { parseFundFile } from "../../utils/fund/fund-parser";
import { saveFundData } from "../../utils/fund/fund-storage";
import type { ValidationResult } from "../../utils/fund/fund-schema";
// 协议文档以原始字符串打入 bundle（?raw），用 MarkdownRawContent 在页内渲染。
// 避免直接 window.open('/docs/...md')：dev 因静态返回无 charset 会乱码，prod docs/ 不进 dist 会 404。
import protocolMdRaw from "../../../docs/investment-assistant.md?raw";
import MarkdownRawContent from "../home/findJob/MarkdownRawContent.vue";

const router = useRouter();
const result = ref<ValidationResult | null>(null);
const docsVisible = ref(false);

// 插件下载入口：dev 模式实时打包本地 extension 源码为 zip，prod 模式指向 GitHub Release 资产。
// 线上 Release 需先按 docs/investment-assistant.md 发布并上传 lptff-investment-assistant.zip，否则链接会 404。
const isDev = import.meta.env.DEV;
const RELEASE_URL =
  "https://github.com/LPTFF/lptff.github.io/releases/latest/download/lptff-investment-assistant.zip";
const pluginHint = ref<{ type: "success" | "info" | "warning" | "error"; title: string; desc: string } | null>(null);

function downloadPlugin() {
  if (isDev) {
    pluginHint.value = {
      type: "success",
      title: "正在打包本地扩展源码",
      desc: "已触发 dev 服务实时打包 extension 目录，浏览器即将开始下载 lptff-investment-assistant.zip。",
    };
    window.location.href = "/__extension_download__";
  } else {
    pluginHint.value = {
      type: "info",
      title: "跳转 GitHub Release 下载",
      desc: "线上版本从 GitHub Release 获取已发布 zip；若链接 404，请先按协议文档发布 Release 并上传资产。",
    };
    window.open(RELEASE_URL, "_blank");
  }
}

async function onChange(file: UploadFile) {
  if (!file.raw) return;
  try {
    const r = await parseFundFile(file.raw);
    result.value = r;
    if (r.ok && r.data) {
      saveFundData(r.data);
      ElMessage.success("导入成功");
      setTimeout(() => router.push("/investment"), 600);
    } else if (r.data) {
      // 非阻断性错误也保存归一化后的数据，便于用户继续查看
      saveFundData(r.data);
      ElMessage.warning("数据已部分识别，请检查提示");
    } else {
      ElMessage.error("无法解析该文件");
    }
  } catch (e) {
    ElMessage.error(`导入失败：${(e as Error).message}`);
  }
}

async function useExample() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}fund/sample-fund-data.json`);
    const json = await res.json();
    const text = JSON.stringify(json, null, 2);
    // 复用解析流程
    const { parseFundJson } = await import("../../utils/fund/fund-parser");
    const r = parseFundJson(text);
    result.value = r;
    if (r.data) {
      saveFundData(r.data);
      ElMessage.success("示例数据已加载");
      setTimeout(() => router.push("/investment"), 500);
    }
  } catch (e) {
    ElMessage.error(`加载示例失败：${(e as Error).message}`);
  }
}

function goDocs() {
  docsVisible.value = true;
}
</script>

<style scoped>
.fund-import {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.plugin-intro {
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.7;
}
.plugin-intro code,
.plugin-steps code {
  background: var(--el-fill-color-light);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-color-primary);
}
.plugin-actions {
  margin-top: 14px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.plugin-hint {
  margin-top: 14px;
}
.plugin-steps {
  margin: 14px 0 0;
  padding-left: 20px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.9;
}
.actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.alert {
  margin-top: 16px;
}
</style>