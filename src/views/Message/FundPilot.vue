<template>
    <div class="fund-suggestion-list">
        <h2>【基金分析 - tangfufa】</h2>
        <p v-if="generatedAt" style="text-align:center;">
            数据更新于：{{ generatedAt }}
        </p>
        <!-- 持仓信息展示 -->
        <div v-if="fundList.holdInfo.length && true">
            <div v-for="(fund, index) in fundList.holdInfo" :key="'hold-' + fund.fundCode" class="fund-card">
                <h3>【持仓{{ index + 1 }}. {{ fund.fundName }}】</h3>
                <p><strong>▶ 持仓情况：</strong><br />
                    持有金额：{{ fund.holdAmount }}<br />
                    持有收益：<span class="amount" :class="{
                        'text-red': fund.holdGain > 0,
                        'text-green': fund.holdGain < 0
                    }">{{ fund.holdGain }}</span><br />
                    收益率：<span class="amount" :class="{
                        'text-red': fund.holdGain > 0,
                        'text-green': fund.holdGain < 0
                    }">{{ fund.holdRate + '%' }}</span><br />
                </p>

                <p v-if="fund.strategies?.['DeepSeek策略']">
                    ▶ DeepSeek策略<br />
                    是否交易：{{ fund.strategies['DeepSeek策略'].needTrade }}<br />
                    交易类型：{{ fund.strategies['DeepSeek策略'].tradeType }}<br />
                    交易时机：{{ fund.strategies['DeepSeek策略'].buyTiming }}<br />
                    交易金额：{{ fund.strategies['DeepSeek策略'].amount }}<br />
                    目标分析收益：{{ (fund.targetProfitRate * 100).toFixed(2) }}%<br />
                    分析理由：{{ fund.strategies['DeepSeek策略'].analysis }}
                </p>

                <p v-if="fund.strategies?.['低吸买入计算策略（参考）']">
                    ▶ 低吸买入计算策略（参考）<br />
                    是否交易：{{ fund.strategies['低吸买入计算策略（参考）'].needTrade }}<br />
                    交易类型：{{ fund.strategies['低吸买入计算策略（参考）'].tradeType }}<br />
                    交易时机：{{ fund.strategies['低吸买入计算策略（参考）'].buyTiming }}<br />
                    交易金额：{{ fund.strategies['低吸买入计算策略（参考）'].amount }}<br />
                    目标分析收益：{{ (fund.targetProfitRate * 100).toFixed(2) }}%<br />
                    分析理由：{{ fund.strategies['低吸买入计算策略（参考）'].analysis }}
                </p>
                <div class="market-section">
                    <h4 class="toggle-header">
                        📈 股市实时行情 <span>{{ false ? '（点击收起）' : '（点击展开）' }}</span>
                    </h4>
                    <iframe v-if="false" :src="getMarketUrl(fund)" loading="lazy" width="100%"
                        :height="isMobile ? 300 : 600" frameborder="0" scrolling="yes" title="股市行情"></iframe>
                </div>

                <!-- 基金行情 -->
                <div class="fund-section">
                    <h4 class="toggle-header">
                        📊 基金行情 <span>{{ false ? '（点击收起）' : '（点击展开）' }}</span>
                    </h4>
                    <iframe v-if="false" :src="fund.fundMarketUrl" loading="lazy" width="100%"
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
        <div v-if="fundList.recommendInfo.length">
            <div v-for="(fund, index) in fundList.recommendInfo" :key="'recommend-' + fund.fundCode" class="fund-card">
                <h3>【推荐 {{ index + 1 }}. {{ fund.fundName }}】</h3>
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
                    <h4 class="toggle-header">
                        📈 股市实时行情 <span>{{ false ? '（点击收起）' : '（点击展开）' }}</span>
                    </h4>
                    <iframe v-if="false" :src="getMarketUrl(fund)" loading="lazy" width="100%"
                        :height="isMobile ? 300 : 600" frameborder="0" scrolling="yes" title="股市行情"></iframe>
                </div>
                <!-- 基金行情 -->
                <div class="fund-section">
                    <h4 class="toggle-header">
                        📊 基金行情 <span>{{ false ? '（点击收起）' : '（点击展开）' }}</span>
                    </h4>
                    <iframe v-if="false" :src="fund.fundMarketUrl" loading="lazy" width="100%"
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
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

document.title = "【基金持仓分析 - 多策略版】";

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

onMounted(async () => {
    try {
        const res = await fetch(`/data/fundPilotData.json?t=${Date.now()}`);
        const data = await res.json();
        console.info('data', data)
        fundList.value.holdInfo = data.holdInfo || [];
        fundList.value.recommendInfo = data.recommendInfo || [];
        const firstGenerated = data?.recommendInfo?.[0]?.generatedAt;
        if (firstGenerated) {
            generatedAt.value = new Date(firstGenerated).toLocaleString();
        }
    } catch (error) {
        console.error("读取数据失败:", error);
    }
});
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
