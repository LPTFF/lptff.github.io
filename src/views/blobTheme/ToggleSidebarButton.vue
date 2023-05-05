<template>
    <div
      class="toggle-sidebar-button"
      aria-expanded="false"
      role="button"
      tabindex="0"
    >
      <div class="icon" aria-hidden="true">
        <span>1</span>
        <span>2</span>
        <span>3</span>
      </div>
    </div>
  </template>
  <style scoped>
  .icon{
    align-items: center;
    color: rgb(44, 62, 80);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    font-size: 16px;
    height: 20px;
    justify-content: center;
    line-height: 35.2px;
    width: 20px;
  }
  </style>