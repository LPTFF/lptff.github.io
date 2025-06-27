<template>
    <div style="width: 100%">
        <div style="position: sticky; top: 0; background-color: white; z-index: 1000; padding: 10px 0;">
            <div>
                <h2 style="margin: 0 0 10px 0; text-align: center;">【基金分析 - tangfufa】</h2>
                <p v-if="generatedAt" style="text-align: center; margin: 0;">
                    数据更新于：{{ generatedAt }}
                </p>
            </div>
            <div v-if="selectedHoldRows.length > 0">当前选中的持仓基金数量：{{
                selectedHoldRows.length }}，当前选中的持仓基金总金额：{{
                    selectedHoldAmount }}，当前选中的持仓基金总收益：{{
                    selectedHoldGain }}</div>
            <div v-if="selectedHoldRows.length > 0">
                <el-button type="primary" @click="batchGotoFundPage">批量前往购买</el-button>
            </div>
        </div>
        <el-table :data="currentPageHoldData" style="width: 100%" @selection-change="handleHoldSelectionChange">
            <el-table-column type="selection" fixed width="45" />
            <el-table-column label="操作" fixed="left" width=" 100">
                <template #default="scope">
                    <el-button size="small" @click="gotoFundPage(scope.row)">
                        前往购买
                    </el-button>
                </template>
            </el-table-column>
            <el-table-column prop="fundCode" label="基金代码" width="90">
                <template #default="scope">
                    <el-tooltip class="item" effect="dark" :content=scope.row.fundName placement="top">
                        <div>{{ scope.row.fundCode }}</div>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column prop="holdRate" label="持仓收益率" width="120" sortable>
                <template #default="scope">
                    <div class="profit-rate-wrapper">
                        <span class="amount" :class="{
                            'text-red': scope.row.holdGain > 0,
                            'text-green': scope.row.holdGain < 0
                        }">
                            {{ scope.row.holdRate + '%' }}
                        </span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="holdAmount" label="持仓金额" width="150" />
            <el-table-column prop="holdGain" label="持仓收益" width="100">
                <template #default="scope">
                    <div class="profit-rate-wrapper">
                        <span class="amount" :class="{
                            'text-red': scope.row.holdGain > 0,
                            'text-green': scope.row.holdGain < 0
                        }">{{ scope.row.holdGain }}</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="DeepSeek策略" width="150">
                <el-table-column label="是否交易" width="100" :filters="filterDeepSeekNeedOptions"
                    :filter-method="filterDeepSeekNeedTrade">
                    <template #default="scope">
                        <div> {{ scope.row.strategies['DeepSeek策略'].needTrade }} </div>
                    </template>
                </el-table-column>
                <el-table-column label="交易类型" width="100" :filters="filterDeepSeekTypeOptions"
                    :filter-method="filterDeepSeekTypeTrade">
                    <template #default="scope">
                        <div> {{ scope.row.strategies['DeepSeek策略'].tradeType }} </div>
                    </template>
                </el-table-column>
                <el-table-column label="交易金额" width="90">
                    <template #default="scope">
                        <div class="amount"> {{ scope.row.strategies['DeepSeek策略'].amount }} </div>
                    </template>
                </el-table-column>
                <el-table-column label="交易时机" width="120">
                    <template #default="scope">
                        <div> {{ scope.row.strategies['DeepSeek策略'].buyTiming }} </div>
                    </template>
                </el-table-column>
            </el-table-column>
            <el-table-column label="低吸买入计算策略（参考）" width="200">
                <el-table-column label="是否交易" width="100" :filters="filterEvaluateNeedOptions"
                    :filter-method="filterEvaluateNeedTrade">
                    <template #default="scope">
                        <div> {{ scope.row.strategies['低吸买入计算策略（参考）'].needTrade }} </div>
                    </template>
                </el-table-column>
                <el-table-column label="交易类型" width="100" :filters="filterEvaluateTypeOptions"
                    :filter-method="filterEvaluateTypeTrade">
                    <template #default="scope">
                        <div> {{ scope.row.strategies['低吸买入计算策略（参考）'].tradeType }} </div>
                    </template>
                </el-table-column>
                <el-table-column label="交易金额" width="90">
                    <template #default="scope">
                        <div class="amount"> {{ scope.row.strategies['低吸买入计算策略（参考）'].amount }} </div>
                    </template>
                </el-table-column>
                <el-table-column label="交易时机" width="120">
                    <template #default="scope">
                        <div> {{ scope.row.strategies['低吸买入计算策略（参考）'].buyTiming }} </div>
                    </template>
                </el-table-column>
            </el-table-column>
            <el-table-column prop="fundName" label="基金名称" width="350" />
        </el-table>
        <!-- 分页控件 -->
        <el-pagination background layout="total, prev, pager, next, sizes, jumper" :total="tableData.holdInfo.length"
            :page-size="pageHoldSize" :current-page="currentHoldPage" @size-change="handleHoldSizeChange"
            @current-change="handleHoldPageChange" style="float: right; margin-top: 16px;" />
    </div>

</template>

