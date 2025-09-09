let editingProductId = null;
let currentMatchProductId = null;
let currentRuleProductId = null;

document.addEventListener("DOMContentLoaded", () => {

  // ----------------------
  // 加载产品列表
  // ----------------------
  async function loadProducts() {
    const { data, error } = await supabaseClient
      .from("products")
      .select("id, name, price, description, profit, enabled, manual_only, max_orders, period_minutes")
      .order("id", { ascending: true });
    if (error) return alert("❌ 加载产品失败: " + error.message);

    const tbody = document.querySelector("#productsTable tbody");
    tbody.innerHTML = "";
    data.forEach(product => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td>${product.price}</td>
        <td>${product.description}</td>
        <td>${product.profit}</td>
        <td>
          <button onclick="openProductModal(${product.id}, '${product.name}', ${product.price}, '${product.description}', ${product.profit})">✏ 编辑</button>
          <button onclick="openProductMatchModal(${product.id}, ${product.enabled}, ${product.manual_only})">🎯 匹配</button>
          <button onclick="openProductRuleModal(${product.id}, ${product.max_orders || 0}, ${product.period_minutes || 0})">⚙️ 产品规则</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ----------------------
  // 编辑/添加产品弹窗
  // ----------------------
  window.openProductModal = function(id=null, name="", price=0, description="", profit=0) {
    editingProductId = id;
    document.getElementById("editName").value = name;
    document.getElementById("editPrice").value = price;
    document.getElementById("editDescription").value = description;
    document.getElementById("editProfit").value = profit;
    document.getElementById("productModalTitle").textContent = id ? "编辑产品" : "添加产品";
    document.getElementById("productModal").style.display = "flex";
  }

  // ----------------------
  // 匹配设置弹窗
  // ----------------------
  window.openProductMatchModal = function(id, enabled, manual_only) {
    currentMatchProductId = id;
    document.getElementById("productEnabledCheckbox").checked = enabled;
    document.getElementById("productManualOnlyCheckbox").checked = manual_only;
    document.getElementById("productMatchModal").style.display = "flex";
  }

  // ----------------------
  // 产品规则弹窗
  // ----------------------
  window.openProductRuleModal = function(id, max_orders, period_minutes) {
    currentRuleProductId = id;
    document.getElementById("ruleMaxOrders").value = max_orders || 0;
    document.getElementById("rulePeriodMinutes").value = period_minutes || 0;
    document.getElementById("productRuleModal").style.display = "flex";
  }

  // ----------------------
  // 弹窗关闭事件
  // ----------------------
  document.getElementById("closeProductModal").onclick = () => document.getElementById("productModal").style.display = "none";
  document.getElementById("closeProductMatchModal").onclick = () => document.getElementById("productMatchModal").style.display = "none";
  document.getElementById("closeProductRuleModal").onclick = () => document.getElementById("productRuleModal").style.display = "none";

  // ----------------------
  // 保存产品
  // ----------------------
  document.getElementById("saveProductBtn").onclick = async () => {
    const name = document.getElementById("editName").value;
    const price = parseFloat(document.getElementById("editPrice").value);
    const description = document.getElementById("editDescription").value;
    const profit = parseFloat(document.getElementById("editProfit").value);
    if (!name || isNaN(price) || !description || isNaN(profit)) return alert("❌ 请填写完整信息");

    if(editingProductId){
      const { error } = await supabaseClient.from("products").update({name, price, description, profit}).eq("id", editingProductId);
      if(error) return alert("❌ 更新失败: "+error.message);
      alert("✅ 更新成功");
    } else {
      const { error } = await supabaseClient.from("products").insert([{name, price, description, profit, enabled:true, manual_only:false, max_orders:0, period_minutes:0}]);
      if(error) return alert("❌ 添加失败: "+error.message);
      alert("✅ 添加成功");
    }
    document.getElementById("productModal").style.display = "none";
    loadProducts();
  }

  // ----------------------
  // 删除产品
  // ----------------------
  document.getElementById("deleteProductBtn").onclick = async () => {
    if(!editingProductId) return;
    if(!confirm("⚠️ 确定删除吗？")) return;
    const { error } = await supabaseClient.from("products").delete().eq("id", editingProductId);
    if(error) return alert("❌ 删除失败: "+error.message);
    alert("✅ 删除成功");
    document.getElementById("productModal").style.display = "none";
    loadProducts();
  }

  // ----------------------
  // 保存匹配设置
  // ----------------------
  document.getElementById("saveProductMatchBtn").onclick = async () => {
    if(!currentMatchProductId) return;
    const enabled = document.getElementById("productEnabledCheckbox").checked;
    const manual_only = document.getElementById("productManualOnlyCheckbox").checked;
    const { error } = await supabaseClient.from("products").update({enabled, manual_only}).eq("id", currentMatchProductId);
    if(error) return alert("❌ 保存失败: "+error.message);
    alert("✅ 保存成功");
    document.getElementById("productMatchModal").style.display = "none";
    loadProducts();
  }

  // ----------------------
  // 保存产品规则
  // ----------------------
  document.getElementById("saveProductRuleBtn").onclick = async () => {
    if(!currentRuleProductId) return;
    const max_orders = parseInt(document.getElementById("ruleMaxOrders").value) || 0;
    const period_minutes = parseInt(document.getElementById("rulePeriodMinutes").value) || 0;
    const { error } = await supabaseClient.from("products").update({max_orders, period_minutes}).eq("id", currentRuleProductId);
    if(error) return alert("❌ 保存失败: "+error.message);
    alert("✅ 保存成功");
    document.getElementById("productRuleModal").style.display = "none";
    loadProducts();
  }

  // ----------------------
  // 添加产品按钮
  // ----------------------
  document.getElementById("addProductBtn").onclick = () => openProductModal();

  // 页面初始加载
  loadProducts();
});
