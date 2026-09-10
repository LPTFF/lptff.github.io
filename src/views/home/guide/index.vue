<template>
  <div>
    <div class="ecosystem-panel">
      <section class="ecosystem-radar" aria-labelledby="guide-radar-title">
        <div>
          <div class="radar-title" id="guide-radar-title">热门资讯生态雷达</div>
          <div class="radar-description">
            汇集抖音热榜、快手热榜、微博热搜、小红书公开发现与南方周末，观察公共注意力、生活趋势和深度议题。
          </div>
        </div>
        <div class="radar-stats">
          <span>{{ totalNewsCount }} 条资讯</span>
          <span>{{ analyzedCount }} 条 Gemini 已分析</span>
          <span>{{ categoryOptions.length }} 个生态主题</span>
        </div>
      </section>
      <section class="radar-filters" aria-label="热门资讯生态筛选">
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
        </div>
        <div class="filter-row" role="group" aria-label="按资讯来源筛选">
          <span class="filter-label">观察源</span>
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
          <span class="filter-result">{{ filteredNews.length }} 条当前结果</span>
        </div>
      </section>
      <details class="collector-details">
        <summary>Gemini 标签逻辑与更新规则</summary>
        <p>汇集抖音热榜、快手热榜、微博热搜、小红书公开发现与南方周末 5 个观察源，统一直接由 Gemini 3.5 智能模型进行全量语义理解，生成生态主题分类与观察摘要。</p>
        <p>模型根据各平台新闻标题、事件背景及跨平台热度，归类至政务与时事、社会与民生、科技与产业、文娱与影视、消费与生活、教育与职场、财经与商业、体育与竞技、深度特稿与网络潮流 10 大生态主题，真实反映当下公共注意力分布。</p>
        <p>观察视角根据 Gemini 分析结果生成：跨来源共振＝同一主题在 2 个及以上来源同时上榜发酵；热榜前列＝各平台 Top 10 核心关注；深度特稿＝南方周末深度调查特稿与事件背景追踪。</p>
        <p>列表严格按最新发布与采集时间倒序呈现，各来源保留原始榜单名次与热度值；数据随采集流水线由 Gemini 每日自动分析并更新发布。</p>
      </details>
    </div>
    <div class="filter-empty" v-if="filteredNews.length === 0">
      {{ selectedSource === 'xiaohongshu' && !xiaohongshuNewsCount
        ? '小红书暂无可用资讯。'
        : selectedSource === 'kuaishou' && !kuaishouNewsCount
          ? '快手热榜暂无可用资讯。'
          : '当前筛选组合暂无资讯，可以切换来源、主题或观察视角。' }}
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
                <el-tag size="small" type="danger" v-if="handleRankLabel(item)">
                  {{ handleRankLabel(item) }}
                </el-tag>
                <el-tag size="small" type="warning" v-if="handleHeatLabel(item)">
                  {{ handleHeatLabel(item) }}
                </el-tag>
                <el-tag size="small">{{ item.ecosystem.category }}</el-tag>
                <el-tag size="small" type="primary" v-if="item.ecosystem.sourceBreadth > 1">
                  {{ item.ecosystem.sourceBreadth }} 源共振
                </el-tag>
                <el-tag size="small" type="success" v-if="item.ecosystem.isDeep">
                  深度特稿
                </el-tag>
              </div>
              <div class="ecosystem-summary">{{ item.ecosystem.observation }}</div>
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
                  @error="handleImageError"
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
import xiaohongshuNews from "../../../data/xiaohongshu.json";
import kuaishouHotNews from "../../../data/kuaishouHot.json";
import guideEcosystem from "../../../data/guide-ecosystem.json";
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
    const xiaohongshuNewsCount = xiaohongshuNews.length;
    const kuaishouNewsCount = kuaishouHotNews.length;
    const rawSourceDefinitions = [
      {
        id: "kuaishou",
        label: "快手热榜",
        items: kuaishouHotNews as any[],
      },
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
        id: "xiaohongshu",
        label: "小红书",
        items: xiaohongshuNews as any[],
      },
      {
        id: "infzm",
        label: "南方周末",
        items: infzmNews as any[],
      },
    ];
    const ecosystemByUrl = new Map<string, any>(
      ((guideEcosystem as any).items || []).map((item: any) => [item.url, item])
    );
    const topicDefinitions = [
      {
        name: "深度特稿",
        keywords: ["南方周末", "调查", "特稿", "深度追踪", "独家调查", "记者调查"],
      },
      {
        name: "政务与时事",
        keywords: [
          "总书记", "习近平", "中方", "外交部", "政策", "政府", "国务院", "证监会",
          "法院", "检察院", "人大", "政协", "医保", "养老", "税收", "宏观调控",
          "联合声明", "美联储", "菲律宾", "尼泊尔", "美国反对", "中俄蒙", "台海",
          "国防部", "国家安全", "党纪", "驻华使馆", "双边关系", "峰会", "指示",
          "反华", "两岸", "军官", "被处理", "落马", "纪委", "运河", "基建", "新规",
        ],
      },
      {
        name: "社会与民生",
        keywords: [
          "泥石流", "滑坡", "火灾", "遇难", "失联", "被埋", "灾害", "救援", "坍塌",
          "事故", "货轮火灾", "消防", "搜救", "暴雨", "台风", "地震", "洪涝", "走失",
          "被拐", "抓捕", "立案", "通报", "被查", "拘留", "涉案", "造谣", "诈骗",
          "民警", "警方", "交警", "医患", "医院", "食品安全", "青岛货轮", "死亡",
          "猝死", "离世", "逝世", "去世", "患病", "重症", "感染", "癌症", "病例",
          "性侵", "获刑", "判刑", "殴打", "被拘", "未成年", "叮咬", "垃圾", "出狱",
        ],
      },
      {
        name: "体育与竞技",
        keywords: [
          "足球", "篮球", "比赛", "冠军", "亚军", "全运会", "奥运", "世界杯", "英超",
          "西甲", "欧冠", "NBA", "CBA", "拳王", "乒乓球", "羽毛球", "网球", "赛道",
          "比分", "绝杀", "圣日耳曼", "利物浦", "贝林厄姆", "姆巴佩", "赵心童", "郑钦文",
          "破纪录", "夺冠", "男排", "女排", "男足", "女足", "男篮", "女篮", "亚锦赛",
          "库里", "詹姆斯", "陈芋汐", "全红婵", "严子怡",
        ],
      },
      {
        name: "科技与产业",
        keywords: [
          "科技", "人工智能", "AI", "大模型", "机器人", "芯片", "算力", "半导体",
          "华为", "苹果", "iPhone", "英伟达", "商业航天", "火箭", "卫星", "暗物质",
          "DLSS", "产品发布", "企业AI", "自动驾驶", "新能源", "电池", "量子", "低空经济",
        ],
      },
      {
        name: "财经与商业",
        keywords: [
          "股市", "A股", "港股", "美股", "基金", "理财", "银行", "降息", "加息",
          "财报", "营收", "利润", "上市", "IPO", "破产", "收购", "并购", "油价",
          "汇率", "人民币", "黄金", "楼市", "房价", "房贷", "首付", "恒大", "万科",
          "投资", "双向投资", "外贸", "贸易", "关税", "资产", "千亿", "商界",
        ],
      },
      {
        name: "文娱与影视",
        keywords: [
          "电影", "电视剧", "剧集", "综艺", "演员", "明星", "歌手", "演唱会", "音乐",
          "舞台", "MV", "粉丝", "拍摄", "造型", "口碑", "票房", "实体专", "广告",
          "订婚", "结婚", "离婚", "分手", "恋情", "花少", "极限挑战", "早春晴朗",
          "披荆斩棘", "说唱", "舞蹈", "角色", "首映", "首播", "金鸡奖", "百花奖",
          "定档", "国庆档", "刘亦菲", "女星", "小猪佩奇", "动漫", "入驻快手",
        ],
      },
      {
        name: "消费与生活",
        keywords: [
          "消费", "文旅", "旅游", "景区", "追秋", "秋日", "妆容", "穿搭", "通勤",
          "打卡", "美食", "餐厅", "小吃", "月饼", "中秋", "奶茶", "咖啡", "露营",
          "宠物", "小猫", "小狗", "天气", "降温", "减肥", "外套", "优衣库", "买菜",
          "超市", "八角", "向日葵", "种植", "见老丈人", "怀孕", "官宣", "家常",
        ],
      },
      {
        name: "教育与职场",
        keywords: [
          "教育", "开学", "学校", "大学", "中学", "小学", "老师", "教师", "好老师",
          "同学", "学生", "应届生", "找工作", "招聘", "求职", "上班", "下班", "职场",
          "考公", "考研", "高考", "中考", "写字", "军训", "校服", "主科", "课外班",
          "清华", "北大", "复旦", "硕士", "附中", "读懂",
        ],
      },
      {
        name: "网络与潮流",
        keywords: [
          "流行", "热梗", "抽象", "网友", "热评", "搞笑", "整活", "模仿", "挑战",
          "短视频", "日常", "手滑", "点赞", "出圈", "治愈", "神仙操作", "功夫", "武术",
        ],
      },
    ];
    const classifyTopic = (item: any) => {
      if (item.website === "infzm") return "深度特稿";
      const content = String(item.title || "").toUpperCase();
      return (
        topicDefinitions.find((topic) =>
          topic.keywords.some((keyword) => content.includes(keyword.toUpperCase()))
        )?.name || "网络与潮流"
      );
    };
    const sourceDefinitions = rawSourceDefinitions.map((source) => ({
      ...source,
      items: source.items.map((item) => {
        const eco = ecosystemByUrl.get(item.url) as any;
        const category = eco?.category || classifyTopic(item);
        const isTop = eco
          ? eco.isTop
          : Number(item.rank) > 0 && Number(item.rank) <= 10;
        const isDeep = eco
          ? eco.isDeep
          : source.id === "infzm" && String(item.desc || "").length >= 50;
        const sourceBreadth = eco?.sourceBreadth || 1;
        const rankText = item.rank
          ? `第 ${item.rank} 位`
          : source.id === "xiaohongshu"
            ? "公开发现内容"
            : source.id === "infzm"
              ? "深度特稿"
              : "置顶信号";
        const heatText = item.hotValue ? ` · 热度 ${item.hotValue}` : "";
        const observation = eco
          ? eco.observation
          : isDeep
            ? `来自南方周末的深度特稿，为当前${category}补充事件背景与后续。`
            : sourceBreadth > 1
              ? `当前快照中，这类${category}同时出现在 ${sourceBreadth} 个来源；本条为${source.label}${rankText}${heatText}。`
              : `本条为${source.label}${rankText}${heatText}，反映该平台此刻的注意力。`;

        return {
          ...item,
          website: item.website || source.id,
          ecosystem: {
            category,
            isTop,
            isDeep,
            sourceBreadth,
            observation,
          },
        };
      }),
    }));

    // Strictly sort by timestamp descending (newest first).
    // If same timestamp / batch, sort by rank ascending (rank 0 / 1 first).
    const allItems = sourceDefinitions.flatMap((source) => source.items);
    const newsGuide = allItems.sort((a, b) => {
      const timeDiff = (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0);
      if (timeDiff !== 0) return timeDiff;
      const rankA = Number(a.rank) > 0 ? Number(a.rank) : (a.rank === 0 || a.rank === "0" ? 0 : 999);
      const rankB = Number(b.rank) > 0 ? Number(b.rank) : (b.rank === 0 || b.rank === "0" ? 0 : 999);
      return rankA - rankB;
    });

    const totalNewsCount = newsGuide.length;
    const analyzedCount = computed(
      () => newsGuide.filter((item: any) => item.ecosystem).length
    );
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
      { key: "deep", label: "深度特稿" },
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
    const handleRankLabel = (item: any) => {
      const rankVal = item.rank;
      if (rankVal === undefined || rankVal === null || rankVal === "") return "";
      const rankNum = Number(rankVal);
      if (item.website === "kuaishou") {
        return rankNum > 0 ? `快手热榜 #${rankNum}` : "快手置顶";
      }
      if (item.website === "douyinHot") {
        return rankNum > 0 ? `抖音热榜 #${rankNum}` : "抖音置顶";
      }
      if (item.website === "weibo") {
        return rankNum > 0 ? `微博热搜 #${rankNum}` : "微博置顶";
      }
      return rankNum > 0 ? `榜单 #${rankNum}` : "置顶信号";
    };
    const handleHeatLabel = (item: any) => {
      if (item.hotValue) return `热度 ${item.hotValue}`;
      if (item.heat) return `热度 ${item.heat}`;
      if (item.website === "weibo" && item.image?.small_icon_desc) {
        return item.image.small_icon_desc;
      }
      return "";
    };
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
        case "kuaishou":
          websiteLogo = item.poster || item.captionUrl || item.image || logoUrl;
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
        case "xiaohongshu":
        case "kuaishou":
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
        case "kuaishou":
          websiteName = "快手热榜";
          break;
        case "xiaohongshu":
          websiteName = "小红书";
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
        case "kuaishou":
          websiteImg = "https://www.kuaishou.com/favicon.ico";
          break;
        case "xiaohongshu":
          websiteImg = "https://fe-video-qc.xhscdn.com/fe-platform/ed8fe781ce9e16c1bfac2cd962f0721edabe2e49.ico";
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
      xiaohongshuNewsCount,
      kuaishouNewsCount,
      analyzedCount,
      handleRankLabel,
      handleHeatLabel,
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
.ecosystem-panel {
  min-width: 0;
  margin-bottom: 14px;
  padding: 16px 18px;
  overflow: hidden;
  border: 1px solid #d8e5f5;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8fbff 0%, #f3f8ff 100%);
}
.collector-details {
  margin-top: 12px;
  color: #65738a;
  font-size: 12px;
  line-height: 1.6;
}
.collector-details summary {
  cursor: pointer;
  color: #4a74ad;
}
.collector-details p {
  margin: 8px 0 0;
}
.ecosystem-radar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
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
  min-width: 0;
  margin-top: 12px;
  padding: 9px 12px;
  border: 1px solid #dce6f2;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.78);
}
.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}
.filter-row + .filter-row {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #edf1f6;
}
.filter-label {
  width: 64px;
  flex: 0 0 64px;
  color: #52657c;
  font-size: 12px;
  font-weight: 700;
}
.filter-tag {
  min-height: 26px;
  padding: 2px 9px;
  border: 1px solid #cedbea;
  border-radius: 999px;
  background: #fff;
  color: #52647d;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  line-height: 1.2;
  transition: 0.16s ease;
}
.filter-tag:hover {
  border-color: #7eaaf0;
  color: #3471c9;
}
.filter-tag:focus-visible {
  outline: 2px solid #8cb8f4;
  outline-offset: 2px;
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
  .ecosystem-panel {
    padding: 13px;
  }

  .ecosystem-radar {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .radar-stats {
    flex-wrap: wrap;
    gap: 7px 12px;
    font-size: 11px;
  }

  .radar-filters {
    padding: 8px 9px;
  }

  .radar-filters .filter-row {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 1px;
    scrollbar-width: none;
  }

  .radar-filters .filter-row::-webkit-scrollbar {
    display: none;
  }

  .radar-filters .filter-label,
  .radar-filters .filter-tag,
  .radar-filters .filter-result {
    flex: 0 0 auto;
  }

  .radar-filters .filter-label {
    width: auto;
    min-width: 60px;
  }

  .filter-tag {
    min-height: 32px;
    padding: 4px 9px;
  }

  .filter-result {
    margin-left: 6px;
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
