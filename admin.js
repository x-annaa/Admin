// ⚡ 初始化 Supabase
const SUPABASE_URL = "https://ffdrwsemmfvqlqhyjlnb.supabase.co";
const SUPABASE_KEY = "你的-supabase-key";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 🔐 管理员密码
const ADMIN_PASSWORD = "1";

// ======================
// 管理员登录验证
// ======================
function checkAdmin() {
  const input = document.getElementById("adminPassword").value;
  if (input === ADMIN_PASSWORD) {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("adminSection").style.display = "block";
    document.getElementById("bottomNav").style.display = "flex"; 
    switchPage("users");
  } else {
    alert("❌ Wrong password!");
  }
}

// ======================
// 加载用户数据
// ======================
async function loadUsers() {
  const { data, error } = await supabaseClient
    .from("users")
    .select("id, username, password, balance, platform_account, created_at")
    .order("id", { ascending: true });

  if (error) {
    alert("Error loading users: " + error.message);
    return;
  }

  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML = "";

  data.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.password || "-"}</td>
      <td>${user.platform_account || "-"}</td>
      <td style="color:${user.balance < 0 ? "red" : "black"}">${user.balance ?? 0}</td>
      <td>${new Date(user.created_at).toLocaleString()}</td>
      <td class="action-btns">
        <button onclick="updateBalance(${user.id}, 'add')">➕ Add</button>
        <button onclick="updateBalance(${user.id}, 'sub')">➖ Sub</button>
        <button onclick="deleteUser(${user.id})">🗑 Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ======================
// 修改 Balance
// ======================
async function updateBalance(userId, action) {
  let amount = prompt(`Enter amount to ${action === "add" ? "add" : "subtract"}:`);
  if (!amount || isNaN(amount)) return;
  amount = parseFloat(amount);

  const { data: user } = await supabaseClient
    .from("users")
    .select("balance")
    .eq("id", userId)
    .single();
  if (!user) return alert("User not found");

  let newBalance = action === "add" ? user.balance + amount : user.balance - amount;

  const { error } = await supabaseClient
    .from("users")
    .update({ balance: newBalance })
    .eq("id", userId);

  if (error) {
    alert("❌ Error updating balance: " + error.message);
  } else {
    alert(`✅ Balance updated! New balance = ${newBalance}`);
    loadUsers();
  }
}

// ======================
// 删除用户
// ======================
async function deleteUser(userId) {
  if (!confirm("⚠️ Are you sure you want to delete user #" + userId + "?")) return;

  const { error } = await supabaseClient.from("users").delete().eq("id", userId);

  if (error) {
    alert("Error deleting user: " + error.message);
  } else {
    alert("✅ User deleted successfully!");
    loadUsers();
  }
}

// ======================
// 搜索用户
// ======================
function searchUsers() {
  const filter = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#usersTable tbody tr");

  rows.forEach((row) => {
    const username = row.cells[1].textContent.toLowerCase();
    row.style.display = username.includes(filter) ? "" : "none";
  });
}

// ======================
// 加载产品信息
// ======================
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("id, name, price, description, profit")
    .order("id", { ascending: true });

  if (error) {
    alert("Error loading products: " + error.message);
    return;
  }

  const tbody = document.querySelector("#productsTable tbody");
  tbody.innerHTML = "";

  data.forEach((product) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>${product.price}</td>
      <td>${product.description}</td>
      <td>${product.profit}</td>
      <td>
        <button onclick="editProduct(${product.id}, '${product.name}', ${product.price}, '${product.description}', ${product.profit})">✏ Edit</button>
        <button onclick="deleteProduct(${product.id})">🗑 Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ======================
// 新增产品
// ======================
async function addProduct() {
  const name = prompt("Enter product name:");
  if (!name) return;

  const price = prompt("Enter product price:");
  if (!price || isNaN(price)) return;

  const description = prompt("Enter product description:");
  const profit = prompt("Enter product profit:");
  if (!profit || isNaN(profit)) return;

  const { error } = await supabaseClient
    .from("products")
    .insert([{ name, price: parseFloat(price), description, profit: parseFloat(profit) }]);

  if (error) {
    alert("❌ Error adding product: " + error.message);
  } else {
    alert("✅ Product added successfully!");
    loadProducts();
  }
}

// ======================
// 编辑产品信息
// ======================
async function editProduct(id, name, price, description, profit) {
  const newName = prompt("Enter new name:", name);
  if (newName === null) return;

  const newPrice = prompt("Enter new price:", price);
  if (newPrice === null || isNaN(newPrice)) return;

  const newDesc = prompt("Enter new description:", description);
  if (newDesc === null) return;

  const newProfit = prompt("Enter new profit:", profit);
  if (newProfit === null || isNaN(newProfit)) return;

  const { error } = await supabaseClient
    .from("products")
    .update({
      name: newName,
      price: parseFloat(newPrice),
      description: newDesc,
      profit: parseFloat(newProfit),
    })
    .eq("id", id);

  if (error) {
    alert("❌ Error updating product: " + error.message);
  } else {
    alert("✅ Product updated successfully!");
    loadProducts();
  }
}

// ======================
// 删除产品
// ======================
async function deleteProduct(id) {
  if (!confirm("⚠️ Are you sure you want to delete this product?")) return;

  const { error } = await supabaseClient.from("products").delete().eq("id", id);

  if (error) {
    alert("❌ Error deleting product: " + error.message);
  } else {
    alert("✅ Product deleted successfully!");
    loadProducts();
  }
}

// ======================
// 页面切换
// ======================
function switchPage(page) {
  const content = document.getElementById("pageContent");

  if (page === "users") {
    content.innerHTML = `
      <h2>Users Management</h2>
      <input type="text" id="searchInput" placeholder="Search username..." onkeyup="searchUsers()">
      <table id="usersTable">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Password</th>
            <th>Platform Account</th>
            <th>Balance</th>
            <th>Register Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    loadUsers();

  } else if (page === "products") {
    content.innerHTML = `
      <h2>Products Management</h2>
      <button onclick="addProduct()">➕ Add Product</button>
      <table id="productsTable">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Description</th>
            <th>Profit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    loadProducts();

  } else {
    content.innerHTML = `<h2>${page.charAt(0).toUpperCase() + page.slice(1)} Page</h2><p>(空白页面)</p>`;
  }
}

function refreshPage() {
  location.reload();
}
