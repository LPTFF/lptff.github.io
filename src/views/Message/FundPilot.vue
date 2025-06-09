<template>
    <div class="fund-suggestion-list">
        <div style="position: sticky; top: 0; background-color: white; z-index: 1000; padding: 10px 0;">
            <h2 style="margin: 0 0 10px 0; text-align: center;">【基金分析 - tangfufa】</h2>
            <p v-if="generatedAt" style="text-align: center; margin: 0;">
                数据更新于：{{ generatedAt }}
            </p>
            <p style="text-align: center; margin: 0;">
                持仓基金数量：{{ fundList.holdInfo.length }}
                推荐基金数量：{{ fundList.recommendInfo.length }}
            </p>
        </div>
        <!-- 持仓信息展示 -->
        <div v-if="fundList.holdInfo.length && true" ref="holdSection">
            <div v-for="(fund, index) in fundList.holdInfo.slice(0, holdDisplayCount)" :key="'hold-' + fund.fundCode"
                class="fund-card">
                <h3>【持仓{{ index + 1 }}. {{ fund.fundName }} <span style="font-size: 0.8em; font-weight: normal;">{{
                    fund.fundCode }}</span>】</h3>
                <p style="margin: 0;"><strong>▶ 持仓情况：</strong><br />
                    持有金额：{{ fund.holdAmount }}<br />
                    持有收益：<span class="amount" :class="{
                        'text-red': fund.holdGain > 0,
                        'text-green': fund.holdGain < 0
                    }">{{ fund.holdGain }}</span><br />
                </p>
                <!-- 收益率及右上角提示，独立结构展示 -->
                <div class="profit-rate-wrapper">
                    <span>收益率：</span>
                    <span class="amount" :class="{
                        'text-red': fund.holdGain > 0,
                        'text-green': fund.holdGain < 0
                    }">
                        {{ fund.holdRate + '%' }}
                    </span>
                    <span v-if="Number(fund.holdRate) >= 5" class="rate-tip">
                        🎯 高估值浮盈，建议关注
                    </span>
                </div>
                <p v-if="fund.strategies?.['DeepSeek策略']">
                    ▶ DeepSeek策略<br />
                    是否交易：{{ fund.strategies['DeepSeek策略'].needTrade }}<br />
                    交易类型：<span :style="fund.strategies['DeepSeek策略'].tradeType?.includes('减仓')
                        ? 'color: red; font-weight: bold;'
                        : ''">
                        {{ fund.strategies['DeepSeek策略'].tradeType }}
                    </span>
                    <span v-if="fund.strategies['DeepSeek策略'].tradeType?.includes('减仓')"
                        style="color: orange; font-weight: bold;">
                        ⚠️当前为减仓操作，请注意控制风险
                    </span><br />
                    交易时机：{{ fund.strategies['DeepSeek策略'].buyTiming }}<br />
                    交易金额：<span class="amount">{{ fund.strategies['DeepSeek策略'].amount }}</span><br />
                    目标分析收益：{{ (fund.targetProfitRate * 100).toFixed(2) }}%<br />
                    分析理由：{{ fund.strategies['DeepSeek策略'].analysis }}
                </p>
                <p v-if="fund.strategies?.['低吸买入计算策略（参考）']">
                    ▶ 低吸买入计算策略（参考）<br />
                    是否交易：{{ fund.strategies['低吸买入计算策略（参考）'].needTrade }}<br />
                    交易类型：<span :style="fund.strategies['低吸买入计算策略（参考）'].tradeType?.includes('减仓')
                        ? 'color: red; font-weight: bold;'
                        : ''">
                        {{ fund.strategies['DeepSeek策略'].tradeType }}
                    </span>
                    <span v-if="fund.strategies['低吸买入计算策略（参考）'].tradeType?.includes('减仓')"
                        style="color: orange; font-weight: bold;">
                        ⚠️当前为减仓操作，请注意控制风险
                    </span><br />
                    交易时机：{{ fund.strategies['低吸买入计算策略（参考）'].buyTiming }}<br />
                    交易金额：<span class="amount">{{ fund.strategies['低吸买入计算策略（参考）'].amount }}</span><br />
                    目标分析收益：{{ (fund.targetProfitRate * 100).toFixed(2) }}%<br />
                    分析理由：{{ fund.strategies['低吸买入计算策略（参考）'].analysis }}
                </p>
                <div class="market-section">
                    <h4 class="toggle-header" @click="fund.expand.showMarket = !fund.expand.showMarket">
                        📈 股市实时行情 <span>{{ fund.expand.showMarket ? '（点击收起）' : '（点击展开）' }}</span>
                    </h4>
                    <iframe v-if="fund.expand.showMarket" :src="getMarketUrl(fund)" loading="lazy" width="100%"
                        :height="isMobile ? 300 : 600" frameborder="0" scrolling="yes" title="股市行情"></iframe>
                </div>
                <!-- 基金行情 -->
                <div class="fund-section">
                    <h4 class="toggle-header" @click="fund.expand.showFund = !fund.expand.showFund">
                        📊 基金行情 <span>{{ fund.expand.showFund ? '（点击收起）' : '（点击展开）' }}</span>
                    </h4>
                    <iframe v-if="fund.expand.showFund" :src="fund.fundMarketUrl" loading="lazy" width="100%"
                        :height="isMobile ? 300 : 800" frameborder="0" scrolling="yes" title="基金行情"></iframe>
                </div>
                <div class="buy-link">
                    <h4>🔗 购买地址</h4>
                    <a :href="fund.fundUrl" target="_blank" rel="noopener noreferrer" class="buy-button">
                        点此前往购买（东方财富）
                    </a>
                </div>
            </div>
        </div>
        <div v-else>
            <p>⚠️ fundList.holdInfo 数据为空或加载失败。</p>
        </div>
        <!-- 推荐信息展示 -->
        <div v-if="fundList.recommendInfo.length && true" ref="recommendSection">
            <div v-for="(fund, index) in fundList.recommendInfo.slice(0, recommendDisplayCount)"
                :key="'recommend-' + fund.fundCode" class="fund-card">
                <h3>【推荐 {{ index + 1 }}. {{ fund.fundName }} <span style="font-size: 0.8em; font-weight: normal;">{{
                    fund.fundCode }}</span>】</h3>
                <p><strong>▶ DeepSeek策略：</strong><br />
                    买入时机：{{ fund.strategies['DeepSeek策略'].buyTiming }}<br />
                    买入金额：<span class="amount">{{ fund.strategies['DeepSeek策略'].purchaseAmount }}</span><br />
                    买入评分：{{ fund.strategies['DeepSeek策略'].purchaseScore }}<br />
                    目标分析收益：{{ fund.targetProfitRate * 100 }}%<br />
                    分析理由：{{ fund.strategies['DeepSeek策略'].recommendation }}<br />
                </p>
                <p><strong>▶ 低吸买入计算策略（参考）：</strong><br />
                    买入时机：{{ fund.strategies['低吸买入计算策略'].buyTiming }}<br />
                    买入金额：<span class="amount">{{ fund.strategies['低吸买入计算策略'].purchaseAmount }}</span><br />
                    买入评分：{{ fund.strategies['低吸买入计算策略'].purchaseScore }}<br />
                    目标分析收益：{{ fund.targetProfitRate * 100 }}%<br />
                    分析理由：{{ fund.strategies['低吸买入计算策略'].recommendation }}<br />
                </p>
                <!-- 股市实时行情 -->
                <div class="market-section">
                    <h4 class="toggle-header" @click="fund.expand.showMarket = !fund.expand.showMarket">
                        📈 股市实时行情 <span>{{ fund.expand.showMarket ? '（点击收起）' : '（点击展开）' }}</span>
                    </h4>
                    <iframe v-if="fund.expand.showMarket" :src="getMarketUrl(fund)" loading="lazy" width="100%"
                        :height="isMobile ? 300 : 600" frameborder="0" scrolling="yes" title="股市行情"></iframe>
                </div>
                <!-- 基金行情 -->
                <div class="fund-section">
                    <h4 class="toggle-header" @click="fund.expand.showFund = !fund.expand.showFund">
                        📊 基金行情 <span>{{ fund.expand.showFund ? '（点击收起）' : '（点击展开）' }}</span>
                    </h4>
                    <iframe v-if="fund.expand.showFund" :src="fund.fundMarketUrl" loading="lazy" width="100%"
                        :height="isMobile ? 300 : 800" frameborder="0" scrolling="yes" title="基金行情"></iframe>
                </div>
                <div class="buy-link">
                    <h4>🔗 购买地址</h4>
                    <a :href="fund.fundUrl" target="_blank" rel="noopener noreferrer" class="buy-button">
                        点此前往购买（东方财富）
                    </a>
                </div>
            </div>
        </div>
        <div v-else>
            <p>⚠️ fundList.recommendInfo 数据为空或加载失败。</p>
        </div>
        <button v-show="showBackToTop && isPCRes" class="back-to-top" @click="scrollToTop">
            🚀 回到顶部
        </button>

    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from "vue";
