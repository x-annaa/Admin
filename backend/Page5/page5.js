// DOM 元素
const page5 = document.getElementById("page5");
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
userChatInput.id = "chatInput";          // ✅ 给 input 加 id
userChatInput.name = "chat-message";     // ✅ 给 input 加 name
userChatInput.placeholder = "输入消息...";
userChatInput.setAttribute("autocomplete", "off");

const sendBtn = document.createElement("button"); // ✅ 在这里创建
sendBtn.id = "sendBtn";
sendBtn.textContent = "发送";

userChatInputDiv.appendChild(userChatInput);
userChatInputDiv.appendChild(sendBtn);

userChatWindow.appendChild(userChatHeader);
userChatWindow.appendChild(userChatMessages);
userChatWindow.appendChild(userChatInputDiv);

page5.appendChild(userChatList);
page5.appendChild(userChatWindow);

// =============================
// 逻辑部分
// =============================

// 当前聊天用户 id
let currentChatUserId = null;
let chatSubscription = null;

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
    div.textContent = `用户ID: ${id}`;
    div.dataset.userid = id;
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
        filter: `sender_id=eq.${userId},receiver_id=eq.1` // 用户发给客服
      },
      payload => {
        const msg = payload.new;
        appendMessage("bot", msg.content);
      }
    )
    .subscribe();
}

// 加载历史消息
async function loadChatMessages(userId) {
  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.1),and(sender_id.eq.1,receiver_id.eq.${userId})`)
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
        content: content
      }
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
  msg.classList.add("user-message");
  msg.classList.add(sender);
  msg.textContent = text;
  userChatMessages.appendChild(msg);
  userChatMessages.scrollTop = userChatMessages.scrollHeight;
}

// 页面初始化
loadUserList();
