<template>
  <div class="value-feedback-widget">
    <div v-if="!submitted" class="feedback-inner">
      <span class="feedback-label">💡 这项功能对您当前任务是否有帮助？</span>
      <div class="feedback-actions">
        <button
          type="button"
          class="feedback-btn"
          :class="{ active: selectedFeedback === 'helpful' }"
          @click="selectFeedback('helpful')"
        >
          👍 有帮助
        </button>
        <button
          type="button"
          class="feedback-btn"
          :class="{ active: selectedFeedback === 'unhelpful' }"
          @click="selectFeedback('unhelpful')"
        >
          👎 无帮助
        </button>
        <button
          type="button"
          class="feedback-btn"
          :class="{ active: selectedFeedback === 'not_needed_now' }"
          @click="selectFeedback('not_needed_now')"
        >
          ⚪ 当前不需要
        </button>
      </div>

      <div v-if="selectedFeedback" class="obstruction-row">
        <span class="obstruction-label">缺少它是否阻碍当前任务？</span>
        <select v-model="selectedObstruction" class="obstruction-select">
          <option value="unknown">未指明</option>
          <option value="blocking">严重阻碍（无替代或替代成本极高）</option>
          <option value="minor_inconvenience">轻微不便（有其他容易替代的方法）</option>
          <option value="not_blocking">不阻碍（仅作为参考浏览）</option>
        </select>
        <button type="button" class="submit-btn" @click="handleSubmit">
          提交反馈
        </button>
      </div>
    </div>

    <div v-else class="feedback-thank">
      <span>✓ 感谢您的客观反馈，已在本机脱敏记录。</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { recordValueFeedback } from "../utils/observation";
import type { FeatureId, ValueFeedbackType, ObstructionLevel } from "../utils/observation";

const props = defineProps<{
  featureId: FeatureId;
}>();

const submitted = ref(false);
const selectedFeedback = ref<ValueFeedbackType | null>(null);
const selectedObstruction = ref<ObstructionLevel>("unknown");

function selectFeedback(type: ValueFeedbackType) {
  selectedFeedback.value = type;
}

function handleSubmit() {
  if (!selectedFeedback.value) return;
  recordValueFeedback(props.featureId, selectedFeedback.value, selectedObstruction.value);
  submitted.value = true;
}
</script>

<style scoped>
.value-feedback-widget {
  margin: 16px 0;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #334155;
}

.feedback-inner {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feedback-label {
  font-weight: 500;
  color: #1e293b;
}

.feedback-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.feedback-btn {
  padding: 4px 12px;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.feedback-btn:hover {
  border-color: #3b82f6;
  color: #1d4ed8;
}

.feedback-btn.active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
  font-weight: 600;
}

.obstruction-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.obstruction-label {
  font-size: 12px;
  color: #64748b;
}

.obstruction-select {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #334155;
}

.submit-btn {
  padding: 4px 12px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.submit-btn:hover {
  background: #1d4ed8;
}

.feedback-thank {
  color: #059669;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
