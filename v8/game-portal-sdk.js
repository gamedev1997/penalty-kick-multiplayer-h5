// ===============================
// GAME ↔ PARENT Messaging Script
// ===============================

(function () {

  // Store init data globally
  window.GAME_INIT_DATA = null;
  window.GAME_OVER_SHOWN = false;

  // -------------------------------
  // Listen Parent Messages
  // -------------------------------
  function listenParentMessages() {

    window.addEventListener("message", function (event) {

      const data = event.data;

      if (!data || !data.type) return;

      switch (data.type) {

        case "GAME_INIT":

          // Store payload
          window.GAME_INIT_DATA = data.payload || data;
          window.GAME_AUTO_START = true; // Flag for auto-start

          console.log("🎮 GAME_INIT received:");
          console.log(window.GAME_INIT_DATA);

          // Extract and store player avatar from init data
          if (typeof CAvatarManager !== 'undefined') {
            var avatarFile = window.GAME_INIT_DATA.avatar || (window.GAME_INIT_DATA.user && window.GAME_INIT_DATA.user.avatar) || window.GAME_INIT_DATA.profileImage || null;
            CAvatarManager.setMyAvatar(avatarFile);
            CAvatarManager.preloadAll();
          }

          break;

        case "GAME_READY":
        case "GAME_END":
          // Ignore own messages posted when running standalone
          break;

        default:
          console.log("📩 Unknown message received:", data);
      }

    });

  }

  // -------------------------------
  // Send GAME_READY
  // -------------------------------
  function sendGameReady() {

    if (window.parent) {

      window.parent.postMessage(
        { type: "GAME_READY" },
        "*"
      );

      console.log("🚀 GAME_READY sent to parent");

    } else {
      console.warn("No parent window found");
    }

  }

  // -------------------------------
  // Init Function
  // -------------------------------
  function initGameMessaging() {

    listenParentMessages();
    sendGameReady();

  }

  // -------------------------------
  // Auto Init on Load
  // -------------------------------
  window.addEventListener("load", initGameMessaging);

  

})();

// =====================================
// SEND SCORE FUNCTION
// =====================================

// =====================================
// FINAL DYNAMIC COMPLETE GAMEPLAY CALL
// =====================================
async function sendScore(rank, winnerName) {

  console.log("🏁 sendScore called with rank:", rank, "winnerName:", winnerName);

  const initData = window.GAME_INIT_DATA;
  if (!initData) {
    console.error("GAME_INIT_DATA not found");
    return;
  }

  const baseUrl = initData.baseUrl;
  const token   = initData.token;
  const user    = initData.user;
  const isWinner = rank === 1;

  const players = [{
    id: user.id,
    name: winnerName || user.name,
    winner: isWinner,
    score: isWinner ? 1 : 0
  }];

  const payload = {
    game_code: "football_multiplayer",
    room_code: initData.roomNumber || null,
    token_amount: initData.payAmount,
    tournament_id: null,
    creator_id: user.id,
    winner_type: "single",
    players: players
  };

  // Not rank 1 - only postMessage, skip API
  if (!isWinner) {
    console.log("⛔ Not rank 1 - skipping API, sending postMessage only");
    gameoverPostMessage(payload);
    return;
  }

  try {

    const apiUrl = `${baseUrl}/api/multiplayer-games/complete-gameplay`;

    console.log("📤 Sending Gameplay Payload:");
    console.log(payload);
    console.log("token:", token);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON: " + text);
    }

    console.log("✅ Gameplay Submitted:");
    console.log(result);

    gameoverPostMessage(payload);

    return result;

  } catch (error) {

    console.error("❌ Gameplay Submit Error:", error);

  }

}

function gameoverPostMessage(payload) {
  console.log("🏁 Posting GAME_END message to parent");

  window.parent.postMessage(
  {
    type: "GAME_END",
    event: "GAME_COMPLETED",
    payload: payload
  },
  "*"
);

}



// new send score function for multiplayer gameplay completion with players data





// ===========================

