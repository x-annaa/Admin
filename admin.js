// ⚡ 初始化 Supabase
const SUPABASE_URL = "https://ffdrwsemmfvqlqhyjlnb.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHJ3c2VtbWZ2cWxxaHlqbG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDI1ODQsImV4cCI6MjA3MTg3ODU4NH0.x7TQHZ2af8O_f9ye__mT6eVstlH9BiyVkNVaOnL3h74";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 🔐 管理员密码
const ADMIN_PASSWORD = "123";

// ======================
// 管理员登录验证
// ======================
function checkAdmin() {
  const input = document.getElementById("adminPassword").value;
  if (input === ADMIN_PASSWORD) {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("adminSection").style.display = "block";
    switchPage("users"); // 默认进入 Users 页面
  } else {
    alert("❌ Wrong password!");
  }
}

// ======================
// 加载用户数据
// ======================
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

  data.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.password || "-"}</td>
      <td>${user.platform_account || "-"}</td>
      <td style="color:${user.balance < 0 ? "red" : "black"}">${user.balance ?? 0}</td>
      <td>${user.traffic ?? 0}</td>
      <td>${new Date(user.created_at).toLocaleString()}</td>
      <td class="action-btns">
        <button onclick="updateBalance(${user.id}, 'add')">➕ Add</button>
        <button onclick="updateBalance(${user.id}, 'sub')">➖ Sub</button>
        <button onclick="deleteUser(${user.id})">🗑 Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ======================
// 修改余额（允许负数）
// ======================
async function updateBalance(userId, action) {
  let amount = prompt(`Enter amount to ${action === "add" ? "add" : "subtract"}:`);
  if (!amount || isNaN(amount)) return;
  amount = parseFloat(amount);

  // 获取用户当前余额
  const { data: user } = await supabaseClient
    .from("users")
    .select("balance")
    .eq("id", userId)
    .single();
  if (!user) return alert("User not found");

  let newBalance = action === "add" ? user.balance + amount : user.balance - amount;

  const { error } = await supabaseClient
    .from("users")
    .update({ balance: newBalance })
    .eq("id", userId);

  if (error) {
    alert("❌ Error updating balance: " + error.message);
  } else {
    alert(`✅ Balance updated! New balance = ${newBalance}`);
    loadUsers();
  }
}

// ======================
// 删除用户
// ======================
async function deleteUser(userId) {
  if (!confirm("⚠️ Are you sure you want to delete user #" + userId + "?")) return;

  const { error } = await supabaseClient.from("users").delete().eq("id", userId);

  if (error) {
    alert("Error deleting user: " + error.message);
  } else {
    alert("✅ User deleted successfully!");
    loadUsers();
  }
}

// ======================
// 搜索用户
// ======================
function searchUsers() {
  const filter = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#usersTable tbody tr");

  rows.forEach((row) => {
    const username = row.cells[1].textContent.toLowerCase();
    row.style.display = username.includes(filter) ? "" : "none";
  });
}

// ======================
// 页面切换
// ======================
function switchPage(page) {
  const content = document.getElementById("pageContent");

  if (page === "users") {
    content.innerHTML = `
      <h2>Users Management</h2>
      <input type="text" id="searchInput" placeholder="Search username..." onkeyup="searchUsers()">
      <table id="usersTable">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Password</th>
            <th>Platform Account</th>
            <th>Balance</th>
            <th>Traffic</th>
            <th>Register Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    loadUsers();
  } else {
    content.innerHTML = `<h2>${page.charAt(0).toUpperCase() + page.slice(1)} Page</h2><p>(空白页面)</p>`;
  }
}
