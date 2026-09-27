<template>
  <div class="todo-page">
    <header class="todo-intro-header">
      <div class="intro-badge">公开待办</div>
      <p class="intro-desc">
        本页面列出当前个人项目与各仓库功能收敛的公开待办事项。展示内容均已脱敏，仅记录公开任务范围、状态与完成条件，不展示私有仓库地址、服务器位置、内部凭据或私人数据。
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
        <div class="stat-pill info">
          <span class="stat-label">已完成</span>
          <span class="stat-value">{{ completedCount }}</span>
        </div>
      </div>
    </header>

    <div class="todo-groups">
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
            v-for="task in getActiveTasks(grp.key)"
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
            </div>
          </article>

          <div
            v-if="getActiveTasks(grp.key).length === 0 && getCompletedTasks(grp.key).length === 0"
            class="empty-tip"
          >
            该分组暂无任务
          </div>

          <div
            v-if="getCompletedTasks(grp.key).length > 0"
            class="completed-collapse-wrapper"
          >
            <el-collapse class="completed-collapse">
              <el-collapse-item
                :title="`查看此分组已完成事项 (${getCompletedTasks(grp.key).length})`"
                :name="`completed-${grp.key}`"
              >
                <div class="task-list inner-completed">
                  <article
                    v-for="task in getCompletedTasks(grp.key)"
                    :key="task.id"
                    class="task-card is-completed"
                    :aria-label="`已完成任务 ${task.id} ${task.title}`"
                  >
                    <div class="task-head">
                      <div class="task-primary-info">
                        <span class="task-id-badge completed-badge">{{ task.id }}</span>
                        <h3 class="task-title line-through">{{ task.title }}</h3>
                      </div>
                      <div class="task-tags">
                        <el-tag size="small" effect="plain" type="info" class="domain-tag">
                          {{ task.domain }}
                        </el-tag>
                        <el-tag size="small" type="success" effect="light" class="status-tag">
                          已完成
                        </el-tag>
                      </div>
                    </div>
                    <div class="task-body">
                      <div class="criteria-row">
                        <span class="criteria-label">完成条件：</span>
                        <span class="criteria-text">{{ task.criteria }}</span>
                      </div>
                    </div>
                  </article>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElTag, ElCollapse, ElCollapseItem } from "element-plus";
import rawTasks from "../../data/todoTasks.json";

export interface TodoTask {
  id: string;
  title: string;
  group: "现在可做" | "待现场处理" | "待决定";
  domain: string;
  status: "待处理" | "待现场处理" | "进行中" | "已完成";
  order: number;
  criteria: string;
}

const allTasks: TodoTask[] = (rawTasks as TodoTask[]).slice().sort((a, b) => a.order - b.order);

const groupConfigs = [
  {
    key: "现在可做" as const,
    title: "现在可做",
    desc: "当前开发环境已具备核对与整理条件，可直接推进的功能收敛事项",
    tagType: "success" as const,
  },
  {
    key: "待现场处理" as const,
    title: "待现场处理",
    desc: "需在本地服务器实际运行环境核实版本、调度、数据备份与维护源的事项",
    tagType: "warning" as const,
  },
  {
    key: "待决定" as const,
    title: "待决定",
    desc: "需依据真实使用场景、维护成本与数据边界综合评估取舍的事项",
    tagType: "primary" as const,
  },
];

const completedCount = computed(() => {
  return allTasks.filter((t) => t.status === "已完成").length;
});

function countByGroup(groupKey: "现在可做" | "待现场处理" | "待决定") {
  return allTasks.filter((t) => t.group === groupKey && t.status !== "已完成").length;
}

function getActiveTasks(groupKey: "现在可做" | "待现场处理" | "待决定") {
  return allTasks.filter((t) => t.group === groupKey && t.status !== "已完成");
}

function getCompletedTasks(groupKey: "现在可做" | "待现场处理" | "待决定") {
  return allTasks.filter((t) => t.group === groupKey && t.status === "已完成");
}

function getStatusTagType(status: TodoTask["status"]): "info" | "warning" | "success" | "primary" | "danger" {
  switch (status) {
    case "待处理":
      return "info";
    case "待现场处理":
      return "warning";
    case "进行中":
      return "primary";
    case "已完成":
      return "success";
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

.is-completed {
  opacity: 0.75;
  background-color: #fafbfc;
}

.completed-badge {
  background-color: #e1f3d8;
  color: #67c23a;
}

.line-through {
  text-decoration: line-through;
  color: #909399;
}

.completed-collapse-wrapper {
  margin-top: 8px;
}

.completed-collapse {
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 6px;
  overflow: hidden;
}

.completed-collapse :deep(.el-collapse-item__header) {
  padding: 0 14px;
  font-size: 13px;
  color: #909399;
  background-color: #fdfdfd;
}

.completed-collapse :deep(.el-collapse-item__content) {
  padding: 12px;
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
