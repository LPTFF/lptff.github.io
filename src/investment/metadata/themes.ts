/**
 * 只接收基金简称、跟踪标的等标题型字段，不接收业绩基准或投资范围正文；
 * 后两者常含“银行活期存款”等基准成分，会污染主题判断。
 * 返回值用于“主题/策略”；行业配置必须单独保存，不能再冒充投资策略。
 */
export function explicitThemesFromSourceText(values: Array<unknown>): string[] {
  const text = values.map((value) => String(value ?? "").trim()).filter(Boolean).join(" ");
  const themes: string[] = [];
  if (/科技|信息技术/.test(text)) themes.push("科技");
  if (/黄金|Au9999|贵金属/i.test(text)) themes.push("黄金");
  if (/原油|石油/.test(text)) themes.push("原油");
  if (/\bESG\b/i.test(text)) themes.push("ESG");
  if (/多因子/.test(text)) themes.push("多因子");
  if (/中证酒|酒类|白酒/.test(text)) themes.push("酒");
  if (/银行/.test(text)) themes.push("银行");
  return [...new Set(themes)];
}
