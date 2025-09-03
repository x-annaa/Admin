// 底部导航按钮点击切换页面
const bottomButtons = document.querySelectorAll(".bottom-nav button");
const pages = document.querySelectorAll(".page");

bottomButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // 1️⃣ 按钮高亮
    bottomButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // 2️⃣ 页面显示切换
    const pageId = btn.dataset.page;
    pages.forEach(p => p.classList.remove("active"));
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.add("active");
  });
});
