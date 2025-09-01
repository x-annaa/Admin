// ⚡ 初始化 Supabase
const SUPABASE_URL = "https://ffdrwsemmfvqlqhyjlnb.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHJ3c2VtbWZ2cWxxaHlqbG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDI1ODQsImV4cCI6MjA3MTg3ODU4NH0.x7TQHZ2af8O_f9ye__mT6eVstlH9BiyVkNVaOnL3h74";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 🔐 管理员密码
const ADMIN_PASSWORD = "123";

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
    .select("id, username, password, coins, platform_account, traffic, created_at")
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
      <td style="color:${user.coins < 0 ? "red" : "black"}">${user.coins ?? 0}</td>
      <td>${user.traffic ?? 0}</td>
      <td>${new Date(user.created_at).toLocaleString()}</td>
      <td class="action-btns">
        <button onclick="updateCoins(${user.id}, 'add')">➕ Add</button>
        <button onclick="updateCoins(${user.id}, 'sub')">➖ Sub</button>
        <button onclick="deleteUser(${user.id})">🗑 Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ======================
// 修改 Coins
// ======================
async function updateCoins(userId, action) {
  let amount = prompt(`Enter amount to ${action === "add" ? "add" : "subtract"}:`);
  if (!amount || isNaN(amount)) return;
  amount = parseFloat(amount);

  const { data: user } = await supabaseClient
    .from("users")
    .select("coins")
    .eq("id", userId)
    .single();
  if (!user) return alert("User not found");

  let newCoins = action === "add" ? user.coins + amount : user.coins - amount;

  const { error } = await supabaseClient
    .from("users")
    .update({ coins: newCoins })
    .eq("id", userId);

  if (error) {
    alert("❌ Error updating coins: " + error.message);
  } else {
    alert(`✅ Coins updated! New coins = ${newCoins}`);
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
      </td>
    `;
    tbody.appendChild(tr);
  });
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
            <th>Coins</th>
            <th>Traffic</th>
            <th>Register Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    loadUsers();

  } else if (page === "stats") {
    content.innerHTML = `
      <h2>Products Management</h2>
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
