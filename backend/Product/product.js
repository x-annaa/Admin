// ⚡ 初始化 Supabase（假设已经在 supabaseClient.js 中引入）
const supabase = supabaseClient;

// DOM 元素
const productsTableBody = document.querySelector("#productsTable tbody");
const addProductBtn = document.getElementById("addProductBtn");
const editProductModal = document.getElementById("editProductModal");
const saveProductBtn = document.getElementById("saveProductBtn");
const closeEditProductModal = document.getElementById("closeEditProductModal");

const editProductId = document.getElementById("editProductId");
const editProductName = document.getElementById("editProductName");
const editProductPrice = document.getElementById("editProductPrice");
const editProductDescription = document.getElementById("editProductDescription");
const editProductProfit = document.getElementById("editProductProfit");
const editProductEnabled = document.getElementById("editProductEnabled");
const editProductManualOnly = document.getElementById("editProductManualOnly");
const editProductUrl = document.getElementById("editProductUrl");

const searchProductInput = document.getElementById("searchProductInput");

// ========== 获取并渲染产品 ==========
async function loadProducts() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  renderProducts(products);
}

function renderProducts(products) {
  productsTableBody.innerHTML = "";

  products.forEach(product => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>${product.price}</td>
      <td class="description" title="${product.description}">${product.description}</td>
      <td>${product.profit}</td>
      <td>${product.enabled ? "✅" : "❌"}</td>
      <td>${product.manual_only ? "✅" : "❌"}</td>
      <td class="url" title="${product.url}">${product.url}</td>
      <td>
        <button class="editBtn" data-id="${product.id}">编辑</button>
        <button class="deleteBtn" data-id="${product.id}">删除</button>
      </td>
    `;
    productsTableBody.appendChild(tr);
  });

  // 绑定编辑删除事件
  document.querySelectorAll(".editBtn").forEach(btn => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.id));
  });

  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
  });
}

// ========== 搜索功能 ==========
function searchProducts() {
  const query = searchProductInput.value.toLowerCase();
  document.querySelectorAll("#productsTable tbody tr").forEach(row => {
    const name = row.children[1].textContent.toLowerCase();
    row.style.display = name.includes(query) ? "" : "none";
  });
}

// ========== 编辑产品 ==========
async function openEditModal(id) {
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) return;

  editProductId.value = product.id;
  editProductName.value = product.name;
  editProductPrice.value = product.price;
  editProductDescription.value = product.description;
  editProductProfit.value = product.profit;
  editProductEnabled.checked = product.enabled;
  editProductManualOnly.checked = product.manual_only;
  editProductUrl.value = product.url;

  editProductModal.style.display = "flex";
}

// ========== 保存产品 ==========
saveProductBtn.addEventListener("click", async () => {
  const id = editProductId.value;

  const updates = {
    name: editProductName.value,
    price: parseFloat(editProductPrice.value),
    description: editProductDescription.value,
    profit: parseFloat(editProductProfit.value),
    enabled: editProductEnabled.checked,
    manual_only: editProductManualOnly.checked,
    url: editProductUrl.value,
  };

  const { error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id);

  if (error) {
    alert("保存失败: " + error.message);
    return;
  }

  editProductModal.style.display = "none";
  loadProducts();
});

// ========== 关闭编辑弹窗 ==========
closeEditProductModal.addEventListener("click", () => {
  editProductModal.style.display = "none";
});

// ========== 添加新产品 ==========
addProductBtn.addEventListener("click", async () => {
  const { data, error } = await supabase.from("products").insert([
    {
      name: "新产品",
      price: 0,
      description: "",
      profit: 0,
      enabled: true,
      manual_only: false,
      url: "",
    },
  ]);

  if (error) {
    alert("添加失败: " + error.message);
    return;
  }

  loadProducts();
});

// ========== 删除产品 ==========
async function deleteProduct(id) {
  if (!confirm("确定删除该产品吗？")) return;

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    alert("删除失败: " + error.message);
    return;
  }

  loadProducts();
}

// ========== 初始化 ==========
loadProducts();
searchProductInput.addEventListener("input", searchProducts);
