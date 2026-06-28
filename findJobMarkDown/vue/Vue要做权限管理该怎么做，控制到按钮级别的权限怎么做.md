在Vue项目中实现权限管理涉及到控制用户在不同角色下的访问权限。权限管理可以从页面级别开始，到按钮级别的细粒度权限控制。以下是一个基本的权限管理实现示例，包括页面级别和按钮级别权限控制。

**1. 页面级别权限：**

首先，你可以在路由配置中为每个页面设置不同的权限要求。这样，当用户访问特定页面时，你可以检查他们是否有足够的权限。

```javascript
// router.js
import Vue from 'vue';
import Router from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import AdminPage from '@/views/AdminPage.vue';

Vue.use(Router);

const router = new Router({
  routes: [
    { path: '/', component: HomePage, meta: { requiresAuth: true } },
    { path: '/admin', component: AdminPage, meta: { requiresAdmin: true } },
    // ...其他路由配置
  ],
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !userHasAuth()) {
    next('/login'); // 用户未登录，跳转到登录页面
  } else if (to.meta.requiresAdmin && !userIsAdmin()) {
    next('/403'); // 用户不是管理员，跳转到403页面
  } else {
    next(); // 其他情况正常访问
  }
});

export default router;
```

**2. 按钮级别权限：**

在按钮级别，你可以根据用户的角色来控制是否显示特定按钮。

```vue
<template>
  <div>
    <button v-if="userIsAdmin" @click="handleAdminAction">Admin Action</button>
    <button v-if="userIsNormalUser" @click="handleUserAction">User Action</button>
  </div>
</template>

<script>
export default {
  computed: {
    userIsAdmin() {
      // 判断用户是否为管理员
      return userIsAdmin();
    },
    userIsNormalUser() {
      // 判断用户是否为普通用户
      return userIsNormalUser();
    },
  },
  methods: {
    handleAdminAction() {
      // 执行管理员操作
    },
    handleUserAction() {
      // 执行普通用户操作
    },
  },
};
</script>
```

在这个示例中，`HomePage`组件根据用户的角色显示不同的按钮，从而实现了按钮级别的权限控制。请注意，这只是一个简化的示例，实际应用中需要结合具体的权限管理方案和用户角色来实现。

你可以根据项目的需求，结合真实的用户角色和权限逻辑来实现更复杂的权限管理系统。同时，也可以使用第三方库（如`vue-router`和`vue-directive-permission`等）来简化权限管理的实现。