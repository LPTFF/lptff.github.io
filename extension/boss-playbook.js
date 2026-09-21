/* Script authority and handoffs are independent of daily reply counters. */
const BOSS_PLAYBOOK_KEY = "lptffBossPlaybook";
const BOSS_SCRIPT_VERSION = 2;
const BOSS_BASE_SCRIPTS = Object.freeze([
  { id: "resume_request", title: "按请求发送简历（已授权）", when: "招聘方明确索要简历或发送附件简历请求，且没有额外越界问题或冲突。", response: "执行 send_resume；使用 BOSS 已保存的简历或已选简历，不上传新文件。reply 留空，由页面执行并核实结果。" },
  { id: "contact_request", title: "按请求交换联系方式（已授权）", when: "招聘方明确提出交换微信、电话或联系方式，且没有额外越界问题或冲突。", response: "执行 agree_contact；仅使用 BOSS 原生联系方式交换入口，不猜测或编写号码，不访问站外链接。reply 留空，由页面执行并核实结果。" },
  { id: "profile", title: "已确认经历问答", when: "询问技能、学历或经历，且画像有直接明确答案。当前薪资不能用期望薪资代替。", response: "仅依据画像中的直接事实简洁回答，不扩写成果或推断任职状态。" },
  { id: "job_questions", title: "岗位信息分步了解", when: "招聘方介绍岗位、打招呼或回答此前问题，未提出剧本外要求或明确冲突条件。", response: "自然回应；从必须确认的问题中选一个尚未回答的问题追问；不重复追问，不接受新条件。" },
  { id: "preferences", title: "已确认求职偏好", when: "询问求职偏好或期望薪资，画像有明确答案，且不要求让步或承诺。", response: "准确陈述已确认的偏好和底线，不降低条件，不把期望说成当前待遇。" },
  { id: "availability", title: "一般面试意向", when: "只询问一般面试意向或常规可用时段，画像已有明确说明；不涉及具体日期时间或接受邀请。", response: "说明已有时段供对方参考；具体安排仍需本人确认。" },
]);
let bossPlaybookQueue = Promise.resolve();
function editBossPlaybook(work) {
  const run = bossPlaybookQueue.then(async () => {
    const book = await loadBossPlaybook();
    const result = await work(book);
    await chrome.storage.local.set({ [BOSS_PLAYBOOK_KEY]: book });
    return result;
  });
  bossPlaybookQueue = run.catch(() => {});
  return run;
}
async function loadBossPlaybook() {
  const stored = (await chrome.storage.local.get(BOSS_PLAYBOOK_KEY))[BOSS_PLAYBOOK_KEY] || {};
  return { version: BOSS_SCRIPT_VERSION, revision: Number(stored.revision) || 0,
    handoffs: stored.handoffs || {}, scripts: Array.isArray(stored.scripts) ? stored.scripts : [],
    candidates: (Array.isArray(stored.candidates) ? stored.candidates : []).filter(x => x.at > Date.now() - 30 * 864e5).slice(-100) };
}
function bossLearningText(value, limit = 1500) {
  return String(value || "").replace(/https?:\/\/\S+/g, "[链接]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[邮箱]")
    .replace(/\b\d{7,}\b/g, "[号码]")
    .replace(/(?:微信|手机号|电话|身份证|密码|验证码|token|api.?key)\s*[:：=]?\s*\S+/gi, "[私人信息]").slice(0, limit);
}
async function bossPlaybookAction(message, sender) {
  const key = String(message.key || "").slice(0, 100);
  if (message.type === "BOSS_AUTOPILOT_GET_PLAYBOOK") return { ok: true, book: await loadBossPlaybook(), baseScripts: BOSS_BASE_SCRIPTS };
  if (!key && /HANDOFF|RESUME|LEARN/.test(message.type)) throw new Error("尚未识别会话，不能改变托管状态");
  return editBossPlaybook(async book => {
    if (message.type === "BOSS_AUTOPILOT_HANDOFF") {
      if (!book.handoffs[key]) {
        book.handoffs[key] = { at: Date.now(), reason: bossLearningText(message.reason, 400), trigger: bossLearningText(message.trigger), baseline: String(message.baseline || "").slice(0, 100), tabId: sender.tab?.id, rowKey: String(message.rowKey || "").slice(0,160) };
        book.revision++;
        // Local notification only: no webhook or chat content leaves this browser.
        if (sender.tab?.id) {
          await chrome.action.setBadgeText({ tabId: sender.tab.id, text: "待接管" }).catch(() => {});
          await chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: "#b45309" }).catch(() => {});
          try {
            await chrome.notifications.create(`boss-handoff-${key}`, { type: "basic", iconUrl: chrome.runtime.getURL("boss-notification.png"), title: "BOSS 会话需要你接管", message: "助手已停止此会话的自动动作，请打开沟通页查看原因。" });
            book.handoffs[key].notification = "delivered";
          } catch { book.handoffs[key].notification = "panel-only"; }
        }
      }
    } else if (message.type === "BOSS_AUTOPILOT_RESUME") {
      delete book.handoffs[key]; book.revision++;
      await chrome.notifications.clear(`boss-handoff-${key}`).catch(() => {});
      if (sender.tab?.id && !Object.keys(book.handoffs).length) await chrome.action.setBadgeText({ tabId: sender.tab.id, text: "" }).catch(() => {});
    } else if (message.type === "BOSS_AUTOPILOT_LEARN") {
      const handoff = book.handoffs[key];
      if (!handoff || !message.fingerprint || message.fingerprint === handoff.baseline) return { ok: true, book };
      const response = bossLearningText(message.response);
      if (!response.trim()) return { ok: true, book };
      handoff.baseline = String(message.fingerprint).slice(0, 100);
      if (!book.candidates.some(x => x.key === key && x.response === response && x.when === handoff.trigger)) {
        book.candidates.push({ id: crypto.randomUUID(), key, at: Date.now(), title: "人工回复经验", when: bossLearningText(message.trigger || handoff.trigger), response, scope: key });
        book.candidates = book.candidates.slice(-100);
      }
    } else if (message.type === "BOSS_AUTOPILOT_APPROVE_SCRIPT") {
      const candidate = book.candidates.find(x => x.id === message.id);
      if (!candidate) throw new Error("候选已处理或过期");
      const when = bossLearningText(message.when, 1000).trim();
      const response = bossLearningText(message.response, 1500).trim();
      if (!when || !response) throw new Error("请填写适用条件与回复规则");
      if (book.scripts.length >= 100) throw new Error("剧本已达 100 条，请先停用不再需要的剧本");
      book.scripts.push({ id: `learned-${candidate.id}`, title: "已确认人工经验", when, response, scope: message.global === true ? "all" : candidate.key });
      book.candidates = book.candidates.filter(x => x.id !== candidate.id); book.revision++;
    } else if (message.type === "BOSS_AUTOPILOT_REJECT_SCRIPT") {
      book.candidates = book.candidates.filter(x => x.id !== message.id);
    } else if (message.type === "BOSS_AUTOPILOT_DISABLE_SCRIPT") {
      book.scripts = book.scripts.filter(x => x.id !== message.id); book.revision++;
    } else throw new Error("未知剧本操作");
    return { ok: true, book };
  });
}

