<template>
    <div>
        <el-table :data="currentPageData" style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column label="操作" width="100">
                <template #default>
                    <el-button size="small">
                        查看详情
                    </el-button>
                </template>
            </el-table-column>
            <el-table-column prop="fundCode" label="基金代码" width="100" />
            <el-table-column prop="holdRate" label="持仓收益率" width="120" sortable>
                <template #default="scope">
                    <div class="profit-rate-wrapper">
                        <span class="amount" :class="{
                            'text-red': scope.row.holdGain > 0,
                            'text-green': scope.row.holdGain < 0
                        }">
                            {{ scope.row.holdRate + '%' }}
                        </span>
                        <span v-if="Number(scope.row.holdRate) >= 5" class="rate-tip">
                            🎯 高估值浮盈，建议关注
                        </span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="holdAmount" label="持仓金额" width="150" />
            <el-table-column prop="holdGain" label="持仓收益" width="100" />
            <el-table-column label="DeepSeek策略" width="150">
                <el-table-column label="是否交易" width="100" :filters="filterNeedOptions" :filter-method="filterNeedTrade">
                    <template #default="scope">
                        <div> {{ scope.row.strategies['DeepSeek策略'].needTrade }} </div>
                    </template>
                </el-table-column>
                <el-table-column label="交易类型" width="100" :filters="filterTypeOptions" :filter-method="filterTypeTrade">
                    <template #default="scope">
                        <div> {{ scope.row.strategies['DeepSeek策略'].tradeType }} </div>
                    </template>
                </el-table-column>
                <el-table-column label="交易金额" width="90">
                    <template #default="scope">
                        <div> {{ scope.row.strategies['DeepSeek策略'].amount }} </div>
                    </template>
                </el-table-column>

                <el-table-column label="交易时机" width="120">
                    <template #default="scope">
                        <div> {{ scope.row.strategies['DeepSeek策略'].buyTiming }} </div>
                    </template>
                </el-table-column>

            </el-table-column>
            <el-table-column label="低吸买入计算策略（参考）" width="200" />
            <el-table-column prop="fundName" label="基金名称" width="350" />

        </el-table>
        <!-- 分页控件 -->
        <el-pagination background layout="total, prev, pager, next, sizes, jumper" :total="tableData.holdInfo.length"
            :page-size="pageSize" :current-page="currentPage" @size-change="handleSizeChange"
            @current-change="handlePageChange" style="float: right; margin-top: 16px;" />
    </div>

</template>

<script lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElTable, ElTableColumn, ElPagination, ElButton } from 'element-plus'
export default {
    components: {
        ElTable,
        ElTableColumn,
        ElPagination,
        ElButton
    },
    setup() {
        const tableData = ref<{
            holdInfo: any[]
            recommendInfo: any[]
        }>({
            holdInfo: [],
            recommendInfo: [],
        })
        const currentPage = ref(1)
        const pageSize = ref(10)
        // 当前页显示的数据
        const currentPageData = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value
            const end = start + pageSize.value
            return tableData.value.holdInfo.slice(start, end)
        })
        const selectedRows = ref<any[]>([])

        const handleSelectionChange = (rows: any[]) => {
            selectedRows.value = rows
            console.log('✅ 当前选中行：', rows)
        }

        const handlePageChange = (newPage: number) => {
            currentPage.value = newPage
        }
        const handleSizeChange = (newSize: number) => {
            pageSize.value = newSize
            currentPage.value = 1 // 改变每页数量后重置页码
        }
        const fetchData = async () => {
            try {
                const res = await fetch(`/data/fundPilotData.json?t=${Date.now()}`)
                const data = await res.json()
                console.info('✅ Loaded data:', data)
                // 假设 JSON 数据格式为数组（请根据实际字段调整）
                tableData.value = data
            } catch (err) {
                console.error('❌ 数据加载失败:', err)
            }
        }
        const filterNeedOptions = computed((): { text: string; value: string }[] => {
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

        const filterTypeOptions = computed((): { text: string; value: string }[] => {
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

        const filterNeedTrade = (value: any, row: any) => {
            return row.strategies?.['DeepSeek策略']?.needTrade === value
        }
        const filterTypeTrade = (value: any, row: any) => {
            return row.strategies?.['DeepSeek策略']?.tradeType === value
        }
        onMounted(() => {
            fetchData()
        })
        return {
            tableData,
            currentPage,
            pageSize,
            currentPageData,
            handlePageChange,
            handleSizeChange,
            filterNeedOptions,
            filterNeedTrade,
            filterTypeOptions,
            filterTypeTrade,
            handleSelectionChange,
            selectedRows,

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
