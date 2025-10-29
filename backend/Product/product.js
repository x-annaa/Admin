// product.js

// DOM 元素
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

// 读取并渲染产品列表
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("加载产品失败:", error);
    return;
  }

  renderProducts(data);
}

// 渲染产品表格
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

  // 绑定编辑删除事件
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.id));
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
  });
}

// 搜索产品
function searchProducts() {
  const keyword = searchInput.value.toLowerCase();
  document.querySelectorAll("#productsTable tbody tr").forEach(tr => {
    const name = tr.children[1].textContent.toLowerCase();
    tr.style.display = name.includes(keyword) ? "" : "none";
  });
}

// 打开编辑弹窗
async function openEditModal(id) {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("加载产品失败:", error);
    return;
  }

  editProductIdInput.value = data.id;
  editProductName.value = data.name;
  editProductPrice.value = data.price;
  editProductDescription.value = data.description;
  editProductProfit.value = data.profit;
  editProductEnabled.checked = data.enabled;
  editProductManualOnly.checked = data.manual_only;
  editProductUrl.value = data.url;

  editProductModal.style.display = "flex";
}

// 保存产品
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

  let res;
  if (id) {
    // 更新
    res = await supabaseClient.from("products").update(updates).eq("id", id);
  } else {
    // 新增
    res = await supabaseClient.from("products").insert(updates);
  }

  if (res.error) {
    console.error("保存失败:", res.error);
    return;
  }

  editProductModal.style.display = "none";
  loadProducts();
}

// 删除产品
async function deleteProduct(id) {
  if (!confirm("确定删除该产品吗？")) return;
  const { error } = await supabaseClient.from("products").delete().eq("id", id);
  if (error) {
    console.error("删除失败:", error);
    return;
  }
  loadProducts();
}

// 添加新产品
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

// 关闭弹窗
closeEditProductModal.addEventListener("click", () => {
  editProductModal.style.display = "none";
});

addProductBtn.addEventListener("click", addNewProduct);
saveProductBtn.addEventListener("click", saveProduct);
searchInput.addEventListener("keyup", searchProducts);

// 初始加载
loadProducts();
