<template>
     <header ref="navbar" class="navbar">
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