import { useRoute } from 'vue-router';
import { isPC } from "../../utils/utils";
const showBackToTop = ref(false);
const isPCRes = computed(() => isPC());
console.info('isPCRes', isPCRes)
const handleScroll = () => {
    showBackToTop.value = window.scrollY > 300; // 超过300px就显示
};

// 滚动到顶部
const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};
const route = useRoute();
// 存储滚动位置
const saveScrollPosition = () => {
    const keyPrefix = `scroll-${route.fullPath}`;
    sessionStorage.setItem(keyPrefix + "-pos", window.scrollY.toString());
    sessionStorage.setItem(keyPrefix + "-holdCount", holdDisplayCount.value.toString());
    sessionStorage.setItem(keyPrefix + "-recommendCount", recommendDisplayCount.value.toString());
};

// 恢复滚动位置
const restoreScrollPosition = () => {
    const keyPrefix = `scroll-${route.fullPath}`;
    const pos = sessionStorage.getItem(keyPrefix + "-pos");
    const holdCount = sessionStorage.getItem(keyPrefix + "-holdCount");
    const recommendCount = sessionStorage.getItem(keyPrefix + "-recommendCount");

    if (holdCount) holdDisplayCount.value = parseInt(holdCount);
    if (recommendCount) recommendDisplayCount.value = parseInt(recommendCount);

    if (pos) {
        nextTick(() => {
            window.scrollTo({ top: parseInt(pos), behavior: "smooth" });
        });
    }
};


