// backend/Page4/page4.js
document.addEventListener("DOMContentLoaded", () => {
  const rechargesTableBody = document.querySelector("#rechargesTable tbody");
  const searchInput = document.getElementById("searchRechargeInput");

  // 加载充值记录
  async function loadRecharges() {
    try {
      // 通过嵌套关联 users 表
      const { data, error } = await supabaseClient
        .from("recharges")
        .select(`
          id,
          amount,
          recharge_url,
          status,
          created_at,
          user_id,
          users:user_id(id,name,platform_account)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      rechargesTableBody.innerHTML = "";

      data.forEach(item => {
        const tr = document.createElement("tr");
        const userName = item.users?.[0]?.name || "未知";
        const platformAccount = item.users?.[0]?.platform_account || "";

        tr.innerHTML = `
          <td>${userName}</td>
          <td>${platformAccount}</td>
          <td>${item.amount}</td>
          <td><a href="${item.recharge_url}" target="_blank">查看截图</a></td>
          <td>${item.status || "pending"}</td>
          <td>${new Date(item.created_at).toLocaleString()}</td>
          <td>
            <button class="approveBtn" data-id="${item.id}">通过</button>
            <button class="rejectBtn" data-id="${item.id}">拒绝</button>
            <button class="deleteBtn" data-id="${item.id}">删除</button>
          </td>
        `;
        rechargesTableBody.appendChild(tr);
      });

      attachActions();
    } catch (err) {
      console.error("加载充值记录失败:", err);
      rechargesTableBody.innerHTML = `<tr><td colspan="7" style="color:red">加载失败</td></tr>`;
    }
  }

  function attachActions() {
    document.querySelectorAll(".approveBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        try {
          await supabaseClient.from("recharges").update({ status: "approved" }).eq("id", id);
          loadRecharges();
        } catch (err) {
          console.error("审批失败:", err);
        }
      });
    });

    document.querySelectorAll(".rejectBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        try {
          await supabaseClient.from("recharges").update({ status: "rejected" }).eq("id", id);
          loadRecharges();
        } catch (err) {
          console.error("拒绝失败:", err);
        }
      });
    });

    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("确定要删除这条充值记录吗？")) return;
        try {
          await supabaseClient.from("recharges").delete().eq("id", id);
          loadRecharges();
        } catch (err) {
          console.error("删除失败:", err);
        }
      });
    });
  }

  // 搜索功能
  searchInput?.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    Array.from(rechargesTableBody.children).forEach(tr => {
      const userName = tr.children[0].textContent.toLowerCase();
      const platform = tr.children[1].textContent.toLowerCase();
      tr.style.display = userName.includes(filter) || platform.includes(filter) ? "" : "none";
    });
  });

  loadRecharges();
});
