(() => {
  // tbody 容器
  const rechargesTable = document.getElementById("rechargesTable").getElementsByTagName("tbody")[0];

  // 搜索输入框
  const searchInput = document.getElementById("searchRechargeInput");

  // 格式化时间
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, "0") + "-" +
      String(date.getDate()).padStart(2, "0") + " " +
      String(date.getHours()).padStart(2, "0") + ":" +
      String(date.getMinutes()).padStart(2, "0") + ":" +
      String(date.getSeconds()).padStart(2, "0");
  }

  // 获取充值记录
  async function fetchRecharges() {
    try {
      const { data, error } = await supabaseClient
        .from("recharges")
        .select(`
          id,
          amount,
          recharge_url,
          status,
          created_at,
          platform_account,
          users!inner(uuid, username)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      displayRecharges(data);
    } catch (err) {
      console.error("加载充值记录失败:", err);
      rechargesTable.innerHTML = `<tr><td colspan="7" style="color:red">加载失败: ${err.message}</td></tr>`;
    }
  }

  // 渲染表格
  function displayRecharges(recharges) {
    rechargesTable.innerHTML = "";

    recharges.forEach(item => {
      const row = rechargesTable.insertRow();

      row.insertCell(0).textContent = item.users?.username || "未知用户";
      row.insertCell(1).textContent = item.platform_account || "-";
      row.insertCell(2).textContent = item.amount;
      row.insertCell(3).innerHTML = `<a href="${item.recharge_url}" target="_blank">查看截图</a>`;

      const statusCell = row.insertCell(4);
      statusCell.textContent = item.status;
      if (item.status === "拒绝") statusCell.style.color = "red";
      else if (item.status === "已完成") statusCell.style.color = "green";
      else statusCell.style.color = "orange";

      row.insertCell(5).textContent = formatDate(item.created_at);

      const actionsCell = row.insertCell(6);

      const rejectBtn = document.createElement("button");
      rejectBtn.textContent = "拒绝";
      rejectBtn.className = "reject";
      rejectBtn.onclick = () => updateStatus(item.id, "拒绝");

      const completeBtn = document.createElement("button");
      completeBtn.textContent = "已完成";
      completeBtn.className = "complete";
      completeBtn.onclick = () => updateStatus(item.id, "已完成");

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "删除";
      deleteBtn.className = "delete";
      deleteBtn.onclick = () => deleteRecharge(item.id);

      actionsCell.appendChild(rejectBtn);
      actionsCell.appendChild(completeBtn);
      actionsCell.appendChild(deleteBtn);
    });
  }

  // 更新状态
  async function updateStatus(id, status) {
    const { error } = await supabaseClient
      .from("recharges")
      .update({ status })
      .eq("id", id);

    if (error) alert("更新状态失败: " + error.message);
    else fetchRecharges();
  }

  // 删除充值记录
  async function deleteRecharge(id) {
    if (!confirm("确定要删除这条充值记录吗？")) return;
    const { error } = await supabaseClient
      .from("recharges")
      .delete()
      .eq("id", id);

    if (error) alert("删除失败: " + error.message);
    else fetchRecharges();
  }

  // 搜索功能（用户名 / 平台账号）
  searchInput.addEventListener("keyup", async () => {
    const keyword = searchInput.value.trim();
    let query = supabaseClient
      .from("recharges")
      .select(`
        id,
        amount,
        recharge_url,
        status,
        created_at,
        platform_account,
        users!inner(uuid, username)
      `)
      .order("created_at", { ascending: false });

    if (keyword) {
      query = query.or(`users.username.ilike.%${keyword}%,platform_account.ilike.%${keyword}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("搜索失败:", error);
      return;
    }
    displayRecharges(data);
  });

  // 初始化
  fetchRecharges();
})();
