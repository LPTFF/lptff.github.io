<template>
    <div class="fund-suggestion-list">
        <h2>【基金持仓分析 - 多策略版】</h2>
        <p v-if="generatedAt" style="text-align:center; color: #888; margin-bottom: 24px;">
            数据更新于：{{ generatedAt }}
        </p>

        <div v-for="(fund, index) in visibleFunds" :key="fund.fundCode" class="fund-card">
            <h3>【{{ index + 1 }}. {{ fund.fundName }}】</h3>
            <p><strong>▶ 持仓情况：</strong><br />
                持有金额：{{ fund.holdAmount }}<br />
                持有收益：<span class="amount" :class="{
                    'text-red': fund.holdGain > 0,
                    'text-green': fund.holdGain < 0
                }">{{ fund.holdGain }}</span><br />
                收益率：<span class="amount" :class="{
                    'text-red': fund.holdGain > 0,
                    'text-green': fund.holdGain < 0
                }">{{ fund.holdRate }}</span><br />
            </p>
            <p><strong>▶ DeepSeek策略：</strong><br />
                是否交易：{{ fund.strategies['DeepSeek策略'].needTrade }}<br />
                交易类型：{{ fund.strategies['DeepSeek策略'].tradeType }}<br />
                交易时机：{{ fund.strategies['DeepSeek策略'].buyTiming }}<br />
                交易金额：<span class="amount">{{ fund.strategies['DeepSeek策略'].amount }}</span><br />
                目标分析收益：{{ fund.targetProfitRate * 100 }}%<br />
                分析理由：{{ fund.strategies['DeepSeek策略'].analysis }}<br />
            </p>

            <p><strong>▶ 低吸买入计算策略（参考）：</strong><br />
                是否交易：{{ fund.strategies['低吸买入计算策略（参考）'].needTrade }}<br />
                交易类型：{{ fund.strategies['低吸买入计算策略（参考）'].tradeType }}<br />
                交易时机：{{ fund.strategies['低吸买入计算策略（参考）'].buyTiming }}<br />
                交易金额：<span class="amount">{{ fund.strategies['低吸买入计算策略（参考）'].amount }}</span><br />
                目标分析收益：{{ fund.targetProfitRate * 100 }}%<br />
                分析理由：{{ fund.strategies['低吸买入计算策略（参考）'].analysis }}<br />
            </p>

            <!-- 股市实时行情 -->
            <div class="market-section" :ref="el => marketRefs[index] = el">
                <h4 class="toggle-header" @click="toggleMarket(index)">
                    📈 股市实时行情 <span>{{ visibleFunds[index].showMarket ? '（点击收起）' : '（点击展开）' }}</span>
                </h4>
                <iframe v-if="visibleFunds[index].showMarket" :src="getMarketUrl(fund)" loading="lazy" width="100%"
                    :height="isMobile ? 300 : 600" frameborder="0" scrolling="yes" title="股市行情"></iframe>
            </div>

            <!-- 基金行情 -->
            <div class="fund-section" :ref="el => fundRefs[index] = el">
                <h4 class="toggle-header" @click="toggleFund(index)">
                    📊 基金行情 <span>{{ visibleFunds[index].showFund ? '（点击收起）' : '（点击展开）' }}</span>
                </h4>
                <iframe v-if="visibleFunds[index].showFund" :src="fund.fundMarketUrl" loading="lazy" width="100%"
                    :height="isMobile ? 300 : 800" frameborder="0" scrolling="yes" title="基金行情"></iframe>
            </div>

            <div class="buy-link">
                <h4>🔗 购买地址</h4>
                <a :href="fund.fundUrl" target="_blank" rel="noopener noreferrer" class="buy-button">
                    点此前往购买（东方财富）
                </a>
            </div>
        </div>

        <!-- 滚动加载触发点 -->
        <div ref="loadTrigger" class="load-trigger"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
document.title = "【基金持仓分析 - 多策略版】";
function isWeChatMiniProgram() {
    // 这里用简单示例，你也可以用其他方式判断小程序环境
    const ua = navigator.userAgent || '';
    return /MicroMessenger/i.test(ua);
}

const getMarketUrl = (fund) => {
    if (isWeChatMiniProgram()) {
        return "https://wzq.tenpay.com/mp/v2/index.html?stat_data=orv53p00gf001#/market/index";
    } else {
        return "https://stockapp.finance.qq.com/mstats/";
    }
};
const fundList = ref([]);
const visibleFunds = ref([]);
const generatedAt = ref("");
const loadTrigger = ref(null);
const LOAD_COUNT = 2;
const isMobile = ref(window.innerWidth <= 768);
const updateDeviceType = () => {
    isMobile.value = window.innerWidth <= 768;
};
const marketRefs = ref([]);
const fundRefs = ref([]);

// 存放观察器实例
const marketObservers = [];
const fundObservers = [];

