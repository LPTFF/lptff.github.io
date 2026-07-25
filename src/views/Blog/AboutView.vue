<template>
    <section class="about">
        <div class="profile"><img :src="logoUrl" alt="tangff" />
            <div>
                <p class="eyebrow">ABOUT</p>
                <h1>关于这个博客</h1>
                <p>大家好，我是 tangff。这里记录人工智能、自动驾驶、水下机器人以及日常学习中的思考。</p><a href="https://github.com/lptff" target="_blank"
                    rel="noopener noreferrer">GitHub ↗</a>
            </div>
        </div><el-divider />
        <h2>为什么写下来？</h2>
        <p>写作是整理知识的过程，也是一种与未来的自己交流的方式。希望这些并不完美的笔记，能给正在学习的你带来一点帮助。</p>
    </section>
</template>
<script setup lang="ts">import logoUrl from "../../public/img/logo.jpg";</script>
<style scoped>
.about {
    /* max-width: 800px; */
    margin: 30px auto;
    padding: clamp(24px, 6vw, 60px);
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 14px;
    line-height: 1.9
}

.profile {
    display: flex;
    gap: 28px;
    align-items: center
}

.profile img {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover
}

.eyebrow {
    color: #67c23a;
    letter-spacing: .1em;
    font-size: 12px
}

.about h1 {
    margin: 5px 0;
    font-size: 34px
}

.about h2 {
    font-size: 21px
}

.about p {
    color: #606266
}

.about a {
    color: #67c23a;
    text-decoration: none
}

@media(max-width:520px) {
    .profile {
        display: block
    }

    .profile img {
        margin-bottom: 15px
    }
}
</style>
