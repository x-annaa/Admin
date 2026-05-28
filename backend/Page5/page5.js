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
const page5UnreadEl = document.getElementById("page5Unread");

const notificationSound = new Audio("https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3");
let soundUnlocked = false;

// =======================
// 数据结构
// =======================
let users = {}; // key: userId, value: { username, unreadCount, messages: [] }
let currentChatUserId = null;
let chatSubscription = null;

async function fetchUsersWithUnread() {
  try {
    // 拉取所有与客服相关的消息（发送或接收）
    const { data: messages, error: msgError } = await supabaseClient
      .from("messages")
      .select("*")
      .or(`receiver_id.eq.1,sender_id.eq.1`)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("获取用户消息失败", msgError);
      return;
    }

    // 获取所有相关用户 ID
    const userIds = [...new Set(messages.map(msg => msg.sender_id === 1 ? msg.receiver_id : msg.sender_id))];

    // 拉取真实用户名
    const { data: usersData, error: usersError } = await supabaseClient
      .from("users")
      .select("id, username")
      .in("id", userIds);

    if (usersError) {
      console.error("获取用户信息失败", usersError);
      return;
    }

    // 建立 id -> username 映射
    const userMap = {};
    usersData.forEach(u => userMap[u.id] = u.username);

    // 初始化用户对象
    messages.forEach(msg => {
      const userId = msg.sender_id === 1 ? msg.receiver_id : msg.sender_id;

      if (!users[userId]) {
        users[userId] = { 
          username: userMap[userId] || `User ${userId}`, // 使用数据库用户名
          unreadCount: 0, 
          messages: [] 
        };
      }

      users[userId].messages.push(msg);

      // 统计未读
      if (msg.receiver_id === 1 && !msg.is_read) {
        users[userId].unreadCount++;
      }
    });

    renderUserList();
    updatePage5Unread();
  } catch (err) {
    console.error("fetchUsersWithUnread 异常:", err);
  }
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
    div.textContent = user.username;

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

  // 按时间顺序显示历史消息
  user.messages.sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
               .forEach(msg =>
                 appendMessage(
                   msg.sender_id === 1 ? "me" : "user",
                   msg.content,
                   msg.created_at
                  )
                 );
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
function appendMessage(sender, text, time) {
  const msg = document.createElement("div");
  msg.classList.add("message-item", sender);

  // 格式化时间
  const date = new Date(time);
  const formattedTime = date.toLocaleString();

  msg.innerHTML = `
    <div class="message-text">
      ${text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>")}
    </div>

    <div class="message-time">
      ${formattedTime}
    </div>
  `;

  adminChatMessages.appendChild(msg);
  adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
}

// =======================
// 发送消息
// =======================
adminSendBtn.addEventListener("click", async () => {
  if (!currentChatUserId) return;
  const content = adminChatInput.value.trim();
  if (!content) return;

  appendMessage("me", content);
  adminChatInput.value = "";

  if (!users[currentChatUserId].messages) users[currentChatUserId].messages = [];
  users[currentChatUserId].messages.push({
    sender_id: 1,
    receiver_id: Number(currentChatUserId),
    content,
    is_read: false,
    created_at: new Date().toISOString()
  });

  try {
    const { data, error } = await supabaseClient
      .from("messages")
      .insert([{
        sender_id: 1,
        receiver_id: Number(currentChatUserId),
        content,
        is_read: false
      }]);

    if (error) console.error("发送消息失败", error);
    else if (data?.[0]) {
      users[currentChatUserId].messages[users[currentChatUserId].messages.length-1] = data[0];
    }
  } catch (err) {
    console.error("发送消息异常", err);
  }
});

// =======================
// 标记已读
// =======================
async function markMessagesAsRead(userId) {
  try {
    const { data, error } = await supabaseClient
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", 1)
      .eq("sender_id", userId)
      .eq("is_read", false);

    if (!error) users[userId].unreadCount = 0;
    renderUserList();
    updatePage5Unread();
  } catch (err) {
    console.error("markMessagesAsRead 异常:", err);
  }
}

// =======================
// 更新底部导航红点
// =======================
function updatePage5Unread() {
  let totalUnread = 0;
  for (const user of Object.values(users)) totalUnread += user.unreadCount;

  if (totalUnread > 0) {
    page5UnreadEl.textContent = totalUnread;
    page5UnreadEl.classList.remove("hidden");
  } else {
    page5UnreadEl.classList.add("hidden");
  }
}

// =======================
// 实时监听新消息
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

        // 如果不是当前聊天用户，增加未读并播放音效
        if (currentChatUserId !== userId) {
          users[userId].unreadCount++;
          if (soundUnlocked) {
            try { notificationSound.play(); } catch(e) {}
          }
        }

        renderUserList();
        updatePage5Unread();

        if (currentChatUserId === userId) {
          appendMessage("user", msg.content, msg.created_at);
          markMessagesAsRead(userId);
        }
      }
    )
    .subscribe();
}

// =======================
// 页面初始化
// =======================
document.addEventListener("DOMContentLoaded", async () => {
  await fetchUsersWithUnread();
  listenForMessages();

  // 全局解锁音效（首次用户交互）
  document.body.addEventListener("click", () => {
    if (!soundUnlocked) {
      notificationSound.play().catch(() => {});
      notificationSound.pause();
      notificationSound.currentTime = 0;
      soundUnlocked = true;
    }
  }, { once: true });
});

const loadAllUsersBtn = document.getElementById("loadAllUsersBtn");
const allUsersList = document.getElementById("allUsersList");

// 点击按钮拉取数据库全部用户
loadAllUsersBtn.addEventListener("click", async () => {
  try {
    const { data: usersData, error } = await supabaseClient
      .from("users")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("拉取用户失败", error);
      return;
    }

    renderAllUsers(usersData);
  } catch (err) {
    console.error("fetch all users 异常:", err);
  }
});

// 渲染全部用户列表
function renderAllUsers(usersData) {
  allUsersList.innerHTML = "";

  usersData.forEach(user => {
    const div = document.createElement("div");
    div.classList.add("user-item-full");
    div.innerHTML = `
      <span>${user.username} (ID: ${user.id})</span>
      <button>聊天</button>
    `;

    div.querySelector("button").addEventListener("click", () => {
      if (!users[user.id]) {
        users[user.id] = {
          username: user.username,
          unreadCount: 0,
          messages: []
        };
      }
      openChat(user.id);
    });

    allUsersList.appendChild(div);
  });
}