chrome.notifications.onClicked.addListener(async id => {
  if (!id.startsWith("boss-handoff-")) return;
  const book = await loadBossPlaybook();
  const handoff = book.handoffs[id.slice("boss-handoff-".length)];
  if (handoff?.tabId) {
    try { await chrome.tabs.update(handoff.tabId, { active: true }); return; } catch { /* tab may have closed */ }
  }
  await chrome.tabs.create({ url: "https://www.zhipin.com/web/geek/chat" });
});

function enforceBossScript(result, scripts, config) {
  const script = scripts.find(x => x.id === result.scriptId);
  const evidence = Array.isArray(result.evidence) ? result.evidence : [];
  const validEvidence = evidence.length > 0 && evidence.every(x => typeof x === "string" && x.trim().length >= 2 && [config.profile, config.mustAsk, config.valuableCriteria, script?.when, script?.response].some(source => String(source || "").includes(x)));
  const allowed = script && validEvidence && result.inScope === true && result.allQuestionsCovered === true && result.missingFacts === false && result.newCommitment === false && result.conflict === false && result.needsHuman === false && result.stop === false && (["reply", "none"].includes(result.action) || result.action === "send_resume" && result.scriptId === "resume_request" || result.action === "agree_contact" && result.scriptId === "contact_request");
  if (!allowed) return { ...result, reply: "", action: "handoff", needsHuman: true, inScope: false, humanAction: result.humanAction || "未满足剧本、事实或授权边界，请本人处理。" };
  return result;
}
