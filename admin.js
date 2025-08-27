// ⚡ 管理员简单密码保护
const adminPassword = "mySecret123"; // 你自己设定的密码
const input = prompt("请输入管理员密码：");
if (input !== adminPassword) {
  alert("密码错误！");
  window.location.href = "/"; // 跳回首页
}

// ⚡ 初始化 Supabase
const SUPABASE_URL = "https://ffdrwsemmfvqlqhyjlnb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHJ3c2VtbWZ2cWxxaHlqbG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDI1ODQsImV4cCI6MjA3MTg3ODU4NH0.x7TQHZ2af8O_f9ye__mT6eVstlH9BiyVkNVaOnL3h74";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 加载用户数据
async function loadUsers() {
  const { data, error } = await supabaseClient
    .from("users")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    alert("加载用户失败: " + error.message);
    return;
  }

  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML = "";

  data.forEach(user => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.password}</td>
      <td>${user.created_at || ""}</td>
      <td><button class="deleteBtn" data-id="${user.id}">删除</button></td>
    `;
    tbody.appendChild(row);
  });

  // 绑定删除事件
  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const userId = e.target.getAttribute("data-id");
      if (confirm("确定要删除该用户吗？")) {
        await deleteUser(userId);
      }
    });
  });
}

// 删除用户
async function deleteUser(userId) {
  const { error } = await supabaseClient
    .from("users")
    .delete()
    .eq("id", userId);

  if (error) {
    alert("删除失败: " + error.message);
  } else {
    alert("用户已删除！");
    loadUsers(); // 刷新列表
  }
}

// 刷新按钮
document.getElementById("refreshBtn").addEventListener("click", loadUsers);

// 默认进入页面时加载
loadUsers();
