<template>
    <div class="fund-suggestion-list">
        <h2>【基金买入建议 - 多策略版】</h2>
        <p v-if="generatedAt" style="text-align:center; color: #888; margin-bottom: 24px;">
            数据更新于：{{ generatedAt }}
        </p>

        <div v-for="(fund, index) in visibleFunds" :key="fund.fundCode" class="fund-card">
            <h3>【{{ index + 1 }}. {{ fund.fundName }}】</h3>

            <p><strong>▶ DeepSeek策略：</strong><br />
                买入时机：{{ fund.strategies['DeepSeek策略'].buyTiming }}<br />
                买入金额：<span class="amount">{{ fund.strategies['DeepSeek策略'].purchaseAmount }}</span>
            </p>

            <p><strong>▶ 低吸买入计算策略（参考）：</strong><br />
                买入时机：{{ fund.strategies['低吸买入计算策略'].buyTiming }}<br />
                买入金额：<span class="amount">{{ fund.strategies['低吸买入计算策略'].purchaseAmount }}</span>
            </p>

            <div class="market-section">
                <h4>📈 股市实时行情</h4>
                <iframe :src="fund.marketUrl" width="100%" height="300" frameborder="0" scrolling="yes"
                    title="股市行情"></iframe>
            </div>

            <div class="fund-section">
                <h4>📊 基金行情</h4>
                <iframe :src="fund.fundMarketUrl" width="100%" height="600" frameborder="0" scrolling="yes"
                    title="基金行情"></iframe>
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
import { ref, onMounted, onBeforeUnmount } from "vue";

const fundList = ref([]);
const visibleFunds = ref([]);
const generatedAt = ref("");
const loadTrigger = ref(null);
const LOAD_COUNT = 2;

const loadMoreFunds = () => {
    const nextFunds = fundList.value.slice(visibleFunds.value.length, visibleFunds.value.length + LOAD_COUNT);
    visibleFunds.value.push(...nextFunds);
};

let observer = null;

// 保存滚动和可见基金数量
window.addEventListener("beforeunload", () => {
    sessionStorage.setItem("scrollTop", window.scrollY.toString());
    sessionStorage.setItem("visibleCount", visibleFunds.value.length.toString());
});

onMounted(async () => {
    try {
        const res = await fetch("/data/fundData.json?t=" + Date.now());
        if (!res.ok) throw new Error("加载失败");
        const data = await res.json();
        fundList.value = data;

        if (data.length > 0 && data[0].generatedAt) {
            generatedAt.value = new Date(data[0].generatedAt).toLocaleString();
        }

        // 恢复加载的基金数量
        const savedCount = parseInt(sessionStorage.getItem("visibleCount") || "0", 10);
        const initialCount = isNaN(savedCount) || savedCount <= 0 ? LOAD_COUNT : savedCount;
        visibleFunds.value.push(...fundList.value.slice(0, initialCount));

        // 恢复滚动位置
        setTimeout(() => {
            const scrollTop = parseInt(sessionStorage.getItem("scrollTop") || "0", 10);
            if (!isNaN(scrollTop)) {
                window.scrollTo(0, scrollTop);
            }
        }, 100);

        // 设置滚动观察器
        observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreFunds();
            }
        }, {
            root: null,
            threshold: 0.1
        });

        if (loadTrigger.value) {
            observer.observe(loadTrigger.value);
        }
    } catch (error) {
        console.error("读取 fundData.json 失败:", error);
    }
});

onBeforeUnmount(() => {
    if (observer && loadTrigger.value) {
        observer.unobserve(loadTrigger.value);
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
</style>