document.title = "【基金分析 - tangfufa】";
const isWeChatMiniProgram = () => /MicroMessenger/i.test(navigator.userAgent);
const getMarketUrl = (fund) => {
    return isWeChatMiniProgram()
        ? "https://wzq.tenpay.com/mp/v2/index.html?stat_data=orv53p00gf001#/market/index"
        : "https://stockapp.finance.qq.com/mstats/";
};
const fundList = ref({
    holdInfo: [],
    recommendInfo: []
});
const generatedAt = ref("");
const isMobile = ref(window.innerWidth <= 768);
const holdSection = ref(null);
const recommendSection = ref(null);
// 控制显示数量
const holdDisplayCount = ref(2);
const recommendDisplayCount = ref(0);
const loadMoreOnScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const clientHeight = window.innerHeight;
    const scrollBottom = scrollTop + clientHeight;
    // 持仓区是否还没加载完
    if (holdDisplayCount.value < fundList.value.holdInfo.length) {
        holdDisplayCount.value += 2;
        saveScrollPosition();
        return;
    }
    // 判断推荐区是否进入可视区域
    if (
        recommendSection.value &&
        scrollBottom >= recommendSection.value.offsetTop - 200
    ) {
        if (recommendDisplayCount.value < fundList.value.recommendInfo.length) {
            recommendDisplayCount.value += 2;
            saveScrollPosition();
        }
    }
};
watch(() => fundList, (val) => {
    if (val?.holdInfo?.length || val?.recommendInfo?.length) {
        restoreScrollPosition();
    }
});
onBeforeUnmount(() => {
    window.removeEventListener("scroll", loadMoreOnScroll);
    window.removeEventListener('scroll', saveScrollPosition);
    window.removeEventListener('scroll', handleScroll);
});
onMounted(async () => {
    try {
        const res = await fetch(`/data/fundPilotData.json?t=${Date.now()}`);
        const data = await res.json();
        console.info('data', data)
        const holdInfo = (data.holdInfo || []).map(fund => ({
            ...fund,
            expand: {
                showMarket: false,
                showFund: false
            }
        }));
        const recommendInfo = (data.recommendInfo || []).map(fund => ({
            ...fund,
            expand: {
                showMarket: false,
                showFund: false
            }
        }));
        console.info('holdInfo', holdInfo)
        console.info('recommendInfo', recommendInfo)
        fundList.value.holdInfo = holdInfo;
        fundList.value.recommendInfo = recommendInfo;
        const firstGenerated = data?.recommendInfo?.[0]?.generatedAt;
        if (firstGenerated) {
            generatedAt.value = new Date(firstGenerated).toLocaleString();
        }
        window.addEventListener("scroll", loadMoreOnScroll);
        window.addEventListener('scroll', saveScrollPosition);
        window.addEventListener('scroll', handleScroll);
        restoreScrollPosition();
    } catch (error) {
        console.error("读取数据失败:", error);
    }
});
</script>

