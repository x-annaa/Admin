function switchPage(page) {
  const pageContent = document.getElementById("pageContent");
  const pageCss = document.getElementById("pageCss");
  const pageJs = document.getElementById("pageJs");

  // 切换 CSS
  pageCss.setAttribute("href", `css/${page}.css`);

  // 切换 JS (先移除旧的，再加新的)
  if (pageJs) {
    pageJs.remove();
  }
  const newScript = document.createElement("script");
  newScript.src = `js/${page}.js`;
  newScript.id = "pageJs";
  document.body.appendChild(newScript);

  // 动态设置页面内容
  pageContent.innerHTML = `<h1>${page.toUpperCase()} PAGE</h1>`;
}
