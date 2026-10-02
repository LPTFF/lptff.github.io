const statusNode = document.querySelector("#status");
document.querySelector("#permissions").addEventListener("click", async () => {
  try {
    const granted = await chrome.permissions.request({ permissions: ["bookmarks"] });
    statusNode.textContent = granted ? "已启用。回到书签页面，选择要导入的文件夹即可。" : "未启用，可以稍后再试。";
  } catch { statusNode.textContent = "未能启用权限，请稍后重试。"; }
});
