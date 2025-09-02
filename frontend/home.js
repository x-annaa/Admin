document.addEventListener("DOMContentLoaded", () => {
  const pages = document.querySelectorAll(".page");
  const buttons = document.querySelectorAll(".bottom-nav button");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      // 隐藏所有页面 & 取消按钮高亮
      pages.forEach(page => page.classList.remove("active"));
      buttons.forEach(btn => btn.classList.remove("active"));

      // 显示目标页面 & 高亮当前按钮
      document.getElementById(button.dataset.page).classList.add("active");
      button.classList.add("active");
    });
  });
});
