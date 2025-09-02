// 🔐 管理员密码 // 1
const ADMIN_PASSWORD = "1";

function checkAdmin() {
  const input = document.getElementById("adminPassword").value;
  if (input === ADMIN_PASSWORD) {
    // ✅ 跳转到 USER/home.html // 2
    window.location.href = "USER/home.html";
  } else {
    alert("❌ Wrong password!");
  }
}

// 管理员登录验证 // 3
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
