let currentEditUserId = null;

// ======================
// 加载用户数据（包含订单数量）
// ======================
async function loadUsers() {
  // 获取用户数据
  const { data: users, error: userError } = await supabaseClient
    .from("users")
    .select("id, username, coins, balance, platform_account, created_at")
    .order("id", { ascending: true });

  if (userError) return alert("❌ 加载用户失败: " + userError.message);

  // 获取订单数据
  const { data: orders, error: orderError } = await supabaseClient
    .from("orders")
    .select("user_id");

  if (orderError) return alert("❌ 加载订单失败: " + orderError.message);

  // 统计每个用户的订单数量
  const orderCountMap = {};
  orders.forEach(order => {
    if (!orderCountMap[order.user_id]) orderCountMap[order.user_id] = 0;
    orderCountMap[order.user_id]++;
  });

  // 渲染表格
  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML = "";

  users.forEach(user => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.platform_account || "-"}</td>
      <td style="color:${user.coins < 0 ? "red" : "black"}">${user.coins ?? 0}</td>
      <td style="color:${user.balance < 0 ? "red" : "black"}">${user.balance ?? 0}</td>
      <td>${new Date(user.created_at).toISOString().split('T')[0]}</td>
      <td>${orderCountMap[user.id] ?? 0}</td>
      <td><button onclick="openEditModal(${user.id}, '${user.username}', ${orderCountMap[user.id] ?? 0})">Edit</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// ======================
// 打开编辑弹窗
// ======================
function openEditModal(userId, username, orderCount) {
  currentEditUserId = userId;
  document.getElementById("editUserName").textContent = `编辑用户: ${username} （订单: ${orderCount} 单）`;
  document.getElementById("editModal").style.display = "flex";
}

// ======================
// 关闭弹窗
// ======================
document.getElementById("closeEditModal").addEventListener("click", () => {
  document.getElementById("editModal").style.display = "none";
});

// ======================
// 弹窗按钮功能绑定
// ======================
document.getElementById("addCoinsBtn").addEventListener("click", () => updateField(currentEditUserId, 'coins', 'add'));
document.getElementById("subCoinsBtn").addEventListener("click", () => updateField(currentEditUserId, 'coins', 'sub'));
document.getElementById("addBalanceBtn").addEventListener("click", () => updateField(currentEditUserId, 'balance', 'add'));
document.getElementById("subBalanceBtn").addEventListener("click", () => updateField(currentEditUserId, 'balance', 'sub'));
document.getElementById("changePasswordBtn").addEventListener("click", () => changePasswordPrompt(currentEditUserId));
document.getElementById("deleteUserBtn").addEventListener("click", () => deleteUserPrompt(currentEditUserId));

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

  if (error) alert(`❌ 更新 ${field} 失败: ` + error.message);
  loadUsers();
}

// ======================
// 修改密码
// ======================
async function changePasswordPrompt(userId) {
  const newPassword = prompt("请输入新密码:");
  if (newPassword === null) return;

  const { error } = await supabaseClient
    .from("users")
    .update({ password: newPassword })
    .eq("id", userId);

  if (error) alert("❌ 更新密码失败: " + error.message);
  loadUsers();
}

// ======================
// 删除用户
// ======================
function deleteUserPrompt(userId) {
  if (!confirm(`⚠️ 确定删除用户 #${userId} 吗？`)) return;

  supabaseClient.from("users").delete().eq("id", userId).then(({ error }) => {
    if (error) alert("❌ 删除用户失败: " + error.message);
    loadUsers();
  });
}

// ======================
// 搜索用户
// ======================
function searchUsers() {
  const filter = document.getElementById("searchInput").value.toLowerCase();
  document.querySelectorAll("#usersTable tbody tr").forEach((row) => {
    const username = row.cells[1].textContent.toLowerCase();
    row.style.display = username.includes(filter) ? "" : "none";
  });
}

// ======================
// 页面加载
// ======================
document.addEventListener("DOMContentLoaded", loadUsers);
