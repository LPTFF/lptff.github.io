import sources from "../../project-support/extension/lptff-investment-assistant/content-sources.json";
import { mergeAuthorizedItems } from "./authorizedContent";
import data from "../data/bilibili.json";

export const bilibiliItemsFor = (tab: string) => {
  const uids = new Set(sources.filter((source) => source.platform === "bilibili" && source.tab === tab).map((source) => source.uid));
  return mergeAuthorizedItems("bilibili", data).filter((item) => {
    try {
      const url = new URL(String(item.authorPage));
      return url.hostname === "space.bilibili.com" && uids.has(url.pathname.split("/")[1]);
    } catch {
      return false;
    }
  }).map((item) => ({
    ...item,
    title: item.desc,
    url: item.detailUrl || item.videoUrl,
    link: item.detailUrl || item.videoUrl,
    website: "bilibili",
  }));
};
