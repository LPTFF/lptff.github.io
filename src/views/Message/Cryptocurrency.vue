<template>
    <div style="width: 100%">
        <div style="position: sticky; top: 0; background-color: white; z-index: 1000; padding: 10px 0;">
            <div>
                <h2 style="margin: 0 0 10px 0; text-align: center;">【加密货币分析 - tangfufa】</h2>
                <p v-if="generatedAt" style="text-align: center; margin: 0;">
                    数据更新于：{{ generatedAt }}
                </p>
                <div style="margin-bottom: 16px; font-weight: bold;">
                    下一次自动刷新: {{ countdown }} 秒
                    <el-button size="small" type="primary" @click="manualRefresh" style="margin-left: 16px;">
                        手动刷新
                    </el-button>
                </div>
            </div>
            <div v-if="usdtHolding">当前的资金持仓数量：{{
                usdtHolding?.free }}{{ usdtHolding?.asset }}</div>
            <div v-if="selectedHoldRows.length > 0">当前选中的持仓基金数量：{{
                selectedHoldRows.length }}，当前选中的持仓基金总金额：{{
                    selectedHoldAmount }} USDT，当前选中的持仓基金总收益：{{
                    selectedHoldGain }} USDT</div>
            <div style="display: flex;">
                <div class="amount text-green">
                    亏损数量: {{ currentPageConservativeData?.countLossHoldFundNum }}
                </div>
                <div class="amount text-red" style="margin-left: 20px;">
                    盈利数量: {{ currentPageConservativeData?.countProfitHoldFundNum }}
                </div>
            </div>
            <div v-if="selectedHoldRows.length > 0">
                <el-button type="primary" @click="batchGotoHoldFundPage">批量前往购买持仓货币</el-button>
                <el-button type="primary" @click="batchExportHoldFund">批量导出持仓货币</el-button>
            </div>
            <div v-if="selectedRecommendRows.length > 0">当前选中的推荐基金数量：{{
                selectedRecommendRows.length }}</div>
            <div v-if="selectedRecommendRows.length > 0">
                <el-button type="primary" @click="batchGotoRecommendFundPage">批量前往购买推荐货币</el-button>
            </div>
            <div v-if="selectedCandidatesRows.length > 0">当前选中的合约基金数量：{{
                selectedCandidatesRows.length }}</div>
            <div v-if="selectedCandidatesRows.length > 0">
                <el-button type="primary" @click="batchGotoCandidatesPage">批量前往购买合约货币</el-button>
            </div>
        </div>
        <p style="margin: 0 0 10px 0;"><strong>▶ 持仓情况：</strong></p>
        <el-table :data="currentPageHoldData" style="width: 100%" @selection-change="handleHoldSelectionChange">
            <el-table-column type="selection" fixed width="45" />
            <el-table-column label="操作" fixed="left" width=" 100">
                <template #default="scope">
                    <el-button size="small" @click="gotoFundPage(scope.row)">
                        前往购买
                    </el-button>
                </template>
            </el-table-column>
            <el-table-column prop="holdGain" label="持仓收益率" width="200" sortable>
                <template #default="scope">
                    <el-tooltip class="item" effect="dark"
                        :content="`持仓数量：${scope.row.marketValue} ${scope.row.marketValueAsset}`" placement="top">
                        <div class="amount" :class="{
                            'text-red': scope.row.profit > 0,
                            'text-green': scope.row.profit < 0
                        }">
                            {{ scope.row.profitRate + '%' }}
                        </div>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column prop="asset" label="货币类型" width="80">
            </el-table-column>
            <el-table-column prop="isTrade" label="是否交易" width="100" :filters="filterDeepSeekNeedOptions"
                :filter-method="filterDeepSeekNeedTrade">
                <template #default="scope">
                    <div>
                        {{ scope.row.isTrade ? '是' : '否' }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="交易类型" width="100" :filters="filterDeepSeekTypeOptions"
                :filter-method="filterDeepSeekTypeTrade">
                <template #default="scope">
                    <template v-if="scope.row.tradeType?.includes('减仓')">
                        <el-tooltip class="item" effect="dark" content="⚠️当前为减仓操作，请注意控制风险" placement="top">
                            <div>
                                {{ scope.row.tradeType }}
                            </div>
                        </el-tooltip>
                    </template>
                    <template v-else>
                        <div>
                            {{ scope.row.tradeType }}
                        </div>
                    </template>
                </template>
            </el-table-column>
            <el-table-column prop="signalUp" label="交易金额" width="80">
                <template #default="scope">
                    <div>
                        {{ scope.row?.tradeAmount + 'USDT' }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="reason" label="交易理由" width="300">
                <template #default="scope">
                    <div>
                        {{ scope.row?.reason }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="cost" label="成本价" width="200" sortable>
                <template #default="scope">
                    <div>
                        {{ scope.row.cost + ' ' + scope.row.costAsset }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="cost" label="市场价" width="200" sortable>
                <template #default="scope">
                    <div>
                        {{ scope.row.marketValue + ' ' + scope.row.marketValueAsset }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="holdGain" label="持仓收益" width="240" sortable>
                <template #default="scope">
                    <div class="amount" :class="{
                        'text-red': scope.row.profit > 0,
                        'text-green': scope.row.profit < 0
                    }">
                        {{ scope.row.profit + scope.row.profitAsset }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="btcValuation" label="数量" width="240" sortable>
                <template #default="scope">
                    <div>
                        {{ scope.row.amount + ' ' + scope.row.asset }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="其他" width="120">
                <template #default="scope">
                    <el-button @click="handleMoreInfo(scope.row, '1')">更多信息</el-button>
                </template>
            </el-table-column>
        </el-table>
        <!-- 分页控件 -->
        <el-pagination background layout="total, prev, pager, next, sizes" :total="tableData.enrichedHoldings.length"
            :page-size="pageHoldSize" :page-sizes="[tableData.enrichedHoldings.length, 10, 20, 50, 100]"
            :current-page="currentHoldPage" @size-change="handleHoldSizeChange" @current-change="handleHoldPageChange"
            style="float: right; margin-top: 16px;" />
        <p style="margin: 40px 0 10px 0;"><strong>▶ 推荐情况：</strong></p>
        <el-table :data="currentPageRecommendData" style="width: 100%"
            @selection-change="handleRecommendSelectionChange">
            <el-table-column type="selection" fixed width="45" />
            <el-table-column label="操作" fixed="left" width=" 100">
                <template #default="scope">
                    <el-button size="small" @click="gotoFundPage(scope.row)">
                        前往购买
                    </el-button>
                </template>
            </el-table-column>
            <el-table-column prop="asset" label="货币类型" fixed="left" width="120">
            </el-table-column>
            <el-table-column prop="signalUp" label="是否交易" fixed="left" width="100"
                :filters="filterDeepSeekRecommendOptions" :filter-method="filterDeepSeekRecommendTrade">
                <template #default="scope">
                    <div>
                        {{ scope.row.isTrade ? '是' : '否' }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="signalUp" label="交易理由" fixed="left" width="300">
                <template #default="scope">
                    <div>
                        {{ scope.row?.decision?.reason }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="signalUp" label="交易金额" fixed="left" width="90">
                <template #default="scope">
                    <div>
                        {{ scope.row?.tradeAmount + 'USDT' }}
                    </div>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination background layout="total, prev, pager, next, sizes" :total="tableData.recommendInfo.length"
            :page-size="pageRecommendSize" :page-sizes="[tableData.recommendInfo.length, 10, 20, 50, 100]"
            :current-page="currentRecommendPage" @size-change="handleRecommendSizeChange"
            @current-change="handleRecommendPageChange" style="float: right; margin-top: 16px;" />
        <p style="margin: 40px 0 10px 0;"><strong>▶ 合约情况：</strong></p>
        <div v-if="tableCandidatesData?.btcTrend">
            【BTC信号情况】trend4h：{{
                tableCandidatesData?.btcTrend?.trend4h }}，trend1h：{{
                tableCandidatesData?.btcTrend?.trend1h }}，trend15m：{{ tableCandidatesData?.btcTrend?.trend15m
            }}，bbConfirmLong：{{
                tableCandidatesData?.btcTrend?.bbConfirmLong }}，
            bbConfirmShort：{{ tableCandidatesData?.btcTrend?.
                bbConfirmShort }}</div>
        <el-table :data="currentPageCandidatesData" style="width: 100%"
            @selection-change="handleCandidatesSelectionChange">
            <el-table-column type="selection" fixed width="45" />
            <el-table-column label="操作" fixed="left" width=" 100">
                <template #default="scope">
                    <el-button size="small" @click="gotoFundPage(scope.row)">
                        前往购买
                    </el-button>
                </template>
            </el-table-column>
            <el-table-column prop="asset" label="货币类型" fixed="left" width="120">
            </el-table-column>
            <el-table-column prop="candidatesType" label="合约类型" fixed="left" width="120">
            </el-table-column>
            <el-table-column prop="bbConfirm" label="布林带指标" fixed="left" width="180">
                <template #default="scope">
                    <div>
                        做空: {{ scope.row?.decision?.bbConfirmShort }}，做多:{{ scope.row?.decision?.bbConfirmLong }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="signalUp" label="交易理由" fixed="left" width="200">
                <template #default="scope">
                    <div>
                        {{ scope.row?.decision?.reason }}
                    </div>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination background layout="total, prev, pager, next, sizes"
            :total="tableCandidatesData?.candidatesInfo?.length" :page-size="pageCandidatesSize"
            :page-sizes="[tableCandidatesData?.candidatesInfo?.length, 10, 20, 50, 100]"
            :current-page="currentCandidatesPage" @size-change="handleCandidatesSizeChange"
            @current-change="handleCandidatesPageChange" style="float: right; margin-top: 16px;" />
    </div>
    <el-dialog v-model="dialogVisible" :title=dialogRow?.title width="50%" :before-close="handleDialogClose">
        <p v-if="dialogRow?.type == '1'">
            提示词：<span class="prompt-text">
                {{ dialogRow.prompt }}
            </span>
            <span>
                <el-icon @click="copyPrompt(dialogRow)" style="height: 16px;width: 16px">
                    <CopyDocument style="height: 16px;width: 16px;" />
                </el-icon>
            </span>

        </p>
        <p v-if="dialogRow?.type == '3'">
            提示词：<span class="prompt-text">
                {{ dialogRow.prompt }}
            </span>
            <span>
                <el-icon @click="copyPrompt(dialogRow)" style="height: 16px;width: 16px">
                    <CopyDocument style="height: 16px;width: 16px;" />
                </el-icon>
            </span>
        </p>
        <template #footer>
            <el-button @click="dialogVisible = false">关闭</el-button>
        </template>
    </el-dialog>
</template>

<script lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElTable, ElTableColumn, ElPagination, ElButton, ElTooltip, ElDialog, ElMessage, ElIcon, ElLoading } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { gotoOutPage } from "../../utils/utils"
export default {
    components: {
        ElTable,
        ElTableColumn,
        ElPagination,
        ElButton,
        ElTooltip,
        ElDialog,
        CopyDocument,
        ElIcon
    },
    setup() {
        document.title = "【加密货币分析 - tangfufa】";
        const dialogVisible = ref(false)
        const isExpanded = ref(false)
        const copyPrompt = (dialogRow: any) => {
            if (!dialogRow.prompt) return
            try {
                // 创建一个隐藏 textarea
                const textarea = document.createElement('textarea');
                textarea.value = dialogRow.prompt;

                // 设置不可见并添加到页面中
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'absolute';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);

                // 选中文本并复制
                textarea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);

                if (success) {
                    ElMessage.success('提示词已复制');
                } else {
                    ElMessage.warning('复制失败，请手动复制');
                }
            } catch (err) {
                ElMessage.error('复制异常，请手动复制');
            }
        }
        const dialogRow = ref<any>({})
        const generatedAt = ref("");
        const usdtHolding = ref<any>({})
        const tableData = ref<{
            enrichedHoldings: any[]
            recommendInfo: any[]
            conservativeInfo: any[]
        }>({
            enrichedHoldings: [],
            recommendInfo: [],
            conservativeInfo: [],
        })
        const tableCandidatesData = ref<any>({})
        const currentHoldPage = ref(1)
        const pageHoldSize = ref(10)
        const currentRecommendPage = ref(1)
        const pageRecommendSize = ref(10)
        const currentCandidatesPage = ref(1)
        const pageCandidatesSize = ref(10)
        const currentConservativePage = ref(1)
        const pageConservativeSize = ref(10)
        // 当前页显示的数据
        const currentPageHoldData = computed(() => {
            const start = (currentHoldPage.value - 1) * pageHoldSize.value
            const end = start + pageHoldSize.value
            return tableData.value.enrichedHoldings.slice(start, end)
        })
        const currentPageRecommendData = computed(() => {
            const start = (currentRecommendPage.value - 1) * pageRecommendSize.value
            const end = start + pageRecommendSize.value
            return tableData.value.recommendInfo.slice(start, end)
        })
        const currentPageCandidatesData = computed(() => {
            const start = (currentCandidatesPage.value - 1) * pageCandidatesSize.value
            const end = start + pageCandidatesSize.value
            return tableCandidatesData.value.candidatesInfo?.slice(start, end)
        })
        const currentPageConservativeData = computed(() => {
            const start = (currentConservativePage.value - 1) * pageConservativeSize.value
            const end = start + pageConservativeSize.value
            let countLossHoldFundNum = 0;
            let countProfitHoldFundNum = 0;
            tableData.value.enrichedHoldings?.map((item) => {
                if (item.profit > 0) {
                    countProfitHoldFundNum++
                } else if (item.profit < 0) {
                    countLossHoldFundNum++
                }
            })
            return {
                countLossHoldFundNum,
                countProfitHoldFundNum
            }
        })
        const selectedHoldRows = ref<any[]>([])
        const selectedConservativeRows = ref<any[]>([])
        const selectedRecommendRows = ref<any[]>([])
        const selectedCandidatesRows = ref<any[]>([])
        const selectedHoldAmount = ref(0)
        const selectedConservativeAmount = ref(0)
        const selectedHoldGain = ref(0)
        const selectedConservativeGain = ref(0)
        const handleHoldSelectionChange = (rows: any[]) => {
            selectedHoldRows.value = rows
            let totalHoldAmount = 0
            let totalHoldGain = 0
            rows.forEach((item) => {
                const amount = item?.marketValue;
                totalHoldAmount += amount
                totalHoldGain += item?.profit
            })
            // 控制精度，保留两位小数并转回 number
            selectedHoldAmount.value = parseFloat(totalHoldAmount.toFixed(2))
            selectedHoldGain.value = parseFloat(totalHoldGain.toFixed(2))
        }
        const handleConservativeSelectionChange = (rows: any[]) => {
            selectedConservativeRows.value = rows
            let totalConservativeAmount = 0
            let totalConservativeGain = 0
            rows.forEach((item) => {
                const matchHoldAmount = item?.holdAmount?.match(/[\d,]+(\.\d+)?/);
                const amount = matchHoldAmount ? parseFloat(matchHoldAmount[0].replace(/,/g, '')) : 0;
                totalConservativeAmount += amount
                totalConservativeGain += item?.holdGain
            })
            // 控制精度，保留两位小数并转回 number
            selectedConservativeAmount.value = parseFloat(totalConservativeAmount.toFixed(2))
            selectedConservativeGain.value = parseFloat(totalConservativeGain.toFixed(2))
        }
        const handleRecommendSelectionChange = (rows: any[]) => {
            selectedRecommendRows.value = rows
        }
        const handleCandidatesSelectionChange = (rows: any[]) => {
            selectedCandidatesRows.value = rows
        }
        const handleHoldPageChange = (newPage: number) => {
            currentHoldPage.value = newPage
        }
        const handleRecommendPageChange = (newPage: number) => {
            currentRecommendPage.value = newPage
        }
        const handleCandidatesPageChange = (newPage: number) => {
            currentCandidatesPage.value = newPage
        }
        const handleHoldSizeChange = (newSize: number) => {
            pageHoldSize.value = newSize
            currentHoldPage.value = 1 // 改变每页数量后重置页码
        }
        const handleRecommendSizeChange = (newSize: number) => {
            pageRecommendSize.value = newSize
            currentRecommendPage.value = 1 // 改变每页数量后重置页码
        }
        const handleCandidatesSizeChange = (newSize: number) => {
            pageCandidatesSize.value = newSize
            currentCandidatesPage.value = 1 // 改变每页数量后重置页码
        }
        const fetchData = async () => {
            let loadingInstance: any = null
            try {
                // 创建全局 loading
                loadingInstance = ElLoading.service({
                    lock: true,               // 禁止操作页面
                    text: '数据加载中...',      // 显示文字
                    background: 'rgba(0, 0, 0, 0.3)', // 遮罩层
                })

                const res = await fetch(`/data/Cryptocurrency.json?t=${Date.now()}`)
                const data = await res.json()
                const resCandidates = await fetch(`/data/CryptocurrencyForCandidates.json?t=${Date.now()}`)
                const dataCandidates = await resCandidates.json()
                console.info('✅ Loaded dataCandidates:', dataCandidates)
                console.info('✅ Loaded data:', data)
                const firstGenerated = Math.max(
                    new Date(dataCandidates?.generatedAt || 0).getTime(),
                    new Date(data?.generatedAt || 0).getTime()
                );
                console.info('✅ firstGenerated firstGenerated:', firstGenerated)
                usdtHolding.value = data?.usdtHolding;
                if (firstGenerated) {
                    generatedAt.value = new Date(firstGenerated).toLocaleString();
                }
                // 假设 JSON 数据格式为数组（请根据实际字段调整）
                tableData.value = data
                tableCandidatesData.value = dataCandidates
            } catch (err) {
                console.error('❌ 数据加载失败:', err)
            } finally {
                // 关闭全局 loading
                if (loadingInstance) loadingInstance.close();
            }
        }
        const filterDeepSeekNeedOptions = computed((): { text: string; value: string }[] => {
            const set = new Set<string>()
            tableData.value.enrichedHoldings.forEach((item: any) => {
                const val = item?.isTrade
                set.add(val)
            })
            return Array.from(set).map(value => ({
                text: value,
                value: value
            }))
        })
        const filterDeepSeekTypeOptions = computed((): { text: string; value: string }[] => {
            const set = new Set<string>()
            tableData.value.enrichedHoldings.forEach((item: any) => {
                const val = item?.tradeType
                set.add(val)
            })
            return Array.from(set).map(value => ({
                text: value,
                value: value
            }))
        })
        const filterDeepSeekRecommendOptions = computed((): { text: string; value: string }[] => {
            const set = new Set<string>()
            tableData.value.recommendInfo.forEach((item: any) => {
                const val = item?.isTrade
                set.add(val)
            })
            return Array.from(set).map(value => ({
                text: value,
                value: value
            }))
        })
        const filterDeepSeekAmountOptions = computed((): { text: string; value: string }[] => {
            const set = new Set<string>()
            tableData.value.enrichedHoldings.forEach((item: any) => {
                const val = item?.amount
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
            return row?.isTrade === value
        }
        const filterDeepSeekRecommendTrade = (value: any, row: any) => {
            return row?.isTrade === value
        }
        const filterDeepSeekTypeTrade = (value: any, row: any) => {
            return row?.tradeType === value
        }
        const filterDeepSeekAmountTrade = (value: any, row: any) => {
            return row?.amount === value
        }
        const gotoFundPage = (row: any) => {
            if (row.url) {
                gotoOutPage(row.url);
            }
        }
        const batchGotoHoldFundPage = () => {
            selectedHoldRows.value?.map((item) => {
                gotoFundPage(item)
            })
        }
        const batchExportHoldFund = () => {
            console.info('batchExportHoldFund selectedHoldRows.value', selectedHoldRows.value)
            if (!selectedHoldRows.value || selectedHoldRows.value.length === 0) {
                ElMessage.warning('请先选择要导出的加密货币')
                return
            }
            const exportData = selectedHoldRows.value.map(row => ({
                货币类型: row.asset,
                持仓金额: row.marketValue + row.marketValueAsset,
                持仓收益: row.profit + row.marketValueAsset,
                收益率: row.profitRate,
            }))
            // 2. 转换为 worksheet
            const worksheet = XLSX.utils.json_to_sheet(exportData)
            // 3. 创建 workbook
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, '加密货币明细')

            // 4. 导出为 blob 并下载
            const excelBuffer = XLSX.write(workbook, {
                bookType: 'xlsx',
                type: 'array'
            })
            const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
            saveAs(blob, `持仓加密货币导出_${new Date().toISOString().slice(0, 10)}.xlsx`)
        }
        const batchGotoConservativeFundPage = () => {
            selectedConservativeRows.value?.map((item) => {
                gotoFundPage(item)
            })
        }
        const batchExportConservativeFund = () => {
            console.info('batchExportConservativeFund selectedConservativeRows.value', selectedConservativeRows.value)
            if (!selectedConservativeRows.value || selectedConservativeRows.value.length === 0) {
                ElMessage.warning('请先选择要导出的基金')
                return
            }
            const exportData = selectedConservativeRows.value.map(row => ({
                基金名称: row.fundName,
                基金代码: row.fundCode,
                持仓金额: row.holdAmount,
                持仓收益: row.holdGain,
                收益率: row.holdRate,
            }))
            // 2. 转换为 worksheet
            const worksheet = XLSX.utils.json_to_sheet(exportData)
            // 3. 创建 workbook
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, '对冲基金明细')

            // 4. 导出为 blob 并下载
            const excelBuffer = XLSX.write(workbook, {
                bookType: 'xlsx',
                type: 'array'
            })
            const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
            saveAs(blob, `对冲基金导出_${new Date().toISOString().slice(0, 10)}.xlsx`)
        }
        const batchGotoRecommendFundPage = () => {
            selectedRecommendRows.value?.map((item) => {
                gotoFundPage(item)
            })
        }
        const batchGotoCandidatesPage = () => {
            selectedCandidatesRows.value?.map((item) => {
                gotoFundPage(item)
            })
        }
        const handleMoreInfo = (row: any, type: any) => {
            let tmpRow: any = row
            if (tmpRow) {
                tmpRow.title = '详细信息'
                tmpRow.type = type
            }
            dialogRow.value = tmpRow
            dialogVisible.value = true
        }
        const handleDialogClose = () => {
            dialogVisible.value = false
        }
        const extractNumber = (val: any) => {
            const match = String(val).match(/[\d,]+\.\d+|[\d,]+/);
            return match ? match[0] : '';
        };
        const calculateHoldingDays = (tradeListInfo: any) => {
            if (!tradeListInfo || tradeListInfo.length === 0) return '-';
            // 获取最后一个日期字符串，比如 "2025-08-05"
            const lastDateStr = tradeListInfo[tradeListInfo.length - 1].strikeStartDate;
            if (!lastDateStr) return '-';
            // 转为 Date 对象（建议转换成标准格式，兼容性好）
            const lastDate = new Date(lastDateStr);
            const now = new Date();
            // 转成时间戳 number 类型再做减法
            const diffMs = now.getTime() - lastDate.getTime();
            if (diffMs < 0) return 0;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            return diffDays;
        };
        const getHoldingDaysClass = (tradeListInfo: any) => {
            const days = calculateHoldingDays(tradeListInfo);
            if (typeof days === 'number' && days >= 90) {
                return 'amount text-red';  // 超过90天红色
            }
            return '';  // 否则黑色
        };
        const sortByHoldingDays = (a: any, b: any) => {
            let daysA = calculateHoldingDays(a.tradeListInfo);
            let daysB = calculateHoldingDays(b.tradeListInfo);

            daysA = typeof daysA === 'number' ? daysA : 0;
            daysB = typeof daysB === 'number' ? daysB : 0;

            return daysA - daysB;
        }
        // 定时器相关
        const refreshInterval = 60; // 秒
        const countdown = ref(refreshInterval); // 倒计时初始值
        let timer: any = null;

        // 请求数据函数（你已有 fetchData）
        const manualRefresh = async () => {
            await fetchData();          // 手动刷新调用已有 fetchData
            countdown.value = refreshInterval; // 重置倒计时
        }

        // 倒计时逻辑
        const startCountdown = () => {
            timer = setInterval(async () => {
                countdown.value -= 1;
                if (countdown.value <= 0) {
                    await fetchData(); // ✅ 自动刷新时异步等待完成
                    countdown.value = refreshInterval;
                }
            }, 1000);
        };
        onMounted(() => {
            fetchData()
            startCountdown();
        })
        onBeforeUnmount(() => {
            if (timer) clearInterval(timer);
        })
        return {
            tableData,
            currentHoldPage,
            pageHoldSize,
            currentPageHoldData,
            pageRecommendSize,
            pageCandidatesSize,
            currentRecommendPage,
            currentCandidatesPage,
            currentPageRecommendData,
            currentPageCandidatesData,
            currentConservativePage,
            pageConservativeSize,
            currentPageConservativeData,
            handleHoldPageChange,
            handleRecommendPageChange,
            handleCandidatesPageChange,
            handleHoldSizeChange,
            handleRecommendSizeChange,
            handleCandidatesSizeChange,
            filterDeepSeekNeedOptions,
            filterDeepSeekNeedTrade,
            filterDeepSeekRecommendOptions,
            filterDeepSeekRecommendTrade,
            filterDeepSeekTypeOptions,
            filterDeepSeekAmountOptions,
            filterDeepSeekTypeTrade,
            filterDeepSeekAmountTrade,
            handleHoldSelectionChange,
            handleRecommendSelectionChange,
            handleCandidatesSelectionChange,
            handleConservativeSelectionChange,
            selectedHoldRows,
            selectedRecommendRows,
            selectedCandidatesRows,
            selectedHoldAmount,
            selectedHoldGain,
            selectedConservativeRows,
            selectedConservativeAmount,
            selectedConservativeGain,
            gotoFundPage,
            batchGotoHoldFundPage,
            batchExportHoldFund,
            batchGotoConservativeFundPage,
            batchExportConservativeFund,
            batchGotoRecommendFundPage,
            batchGotoCandidatesPage,
            generatedAt,
            usdtHolding,
            dialogVisible,
            dialogRow,
            handleMoreInfo,
            handleDialogClose,
            isExpanded,
            copyPrompt,
            extractNumber,
            calculateHoldingDays,
            getHoldingDaysClass,
            sortByHoldingDays,
            tableCandidatesData,
            countdown,
            manualRefresh,
        }
    }
}
</script>

<style scoped>
.prompt-text {
    display: inline-block;
    white-space: pre-wrap;
    /* 支持换行符 \n */
    word-break: break-word;
    /* 支持长文本断行 */
    max-width: 100%;
}

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