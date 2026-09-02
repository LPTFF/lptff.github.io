(async () => {
  const OPTIMIZATION_KEY = "lptffBossResumeFilterVersion";
  const OPTIMIZATION_VERSION = 1;
  const stored = await chrome.storage.local.get([OPTIMIZATION_KEY, "FormDataPrese"]);
  if (Number(stored[OPTIMIZATION_KEY] || 0) >= OPTIMIZATION_VERSION) return;

  const preset = String(stored.FormDataPrese || "default");
  const formDataKey = preset === "default" ? "web-geek-job-FormData" : `web-geek-job-FormData-${preset}`;
  const current = (await chrome.storage.local.get(formDataKey))[formDataKey] || {};
  const targetTitles = [
    "前端", "高级前端", "资深前端", "前端技术专家", "前端负责人", "前端架构",
    "React", "Vue", "Web前端", "AI应用前端", "AIGC前端", "低代码前端", "可视化前端", "前端全栈",
  ];
  const titleExcludes = ["兼职", "实习", "临时", "小时工", "日结", "短期", "外包驻场", "驻场外包", "销售", "客服", "讲师", "培训师"];
  const contentExcludes = ["纯销售", "电话销售", "地推销售", "培训收费", "付费培训", "劳务派遣", "长期驻场", "长期出差", "全国出差"];
  const next = {
    ...current,
    configLevel: "advanced",
    jobTitle: { ...(current.jobTitle || {}), include: true, value: targetTitles, options: targetTitles, enable: true },
    jobContent: { ...(current.jobContent || {}), include: false, value: contentExcludes, options: contentExcludes, enable: true },
    salaryRange: {
      ...(current.salaryRange || {}),
      value: [20, 50, false],
      advancedValue: { H: [0, 1, false], D: [0, 1, false], M: [0, 1, false], ...(current.salaryRange?.advancedValue || {}) },
      enable: true,
    },
    companySizeRange: { ...(current.companySizeRange || {}), enable: false },
    hrPosition: { ...(current.hrPosition || {}), enable: false },
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
