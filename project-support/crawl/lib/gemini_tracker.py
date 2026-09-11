from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
import time
from typing import Any


@dataclass
class BatchMetric:
    batch_index: int
    total_batches: int
    item_count: int
    duration_seconds: float
    status_code: int = 200
    prompt_tokens: int = 0
    candidates_tokens: int = 0
    total_tokens: int = 0
    cached_tokens: int = 0
    finish_reason: str = ""
    attempts: int = 1


class GeminiTracker:
    """Gemini API 调用全链路追踪与性能监控器。"""

    def __init__(self, task_name: str, model: str, total_items: int = 0) -> None:
        self.task_name = task_name
        self.model = model
        self.total_items = total_items
        self.start_time = time.monotonic()
        self.batch_metrics: list[BatchMetric] = []
        self.retry_count = 0
        self.failure_count = 0
        self.categories: Counter[str] = Counter()
        self.confidence_scores: list[float] = []
        self.custom_metrics: dict[str, Any] = {}

    def log_start(self, expected_batches: int | None = None) -> None:
        batch_info = f", 预计 {expected_batches} 批" if expected_batches else ""
        print(
            f"[{self.task_name}] 开始分析 {self.total_items} 条条目 (模型: {self.model}{batch_info})...",
            flush=True,
        )

    def log_batch_start(
        self,
        batch_index: int,
        total_batches: int,
        item_count: int,
        attempt: int = 1,
        max_attempts: int = 3,
        payload_bytes: int | None = None,
    ) -> float:
        attempt_str = f" (尝试 {attempt}/{max_attempts})" if max_attempts > 1 else ""
        size_str = f", 载荷约 {payload_bytes / 1024:.1f} KB" if payload_bytes is not None else ""
        print(
            f"[{self.task_name}] >>> [批次 {batch_index}/{total_batches}] 发送 {item_count} 条数据{size_str}{attempt_str}...",
            flush=True,
        )
        return time.monotonic()

    def log_batch_success(
        self,
        batch_index: int,
        total_batches: int,
        item_count: int,
        duration: float,
        response_body: dict[str, Any] | None = None,
        status_code: int = 200,
        attempts: int = 1,
        extra_info: str = "",
    ) -> BatchMetric:
        prompt_tokens = 0
        candidates_tokens = 0
        total_tokens = 0
        cached_tokens = 0
        finish_reason = "STOP"

        if isinstance(response_body, dict):
            usage = response_body.get("usageMetadata", {})
            if isinstance(usage, dict):
                prompt_tokens = int(usage.get("promptTokenCount") or 0)
                candidates_tokens = int(usage.get("candidatesTokenCount") or 0)
                total_tokens = int(usage.get("totalTokenCount") or 0)
                cached_tokens = int(usage.get("cachedContentTokenCount") or 0)

            candidates = response_body.get("candidates", [])
            if isinstance(candidates, list) and candidates and isinstance(candidates[0], dict):
                finish_reason = str(candidates[0].get("finishReason") or "STOP")

        speed_str = ""
        if duration > 0 and candidates_tokens > 0:
            speed = candidates_tokens / duration
            speed_str = f" ({speed:.1f} tok/s)"

        tokens_str = f"Token: 输入={prompt_tokens:,}, 输出={candidates_tokens:,}, 总计={total_tokens:,}{speed_str}"
        extra_str = f" | {extra_info}" if extra_info else ""

        print(
            f"[{self.task_name}] <<< [批次 {batch_index}/{total_batches}] 响应成功 (耗时 {duration:.2f}s, HTTP {status_code}) | {tokens_str} | finishReason={finish_reason}{extra_str}",
            flush=True,
        )

        metric = BatchMetric(
            batch_index=batch_index,
            total_batches=total_batches,
            item_count=item_count,
            duration_seconds=duration,
            status_code=status_code,
            prompt_tokens=prompt_tokens,
            candidates_tokens=candidates_tokens,
            total_tokens=total_tokens,
            cached_tokens=cached_tokens,
            finish_reason=finish_reason,
            attempts=attempts,
        )
        self.batch_metrics.append(metric)
        return metric

    def log_batch_retry(
        self,
        batch_index: int,
        total_batches: int,
        attempt: int,
        max_attempts: int,
        error: str | Exception,
        delay: float,
    ) -> None:
        self.retry_count += 1
        err_msg = str(error)
        print(
            f"[{self.task_name}] !!! [批次 {batch_index}/{total_batches}] 遇到异常 (第 {attempt}/{max_attempts} 次尝试): {err_msg}。将在 {delay:.1f}s 后重试...",
            flush=True,
        )

    def log_batch_split(self, batch_index: int, total_batches: int, left_count: int, right_count: int) -> None:
        print(
            f"[{self.task_name}] === [批次 {batch_index}/{total_batches}] 批次超时，对半拆分为 {left_count} 条与 {right_count} 条分别重试...",
            flush=True,
        )

    def record_failure(self) -> None:
        self.failure_count += 1

    def record_item_result(self, category: str | None = None, confidence: float | None = None) -> None:
        if category:
            self.categories[category] += 1
        if confidence is not None:
            self.confidence_scores.append(float(confidence))

    def record_custom_metric(self, key: str, value: Any) -> None:
        self.custom_metrics[key] = value

    def print_summary(self, title: str | None = None, degraded: bool = False, degraded_reason: str = "") -> None:
        total_elapsed = time.monotonic() - self.start_time
        total_prompt = sum(m.prompt_tokens for m in self.batch_metrics)
        total_candidates = sum(m.candidates_tokens for m in self.batch_metrics)
        total_tokens = sum(m.total_tokens for m in self.batch_metrics)
        total_cached = sum(m.cached_tokens for m in self.batch_metrics)
        total_api_time = sum(m.duration_seconds for m in self.batch_metrics)
        success_batches = len(self.batch_metrics)
        items_processed = sum(m.item_count for m in self.batch_metrics) or self.total_items

        avg_speed = (total_candidates / total_api_time) if total_api_time > 0 else 0.0
        avg_batch_time = (total_api_time / success_batches) if success_batches > 0 else 0.0
        avg_item_time = (total_elapsed / items_processed) if items_processed > 0 else 0.0

        if title:
            header = title
        elif degraded:
            header = f"Gemini 监控: {self.task_name} (规则兜底降级)"
        else:
            header = f"Gemini 追踪监控汇总: {self.task_name}"

        border = "=" * max(30, (76 - len(header)) // 2)
        print(f"\n{border} [{header}] {border}", flush=True)

        if degraded:
            print(f"模式说明: 规则兜底降级处理 (原因: {degraded_reason or '未配置或服务不可用'})", flush=True)
            print(f"条目统计: 输入 {self.total_items} 条 | 规则匹配完成 {items_processed} 条", flush=True)
            print(f"耗时统计: 本地规则匹配总耗时 {total_elapsed:.2f}s", flush=True)
        else:
            print(f"模型标识: {self.model}", flush=True)
            print(f"条目统计: 输入 {self.total_items} 条 | 实际完成 {items_processed} 条", flush=True)
            print(
                f"批次统计: 成功 {success_batches} 批 | 重试 {self.retry_count} 次 | 失败 {self.failure_count} 次",
                flush=True,
            )
            print(
                f"耗时分析: 总耗时 {total_elapsed:.2f}s (API 累计耗时 {total_api_time:.2f}s, 平均 {avg_batch_time:.2f}s/批, {avg_item_time:.3f}s/条)",
                flush=True,
            )
            print("Token 统计:", flush=True)
            print(f"  - 输入 (Prompt):     {total_prompt:>9,}", flush=True)
            print(f"  - 输出 (Candidates): {total_candidates:>9,}", flush=True)
            if total_cached > 0:
                print(f"  - 缓存 (Cached):     {total_cached:>9,}", flush=True)
            print(f"  - 合计 (Total):      {total_tokens:>9,}", flush=True)
            print(f"  - 平均生成速率:      {avg_speed:>9.1f} tok/s", flush=True)

            if self.confidence_scores:
                avg_conf = sum(self.confidence_scores) / len(self.confidence_scores)
                min_conf = min(self.confidence_scores)
                max_conf = max(self.confidence_scores)
                print(
                    f"置信度: 平均 {avg_conf:.2f} (最低 {min_conf:.2f}, 最高 {max_conf:.2f})",
                    flush=True,
                )

        if self.categories:
            print("分类分布:", flush=True)
            for cat, count in self.categories.most_common():
                pct = (count / items_processed * 100) if items_processed > 0 else 0
                print(f"  - {cat}: {count} ({pct:.1f}%)", flush=True)

        if self.custom_metrics:
            print("业务指标:", flush=True)
            for k, v in self.custom_metrics.items():
                print(f"  - {k}: {v}", flush=True)

        print("=" * (len(border) * 2 + len(header) + 4), flush=True)

    def to_dict(self) -> dict[str, Any]:
        total_elapsed = time.monotonic() - self.start_time
        total_prompt = sum(m.prompt_tokens for m in self.batch_metrics)
        total_candidates = sum(m.candidates_tokens for m in self.batch_metrics)
        total_tokens = sum(m.total_tokens for m in self.batch_metrics)
        total_cached = sum(m.cached_tokens for m in self.batch_metrics)
        total_api_time = sum(m.duration_seconds for m in self.batch_metrics)
        success_batches = len(self.batch_metrics)
        items_processed = sum(m.item_count for m in self.batch_metrics) or self.total_items

        avg_speed = (total_candidates / total_api_time) if total_api_time > 0 else 0.0
        avg_batch_time = (total_api_time / success_batches) if success_batches > 0 else 0.0
        avg_item_time = (total_elapsed / items_processed) if items_processed > 0 else 0.0

        telemetry: dict[str, Any] = {
            "model": self.model,
            "totalItems": self.total_items,
            "processedItems": items_processed,
            "batches": {
                "success": success_batches,
                "retries": self.retry_count,
                "failures": self.failure_count,
            },
            "timing": {
                "totalDurationSeconds": round(total_elapsed, 2),
                "apiDurationSeconds": round(total_api_time, 2),
                "avgBatchSeconds": round(avg_batch_time, 2),
                "avgItemSeconds": round(avg_item_time, 3),
            },
            "tokens": {
                "prompt": total_prompt,
                "candidates": total_candidates,
                "cached": total_cached,
                "total": total_tokens,
                "speedTokPerSec": round(avg_speed, 1),
            },
        }
        if self.confidence_scores:
            telemetry["confidence"] = {
                "avg": round(sum(self.confidence_scores) / len(self.confidence_scores), 2),
                "min": round(min(self.confidence_scores), 2),
                "max": round(max(self.confidence_scores), 2),
            }
        return telemetry
