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
