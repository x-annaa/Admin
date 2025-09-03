let editingProductId = null;

// 打开编辑弹窗
function openProductModal(id = null, name = "", price = 0, description = "", profit = 0) {
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

// 保存修改/添加
document.getElementById("saveProductBtn").onclick = async () => {
  const name = document.getElementById("editName").value;
  const price = parseFloat(document.getElementById("editPrice").value);
  const description = document.getElementById("editDescription").value;
  const profit = parseFloat(document.getElementById("editProfit").value);

  if (!name || isNaN(price) || !description || isNaN(profit)) {
    return alert("❌ 请填写完整且合法的产品信息！");
  }

  if (editingProductId) {
    // 编辑产品
    const { error } = await supabaseClient
      .from("products")
      .update({ name, price, description, profit })
      .eq("id", editingProductId);

    if (error) return alert("❌ 更新产品失败: " + error.message);
    alert("✅ 产品更新成功!");
  } else {
    // 添加产品
    const { error } = await supabaseClient
      .from("products")
      .insert([{ name, price, description, profit }]);

    if (error) return alert("❌ 添加产品失败: " + error.message);
    alert("✅ 产品添加成功!");
  }

  document.getElementById("productModal").style.display = "none";
  loadProducts();
};

// 点击添加产品按钮
document.getElementById("addProductBtn").onclick = () => {
  openProductModal(); // 不传 id，即添加模式
};

// 页面加载时执行
document.addEventListener("DOMContentLoaded", loadProducts);
