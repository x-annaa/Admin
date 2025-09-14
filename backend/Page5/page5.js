// =======================
// DOM 元素
// =======================
const userListEl = document.createElement('div');
userListEl.id = 'userList';
document.getElementById('page5').prepend(userListEl);

const adminChatWindow = document.getElementById("adminChatWindow");
const adminBackBtn = document.getElementById("adminBackBtn");
const adminChatMessages = document.getElementById("adminChatMessages");
const adminChatInput = document.getElementById("adminChatInput");
const adminSendBtn = document.getElementById("adminSendBtn");
const adminChatUserInfo = document.getElementById("adminChatUserInfo");

const notificationSound = new Audio("https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3");

// =======================
// 数据结构
// =======================
let users = {};   // key: userId, value: { username, unreadCount, messages: [] }
let currentChatUserId = null;
let chatSubscription = null;

// =======================
// 获取当前用户消息（客服端）
// =======================
async function fetchUsersWithUnread() {
  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .eq("receiver_id", 1) // 客服ID
    .order("created_at", { ascending: true });

  if (error) {
    console.error("获取用户消息失败", error);
    return;
  }

  data.forEach(msg => {
    if (!users[msg.sender_id]) {
      users[msg.sender_id] = { username: `User ${msg.sender_id}`, unreadCount: 0, messages: [] };
    }
    users[msg.sender_id].messages.push(msg);
    if (!msg.is_read) users[msg.sender_id].unreadCount++;
  });

  renderUserList();
}

// =======================
// 渲染用户列表
// =======================
function renderUserList() {
  userListEl.innerHTML = "";
  for (const [userId, user] of Object.entries(users)) {
    const div = document.createElement("div");
    div.classList.add("user-item");
    if (userId == currentChatUserId) div.classList.add("active");
    div.dataset.userId = userId;
    div.textContent = `${user.username}`;
    
    if (user.unreadCount > 0) {
      const dot = document.createElement("span");
      dot.classList.add("unread-dot");
      dot.textContent = user.unreadCount;
      div.appendChild(dot);
    }

    div.addEventListener("click", () => openChat(userId));
    userListEl.appendChild(div);
  }
}

// =======================
// 打开聊天窗口
// =======================
function openChat(userId) {
  currentChatUserId = userId;
  const user = users[userId];
  adminChatUserInfo.textContent = `用户ID: ${userId} - ${user.username}`;
  adminChatMessages.innerHTML = "";
  
  // 显示历史消息
  user.messages.forEach(msg => {
    appendMessage(msg.sender_id === 1 ? "me" : "user", msg.content);
  });

  adminChatWindow.style.display = "flex";

  // 标记已读
  markMessagesAsRead(userId);
}

// =======================
// 关闭聊天窗口
// =======================
adminBackBtn.addEventListener("click", () => {
  adminChatWindow.style.display = "none";
  currentChatUserId = null;
  renderUserList();
});

// =======================
// 显示消息
// =======================
function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message-item", sender);
  msg.textContent = text;
  adminChatMessages.prepend(msg);
  adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
}

// =======================
// 发送消息
// =======================
adminSendBtn.addEventListener("click", async () => {
  if (!currentChatUserId) return;
  const content = adminChatInput.value.trim();
  if (!content) return;

  const { data, error } = await supabaseClient
    .from("messages")
    .insert([{
      sender_id: 1, // 客服
      receiver_id: Number(currentChatUserId),
      content,
      is_read: false
    }]);

  if (error) {
    console.error("发送失败", error);
    return;
  }

  appendMessage("me", content);
  users[currentChatUserId].messages.push(data[0]);
  adminChatInput.value = "";
});

// =======================
// 标记已读
// =======================
async function markMessagesAsRead(userId) {
  const { data, error } = await supabaseClient
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", 1)
    .eq("sender_id", userId)
    .eq("is_read", false);

  if (!error) users[userId].unreadCount = 0;
  renderUserList();
}

// =======================
// 实时监听
// =======================
function listenForMessages() {
  if (chatSubscription) supabaseClient.removeChannel(chatSubscription);

  chatSubscription = supabaseClient
    .channel("realtime-admin-messages")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.1` },
      (payload) => {
        const msg = payload.new;
        const userId = msg.sender_id;

        if (!users[userId]) users[userId] = { username: `User ${userId}`, unreadCount: 0, messages: [] };
        users[userId].messages.push(msg);

        if (currentChatUserId !== userId) {
          users[userId].unreadCount++;
          notificationSound.play();
        }

        renderUserList();

        if (currentChatUserId === userId) {
          appendMessage("user", msg.content);
          markMessagesAsRead(userId);
        }
      }
    )
    .subscribe();
}

// =======================
// 初始化
// =======================
document.addEventListener("DOMContentLoaded", async () => {
  await fetchUsersWithUnread();
  listenForMessages();
});
