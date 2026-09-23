/* ==========================================================================
   Feistafind — profile.js
   Discover page (search + filters + cards), profile detail page, and the
   profile settings panels. All data is fictional demo content held in the
   visitor's browser (localStorage). A production build must replace this
   with secure server APIs, authorization checks, and a real database.
   ========================================================================== */

(function () {
  "use strict";
  const SH = window.SH;
  if (!SH) return;

  const HEART = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.7-10-9.3C.4 8.6 2.4 4.5 6.4 4.5c2.2 0 3.7 1.2 4.6 2.7.9-1.5 2.4-2.7 4.6-2.7 4 0 6 4.1 4.4 7.2C17.5 16.3 12 21 12 21z"/></svg>';

  /* ======================================================================
     DISCOVER / BROWSE PAGE
  ====================================================================== */
  const resultsEl = SH.$("#results");
  if (resultsEl) {
    const countEl = SH.$("#results-count");
    const filtersForm = SH.$("#filters-form");
    const passed = new Set();

    function readFilters() {
      const fd = new FormData(filtersForm);
      const interests = SH.$$(".chip[aria-pressed='true']", filtersForm).map((c) => c.dataset.interest);
      return {
        q: (fd.get("q") || "").toString().trim().toLowerCase(),
        min: parseInt(fd.get("age-min"), 10) || 50,
        max: parseInt(fd.get("age-max"), 10) || 90,
        location: (fd.get("location") || "").toString().trim().toLowerCase(),
        goals: (fd.get("goals") || "").toString(),
        seeking: (fd.get("seeking") || "").toString(),
        interests,
      };
    }

    function match(m, f) {
      if (SH.getBlocked().includes(m.id)) return false;
      if (m.age < f.min || m.age > f.max) return false;
      if (f.location && !m.location.toLowerCase().includes(f.location)) return false;
      if (f.goals && m.goals.toLowerCase().indexOf(f.goals.toLowerCase()) === -1) return false;
      if (f.q) {
        const hay = (m.name + " " + m.bio + " " + m.location + " " + m.interests.join(" ")).toLowerCase();
        if (hay.indexOf(f.q) === -1) return false;
      }
      if (f.interests.length && !f.interests.some((i) => m.interests.includes(i))) return false;
      return true;
    }

    function cardHtml(m) {
      const liked = SH.isLiked(m.id);
      return (
        '<article class="profile-card" data-card="' + m.id + '">' +
          '<div class="profile-card__photo">' +
            '<img src="' + m.photo + '" alt="Portrait photo of ' + SH.escapeHtml(m.name) + ', ' + m.age + '" loading="lazy">' +
            '<button type="button" class="profile-card__like" data-like="' + m.id + '" data-name="' + SH.escapeHtml(m.name) + '" aria-pressed="' + liked + '">' + HEART + "</button>" +
          "</div>" +
          '<div class="profile-card__body">' +
            '<h3 class="profile-card__name">' + SH.escapeHtml(m.name) + ", " + m.age + "</h3>" +
            '<p class="profile-card__meta">' + SH.escapeHtml(m.location) + ' · <span class="badge badge--demo"></span></p>' +
            '<p class="profile-card__bio">' + SH.escapeHtml(m.bio) + "</p>" +
            '<div class="profile-card__tags">' +
              m.interests.map((i) => '<span class="badge">' + SH.escapeHtml(i) + "</span>").join("") +
            "</div>" +
            '<div class="profile-card__actions">' +
              '<a class="btn btn--outline btn--sm" href="profile.html?id=' + m.id + '">View Profile</a>' +
              '<button type="button" class="btn btn--ghost btn--sm" data-pass="' + m.id + '">Pass</button>' +
            "</div>" +
          "</div>" +
        "</article>"
      );
    }

    function render() {
      const f = readFilters();
      const matches = SH.members.filter((m) => match(m, f) && !passed.has(m.id));
      resultsEl.innerHTML = matches.length
        ? matches.map(cardHtml).join("")
        : '<div class="empty-state" style="grid-column:1/-1"><h3>No matches right now</h3><p>Try widening your age range or clearing some filters. New demo members join often.</p></div>';
      countEl.textContent = matches.length + (matches.length === 1 ? " profile" : " profiles") + " found";

      // Wire like buttons (delegate would also work; direct binding is fine here)
      SH.$$("[data-like]", resultsEl).forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-like");
          const now = SH.toggleLike(id);
          btn.setAttribute("aria-pressed", String(now));
          SH.toast(now ? "You liked " + (btn.getAttribute("data-name") || "this profile") + "." : "Like removed.");
        });
      });
      SH.$$("[data-pass]", resultsEl).forEach((btn) => {
        btn.addEventListener("click", () => {
          passed.add(btn.getAttribute("data-pass"));
          render();
          SH.toast("Passed. We will keep looking.");
        });
      });
    }

    // Pre-fill from homepage search query string
    const params = new URLSearchParams(window.location.search);
    if (params.get("location")) filtersForm.querySelector("[name='location']").value = params.get("location");
    if (params.get("seeking")) filtersForm.querySelector("[name='seeking']").value = params.get("seeking");
    if (params.get("age")) {
      const parts = params.get("age").split("-");
      if (parts[0]) filtersForm.querySelector("[name='age-min']").value = parts[0];
      if (parts[1]) filtersForm.querySelector("[name='age-max']").value = parts[1];
    }
    if (params.get("interests")) {
      const wanted = params.get("interests").split(",");
      SH.$$(".chip", filtersForm).forEach((c) => {
        if (wanted.includes(c.dataset.interest)) c.setAttribute("aria-pressed", "true");
      });
    }

    filtersForm.addEventListener("input", render);
    filtersForm.addEventListener("submit", (e) => { e.preventDefault(); render(); });
    SH.$("#filters-reset").addEventListener("click", () => {
      filtersForm.reset();
      SH.$$(".chip", filtersForm).forEach((c) => c.setAttribute("aria-pressed", "false"));
      render();
    });
    render();
  }

  /* ======================================================================
     PROFILE DETAIL PAGE
  ====================================================================== */
  const profileRoot = SH.$("#profile-root");
  if (profileRoot) {
    const params = new URLSearchParams(window.location.search);
    const isMe = params.get("me") === "1";
    const id = params.get("id") || "margaret";
    const member = SH.members.find((m) => m.id === id);

    if (isMe) {
      const me = SH.store.get("myProfile", null);
      const session = SH.store.get("session", null);
      const name = (me && me.name) || (session && session.name) || "Demo Member";
      profileRoot.innerHTML =
        '<div class="profile-hero"><div class="profile-hero__photo">' +
        (me && me.photo
          ? '<img src="' + me.photo + '" alt="Your profile photo">'
          : '<div style="aspect-ratio:1/1;border-radius:24px;background:var(--wine-tint);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:5rem;color:var(--wine);" aria-hidden="true">' +
            SH.escapeHtml(name.charAt(0).toUpperCase()) + "</div>") +
        "</div><div>" +
        '<span class="badge badge--demo">Demo account</span>' +
        "<h1>" + SH.escapeHtml(name) + "</h1>" +
        '<p class="text-soft">' + SH.escapeHtml((me && me.location) || "Your location") + "</p>" +
        '<div class="notice notice--info"><p><strong>This is your .</strong> ' +
        "Everything here is stored only in your browser. On a live platform, this page would be served securely from your account.</p></div>" +
        (me && me.bio ? "<h2 class='mt-3'>About me</h2><p>" + SH.escapeHtml(me.bio) + "</p>" : "") +
        (me && me.interests && me.interests.length
          ? '<h2 class="mt-3">Interests</h2><div class="chip-set">' +
            me.interests.map((i) => '<span class="badge">' + SH.escapeHtml(i) + "</span>").join("") + "</div>"
          : "") +
        '<div class="profile-hero__actions">' +
        '<a class="btn btn--primary" href="profile.html#settings">Profile Settings</a>' +
        '<a class="btn btn--outline" href="messages.html">Messages</a>' +
        '<button type="button" class="btn btn--ghost" id="sign-out">Sign out</button>' +
        "</div></div></div>" +
        settingsHtml();

      SH.$("#sign-out").addEventListener("click", () => {
        SH.store.remove("session");
        SH.toast("Signed out (demo).");
        setTimeout(() => { window.location.href = "index.html"; }, 600);
      });
      initSettings(true);
    } else if (member) {
      const liked = SH.isLiked(member.id);
      document.title = member.name + ", " + member.age + " | Feistafind";
      profileRoot.innerHTML =
        '<div class="profile-hero"><div class="profile-hero__photo">' +
        '<img src="' + member.photo + '" alt="Portrait photo of ' + SH.escapeHtml(member.name) + ", " + member.age + '">' +
        "</div><div>" +
        '<span class="badge badge--demo"></span>' +
        "<h1>" + SH.escapeHtml(member.name) + ", " + member.age + "</h1>" +
        '<p class="text-soft">' + SH.escapeHtml(member.location) + ' · general area only</p>' +
        '<div class="profile-hero__actions">' +
        '<button type="button" class="btn btn--primary" id="p-like" aria-pressed="' + liked + '">' +
        (liked ? "Liked" : "Like") + "</button>" +
        '<a class="btn btn--outline" href="messages.html?with=' + member.id + '">Message</a>' +
        '<button type="button" class="btn btn--ghost" id="p-block">Block</button>' +
        '<button type="button" class="btn btn--ghost" id="p-report">Report</button>' +
        "</div>" +
        '<dl class="profile-facts">' +
        '<div class="fact"><dt>Looking for</dt><dd>' + SH.escapeHtml(member.goals) + "</dd></div>" +
        '<div class="fact"><dt>Lifestyle</dt><dd>' + SH.escapeHtml(member.lifestyle) + "</dd></div>" +
        '<div class="fact"><dt>Interests</dt><dd>' + member.interests.map(SH.escapeHtml).join(", ") + "</dd></div>" +
        "</dl></div></div>" +
        '<div class="section" style="padding-top:48px">' +
        '<div class="grid grid--2">' +
        '<div class="card"><h2>About ' + SH.escapeHtml(member.name) + "</h2><p>" + SH.escapeHtml(member.bio) + "</p>" +
        "<h3>Hoping to meet</h3><p>" + SH.escapeHtml(member.lookingFor) + "</p></div>" +
        '<div class="card"><h2>Conversation starters</h2><ul class="convo-starters">' +
        "<li>Ask " + SH.escapeHtml(member.name) + " about their interest in " + SH.escapeHtml(member.interests[0].toLowerCase()) + ".</li>" +
        "<li>Share your favourite spot in " + SH.escapeHtml(member.location.split(",")[0]) + " and ask about theirs.</li>" +
        "<li>Ask what a perfect slow Sunday looks like for them.</li>" +
        "</ul>" +
        '<p class="text-soft mb-0" style="font-size:.95rem">Tip: keep early conversations on the platform and never share financial details.</p>' +
        "</div></div></div>";

      SH.$("#p-like").addEventListener("click", function () {
        const now = SH.toggleLike(member.id);
        this.setAttribute("aria-pressed", String(now));
        this.textContent = now ? "Liked" : "Like";
        SH.toast(now ? "You liked " + member.name + "." : "Like removed.");
      });
      SH.$("#p-block").addEventListener("click", () => {
        SH.openBlockModal(member.id, member.name, () => { window.location.href = "browse.html"; });
      });
      SH.$("#p-report").addEventListener("click", () => SH.openReportModal(member.name));
    } else {
      profileRoot.innerHTML =
        '<div class="empty-state"><h2>Profile not found</h2><p>This  does not exist. <a href="browse.html">Back to Discover</a>.</p></div>';
    }
  }

  /* ======================================================================
     SETTINGS (rendered on profile.html?me=1 and reachable via #settings)
  ====================================================================== */
  function settingsHtml() {
    const blocked = SH.getBlocked();
    const blockedNames = blocked
      .map((id) => { const m = SH.members.find((x) => x.id === id); return m ? m.name : id; });
    return (
      '<section class="section" id="settings" style="padding-bottom:40px">' +
      "<h2>Profile settings</h2>" +
      '<div class="settings-layout">' +
      '<nav class="settings-nav" aria-label="Settings sections"><ul>' +
      '<li><a href="#settings" data-panel="edit" aria-current="true">Edit profile</a></li>' +
      '<li><a href="#settings" data-panel="password">Change password</a></li>' +
      '<li><a href="#settings" data-panel="privacy">Privacy settings</a></li>' +
      '<li><a href="#settings" data-panel="notifications">Notification settings</a></li>' +
      '<li><a href="#settings" data-panel="email">Email preferences</a></li>' +
      '<li><a href="#settings" data-panel="blocked">Blocked users</a></li>' +
      '<li><a href="#settings" data-panel="delete">Delete account</a></li>' +
      "</ul></nav>" +
      "<div>" +
      '<div class="settings-panel is-active card" data-panel-id="edit">' +
      "<h3>Edit profile</h3>" +
      '<form id="edit-form"><div class="form-row">' +
      '<div class="field"><label for="edit-name">First name</label><input id="edit-name" type="text"></div>' +
      '<div class="field"><label for="edit-location">Location</label><input id="edit-location" type="text"></div></div>' +
      '<div class="field"><label for="edit-bio">About me</label><textarea id="edit-bio"></textarea></div>' +
      '<button class="btn btn--primary" type="submit">Save changes</button></form></div>' +

      '<div class="settings-panel card" data-panel-id="password">' +
      "<h3>Change password</h3>" +
      '<div class="notice notice--info mb-2"><p>Demo only — there is no real password to change. Production requires a secure backend with password hashing.</p></div>' +
      '<form id="pw-form"><div class="field"><label for="pw-current">Current password</label><input id="pw-current" type="password" autocomplete="current-password"></div>' +
      '<div class="field"><label for="pw-new">New password</label><input id="pw-new" type="password" autocomplete="new-password"></div>' +
      '<button class="btn btn--primary" type="submit">Update password</button></form></div>' +

      '<div class="settings-panel card" data-panel-id="privacy">' +
      "<h3>Privacy settings</h3>" +
      '<label class="checkbox"><input type="checkbox" checked> <span>Show my profile in search results</span></label>' +
      '<label class="checkbox"><input type="checkbox" checked> <span>Show when I am online</span></label>' +
      '<label class="checkbox"><input type="checkbox"> <span>Only show my profile to members I have liked</span></label>' +
      '<button class="btn btn--primary mt-2" data-save-pref type="button">Save privacy settings</button></div>' +

      '<div class="settings-panel card" data-panel-id="notifications">' +
      "<h3>Notification settings</h3>" +
      '<label class="checkbox"><input type="checkbox" checked> <span>New messages</span></label>' +
      '<label class="checkbox"><input type="checkbox" checked> <span>New likes</span></label>' +
      '<label class="checkbox"><input type="checkbox"> <span>Weekly matches digest</span></label>' +
      '<button class="btn btn--primary mt-2" data-save-pref type="button">Save notification settings</button></div>' +

      '<div class="settings-panel card" data-panel-id="email">' +
      "<h3>Email preferences</h3>" +
      '<label class="checkbox"><input type="checkbox" checked> <span>Product news and tips</span></label>' +
      '<label class="checkbox"><input type="checkbox"> <span>Community events near me</span></label>' +
      '<label class="checkbox"><input type="checkbox"> <span>Unsubscribe from all non-essential email</span></label>' +
      '<button class="btn btn--primary mt-2" data-save-pref type="button">Save email preferences</button></div>' +

      '<div class="settings-panel card" data-panel-id="blocked">' +
      "<h3>Blocked users</h3>" +
      (blockedNames.length
        ? "<ul>" + blockedNames.map((n) => "<li>" + SH.escapeHtml(n) + "</li>").join("") + "</ul>" +
          '<button class="btn btn--ghost" id="unblock-all" type="button">Unblock all</button>'
        : '<p class="text-soft">You have not blocked anyone.</p>') +
      "</div>" +

      '<div class="settings-panel card" data-panel-id="delete">' +
      "<h3>Delete account</h3>" +
      '<div class="notice notice--danger mb-2"><p><strong>This is permanent.</strong> Deleting removes your , messages, and likes from this browser.</p></div>' +
      '<button class="btn btn--danger" id="delete-account" type="button">Delete my account</button></div>' +
      "</div></div></section>"
    );
  }

  function initSettings(prefill) {
    const links = SH.$$(".settings-nav a");
    const panels = SH.$$(".settings-panel");
    links.forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        links.forEach((x) => x.removeAttribute("aria-current"));
        a.setAttribute("aria-current", "true");
        panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panelId === a.dataset.panel));
      });
    });

    if (prefill) {
      const me = SH.store.get("myProfile", {}) || {};
      if (SH.$("#edit-name")) SH.$("#edit-name").value = me.name || "";
      if (SH.$("#edit-location")) SH.$("#edit-location").value = me.location || "";
      if (SH.$("#edit-bio")) SH.$("#edit-bio").value = me.bio || "";
    }

    const editForm = SH.$("#edit-form");
    if (editForm) {
      editForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const me = SH.store.get("myProfile", {}) || {};
        me.name = SH.$("#edit-name").value.trim();
        me.location = SH.$("#edit-location").value.trim();
        me.bio = SH.$("#edit-bio").value.trim();
        SH.store.set("myProfile", me);
        SH.toast("Your profile was updated.");
      });
    }

    const pwForm = SH.$("#pw-form");
    if (pwForm) {
      pwForm.addEventListener("submit", (e) => {
        e.preventDefault();
        pwForm.reset();
        SH.toast("Password updated (demo only — nothing was stored).");
      });
    }

    SH.$$("[data-save-pref]").forEach((b) =>
      b.addEventListener("click", () => SH.toast("Your preferences were saved."))
    );

    const unblock = SH.$("#unblock-all");
    if (unblock) {
      unblock.addEventListener("click", () => {
        SH.store.set("blocked", []);
        SH.toast("All blocked users were unblocked.");
        setTimeout(() => window.location.reload(), 700);
      });
    }

    const del = SH.$("#delete-account");
    if (del) {
      del.addEventListener("click", () => {
        const { backdrop, close } = SH.openModal(
          "<h2>Delete your account?</h2>" +
          "<p class='text-soft'>This removes your , messages, likes, and settings from this browser. " +
          "Type <strong>DELETE</strong> to confirm.</p>" +
          '<div class="field"><label for="delete-confirm">Type DELETE to confirm</label>' +
          '<input id="delete-confirm" type="text" autocomplete="off"></div>' +
          '<div class="modal__actions">' +
          '<button type="button" class="btn btn--danger" data-confirm disabled>Permanently delete</button>' +
          '<button type="button" class="btn btn--ghost" data-cancel>Keep my account</button></div>'
        );
        const input = backdrop.querySelector("#delete-confirm");
        const confirmBtn = backdrop.querySelector("[data-confirm]");
        input.focus();
        input.addEventListener("input", () => { confirmBtn.disabled = input.value.trim() !== "DELETE"; });
        backdrop.querySelector("[data-cancel]").addEventListener("click", close);
        confirmBtn.addEventListener("click", () => {
          ["session", "myProfile", "likes", "blocked", "messages", "reports"].forEach((k) => SH.store.remove(k));
          SH.toast("Your demo account was deleted.");
          setTimeout(() => { window.location.href = "index.html"; }, 800);
        });
      });
    }
  }
})();
