<template>
  <header class="navbar">
    <ToggleSidebarButton  />
    <span ref="navbarBrand">
      <NavbarBrand />
    </span>
    <div class="navbar-items-wrapper" >
      <slot name="before" />
      <NavbarItems class="can-hide" />
      <slot name="after" />
      <ToggleColorModeButton />
      <NavbarSearch />
    </div>
  </header>
  </template>
<script lang="ts" >
import ToggleSidebarButton from '../blobTheme/ToggleSidebarButton.vue'
export default {
  components: {ToggleSidebarButton},
  setup() {
    // ...
  }
}
</script>
<style scoped>
.navbar{
  position: fixed;
  z-index: 20;
  padding: 11.2px 24px 11.2px 64px;
  border-bottom-width: 1px;
  height: 57.5938px;
}
</style>