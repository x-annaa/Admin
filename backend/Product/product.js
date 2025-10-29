let currentEditProductId = null;

// ======================
// 加载产品列表
// ======================
async function loadProducts() {
  try {
    const { data: products, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("id", { ascending: true });
    if (error) throw error;

    const tbody = document.querySelector("#productsTable tbody");
    tbody.innerHTML = "";

    products.forEach(product => {
      const tr = document.createElement("tr");
      tr.dataset.productId = product.id;
      tr.innerHTML = `
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td>${product.price ?? 0}</td>
        <td>${product.stock ?? 0}</td>
        <td>${product.category || "-"}</td>
        <td>
          <button onclick="openEditProductModal(${product.id}, '${product.name}', ${product.price ?? 0}, ${product.stock ?? 0}, '${product.category || ""}')">编辑</button>
          <button onclick="deleteProductPrompt(${product.id})">删除</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error("加载产品失败:", e);
    alert("❌ 加载产品失败: " + e.message);
  }
}

// ======================
// 打开编辑/新增产品弹窗
// ======================
function openEditProductModal(id = null, name = "", price = 0, stock = 0, category = "") {
  currentEditProductId = id;
  document.getElementById("productModalTitle").textContent = id ? "编辑产品" : "新增产品";
  document.getElementById("productName").value = name;
  document.getElementById("productPrice").value = price;
  document.getElementById("productStock").value = stock;
  document.getElementById("productCategory").value = category;
  document.getElementById("productModal").style.display = "flex";
}

// ======================
// 保存产品
// ======================
async function saveProduct() {
  const name = document.getElementById("productName").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const stock = parseInt(document.getElementById("productStock").value);
  const category = document.getElementById("productCategory").value.trim();

  if (!name) return alert("请输入产品名称");
  if (isNaN(price) || isNaN(stock)) return alert("请输入正确的价格和库存");

  try {
    if (currentEditProductId) {
      // 编辑产品
      const { error } = await supabaseClient
        .from("products")
        .update({ name, price, stock, category })
        .eq("id", currentEditProductId);
      if (error) throw error;
      alert("✅ 产品已更新");
    } else {
      // 新增产品
      const { error } = await supabaseClient
        .from("products")
        .insert({ name, price, stock, category });
      if (error) throw error;
      alert("✅ 产品已新增");
    }
    document.getElementById("productModal").style.display = "none";
    loadProducts();
  } catch (e) {
    alert("❌ 保存产品失败: " + e.message);
  }
}

// ======================
// 删除产品
// ======================
function deleteProductPrompt(productId) {
  if (!confirm(`⚠️ 确定删除产品 #${productId} 吗？`)) return;

  supabaseClient.from("products").delete().eq("id", productId).then(({ error }) => {
    if (error) return alert("❌ 删除产品失败: " + error.message);
    loadProducts();
  });
}

// ======================
// 搜索产品
// ======================
function searchProducts() {
  const filter = document.getElementById("searchProductInput").value.toLowerCase();
  document.querySelectorAll("#productsTable tbody tr").forEach(row => {
    const name = row.cells[1].textContent.toLowerCase();
    row.style.display = name.includes(filter) ? "" : "none";
  });
}

// ======================
// 关闭弹窗
// ======================
document.getElementById("closeProductModal").addEventListener("click", () => {
  document.getElementById("productModal").style.display = "none";
});

// ======================
// 弹窗按钮绑定
// ======================
document.getElementById("saveProductBtn").addEventListener("click", saveProduct);
document.getElementById("addProductBtn").addEventListener("click", () => openEditProductModal());

// ======================
// 页面加载
// ======================
document.addEventListener("DOMContentLoaded", loadProducts);
document.getElementById("searchProductInput").addEventListener("input", searchProducts);
