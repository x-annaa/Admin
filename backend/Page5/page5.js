// ======================
// DOM 元素
// ======================
const page5 = document.getElementById("page5");
const page5Btn = document.getElementById("page5Btn");
const page5Badge = document.getElementById("page5Badge");

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
userChatInput.placeholder = "输入消息...";
const sendBtn = document.createElement("button");
sendBtn.textContent = "发送";

userChatInputDiv.appendChild(userChatInput);
userChatInputDiv.appendChild(sendBtn);

userChatWindow.appendChild(userChatHeader);
userChatWindow.appendChild(userChatMessages);
userChatWindow.appendChild(userChatInputDiv);

page5.appendChild(userChatList);
page5.appendChild(userChatWindow);

// ======================
// 状态管理
// ======================
let currentChatUserId = null;
let chatSubscription = null;
const unreadCounts = {};
let totalUnread = 0;

// ======================
// 工具函数
// ======================
function playNotificationSound() {
  const audio = new Audio("https://freesound.org/data/previews/256/256113_3263906-lq.mp3");
  audio.volume = 0.5;
  audio.play().catch(err => console.warn("声音播放失败:", err));
}

function updatePage5Badge() {
  page5Badge.style.display = totalUnread > 0 ? "inline-block" : "none";
  page5Badge.textContent = totalUnread;
}

// ======================
// 显示消息（最新消息在下方）
// ======================
function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("user-message");
  msg.classList.add(sender);
  msg.textContent = text;
  userChatMessages.appendChild(msg); // appendChild 最新消息在下面
  userChatMessages.scrollTop = userChatMessages.scrollHeight; // 自动滚动到底部
}

// ======================
// 加载用户列表
// ======================
async function loadUserList() {
  const { data, error } = await supabaseClient
    .from("messages")
    .select("sender_id")
    .eq("receiver_id", 1)
    .order("created_at", { ascending: false });

  if (error) { console.error(error); return; }

  const userIds = [...new Set(data.map(msg => msg.sender_id))];
  userChatList.innerHTML = "";
  userIds.forEach(id => {
    const div = document.createElement("div");
    div.classList.add("user-item");
    div.dataset.userid = id;
    const count = unreadCounts[id] || 0;
    div.textContent = `用户ID: ${id}${count ? ` (${count})` : ''}`;
    div.addEventListener("click", () => openChat(id));
    userChatList.appendChild(div);
  });
}

// ======================
// 打开聊天窗口
// ======================
async function openChat(userId) {
  currentChatUserId = userId;
  userChatHeader.textContent = `用户聊天: ${userId}`;
  document.querySelectorAll("#userChatList .user-item").forEach(item => {
    item.classList.toggle("active", item.dataset.userid == userId);
  });

  if (unreadCounts[userId]) {
    totalUnread -= unreadCounts[userId];
    delete unreadCounts[userId];
    updatePage5Badge();
  }

  userChatMessages.innerHTML = "";
  await loadChatMessages(userId);
}

// ======================
// 加载聊天记录
// ======================
async function loadChatMessages(userId) {
  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.1),and(sender_id.eq.1,receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true });

  if (error) { console.error(error); return; }

  data.forEach(msg => appendMessage(msg.sender_id === 1 ? "me" : "bot", msg.content));
}

// ======================
// 发送消息
// ======================
sendBtn.addEventListener("click", async () => {
  if (!currentChatUserId) return;
  const content = userChatInput.value.trim();
  if (!content) return;

  const { error } = await supabaseClient.from("messages").insert([
    { sender_id: 1, receiver_id: currentChatUserId, content }
  ]);
  if (error) { console.error(error); return; }

  appendMessage("me", content);
  userChatInput.value = "";
});

// ======================
// 实时监听消息
// ======================
if (!chatSubscription) {
  chatSubscription = supabaseClient
    .channel("realtime-messages-admin")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      payload => {
        const msg = payload.new;

        if (currentChatUserId === msg.sender_id) {
          appendMessage("bot", msg.content);
        } else {
          unreadCounts[msg.sender_id] = (unreadCounts[msg.sender_id] || 0) + 1;
          totalUnread++;
          updatePage5Badge();
          playNotificationSound();

          const userItem = document.querySelector(`#userChatList .user-item[data-userid="${msg.sender_id}"]`);
          if (userItem) userItem.textContent = `用户ID: ${msg.sender_id} (${unreadCounts[msg.sender_id]})`;
          else {
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

// ======================
// 初始化页面
// ======================
loadUserList();
