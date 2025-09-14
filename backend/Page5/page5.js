// DOM 元素
const chatUsersList = document.getElementById("chatUsersList");
const adminChatWindow = document.getElementById("adminChatWindow");
const adminChatUserInfo = document.getElementById("adminChatUserInfo");
const adminChatMessages = document.getElementById("adminChatMessages");
const adminChatInput = document.getElementById("adminChatInput");
const adminSendBtn = document.getElementById("adminSendBtn");
const adminBackBtn = document.getElementById("adminBackBtn");

let currentChatUser = null;
let chatSubscription = null;

// 获取所有有消息的用户
async function loadChatUsers() {
  const { data, error } = await supabaseClient
    .from("messages")
    .select(`sender_id, users(username)`)
    .eq("receiver_id", 1)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("加载用户列表失败:", error);
    return;
  }

  // 用 Map 去重用户
  const userMap = new Map();
  data.forEach(msg => {
    if (!userMap.has(msg.sender_id)) {
      userMap.set(msg.sender_id, msg.users.username);
    }
  });

  chatUsersList.innerHTML = "";
  userMap.forEach((username, userId) => {
    const li = document.createElement("li");
    li.textContent = `ID: ${userId} - ${username}`;
    li.dataset.userId = userId;
    li.dataset.username = username;
    li.addEventListener("click", () => openChat(userId, username, li));
    chatUsersList.appendChild(li);
  });
}

// 打开聊天窗口
async function openChat(userId, username, liElement) {
  currentChatUser = { id: userId, username };
  adminChatUserInfo.textContent = `用户ID: ${userId} - ${username}`;
  adminChatWindow.style.display = "flex";
  adminChatMessages.innerHTML = "";

  // 高亮选中
  document.querySelectorAll("#chatUsersList li").forEach(li => li.classList.remove("active"));
  liElement.classList.add("active");

  await loadMessages(userId);
  listenForMessages(userId);
}

// 返回用户列表
adminBackBtn.addEventListener("click", () => {
  adminChatWindow.style.display = "none";
  currentChatUser = null;
  if (chatSubscription) {
    supabaseClient.removeChannel(chatSubscription);
    chatSubscription = null;
  }
  document.querySelectorAll("#chatUsersList li").forEach(li => li.classList.remove("active"));
});

// 加载聊天消息
async function loadMessages(userId) {
  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.1),and(sender_id.eq.1,receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("加载聊天消息失败:", error);
    return;
  }

  data.forEach(msg => {
    appendMessage(msg.sender_id === 1 ? "admin" : "user", msg.content);
  });
}

// 显示消息
function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("admin-message", sender);
  msg.textContent = text;
  adminChatMessages.prepend(msg); // flex-direction: column-reverse
  adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
}

// 发送消息
adminSendBtn.addEventListener("click", async () => {
  const text = adminChatInput.value.trim();
  if (!text || !currentChatUser) return;

  const { data, error } = await supabaseClient
    .from("messages")
    .insert([
      { sender_id: 1, receiver_id: currentChatUser.id, content: text }
    ]);

  if (error) {
    console.error("发送失败:", error);
    return;
  }

  appendMessage("admin", text);
  adminChatInput.value = "";
});

// 实时监听
async function listenForMessages(userId) {
  if (chatSubscription) {
    supabaseClient.removeChannel(chatSubscription);
  }

  chatSubscription = supabaseClient
    .channel("realtime-admin-messages")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${userId}`
      },
      (payload) => {
        const msg = payload.new;
        appendMessage("user", msg.content);
      }
    )
    .subscribe();
}

// 页面初始化加载用户列表
loadChatUsers();
