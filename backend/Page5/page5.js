const ADMIN_ID = 1;


// ===============================
// DOM
// ===============================

const page5UserList =
document.getElementById(
    "page5AdminUserList"
);


const page5Unread =
document.getElementById(
    "page5Unread"
);



const inboxModal =
document.getElementById(
    "page5AdminInboxModal"
);


const inboxUserName =
document.getElementById(
    "page5InboxUserName"
);


const inboxTitle =
document.getElementById(
    "page5InboxTitle"
);


const inboxContent =
document.getElementById(
    "page5InboxContent"
);


const inboxHistory =
document.getElementById(
    "page5InboxHistory"
);


const sendInboxBtn =
document.getElementById(
    "page5SendInboxBtn"
);


const closeInboxBtn =
document.getElementById(
    "page5CloseInboxBtn"
);




const chatModal =
document.getElementById(
    "page5AdminChatModal"
);


const chatTitle =
document.getElementById(
    "page5ChatUserTitle"
);


const chatMessages =
document.getElementById(
    "page5AdminChatMessages"
);


const chatInput =
document.getElementById(
    "page5AdminChatInput"
);


const sendChatBtn =
document.getElementById(
    "page5AdminSendChatBtn"
);


const closeChatBtn =
document.getElementById(
    "page5CloseChatBtn"
);




let currentUser=null;


// 用户未读
let userUnreadMap={};




// ===============================
// LOAD USERS
// ===============================

async function loadPage5Users(){


    const {
        data,
        error
    } =
    await supabaseClient
    .from("users")
    .select(
        "id,username"
    )
    .neq(
        "id",
        ADMIN_ID
    )
    .order(
        "id",
        {
            ascending:true
        }
    );



    if(error){

        console.error(error);

        return;

    }



    renderUsers(data);


}






// ===============================
// LOAD UNREAD
// ===============================

async function loadPage5Unread(){


    const {
        data,
        error
    }
    =
    await supabaseClient
    .from("messages")
    .select(
        "sender_id"
    )
    .eq(
        "receiver_id",
        ADMIN_ID
    )
    .eq(
        "is_read",
        false
    );



    if(error){

        console.error(error);

        return;

    }



    userUnreadMap={};



    data.forEach(msg=>{


        if(!userUnreadMap[msg.sender_id]){

            userUnreadMap[msg.sender_id]=0;

        }


        userUnreadMap[msg.sender_id]++;


    });



    updatePage5Unread();


}






// ===============================
// PAGE5 RED DOT
// ===============================


function updatePage5Unread(){


    let total=0;


    Object.values(
        userUnreadMap
    )
    .forEach(
        n=>{

            total+=n;

        }
    );



    if(total>0){


        page5Unread.textContent =
        total;


        page5Unread.classList.remove(
            "hidden"
        );


    }
    else{


        page5Unread.classList.add(
            "hidden"
        );


    }


}






// ===============================
// USER LIST
// ===============================

function renderUsers(users){


    page5UserList.innerHTML="";



    users.forEach(user=>{


        const row =
        document.createElement(
            "div"
        );


        row.className =
        "page5-user-row";



        let unread="";


        if(userUnreadMap[user.id]){


            unread=
            `
            <span class="page5-user-unread">

            ${userUnreadMap[user.id]}

            </span>
            `;


        }




        row.innerHTML=`

        <div class="page5-user-info">

        ${user.username}

        -

        ${user.id}

        ${unread}

        </div>


        <div class="page5-user-actions">


        <button class="page5-inbox-btn">

        Inbox

        </button>



        <button class="page5-chat-btn">

        Chat

        </button>


        </div>

        `;




        row.querySelector(
            ".page5-inbox-btn"
        )
        .onclick=()=>{

            openInbox(user);

        };



        row.querySelector(
            ".page5-chat-btn"
        )
        .onclick=()=>{

            openChat(user);

        };



        page5UserList.appendChild(
            row
        );


    });


}

// ===============================
// OPEN INBOX
// ===============================

async function openInbox(user){


    currentUser=user;



    inboxUserName.textContent =
    `${user.username} - ID:${user.id}`;



    inboxTitle.value="";

    inboxContent.value="";



    inboxModal.style.display =
    "flex";



    await loadInboxHistory(
        user.id
    );


}





closeInboxBtn.onclick =
()=>{


    inboxModal.style.display =
    "none";


    currentUser=null;


};






// ===============================
// LOAD INBOX HISTORY
// ===============================


async function loadInboxHistory(userId){


    if(!inboxHistory)
        return;



    inboxHistory.innerHTML =
    "Loading...";



    const {
        data,
        error
    }
    =
    await supabaseClient
    .from(
        "inbox_messages"
    )
    .select(
        "id,title,content,is_read,created_at"
    )
    .eq(
        "user_id",
        userId
    )
    .order(
        "created_at",
        {
            ascending:false
        }
    );



    if(error){


        console.error(error);


        inboxHistory.innerHTML =
        "Load failed";


        return;


    }



    if(!data || data.length===0){


        inboxHistory.innerHTML =
        "No Inbox History";


        return;


    }



    inboxHistory.innerHTML="";



    data.forEach(item=>{


        const box =
        document.createElement(
            "div"
        );


        box.className =
        "page5-inbox-history-item";



        box.innerHTML=`

        <div class="page5-inbox-history-title">

        ${escapeHtml(item.title)}

        </div>


        <div class="page5-inbox-history-content">

        ${escapeHtml(item.content)}

        </div>


        <div class="page5-inbox-history-time">

        ${formatTime(item.created_at)}

        </div>

        `;


        inboxHistory.appendChild(
            box
        );


    });


}







