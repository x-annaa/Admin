// ======================
// product.js
// ======================

// 当前编辑产品ID
let editingProductId = null;

// 当前匹配设置产品ID
let currentMatchProductId = null;

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
        <button onclick="openProductModal(${product.id}, '${product.name}', ${product.price}, '${product.description}', ${product.profit})">✏ 编辑</button>
        <button onclick="openProductMatchModal(${product.id}, ${product.enabled}, ${product.manual_only})">🎯 匹配</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ======================
// 编辑 / 添加产品弹窗
// ======================
function openProductModal(id = null, name = "", price = 0, description = "", profit = 0) {
  editingProductId = id;

  document.getElementById("editName").value = name;
  document.getElementById("editPrice").value = price;
  document.getElementById("editDescription").value = description;
  document.getElementById("editProfit").value = profit;

  document.getElementById("productModalTitle").textContent = id ? "编辑产品" : "添加产品";
  document.getElementById("productModal").style.display = "flex";
}

// 保存产品
async function saveProduct() {
  const name = document.getElementById("editName").value;
  const price = parseFloat(document.getElementById("editPrice").value);
  const description = document.getElementById("editDescription").value;
  const profit = parseFloat(document.getElementById("editProfit").value);

  if (!name || isNaN(price) || !description || isNaN(profit)) {
    return alert("❌ 请填写完整且合法的产品信息！");
  }

  if (editingProductId) {
    // 更新
    const { error } = await supabaseClient
      .from("products")
      .update({ name, price, description, profit })
      .eq("id", editingProductId);
    if (error) return alert("❌ 更新产品失败: " + error.message);
    alert("✅ 产品更新成功!");
  } else {
    // 添加
    const { error } = await supabaseClient
      .from("products")
      .insert([{ name, price, description, profit, enabled: true, manual_only: false }]);
    if (error) return alert("❌ 添加产品失败: " + error.message);
    alert("✅ 产品添加成功!");
  }

  closeProductModal();
  loadProducts();
}

// 删除产品
async function deleteProduct() {
  if (!editingProductId) return;
  if (!confirm("⚠️ 确定删除该产品吗？")) return;

  const { error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", editingProductId);

  if (error) return alert("❌ 删除失败: " + error.message);
  alert("✅ 删除成功");
  closeProductModal();
  loadProducts();
}

// 关闭编辑弹窗
function closeProductModal() {
  document.getElementById("productModal").style.display = "none";
}

// ======================
// 匹配开关弹窗
// ======================
function openProductMatchModal(id, enabled, manual_only) {
  currentMatchProductId = id;
  document.getElementById("productEnabledCheckbox").checked = enabled;
  document.getElementById("productManualOnlyCheckbox").checked = manual_only;
  document.getElementById("productMatchModal").style.display = "flex";
}

// 保存匹配设置
async function saveProductMatch() {
  if (!currentMatchProductId) return;

  const enabled = document.getElementById("productEnabledCheckbox").checked;
  const manual_only = document.getElementById("productManualOnlyCheckbox").checked;

  const { error } = await supabaseClient
    .from("products")
    .update({ enabled, manual_only })
    .eq("id", currentMatchProductId);

  if (error) return alert("❌ 保存失败: " + error.message);
  alert("✅ 保存成功");
  closeProductMatchModal();
  loadProducts();
}

// 关闭匹配弹窗
function closeProductMatchModal() {
  document.getElementById("productMatchModal").style.display = "none";
}

// ======================
// 页面加载后绑定事件
// ======================
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();

  document.getElementById("addProductBtn").onclick = () => openProductModal();
  document.getElementById("closeProductModal").onclick = closeProductModal;
  document.getElementById("saveProductBtn").onclick = saveProduct;
  document.getElementById("deleteProductBtn").onclick = deleteProduct;

  document.getElementById("closeProductMatchModal").onclick = closeProductMatchModal;
  document.getElementById("saveProductMatchBtn").onclick = saveProductMatch;
});
