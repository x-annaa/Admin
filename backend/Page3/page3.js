const page3 = document.getElementById("page3");

// 创建充值表格
page3.innerHTML = `
  <h2>📥 用户充值管理</h2>
  <input type="text" id="searchDeposit" placeholder="搜索用户名..." />
  <table id="depositsTable">
    <thead>
      <tr>
        <th>ID</th>
        <th>用户名</th>
        <th>金额</th>
        <th>网络</th>
        <th>截图</th>
        <th>备注</th>
        <th>状态</th>
        <th>提交时间</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
`;

// 弹窗查看截图
const viewModal = document.createElement("div");
viewModal.className = "modal";
viewModal.innerHTML = `
  <div class="modal-content">
    <h3>查看转账截图</h3>
    <img id="depositImage" src="" />
    <button id="closeViewModal">关闭</button>
  </div>
`;
document.body.appendChild(viewModal);
document.getElementById("closeViewModal").addEventListener("click", () => viewModal.style.display = "none");

// 加载充值记录
async function loadDeposits() {
  try {
    const { data, error } = await supabaseClient
      .from("deposits")
      .select("id, user_id, amount, network, proof_url, description, status, created_at, users(username)")
      .order("created_at", { ascending: false });

    if (error) return alert("加载充值记录失败：" + error.message);

    const tbody = document.querySelector("#depositsTable tbody");
    tbody.innerHTML = "";

    data.forEach(dep => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${dep.id}</td>
        <td>${dep.users?.username || "未知"}</td>
        <td>${dep.amount}</td>
        <td>${dep.network || "-"}</td>
        <td><button class="action-btn view" data-url="${dep.proof_url}">查看</button></td>
        <td>${dep.description || ""}</td>
        <td>${dep.status}</td>
        <td>${new Date(dep.created_at).toLocaleString()}</td>
        <td>
          ${dep.status === "pending" ? `
            <button class="action-btn approve" data-id="${dep.id}">批准</button>
            <button class="action-btn reject" data-id="${dep.id}">拒绝</button>
          ` : "-"}
        </td>
      `;
      tbody.appendChild(tr);
    });

    // 查看截图
    document.querySelectorAll(".action-btn.view").forEach(btn => {
      btn.addEventListener("click", () => {
        document.getElementById("depositImage").src = btn.dataset.url;
        viewModal.style.display = "flex";
      });
    });

    // 批准充值
    document.querySelectorAll(".action-btn.approve").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const { error } = await supabaseClient.from("deposits")
          .update({ status: "approved" })
          .eq("id", id);
        if (error) return alert("操作失败：" + error.message);
        alert("充值已批准");
        loadDeposits();
      });
    });

    // 拒绝充值
    document.querySelectorAll(".action-btn.reject").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const { error } = await supabaseClient.from("deposits")
          .update({ status: "rejected" })
          .eq("id", id);
        if (error) return alert("操作失败：" + error.message);
        alert("充值已拒绝");
        loadDeposits();
      });
    });

  } catch (err) {
    console.error(err);
    alert("加载充值数据异常");
  }
}

// 搜索功能
document.getElementById("searchDeposit").addEventListener("keyup", (e) => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll("#depositsTable tbody tr").forEach(tr => {
    tr.style.display = tr.innerText.toLowerCase().includes(term) ? "" : "none";
  });
});

// 初始加载
loadDeposits();
