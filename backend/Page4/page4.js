(() => {
  // 已经初始化好的 supabaseClient
  const rechargesTable = document
    .getElementById("rechargesTable")
    .getElementsByTagName("tbody")[0];
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
    let { data, error } = await supabaseClient
      .from("recharges")
      .select(`
        id,
        amount,
        recharge_url,
        status,
        created_at,
        user_id,
        users:user_id (
          name,
          platform_account
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("加载充值记录失败:", error);
      return;
    }

    displayRecharges(data);
  }

  // 渲染充值记录
  function displayRecharges(recharges) {
    rechargesTable.innerHTML = "";

    recharges.forEach((item) => {
      const row = rechargesTable.insertRow();

      row.insertCell(0).textContent = item.users?.name || "未知用户";
      row.insertCell(1).textContent = item.users?.platform_account || "-";
      row.insertCell(2).textContent = item.amount;

      const urlCell = row.insertCell(3);
      const link = document.createElement("a");
      link.href = item.recharge_url;
      link.target = "_blank";
      link.textContent = "查看截图";
      urlCell.appendChild(link);

      const statusCell = row.insertCell(4);
      statusCell.textContent = item.status;
      if (item.status === "拒绝") statusCell.style.color = "red";
      else if (item.status === "已完成") statusCell.style.color = "green";
      else statusCell.style.color = "orange";

      row.insertCell(5).textContent = formatDate(item.created_at);

      // 操作按钮
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

  // 搜索功能
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
        user_id,
        users:user_id (
          name,
          platform_account
        )
      `)
      .order("created_at", { ascending: false });

    if (keyword) {
      query = query.or(
        `users.name.ilike.%${keyword}%,users.platform_account.ilike.%${keyword}%`
      );
    }

    let { data, error } = await query;

    if (error) {
      console.error("搜索失败:", error);
      return;
    }

    displayRecharges(data);
  });

  // 更新状态
  async function updateStatus(id, status) {
    const { error } = await supabaseClient
      .from("recharges")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("更新状态失败：" + error.message);
    } else {
      fetchRecharges();
    }
  }

  // 删除记录
  async function deleteRecharge(id) {
    if (!confirm("确定删除此充值记录吗？")) return;

    const { error } = await supabaseClient
      .from("recharges")
      .delete()
      .eq("id", id);

    if (error) {
      alert("删除失败：" + error.message);
    } else {
      fetchRecharges();
    }
  }

  // 初始化
  fetchRecharges();
})();
