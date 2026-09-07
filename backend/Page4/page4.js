document.addEventListener("DOMContentLoaded", () => {

  // =====================================================
  // TAB
  // =====================================================

  const withdrawTab =
    document.getElementById("wdWithdrawTab");

  const depositTab =
    document.getElementById("wdDepositTab");

  const withdrawContent =
    document.getElementById("wdWithdrawContent");

  const depositContent =
    document.getElementById("wdDepositContent");


  // =====================================================
  // WD UNREAD / PENDING BADGE
  // =====================================================

  const wdUnread =
    document.getElementById("wdUnread");


  async function updateWDUnread() {

    try {

      // ---------------------------------------------
      // 获取提现待处理数量
      // ---------------------------------------------

      const {
        data: withdrawals,
        error: withdrawalError
      } =
        await supabaseClient
          .from("withdrawals")
          .select("id,status");


      if (withdrawalError) {
        console.error(
          "获取提现待处理数量失败:",
          withdrawalError
        );
      }


      // ---------------------------------------------
      // 获取充值待处理数量
      // ---------------------------------------------

      const {
        data: recharges,
        error: rechargeError
      } =
        await supabaseClient
          .from("recharges")
          .select("id,status");


      if (rechargeError) {
        console.error(
          "获取充值待处理数量失败:",
          rechargeError
        );
      }


      // ---------------------------------------------
      // 统计提现待处理
      // ---------------------------------------------

      const withdrawalPending =
        (withdrawals || []).filter(item => {

          return (
            item.status !== "Done" &&
            item.status !== "Cancel"
          );

        }).length;


      // ---------------------------------------------
      // 统计充值待处理
      // ---------------------------------------------

      const rechargePending =
        (recharges || []).filter(item => {

          return (
            item.status !== "Done" &&
            item.status !== "Cancel"
          );

        }).length;


      // ---------------------------------------------
      // 总数量
      // ---------------------------------------------

      const totalPending =
        withdrawalPending +
        rechargePending;


      // ---------------------------------------------
      // 更新 W-D 红色数字
      // ---------------------------------------------

      if (!wdUnread) {
        return;
      }


      if (totalPending > 0) {

        wdUnread.textContent =
          totalPending > 99
            ? "99+"
            : totalPending;

        wdUnread.classList.remove(
          "hidden"
        );

      }
      else {

        wdUnread.textContent = "0";

        wdUnread.classList.add(
          "hidden"
        );

      }

    }
    catch (error) {

      console.error(
        "更新 W-D 未处理数量失败:",
        error
      );

    }

  }


  // =====================================================
  // TAB SWITCH
  // =====================================================

  withdrawTab?.addEventListener(
    "click",
    () => {

      withdrawTab.classList.add(
        "active"
      );

      depositTab?.classList.remove(
        "active"
      );


      withdrawContent?.classList.add(
        "active"
      );

      depositContent?.classList.remove(
        "active"
      );

    }
  );


  depositTab?.addEventListener(
    "click",
    () => {

      depositTab.classList.add(
        "active"
      );

      withdrawTab?.classList.remove(
        "active"
      );


      depositContent?.classList.add(
        "active"
      );

      withdrawContent?.classList.remove(
        "active"
      );

    }
  );


  // =====================================================
  // DATE FORMAT
  // =====================================================

  function formatDate(dateString) {

    const date =
      new Date(dateString);

    return date.getFullYear() + "-" +
      String(
        date.getMonth() + 1
      ).padStart(2, "0") + "-" +
      String(
        date.getDate()
      ).padStart(2, "0") + " " +
      String(
        date.getHours()
      ).padStart(2, "0") + ":" +
      String(
        date.getMinutes()
      ).padStart(2, "0") + ":" +
      String(
        date.getSeconds()
      ).padStart(2, "0");

  }


  // =====================================================
  // WITHDRAW
  // =====================================================

  const withdrawalsTableElement =
    document.getElementById(
      "withdrawalsTable"
    );


  const withdrawalsTable =
    withdrawalsTableElement
      ?.getElementsByTagName("tbody")[0];


  const withdrawalSearch =
    document.getElementById(
      "searchWithdrawalInput"
    );


  // =====================================================
  // FETCH WITHDRAWALS
  // =====================================================

  async function fetchWithdrawals() {

    if (!withdrawalsTable) {
      return;
    }


    const {
      data,
      error
    } =
      await supabaseClient
        .from("withdrawals")
        .select(`
          id,
          amount,
          wallet_address,
          status,
          created_at,
          users (
            username,
            platform_account
          )
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      console.error(
        "获取提现记录失败:",
        error
      );

      return;

    }


    displayWithdrawals(
      data || []
    );

  }


  // =====================================================
  // DISPLAY WITHDRAWALS
  // =====================================================

  function displayWithdrawals(
    withdrawals
  ) {

    if (!withdrawalsTable) {
      return;
    }


    withdrawalsTable.innerHTML = "";


    withdrawals.forEach(item => {

      const row =
        withdrawalsTable.insertRow();


      // Name
      row.insertCell(0).textContent =
        item.users?.username ||
        "未知用户";


      // Account
      row.insertCell(1).textContent =
        item.users?.platform_account ||
        "-";


      // Amount
      row.insertCell(2).textContent =
        item.amount;


      // Wallet Address
      const walletCell = row.insertCell(3);

      const walletWrapper = document.createElement("div");
      walletWrapper.className = "wd-wallet-wrapper";

      const walletText = document.createElement("span");
      walletText.className = "wd-wallet-address";
      walletText.textContent = item.wallet_address || "-";

      const copyBtn = document.createElement("button");
      copyBtn.className = "wd-copy-wallet";
      copyBtn.type = "button";
      copyBtn.title = "复制钱包地址";

      copyBtn.innerHTML = `
      <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
      >
          <rect
              x="8"
              y="8"
              width="11"
              height="11"
              rx="2"
              stroke="currentColor"
              stroke-width="1.8"
          />

          <path
              d="M16 8V6.5C16 5.67 15.33 5 14.5 5H6.5C5.67 5 5 5.67 5 6.5V14.5C5 15.33 5.67 16 6.5 16H8"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
          />
      </svg>
      `;

      copyBtn.addEventListener("click", async () => {

          const walletAddress =
              item.wallet_address || "";

          if (!walletAddress) {
              return;
          }

          try {

              await navigator.clipboard.writeText(
                  walletAddress
              );

              copyBtn.classList.add("copied");

              copyBtn.title = "已复制";

              setTimeout(() => {

                  copyBtn.classList.remove("copied");

                  copyBtn.title = "复制钱包地址";

              }, 1200);

          }
          catch (error) {

              console.error(
                  "复制钱包地址失败:",
                  error
              );

              // 备用复制方式
              const textarea =
                  document.createElement("textarea");

              textarea.value =
                  walletAddress;

              textarea.style.position =
                  "fixed";

              textarea.style.opacity =
                  "0";

              document.body.appendChild(
                  textarea
              );

              textarea.select();

              document.execCommand("copy");

              textarea.remove();

              copyBtn.classList.add("copied");

              setTimeout(() => {
                  copyBtn.classList.remove("copied");
              }, 1200);

          }

      });

      walletWrapper.appendChild(walletText);
      walletWrapper.appendChild(copyBtn);

      walletCell.appendChild(walletWrapper);


      // Status
      const statusCell =
        row.insertCell(4);


      statusCell.textContent =
        item.status;


      if (
        item.status === "Cancel"
      ) {

        statusCell.style.color =
          "red";

      }
      else if (
        item.status === "Done"
      ) {

        statusCell.style.color =
          "green";

      }
      else {

        statusCell.style.color =
          "orange";

      }


      // Created At
      row.insertCell(5).textContent =
        formatDate(
          item.created_at
        );


      // Actions
      const actionsCell =
        row.insertCell(6);


      // Reject
      const rejectBtn =
        document.createElement("button");

      rejectBtn.textContent =
        "Cancel";

      rejectBtn.className =
        "reject";

      rejectBtn.onclick =
        () =>
          updateWithdrawalStatus(
            item.id,
            "Cancel"
          );


      // Complete
      const completeBtn =
        document.createElement("button");

      completeBtn.textContent =
        "Done";

      completeBtn.className =
        "complete";

      completeBtn.onclick =
        () =>
          updateWithdrawalStatus(
            item.id,
            "Done"
          );


      // Delete
      const deleteBtn =
        document.createElement("button");

      deleteBtn.textContent =
        "删除";

      deleteBtn.className =
        "delete";

      deleteBtn.onclick =
        () =>
          deleteWithdrawal(
            item.id
          );


      actionsCell.appendChild(
        rejectBtn
      );

      actionsCell.appendChild(
        completeBtn
      );

      actionsCell.appendChild(
        deleteBtn
      );

    });

  }


  // =====================================================
  // WITHDRAW SEARCH
  // =====================================================

  withdrawalSearch?.addEventListener(
    "keyup",
    async () => {

      const keyword =
        withdrawalSearch.value.trim();


      let query =
        supabaseClient
          .from("withdrawals")
          .select(`
            id,
            amount,
            wallet_address,
            status,
            created_at,
            users (
              username,
              platform_account
            )
          `)
          .order(
            "created_at",
            {
              ascending: false
            }
          );


      if (keyword) {

        query =
          query.or(
            `users.username.ilike.%${keyword}%,users.platform_account.ilike.%${keyword}%,wallet_address.ilike.%${keyword}%`
          );

      }


      const {
        data,
        error
      } =
        await query;


      if (error) {

        console.error(
          "提现搜索失败:",
          error
        );

        return;

      }


      displayWithdrawals(
        data || []
      );

    }
  );


  // =====================================================
  // UPDATE WITHDRAWAL STATUS
  // =====================================================

  async function updateWithdrawalStatus(
    id,
    status
  ) {

    const {
      error
    } =
      await supabaseClient
        .from("withdrawals")
        .update({
          status
        })
        .eq(
          "id",
          id
        );


    if (error) {

      alert(
        "更新状态失败：" +
        error.message
      );

      return;

    }


    // 刷新提现列表
    await fetchWithdrawals();


    // 刷新 W-D 红色数字
    await updateWDUnread();

  }


  // =====================================================
  // DELETE WITHDRAWAL
  // =====================================================

  async function deleteWithdrawal(
    id
  ) {

    if (
      !confirm(
        "确定要删除这条记录吗？"
      )
    ) {

      return;

    }


    const {
      error
    } =
      await supabaseClient
        .from("withdrawals")
        .delete()
        .eq(
          "id",
          id
        );


    if (error) {

      alert(
        "删除失败：" +
        error.message
      );

      return;

    }


    // 刷新提现列表
    await fetchWithdrawals();


    // 刷新 W-D 红色数字
    await updateWDUnread();

  }


  // =====================================================
  // DEPOSIT / RECHARGE
  // =====================================================

  const rechargesTableElement =
    document.getElementById(
      "rechargesTable"
    );


  const rechargesTable =
    rechargesTableElement
      ?.getElementsByTagName("tbody")[0];


  const rechargeSearch =
    document.getElementById(
      "searchRechargeInput"
    );


  // =====================================================
  // FETCH RECHARGES
  // =====================================================

  async function fetchRecharges() {

    if (!rechargesTable) {
      return;
    }


    try {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("recharges")
          .select(`
            id,
            amount,
            recharge_url,
            status,
            created_at,
            platform_account,
            users!inner(uuid, username)
          `)
          .order(
            "created_at",
            {
              ascending: false
            }
          );


      if (error) {
        throw error;
      }


      displayRecharges(
        data || []
      );

    }
    catch (err) {

      console.error(
        "加载充值记录失败:",
        err
      );


      rechargesTable.innerHTML =
        `<tr>
          <td colspan="7" style="color:red">
            加载失败: ${err.message}
          </td>
        </tr>`;

    }

  }


  // =====================================================
  // DISPLAY RECHARGES
  // =====================================================

  function displayRecharges(
    recharges
  ) {

    if (!rechargesTable) {
      return;
    }


    rechargesTable.innerHTML = "";


    recharges.forEach(item => {

      const row =
        rechargesTable.insertRow();


      // Username
      row.insertCell(0).textContent =
        item.users?.username ||
        "未知用户";


      // Platform Account
      row.insertCell(1).textContent =
        item.platform_account ||
        "-";


      // Amount
      row.insertCell(2).textContent =
        item.amount;


      // Screenshot
      const screenshotCell =
        row.insertCell(3);


      const screenshotLink =
        document.createElement("a");

      screenshotLink.href =
        item.recharge_url || "#";

      screenshotLink.target =
        "_blank";

      screenshotLink.rel =
        "noopener noreferrer";

      screenshotLink.textContent =
        "查看截图";


      screenshotCell.appendChild(
        screenshotLink
      );


      // Status
      const statusCell =
        row.insertCell(4);


      statusCell.textContent =
        item.status;


      if (
        item.status === "Cancel"
      ) {

        statusCell.style.color =
          "red";

      }
      else if (
        item.status === "Done"
      ) {

        statusCell.style.color =
          "green";

      }
      else {

        statusCell.style.color =
          "orange";

      }


      // Created At
      row.insertCell(5).textContent =
        formatDate(
          item.created_at
        );


      // Actions
      const actionsCell =
        row.insertCell(6);


      // Reject
      const rejectBtn =
        document.createElement("button");

      rejectBtn.textContent =
        "Cancel";

      rejectBtn.className =
        "reject";

      rejectBtn.onclick =
        () =>
          updateRechargeStatus(
            item.id,
            "Cancel"
          );


      // Complete
      const completeBtn =
        document.createElement("button");

      completeBtn.textContent =
        "Done";

      completeBtn.className =
        "complete";

      completeBtn.onclick =
        () =>
          updateRechargeStatus(
            item.id,
            "Done"
          );


      // Delete
      const deleteBtn =
        document.createElement("button");

      deleteBtn.textContent =
        "删除";

      deleteBtn.className =
        "delete";

      deleteBtn.onclick =
        () =>
          deleteRecharge(
            item.id
          );


      actionsCell.appendChild(
        rejectBtn
      );

      actionsCell.appendChild(
        completeBtn
      );

      actionsCell.appendChild(
        deleteBtn
      );

    });

  }


  // =====================================================
  // UPDATE RECHARGE STATUS
  // =====================================================

  async function updateRechargeStatus(
    id,
    status
  ) {

    const {
      error
    } =
      await supabaseClient
        .from("recharges")
        .update({
          status
        })
        .eq(
          "id",
          id
        );


    if (error) {

      alert(
        "更新状态失败: " +
        error.message
      );

      return;

    }


    // 刷新充值列表
    await fetchRecharges();


    // 刷新 W-D 红色数字
    await updateWDUnread();

  }


  // =====================================================
  // DELETE RECHARGE
  // =====================================================

  async function deleteRecharge(
    id
  ) {

    if (
      !confirm(
        "确定要删除这条记录吗？"
      )
    ) {

      return;

    }


    const {
      error
    } =
      await supabaseClient
        .from("recharges")
        .delete()
        .eq(
          "id",
          id
        );


    if (error) {

      alert(
        "删除失败: " +
        error.message
      );

      return;

    }


    // 刷新充值列表
    await fetchRecharges();


    // 刷新 W-D 红色数字
    await updateWDUnread();

  }


  // =====================================================
  // RECHARGE SEARCH
  // =====================================================

  rechargeSearch?.addEventListener(
    "keyup",
    async () => {

      const keyword =
        rechargeSearch.value.trim();


      let query =
        supabaseClient
          .from("recharges")
          .select(`
            id,
            amount,
            recharge_url,
            status,
            created_at,
            platform_account,
            users!inner(uuid, username)
          `)
          .order(
            "created_at",
            {
              ascending: false
            }
          );


      if (keyword) {

        query =
          query.or(
            `users.username.ilike.%${keyword}%,platform_account.ilike.%${keyword}%`
          );

      }


      const {
        data,
        error
      } =
        await query;


      if (error) {

        console.error(
          "充值搜索失败:",
          error
        );

        return;

      }


      displayRecharges(
        data || []
      );

    }
  );


  // =====================================================
  // INIT
  // =====================================================

  fetchWithdrawals();

  fetchRecharges();

  // 初始化 W-D 红色数字
  updateWDUnread();

});
