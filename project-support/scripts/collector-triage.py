"""Read-only triage of run_collectors --summary output; no network or credentials."""
import argparse
import hashlib
import json
import math
import sys
import time
from pathlib import Path


NAMES = set('welfare infzm juejin weibo douyinHot xiaohongshu githubTrending 52pojie meituanTech v2ex 0818tuan 0818tuanTop zhuanyes zhuanyesTop daydayzhuan daydayzhuanTop zhujiceping xianyu keywordSearch douban leetCode zhipin kuaishou tiktok'.split())
STATES = {'success', 'preserved', 'skipped', 'failed'}


def number(value):
    return value if type(value) in (int, float) and math.isfinite(value) and value >= 0 else None


def count(value):
    return value if type(value) is int and value >= 0 else None


def diagnose(row):
    state = row.get('state')
    attempts = row.get('aiAttempts', [])
    if not isinstance(attempts, list):
        attempts = []
    codes = sorted({a['httpStatus'] for a in attempts if isinstance(a, dict)
                    and type(a.get('httpStatus')) is int and 100 <= a['httpStatus'] <= 599})
    stages = row.get('stages', [])
    if not isinstance(stages, list):
        stages = []
    stages = [s for s in stages if isinstance(s, dict)
              and s.get('stage') in ('source', 'ai') and s.get('outcome') in ('started', 'success')]
    last_stage = stages[-1]['stage'] + ':' + stages[-1]['outcome'] if stages else '未知'
    timed_out = row.get('timedOut') is True
    if timed_out:
        finding = '总限时触发；具体阻塞原因未知'
        action = '核对最后阶段与内外层预算；缺阶段证据时补日志'
    elif state == 'success':
        finding = '采集器报告成功；未证明页面、新鲜度或优惠有效'
        action = '按需核对最终页面与准入内容'
    elif 401 in codes or 403 in codes:
        finding = '请求被拒绝；不等于密钥失效'
        action = '人工核对权限、配置和服务限制，避免盲目重试'
    elif any(c == 429 or 500 <= c <= 599 for c in codes):
        finding = '观察到限流或服务错误；具体根因未知'
        action = '比较后续同名采集结果，核对有限重试预算'
    elif state == 'skipped':
        finding = '本轮跳过；未证明更新'
        action = '核对来源可用性和运行前提'
    else:
        finding = '本轮未成功；证据不足以定位原因'
        action = '补同轮阶段和状态码，保留现场'
    before, after = count(row.get('previousItemCount')), count(row.get('itemCount'))
    if state == 'preserved' and row.get('changed') is False:
        impact = '摘要报告保留旧快照；不代表重新确认有效'
    elif before is not None and before > 0 and after == 0:
        impact = '条数由非空变为空；需要核查，不能直接认定数据丢失'
    else:
        impact = '仅有计数；内容变化与质量需另查'
    return {
        'state': state, 'durationSeconds': number(row.get('durationSeconds')),
        'previousItemCount': before, 'itemCount': after, 'httpStatuses': codes,
        'lastStage': last_stage, 'finding': finding, 'impact': impact, 'nextAction': action,
    }


def read_summary(path):
    raw = path.read_bytes()
    if len(raw) > 5_000_000:
        raise ValueError('摘要超过 5 MB')
    data = json.loads(raw)
    if not isinstance(data, dict) or data.get('version') != 2 or not isinstance(data.get('collectors'), list):
        raise ValueError('仅支持 version=2 的 run_collectors 摘要')
    rows = data['collectors']
    if not rows or len(rows) > 100:
        raise ValueError('摘要必须有 1–100 条采集结果')
    names = set()
    for row in rows:
        if not isinstance(row, dict) or row.get('state') not in STATES:
            raise ValueError('结果状态缺失或非法')
        name = row.get('name')
        if not isinstance(name, str) or name in names:
            raise ValueError('采集器名称缺失或重复')
        names.add(name)
    return rows, hashlib.sha256(raw).hexdigest()


def build_report(paths):
    runs = []
    previous = {}
    for position, path in enumerate(paths, 1):
        rows, fingerprint = read_summary(path)
        results = []
        current = {}
        for index, row in enumerate(rows, 1):
            name = row['name']
            result = diagnose(row)
            result['name'] = name if name in NAMES else f'未识别采集器-{index}'
            old = previous.get(name)
            result['comparison'] = '无紧邻前份同名结果，不能判断趋势'
            if old is not None:
                result['comparison'] = f"前份 {old['state']} → 本份 {row['state']}；仅比较采集状态"
            results.append(result)
            current[name] = row
        runs.append({'inputOrder': position, 'inputSha256': fingerprint, 'collectors': results})
        previous = current
    return {'scope': 'LOCAL_SUMMARY_ONLY',
            'ordering': '输入顺序由调用者声明为旧到新；摘要不含可靠运行时间，工具无法验证先后',
            'unknowns': ['未读取线上运行、部署和页面', '未验证密钥有效性、优惠有效性或内容质量'],
            'runs': runs}


def markdown(report):
    lines = ['# 采集告警证据摘要', '', report['ordering'], '',
             '范围：仅本地摘要分析。输入未包含的事实保持未知。', '']
    for run in report['runs']:
        lines += [f"## 输入 {run['inputOrder']}", '', f"SHA256：{run['inputSha256']}", '',
                  '| 采集器 | 状态 | 秒 | 条数 前→后 | HTTP | 最后阶段 |',
                  '|---|---|---:|---|---|---|']
        for r in run['collectors']:
            show = lambda v: '未知' if v is None else str(v)
            lines.append(f"| {r['name']} | {r['state']} | {show(r['durationSeconds'])} | {show(r['previousItemCount'])} → {show(r['itemCount'])} | {r['httpStatuses'] or '未知'} | {r['lastStage']} |")
        for r in run['collectors']:
            lines += ['', f"**{r['name']}**：{r['finding']}。{r['impact']}。", '',
                      f"下一步：{r['nextAction']}。{r['comparison']}。"]
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--summary', type=Path, action='append', required=True, help='可重复；调用者保证按旧到新排列')
    parser.add_argument('--format', choices=('markdown', 'json'), default='markdown')
    args = parser.parse_args()
    started = time.perf_counter()
    try:
        report = build_report(args.summary)
    except (OSError, ValueError, TypeError, KeyError):
        print('无法分析：输入缺失、格式不支持或字段非法；原始内容未回显。', file=sys.stderr)
        return 2
    report['processingMilliseconds'] = round((time.perf_counter() - started) * 1000, 3)
    print(json.dumps(report, ensure_ascii=False, indent=2) if args.format == 'json' else markdown(report), end='\n')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