<style scoped>
.back-to-top {
    position: fixed;
    bottom: 10%;
    right: 8%;
    padding: 10px 20px;
    background-color: #1976d2;
    color: white;
    border: none;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    z-index: 10000;
    font-size: 14px;
    transition: opacity 0.3s;
}

.profit-rate-wrapper {
    position: relative;
    display: inline-block;
    margin-bottom: 0.5em;
}

.rate-tip {
    position: absolute;
    top: 2px;
    right: -150px;
    font-size: 12px;
    color: orange;
    font-weight: bold;
}

.fund-suggestion-list {
    font-family: Arial, sans-serif;
    padding: 20px;
    background: #fff;
    max-width: 900px;
    margin: auto;
}

.fund-card {
    margin-bottom: 40px;
    padding: 16px;
    border: 1px solid #ddd;
    border-radius: 12px;
    background: #f9f9f9;
}

h2 {
    font-size: 22px;
    color: #2c3e50;
    margin-bottom: 24px;
    text-align: center;
}

h3 {
    color: #34495e;
    margin-bottom: 12px;
}

h4 {
    color: #555;
    margin-top: 20px;
    cursor: pointer;
}

.toggle-header span {
    font-size: 14px;
    color: #888;
    margin-left: 8px;
}

.amount {
    color: #e74c3c;
    font-weight: bold;
}

.buy-button {
    display: inline-block;
    margin-top: 10px;
    padding: 8px 12px;
    background-color: #1e90ff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    transition: background-color 0.3s ease;
}

.buy-button:hover {
    background-color: #0073e6;
}

iframe {
    border: 1px solid #ccc;
    margin-top: 8px;
    border-radius: 6px;
}

.load-trigger {
    height: 1px;
}

.text-red {
    color: red;
}

.text-green {
    color: green;
}

@media (max-width: 600px) {
    iframe {
        pointer-events: auto;
        /* 默认允许指针事件 */
    }
}
</style>