// 用来记录用户是否主动操作过展开收起
// { market: boolean[], fund: boolean[] }
const userToggled = ref({
    market: [],
    fund: []
});

const loadMoreFunds = () => {
    const nextFunds = fundList.value.slice(
        visibleFunds.value.length,
        visibleFunds.value.length + LOAD_COUNT
    ).map(f => ({
        ...f,
        showMarket: false,
        showFund: false,
    }));
    visibleFunds.value.push(...nextFunds);

    // 对应用户操作记录扩展
    userToggled.value.market.push(...new Array(nextFunds.length).fill(false));
    userToggled.value.fund.push(...new Array(nextFunds.length).fill(false));
};

let observer = null;

window.addEventListener("beforeunload", () => {
    sessionStorage.setItem("scrollTop", window.scrollY.toString());
    sessionStorage.setItem("visibleCount", visibleFunds.value.length.toString());
});

onMounted(async () => {
    window.addEventListener('resize', updateDeviceType);
    try {
        // const res = await fetch("/data/fundData.json?t=" + Date.now());
        const res = await fetch("/data/fundHoldData.json?t=" + Date.now());
        console.log(res);
        if (!res.ok) throw new Error("加载失败");
        const data = await res.json();
        fundList.value = data;
        console.log(data);

        if (data.length > 0 && data[0].generatedAt) {
            generatedAt.value = new Date(data[0].generatedAt).toLocaleString();
        }

        const savedCount = parseInt(sessionStorage.getItem("visibleCount") || "0", 10);
        const initialCount = isNaN(savedCount) || savedCount <= 0 ? LOAD_COUNT : savedCount;
        visibleFunds.value.push(...fundList.value.slice(0, initialCount).map(f => ({
            ...f,
            showMarket: false,
            showFund: false,
        })));

        // 初始化用户操作数组
        userToggled.value.market = new Array(visibleFunds.value.length).fill(false);
        userToggled.value.fund = new Array(visibleFunds.value.length).fill(false);

        setTimeout(() => {
            const scrollTop = parseInt(sessionStorage.getItem("scrollTop") || "0", 10);
            if (!isNaN(scrollTop)) {
                window.scrollTo(0, scrollTop);
            }
        }, 100);

        // 观察“滚动加载触发点”加载更多基金
        observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreFunds();
                nextTick(() => {
                    setupMarketObservers();
                    setupFundObservers();
                });
            }
        }, {
            root: null,
            threshold: 0.1
        });

        if (loadTrigger.value) {
            observer.observe(loadTrigger.value);
        }

        // 初始化已显示基金的观察器
        nextTick(() => {
            setupMarketObservers();
            setupFundObservers();
        });
    } catch (error) {
        console.error("读取 fundData.json 失败:", error);
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateDeviceType);
    if (observer && loadTrigger.value) {
        observer.unobserve(loadTrigger.value);
    }
    marketObservers.forEach(obs => obs.disconnect());
    fundObservers.forEach(obs => obs.disconnect());
});

// 用户点击切换股市行情显示状态
function toggleMarket(index) {
    visibleFunds.value[index].showMarket = !visibleFunds.value[index].showMarket;
    userToggled.value.market[index] = true; // 标记为用户主动操作
}

// 用户点击切换基金行情显示状态
function toggleFund(index) {
    visibleFunds.value[index].showFund = !visibleFunds.value[index].showFund;
    userToggled.value.fund[index] = true; // 标记为用户主动操作
}

// 自动展开股市行情观察器（只展开一次，不自动收起）
function setupMarketObservers() {
    marketObservers.forEach(obs => obs.disconnect());
    marketObservers.length = 0;

    marketRefs.value.forEach((el, idx) => {
        if (!el) return;
        const obs = new IntersectionObserver((entries) => {
            const isVisible = entries[0].isIntersecting;
            // 如果用户没操作过，且当前是首次进入视口，自动展开
            if (!userToggled.value.market[idx] && isVisible && !visibleFunds.value[idx].showMarket) {
                visibleFunds.value[idx].showMarket = false;
                // 不设置 userToggled，保持为false，以防未来用户操作才标记
            }
            // 不收起，也不自动展开后续滚动进出视口
        }, { threshold: 0.1 });
        obs.observe(el);
        marketObservers.push(obs);
    });
}

// 自动展开基金行情观察器（只展开一次，不自动收起）
function setupFundObservers() {
    fundObservers.forEach(obs => obs.disconnect());
    fundObservers.length = 0;

    fundRefs.value.forEach((el, idx) => {
        if (!el) return;
        const obs = new IntersectionObserver((entries) => {
            const isVisible = entries[0].isIntersecting;
            if (!userToggled.value.fund[idx] && isVisible && !visibleFunds.value[idx].showFund) {
                visibleFunds.value[idx].showFund = false;
            }
        }, { threshold: 0.1 });
        obs.observe(el);
        fundObservers.push(obs);
    });
}
</script>

<style scoped>
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
