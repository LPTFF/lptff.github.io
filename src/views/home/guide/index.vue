<template>
  <div>
    <section class="ecosystem-radar" aria-labelledby="guide-radar-title">
      <div>
        <div class="radar-title" id="guide-radar-title">热门资讯生态雷达</div>
        <div class="radar-description">
          汇集抖音热榜、微博热搜与南方周末，观察公共注意力、跨平台共振和深度议题。
        </div>
      </div>
      <div class="radar-stats">
        <span>{{ totalNewsCount }} 条信号</span>
        <span>{{ sourceFilters.length }} 个来源</span>
        <span>{{ categoryOptions.length }} 个生态主题</span>
      </div>
    </section>
    <section class="radar-filters" aria-label="热门资讯生态筛选">
      <div class="filter-row">
        <span class="filter-label">资讯来源</span>
        <button
          type="button"
          class="filter-tag"
          :class="{ active: selectedSource === 'all' }"
          :aria-pressed="selectedSource === 'all'"
          @click="selectedSource = 'all'"
        >
          全部 {{ totalNewsCount }}
        </button>
        <button
          v-for="source in sourceFilters"
          :key="source.id"
          type="button"
          class="filter-tag"
          :class="{ active: selectedSource === source.id }"
          :aria-pressed="selectedSource === source.id"
          @click="selectedSource = source.id"
        >
          {{ source.label }} {{ source.count }}
        </button>
      </div>
      <div class="filter-row">
        <span class="filter-label">生态主题</span>
        <button
          type="button"
          class="filter-tag"
          :class="{ active: selectedCategory === 'all' }"
          :aria-pressed="selectedCategory === 'all'"
          @click="selectedCategory = 'all'"
        >
          全部 {{ totalNewsCount }}
        </button>
        <button
          v-for="category in categoryOptions"
          :key="category.name"
          type="button"
          class="filter-tag"
          :class="{ active: selectedCategory === category.name }"
          :aria-pressed="selectedCategory === category.name"
          @click="selectedCategory = category.name"
        >
          {{ category.name }} {{ category.count }}
        </button>
      </div>
      <div class="filter-row">
        <span class="filter-label">观察视角</span>
        <button
          v-for="focus in focusOptions"
          :key="focus.key"
          type="button"
          class="filter-tag focus-tag"
          :class="{ active: selectedFocus === focus.key }"
          :aria-pressed="selectedFocus === focus.key"
          @click="selectedFocus = focus.key"
        >
          {{ focus.label }}
        </button>
        <span class="filter-result">{{ filteredNews.length }} 条当前结果</span>
      </div>
    </section>
    <div class="filter-empty" v-if="filteredNews.length === 0">
      当前筛选组合暂无资讯，可以切换来源、主题或观察视角。
    </div>
    <el-row>
      <el-col
        :span="24"
        :md="24"
        :lg="24"
        v-for="(item, sonIndex) in guideNewsLimited"
        :key="item.url || sonIndex"
      >
        <el-card shadow="hover" class="welfare-card">
          <div class="welfare-date">
            <div class="day-week-welfare">
              <div class="welfare-month" :style="`color:${handleYearColor(item)}`">
                <div class="welfare-icon-hour">
                  <el-icon :size="15"><Calendar /></el-icon>
                </div>
                {{ handleMonth(item) }}
              </div>
              <div class="welfare-day" :style="`color:${handleYearColor(item)}`">
                {{ handleDay(item) }}
              </div>
            </div>
            <div>
              <el-divider
                direction="vertical"
                color="#cccccc"
                class="el-welfare-divider"
              />
            </div>
            <div class="welfare-hour">
              <div class="welfare-icon-hour">
                <el-icon :size="16"><Timer /></el-icon>
              </div>
              <div>{{ handleHour(item) }}</div>
            </div>
            <div>
              <a
                class="welfare-link-title"
                :href="handleLinkUrl(item)"
                @click.prevent="gotoWelfareWebsite(item)"
              >
                {{ item.title }}
              </a>
              <div class="ecosystem-tags">
                <el-tag size="small">{{ item.ecosystem.category }}</el-tag>
                <el-tag size="small" type="success" v-if="item.rank">
                  榜单 #{{ item.rank }}
                </el-tag>
                <el-tag size="small" type="primary" v-if="item.ecosystem.sourceBreadth > 1">
                  {{ item.ecosystem.sourceBreadth }} 源共振
                </el-tag>
                <el-tag size="small" type="warning" v-if="item.ecosystem.isDeep">
                  深度追踪
                </el-tag>
              </div>
              <div class="ecosystem-summary">{{ item.ecosystem.observation }}</div>
              <div class="welfare-div-link">
                <div
                  v-if="item.website == 'weibo'"
                  class="weibo-img-link"
                  :style="`background:${item.image.small_icon_desc_color}`"
                >
                  {{ item.image.small_icon_desc }}
                </div>
                <img
                  :src="handleAuthorImg(item)"
                  alt="作者"
                  class="welfare-img-link"
                  @error="handleImageError"
                  referrerPolicy="no-referrer"
                  v-else
                />
              </div>
            </div>
          </div>
          <div class="welfare-div-website">
            <img
              :src="handleWebsiteImg(item)"
              alt="网站"
              class="welfare-img-link"
              @error="handleImageError"
            />
            <div class="welfare-name-link">
              {{ handleWebsiteName(item) }}
            </div>
          </div>
          <div class="mobile-div">
            <div class="mobile-div-news">
              <div class="mobile-link-title">
                <div @click="gotoMobileWebsite(item)">
                  {{ handleMobileTitle(item) }}
                </div>
                <div class="mobile-ecosystem-signal">
                  <span>{{ item.ecosystem.category }}</span>
                  <span v-if="item.ecosystem.sourceBreadth > 1">
                    {{ item.ecosystem.sourceBreadth }} 源共振
                  </span>
                </div>
              </div>
              <div
                v-if="item.website == 'weibo'"
                class="weibo-img-link mobile-weibo-img"
                :style="`background:${item.image.small_icon_desc_color}`"
              >
                {{ item.image.small_icon_desc }}
              </div>
              <img
                :src="handleAuthorImg(item)"
                alt="作者"
                class="welfare-img-link mobile-img-link"
                @error="handleImageError"
                referrerPolicy="no-referrer"
                v-else
              />
            </div>
            <div class="mobile-click-show">
              <div>
                <div class="welfare-day" :style="`color:${handleYearColor(item)}`">
                  {{ handleDay(item) }}
                </div>
                <div class="welfare-month">
                  <div class="welfare-icon-hour">
                    <el-icon :size="15"><Calendar /></el-icon>
                  </div>
                  {{ handleMonth(item) }}
                </div>
              </div>

              <div class="welfare-hour welfare-mobile-hour">
                <div class="welfare-icon-hour">
                  <el-icon :size="16"><Timer /></el-icon>
                </div>
                <div>{{ handleHour(item) }}</div>
              </div>
              <div class="mobile-bt-detail">
                <img
                  :src="handleWebsiteImg(item)"
                  alt="网站"
                  class="welfare-img-link mobile-welfare-img"
                />
                <div>{{ handleWebsiteName(item) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-dialog
      v-model="dialogGuideVisible"
      :title="dialogTitle"
      center
      :style="`margin-top:${dialogMarginTop}px`"
      id="dialogEl"
    >
      <div class="dialog-content">{{ handleDialogContent(dialogContent) }}</div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleDialogCancel">不感兴趣</el-button>
          <el-button type="primary" @click="handleDialogConfirm"> 前去看看 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { ref, nextTick, watch, computed } from "vue";
import { gotoOutPage, isPC } from "../../../utils/utils";
import { Calendar, Timer } from "@element-plus/icons-vue";
import infzmNews from "../../../data/infzm.json";
import weiboNews from "../../../data/weibo.json";
import douyinHotNews from "../../../data/douyinHot.json";
import logoImageUrl from "../../../assets/logo.jpg";
import {
  ElCol,
  ElRow,
  ElDialog,
  ElCard,
  ElButton,
  ElIcon,
  ElDivider,
  ElTag,
} from "element-plus";
export default {
  props: {
    guideLocation: [String, Number],
  },
  components: {
    ElCol,
    ElRow,
    ElDialog,
    ElCard,
    ElButton,
    ElIcon,
    ElDivider,
    ElTag,
    Calendar,
    Timer,
  },
  setup(props: any) {
    const logoUrl = logoImageUrl;
    let dialogGuideVisible = ref(false);
    let dialogTitle = ref("");
    let dialogContent = ref("");
    let dialogParam = ref("");
    const selectedSource = ref("all");
    const selectedCategory = ref("all");
    const selectedFocus = ref("all");
    const rawSourceDefinitions = [
      {
        id: "douyinHot",
        label: "抖音热榜",
        items: douyinHotNews as any[],
      },
      {
        id: "weibo",
        label: "微博热搜",
        items: weiboNews as any[],
      },
      {
        id: "infzm",
        label: "南方周末",
        items: infzmNews as any[],
      },
    ];
    const topicDefinitions = [
      {
        name: "灾害与安全",
        keywords: [
          "泥石流", "山体滑坡", "遇难", "失联", "被埋", "灾害", "救援", "犯罪",
          "罪案", "勒索", "拘禁", "枪声", "逮捕", "被查", "罚单", "造假", "谣言",
          "走失", "男童", "儿童",
        ],
      },
      {
        name: "教育与职场",
        keywords: [
          "教育", "会计", "开学", "学校", "同学", "应届生", "上班", "就业", "职场",
          "写字", "读懂", "主科",
        ],
      },
      {
        name: "体育竞技",
        keywords: [
          "足球", "篮球", "比赛", "冠军", "全运会", "奥运", "世界杯", "英超", "拳王",
          "赛道", "比分", "圣日耳曼", "利物浦", "贝林厄姆", "姆巴佩", "赵心童",
        ],
      },
      {
        name: "科技产业",
        keywords: [
          "科技", "人工智能", "AI", "机器人", "芯片", "手机", "商业航天", "暗物质",
          "DLSS", "产品发布", "企业AI",
        ],
      },
      {
        name: "国际与政策",
        keywords: [
          "总书记", "中方", "政策", "政府", "法院", "税", "证监会", "经济", "医保",
          "养老", "住房", "演习", "美联储", "菲律宾", "尼泊尔", "美国反对", "中俄蒙",
        ],
      },
      {
        name: "消费与生活",
        keywords: [
          "消费", "钱", "文旅", "旅游", "追秋", "妆容", "穿搭", "通勤", "打卡", "油价",
          "手环", "豪宅", "雪花牛肉", "肥皂", "小猫", "小狗", "天气", "减肥", "外套",
        ],
      },
      {
        name: "文娱舆情",
        keywords: [
          "电影", "电视剧", "综艺", "演员", "明星", "歌手", "演唱会", "音乐", "舞台",
          "MV", "粉丝", "拍摄", "造型", "口碑", "实体专", "广告", "订婚", "点赞",
          "分手", "花少", "极限挑战", "早春晴朗", "披荆斩棘", "说唱", "舞蹈", "角色展示",
        ],
      },
    ];
    const classifyTopic = (item: any) => {
      const content = String(item.title || "").toUpperCase();
      return (
        topicDefinitions.find((topic) =>
          topic.keywords.some((keyword) => content.includes(keyword.toUpperCase()))
        )?.name || "平台流行"
      );
    };
    const categorizedGroups = rawSourceDefinitions.map((source) => ({
      ...source,
      items: source.items.map((item) => ({
        ...item,
        ecosystem: {
          category: classifyTopic(item),
          isTop: Number(item.rank) > 0 && Number(item.rank) <= 10,
          isDeep: item.website === "infzm" && String(item.desc || "").length >= 50,
        },
      })),
    }));
    const categorySources = new Map<string, Set<string>>();
    categorizedGroups.forEach((source) => {
      source.items.forEach((item) => {
        const category = item.ecosystem.category;
        if (!categorySources.has(category)) categorySources.set(category, new Set());
        categorySources.get(category)?.add(source.id);
      });
    });
    const sourceDefinitions = categorizedGroups.map((source) => ({
      ...source,
      items: source.items.map((item) => {
        const sourceBreadth = categorySources.get(item.ecosystem.category)?.size || 1;
        const rankText = item.rank
          ? `榜单第 ${item.rank} 位`
          : source.id === "infzm"
            ? "深度内容"
            : "置顶信号";
        const observation = item.ecosystem.isDeep
          ? `来自南方周末的深度追踪，为当前${item.ecosystem.category}补充事件背景与后续。`
          : sourceBreadth > 1
            ? `当前快照中，这类${item.ecosystem.category}同时出现在 ${sourceBreadth} 个来源；本条为${source.label}${rankText}。`
            : `本条为${source.label}${rankText}，反映该平台此刻的注意力。`;
        return {
          ...item,
          ecosystem: { ...item.ecosystem, sourceBreadth, observation },
        };
      }),
    }));
    const interleaveSources = (groups: any[][]) => {
      const result: any[] = [];
      const maxLength = Math.max(...groups.map((group) => group.length), 0);
      for (let index = 0; index < maxLength; index += 1) {
        groups.forEach((group) => {
          if (group[index]) result.push(group[index]);
        });
      }
      return result;
    };
    const newsGuide = interleaveSources(sourceDefinitions.map((source) => source.items));
    const totalNewsCount = newsGuide.length;
    const sourceFilters = sourceDefinitions.map((source) => ({
      id: source.id,
      label: source.label,
      count: source.items.length,
    }));
    const categoryOptions = computed(() => {
      const counts = new Map<string, number>();
      newsGuide.forEach((item) => {
        const category = item.ecosystem.category;
        counts.set(category, (counts.get(category) || 0) + 1);
      });
      return [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
    });
    const focusOptions = [
      { key: "all", label: "全部视角" },
      { key: "resonance", label: "跨来源共振" },
      { key: "top", label: "热榜前列" },
      { key: "deep", label: "深度报道" },
    ];
    const filteredNews = computed(() =>
      newsGuide.filter((item) => {
        if (selectedSource.value !== "all" && item.website !== selectedSource.value) {
          return false;
        }
        if (
          selectedCategory.value !== "all" &&
          item.ecosystem.category !== selectedCategory.value
        ) {
          return false;
        }
        switch (selectedFocus.value) {
          case "resonance":
            return item.ecosystem.sourceBreadth > 1;
          case "top":
            return item.ecosystem.isTop;
          case "deep":
            return item.ecosystem.isDeep;
          default:
            return true;
        }
      })
    );
    const handleDay = (item: any) => {
      const date = new Date(item.timestamp);
      const day = date.getDate();
      const formattedDay = day < 10 ? "0" + day : day.toString();
      return formattedDay;
    };
    const handleHour = (item: any) => {
      const date = new Date(item.timestamp);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const formattedHours = hours < 10 ? "0" + hours : hours.toString();
      const formattedMinutes = minutes < 10 ? "0" + minutes : minutes.toString();
      const timeString = `${formattedHours}:${formattedMinutes}`;
      return timeString;
    };
    const handleAuthorImg = (item: any) => {
      let websiteLogo = "";
      switch (String(item.website)) {
        case "juejin":
        case "infzm":
        case "v2ex":
        case "githubTrending":
          websiteLogo = item.image ? item.image : logoUrl;
          break;
        case "hxm5":
        case "mutouxb":
          websiteLogo = item.img_src ? item.img_src : logoUrl;
          break;
        default:
          websiteLogo = logoUrl;
      }
      return websiteLogo;
    };
    const handleLinkUrl = (item: any) => {
      let websiteUrl = "";
      let data = isPC();
      switch (String(item.website)) {
        case "infzm":
          websiteUrl = item.url.startsWith("http")
            ? item.url
            : data
              ? `https://www.infzm.com/contents/${item.url}`
              : `https://www.infzm.com/wap/#/content/${item.url}?source=133&source_1=1`;
          break;
        case "weibo":
          let originUrl = `https://m.weibo.cn/search?containerid=100103type=1&q=${decodeURI(
            item.title
          )}`;
          websiteUrl = data ? item.url : originUrl;
          break;
        case "juejin":
        case "v2ex":
        case "githubTrending":
        case "52pojie":
        case "douyinHot":
          websiteUrl = item.url;
          break;
        case "hxm5":
        case "mutouxb":
          websiteUrl = item.link;
          break;
      }
      return websiteUrl;
    };
    const gotoWelfareWebsite = (item: any) => {
      let websiteUrl = handleLinkUrl(item);
      if (websiteUrl) {
        gotoOutPage(websiteUrl);
      }
    };
    const handleWebsiteName = (item: any) => {
      let websiteName = "";
      switch (String(item.website)) {
        case "hxm5":
          websiteName = "线报引擎";
          break;
        case "mutouxb":
          websiteName = "86收线报网";
          break;
        case "juejin":
          websiteName = "掘金";
          break;
        case "infzm":
          websiteName = "南方周末";
          break;
        case "v2ex":
          websiteName = "V2EX";
          break;
        case "weibo":
          websiteName = "微博热搜";
          break;
        case "douyinHot":
          websiteName = "抖音热榜";
          break;
        case "githubTrending":
          websiteName = "githubTrending";
          break;
        case "52pojie":
          websiteName = "吾爱破解";
          break;
        default:
          websiteName = "随风而逝";
      }
      return websiteName;
    };
    const handleWebsiteImg = (item: any) => {
      let websiteImg = "";
      switch (String(item.website)) {
        case "hxm5":
          websiteImg =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACa0lEQVR4AXWTQ7gcQRSFe3qYL6vYts1NbJvreJVd1N2xbds2NrFt25mZdr/u4cmtZy7Kdf+LOsVB5IonBW4/BE6jhqTIISG6cjbBjaTgAuiM3Um7SzZky9FkLzvI3tjlxAwP4oKPRjcBeJAT5L7HbFkECvMaE3kYswrBXFob1u7eME6Nh3VpKlJOToC+rTuMeSUJxhPMlR0QZgAkqBnrG8H6eA6O/Rvmj3vQX+yDem89jEc74QQfwAw9RnDvaERFX3YAMgH22voInp+GuB1CcGVbRGd44UhexEUv5LkVoF6bj4j5BeqS2tnTSAOkpeCGPr8Kkk4I6v6BZOhBjLxFRD9iVIfQkqoU3V+YW7vkBaRFwUObXz0NsKcfGXpSoVHJg/C8qpTKbkSCT8hJuYIALhgrGhMgDGVVKziCH8qcYpD3DEPKjxtw/t1FeG17KqQ3f0CMANrOPkjo3/Fz72Aor4/DCb2H4yhQrq6EOq8SHErJkQIFRCBQDc5PhvP9JuR1LSBfmQ/jxkbEzR8wnhyEurguAfwFA+JUKOPBeqS8OMOeKlU8UcEDeUMX2D/vwpZfQ987HLZYmM68iNFZUnRlAZiR9eIYtOfHEJvJp0FFglAh5QXVYT3aTumoMB9toBepRXAvKzwBhIwaeGA9Xgfn9xNESZEZko6TpzhBbKkw9GOTEFW/UW1eIbx/OKKkEwbQUr1JPOSl1SDv6MYM8uiepE568ENeUhfa6bFM3pS2R+OSaZ+J5cw+DnkMsNxyA+icQ4QJi6lT8FFqPDmiz0QqLAqCkJy1mOQCrVnLA2ARMkiCwSROo/z3UopF/wMtJbFAANdXrAAAAABJRU5ErkJggg==";
          break;
        case "mutouxb":
          websiteImg =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAALVBMVEVHcEz/UwD/VAD/VAD/UwD+UwD/UwD/UwD/UwD+UwD+UwD+UwD9UgD+UwD/VAAEMvkGAAAADnRSTlMAQOHzw5TW6zEhfFoQp2Bl2BQAAADGSURBVDiNzZPZDsQgCEVRXOpS//9zp1ZR0DbzNMnch8bIYSsIwHWYqhNepUqV/iPg+AKE4sIKHAzI/jqqcfkm28l3XSHMNyAWbJqhPJIMLzEM4KHBKjcA3PqrSiyzewJEN2a3n7L6LQZL4O5YLgt75s4N9mrvIN5fDdhIO+3tbyYaFuXTFOTsDmPcVnZjKeDcB81mAXEknEBgQPOPIABaE6T8CRagn1WrX/fhiJ1UeNcYeb9yqzOW6hj9nP7yLnJaB/KTp/cBnJYXiHf+EHYAAAAASUVORK5CYII=";
          break;
        case "juejin":
          websiteImg =
            "https://lf3-cdn-tos.bytescm.com/obj/static/xitu_juejin_web/6c61ae65d1c41ae8221a670fa32d05aa.svg";
          break;
        case "infzm":
          websiteImg =
            "http://www.infzm.com/web/images/infzm-meta-icon.png?f25705e975f00770a3e8a74f1a08a170";
          break;
        case "v2ex":
          websiteImg =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADg0lEQVR4AWKAgf///7NeuXJl47Fjx77t2bPn37Zt2/5t2bIF0HsZtcIWRmF4fgoREodSiogIIEq59lP8D3fuKeeOcTfDDSFNSSKKCwAAA77Tc/HsOs03xpGOenrX7LW+9a6997d3dvgJ6EVPeuOBV2LM3/b29q/l5eU8xf+DpaWlPJ7JmXOARDqdDkdHR+Hx8TG8v7+Hj48PAY+hxuqnvL290ZPeeCRD4J3ikmh+e3v7ZcNIXj6tx8Mh8E5xX/hxeHhIAdOG19dXMEaN1Sil6onxwAtPvFNsDn48PDwkxS8vL2CMRjEXr4/n8cALT7xT7naTFkM+n1eN1W/BWj18OlIEQAI0g+fnZ9VY/Tb66Jsy8ApoABMTE6G8vDxAWVmZapwo1NTUhKmpKdbHBjb2NscHgKenp4TKyspQUVEBxOqnTE9Puz6GeyI+AAmKeGahqqoqVFdXRyGnisdmZ2ftoxrjEb8CJIAd6oLa2tpvUV9fH+bn5+lhP9GncADvEwuERnV1dWCMRjFnfVNTU8hms/YSn4biA9zf3yc0NjYmNDQ0qMZqFHKtra1hdXWVXoJHfAB3KUV3d3dgcUkODg7C0NAQZ11AV1dXyOVy9i06AObAu9oBSr4HjNH9/f3Q29sbmpubC2C4q6sretsrPgC7lKKbmxswRo2jeYblKgwODoaWlpYCRkZGSg6AOdDwn9nZ2QljY2Ohra0tob29HeXsw9bWFnXh+vpan+IDUCQdHR2hs7MTjNEv09/fHzY3N7n/9iw9AJfK4u7ubjYRGKPGapS+vr6wsrLCo0dP8cVUOAAH4fLyMqGnp+fLsAFVzjyTyWhuP9AnPgALKLq4uAhAo4GBATBGjaN5WFhYoBc97GfM8fgAJFwkbKDh4WEwRqOYm5ubKzgROT8/16f4ABTJ5ORk4BGC0dFR1ThRGB8fDzMzM2w4zaIUHYCFJM7OzgqKv4rm9LCPamydvsm/ZLxMSJyenorHxMXFzDVxfRTqeCck/5ItLi4yQGByDGlycnICLFCN1Sil6umNB1544p3KZrOP/Njb2wskmY6zYMHx8bFqrEbzEqunp69tvPDEO7WxscGHCY8Oxb73o7BY/Q6sxQMvPNfX13+n+DzKZDJ5h9jd3XVaFvwIvFXpSW/N8Uw+UnO53C+H+B/ghWfKPz9SuSTcl3Q6/eOf52w4eq+trf31ef4H8lDJyDc4UgoAAAAASUVORK5CYII=";
          break;
        case "weibo":
          websiteImg =
            "data:image/png;base64,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";
          break;
        case "githubTrending":
          websiteImg =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAb1BMVEX////4+Pi3ubtvcnZNUVU+Q0cpLjLr6+x3en0sMTYkKS59gIORk5aUl5n8/Pzw8PFTV1tbX2Pc3d5DSEzn5+g3PECLjpFKTlKFh4qxs7XCxMUwNTq/wcLh4uPV1tZzd3o/Q0jOz9CmqKpjZ2qfoaSrd37mAAABPUlEQVR4AW3TBZKEMBAF0B8GCHzcnbW5/xm30qEyknklcU/DgQpuYRTHUXgLFHw6SemkmcYrlcd8kRYlnlQ1PU0Fp434Qde75Qd+1FUQKiRZjyGfTGNjKhWMmSQXYO3Ibao3MlqBnSRzADhk/ycAdcqclSSHnEUD+KLt8KalMQMqpl3izU5jKxHQGCq8Ud80fq4VfuFZaIyQO4wVPEre5g+RrIAPJrkQSL8OPjv3htQmH8guU5uwgseeP7ITMYBnpdFgvlJPcx0zoLjjzS/FDrVRvH6xsqDYlLx29huRUaFx6YuI1mhKMbddf9trEzca7rmRk/FxpiRXiJO8FDBURyb4yfO7glC8TOpacmAc4ElMEWlc2oGckjwvYVFEB5wjouE6uLBwquypQym/scKrM4njElYaJy182q15aDj/oQMZkS8JH3IAAAAASUVORK5CYII=";
          break;
        case "52pojie":
          websiteImg =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAkFBMVEX////87OzsYmL5zc3509P+9/fzoaH62tr1r6/3vLzylZXwgYHmMzPudHT99PTqUlL85+f1qqrtamr74uLznp7fAADhBwflJyfgAADpRETjFxfiDw/iCwvhAADkHBzmLi7rWVniEBDpSEjqT0/oPz/4xsbdAADyl5fvfHz3wsLjERHxjIzkICD2tbXtbW3wh4dkMKV5AAACuUlEQVR4ATWNBwKrKBRFr11jiUbBGwEV0zFl/7sbZub/A683IAijOEmzvDiUWVXnzbHtTuUxiOq+H8oWgJAjKenlPCltfCBmsQhvlCKBVSotJyW1nCGordbVdj5vl8vluPkSUBs9btfzNo8ndOmiLW/woG/blooRMLFOEKDxEgYFJz3rpT3d73dBZRkjphVpKsSjERCo5OwvjrhlCPy2yaR4Tj6+C9G9iLuUTjk2QPF4Rjm15Y6Con21OKfpESikmo3glNzFvXvotzIPBOIU4Fq2XdysFVapOwT4C82AfbmeIMYmugoxYZN6rJb3tFRhNY/LxAHPt7kmIoz7d384gcpppm0LTzBJRaClmvDAmswENjr1FujOM0kMRk3+IJW8flbiXcDvk7oSmIUhJXZa7uhpnTRmwfdlxVbzrPnBoS47JFbrLUdEO1n1nmtJraR0Wlle0lsxHKmtZYivVNZpX1PKqVE5j5okOemLdhPx3wn9fvuOiaT1daulJKmp/IYChVbaIBXc9u5VG+usdFX4LFpg1I4vnKQTPbrP8dXgi6d03IEcpV4LYZUABr6bOA+z5p797sONTmsJpuEVp8Wo+YSQaqeoIUfwHqVGuZq3Vwb0PX5yKtEuzHyI52ffAKctgSDCKIXwDaYEJPtleC64rtWF0jmz3+5FetfjikWbBwrLbI+xJs8uf82zsnJPf2gAJK1v6AHJ+BVHFwQJgFI6+vqhOtZ7SKkMEJF9npcjRvFL77TOcUKAtng0DzPJDbkRUdJjSNZv0WYdnRXxfn19hUq+0vKFWi5ZeKjXYEij6OiUkxWk2ACUYlZmwEUzewzlIRKiy4VyljgsAeL6hZ+ZmMMvNcZQamUNrXNWh24ONclldUrcAKklPcaLR9J4JbwlBUUHz+viJX90fRx8fnVWdN2KwykuGvQR8A+lNlPn0UGdyAAAAABJRU5ErkJggg==";
          break;
        case "douyinHot":
          websiteImg = "https://www.douyin.com/favicon.ico";
          break;
        default:
          websiteImg = "羊毛";
      }
      return websiteImg;
    };
    const handleMonth = (item: any) => {
      const date = new Date(item.timestamp);
      const month = date.getMonth() + 1;
      return month + "月";
    };
    const handleImageError = (event: any) => {
      event.target.src = logoUrl;
    };
    const handleYearColor = (item: any) => {
      const date = new Date(item.timestamp);
      // 获取对应的年份
      const year = date.getFullYear();
      // 获取当前系统时间的年份
      const currentYear = new Date().getFullYear();
      return year < currentYear ? `#e96a43` : "";
    };
    const handleMobileTitle = (item: any) => {
      const lengthControl = 40;
      return item.title.length < lengthControl
        ? item.title
        : item.title.slice(0, lengthControl) + "...";
    };
    const gotoMobileWebsite = (item: any) => {
      if (
        item.website === "juejin" ||
        item.website === "infzm" ||
        item.website === "v2ex"
      ) {
        dialogGuideVisible.value = true;
        dialogTitle.value = item.title;
        dialogContent.value = item.desc;
        dialogParam.value = item;
      } else {
        let websiteUrl = handleLinkUrl(item);
        if (websiteUrl) {
          gotoOutPage(websiteUrl);
        }
      }
    };
    const handleDialogContent = (item: any) => {
      const lengthControl = 400;
      return item.length < lengthControl ? item : item.slice(0, lengthControl) + "...";
    };
    const dialogMarginTop = ref();
    watch(dialogGuideVisible, async (newValue) => {
      if (newValue) {
        await nextTick(); // 等待元素渲染完成
        const dialogData = document.getElementById("dialogEl");
        if (dialogData) {
          let dialogHeight = dialogData.clientHeight;
          let windowHeight = window.innerHeight;
          dialogMarginTop.value = (Number(windowHeight) - dialogHeight) / 2 + 58;
        }
      }
    });
    const handleDialogCancel = () => {
      dialogGuideVisible.value = false;
    };
    const handleDialogConfirm = () => {
      dialogGuideVisible.value = false;
      let websiteUrl = handleLinkUrl(dialogParam.value);
      if (websiteUrl) {
        gotoOutPage(websiteUrl);
      }
    };
    const isPCRes = computed(() => isPC());
    let maxLength = 0;
    const guideNewsLimited = computed(() => {
      const length: number = Number(props.guideLocation); // 切割长度
      let initData = isPCRes.value ? 9 : 5;
      let guideTmpAll;
      maxLength < length ? (maxLength = length) : maxLength;
      let rate = isPCRes.value ? 2 : 1;
      guideTmpAll = filteredNews.value.slice(
        0,
        maxLength * rate + initData < filteredNews.value.length
          ? maxLength * rate + initData
          : filteredNews.value.length
      );
      return guideTmpAll;
    });
    return {
      handleDay,
      handleHour,
      gotoWelfareWebsite,
      handleWebsiteName,
      handleWebsiteImg,
      handleAuthorImg,
      handleLinkUrl,
      handleMonth,
      handleYearColor,
      handleImageError,
      handleMobileTitle,
      gotoMobileWebsite,
      dialogGuideVisible,
      dialogTitle,
      dialogContent,
      handleDialogContent,
      dialogMarginTop,
      handleDialogCancel,
      handleDialogConfirm,
      guideNewsLimited,
      selectedSource,
      selectedCategory,
      selectedFocus,
      sourceFilters,
      totalNewsCount,
      categoryOptions,
      focusOptions,
      filteredNews,
    };
  },
};
</script>

<style scoped>
.ecosystem-radar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 14px;
  padding: 18px 20px;
  border: 1px solid #d9e7ff;
  border-radius: 8px;
  background: linear-gradient(135deg, #f7faff, #eef5ff);
}
.radar-title {
  color: #30486f;
  font-size: 19px;
  font-weight: 700;
}
.radar-description {
  max-width: 700px;
  margin-top: 6px;
  color: #65738a;
  font-size: 13px;
  line-height: 1.6;
}
.radar-stats {
  display: flex;
  flex-shrink: 0;
  gap: 14px;
  color: #4a74ad;
  font-size: 13px;
  font-weight: 600;
}
.radar-filters {
  margin-bottom: 14px;
  padding: 13px 16px;
  border: 1px solid #e4e9f2;
  border-radius: 8px;
  background: #fff;
}
.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.filter-row + .filter-row {
  margin-top: 10px;
}
.filter-label {
  min-width: 60px;
  color: #65738a;
  font-size: 12px;
  font-weight: 700;
}
.filter-tag {
  padding: 4px 9px;
  border: 1px solid #d8e0ec;
  border-radius: 999px;
  background: #f8fafc;
  color: #52647d;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  line-height: 1.2;
  transition: 0.16s ease;
}
.filter-tag:hover {
  border-color: #8eb8ee;
  color: #337ecc;
}
.filter-tag.active {
  border-color: #409eff;
  background: #409eff;
  color: #fff;
}
.focus-tag.active {
  border-color: #7c65c1;
  background: #7c65c1;
}
.filter-result {
  margin-left: auto;
  color: #4a74ad;
  font-size: 12px;
  font-weight: 600;
}
.filter-empty {
  margin-bottom: 14px;
  padding: 28px;
  border: 1px dashed #c9d5e6;
  border-radius: 8px;
  color: #65738a;
  text-align: center;
}
.ecosystem-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 2px 0 7px;
}
.ecosystem-summary {
  max-width: 680px;
  margin-bottom: 9px;
  color: #65738a;
  font-size: 13px;
  line-height: 1.45;
}
.mobile-ecosystem-signal {
  display: flex;
  gap: 8px;
  margin-top: 7px;
  color: #4a74ad;
  font-size: 12px;
}
.dialog-content {
  padding: 0;
}
.dialog-footer {
  display: flex;
  justify-content: space-evenly;
}
.welfare-month {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #797979;
  font-weight: 600;
  font-size: 16px;
}
.welfare-div-website {
  display: flex;
  margin: auto 0;
}
.welfare-name-link {
  margin-top: 4px;
  color: #797979;
  font-weight: 600;
  font-size: 14px;
}
.welfare-img-link {
  height: 30px;
  width: 30px;
  border-radius: 50%;
  margin-right: 10px;
}
.weibo-img-link {
  color: rgb(255, 255, 255);
  height: 20px;
  width: 20px;
  border-radius: 4px;
  padding-left: 3px;
  padding-bottom: 3px;
}
.mobile-weibo-img {
  margin: 27px 18px 0px 0px;
}
.welfare-link-title {
  display: block;
  color: #797979;
  min-height: 30px;
  font-size: 18px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap; /* 防止内容换行 */
  overflow: hidden; /* 隐藏超出容器宽度的内容 */
  text-overflow: ellipsis; /* 使用省略号表示被截断的文本 */
  max-width: 600px;
}
.day-week-welfare {
  margin: 0px 20px;
}
.welfare-day {
  color: #737373;
  font-weight: 600;
  font-size: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.welfare-icon-hour {
  margin-right: 8px;
  margin-top: 2px;
}
.welfare-hour {
  margin: 0px 40px 0px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #797979;
  font-weight: 600;
  font-size: 14px;
}
.welfare-div-link {
  display: flex;
  /* margin-top: 27px; */
}
.el-welfare-divider {
  height: 100%;
}
.welfare-date {
  margin-right: 20px;
  display: flex;
}

.welfare-card {
  margin: 0px 0px 10px 0px;
}

:deep(.el-card__body) {
  justify-content: space-between;
  display: flex;
}
.mobile-div {
  display: none;
}

.el-card.is-hover-shadow:focus,
.el-card.is-hover-shadow:hover {
  background: linear-gradient(45deg, #f1f1f1, #f1f1f1 50%, #e8e8e8 50%, #e8e8e8),
    linear-gradient(45deg, #d9d9d9, #d9d9d9 50%, #ffffff 50%, #ffffff),
    linear-gradient(45deg, #cccccc, #cccccc 50%, #f1f1f1 50%, #f1f1f1);
  background-size: 100% 100px;
  background-repeat: repeat-y;
}
/* 响应式布局 */
@media screen and (max-width: 768px) {
  .ecosystem-radar {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
  }
  .radar-stats {
    flex-wrap: wrap;
    gap: 8px 14px;
  }
  .radar-filters {
    padding: 12px;
  }
  .filter-label,
  .filter-result {
    flex-basis: 100%;
  }
  .filter-result {
    margin: 2px 0 0;
  }
  .ecosystem-tags,
  .ecosystem-summary {
    display: none;
  }
  .welfare-div-website {
    display: none;
  }
  .welfare-date {
    display: none;
  }
  .welfare-card {
    margin: 0px 0px 10px 0px;
  }
  .mobile-div {
    display: block;
    width: 100%;
    background: linear-gradient(45deg, #f1f1f1, #f1f1f1 50%, #e8e8e8 50%, #e8e8e8),
      linear-gradient(45deg, #d9d9d9, #d9d9d9 50%, #ffffff 50%, #ffffff),
      linear-gradient(45deg, #cccccc, #cccccc 50%, #f1f1f1 50%, #f1f1f1);
    background-size: 100% 100px;
    background-repeat: repeat-y;
  }
  .mobile-div:focus,
  .mobile-div:hover {
    background: #ffffff;
  }

  .mobile-div-news {
    display: flex;
    justify-content: space-between;
  }
  :deep(.el-card__body) {
    padding: 0;
  }
  .mobile-link-title {
    color: #797979;
    min-height: 80px;
    font-size: 18px;
    font-weight: 600;
    max-width: 250px;
    margin: 27px 0px 0px 18px;
  }
  .mobile-img-link {
    margin: 27px 18px 0px 0px;
  }
  .mobile-click-show {
    display: flex;
    justify-content: space-between;
    margin: 30px 18px 23px 18px;
  }
  .welfare-mobile-hour {
    margin: 0;
  }
  .mobile-bt-detail {
    margin: auto 0;
    display: flex;
  }
  .mobile-welfare-img {
    height: 20px !important;
    width: 20px !important;
  }

  :deep(.el-dialog) {
    --el-dialog-width: 86%;
    margin: auto;
  }
}
</style>
