// ================================
// 客服聊天管理逻辑 page5.js
// ================================

const chatUsersTableBody = document.querySelector("#chatUsersTable tbody");
const chatModal = document.getElementById("chatModal");
const closeChatModal = document.getElementById("closeChatModal");
const chatWithUserName = document.getElementById("chatWithUserName");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const page5Unread = document.getElementById("page5Unread");

let currentChatUserId = null;
let chatSubscription = null;

// ================================
// 加载用户消息摘要
// ================================
async function loadUserChatList() {
  const { data, error } = await supabaseClient.rpc("get_user_message_summary");
  // 你可以用 SQL RPC，也可以直接查询 messages
  if (error) {
    console.error(error);
    return;
  }
  renderUserChatList(data);
}

// 如果没有 RPC，可以手动写查询：
async function loadUserChatListFallback() {
  const { data, error } = await supabaseClient
    .from("messages")
    .select("sender_id, receiver_id, content, created_at, is_read")
    .order("created_at", { ascending: false });

  if (error) return console.error(error);

  // 只取 sender_id != 1 的用户的最新消息
  const userMap = {};
  for (const msg of data) {
    const userId = msg.sender_id === 1 ? msg.receiver_id : msg.sender_id;
    if (userId === 1) continue; // 跳过客服自己
    if (!userMap[userId]) {
      userMap[userId] = msg;
    }
  }

  const users = await Promise.all(
    Object.keys(userMap).map(async (uid) => {
      const { data: userInfo } = await supabaseClient
        .from("users")
        .select("id, username, platform_account")
        .eq("id", uid)
        .single();

      return {
        user_id: uid,
        username: userInfo?.username || "未知用户",
        platform_account: userInfo?.platform_account || "-",
        last_message: userMap[uid].content,
        time: new Date(userMap[uid].created_at).toLocaleString(),
        unread: userMap[uid].is_read ? 0 : 1,
      };
    })
  );

  renderUserChatList(users);
}

// ================================
// 渲染用户列表
// ================================
function renderUserChatList(users) {
  chatUsersTableBody.innerHTML = "";

  users.forEach((u) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.user_id}</td>
      <td>${u.username}</td>
      <td>${u.platform_account}</td>
      <td>${u.last_message || ""}</td>
      <td>${u.time || ""}</td>
      <td>${u.unread > 0 ? `<span class="unread-dot">${u.unread}</span>` : ""}</td>
      <td><button class="openChatBtn" data-id="${u.user_id}" data-name="${u.username}">打开</button></td>
    `;
    chatUsersTableBody.appendChild(tr);
  });

  document.querySelectorAll(".openChatBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openChatWindow(btn.dataset.id, btn.dataset.name);
    });
  });

  updateTotalUnread(users);
}

// ================================
// 打开聊天弹窗
// ================================
async function openChatWindow(userId, username) {
  currentChatUserId = userId;
  chatWithUserName.textContent = `与 ${username} 聊天`;
  chatModal.style.display = "flex";
  chatMessages.innerHTML = "";

  await loadChatHistory(userId);
  listenForMessages(userId);
  markAsRead(userId);
  scrollToBottom();
}

// ================================
// 加载聊天记录
// ================================
async function loadChatHistory(userId) {
  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.1),and(sender_id.eq.1,receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true });

  if (error) return console.error(error);

  data.forEach((msg) => {
    appendMessage(msg.sender_id === 1 ? "我" : "用户", msg.content);
  });
}

// ================================
// 添加消息到窗口
// ================================
function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add("message-item", sender === "我" ? "me" : "bot");
  div.innerHTML = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  chatMessages.appendChild(div);
  scrollToBottom();
}

// ================================
// 滚动到底部
// ================================
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ================================
// 发送消息
// ================================
sendBtn?.addEventListener("click", async () => {
  const content = chatInput.value.trim();
  if (!content) return;

  const { error } = await supabaseClient.from("messages").insert([
    { sender_id: 1, receiver_id: currentChatUserId, content, is_read: false },
  ]);

  if (error) {
    alert("发送失败");
    return console.error(error);
  }

  appendMessage("我", content);
  chatInput.value = "";
  chatInput.style.height = "auto";
  scrollToBottom();
});

// ================================
// 标记为已读
// ================================
async function markAsRead(userId) {
  await supabaseClient
    .from("messages")
    .update({ is_read: true })
    .eq("sender_id", userId)
    .eq("receiver_id", 1)
    .eq("is_read", false);
}

// ================================
// 实时监听消息
// ================================
function listenForMessages(userId) {
  if (chatSubscription) supabaseClient.removeChannel(chatSubscription);

  chatSubscription = supabaseClient.channel("admin-realtime-chat")
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `receiver_id=eq.1`
    }, async (payload) => {
      const msg = payload.new;
      if (msg.sender_id === Number(userId)) {
        appendMessage("用户", msg.content);
        await markAsRead(userId);
      }
      loadUserChatListFallback(); // 更新左侧未读数量
    })
    .subscribe();
}

// ================================
// 关闭聊天弹窗
// ================================
closeChatModal?.addEventListener("click", () => {
  chatModal.style.display = "none";
  if (chatSubscription) {
    supabaseClient.removeChannel(chatSubscription);
    chatSubscription = null;
  }
});

// ================================
// 更新未读总数
// ================================
function updateTotalUnread(users) {
  const total = users.reduce((sum, u) => sum + (u.unread || 0), 0);
  if (total > 0) {
    page5Unread.textContent = total > 99 ? "99+" : total;
    page5Unread.classList.remove("hidden");
  } else {
    page5Unread.classList.add("hidden");
  }
}

// ================================
// 初始化
// ================================
document.addEventListener("DOMContentLoaded", () => {
  loadUserChatListFallback();
  setInterval(loadUserChatListFallback, 5000); // 每5秒刷新
});
