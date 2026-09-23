/* ==========================================================================
   Feistafind — messages.js
   Front-end messaging demo. Messages are stored in the visitor's own
   browser (localStorage) and are NOT sent anywhere.

   PRODUCTION NOTE: a real messaging system requires a secure server with
   authentication, authorization (so users can only read their own
   conversations), encryption in transit, abuse prevention, rate limiting,
   content moderation, and secure database storage. Never build messaging
   that trusts the client.
   ========================================================================== */

(function () {
  "use strict";
  const SH = window.SH;
  if (!SH) return;

  const layout = SH.$("#messages-app");
  if (!layout) return;

  /* Seed demo conversations on first visit */
  function seed() {
    const existing = SH.store.get("messages", null);
    if (existing) return existing;
    const now = Date.now();
    const seeded = {
      margaret: [
        { from: "them", text: "Hello! I saw you enjoy walking too. Have you tried the riverside trail?", at: now - 1000 * 60 * 62 },
        { from: "me", text: "Hi Margaret! Yes, it is lovely in the mornings. The herons near the bridge are my favourite part.", at: now - 1000 * 60 * 55 },
        { from: "them", text: "Oh, I know exactly the spot you mean. I usually stop at the little café afterwards.", at: now - 1000 * 60 * 41 },
      ],
      robert: [
        { from: "them", text: "Thanks for the like! Your profile made me smile — especially the part about Sunday breakfasts.", at: now - 1000 * 60 * 60 * 5 },
        { from: "me", text: "That is kind of you to say. I make a decent pancake. How is the jazz guitar coming along?", at: now - 1000 * 60 * 60 * 4 },
      ],
      linda: [
        { from: "them", text: "The community theatre is doing Our Town next month. You should come see it!", at: now - 1000 * 60 * 60 * 26 },
      ],
    };
    SH.store.set("messages", seeded);
    return seeded;
  }

  let threads = seed();
  let activeId = null;

  const params = new URLSearchParams(window.location.search);
  const requested = params.get("with");

  function memberName(id) {
    const m = SH.members.find((x) => x.id === id);
    return m ? m.name : id;
  }
  function memberPhoto(id) {
    const m = SH.members.find((x) => x.id === id);
    return m ? m.photo : "assets/images/p-margaret.jpg";
  }
  function fmtTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) +
      " · " + new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
  }

  /* If arriving from a profile's "Message" button, ensure a thread exists */
  if (requested && SH.members.some((m) => m.id === requested) && !threads[requested]) {
    threads[requested] = [];
    SH.store.set("messages", threads);
  }

  function threadIds() {
    return Object.keys(threads).filter((id) => !SH.getBlocked().includes(id));
  }

  function renderList() {
    const ul = SH.$("#convo-list");
    const ids = threadIds();
    if (!ids.length) {
      ul.innerHTML = '<li style="padding:24px" class="text-soft">No conversations yet. Visit <a href="browse.html">Discover</a> to meet someone.</li>';
      return;
    }
    ul.innerHTML = ids
      .map((id) => {
        const msgs = threads[id];
        const last = msgs[msgs.length - 1];
        return (
          '<li><button type="button" class="convo-item" data-thread="' + id + '" aria-current="' + (id === activeId) + '">' +
          '<img src="' + memberPhoto(id) + '" alt="">' +
          "<span><span class='convo-item__name'>" + SH.escapeHtml(memberName(id)) + "</span>" +
          "<span class='convo-item__preview'>" + (last ? SH.escapeHtml(last.text) : "Say hello…") + "</span></span>" +
          (last ? "<span class='convo-item__time'>" + fmtTime(last.at).split("·")[1].trim() + "</span>" : "") +
          "</button></li>"
        );
      })
      .join("");
    SH.$$(".convo-item", ul).forEach((btn) => {
      btn.addEventListener("click", () => { setActive(btn.getAttribute("data-thread")); });
    });
  }

  function renderChat() {
    const head = SH.$("#chat-head");
    const scroll = SH.$("#chat-scroll");
    if (!activeId) {
      head.innerHTML = '<p class="text-soft mb-0">Choose a conversation to begin.</p>';
      scroll.innerHTML = "";
      return;
    }
    head.innerHTML =
      '<img src="' + memberPhoto(activeId) + '" alt="">' +
      "<div><div class='chat__head-name'>" + SH.escapeHtml(memberName(activeId)) + "</div>" +
      "<div class='chat__status'><span class='chat__status-dot' aria-hidden='true'></span> Online (demo status)</div></div>" +
      "<div class='chat__head-actions'>" +
      '<button type="button" class="icon-btn" id="chat-report" aria-label="Report this member" title="Report">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V4h13l-2 4 2 4H4"/></svg></button>' +
      '<button type="button" class="icon-btn" id="chat-block" aria-label="Block this member" title="Block">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg></button>' +
      '<button type="button" class="icon-btn" id="chat-delete" aria-label="Delete this conversation" title="Delete conversation">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m1 0-1 14H8L7 6"/></svg></button>' +
      "</div>";

    const msgs = threads[activeId] || [];
    scroll.innerHTML = msgs.length
      ? msgs.map((m) =>
          '<div class="msg msg--' + (m.from === "me" ? "me" : "them") + '">' +
          '<div class="msg__bubble">' + SH.escapeHtml(m.text) + "</div>" +
          '<div class="msg__time">' + fmtTime(m.at) + "</div></div>"
        ).join("")
      : '<div class="empty-state" style="margin:auto"><h3>Start the conversation</h3><p>A friendly hello is a great first message. Keep it kind and on-platform.</p></div>';
    scroll.scrollTop = scroll.scrollHeight;

    SH.$("#chat-report").addEventListener("click", () => SH.openReportModal(memberName(activeId)));
    SH.$("#chat-block").addEventListener("click", () => {
      SH.openBlockModal(activeId, memberName(activeId), () => {
        activeId = threadIds()[0] || null;
        renderAll();
      });
    });
    SH.$("#chat-delete").addEventListener("click", () => {
      const { backdrop, close } = SH.openModal(
        "<h2>Delete this conversation?</h2>" +
        "<p class='text-soft'>This removes the conversation from this browser only.</p>" +
        '<div class="modal__actions"><button type="button" class="btn btn--danger" data-confirm>Delete conversation</button>' +
        '<button type="button" class="btn btn--ghost" data-cancel>Cancel</button></div>'
      );
      backdrop.querySelector("[data-cancel]").addEventListener("click", close);
      backdrop.querySelector("[data-confirm]").addEventListener("click", () => {
        delete threads[activeId];
        SH.store.set("messages", threads);
        activeId = threadIds()[0] || null;
        close();
        renderAll();
        SH.toast("Conversation deleted.");
      });
    });
  }

  function setActive(id) {
    activeId = id;
    renderAll();
  }

  function renderAll() {
    renderList();
    renderChat();
  }

  /* Composer */
  const form = SH.$("#composer");
  const input = SH.$("#composer-input");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!activeId) { SH.toast("Choose a conversation first."); return; }
    const text = input.value.trim();
    if (!text) return;
    if (text.length > 1000) { SH.toast("Please keep messages under 1000 characters."); return; }
    threads[activeId].push({ from: "me", text, at: Date.now() });
    SH.store.set("messages", threads);
    input.value = "";
    renderAll();

    // Demo reply: clearly simulated, keeps the prototype feeling alive.
    setTimeout(() => {
      const replies = [
        "That sounds wonderful — tell me more!",
        "I would enjoy that. When works for you?",
        "What a lovely thought. You made my afternoon.",
        "Ha! That is exactly the sort of thing I would do too.",
      ];
      if (!threads[activeId]) return;
      threads[activeId].push({ from: "them", text: replies[Math.floor(Math.random() * replies.length)], at: Date.now() });
      SH.store.set("messages", threads);
      renderAll();
      SH.toast("You received a new message. (demo)");
    }, 2400);
  });

  /* Emoji picker */
  const emojiBtn = SH.$("#emoji-btn");
  const emojiPop = SH.$("#emoji-pop");
  const EMOJIS = ["😊", "😄", "🙂", "😉", "👍", "❤️", "🌷", "☕", "🌞", "🎶", "📚", "🥾"];
  emojiPop.innerHTML = EMOJIS.map((e) => '<button type="button">' + e + "</button>").join("");
  emojiBtn.addEventListener("click", () => {
    const open = emojiPop.classList.toggle("is-open");
    emojiBtn.setAttribute("aria-expanded", String(open));
  });
  emojiPop.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    input.value += b.textContent;
    input.focus();
  });
  document.addEventListener("click", (e) => {
    if (!emojiPop.contains(e.target) && e.target !== emojiBtn && !emojiBtn.contains(e.target)) {
      emojiPop.classList.remove("is-open");
      emojiBtn.setAttribute("aria-expanded", "false");
    }
  });

  /* Initial state */
  activeId = requested && threads[requested] ? requested : threadIds()[0] || null;
  renderAll();
})();
