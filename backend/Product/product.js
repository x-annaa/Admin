// 确保 script 标签 type="module" 引入

import { supabaseClient } from '../User/supabaseClient.js';

const productsTableBody = document.querySelector('#productsTable tbody');
const addProductBtn = document.getElementById('addProductBtn');
const editProductModal = document.getElementById('editProductModal');
const closeEditProductModalBtn = document.getElementById('closeEditProductModal');
const saveProductBtn = document.getElementById('saveProductBtn');

const editProductIdInput = document.getElementById('editProductId');
const editProductNameInput = document.getElementById('editProductName');
const editProductPriceInput = document.getElementById('editProductPrice');
const editProductDescriptionInput = document.getElementById('editProductDescription');
const editProductProfitInput = document.getElementById('editProductProfit');
const editProductEnabledInput = document.getElementById('editProductEnabled');
const editProductManualOnlyInput = document.getElementById('editProductManualOnly');
const editProductUrlInput = document.getElementById('editProductUrl');

// -----------------
// 获取产品列表
// -----------------
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  productsTableBody.innerHTML = '';
  data.forEach(product => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>${product.price}</td>
      <td class="description" title="${product.description || ''}">${product.description || ''}</td>
      <td>${product.profit}</td>
      <td>${product.enabled ? '✅' : '❌'}</td>
      <td>${product.manual_only ? '✅' : '❌'}</td>
      <td class="url" title="${product.url || ''}">${product.url || ''}</td>
      <td><button class="edit-btn" data-id="${product.id}">编辑</button></td>
    `;

    productsTableBody.appendChild(tr);
  });

  // 给每个编辑按钮添加事件
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
}

// -----------------
// 打开编辑弹窗
// -----------------
async function openEditModal(id) {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  editProductIdInput.value = data.id;
  editProductNameInput.value = data.name;
  editProductPriceInput.value = data.price;
  editProductDescriptionInput.value = data.description || '';
  editProductProfitInput.value = data.profit;
  editProductEnabledInput.checked = data.enabled;
  editProductManualOnlyInput.checked = data.manual_only;
  editProductUrlInput.value = data.url || '';

  editProductModal.style.display = 'flex';
}

// -----------------
// 保存产品
// -----------------
saveProductBtn.addEventListener('click', async () => {
  const id = editProductIdInput.value;
  const updates = {
    name: editProductNameInput.value,
    price: parseFloat(editProductPriceInput.value),
    description: editProductDescriptionInput.value,
    profit: parseFloat(editProductProfitInput.value),
    enabled: editProductEnabledInput.checked,
    manual_only: editProductManualOnlyInput.checked,
    url: editProductUrlInput.value
  };

  const { data, error } = await supabaseClient
    .from('products')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error(error);
    alert('更新失败');
    return;
  }

  editProductModal.style.display = 'none';
  loadProducts();
});

// -----------------
// 关闭弹窗
// -----------------
closeEditProductModalBtn.addEventListener('click', () => {
  editProductModal.style.display = 'none';
});

// -----------------
// 添加新产品
// -----------------
addProductBtn.addEventListener('click', async () => {
  const { data, error } = await supabaseClient
    .from('products')
    .insert([{ name: '新产品', price: 0, profit: 0, enabled: true, manual_only: false, description: '', url: '' }])
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  openEditModal(data.id);
});

// -----------------
// 搜索功能
// -----------------
window.searchProducts = async function () {
  const keyword = document.getElementById('searchProductInput').value;
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .ilike('name', `%${keyword}%`)
    .order('id', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  productsTableBody.innerHTML = '';
  data.forEach(product => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>${product.price}</td>
      <td class="description" title="${product.description || ''}">${product.description || ''}</td>
      <td>${product.profit}</td>
      <td>${product.enabled ? '✅' : '❌'}</td>
      <td>${product.manual_only ? '✅' : '❌'}</td>
      <td class="url" title="${product.url || ''}">${product.url || ''}</td>
      <td><button class="edit-btn" data-id="${product.id}">编辑</button></td>
    `;

    productsTableBody.appendChild(tr);
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
};

// -----------------
// 初始化加载
// -----------------
loadProducts();
