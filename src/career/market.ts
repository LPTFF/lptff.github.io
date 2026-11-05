import type { MarketJobItem } from "./types";

// 25 目标城市与 15 岗位关键词（用于白皮书展示）
export const SNAPSHOT_TARGET_CITIES = [
  "北京", "上海", "广州", "深圳", "杭州",
  "成都", "武汉", "南京", "苏州", "郑州",
  "青岛", "天津", "西安", "厦门", "长沙",
  "合肥", "重庆", "济南", "佛山", "东莞",
  "昆明", "南昌", "石家庄", "宁波", "福州",
];

export const SNAPSHOT_ROLE_MARKERS = [
  "前端开发", "React / Vue", "JavaScript / TypeScript", "Android / iOS",
  "鸿蒙开发", "Flutter", "Java 后端", "Go / Golang", "Python", "C++",
  "微服务 / 云原生", "架构设计", "AI / 大模型", "算法工程师", "机器学习",
  "数据开发 / 大数据", "全栈工程师", "测试开发", "DevOps / SRE", "嵌入式"
];

const CITY_NAME_MAP: Record<string, string> = {
  beijing: "北京",
  shanghai: "上海",
  tianjin: "天津",
  xian: "西安",
  suzhou: "苏州",
  wuhan: "武汉",
  nanjing: "南京",
  zhengzhou: "郑州",
  qingdao: "青岛",
  hangzhou: "杭州",
  xiamen: "厦门",
  changsha: "长沙",
  chengdu: "成都",
  guangzhou: "广州",
  shenzhen: "深圳",
  hefei: "合肥",
  chongqing: "重庆",
  jinan: "济南",
  foshan: "佛山",
  dongguan: "东莞",
  kunming: "昆明",
  nanchang: "南昌",
  shijiazhuang: "石家庄",
  ningbo: "宁波",
  fuzhou: "福州",
};

export const formatCityName = (job: MarketJobItem): string => {
  if (job.cityName) return job.cityName;
  if (!job.sourcePage) return "全网";
  const slug = job.sourcePage.replace(/\//g, "").toLowerCase();
  return CITY_NAME_MAP[slug] || slug;
};

export const parseJobDescChips = (desc: string): string[] => {
  if (!desc) return [];
  return desc
    .split("·")
    .map((s) => s.trim())
    .filter((s) => Boolean(s));
};

export interface MarketFilters { city: string; skill: string; query: string }

export function filterMarketJobs(jobs: MarketJobItem[], filters: MarketFilters): MarketJobItem[] {
  return jobs.filter((job) => {
    if (filters.city !== "all") {
      const city = formatCityName(job);
      if (city !== filters.city) return false;
    }
    if (filters.skill !== "all") {
      if (!job.skills || !job.skills.includes(filters.skill)) {
        return false;
      }
    }
    if (filters.query.trim()) {
      const q = filters.query.trim().toLowerCase();
      const city = formatCityName(job).toLowerCase();
      const title = (job.bossTitle || "").toLowerCase();
      const company = (job.brandName || "").toLowerCase();
      const industry = (job.brandIndustry || "").toLowerCase();
      const desc = (job.jobDesc || "").toLowerCase();
      const skills = (job.skills || []).join(" ").toLowerCase();
      const match =
        city.includes(q) ||
        title.includes(q) ||
        company.includes(q) ||
        industry.includes(q) ||
        desc.includes(q) ||
        skills.includes(q);
      if (!match) return false;
    }
    return true;
  });
}