// ===============================
// SEND INBOX
// ===============================


sendInboxBtn.onclick =
async()=>{


    if(!currentUser)
        return;



    const title =
    inboxTitle.value.trim();



    const content =
    inboxContent.value.trim();



    if(!title || !content){


        alert(
            "Please enter title and message"
        );


        return;


    }



    const {
        error
    }
    =
    await supabaseClient
    .from(
        "inbox_messages"
    )
    .insert([

        {

            user_id:
            currentUser.id,


            title,


            content,


            is_read:false

        }

    ]);



    if(error){


        console.error(error);


        alert(
            "Inbox send failed"
        );


        return;


    }



    inboxTitle.value="";

    inboxContent.value="";



    await loadInboxHistory(
        currentUser.id
    );



    alert(
        "Inbox sent"
    );


};








// ===============================
// OPEN CHAT
// ===============================


async function openChat(user){


    currentUser=user;

    chatInput.value="";


    // 清除红点

    await clearUserUnread(
        user.id
    );



    chatTitle.textContent =
    `${user.username} - ID:${user.id}`;



    chatMessages.innerHTML="";



    chatModal.style.display =
    "flex";



    await loadChatMessages(
        user.id
    );


}






// ===============================
// CLEAR USER UNREAD
// ===============================


async function clearUserUnread(userId){


    const {
        error
    }
    =
    await supabaseClient
    .from(
        "messages"
    )
    .update({

        is_read:true

    })
    .eq(
        "sender_id",
        userId
    )
    .eq(
        "receiver_id",
        ADMIN_ID
    )
    .eq(
        "is_read",
        false
    );



    if(error){

        console.error(error);

        return;

    }



    delete userUnreadMap[userId];


    updatePage5Unread();


}








// ===============================
// LOAD CHAT
// ===============================


async function loadChatMessages(userId){


    const {
        data,
        error
    }
    =
    await supabaseClient
    .from(
        "messages"
    )
    .select(
        "id,sender_id,receiver_id,content,created_at"
    )
    .or(

`and(sender_id.eq.${userId},receiver_id.eq.${ADMIN_ID}),and(sender_id.eq.${ADMIN_ID},receiver_id.eq.${userId})`

    )
    .order(
        "created_at",
        {
            ascending:true
        }
    );



    if(error){

        console.error(
            "Chat load error",
            error
        );


        return;


    }




    if(!data || data.length===0){


        addChatMessage(
            "system",
            "No messages yet"
        );


        return;


    }




    data.forEach(msg=>{


        addChatMessage(

            msg.sender_id === ADMIN_ID
            ?
            "admin"
            :
            "user",


            msg.content,


            msg.created_at

        );


    });



}






// ===============================
// SEND CHAT
// ===============================


sendChatBtn.onclick =
async()=>{


    if(!currentUser)
        return;



    const text =
    chatInput.value.trim();



    if(!text)
        return;




    const now =
    new Date()
    .toISOString();



    const {
        error
    }
    =
    await supabaseClient
    .from(
        "messages"
    )
    .insert([

        {

            sender_id:
            ADMIN_ID,


            receiver_id:
            currentUser.id,


            content:
            text,


            is_read:false

        }

    ]);



    if(error){


        console.error(error);


        alert(
            "Send failed"
        );


        return;


    }




    addChatMessage(

        "admin",

        text,

        now

    );



    chatInput.value="";


};







// ===============================
// CTRL + ENTER SEND
// ===============================


chatInput?.addEventListener(
"keydown",
e=>{


    if(
        e.key==="Enter"
        &&
        e.ctrlKey
    ){

        sendChatBtn.click();

    }


});







// ===============================
// CHAT UI
// ===============================


function addChatMessage(
type,
text,
createdAt=null
){


    const div =
    document.createElement(
        "div"
    );



    div.className =
    "page5-chat-message "
    +
    type;




    const content =
    document.createElement(
        "div"
    );



    content.className =
    "page5-chat-content";



    content.innerHTML =
    escapeHtml(text);





    const time =
    document.createElement(
        "div"
    );



    time.className =
    "page5-chat-time";



    time.textContent =
    createdAt
    ?
    formatTime(createdAt)
    :
    "";




    div.appendChild(
        content
    );


    div.appendChild(
        time
    );



    chatMessages.appendChild(
        div
    );



    chatMessages.scrollTop =
    chatMessages.scrollHeight;


}







// ===============================
// CLOSE CHAT
// ===============================


closeChatBtn.onclick =
()=>{


    chatModal.style.display =
    "none";


    currentUser=null;


    chatMessages.innerHTML="";


    chatInput.value="";


};






// ===============================
// TOOL
// ===============================


function formatTime(time){


    if(!time)
        return "";



    return new Date(time)
    .toLocaleString([],{

        year:"numeric",

        month:"numeric",

        day:"numeric",

        hour:"numeric",

        minute:"2-digit",

        hour12:true

    });


}





function escapeHtml(text){


    return String(text || "")

    .replace(
        /&/g,
        "&amp;"
    )

    .replace(
        /</g,
        "&lt;"
    )

    .replace(
        />/g,
        "&gt;"
    )

    .replace(
        /\n/g,
        "<br>"
    );


}






// ===============================
// INIT
// ===============================


document.addEventListener(
"DOMContentLoaded",
async()=>{


    await loadPage5Unread();


    await loadPage5Users();


});
