<template>
    <div>
        <h2 style="text-align:center; margin-bottom: 24px;">【资讯文章】</h2>
        <p v-if="generatedAt" style="text-align:center; color: #888; margin-bottom: 24px;">
            数据更新于：{{ generatedAt }}
        </p>
        <el-row>
            <el-col :span="24" :md="24" :lg="24" v-for="(item, sonIndex) in recommendArticleData" :key="sonIndex">
                <el-card shadow="hover" class="welfare-card">
                    <div class="welfare-date">
                        <div class="day-week-welfare">
                            <div class="welfare-month" :style="`color:${handleYearColor(item)}`">
                                <div class="welfare-icon-hour">
                                    <el-icon :size="15">
                                        <Calendar />
                                    </el-icon>
                                </div>
                                {{ handleMonth(item) }}
                            </div>
                            <div class="welfare-day" :style="`color:${handleYearColor(item)}`">
                                {{ handleDay(item) }}
                            </div>
                        </div>
                        <div>
                            <el-divider direction="vertical" color="#cccccc" class="el-welfare-divider" />
                        </div>
                        <div class="welfare-hour">
                            <div class="welfare-icon-hour">
                                <el-icon :size="16">
                                    <Timer />
                                </el-icon>
                            </div>
                            <div>{{ handleHour(item) }}</div>
                        </div>
                        <div>
                            <a class="welfare-link-title" :href="handleLinkUrl(item)"
                                @click.prevent="gotoWelfareWebsite(item)">
                                {{ item.title }}
                            </a>
                            <div class="welfare-div-link">
                                <div v-if="item.website == 'weibo'" class="weibo-img-link"
                                    :style="`background:${item.image.small_icon_desc_color}`">
                                    {{ item.image.small_icon_desc }}
                                </div>
                                <img :src="handleAuthorImg(item)" alt="作者" class="welfare-img-link"
                                    @error="handleImageError" referrerPolicy="no-referrer" v-else />
                            </div>
                        </div>
                    </div>
                    <div class="welfare-div-website">
                        <img :src="handleWebsiteImg(item)" alt="网站" class="welfare-img-link" />
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
                            </div>
                            <div v-if="item.website == 'weibo'" class="weibo-img-link mobile-weibo-img"
                                :style="`background:${item.image.small_icon_desc_color}`">
                                {{ item.image.small_icon_desc }}
                            </div>
                            <img :src="handleAuthorImg(item)" alt="作者" class="welfare-img-link mobile-img-link"
                                @error="handleImageError" referrerPolicy="no-referrer" v-else />
                        </div>
                        <div class="mobile-click-show">
                            <div>
                                <div class="welfare-day" :style="`color:${handleYearColor(item)}`">
                                    {{ handleDay(item) }}
                                </div>
                                <div class="welfare-month">
                                    <div class="welfare-icon-hour">
                                        <el-icon :size="15">
                                            <Calendar />
                                        </el-icon>
                                    </div>
                                    {{ handleMonth(item) }}
                                </div>
                            </div>

                            <div class="welfare-hour welfare-mobile-hour">
                                <div class="welfare-icon-hour">
                                    <el-icon :size="16">
                                        <Timer />
                                    </el-icon>
                                </div>
                                <div>{{ handleHour(item) }}</div>
                            </div>
                            <div class="mobile-bt-detail">
                                <img :src="handleWebsiteImg(item)" alt="网站"
                                    class="welfare-img-link mobile-welfare-img" />
                                <div>{{ handleWebsiteName(item) }}</div>
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script lang="ts">
import { ref, nextTick, watch, computed, onMounted } from "vue";
import { gotoOutPage, isPC } from "./../../utils/utils"
import githubNews from "./../../public/data/githubTrending.json";
import logoImageUrl from "./../../public/img/logo.jpg";
import {
    ElCol,
    ElRow,
    ElDialog,
    ElCard,
    ElButton,
    ElIcon,
    ElDivider,
} from "element-plus";
export default {
    props: {
        githubTrendingLocation: [String, Number],
    },
    components: {
        ElCol,
        ElRow,
        ElDialog,
        ElCard,
        ElButton,
        ElIcon,
        ElDivider,
    },
    setup(props: any) {
        document.title = '资讯文章'
        const generatedAt = ref("");
        const logoUrl = ref(logoImageUrl);
        const recommendArticleData = ref<any[]>([]);
        const getRecommendArticleData = async () => {
            const res = await fetch("/data/recommendArticleData.json?t=" + Date.now());
            if (!res.ok) throw new Error("加载失败");
            const data = await res.json();
            return data
        }

        let githubList = ref(githubNews);
        onMounted(async () => {
            try {
                const data = await getRecommendArticleData();
                recommendArticleData.value = data;
                console.log('recommendArticleData.value', recommendArticleData.value);
                if (data.length > 0 && data[0].created_at) {
                    generatedAt.value = new Date(data[0].created_at).toLocaleString();
                }
            } catch (error) {
                console.error('获取推荐文章失败:', error);
            }
        });
        let newsGuide: any[] = [];
        newsGuide = githubList.value;
        newsGuide.sort((a, b) => b.timestamp - a.timestamp); //按时间最新的靠前排序
        const handleDay = (item: any) => {
            const timestamp = new Date(item.created_at).getTime();
            const date = new Date(timestamp);
            const day = date.getDate();
            const formattedDay = day < 10 ? "0" + day : day.toString();
            return formattedDay;
        };
        const handleHour = (item: any) => {
            const timestamp = new Date(item.created_at).getTime();
            const date = new Date(timestamp);
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const formattedHours = hours < 10 ? "0" + hours : hours.toString();
            const formattedMinutes = minutes < 10 ? "0" + minutes : minutes.toString();
            const timeString = `${formattedHours}:${formattedMinutes}`;
            return timeString;
        };
        const handleAuthorImg = (item: any) => {
            return item.image_url || logoUrl.value;
        };
        const handleLinkUrl = (item: any) => {
            return item.url;
        };
        const gotoWelfareWebsite = (item: any) => {
            let websiteUrl = handleLinkUrl(item);
            console.log(websiteUrl);
            if (websiteUrl) {
                gotoOutPage(websiteUrl);
            }
        };
        const handleWebsiteName = (item: any) => {
            return item.site_name || '随风而逝';
        };
        const handleWebsiteImg = (item: any) => {
            return logoUrl.value;
        };
        const handleMonth = (item: any) => {
            const timestamp = new Date(item.created_at).getTime();
            const date = new Date(timestamp);
            const month = date.getMonth() + 1;
            return month + "月";
        };
        const handleImageError = (event: any) => {
            event.target.src = logoUrl.value;
        };
        const handleYearColor = (item: any) => {
            const timestamp = new Date(item.created_at).getTime();
            const date = new Date(timestamp);
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
            let websiteUrl = handleLinkUrl(item);
            if (websiteUrl) {
                gotoOutPage(websiteUrl);
            }
        };
        return {
            logoUrl,
            handleDay,
            handleHour,
            gotoWelfareWebsite,
            handleWebsiteName,
            handleWebsiteImg,
            newsGuide,
            handleAuthorImg,
            handleLinkUrl,
            handleMonth,
            handleYearColor,
            handleImageError,
            handleMobileTitle,
            gotoMobileWebsite,
            recommendArticleData,
            generatedAt
        };
    },
};
</script>

<style scoped>
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
    border-bottom-left-radius: 50%;
    border-bottom-right-radius: 50%;
    border-top-left-radius: 50%;
    border-top-right-radius: 50%;
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
    height: 50px;
    font-size: 18px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    /* 防止内容换行 */
    overflow: hidden;
    /* 隐藏超出容器宽度的内容 */
    text-overflow: ellipsis;
    /* 使用省略号表示被截断的文本 */
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
        height: 80px;
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
