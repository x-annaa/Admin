import { supabase } from '../User/supabaseClient.js';

const productsTableBody = document.querySelector("#productsTable tbody");
const searchInput = document.getElementById("searchProductInput");

// 打开/关闭弹窗
const editModal = document.getElementById("editProductModal");
const closeEditBtn = document.getElementById("closeEditProductModal");

closeEditBtn.onclick = () => editModal.style.display = "none";

// 加载所有产品
async function loadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true });

  if (error) return console.error(error);

  productsTableBody.innerHTML = "";
  data.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.price}</td>
      <td>${p.description || ''}</td>
      <td>${p.profit}</td>
      <td>${p.enabled}</td>
      <td>${p.manual_only}</td>
      <td><a href="${p.url}" target="_blank">链接</a></td>
      <td>
        <button onclick="editProduct(${p.id})">✏️</button>
        <button onclick="deleteProduct(${p.id})">🗑</button>
      </td>
    `;
    productsTableBody.appendChild(row);
  });
}

// 搜索功能
function searchProducts() {
  const query = searchInput.value.toLowerCase();
  document.querySelectorAll("#productsTable tbody tr").forEach(tr => {
    const name = tr.children[1].textContent.toLowerCase();
    tr.style.display = name.includes(query) ? "" : "none";
  });
}

// 编辑产品
async function editProduct(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return console.error(error);

  document.getElementById("editProductId").value = data.id;
  document.getElementById("editProductName").value = data.name;
  document.getElementById("editProductPrice").value = data.price;
  document.getElementById("editProductDescription").value = data.description;
  document.getElementById("editProductProfit").value = data.profit;
  document.getElementById("editProductEnabled").checked = data.enabled;
  document.getElementById("editProductManualOnly").checked = data.manual_only;
  document.getElementById("editProductUrl").value = data.url;

  editModal.style.display = "flex";
}

// 保存修改
document.getElementById("saveProductBtn").onclick = async () => {
  const id = document.getElementById("editProductId").value;
  const updates = {
    name: document.getElementById("editProductName").value,
    price: parseFloat(document.getElementById("editProductPrice").value),
    description: document.getElementById("editProductDescription").value,
    profit: parseFloat(document.getElementById("editProductProfit").value),
    enabled: document.getElementById("editProductEnabled").checked,
    manual_only: document.getElementById("editProductManualOnly").checked,
    url: document.getElementById("editProductUrl").value,
  };

  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id);

  if (error) return console.error(error);

  editModal.style.display = "none";
  loadProducts();
};

// 删除产品
async function deleteProduct(id) {
  if (!confirm("确定删除该产品吗？")) return;
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) return console.error(error);
  loadProducts();
};

// 添加新产品
document.getElementById("addProductBtn").onclick = async () => {
  const name = prompt("输入产品名称:");
  if (!name) return;
  const { error } = await supabase
    .from('products')
    .insert([{ name, price: 0, profit: 0, enabled: true, manual_only: false }]);
  if (error) return console.error(error);
  loadProducts();
};

// 页面加载时获取产品
loadProducts();
