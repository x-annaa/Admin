// backend/Page5/page5.js
// =============================
// 客服聊天系统（Admin ↔ 用户）
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const supabaseUrl = "https://YOUR_PROJECT.supabase.co";
  const supabaseKey = "YOUR_SUPABASE_SERVICE_KEY";
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  const chatUsersTable = document.querySelector("#chatUsersTable tbody");
  const chatWindow = document.getElementById("chatWindow");
  const chatMessages = document.getElementById("chatMessages");
  const chatWithName = document.getElementById("chatWithName");
  const chatInput = document.getElementById("chatInput");
  const sendMessageBtn = document.getElementById("sendMessageBtn");
  const closeChatBtn = document.getElementById("closeChatBtn");
  const page5Unread = document.getElementById("page5Unread");

  let currentReceiverId = null; // 当前聊天的 user_id
  const adminId = 1; // 客服ID固定为1

  // =============================
  // 加载用户列表
  // =============================
  async function loadChatUsers() {
    const { data, error } = await supabase
      .from("messages")
      .select("sender_id, receiver_id, content, created_at, is_read, users!sender_id(username, platform_account)")
      .order("created_at", { ascending: false });

    if (error) return console.error("加载消息失败:", error);

    const userMap = new Map();

    data.forEach(msg => {
      const userId = msg.sender_id === adminId ? msg.receiver_id : msg.sender_id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          username: msg.users?.username || "未知用户",
          platform: msg.users?.platform_account || "-",
          lastMsg: msg.content,
          unread: 0
        });
      }
      if (msg.receiver_id === adminId && !msg.is_read) {
        userMap.get(userId).unread += 1;
      }
    });

    chatUsersTable.innerHTML = "";
    for (const [, u] of userMap) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.userId}</td>
        <td>${u.username}</td>
        <td>${u.platform}</td>
        <td>${u.lastMsg}</td>
        <td>${u.unread > 0 ? `<span style="color:red">${u.unread}</span>` : "-"}</td>
        <td><button class="openChatBtn" data-user="${u.userId}" data-name="${u.username}">进入</button></td>
      `;
      chatUsersTable.appendChild(tr);
    }

    document.querySelectorAll(".openChatBtn").forEach(btn => {
      btn.addEventListener("click", e => {
        currentReceiverId = Number(e.target.dataset.user);
        chatWithName.textContent = e.target.dataset.name;
        openChat();
      });
    });
  }

  // =============================
  // 打开聊天窗口
  // =============================
  async function openChat() {
    chatWindow.style.display = "flex";
    await loadMessages();

    // 标记未读为已读
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", adminId)
      .eq("sender_id", currentReceiverId);
  }

  // =============================
  // 关闭聊天窗口
  // =============================
  closeChatBtn.addEventListener("click", () => {
    chatWindow.style.display = "none";
    chatMessages.innerHTML = "";
    currentReceiverId = null;
  });

  // =============================
  // 加载聊天消息
  // =============================
  async function loadMessages() {
    if (!currentReceiverId) return;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${adminId},receiver_id.eq.${currentReceiverId}),and(sender_id.eq.${currentReceiverId},receiver_id.eq.${adminId})`)
      .order("created_at", { ascending: false });

    if (error) return console.error("加载消息失败:", error);

    chatMessages.innerHTML = "";
    data.forEach(msg => appendMessage(msg.sender_id === adminId ? "me" : "bot", msg.content));
  }

  // =============================
  // 显示单条消息
  // =============================
  function appendMessage(sender, text) {
    const msg = document.createElement("div");
    msg.classList.add("message-item", sender === "me" ? "me" : "bot");
    msg.innerHTML = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    chatMessages.prepend(msg);
  }

  // =============================
  // 发送消息
  // =============================
  async function sendMessage() {
    const content = chatInput.value.trim();
    if (!content || !currentReceiverId) return;

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: adminId,
        receiver_id: currentReceiverId,
        content,
        is_read: false,
        created_at: new Date().toISOString()
      }
    ]);

    if (error) {
      console.error("发送失败:", error);
      return;
    }

    appendMessage("me", content);
    chatInput.value = "";
  }

  sendMessageBtn.addEventListener("click", sendMessage);

  // 支持 Shift+Enter 换行, Enter 发送
  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // =============================
  // 实时监听新消息
  // =============================
  supabase
    .channel("messages-channel")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      payload => {
        const msg = payload.new;
        if (msg.receiver_id === adminId) {
          // 新消息给客服
          if (currentReceiverId === msg.sender_id) {
            appendMessage("bot", msg.content);
            // 自动设为已读
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", msg.id);
          } else {
            page5Unread.classList.add("show");
            loadChatUsers();
          }
        }
      }
    )
    .subscribe();

  // =============================
  // 初始化加载
  // =============================
  loadChatUsers();
});
