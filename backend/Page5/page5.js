// DOM 元素
const userListEl = document.getElementById("userList");
const adminChatWindow = document.getElementById("adminChatWindow");
const adminBackBtn = document.getElementById("adminBackBtn");
const adminChatMessages = document.getElementById("adminChatMessages");
const adminChatInput = document.getElementById("adminChatInput");
const adminSendBtn = document.getElementById("adminSendBtn");
const adminChatUserInfo = document.getElementById("adminChatUserInfo");
const page5UnreadEl = document.getElementById("page5Unread");

const notificationSound = new Audio("https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3");
let soundUnlocked = false;

let users = {}; // { userId: { username, unreadCount, messages: [] } }
let currentChatUserId = null;
let chatSubscription = null;

// 获取用户消息并初始化列表
async function fetchUsersWithUnread() {
  try {
    const { data, error } = await supabaseClient
      .from("messages")
      .select("*")
      .or(`receiver_id.eq.1,sender_id.eq.1`)
      .order("created_at", { ascending: true });

    if (error) return console.error("获取消息失败", error);

    data.forEach(msg => {
      const userId = msg.sender_id === 1 ? msg.receiver_id : msg.sender_id;
      if (!users[userId]) users[userId] = { username: `User ${userId}`, unreadCount:0, messages:[] };
      users[userId].messages.push(msg);
      if (msg.receiver_id === 1 && !msg.is_read) users[userId].unreadCount++;
    });

    renderUserList();
    updatePage5Unread();
  } catch (err) { console.error(err); }
}

// 渲染用户列表
function renderUserList() {
  userListEl.innerHTML = "";
  for (const [userId, user] of Object.entries(users)) {
    const div = document.createElement("div");
    div.classList.add("user-item");
    if(userId==currentChatUserId) div.classList.add("active");
    div.textContent = user.username;

    if(user.unreadCount>0){
      const dot = document.createElement("span");
      dot.classList.add("unread-dot");
      dot.textContent = user.unreadCount;
      div.appendChild(dot);
    }

    div.addEventListener("click", ()=>openChat(userId));
    userListEl.appendChild(div);
  }
}

// 打开聊天
function openChat(userId){
  currentChatUserId=userId;
  const user=users[userId];
  adminChatUserInfo.textContent=`用户ID: ${userId} - ${user.username}`;
  adminChatMessages.innerHTML="";

  user.messages.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at))
               .forEach(msg=>appendMessage(msg.sender_id===1?"me":"user", msg.content));

  adminChatWindow.style.display="flex";
  markMessagesAsRead(userId);
  renderUserList();
}

// 关闭聊天
adminBackBtn.addEventListener("click", ()=>{
  adminChatWindow.style.display="none";
  currentChatUserId=null;
  renderUserList();
});

// 显示消息
function appendMessage(sender,text){
  const msg=document.createElement("div");
  msg.classList.add("message-item",sender);
  msg.innerHTML=text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>");
  adminChatMessages.appendChild(msg);
  adminChatMessages.scrollTop=adminChatMessages.scrollHeight;
}

// 发送消息
adminSendBtn.addEventListener("click", async ()=>{
  if(!currentChatUserId) return;
  const content=adminChatInput.value.trim();
  if(!content) return;

  appendMessage("me",content);
  adminChatInput.value="";

  users[currentChatUserId].messages.push({
    sender_id:1, receiver_id:Number(currentChatUserId), content, is_read:false, created_at:new Date().toISOString()
  });

  try{
    const { data,error }=await supabaseClient.from("messages")
      .insert([{ sender_id:1, receiver_id:Number(currentChatUserId), content, is_read:false }]);
    if(error) console.error(error);
    else if(data?.[0]) users[currentChatUserId].messages[users[currentChatUserId].messages.length-1]=data[0];
  }catch(e){console.error(e);}
});

// 标记已读
async function markMessagesAsRead(userId){
  try{
    await supabaseClient.from("messages")
      .update({is_read:true})
      .eq("receiver_id",1)
      .eq("sender_id",userId)
      .eq("is_read",false);
    users[userId].unreadCount=0;
    renderUserList();
    updatePage5Unread();
  }catch(e){console.error(e);}
}

// 更新未读红点
function updatePage5Unread(){
  const total=Object.values(users).reduce((sum,u)=>sum+u.unreadCount,0);
  if(total>0){ page5UnreadEl.textContent=total; page5UnreadEl.classList.remove("hidden"); }
  else page5UnreadEl.classList.add("hidden");
}

// 实时监听消息
function listenForMessages(){
  if(chatSubscription) supabaseClient.removeChannel(chatSubscription);

  chatSubscription=supabaseClient.channel("realtime-admin-messages")
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`receiver_id=eq.1`},
      payload=>{
        const msg=payload.new;
        const userId=msg.sender_id;
        if(!users[userId]) users[userId]={username:`User ${userId}`,unreadCount:0,messages:[]};
        users[userId].messages.push(msg);

        if(currentChatUserId!==userId){ users[userId].unreadCount++; if(soundUnlocked){ try{notificationSound.play();}catch(e){} } }

        renderUserList();
        updatePage5Unread();

        if(currentChatUserId===userId){ appendMessage("user",msg.content); markMessagesAsRead(userId); }
      })
    .subscribe();
}

// 页面初始化
document.addEventListener("DOMContentLoaded", async ()=>{
  await fetchUsersWithUnread();
  listenForMessages();

  document.body.addEventListener("click",()=>{
    if(!soundUnlocked){
      notificationSound.play().catch(()=>{});
      notificationSound.pause();
      notificationSound.currentTime=0;
      soundUnlocked=true;
    }
  },{once:true});
});
