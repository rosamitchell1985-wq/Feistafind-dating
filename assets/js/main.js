/* ==========================================================================
   Feistafind — main.js
   Shared front-end behaviour for the prototype.

   SECURITY NOTE FOR DEVELOPERS:
   This file is part of a front-end-only demo. Everything here runs in the
   visitor's browser and uses localStorage for demonstration. A production
   launch requires a secure backend: HTTPS, real authentication with
   password hashing, server-side validation, CSRF/XSS protection, rate
   limiting, secure sessions, authorization checks, secure file uploads,
   content moderation, abuse detection, and secure database storage.
   ========================================================================== */

(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     Shared namespace + tiny helpers
  ---------------------------------------------------------------------- */
  const SH = (window.SH = window.SH || {});

  SH.$ = (sel, ctx) => (ctx || document).querySelector(sel);
  SH.$$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  SH.store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem("sh:" + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem("sh:" + key, JSON.stringify(value));
      } catch (e) {
        /* storage may be unavailable (private mode) — fail silently in demo */
      }
    },
    remove(key) {
      try {
        localStorage.removeItem("sh:" + key);
      } catch (e) { /* ignore */ }
    },
  };

  SH.escapeHtml = function (str) {
    // Basic output encoding for demo rendering. Production apps must also
    // sanitize/encode server-side on both input and output.
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  /* ----------------------------------------------------------------------
     Demo member data — fictional people for demonstration only.
     Photos are AI-generated placeholders; replace with licensed imagery.
  ---------------------------------------------------------------------- */
  SH.members = [
    { id: "margaret", name: "Margaret", age: 62, location: "Portland, OR", photo: "assets/images/p-margaret.jpg",
      bio: "Retired librarian who loves long novels, short hikes, and strong coffee. Looking for someone to share Sunday mornings with.",
      interests: ["Books", "Walking", "Cooking"], goals: "Long-term companionship",
      lifestyle: "Early riser, non-smoker, one very spoiled cat", lookingFor: "A kind conversationalist who enjoys quiet evenings and the occasional road trip." },
    { id: "robert", name: "Robert", age: 67, location: "Austin, TX", photo: "assets/images/p-robert.jpg",
      bio: "Former engineer, current amateur jazz guitarist. I believe good conversation is the best hobby there is.",
      interests: ["Music", "Food", "Travel"], goals: "Dating, open to more",
      lifestyle: "Night owl, social, two grown kids", lookingFor: "Someone curious who laughs easily and enjoys live music." },
    { id: "linda", name: "Linda", age: 59, location: "Atlanta, GA", photo: "assets/images/p-linda.jpg",
      bio: "Community theatre volunteer and enthusiastic home baker. My garden is my happy place.",
      interests: ["Gardening", "Cooking", "Volunteering"], goals: "Friendship first",
      lifestyle: "Active, social butterfly, dog lover", lookingFor: "A warm-hearted friend to share theatre nights and farmers' markets." },
    { id: "james", name: "James", age: 71, location: "Seattle, WA", photo: "assets/images/p-james.jpg",
      bio: "Widower, retired teacher, and photography enthusiast. I travel light and laugh often.",
      interests: ["Photography", "Travel", "Nature"], goals: "Companionship",
      lifestyle: "Calm, healthy, loves rain walks", lookingFor: "A travel companion with patience for my many photo stops." },
    { id: "susan", name: "Susan", age: 64, location: "San Diego, CA", photo: "assets/images/p-susan.jpg",
      bio: "Yoga instructor, beach walker, and proud grandmother of three. Life is better near the ocean.",
      interests: ["Fitness", "Walking", "Art"], goals: "Dating",
      lifestyle: "Very active, vegetarian, early to bed", lookingFor: "Someone active who enjoys the outdoors and honest conversation." },
    { id: "david", name: "David", age: 69, location: "Denver, CO", photo: "assets/images/p-david.jpg",
      bio: "Retired park ranger. I know every trail in the county and the best diner pie in three states.",
      interests: ["Nature", "Walking", "Movies"], goals: "Long-term relationship",
      lifestyle: "Outdoorsy, handy, easy-going", lookingFor: "A partner for trails, road trips, and unhurried breakfasts." },
    { id: "helen", name: "Helen", age: 58, location: "Chicago, IL", photo: "assets/images/p-helen.jpg",
      bio: "Art history buff and weekend painter. I never miss a gallery opening or a good documentary.",
      interests: ["Art", "Movies", "Books"], goals: "Friendship, maybe more",
      lifestyle: "City dweller, museum member, tea over coffee", lookingFor: "Someone to wander museums with and debate the films afterwards." },
    { id: "frank", name: "Frank", age: 73, location: "Tampa, FL", photo: "assets/images/p-frank.jpg",
      bio: "Retired navy cook. I make a legendary seafood chowder and I'm learning ballroom dancing.",
      interests: ["Cooking", "Dancing", "Golf"], goals: "Companionship",
      lifestyle: "Social, punctual, terrible at golf but persistent", lookingFor: "A dance partner — on the floor and in the kitchen." },
    { id: "rosa", name: "Rosa", age: 66, location: "Albuquerque, NM", photo: "assets/images/p-rosa.jpg",
      bio: "Former nurse who now volunteers at the animal shelter. I grow chiles and roses with equal devotion.",
      interests: ["Gardening", "Pets", "Volunteering"], goals: "Friendship first",
      lifestyle: "Gentle routine, big family nearby", lookingFor: "A patient, kind person who likes animals and slow Sunday lunches." },
    { id: "arthur", name: "Arthur", age: 61, location: "Nashville, TN", photo: "assets/images/p-arthur.jpg",
      bio: "Cycling enthusiast and amateur songwriter. I retired early to have more time for both.",
      interests: ["Fitness", "Music", "Travel"], goals: "Dating, open to more",
      lifestyle: "Active, optimistic, early riser", lookingFor: "Someone who'll ride the greenway and stay for the live music after." },
  ];

  SH.interests = ["Travel", "Cooking", "Gardening", "Books", "Music", "Walking",
    "Photography", "Dancing", "Movies", "Art", "Golf", "Fitness",
    "Volunteering", "Pets", "Food", "Nature"];

  /* Likes persist locally for the demo */
  SH.getLikes = () => SH.store.get("likes", []);
  SH.isLiked = (id) => SH.getLikes().includes(id);
  SH.toggleLike = function (id) {
    const likes = SH.getLikes();
    const i = likes.indexOf(id);
    if (i >= 0) likes.splice(i, 1); else likes.push(id);
    SH.store.set("likes", likes);
    return i < 0;
  };

  SH.getBlocked = () => SH.store.get("blocked", []);
  SH.blockUser = function (id) {
    const b = SH.getBlocked();
    if (!b.includes(id)) b.push(id);
    SH.store.set("blocked", b);
  };

  /* ----------------------------------------------------------------------
     Toast notifications (demo)
  ---------------------------------------------------------------------- */
  function ensureToastRegion() {
    let region = SH.$(".toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "toast-region";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }
    return region;
  }

  const BELL_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';

  SH.toast = function (message) {
    const region = ensureToastRegion();
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = BELL_SVG + "<span></span>";
    el.querySelector("span").textContent = message;
    region.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity .3s ease";
      setTimeout(() => el.remove(), 320);
    }, 4200);
  };

  /* ----------------------------------------------------------------------
     Theme (light/dark) — stored per visitor, default follows OS setting
  ---------------------------------------------------------------------- */
  function initTheme() {
    const saved = SH.store.get("theme", null);
    const theme = saved || (window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  }

  function bindThemeToggles() {
    SH.$$("[data-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        SH.store.set("theme", next);
        SH.toast(next === "dark" ? "Dark mode on." : "Light mode on.");
      });
    });
  }

  /* ----------------------------------------------------------------------
     Mobile navigation
  ---------------------------------------------------------------------- */
  function initMobileNav() {
    const toggle = SH.$(".nav-toggle");
    const nav = SH.$(".main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ----------------------------------------------------------------------
     Age gate — simple confirmation, no ID collection (by design)
  ---------------------------------------------------------------------- */
  function initAgeGate() {
    if (SH.store.get("ageConfirmed", false)) return;
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop age-gate is-open";
    backdrop.innerHTML =
      '<div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="age-gate-title" aria-describedby="age-gate-desc">' +
      '<h2 id="age-gate-title">Before you continue</h2>' +
      '<p id="age-gate-desc"><strong>This website is intended for adults 18 and older.</strong></p>' +
      '<p class="text-soft">Please confirm your age to enter. Feistafind is designed for adults aged 50 and over.</p>' +
      '<div class="modal__actions">' +
      '<button type="button" class="btn btn--primary" data-age-yes>I am 18 or older</button>' +
      '<a class="btn btn--ghost" href="https://www.google.com" data-age-exit>Exit</a>' +
      "</div></div>";
    document.body.appendChild(backdrop);
    document.body.style.overflow = "hidden";
    const yes = backdrop.querySelector("[data-age-yes]");
    yes.focus();
    yes.addEventListener("click", () => {
      SH.store.set("ageConfirmed", true);
      backdrop.remove();
      document.body.style.overflow = "";
    });
  }

  /* ----------------------------------------------------------------------
     Cookie consent — no non-essential cookies are set in this prototype;
     the banner demonstrates a compliant pattern only.
  ---------------------------------------------------------------------- */
  function initCookieBanner() {
    if (SH.store.get("cookieConsent", null)) return;
    const el = document.createElement("div");
    el.className = "cookie-banner is-visible";
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", "Cookie consent");
    el.innerHTML =
      "<h2>Cookies on Feistafind</h2>" +
      "<p>We use only the storage needed to make this demo work. Optional preferences " +
      "(like your theme choice) are stored in your own browser. You can change your choice any time.</p>" +
      '<div class="cookie-banner__actions">' +
      '<button type="button" class="btn btn--primary btn--sm" data-cookie="all">Accept All</button>' +
      '<button type="button" class="btn btn--outline btn--sm" data-cookie="essential">Reject Non-Essential</button>' +
      '<button type="button" class="btn btn--ghost btn--sm" data-cookie="manage">Manage Preferences</button>' +
      "</div>";
    document.body.appendChild(el);
    el.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cookie]");
      if (!btn) return;
      const choice = btn.getAttribute("data-cookie");
      if (choice === "manage") {
        window.location.href = "cookie-policy.html";
        return;
      }
      SH.store.set("cookieConsent", { choice, at: new Date().toISOString() });
      el.remove();
      SH.toast("Your cookie preference was saved.");
    });
  }

  /* ----------------------------------------------------------------------
     Generic modal helper (report / block / confirm dialogs)
  ---------------------------------------------------------------------- */
  SH.openModal = function (html, opts) {
    opts = opts || {};
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop is-open";
    backdrop.innerHTML =
      '<div class="modal' + (opts.wide ? " modal--wide" : "") + '" role="dialog" aria-modal="true">' +
      '<button type="button" class="icon-btn modal__close" aria-label="Close dialog">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
      "</button>" + html + "</div>";
    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
    backdrop.querySelector(".modal__close").addEventListener("click", close);
    document.addEventListener("keydown", function onEsc(e) {
      if (e.key === "Escape" && document.body.contains(backdrop)) {
        close();
        document.removeEventListener("keydown", onEsc);
      }
    });
    backdrop.querySelector(".modal__close").focus();
    return { backdrop, close };
  };

  /* Report flow — front-end demonstration only */
  SH.openReportModal = function (targetName) {
    const { backdrop, close } = SH.openModal(
      "<h2>Report " + SH.escapeHtml(targetName) + "</h2>" +
      '<p class="text-soft">Reports are reviewed by the moderation team. In this prototype, ' +
      "your report is stored only in your own browser — no data is sent anywhere.</p>" +
      '<form id="report-form" novalidate>' +
      '<div class="field"><label for="report-reason">Reason</label>' +
      '<select id="report-reason" required>' +
      "<option value=''>Choose a reason…</option>" +
      "<option>Suspicious or scam behaviour</option><option>Harassment or abuse</option>" +
      "<option>Inappropriate content</option><option>Impersonation</option>" +
      "<option>Spam</option><option>Something else</option></select></div>" +
      '<div class="field"><label for="report-detail">What happened? <span class="hint">(optional)</span></label>' +
      '<textarea id="report-detail" placeholder="Describe what concerned you…"></textarea></div>' +
      '<div class="modal__actions">' +
      '<button type="submit" class="btn btn--primary">Submit report</button>' +
      '<button type="button" class="btn btn--ghost" data-cancel>Cancel</button></div></form>'
    );
    backdrop.querySelector("[data-cancel]").addEventListener("click", close);
    backdrop.querySelector("#report-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const reason = backdrop.querySelector("#report-reason");
      if (!reason.value) { reason.focus(); return; }
      const reports = SH.store.get("reports", []);
      reports.push({ target: targetName, reason: reason.value, at: new Date().toISOString() });
      SH.store.set("reports", reports);
      close();
      SH.toast("Thank you. Your report has been recorded for review.");
    });
  };

  /* Block flow */
  SH.openBlockModal = function (memberId, targetName, onBlocked) {
    const { backdrop, close } = SH.openModal(
      "<h2>Block " + SH.escapeHtml(targetName) + "?</h2>" +
      "<p class='text-soft'>Blocked members can no longer view your profile or message you. " +
      "You can manage blocked members in your settings.</p>" +
      '<div class="modal__actions">' +
      '<button type="button" class="btn btn--danger" data-confirm>Block ' + SH.escapeHtml(targetName) + "</button>" +
      '<button type="button" class="btn btn--ghost" data-cancel>Cancel</button></div>'
    );
    backdrop.querySelector("[data-cancel]").addEventListener("click", close);
    backdrop.querySelector("[data-confirm]").addEventListener("click", () => {
      SH.blockUser(memberId);
      close();
      SH.toast(targetName + " has been blocked.");
      if (typeof onBlocked === "function") onBlocked();
    });
  };

  /* ----------------------------------------------------------------------
     Like buttons (any element with data-like="<memberId>")
  ---------------------------------------------------------------------- */
  const HEART = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.7-10-9.3C.4 8.6 2.4 4.5 6.4 4.5c2.2 0 3.7 1.2 4.6 2.7.9-1.5 2.4-2.7 4.6-2.7 4 0 6 4.1 4.4 7.2C17.5 16.3 12 21 12 21z"/></svg>';

  function paintLike(btn) {
    const id = btn.getAttribute("data-like");
    const liked = SH.isLiked(id);
    btn.setAttribute("aria-pressed", String(liked));
    btn.setAttribute("aria-label", (liked ? "Unlike " : "Like ") + (btn.getAttribute("data-name") || "this profile"));
  }

  function initLikes() {
    SH.$$("[data-like]").forEach((btn) => {
      btn.classList.add("profile-card__like");
      if (!btn.innerHTML.trim()) btn.innerHTML = HEART;
      paintLike(btn);
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-like");
        const nowLiked = SH.toggleLike(id);
        paintLike(btn);
        SH.toast(nowLiked ? "You liked this profile." : "Like removed.");
      });
    });
  }

  /* ----------------------------------------------------------------------
     Interest chips (any .chip with aria-pressed)
  ---------------------------------------------------------------------- */
  function initChips() {
    SH.$$(".chip[aria-pressed]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const on = chip.getAttribute("aria-pressed") === "true";
        chip.setAttribute("aria-pressed", String(!on));
      });
    });
  }

  /* ----------------------------------------------------------------------
     FAQ accordion
  ---------------------------------------------------------------------- */
  function initFaq() {
    SH.$$(".faq-item").forEach((item) => {
      const q = SH.$(".faq-item__q", item);
      const a = SH.$(".faq-item__a", item);
      if (!q || !a) return;
      q.addEventListener("click", () => {
        const open = q.getAttribute("aria-expanded") === "true";
        q.setAttribute("aria-expanded", String(!open));
        a.style.maxHeight = open ? "0px" : a.scrollHeight + "px";
      });
    });
  }

  /* ----------------------------------------------------------------------
     Home search card → browse page with query params
  ---------------------------------------------------------------------- */
  function initSearchCard() {
    const form = SH.$("#discover-search");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const params = new URLSearchParams(new FormData(form));
      window.location.href = "browse.html?" + params.toString();
    });
  }

  /* ----------------------------------------------------------------------
     Demo notifications — only on the logged-in demo pages, clearly demo
  ---------------------------------------------------------------------- */
  function initDemoNotifications() {
    if (!document.body.hasAttribute("data-demo-notify")) return;
    const demo = [
      "You received a new message.",
      "Someone liked your profile.",
      "Your profile was updated.",
    ];
    let i = 0;
    const fire = () => {
      SH.toast(demo[i % demo.length] + " (demo)");
      i += 1;
    };
    setTimeout(fire, 2500);
    setInterval(fire, 26000);
  }

  /* Footer year */
  function initYear() {
    SH.$$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  /* Demo-auth awareness: swap header links when "logged in" (demo only) */
  function initAuthState() {
    const session = SH.store.get("session", null);
    if (!session) return;
    SH.$$("[data-auth-link='login']").forEach((a) => {
      a.textContent = "My Account";
      a.setAttribute("href", "profile.html?me=1");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    bindThemeToggles();
    initMobileNav();
    initAgeGate();
    initCookieBanner();
    initLikes();
    initChips();
    initFaq();
    initSearchCard();
    initDemoNotifications();
    initYear();
    initAuthState();
  });
})();
