// backend/Page4/page4.js
document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#rechargesTable tbody");
  const searchInput = document.getElementById("searchRechargeInput");

  // 加载充值记录
  async function loadRecharges(searchTerm = "") {
    try {
      // 1. 获取充值记录
      const { data: recharges, error: rechargeError } = await supabaseClient
        .from("recharges")
        .select("*")
        .order("created_at", { ascending: false });
      if (rechargeError) throw rechargeError;

      // 2. 获取所有用户信息
      const userIds = recharges.map(r => r.user_id).filter(Boolean);
      let users = [];
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabaseClient
          .from("users")
          .select("id, name, platform_account");
        if (usersError) throw usersError;
        users = usersData;
      }

      const userMap = {};
      users.forEach(u => userMap[u.id] = u);

      // 3. 渲染表格
      tableBody.innerHTML = "";
      recharges.forEach(row => {
        const user = userMap[row.user_id] || {};
        const userName = user.name || "-";
        const platformAccount = user.platform_account || "-";

        if (
          searchTerm &&
          !userName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !platformAccount.toLowerCase().includes(searchTerm.toLowerCase())
        ) return; // 过滤搜索

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.id}</td>
          <td>${userName}</td>
          <td>${platformAccount}</td>
          <td>${row.amount}</td>
          <td><a href="${row.recharge_url}" target="_blank">查看截图</a></td>
          <td>${row.status}</td>
          <td>${new Date(row.created_at).toLocaleString()}</td>
          <td>
            <button class="approve-btn" data-id="${row.id}">通过</button>
            <button class="reject-btn" data-id="${row.id}">拒绝</button>
            <button class="delete-btn" data-id="${row.id}">删除</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });

      attachButtons(); // 绑定操作按钮事件
    } catch (err) {
      console.error("加载充值记录失败:", err);
    }
  }

  // 绑定按钮事件
  function attachButtons() {
    document.querySelectorAll(".approve-btn").forEach(btn => {
      btn.onclick = () => updateStatus(btn.dataset.id, "approved");
    });
    document.querySelectorAll(".reject-btn").forEach(btn => {
      btn.onclick = () => updateStatus(btn.dataset.id, "rejected");
    });
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.onclick = () => deleteRecharge(btn.dataset.id);
    });
  }

  // 修改状态
  async function updateStatus(id, status) {
    try {
      const { error } = await supabaseClient
        .from("recharges")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      loadRecharges(searchInput.value);
    } catch (err) {
      console.error("更新状态失败:", err);
    }
  }

  // 删除记录
  async function deleteRecharge(id) {
    if (!confirm("确定要删除这条充值记录吗？")) return;
    try {
      const { error } = await supabaseClient
        .from("recharges")
        .delete()
        .eq("id", id);
      if (error) throw error;
      loadRecharges(searchInput.value);
    } catch (err) {
      console.error("删除充值记录失败:", err);
    }
  }

  // 搜索
  searchInput?.addEventListener("input", () => {
    loadRecharges(searchInput.value);
  });

  // 初始加载
  loadRecharges();
});
