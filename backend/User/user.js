// ======================
// 加载用户数据
// ======================
async function loadUsers() {
  const { data, error } = await supabaseClient
    .from("users")
    .select("id, username, password, coins, balance, platform_account, created_at")
    .order("id", { ascending: true });

  if (error) {
    alert("❌ 加载用户失败: " + error.message);
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
      <td style="color:${user.coins < 0 ? "red" : "black"}">${user.coins ?? 0}</td>
      <td style="color:${user.balance < 0 ? "red" : "black"}">${user.balance ?? 0}</td>
      <td>${new Date(user.created_at).toISOString().split('T')[0]}</td>
      <td class="action-btns">
        <button onclick="updateField(${user.id}, 'coins', 'add')">➕ Coins</button>
        <button onclick="updateField(${user.id}, 'coins', 'sub')">➖ Coins</button>
        <button onclick="updateField(${user.id}, 'balance', 'add')">➕ Balance</button>
        <button onclick="updateField(${user.id}, 'balance', 'sub')">➖ Balance</button>
        <button onclick="changePassword(${user.id}, '${user.password || ""}')">🔑 Password</button>
        <button onclick="deleteUser(${user.id})">🗑 Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ======================
// 修改 Coins / Balance
// ======================
async function updateField(userId, field, action) {
  let amount = prompt(`请输入要${action === "add" ? "增加" : "减少"}的${field}:`);
  if (!amount || isNaN(amount)) return;
  amount = parseFloat(amount);

  const { data: user } = await supabaseClient
    .from("users")
    .select(field)
    .eq("id", userId)
    .single();
  if (!user) return alert("用户不存在");

  let newValue = action === "add" ? user[field] + amount : user[field] - amount;

  const { error } = await supabaseClient
    .from("users")
    .update({ [field]: newValue })
    .eq("id", userId);

  if (error) {
    alert(`❌ 更新 ${field} 失败: ` + error.message);
  } else {
    alert(`✅ ${field} 已更新，当前值 = ${newValue}`);
    loadUsers();
  }
}

// ======================
// 修改密码
// ======================
async function changePassword(userId, oldPassword) {
  const newPassword = prompt("请输入新密码:", oldPassword);
  if (newPassword === null) return;

  const { error } = await supabaseClient
    .from("users")
    .update({ password: newPassword })
    .eq("id", userId);

  if (error) {
    alert("❌ 更新密码失败: " + error.message);
  } else {
    alert("✅ 密码已更新！");
    loadUsers();
  }
}

// ======================
// 删除用户
// ======================
async function deleteUser(userId) {
  if (!confirm(`⚠️ 确定删除用户 #${userId} 吗？`)) return;

  const { error } = await supabaseClient.from("users").delete().eq("id", userId);

  if (error) {
    alert("❌ 删除用户失败: " + error.message);
  } else {
    alert("✅ 用户删除成功！");
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
// 页面加载时执行
// ======================
document.addEventListener("DOMContentLoaded", loadUsers);
