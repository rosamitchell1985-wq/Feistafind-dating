/* ==========================================================================
   Feistafind — auth.js
   Demo authentication & form validation (front-end only).

   IMPORTANT SECURITY NOTE:
   This prototype uses localStorage only to *demonstrate* what a signed-in
   state feels like. Passwords entered here are NEVER stored — the demo
   "account" is fictional. A real service must never store passwords in the
   browser, and must authenticate against a secure backend using hashed
   passwords, HTTPS, secure sessions, CSRF protection, and rate limiting.
   ========================================================================== */

(function () {
  "use strict";
  const SH = window.SH;
  if (!SH) return;

  const DEMO_EMAIL = "demo@Feistafind.example";
  const DEMO_PASS = "Sunrise!2024"; // fictional demo credential — not a real account

  /* ---------- Small validation helpers ---------- */
  function setError(input, msg) {
    const field = input.closest(".field");
    if (!field) return;
    field.classList.add("has-error");
    const err = field.querySelector(".error-text");
    if (err) {
      err.textContent = msg;
      if (!err.id) err.id = input.id + "-error";
      input.setAttribute("aria-describedby", err.id);
      input.setAttribute("aria-invalid", "true");
    }
  }
  function clearError(input) {
    const field = input.closest(".field");
    if (!field) return;
    field.classList.remove("has-error");
    input.removeAttribute("aria-invalid");
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  /* ---------- Password show/hide ---------- */
  SH.$$(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".password-wrap").querySelector("input");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  /* ---------- Login ---------- */
  const loginForm = SH.$("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = loginForm.querySelector("#login-email");
      const pass = loginForm.querySelector("#login-password");
      [email, pass].forEach(clearError);
      let ok = true;

      if (!validEmail(email.value.trim())) { setError(email, "Enter a valid email address."); ok = false; }
      if (pass.value.length < 8) { setError(pass, "Password must be at least 8 characters."); ok = false; }
      if (!ok) return;

      // Demo sign-in: accepts the demo credential or any syntactically valid
      // input — because there is no server to check against. This is clearly
      // labelled on the page as a front-end demonstration.
      SH.store.set("session", {
        email: email.value.trim(),
        name: email.value.trim() === DEMO_EMAIL ? "Demo Member" : "Demo Member",
        at: new Date().toISOString(),
        remember: loginForm.querySelector("#remember").checked,
      });
      SH.toast("Signed in (demo). Welcome back!");
      setTimeout(() => { window.location.href = "browse.html"; }, 700);
    });

    const demoBtn = SH.$("#demo-login");
    if (demoBtn) {
      demoBtn.addEventListener("click", () => {
        SH.store.set("session", { email: DEMO_EMAIL, name: "Demo Member", at: new Date().toISOString(), demo: true });
        SH.toast("Signed in with the demo account.");
        setTimeout(() => { window.location.href = "browse.html"; }, 700);
      });
    }

    const forgot = SH.$("#forgot-link");
    if (forgot) {
      forgot.addEventListener("click", (e) => {
        e.preventDefault();
        SH.openModal(
          "<h2>Reset your password</h2>" +
          "<p class='text-soft'>In a live service we would email you a secure reset link. " +
          "This prototype has no backend, so no email can be sent — this dialog demonstrates the flow only.</p>" +
          '<div class="modal__actions"><button type="button" class="btn btn--primary" data-ok>Got it</button></div>'
        ).backdrop.querySelector("[data-ok]").addEventListener("click", function () {
          this.closest(".modal-backdrop").remove();
        });
      });
    }
  }

  /* ---------- Registration ---------- */
  const regForm = SH.$("#register-form");
  if (regForm) {
    const get = (id) => regForm.querySelector("#" + id);

    regForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      let firstBad = null;

      const req = (input, msg, test) => {
        clearError(input);
        const value = (input.type === "checkbox") ? input.checked : input.value.trim();
        const pass = test ? test(value) : Boolean(value);
        if (!pass) {
          setError(input, msg);
          ok = false;
          if (!firstBad) firstBad = input;
        }
      };

      req(get("reg-name"), "Please enter your first name.");
      req(get("reg-email"), "Enter a valid email address.", validEmail);
      req(get("reg-password"), "Use at least 8 characters, with a letter and a number.",
          (v) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v));

      const dob = get("reg-dob");
      clearError(dob);
      if (!dob.value) {
        setError(dob, "Please enter your date of birth."); ok = false; firstBad = firstBad || dob;
      } else {
        const birth = new Date(dob.value);
        const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000);
        if (isNaN(birth.getTime()) || age < 18) {
          setError(dob, "You must be 18 or older to join."); ok = false; firstBad = firstBad || dob;
        } else if (age < 50) {
          // Not an error — an honest heads-up about the community focus.
          const note = dob.closest(".field").querySelector(".hint");
          if (note) note.textContent = "Heads up: Feistafind is designed for adults 50+. You can still join if you are 18+.";
        }
      }

      req(get("reg-location"), "Please add your general location (city or region).");
      req(get("reg-gender"), "Please choose an option.");
      req(get("reg-seeking"), "Please choose an option.");
      req(get("reg-goals"), "Please choose an option.");

      const desc = get("reg-bio");
      clearError(desc);
      if (desc.value.trim().length > 0 && desc.value.trim().length < 30) {
        setError(desc, "Tell us a little more — at least 30 characters, or leave it blank for now.");
        ok = false; firstBad = firstBad || desc;
      }

      // Legal consent checkboxes are intentionally NOT pre-checked.
      req(get("agree-age"), "You must confirm you are 18 or older.");
      req(get("agree-terms"), "Please agree to the Terms & Conditions to continue.");
      req(get("agree-privacy"), "Please confirm you have read the Privacy Policy.");

      if (!ok) { if (firstBad) firstBad.focus(); return; }

      // Photo upload: front-end preview only — nothing is uploaded anywhere.
      const photoInput = get("reg-photo");
      let photoData = null;
      const finish = () => {
        SH.store.set("session", {
          email: get("reg-email").value.trim(),
          name: get("reg-name").value.trim(),
          at: new Date().toISOString(),
        });
        SH.store.set("myProfile", {
          name: get("reg-name").value.trim(),
          dob: dob.value,
          location: get("reg-location").value.trim(),
          gender: get("reg-gender").value,
          seeking: get("reg-seeking").value,
          goals: get("reg-goals").value,
          interests: SH.$$(".chip[aria-pressed='true']", regForm).map((c) => c.textContent.trim()),
          bio: desc.value.trim(),
          photo: photoData,
        });
        SH.toast("Welcome to Feistafind! Your demo profile was created.");
        setTimeout(() => { window.location.href = "profile.html?me=1"; }, 800);
      };

      if (photoInput.files && photoInput.files[0]) {
        const file = photoInput.files[0];
        if (file.size > 2 * 1024 * 1024) {
          setError(photoInput, "For this demo, please choose an image under 2 MB.");
          return;
        }
        const reader = new FileReader();
        reader.onload = () => { photoData = reader.result; finish(); };
        reader.readAsDataURL(file);
      } else {
        finish();
      }
    });

    // Live photo preview
    const photoInput = get("reg-photo");
    if (photoInput) {
      photoInput.addEventListener("change", () => {
        const preview = get("photo-preview");
        if (!preview) return;
        const file = photoInput.files && photoInput.files[0];
        if (!file) { preview.innerHTML = ""; return; }
        const reader = new FileReader();
        reader.onload = () => {
          preview.innerHTML = "";
          const img = document.createElement("img");
          img.src = reader.result;
          img.alt = "Preview of your selected profile photo";
          img.style.cssText = "width:96px;height:96px;object-fit:cover;border-radius:50%;";
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    }
  }
})();
