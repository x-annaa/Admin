// ======================
// 加载产品数据
// ======================
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("id, name, price, description, profit, enabled, manual_only")
    .order("id", { ascending: true });

  if (error) {
    alert("❌ 加载产品失败: " + error.message);
    return;
  }

  const tbody = document.querySelector("#productsTable tbody");
  tbody.innerHTML = "";

  data.forEach((product) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>${product.price}</td>
      <td>${product.description}</td>
      <td>${product.profit}</td>
      <td>
        <button onclick="openProductModal(${product.id}, '${product.name}', ${product.price}, '${product.description}', ${product.profit}, ${product.enabled}, ${product.manual_only})">✏ 编辑</button>
        <button onclick="openProductMatchModal(${product.id}, ${product.enabled}, ${product.manual_only})">🎯 匹配</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ======================
// 编辑 / 添加产品弹窗
// ======================
let editingProductId = null;

function openProductModal(id = null, name = "", price = 0, description = "", profit = 0, enabled = true, manual_only = false) {
  editingProductId = id;

  document.getElementById("editName").value = name;
  document.getElementById("editPrice").value = price;
  document.getElementById("editDescription").value = description;
  document.getElementById("editProfit").value = profit;

  document.getElementById("productModalTitle").textContent = id ? "编辑产品" : "添加产品";

  document.getElementById("productModal").style.display = "flex";
}

// 关闭弹窗
document.getElementById("closeProductModal").onclick = () => {
  document.getElementById("productModal").style.display = "none";
};

// 保存产品
document.getElementById("saveProductBtn").onclick = async () => {
  const name = document.getElementById("editName").value;
  const price = parseFloat(document.getElementById("editPrice").value);
  const description = document.getElementById("editDescription").value;
  const profit = parseFloat(document.getElementById("editProfit").value);

  if (!name || isNaN(price) || !description || isNaN(profit)) {
    return alert("❌ 请填写完整且合法的产品信息！");
  }

  if (editingProductId) {
    const { error } = await supabaseClient
      .from("products")
      .update({ name, price, description, profit })
      .eq("id", editingProductId);
    if (error) return alert("❌ 更新产品失败: " + error.message);
    alert("✅ 产品更新成功!");
  } else {
    const { error } = await supabaseClient
      .from("products")
      .insert([{ name, price, description, profit, enabled: true, manual_only: false }]);
    if (error) return alert("❌ 添加产品失败: " + error.message);
    alert("✅ 产品添加成功!");
  }

  document.getElementById("productModal").style.display = "none";
  loadProducts();
};

// 删除产品
document.getElementById("deleteProductBtn").onclick = async () => {
  if (!editingProductId) return;
  if (!confirm("⚠️ 确定删除该产品吗？")) return;
  const { error } = await supabaseClient.from("products").delete().eq("id", editingProductId);
  if (error) return alert("❌ 删除失败: " + error.message);
  alert("✅ 删除成功");
  document.getElementById("productModal").style.display = "none";
  loadProducts();
};

// ======================
// 匹配开关弹窗
// ======================
let currentMatchProductId = null;

function openProductMatchModal(id, enabled, manual_only) {
  currentMatchProductId = id;

  document.getElementById("productEnabledCheckbox").checked = enabled;
  document.getElementById("productManualOnlyCheckbox").checked = manual_only;

  document.getElementById("productMatchModal").style.display = "flex";
}

// 关闭匹配弹窗
document.getElementById("closeProductMatchModal").onclick = () => {
  document.getElementById("productMatchModal").style.display = "none";
};

// 保存匹配开关
document.getElementById("saveProductMatchBtn").onclick = async () => {
  if (!currentMatchProductId) return;

  const enabled = document.getElementById("productEnabledCheckbox").checked;
  const manual_only = document.getElementById("productManualOnlyCheckbox").checked;

  const { error } = await supabaseClient
    .from("products")
    .update({ enabled, manual_only })
    .eq("id", currentMatchProductId);

  if (error) return alert("❌ 保存失败: " + error.message);

  alert("✅ 保存成功");
  document.getElementById("productMatchModal").style.display = "none";
  loadProducts();
};

// ======================
// 添加产品按钮事件
// ======================
document.getElementById("addProductBtn").onclick = () => {
  openProductModal();
};

// ======================
// 页面加载时执行
// ======================
document.addEventListener("DOMContentLoaded", loadProducts);
