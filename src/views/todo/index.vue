<template>
  <div class="todo-page">
    <header class="todo-intro-header">
      <div class="intro-badge">公开待办</div>
      <p class="intro-desc">
        lptff.github.io 与 qinglongBackup 共同承载个人网站，业务数据与运行逻辑依赖家庭服务器。这里只展示尚未完成且已经确认需要推进的事项；已结案内容及长期取舍不重复作为公开待办。公开页不展示密码、令牌等内部凭据。
      </p>
      <div class="stats-bar" role="region" aria-label="待办概览统计">
        <div class="stat-pill">
          <span class="stat-label">总任务</span>
          <span class="stat-value">{{ allTasks.length }}</span>
        </div>
        <div class="stat-pill success">
          <span class="stat-label">现在可做</span>
          <span class="stat-value">{{ countByGroup("现在可做") }}</span>
        </div>
        <div class="stat-pill warning">
          <span class="stat-label">待现场处理</span>
          <span class="stat-value">{{ countByGroup("待现场处理") }}</span>
        </div>
        <div class="stat-pill primary">
          <span class="stat-label">待决定</span>
          <span class="stat-value">{{ countByGroup("待决定") }}</span>
        </div>
      </div>
    </header>

    <div v-if="allTasks.length === 0" class="all-clear" role="status">
      <div class="all-clear-title">当前没有未完成事项</div>
      <p>现有待办已经完成或作出明确取舍；后续只有出现经过确认的新需求时才会重新加入。</p>
    </div>

    <div v-else class="todo-groups">
      <section
        v-for="grp in groupConfigs"
        :key="grp.key"
        class="group-section"
        :aria-labelledby="`group-title-${grp.key}`"
      >
        <div class="group-header">
          <div class="group-title-row">
            <el-tag :type="grp.tagType" effect="dark" class="group-tag" round>
              {{ grp.title }}
            </el-tag>
            <h2 :id="`group-title-${grp.key}`" class="group-title">
              {{ grp.title }}
            </h2>
            <span class="group-count">({{ countByGroup(grp.key) }})</span>
          </div>
          <p class="group-desc">{{ grp.desc }}</p>
        </div>

        <div class="task-list">
          <article
            v-for="task in getTasks(grp.key)"
            :key="task.id"
            class="task-card"
            :aria-label="`${task.id} ${task.title}`"
          >
            <div class="task-head">
              <div class="task-primary-info">
                <span class="task-id-badge">{{ task.id }}</span>
                <h3 class="task-title">{{ task.title }}</h3>
              </div>
              <div class="task-tags">
                <el-tag size="small" effect="plain" type="info" class="domain-tag">
                  {{ task.domain }}
                </el-tag>
                <el-tag
                  size="small"
                  :type="getStatusTagType(task.status)"
                  effect="light"
                  class="status-tag"
                >
                  {{ task.status }}
                </el-tag>
              </div>
            </div>
            <div class="task-body">
              <div class="criteria-row">
                <span class="criteria-label">完成条件：</span>
                <span class="criteria-text">{{ task.criteria }}</span>
              </div>
              <a v-if="task.sourceUrl" :href="task.sourceUrl" target="_blank" rel="noopener noreferrer">参考来源（内容待核实）</a>
            </div>
          </article>

          <div
            v-if="getTasks(grp.key).length === 0"
            class="empty-tip"
          >
            该分组暂无任务
          </div>

        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElTag } from "element-plus";
import rawTasks from "../../data/todoTasks.json";

export interface TodoTask {
  id: string;
  title: string;
  group: "现在可做" | "待现场处理" | "待决定";
  domain: string;
  status: "待处理" | "待现场处理" | "进行中";
  order: number;
  criteria: string;
  sourceUrl?: string;
}

const allTasks: TodoTask[] = (rawTasks as TodoTask[]).slice().sort((a, b) => a.order - b.order);

const groupConfigs = [
  {
    key: "现在可做" as const,
    title: "现在可做",
    desc: "当前开发环境和异地运维入口已具备条件，可直接推进的事项",
    tagType: "success" as const,
  },
  {
    key: "待现场处理" as const,
    title: "待现场处理",
    desc: "仍需要家庭路由器、个人设备、账户控制权或其他现场条件的事项",
    tagType: "warning" as const,
  },
  {
    key: "待决定" as const,
    title: "待决定",
    desc: "结合真实使用情况决定范围；记录待办不代表自动恢复旧模块、注册账户或付费投放",
    tagType: "primary" as const,
  },
];

