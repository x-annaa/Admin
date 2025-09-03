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
        <button onclick="deleteProduct(${product.id})">🗑 删除</button>
        <button onclick="toggleEnabled(${product.id}, ${product.enabled})">
          ${product.enabled ? "关闭匹配" : "开启匹配"}
        </button>
        <button onclick="toggleManualOnly(${product.id}, ${product.manual_only})">
          ${product.manual_only ? "关闭手动专属" : "设置手动专属"}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ======================
// 编辑 / 添加产品弹窗
// ======================
let editingProductId = null;
let editingEnabled = true;
let editingManualOnly = false;

function openProductModal(id = null, name = "", price = 0, description = "", profit = 0, enabled = true, manual_only = false) {
  editingProductId = id;
  editingEnabled = enabled;
  editingManualOnly = manual_only;

  document.getElementById("editName").value = name;
  document.getElementById("editPrice").value = price;
  document.getElementById("editDescription").value = description;
  document.getElementById("editProfit").value = profit;

  document.getElementById("productModalTitle").textContent = id ? "编辑产品" : "添加产品";

  // 弹窗内显示开关状态
  if (!document.getElementById("productEnabledCheckbox")) {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" id="productEnabledCheckbox"> 可匹配
    `;
    document.querySelector("#productModal .modal-content").insertBefore(label, document.querySelector("#productModal .modal-actions"));
  }
  document.getElementById("productEnabledCheckbox").checked = enabled;

  if (!document.getElementById("productManualOnlyCheckbox")) {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" id="productManualOnlyCheckbox"> 仅手动匹配
    `;
    document.querySelector("#productModal .modal-content").insertBefore(label, document.querySelector("#productModal .modal-actions"));
  }
  document.getElementById("productManualOnlyCheckbox").checked = manual_only;

  document.getElementById("productModal").style.display = "flex";
}

document.getElementById("closeProductModal").onclick = () => {
  document.getElementById("productModal").style.display = "none";
};

document.getElementById("saveProductBtn").onclick = async () => {
  const name = document.getElementById("editName").value;
  const price = parseFloat(document.getElementById("editPrice").value);
  const description = document.getElementById("editDescription").value;
  const profit = parseFloat(document.getElementById("editProfit").value);
  const enabled = document.getElementById("productEnabledCheckbox")?.checked ?? true;
  const manual_only = document.getElementById("productManualOnlyCheckbox")?.checked ?? false;

  if (!name || isNaN(price) || !description || isNaN(profit)) {
    return alert("❌ 请填写完整且合法的产品信息！");
  }

  if (editingProductId) {
    const { error } = await supabaseClient
      .from("products")
      .update({ name, price, description, profit, enabled, manual_only })
      .eq("id", editingProductId);
    if (error) return alert("❌ 更新产品失败: " + error.message);
    alert("✅ 产品更新成功!");
  } else {
    const { error } = await supabaseClient
      .from("products")
      .insert([{ name, price, description, profit, enabled, manual_only }]);
    if (error) return alert("❌ 添加产品失败: " + error.message);
    alert("✅ 产品添加成功!");
  }

  document.getElementById("productModal").style.display = "none";
  loadProducts();
};

// ======================
// 删除产品
// ======================
async function deleteProduct(id) {
  if (!confirm(`⚠️ 确定删除产品 #${id} 吗？`)) return;
  const { error } = await supabaseClient.from("products").delete().eq("id", id);
  if (error) return alert("❌ 删除产品失败: " + error.message);
  alert("✅ 产品删除成功!");
  loadProducts();
}

// ======================
// 切换开关
// ======================
async function toggleEnabled(id, current) {
  const { error } = await supabaseClient
    .from("products")
    .update({ enabled: !current })
    .eq("id", id);
  if (error) return alert("❌ 操作失败: " + error.message);
  loadProducts();
}

async function toggleManualOnly(id, current) {
  const { error } = await supabaseClient
    .from("products")
    .update({ manual_only: !current })
    .eq("id", id);
  if (error) return alert("❌ 操作失败: " + error.message);
  loadProducts();
}

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
