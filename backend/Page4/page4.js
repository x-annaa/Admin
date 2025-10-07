// Page4/page4.js
document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#rechargesTable tbody");
  const searchInput = document.getElementById("searchRechargeInput");

  if (!tableBody) return;

  // 读取充值记录
  async function loadRecharges() {
    try {
      // 查询 recharges 并关联 users 表获取 name 和 platform_account
      const { data, error } = await supabaseClient
        .from("recharges")
        .select(`
          id,
          amount,
          recharge_url,
          status,
          created_at,
          user_id,
          users!inner(name, platform_account)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      tableBody.innerHTML = "";
      data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.id}</td>
          <td>${row.users.name || "-"}</td>
          <td>${row.users.platform_account || "-"}</td>
          <td>${row.amount}</td>
          <td><a href="${row.recharge_url}" target="_blank">查看截图</a></td>
          <td>${row.status}</td>
          <td>${new Date(row.created_at).toLocaleString()}</td>
          <td>
            <button onclick="updateStatus(${row.id}, 'approved')">通过</button>
            <button onclick="updateStatus(${row.id}, 'rejected')">拒绝</button>
            <button onclick="deleteRecharge(${row.id})">删除</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("加载充值记录失败:", err);
    }
  }

  // 更新状态
  window.updateStatus = async (id, status) => {
    if (!confirm(`确认要将充值记录 ${id} 设置为 ${status} 吗？`)) return;
    try {
      const { data, error } = await supabaseClient
        .from("recharges")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      loadRecharges();
    } catch (err) {
      console.error("更新状态失败:", err);
    }
  };

  // 删除记录
  window.deleteRecharge = async (id) => {
    if (!confirm(`确认删除充值记录 ${id} 吗？此操作不可撤销！`)) return;
    try {
      const { data, error } = await supabaseClient
        .from("recharges")
        .delete()
        .eq("id", id);
      if (error) throw error;
      loadRecharges();
    } catch (err) {
      console.error("删除失败:", err);
    }
  };

  // 搜索功能
  window.searchRecharges = () => {
    const filter = searchInput.value.toLowerCase();
    document.querySelectorAll("#rechargesTable tbody tr").forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(filter) ? "" : "none";
    });
  };

  // 初次加载
  loadRecharges();
});
