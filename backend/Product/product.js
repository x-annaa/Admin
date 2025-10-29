// Product/product.js

// DOM 元素
const productsTableBody = document.querySelector("#productsTable tbody");
const searchInput = document.querySelector("#searchProductInput");
const addProductBtn = document.querySelector("#addProductBtn");

// 编辑弹窗
const editModal = document.getElementById("editProductModal");
const editProductId = document.getElementById("editProductId");
const editProductName = document.getElementById("editProductName");
const editProductPrice = document.getElementById("editProductPrice");
const editProductDescription = document.getElementById("editProductDescription");
const editProductProfit = document.getElementById("editProductProfit");
const editProductEnabled = document.getElementById("editProductEnabled");
const editProductManualOnly = document.getElementById("editProductManualOnly");
const editProductUrl = document.getElementById("editProductUrl");
const saveProductBtn = document.getElementById("saveProductBtn");
const closeEditProductModal = document.getElementById("closeEditProductModal");

// =====================
// 获取并显示产品
// =====================
async function loadProducts() {
  const { data, error } = await supabaseClient.from("products").select("*").order("id", { ascending: true });
  if (error) {
    console.error("获取产品失败:", error);
    return;
  }

  productsTableBody.innerHTML = "";

  data.forEach(product => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>${product.price}</td>
      <td>${product.description}</td>
      <td>${product.profit}</td>
      <td>${product.enabled ? "✅" : "❌"}</td>
      <td>${product.manual_only ? "✅" : "❌"}</td>
      <td>${product.url || ""}</td>
      <td>
        <button class="edit-btn" data-id="${product.id}">编辑</button>
        <button class="delete-btn" data-id="${product.id}">删除</button>
      </td>
    `;
    productsTableBody.appendChild(tr);
  });
}

// =====================
// 搜索产品
// =====================
function searchProducts() {
  const keyword = searchInput.value.toLowerCase();
  const rows = productsTableBody.querySelectorAll("tr");
  rows.forEach(row => {
    const name = row.cells[1].textContent.toLowerCase();
    row.style.display = name.includes(keyword) ? "" : "none";
  });
}

// =====================
// 编辑产品弹窗
// =====================
productsTableBody.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains("edit-btn")) {
    // 获取产品信息
    const { data, error } = await supabaseClient.from("products").select("*").eq("id", id).single();
    if (error) {
      console.error("获取产品失败:", error);
      return;
    }

    // 填充弹窗
    editProductId.value = data.id;
    editProductName.value = data.name;
    editProductPrice.value = data.price;
    editProductDescription.value = data.description;
    editProductProfit.value = data.profit;
    editProductEnabled.checked = data.enabled;
    editProductManualOnly.checked = data.manual_only;
    editProductUrl.value = data.url || "";

    // 显示弹窗
    editModal.style.display = "block";
  }

  // 删除产品
  if (e.target.classList.contains("delete-btn")) {
    if (confirm("确认删除该产品吗？")) {
      const { error } = await supabaseClient.from("products").delete().eq("id", id);
      if (error) {
        console.error("删除失败:", error);
      } else {
        loadProducts();
      }
    }
  }
});

// =====================
// 保存产品
// =====================
saveProductBtn.addEventListener("click", async () => {
  const id = editProductId.value;
  const payload = {
    name: editProductName.value,
    price: parseFloat(editProductPrice.value),
    description: editProductDescription.value,
    profit: parseFloat(editProductProfit.value),
    enabled: editProductEnabled.checked,
    manual_only: editProductManualOnly.checked,
    url: editProductUrl.value
  };

  if (id) {
    // 更新
    const { error } = await supabaseClient.from("products").update(payload).eq("id", id);
    if (error) {
      console.error("更新失败:", error);
      return;
    }
  } else {
    // 新增
    const { error } = await supabaseClient.from("products").insert([payload]);
    if (error) {
      console.error("添加失败:", error);
      return;
    }
  }

  editModal.style.display = "none";
  loadProducts();
});

// 关闭弹窗
closeEditProductModal.addEventListener("click", () => {
  editModal.style.display = "none";
});

// =====================
// 添加新产品
// =====================
addProductBtn.addEventListener("click", () => {
  editProductId.value = "";
  editProductName.value = "";
  editProductPrice.value = "";
  editProductDescription.value = "";
  editProductProfit.value = "";
  editProductEnabled.checked = true;
  editProductManualOnly.checked = false;
  editProductUrl.value = "";
  editModal.style.display = "block";
});

// =====================
// 初始化
// =====================
loadProducts();