<script lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElTable, ElTableColumn, ElPagination, ElButton, ElTooltip } from 'element-plus'
import { gotoOutPage } from "./../../utils/utils"
export default {
    components: {
        ElTable,
        ElTableColumn,
        ElPagination,
        ElButton,
        ElTooltip,
    },
    setup() {
        document.title = "【基金分析 - tangfufa】";
        const generatedAt = ref("");
        const tableData = ref<{
            holdInfo: any[]
            recommendInfo: any[]
        }>({
            holdInfo: [],
            recommendInfo: [],
        })
        const currentHoldPage = ref(1)
        const pageHoldSize = ref(10)
        // 当前页显示的数据
        const currentPageHoldData = computed(() => {
            const start = (currentHoldPage.value - 1) * pageHoldSize.value
            const end = start + pageHoldSize.value
            return tableData.value.holdInfo.slice(start, end)
        })
        const selectedHoldRows = ref<any[]>([])
        const selectedHoldAmount = ref(0)
        const selectedHoldGain = ref(0)
        const handleHoldSelectionChange = (rows: any[]) => {
            selectedHoldRows.value = rows
            let totalHoldAmount = 0
            let totalHoldGain = 0
            rows.forEach((item) => {
                const matchHoldAmount = item?.holdAmount?.match(/\d+(\.\d+)?/)
                const amount = matchHoldAmount ? parseFloat(matchHoldAmount[0]) : 0
                console.log('✅ finalHoldAmount', amount)
                totalHoldAmount += amount
                totalHoldGain += item?.holdGain
            })
            // 控制精度，保留两位小数并转回 number
            selectedHoldAmount.value = parseFloat(totalHoldAmount.toFixed(2))
            selectedHoldGain.value = parseFloat(totalHoldGain.toFixed(2))
        }
        const handleHoldPageChange = (newPage: number) => {
            currentHoldPage.value = newPage
        }
        const handleHoldSizeChange = (newSize: number) => {
            pageHoldSize.value = newSize
            currentHoldPage.value = 1 // 改变每页数量后重置页码
        }
        const fetchData = async () => {
            try {
                const res = await fetch(`/data/fundPilotData.json?t=${Date.now()}`)
                const data = await res.json()
                console.info('✅ Loaded data:', data)
                const firstGenerated = data?.recommendInfo?.[0]?.generatedAt;
                if (firstGenerated) {
                    generatedAt.value = new Date(firstGenerated).toLocaleString();
                }
                // 假设 JSON 数据格式为数组（请根据实际字段调整）
                tableData.value = data
            } catch (err) {
                console.error('❌ 数据加载失败:', err)
            }
        }
        const filterDeepSeekNeedOptions = computed((): { text: string; value: string }[] => {
            const set = new Set<string>()
            tableData.value.holdInfo.forEach((item: any) => {
                const val = item?.strategies?.['DeepSeek策略']?.needTrade
                if (val !== undefined && val !== null) {
                    set.add(String(val))  // 强制转换为 string，确保类型一致
                }
            })
            return Array.from(set).map(value => ({
                text: value,
                value: value
            }))
        })
        const filterDeepSeekTypeOptions = computed((): { text: string; value: string }[] => {
            const set = new Set<string>()
            tableData.value.holdInfo.forEach((item: any) => {
                const val = item?.strategies?.['DeepSeek策略']?.tradeType
                if (val !== undefined && val !== null) {
                    set.add(String(val))  // 强制转换为 string，确保类型一致
                }
            })
            return Array.from(set).map(value => ({
                text: value,
                value: value
            }))
        })
        const filterEvaluateNeedOptions = computed((): { text: string; value: string }[] => {
            const set = new Set<string>()
            tableData.value.holdInfo.forEach((item: any) => {
                const val = item?.strategies?.['低吸买入计算策略（参考）']?.needTrade
                if (val !== undefined && val !== null) {
                    set.add(String(val))  // 强制转换为 string，确保类型一致
                }
            })
            return Array.from(set).map(value => ({
                text: value,
                value: value
            }))
        })
        const filterEvaluateTypeOptions = computed((): { text: string; value: string }[] => {
            const set = new Set<string>()
            tableData.value.holdInfo.forEach((item: any) => {
                const val = item?.strategies?.['低吸买入计算策略（参考）']?.tradeType
                if (val !== undefined && val !== null) {
                    set.add(String(val))  // 强制转换为 string，确保类型一致
                }
            })
            return Array.from(set).map(value => ({
                text: value,
                value: value
            }))
        })
        const filterDeepSeekNeedTrade = (value: any, row: any) => {
            return row.strategies?.['DeepSeek策略']?.needTrade === value
        }
        const filterDeepSeekTypeTrade = (value: any, row: any) => {
            return row.strategies?.['DeepSeek策略']?.tradeType === value
        }
        const filterEvaluateNeedTrade = (value: any, row: any) => {
            return row.strategies?.['低吸买入计算策略（参考）']?.needTrade === value
        }
        const filterEvaluateTypeTrade = (value: any, row: any) => {
            return row.strategies?.['低吸买入计算策略（参考）']?.tradeType === value
        }
        const gotoFundPage = (row: any) => {
            if (row.fundUrl) {
                gotoOutPage(row.fundUrl);
            }
        }
        const batchGotoFundPage = () => {
            selectedHoldRows.value?.map((item) => {
                gotoFundPage(item)
            })
        }
        onMounted(() => {
            fetchData()
        })
        return {
            tableData,
            currentHoldPage,
            pageHoldSize,
            currentPageHoldData,
            handleHoldPageChange,
            handleHoldSizeChange,
            filterDeepSeekNeedOptions,
            filterDeepSeekNeedTrade,
            filterDeepSeekTypeOptions,
            filterDeepSeekTypeTrade,
            filterEvaluateNeedOptions,
            filterEvaluateTypeOptions,
            filterEvaluateNeedTrade,
            filterEvaluateTypeTrade,
            handleHoldSelectionChange,
            selectedHoldRows,
            selectedHoldAmount,
            selectedHoldGain,
            gotoFundPage,
            batchGotoFundPage,
            generatedAt,
        }
    }
}
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
