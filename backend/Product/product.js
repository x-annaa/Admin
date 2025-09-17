let editingProductId = null;
let currentMatchProductId = null;

// 存储订单限制配置
let orderLimitSettings = {
  max_orders: 5,
  cooldown_seconds: 180
};

document.addEventListener("DOMContentLoaded", () => {

  // ----------------------
  // 加载产品列表
  // ----------------------
  async function loadProducts() {
    const { data, error } = await supabaseClient
      .from("products")
      .select("id, name, price, description, profit, enabled, manual_only")
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
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ----------------------
  // 加载订单限制配置
  // ----------------------
  async function loadOrderLimitSettings() {
    const { data, error } = await supabaseClient
      .from("order_limit_settings")
      .select("*")
      .limit(1)
      .single();
    if(error){
      console.error("加载订单限制配置失败:", error.message);
      return;
    }
    orderLimitSettings.max_orders = data.max_orders;
    orderLimitSettings.cooldown_seconds = data.cooldown_seconds;

    // 弹窗里面也更新值
    const maxEl = document.getElementById("limitMaxOrders");
    const cdEl = document.getElementById("limitCooldownSeconds");
    if(maxEl) maxEl.value = data.max_orders;
    if(cdEl) cdEl.value = data.cooldown_seconds;
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
  // 产品匹配设置弹窗
  // ----------------------
  window.openProductMatchModal = function(id, enabled, manual_only) {
    currentMatchProductId = id;
    document.getElementById("productEnabledCheckbox").checked = enabled;
    document.getElementById("productManualOnlyCheckbox").checked = manual_only;
    document.getElementById("productMatchModal").style.display = "flex";
  }

  // ----------------------
  // 弹窗关闭事件
  // ----------------------
  document.getElementById("closeProductModal").onclick = () => document.getElementById("productModal").style.display = "none";
  document.getElementById("closeProductMatchModal").onclick = () => document.getElementById("productMatchModal").style.display = "none";
  document.getElementById("closeLimitSettingsModal").onclick = () => document.getElementById("limitSettingsModal").style.display = "none";

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
      const { error } = await supabaseClient.from("products").insert([{name, price, description, profit, enabled:true, manual_only:false}]);
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
  // 保存订单限制设置
  // ----------------------
  document.getElementById("saveLimitSettingsBtn").onclick = async () => {
    const max_orders = parseInt(document.getElementById("limitMaxOrders").value);
    const cooldown_seconds = parseInt(document.getElementById("limitCooldownSeconds").value);

    if(isNaN(max_orders) || isNaN(cooldown_seconds) || max_orders < 1 || cooldown_seconds < 1) {
      return alert("❌ 请填写正确的数字");
    }

    const { error } = await supabaseClient
      .from("order_limit_settings")
      .update({ max_orders, cooldown_seconds, updated_at: new Date() })
      .eq("id", 1);
    if(error) return alert("❌ 保存失败: "+error.message);

    alert("✅ 保存成功");
    document.getElementById("limitSettingsModal").style.display = "none";

    orderLimitSettings.max_orders = max_orders;
    orderLimitSettings.cooldown_seconds = cooldown_seconds;
  }

  // ----------------------
  // 添加产品按钮
  // ----------------------
  document.getElementById("addProductBtn").onclick = () => openProductModal();

  // ----------------------
  // A1 按钮（订单限制配置弹窗）
  // ----------------------
  const a1Btn = document.createElement("button");
  a1Btn.textContent = "A1";
  a1Btn.style.marginLeft = "8px";
  a1Btn.onclick = () => {
    document.getElementById("limitSettingsModal").style.display = "flex";
  };
  document.getElementById("addProductBtn").parentNode.insertBefore(a1Btn, document.getElementById("addProductBtn").nextSibling);

  // 页面初始加载
  loadProducts();
  loadOrderLimitSettings();
});
