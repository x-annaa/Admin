// ⚡ 初始化 Supabase
const SUPABASE_URL = "https://ffdrwsemmfvqlqhyjlnb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHJ3c2VtbWZ2cWxxaHlqbG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDI1ODQsImV4cCI6MjA3MTg3ODU4NH0.x7TQHZ2af8O_f9ye__mT6eVstlH9BiyVkNVaOnL3h74";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 设定管理员密码（⚠️ 简单演示，正式环境推荐放在 server）
const ADMIN_PASSWORD = "123";

// 登录验证
function checkAdmin() {
  const input = document.getElementById("adminPassword").value;
  if (input === ADMIN_PASSWORD) {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("adminSection").style.display = "block";
    loadUsers();
  } else {
    alert("Wrong password!");
  }
}

// 加载用户
async function loadUsers() {
  const { data, error } = await supabaseClient
    .from("users")
    .select("id, username, password, balance, platform_account, traffic, created_at")
    .order("id", { ascending: true });

  if (error) {
    alert("Error loading users: " + error.message);
    return;
  }

  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML = "";

  data.forEach(user => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.platform_account || "-"}</td>
      <td>${user.balance ?? 0}</td>
      <td>${user.traffic ?? 0}</td>
      <td>${new Date(user.created_at).toLocaleString()}</td>
      <td><button onclick="deleteUser(${user.id})">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// 删除用户
async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete user #" + userId + "?")) return;

  const { error } = await supabaseClient.from("users").delete().eq("id", userId);

  if (error) {
    alert("Error deleting user: " + error.message);
  } else {
    alert("User deleted successfully!");
    loadUsers(); // 刷新
  }
}

// 搜索用户
function searchUsers() {
  const filter = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#usersTable tbody tr");

  rows.forEach(row => {
    const username = row.cells[1].textContent.toLowerCase();
    if (username.includes(filter)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}
