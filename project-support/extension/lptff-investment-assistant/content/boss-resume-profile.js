(async () => {
  const OPTIMIZATION_KEY = "lptffBossResumeFilterVersion";
  const OPTIMIZATION_VERSION = 2;
  const stored = await chrome.storage.local.get([OPTIMIZATION_KEY, "FormDataPrese"]);
  if (Number(stored[OPTIMIZATION_KEY] || 0) >= OPTIMIZATION_VERSION) return;

  const preset = String(stored.FormDataPrese || "default");
  const formDataKey = preset === "default" ? "web-geek-job-FormData" : `web-geek-job-FormData-${preset}`;
  const current = (await chrome.storage.local.get(formDataKey))[formDataKey] || {};
  const targetTitles = [
    "前端", "Web前端", "H5开发", "HTML5", "JavaScript", "TypeScript", "React", "Vue",
    "大前端", "全栈", "低代码", "可视化", "中后台开发", "小程序开发", "跨端开发", "Electron",
    "AI应用开发", "AIGC应用开发",
  ];
  const titleExcludes = ["兼职", "实习", "临时", "小时工", "日结", "短期", "外包驻场", "驻场外包", "销售", "客服", "讲师", "培训师"];
  const contentExcludes = [
    "纯销售", "电话销售", "地推销售", "培训收费", "付费培训", "劳务派遣",
    "人力外包", "外包岗位", "驻场开发", "长期驻场", "临时项目", "短期项目",
    "创业初期", "早期创业", "初创团队", "初创公司", "单休", "大小周",
    "需要加班", "接受加班", "经常加班", "加班常态", "需要值班", "轮流值班", "夜间响应",
    "长期出差", "全国出差",
  ];
  const next = {
    ...current,
    configLevel: "advanced",
    jobTitle: { ...(current.jobTitle || {}), include: true, value: targetTitles, options: targetTitles, enable: true },
    jobContent: { ...(current.jobContent || {}), include: false, value: contentExcludes, options: contentExcludes, enable: true },
    salaryRange: {
      ...(current.salaryRange || {}),
      value: [18, 50, false],
      advancedValue: { H: [0, 1, false], D: [0, 1, false], M: [0, 1, false], ...(current.salaryRange?.advancedValue || {}) },
      enable: true,
    },
    companySizeRange: { ...(current.companySizeRange || {}), enable: false },
    hrPosition: { ...(current.hrPosition || {}), enable: false },
    jobAddress: { ...(current.jobAddress || {}), include: true, value: [], enable: false },
    activityFilter: { ...(current.activityFilter || {}), value: true },
    friendStatus: { ...(current.friendStatus || {}), value: true },
    sameHrFilter: { ...(current.sameHrFilter || {}), value: true, expire: 0 },
    deliveryLimit: { ...(current.deliveryLimit || {}), value: 120 },
    profileSearchTargetTitles: [],
    profileSearchExcludeTitleKeywords: titleExcludes,
    profileSearchFullTime: true,
  };
  await chrome.storage.local.set({ [formDataKey]: next, [OPTIMIZATION_KEY]: OPTIMIZATION_VERSION });
})();
