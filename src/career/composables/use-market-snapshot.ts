import { computed, ref, watch, type Ref } from "vue";
import type { MarketJobItem } from "../types";
import { filterMarketJobs, formatCityName } from "../market";

export function useMarketSnapshot(publicJobs: Ref<MarketJobItem[]>, onFilterResult?: (outcome: "success" | "empty") => void) {
  const snapshotLastTime = computed(() => {
    if (!publicJobs.value.length) return "";
    return publicJobs.value[0].time || publicJobs.value[0].capturedAt || "";
  });

  // 模块 4：快照筛选紧凑折叠与列表渐进展示
  const showMoreCities = ref(false);
  const showMoreSkills = ref(false);
  const snapshotDisplayLimit = ref(5);
  const expandedJobDetails = ref<Record<string, boolean>>({});
  const toggleJobDetail = (jobId: string) => {
    expandedJobDetails.value[jobId] = !expandedJobDetails.value[jobId];
  };

  // 市场快照多维筛选与规则面板控制状态
  const showSnapshotRules = ref(false);
  const snapshotSearchQuery = ref("");
  const snapshotSelectedCity = ref("all");
  const snapshotSelectedSkill = ref("all");

  const distinctCitiesInSnapshot = computed(() => {
    const map = new Map<string, number>();
    for (const job of publicJobs.value) {
      const city = formatCityName(job);
      map.set(city, (map.get(city) || 0) + 1);
    }
    return Array.from(map.entries()).map(([city, count]) => ({ city, count }));
  });

  const topCitiesInSnapshot = computed(() => distinctCitiesInSnapshot.value.slice(0, 5));
  const moreCitiesInSnapshot = computed(() => distinctCitiesInSnapshot.value.slice(5));
  const hasMoreCities = computed(() => distinctCitiesInSnapshot.value.length > 5);

  const distinctSkillsInSnapshot = computed(() => {
    const map = new Map<string, number>();
    for (const job of publicJobs.value) {
      for (const skill of job.skills || []) {
        map.set(skill, (map.get(skill) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([skill, count]) => ({ skill, count }));
  });

  const topSkillsInSnapshot = computed(() => distinctSkillsInSnapshot.value.slice(0, 6));
  const moreSkillsInSnapshot = computed(() => distinctSkillsInSnapshot.value.slice(6));
  const hasMoreSkills = computed(() => distinctSkillsInSnapshot.value.length > 6);

  const distinctCompaniesCount = computed(() => {
    const set = new Set<string>();
    for (const job of publicJobs.value) {
      if (job.brandName) set.add(job.brandName);
    }
    return set.size;
  });

  const filteredPublicJobs = computed(() => filterMarketJobs(publicJobs.value, {
    city: snapshotSelectedCity.value, skill: snapshotSelectedSkill.value, query: snapshotSearchQuery.value,
  }));

  const displayedPublicJobs = computed(() =>
    filteredPublicJobs.value.slice(0, snapshotDisplayLimit.value)
  );

  const hasMorePublicJobs = computed(
    () => filteredPublicJobs.value.length > snapshotDisplayLimit.value
  );

  const toggleSnapshotLimit = () => {
    if (snapshotDisplayLimit.value >= filteredPublicJobs.value.length) {
      snapshotDisplayLimit.value = 5;
    } else {
      snapshotDisplayLimit.value = filteredPublicJobs.value.length;
    }
  };

  const resetSnapshotFilters = () => {
    snapshotSearchQuery.value = "";
    snapshotSelectedCity.value = "all";
    snapshotSelectedSkill.value = "all";
    snapshotDisplayLimit.value = 5;
  };

  let hasInitSnapshotFilterWatch = false;
  watch([snapshotSelectedCity, snapshotSelectedSkill, snapshotSearchQuery], () => {
    if (!hasInitSnapshotFilterWatch) {
      hasInitSnapshotFilterWatch = true;
      return;
    }
    onFilterResult?.(filteredPublicJobs.value.length > 0 ? "success" : "empty");
  });

  return {
    snapshotLastTime,
    showMoreCities,
    showMoreSkills,
    snapshotDisplayLimit,
    expandedJobDetails,
    toggleJobDetail,
    showSnapshotRules,
    snapshotSearchQuery,
    snapshotSelectedCity,
    snapshotSelectedSkill,
    distinctCitiesInSnapshot,
    topCitiesInSnapshot,
    moreCitiesInSnapshot,
    hasMoreCities,
    distinctSkillsInSnapshot,
    topSkillsInSnapshot,
    moreSkillsInSnapshot,
    hasMoreSkills,
    distinctCompaniesCount,
    filteredPublicJobs,
    displayedPublicJobs,
    hasMorePublicJobs,
    toggleSnapshotLimit,
    resetSnapshotFilters,
  };
}
