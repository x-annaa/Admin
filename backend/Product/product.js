// product.js

// ======================
// DOM 元素
// ======================
const productsTableBody = document.querySelector("#productsTable tbody");
const searchInput = document.getElementById("searchProductInput");
const addProductBtn = document.getElementById("addProductBtn");
const editProductModal = document.getElementById("editProductModal");
const editProductIdInput = document.getElementById("editProductId");
const editProductName = document.getElementById("editProductName");
const editProductPrice = document.getElementById("editProductPrice");
const editProductDescription = document.getElementById("editProductDescription");
const editProductProfit = document.getElementById("editProductProfit");
const editProductEnabled = document.getElementById("editProductEnabled");
const editProductManualOnly = document.getElementById("editProductManualOnly");
const editProductUrl = document.getElementById("editProductUrl");
const saveProductBtn = document.getElementById("saveProductBtn");
const closeEditProductModal = document.getElementById("closeEditProductModal");

// ======================
// 加载产品列表
// ======================
async function loadProducts() {
  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    renderProducts(data);
  } catch (e) {
    console.error("加载产品失败:", e);
    alert("❌ 加载产品失败: " + e.message);
  }
}

// ======================
// 渲染产品表格
// ======================
function renderProducts(products) {
  productsTableBody.innerHTML = "";
  products.forEach(product => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>${product.price}</td>
      <td class="text-overflow" title="${product.description}">${product.description}</td>
      <td>${product.profit}</td>
      <td>${product.enabled ? "✔" : "✖"}</td>
      <td>${product.manual_only ? "✔" : "✖"}</td>
      <td class="text-overflow" title="${product.url}">${product.url}</td>
      <td>
        <button class="edit-btn" data-id="${product.id}">编辑</button>
        <button class="delete-btn" data-id="${product.id}">删除</button>
      </td>
    `;
    productsTableBody.appendChild(tr);
  });

  // 绑定编辑按钮
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.id));
  });

  // 绑定删除按钮
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
  });
}

// ======================
// 搜索产品
// ======================
function searchProducts() {
  const keyword = searchInput.value.toLowerCase();
  document.querySelectorAll("#productsTable tbody tr").forEach(tr => {
    const name = tr.children[1].textContent.toLowerCase();
    tr.style.display = name.includes(keyword) ? "" : "none";
  });
}

// ======================
// 打开编辑弹窗
// ======================
async function openEditModal(id) {
  if (!id) return addNewProduct();

  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    editProductIdInput.value = data.id;
    editProductName.value = data.name;
    editProductPrice.value = data.price;
    editProductDescription.value = data.description;
    editProductProfit.value = data.profit;
    editProductEnabled.checked = data.enabled;
    editProductManualOnly.checked = data.manual_only;
    editProductUrl.value = data.url;

    editProductModal.style.display = "flex";
  } catch (e) {
    console.error("加载产品失败:", e);
    alert("❌ 加载产品失败: " + e.message);
  }
}

// ======================
// 保存产品
// ======================
async function saveProduct() {
  const id = editProductIdInput.value;
  const updates = {
    name: editProductName.value,
    price: parseFloat(editProductPrice.value),
    description: editProductDescription.value,
    profit: parseFloat(editProductProfit.value),
    enabled: editProductEnabled.checked,
    manual_only: editProductManualOnly.checked,
    url: editProductUrl.value
  };

  try {
    let res;
    if (id) {
      res = await supabaseClient.from("products").update(updates).eq("id", id);
    } else {
      res = await supabaseClient.from("products").insert(updates);
    }

    if (res.error) throw res.error;

    editProductModal.style.display = "none";
    loadProducts();
  } catch (e) {
    console.error("保存失败:", e);
    alert("❌ 保存失败: " + e.message);
  }
}

// ======================
// 删除产品
// ======================
async function deleteProduct(id) {
  if (!confirm("确定删除该产品吗？")) return;

  try {
    const { error } = await supabaseClient.from("products").delete().eq("id", id);
    if (error) throw error;
    loadProducts();
  } catch (e) {
    console.error("删除失败:", e);
    alert("❌ 删除失败: " + e.message);
  }
}

// ======================
// 新增产品
// ======================
function addNewProduct() {
  editProductIdInput.value = "";
  editProductName.value = "";
  editProductPrice.value = "";
  editProductDescription.value = "";
  editProductProfit.value = "";
  editProductEnabled.checked = false;
  editProductManualOnly.checked = false;
  editProductUrl.value = "";
  editProductModal.style.display = "flex";
}

// ======================
// 事件绑定
// ======================
closeEditProductModal.addEventListener("click", () => {
  editProductModal.style.display = "none";
});

addProductBtn.addEventListener("click", addNewProduct);
saveProductBtn.addEventListener("click", saveProduct);
searchInput.addEventListener("keyup", searchProducts);

// ======================
// 页面加载
// ======================
document.addEventListener("DOMContentLoaded", loadProducts);
