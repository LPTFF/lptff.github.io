<template>
    <div class="fund-suggestion-list">
        <h2>【基金买入建议 - 多策略版】</h2>

        <div v-for="(fund, index) in fundList" :key="fund.code" class="fund-card">
            <h3>【{{ index + 1 }}. {{ fund.name }}】</h3>

            <p><strong>▶ DeepSeek策略：</strong><br />
                买入时机：{{ fund.deepSeek.strategy }}<br />
                买入金额：<span class="amount">{{ fund.deepSeek.amount }}</span>
            </p>

            <p><strong>▶ 低吸买入计算策略（参考）：</strong><br />
                买入时机：{{ fund.lowBuy.strategy }}<br />
                买入金额：<span class="amount">{{ fund.lowBuy.amount }}</span>
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
                <a :href="fund.buyUrl" target="_blank" rel="noopener noreferrer" class="buy-button">
                    点此前往购买（东方财富）
                </a>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'FundSuggestionList',
    data() {
        return {
            fundList: [
                {
                    name: '长城医药产业精选混合发起式C',
                    code: '022287',
                    deepSeek: {
                        strategy: '基金估值上涨',
                        amount: '80元',
                    },
                    lowBuy: {
                        strategy: '暂不建议买入',
                        amount: '0元',
                    },
                    marketUrl: 'https://stockapp.finance.qq.com/mstats/',
                    fundMarketUrl:
                        'https://lc.jr.jd.com/finance/fund/latestdetail/index/?fundCode=022287',
                    buyUrl: 'https://fund.eastmoney.com/022287.html',
                },
                {
                    name: '申万菱信消费增长混合C',
                    code: '015254',
                    deepSeek: {
                        strategy: '大盘上涨',
                        amount: '80元',
                    },
                    lowBuy: {
                        strategy: '暂不建议买入',
                        amount: '0元',
                    },
                    marketUrl: 'https://stockapp.finance.qq.com/mstats/',
                    fundMarketUrl:
                        'https://lc.jr.jd.com/finance/fund/latestdetail/index/?fundCode=015254',
                    buyUrl: 'https://fund.eastmoney.com/015254.html',
                },
                {
                    name: '同泰产业升级混合C',
                    code: '014939',
                    deepSeek: {
                        strategy: '大盘上涨',
                        amount: '50元',
                    },
                    lowBuy: {
                        strategy: '暂不建议买入',
                        amount: '0元',
                    },
                    marketUrl: 'https://stockapp.finance.qq.com/mstats/',
                    fundMarketUrl:
                        'https://lc.jr.jd.com/finance/fund/latestdetail/index/?fundCode=014939',
                    buyUrl: 'https://fund.eastmoney.com/014939.html',
                },
            ],
        };
    },
};
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
</style>
