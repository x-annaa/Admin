let editingProductId = null;
let currentMatchProductId = null;

document.addEventListener("DOMContentLoaded", () => {
  const productsTableBody = document.querySelector("#productsTable tbody");

  async function loadProducts() {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("id", { ascending: true });
    if (error) return alert("❌ 加载产品失败: " + error.message);

    productsTableBody.innerHTML = "";

    data.forEach(product => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td>${product.price}</td>
        <td>${product.profit || 0}</td>
        <td>
          <button class="edit-btn">✏ 编辑</button>
          <button class="match-btn">🎯 匹配</button>
        </td>
      `;

      // 给编辑按钮绑定事件
      tr.querySelector(".edit-btn").addEventListener("click", () => {
        openProductModal(
          product.id,
          product.name,
          product.price,
          product.description || "",
          product.profit || 0,
          product.url || ""
        );
      });

      // 给匹配按钮绑定事件
      tr.querySelector(".match-btn").addEventListener("click", () => {
        openProductMatchModal(product.id, product.enabled, product.manual_only);
      });

      productsTableBody.appendChild(tr);
    });
  }

  // 打开编辑/添加弹窗
  window.openProductModal = function(id=null, name="", price=0, description="", profit=0, url="") {
    editingProductId = id;
    document.getElementById("editName").value = name;
    document.getElementById("editPrice").value = price;
    document.getElementById("editDescription").value = description;
    document.getElementById("editProfit").value = profit;
    document.getElementById("editUrl").value = url;
    document.getElementById("productModalTitle").textContent = id ? "编辑产品" : "添加产品";
    document.getElementById("productModal").style.display = "flex";
  };

  // 匹配弹窗
  window.openProductMatchModal = function(id, enabled, manual_only) {
    currentMatchProductId = id;
    document.getElementById("productEnabledCheckbox").checked = enabled;
    document.getElementById("productManualOnlyCheckbox").checked = manual_only;
    document.getElementById("productMatchModal").style.display = "flex";
  };

  // 关闭弹窗
  document.getElementById("closeProductModal").onclick = () => document.getElementById("productModal").style.display = "none";
  document.getElementById("closeProductMatchModal").onclick = () => document.getElementById("productMatchModal").style.display = "none";

  // 保存产品
  document.getElementById("saveProductBtn").onclick = async () => {
    const name = document.getElementById("editName").value.trim();
    const price = parseFloat(document.getElementById("editPrice").value);
    const description = document.getElementById("editDescription").value.trim();
    const profit = parseFloat(document.getElementById("editProfit").value);
    const url = document.getElementById("editUrl").value.trim() || null;

    if(!name || isNaN(price) || isNaN(profit)) return alert("❌ 请填写完整信息");

    if(editingProductId) {
      const { error } = await supabaseClient.from("products").update({name, price, description, profit, url}).eq("id", editingProductId);
      if(error) return alert("❌ 更新失败: "+error.message);
      alert("✅ 更新成功");
    } else {
      const { error } = await supabaseClient.from("products").insert([{name, price, description, profit, url, enabled:true, manual_only:false}]);
      if(error) return alert("❌ 添加失败: "+error.message);
      alert("✅ 添加成功");
    }

    document.getElementById("productModal").style.display = "none";
    loadProducts();
  };

  // 删除产品
  document.getElementById("deleteProductBtn").onclick = async () => {
    if(!editingProductId) return;
    if(!confirm("⚠️ 确定删除吗？")) return;

    const { error } = await supabaseClient.from("products").delete().eq("id", editingProductId);
    if(error) return alert("❌ 删除失败: "+error.message);
    alert("✅ 删除成功");

    document.getElementById("productModal").style.display = "none";
    loadProducts();
  };

  // 保存匹配设置
  document.getElementById("saveProductMatchBtn").onclick = async () => {
    if(!currentMatchProductId) return;
    const enabled = document.getElementById("productEnabledCheckbox").checked;
    const manual_only = document.getElementById("productManualOnlyCheckbox").checked;
    const { error } = await supabaseClient.from("products").update({enabled, manual_only}).eq("id", currentMatchProductId);
    if(error) return alert("❌ 保存失败: "+error.message);
    alert("✅ 保存成功");
    document.getElementById("productMatchModal").style.display = "none";
    loadProducts();
  };

  // 添加产品按钮
  document.getElementById("addProductBtn").onclick = () => openProductModal();

  // 初始化加载
  loadProducts();
});
