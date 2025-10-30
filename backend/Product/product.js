// product.js

const ProductModule = {}; // ✅ 添加命名空间

// 读取并渲染产品列表
ProductModule.loadProducts = async function() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("加载产品失败:", error);
    return;
  }

  ProductModule.renderProducts(data);
};

// 渲染产品表格
ProductModule.renderProducts = function(products) {
  const productsTableBody = document.querySelector("#productsTable tbody");
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

  // ✅ 绑定事件时也用 ProductModule 前缀
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => ProductModule.openEditModal(btn.dataset.id));
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => ProductModule.deleteProduct(btn.dataset.id));
  });
};

// 搜索产品
ProductModule.searchProducts = function() {
  const keyword = document.getElementById("searchProductInput").value.toLowerCase();
  document.querySelectorAll("#productsTable tbody tr").forEach(tr => {
    const name = tr.children[1].textContent.toLowerCase();
    tr.style.display = name.includes(keyword) ? "" : "none";
  });
};

// 打开编辑弹窗
ProductModule.openEditModal = async function(id) {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("加载产品失败:", error);
    return;
  }

  document.getElementById("editProductId").value = data.id;
  document.getElementById("editProductName").value = data.name;
  document.getElementById("editProductPrice").value = data.price;
  document.getElementById("editProductDescription").value = data.description;
  document.getElementById("editProductProfit").value = data.profit;
  document.getElementById("editProductEnabled").checked = data.enabled;
  document.getElementById("editProductManualOnly").checked = data.manual_only;
  document.getElementById("editProductUrl").value = data.url;

  document.getElementById("editProductModal").style.display = "flex";
};

// 保存产品
ProductModule.saveProduct = async function() {
  const id = document.getElementById("editProductId").value;
  const updates = {
    name: document.getElementById("editProductName").value,
    price: parseFloat(document.getElementById("editProductPrice").value),
    description: document.getElementById("editProductDescription").value,
    profit: parseFloat(document.getElementById("editProductProfit").value),
    enabled: document.getElementById("editProductEnabled").checked,
    manual_only: document.getElementById("editProductManualOnly").checked,
    url: document.getElementById("editProductUrl").value
  };

  let res;
  if (id) {
    res = await supabaseClient.from("products").update(updates).eq("id", id);
  } else {
    res = await supabaseClient.from("products").insert(updates);
  }

  if (res.error) {
    console.error("保存失败:", res.error);
    return;
  }

  document.getElementById("editProductModal").style.display = "none";
  ProductModule.loadProducts();
};

// 删除产品
ProductModule.deleteProduct = async function(id) {
  if (!confirm("确定删除该产品吗？")) return;
  const { error } = await supabaseClient.from("products").delete().eq("id", id);
  if (error) {
    console.error("删除失败:", error);
    return;
  }
  ProductModule.loadProducts();
};

// 添加新产品
ProductModule.addNewProduct = function() {
  document.getElementById("editProductId").value = "";
  document.getElementById("editProductName").value = "";
  document.getElementById("editProductPrice").value = "";
  document.getElementById("editProductDescription").value = "";
  document.getElementById("editProductProfit").value = "";
  document.getElementById("editProductEnabled").checked = false;
  document.getElementById("editProductManualOnly").checked = false;
  document.getElementById("editProductUrl").value = "";
  document.getElementById("editProductModal").style.display = "flex";
};

// 关闭弹窗
document.getElementById("closeEditProductModal").addEventListener("click", () => {
  document.getElementById("editProductModal").style.display = "none";
});

// ✅ 初始化绑定事件
document.getElementById("addProductBtn").addEventListener("click", ProductModule.addNewProduct);
document.getElementById("saveProductBtn").addEventListener("click", ProductModule.saveProduct);
document.getElementById("searchProductInput").addEventListener("keyup", ProductModule.searchProducts);

// ✅ 页面加载时执行
ProductModule.loadProducts();
