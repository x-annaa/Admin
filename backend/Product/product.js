// Product/product.js

document.addEventListener("DOMContentLoaded", () => {
  const productsTableBody = document.querySelector("#productsTable tbody");
  const addProductBtn = document.getElementById("addProductBtn");
  const editProductModal = document.getElementById("editProductModal");
  const closeEditProductModal = document.getElementById("closeEditProductModal");
  const saveProductBtn = document.getElementById("saveProductBtn");

  const editProductId = document.getElementById("editProductId");
  const editProductName = document.getElementById("editProductName");
  const editProductPrice = document.getElementById("editProductPrice");
  const editProductDescription = document.getElementById("editProductDescription");
  const editProductProfit = document.getElementById("editProductProfit");
  const editProductEnabled = document.getElementById("editProductEnabled");
  const editProductManualOnly = document.getElementById("editProductManualOnly");
  const editProductUrl = document.getElementById("editProductUrl");
  const searchProductInput = document.getElementById("searchProductInput");

  let products = []; // 本地产品列表
  let editingProduct = null; // 当前编辑产品

  // ========================
  // 渲染产品列表
  // ========================
  function renderProducts(filter = "") {
    productsTableBody.innerHTML = "";
    const filtered = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
    filtered.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.price.toFixed(2)}</td>
        <td>${p.description}</td>
        <td>${p.profit.toFixed(2)}</td>
        <td>${p.enabled ? "✅" : "❌"}</td>
        <td>${p.manualOnly ? "✅" : "❌"}</td>
        <td>${p.url}</td>
        <td>
          <button class="edit-btn">编辑</button>
          <button class="delete-btn">删除</button>
        </td>
      `;
      // 编辑按钮
      tr.querySelector(".edit-btn").addEventListener("click", () => openEditProduct(p));
      // 删除按钮
      tr.querySelector(".delete-btn").addEventListener("click", () => deleteProduct(p.id));
      productsTableBody.appendChild(tr);
    });
  }

  // ========================
  // 添加新产品
  // ========================
  addProductBtn.addEventListener("click", () => {
    editingProduct = null;
    editProductId.value = "";
    editProductName.value = "";
    editProductPrice.value = "";
    editProductDescription.value = "";
    editProductProfit.value = "";
    editProductEnabled.checked = true;
    editProductManualOnly.checked = false;
    editProductUrl.value = "";
    editProductModal.style.display = "flex";
  });

  // ========================
  // 关闭编辑弹窗
  // ========================
  closeEditProductModal.addEventListener("click", () => {
    editProductModal.style.display = "none";
  });

  // ========================
  // 打开编辑弹窗
  // ========================
  function openEditProduct(product) {
    editingProduct = product;
    editProductId.value = product.id;
    editProductName.value = product.name;
    editProductPrice.value = product.price;
    editProductDescription.value = product.description;
    editProductProfit.value = product.profit;
    editProductEnabled.checked = product.enabled;
    editProductManualOnly.checked = product.manualOnly;
    editProductUrl.value = product.url;
    editProductModal.style.display = "flex";
  }

  // ========================
  // 保存产品
  // ========================
  saveProductBtn.addEventListener("click", () => {
    const name = editProductName.value.trim();
    const price = parseFloat(editProductPrice.value) || 0;
    const description = editProductDescription.value.trim();
    const profit = parseFloat(editProductProfit.value) || 0;
    const enabled = editProductEnabled.checked;
    const manualOnly = editProductManualOnly.checked;
    const url = editProductUrl.value.trim();

    if (!name) {
      alert("请输入产品名称");
      return;
    }

    if (editingProduct) {
      // 编辑已有产品
      editingProduct.name = name;
      editingProduct.price = price;
      editingProduct.description = description;
      editingProduct.profit = profit;
      editingProduct.enabled = enabled;
      editingProduct.manualOnly = manualOnly;
      editingProduct.url = url;
    } else {
      // 新增产品
      const newProduct = {
        id: products.length ? Math.max(...products.map(p => p.id)) + 1 : 1,
        name, price, description, profit, enabled, manualOnly, url
      };
      products.push(newProduct);
    }

    renderProducts(searchProductInput.value);
    editProductModal.style.display = "none";
  });

  // ========================
  // 删除产品
  // ========================
  function deleteProduct(id) {
    if (confirm("确定删除该产品吗？")) {
      products = products.filter(p => p.id !== id);
      renderProducts(searchProductInput.value);
    }
  }

  // ========================
  // 搜索产品
  // ========================
  searchProductInput.addEventListener("input", () => {
    renderProducts(searchProductInput.value);
  });

  // ========================
  // 初始化测试数据
  // ========================
  products = [
    {id:1,name:"产品A",price:10.5,description:"描述A",profit:2,enabled:true,manualOnly:false,url:"http://example.com/a"},
    {id:2,name:"产品B",price:20,description:"描述B",profit:5,enabled:false,manualOnly:true,url:"http://example.com/b"},
    {id:3,name:"产品C",price:15,description:"描述C",profit:3,enabled:true,manualOnly:false,url:"http://example.com/c"}
  ];

  renderProducts();
});
