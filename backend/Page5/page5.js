// DOM 元素
const page5 = document.getElementById("page5");
const page5Btn = document.querySelector('button[data-page="page5"]');
const page5Badge = document.createElement("span");
page5Badge.id = "page5Badge";
page5Badge.className = "badge";
page5Badge.style.display = "none";
page5Btn.appendChild(page5Badge);

const userChatList = document.createElement("div");
userChatList.id = "userChatList";

const userChatWindow = document.createElement("div");
userChatWindow.id = "userChatWindow";

const userChatHeader = document.createElement("div");
userChatHeader.id = "userChatHeader";
userChatHeader.textContent = "请选择用户聊天";

const userChatMessages = document.createElement("div");
userChatMessages.id = "userChatMessages";

const userChatInputDiv = document.createElement("div");
userChatInputDiv.id = "userChatInput";

const userChatInput = document.createElement("input");
userChatInput.id = "chatInput";
userChatInput.name = "chat-message";
userChatInput.placeholder = "输入消息...";
userChatInput.setAttribute("autocomplete", "off"); // 防止浏览器乱填

userChatInputDiv.appendChild(userChatInput);
userChatInputDiv.appendChild(sendBtn);

userChatWindow.appendChild(userChatHeader);
userChatWindow.appendChild(userChatMessages);
userChatWindow.appendChild(userChatInputDiv);

page5.appendChild(userChatList);
page5.appendChild(userChatWindow);

// 当前聊天用户 id
let currentChatUserId = null;
let chatSubscription = null;

// 未读消息统计
const unreadCounts = {}; // { userId: count }
let totalUnread = 0;

// 播放提示音
function playNotificationSound() {
  const audio = new Audio("/sounds/notify.mp3"); // ⚠️ 自己准备 notify.mp3 放到 public/sounds/
  audio.play().catch(err => console.warn("声音播放失败:", err));
}

// 更新 Page5 底部按钮的红点
function updatePage5Badge() {
  if (totalUnread > 0) {
    page5Badge.style.display = "inline-block";
    page5Badge.textContent = totalUnread;
  } else {
    page5Badge.style.display = "none";
  }
}

// 获取用户列表（有给客服发过消息的用户）
async function loadUserList() {
  const { data, error } = await supabaseClient
    .from("messages")
    .select("sender_id")
    .eq("receiver_id", 1) // 客服ID=1
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const userIds = [...new Set(data.map(msg => msg.sender_id))];

  userChatList.innerHTML = "";
  userIds.forEach(id => {
    const div = document.createElement("div");
    div.classList.add("user-item");
    div.dataset.userid = id;
    div.textContent = `用户ID: ${id}${unreadCounts[id] ? " (" + unreadCounts[id] + ")" : ""}`;
    div.addEventListener("click", () => openChat(id));
    userChatList.appendChild(div);
  });
}

// 打开聊天窗口
async function openChat(userId) {
  currentChatUserId = userId;
  userChatHeader.textContent = `用户聊天: ${userId}`;

  document.querySelectorAll("#userChatList .user-item").forEach(item => {
    item.classList.toggle("active", item.dataset.userid == userId);
  });

  // 清空该用户未读数
  if (unreadCounts[userId]) {
    totalUnread -= unreadCounts[userId];
    delete unreadCounts[userId];
    updatePage5Badge();
  }

  const userItem = document.querySelector(`#userChatList .user-item[data-userid="${userId}"]`);
  if (userItem) {
    userItem.textContent = `用户ID: ${userId}`;
  }

  userChatMessages.innerHTML = "";
  await loadChatMessages(userId);

  // 实时监听
  if (chatSubscription) {
    supabaseClient.removeChannel(chatSubscription);
  }
  chatSubscription = supabaseClient
    .channel("realtime-messages-admin")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.1`,
      },
      payload => {
        const msg = payload.new;
        if (msg.sender_id == currentChatUserId) {
          // 当前窗口用户的消息 → 直接显示
          appendMessage("bot", msg.content);
        } else {
          // 其他用户 → 计入未读
          unreadCounts[msg.sender_id] = (unreadCounts[msg.sender_id] || 0) + 1;
          totalUnread++;
          updatePage5Badge();
          playNotificationSound();

          // 更新用户列表 (未读数显示)
          const userItem = document.querySelector(`#userChatList .user-item[data-userid="${msg.sender_id}"]`);
          if (userItem) {
            userItem.textContent = `用户ID: ${msg.sender_id} (${unreadCounts[msg.sender_id]})`;
          } else {
            // 新用户也加入列表
            const div = document.createElement("div");
            div.classList.add("user-item");
            div.dataset.userid = msg.sender_id;
            div.textContent = `用户ID: ${msg.sender_id} (${unreadCounts[msg.sender_id]})`;
            div.addEventListener("click", () => openChat(msg.sender_id));
            userChatList.prepend(div);
          }
        }
      }
    )
    .subscribe();
}

// 加载历史消息
async function loadChatMessages(userId) {
  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.1),and(sender_id.eq.1,receiver_id.eq.${userId})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(msg => {
    appendMessage(msg.sender_id === 1 ? "me" : "bot", msg.content);
  });
}

// 发送消息
sendBtn.addEventListener("click", async () => {
  const content = userChatInput.value.trim();
  if (!content || !currentChatUserId) return;

  const { error } = await supabaseClient
    .from("messages")
    .insert([
      {
        sender_id: 1, // 客服ID
        receiver_id: currentChatUserId,
        content: content,
      },
    ]);

  if (error) {
    console.error(error);
    return;
  }

  appendMessage("me", content);
  userChatInput.value = "";
});

// 显示消息
function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("user-message", sender);
  msg.textContent = text;
  userChatMessages.appendChild(msg);
  userChatMessages.scrollTop = userChatMessages.scrollHeight;
}

// 初始化
loadUserList();