function countByGroup(groupKey: "现在可做" | "待现场处理" | "待决定") {
  return allTasks.filter((t) => t.group === groupKey).length;
}

function getTasks(groupKey: "现在可做" | "待现场处理" | "待决定") {
  return allTasks.filter((t) => t.group === groupKey);
}

function getStatusTagType(status: TodoTask["status"]): "info" | "warning" | "success" | "primary" | "danger" {
  switch (status) {
    case "待处理":
      return "info";
    case "待现场处理":
      return "warning";
    case "进行中":
      return "primary";
    default:
      return "info";
  }
}
</script>

<style scoped>
.todo-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px 48px;
  box-sizing: border-box;
}

.todo-intro-header {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-light, #ebeef5);
}

.intro-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  background-color: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
}

.intro-desc {
  margin: 0 0 16px;
  color: #606266;
  font-size: 14px;
  line-height: 1.7;
}

.stats-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  font-size: 13px;
  color: #606266;
  transition: all 0.2s ease;
  user-select: none;
}

.stat-label {
  font-weight: 500;
}

.stat-value {
  font-weight: 700;
  font-size: 14px;
  color: #303133;
}

.stat-pill.success .stat-value {
  color: var(--el-color-success, #67c23a);
}

.stat-pill.warning .stat-value {
  color: var(--el-color-warning, #e6a23c);
}

.stat-pill.primary .stat-value {
  color: var(--el-color-primary, #409eff);
}

.stat-pill.info .stat-value {
  color: #909399;
}

.todo-groups {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.all-clear {
  padding: 32px 24px;
  text-align: center;
  color: #606266;
  background: var(--el-color-success-light-9, #f0f9eb);
  border: 1px solid var(--el-color-success-light-7, #c2e7b0);
  border-radius: 10px;
}

.all-clear-title {
  margin-bottom: 8px;
  color: var(--el-color-success-dark-2, #529b2e);
  font-size: 18px;
  font-weight: 700;
}

.all-clear p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
}

.group-section {
  background: transparent;
}

.group-header {
  margin-bottom: 14px;
}

.group-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-tag {
  font-size: 12px;
  font-weight: 600;
}

.group-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.group-count {
  font-size: 14px;
  color: #909399;
  font-weight: normal;
}

.group-desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  padding: 16px 18px;
  border-radius: 8px;
  background-color: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color-light, #ebeef5);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  box-sizing: border-box;
}

.task-card:hover {
  border-color: var(--el-color-primary-light-5, #b3d8ff);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.08);
}

.task-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.task-primary-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.task-id-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 7px;
  border-radius: 4px;
  background-color: #f0f2f5;
  color: #606266;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.task-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.task-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.domain-tag {
  border-color: #e4e7ed;
}

.status-tag {
  font-weight: 500;
}

.task-body {
  border-top: 1px dashed var(--el-border-color-lighter, #f2f6fc);
  padding-top: 10px;
}

.criteria-row {
  display: flex;
  align-items: baseline;
  font-size: 13px;
  line-height: 1.6;
}

.criteria-label {
  color: #909399;
  flex-shrink: 0;
  font-weight: 500;
}

.criteria-text {
  color: #484b51;
}

.empty-tip {
  padding: 20px;
  text-align: center;
  font-size: 13px;
  color: #909399;
  background: #fafafa;
  border-radius: 6px;
  border: 1px dashed #e4e7ed;
}

@media screen and (max-width: 768px) {
  .todo-page {
    padding: 0 12px 36px;
  }

  .intro-desc {
    font-size: 13px;
  }

  .stats-bar {
    gap: 8px;
  }

  .stat-pill {
    padding: 4px 10px;
    font-size: 12px;
  }

  .group-title {
    font-size: 16px;
  }

  .task-card {
    padding: 12px 14px;
  }

  .task-head {
    gap: 8px;
    margin-bottom: 8px;
  }

  .task-title {
    font-size: 15px;
  }

  .criteria-row {
    flex-direction: column;
    gap: 2px;
  }
}
</style>
