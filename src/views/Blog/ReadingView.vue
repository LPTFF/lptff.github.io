<template>
    <section class="static-page">
        <p class="eyebrow">READING</p>
        <h1>读书记录</h1>
        <p class="intro">保持输入，也保持独立思考。</p><el-row :gutter="16"><el-col v-for="book in books" :key="book.title" :xs="24"
                :sm="12" :lg="8"><el-card class="book">
                    <h2>{{ book.title }}</h2><el-tag size="small" :type="book.status === '读过' ? 'success' : 'info'">{{
                        book.status }}</el-tag>
                    <p>{{ book.note }}</p><a :href="book.link" target="_blank" rel="noopener noreferrer">查看资料 ↗</a>
                </el-card></el-col></el-row>
    </section>
</template>
<script setup
    lang="ts">    const books = [{ title: "深度学习", status: "在读", note: "理解神经网络和表示学习的基础。", link: "https://book.douban.com/" }, { title: "机器学习", status: "读过", note: "从概率和模型角度重新认识机器学习。", link: "https://book.douban.com/" }, { title: "机器学习实战", status: "读过", note: "用代码验证算法与想法。", link: "https://book.douban.com/" }, { title: "计算机程序的构造和解释", status: "想读", note: "重新思考程序、抽象和计算。", link: "https://book.douban.com/" }, { title: "C和指针", status: "读过", note: "补足工程实践中的语言基础。", link: "https://book.douban.com/" }];</script>
<style scoped>
.static-page {
    max-width: 1200px;
    margin: 0 auto
}

.eyebrow {
    color: #67c23a;
    letter-spacing: .1em;
    font-size: 12px
}

.static-page h1 {
    font-size: 36px;
    margin: 6px 0
}

.intro {
    color: #909399;
    margin-bottom: 28px
}

.book {
    height: calc(100% - 16px);
    margin-bottom: 16px
}

.book h2 {
    margin: 0 0 12px;
    font-size: 19px
}

.book p {
    color: #606266;
    line-height: 1.7;
    min-height: 48px
}

.book a {
    color: #67c23a;
    text-decoration: none;
    font-size: 13px
}
</style>
