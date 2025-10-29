let currentEditUserId = null;
let cooldownTimers = {}; // 每个用户的冷却倒计时

// ======================
// 加载用户数据（包含订单数量 + 冷却）
// ======================
async function loadUsers() {
  try {
    const { data: users, error: userError } = await supabaseClient
      .from("users")
      .select("id, username, coins, balance, platform_account, created_at, register_ip")
      .order("id", { ascending: true });
    if (userError) throw userError;

    const { data: orders, error: orderError } = await supabaseClient
      .from("orders")
      .select("user_id");
    if (orderError) throw orderError;

    const orderCountMap = {};
    orders.forEach(order => {
      if (!orderCountMap[order.user_id]) orderCountMap[order.user_id] = 0;
      orderCountMap[order.user_id]++;
    });

    const tbody = document.querySelector("#usersTable tbody");
    tbody.innerHTML = "";

    for (const user of users) {
      const cooldownText = await getUserCooldownText(user.id);

      const tr = document.createElement("tr");
      tr.dataset.userId = user.id;
      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.platform_account || "-"}</td>
        <td style="color:${user.coins < 0 ? "red" : "black"}">${user.coins ?? 0}</td>
        <td style="color:${user.balance < 0 ? "red" : "black"}">${user.balance ?? 0}</td>
        <td>${new Date(user.created_at).toISOString().split('T')[0]}</td>
        <td>${orderCountMap[user.id] ?? 0}</td>
        <td>${user.register_ip || "-"}</td>
        <td class="cooldownCell">${cooldownText.text}</td>
        <td>
          <button onclick="openEditModal(${user.id}, '${user.username}', ${orderCountMap[user.id] ?? 0})">Setting</button>
          <button onclick="openRuleModal(${user.id}, '${user.username}')">Mark</button>
        </td>
      `;
      tbody.appendChild(tr);

      if (cooldownText.sec > 0) startCooldownTimer(user.id, cooldownText.sec);
    }
  } catch (e) {
    console.error("加载用户数据失败:", e);
    alert("❌ 加载用户失败: " + e.message);
  }
}

// ======================
// 获取用户冷却信息
// 返回 {text, sec}
// ======================
async function getUserCooldownText(userId) {
  try {
    const { data: cdData } = await supabaseClient
      .rpc("check_user_order_cooldown", { p_user_id: userId });
    if (cdData && cdData[0] && !cdData[0].allowed) {
      const next = new Date(cdData[0].next_allowed);
      let sec = Math.ceil((next - new Date()) / 1000);
      if (sec < 0) sec = 0;
      return { text: sec > 0 ? formatTime(sec) : "✅ 可下单", sec };
    }
  } catch (e) {
    console.error("获取冷却失败", e);
    return { text: "⚠️ 查询失败", sec: 0 };
  }
  return { text: "✅ 可下单", sec: 0 };
}

// ======================
// 本地倒计时
// ======================
function startCooldownTimer(userId, sec) {
  if (cooldownTimers[userId]) clearInterval(cooldownTimers[userId]);
  const row = document.querySelector(`#usersTable tbody tr[data-user-id='${userId}']`);
  const cell = row?.querySelector(".cooldownCell");
  if (!cell) return;

  cooldownTimers[userId] = setInterval(() => {
    sec--;
    if (sec <= 0) {
      clearInterval(cooldownTimers[userId]);
      cell.textContent = "✅ 可下单";
    } else {
      cell.textContent = formatTime(sec);
    }
  }, 1000);
}

// ======================
// 格式化秒 -> hh:mm:ss
// ======================
function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ======================
// 打开编辑弹窗 (Edit1)
// ======================
function openEditModal(userId, username, orderCount) {
  currentEditUserId = userId;
  document.getElementById("editUserName").textContent = `编辑用户: ${username} （订单: ${orderCount} 单）`;
  document.getElementById("editModal").style.display = "flex";
}

// ======================
// 打开规则弹窗 (Edit2)
// ======================
function openRuleModal(userId, username) {
  const modal = document.getElementById("ruleModal");
  modal.dataset.userId = userId;
  document.getElementById("ruleUserName").textContent = `手动匹配产品 - ${username}`;
  document.getElementById("ruleOrderNumber").value = "";
  document.getElementById("ruleProductId").value = "";
  document.getElementById("ruleEnabled").checked = true;
  modal.style.display = "flex";
}

// ======================
// 保存规则 (Edit2)
// ======================
async function saveRule() {
  const modal = document.getElementById("ruleModal");
  const userId = parseInt(modal.dataset.userId);
  const orderNumber = parseInt(document.getElementById("ruleOrderNumber").value);
  const productId = parseInt(document.getElementById("ruleProductId").value);
  const enabled = document.getElementById("ruleEnabled").checked;

  if (!userId) return alert("❌ 未选择用户");
  if (!orderNumber || !productId) return alert("请输入订单数和产品ID");

  try {
    const { error } = await supabaseClient
      .from("user_product_rules")
      .upsert({
        user_id: userId,
        order_number: orderNumber,
        product_id: productId,
        enabled: enabled
      }, { onConflict: ['user_id', 'order_number'] });

    if (error) throw error;
    alert("✅ 规则已保存");
    modal.style.display = "none";
    loadUsers();
  } catch (e) {
    alert("❌ 保存规则失败: " + e.message);
  }
}

// ======================
// 关闭弹窗
// ======================
document.getElementById("closeEditModal").addEventListener("click", () => {
  document.getElementById("editModal").style.display = "none";
});
document.getElementById("closeRuleModal").addEventListener("click", () => {
  document.getElementById("ruleModal").style.display = "none";
});

// ======================
// 弹窗按钮功能绑定 (Edit1)
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

  try {
    const { data: user } = await supabaseClient
      .from("users")
      .select(field)
      .eq("id", userId)
      .single();
    if (!user) return alert("用户不存在");

    const newValue = action === "add" ? user[field] + amount : user[field] - amount;
    const { error } = await supabaseClient
      .from("users")
      .update({ [field]: newValue })
      .eq("id", userId);
    if (error) throw error;

    loadUsers();
  } catch (e) {
    alert(`❌ 更新 ${field} 失败: ${e.message}`);
  }
}

// ======================
// 修改密码
// ======================
async function changePasswordPrompt(userId) {
  const newPassword = prompt("请输入新密码:");
  if (newPassword === null) return;

  try {
    const { error } = await supabaseClient
      .from("users")
      .update({ password: newPassword })
      .eq("id", userId);
    if (error) throw error;

    loadUsers();
  } catch (e) {
    alert("❌ 更新密码失败: " + e.message);
  }
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
  document.querySelectorAll("#usersTable tbody tr").forEach(row => {
    const username = row.cells[1].textContent.toLowerCase();
    row.style.display = username.includes(filter) ? "" : "none";
  });
}

// ======================
// 页面加载
// ======================
document.addEventListener("DOMContentLoaded", loadUsers);
document.getElementById("saveRuleBtn").addEventListener("click", saveRule);
