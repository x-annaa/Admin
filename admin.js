// 🔐 管理员密码
const ADMIN_PASSWORD = "1";

// 管理员登录验证
function checkAdmin() {
  const input = document.getElementById("adminPassword").value;
  if (input === ADMIN_PASSWORD) {
    // ✅ 跳转到 USER/home.html
    window.location.href = "USER/user.html";
  } else {
    alert("❌ Wrong password!");
  }
}
