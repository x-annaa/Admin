(() => {
  // 使用已经初始化的 supabaseClient
  // const supabaseClient 已经在 backend/User/supabaseClient.js 中创建

  const withdrawalsTable = document
    .getElementById("withdrawalsTable")
    .getElementsByTagName("tbody")[0];
  const searchInput = document.getElementById("searchWithdrawalInput");

  // 格式化时间为 YYYY-MM-DD HH:mm:ss
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, "0") + "-" +
      String(date.getDate()).padStart(2, "0") + " " +
      String(date.getHours()).padStart(2, "0") + ":" +
      String(date.getMinutes()).padStart(2, "0") + ":" +
      String(date.getSeconds()).padStart(2, "0");
  }

  // 获取提现记录（带用户信息）
  async function fetchWithdrawals() {
    let { data, error } = await supabaseClient
      .from("withdrawals")
      .select(`
        id,
        amount,
        wallet_address,
        status,
        created_at,
        users (
          username,
          platform_account
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("获取提现记录失败:", error);
      return;
    }

    displayWithdrawals(data);
  }

  // 渲染提现记录
  function displayWithdrawals(withdrawals) {
    withdrawalsTable.innerHTML = "";

    withdrawals.forEach((item) => {
      const row = withdrawalsTable.insertRow();

      row.insertCell(0).textContent = item.users?.username || "未知用户";
      row.insertCell(1).textContent = item.users?.platform_account || "-";
      row.insertCell(2).textContent = item.amount;
      row.insertCell(3).textContent = item.wallet_address;

      // 状态列加颜色
      const statusCell = row.insertCell(4);
      statusCell.textContent = item.status;
      if (item.status === "拒绝") {
        statusCell.style.color = "red";
      } else if (item.status === "已完成") {
        statusCell.style.color = "green";
      } else {
        statusCell.style.color = "orange"; // 默认状态
      }

      // 时间列使用格式化函数
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
      deleteBtn.onclick = () => deleteWithdrawal(item.id);

      actionsCell.appendChild(rejectBtn);
      actionsCell.appendChild(completeBtn);
      actionsCell.appendChild(deleteBtn);
    });
  }

  // 搜索功能（支持 用户名 / 平台账号 / 钱包地址）
  searchInput.addEventListener("keyup", async () => {
    const keyword = searchInput.value.trim();

    let query = supabaseClient
      .from("withdrawals")
      .select(`
        id,
        amount,
        wallet_address,
        status,
        created_at,
        users (
          username,
          platform_account
        )
      `)
      .order("created_at", { ascending: false });

    if (keyword) {
      query = query.or(
        `users.username.ilike.%${keyword}%,users.platform_account.ilike.%${keyword}%,wallet_address.ilike.%${keyword}%`
      );
    }

    let { data, error } = await query;

    if (error) {
      console.error("搜索失败:", error);
      return;
    }

    displayWithdrawals(data);
  });

  // 更新状态
  async function updateStatus(id, status) {
    const { error } = await supabaseClient
      .from("withdrawals")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("更新状态失败：" + error.message);
    } else {
      fetchWithdrawals();
    }
  }

  // 删除记录
  async function deleteWithdrawal(id) {
    if (!confirm("确定要删除这条记录吗？")) return;

    const { error } = await supabaseClient
      .from("withdrawals")
      .delete()
      .eq("id", id);

    if (error) {
      alert("删除失败：" + error.message);
    } else {
      fetchWithdrawals();
    }
  }

  // 初始化页面
  fetchWithdrawals();
})();
