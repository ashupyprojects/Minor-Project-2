document.addEventListener("DOMContentLoaded", () => {
  const rawUser = localStorage.getItem("bpUser");
  const authArea = document.getElementById("auth-area");

  /* ================= HEADER ================= */
  if (authArea) {
    if (rawUser) {
      const user = JSON.parse(rawUser);
      const firstName = (user.name || "User").split(" ")[0];

      authArea.innerHTML = `
        <span class="welcome-text" style="margin-right:10px;">
          Welcome, ${firstName}
        </span>
        <a href="/profile.html" class="auth-btn">Profile</a>
        <button id="logout-btn" class="auth-btn">Logout</button>
      `;

      document.getElementById("logout-btn").addEventListener("click", () => {
        localStorage.removeItem("bpUser");
        window.location.href = "/index.html";
      });

    } else {
      authArea.innerHTML = `
        <a href="/signinform.html" class="auth-btn">Sign In</a>
        <a href="/signupform.html" class="auth-btn">Sign Up</a>
      `;
    }
  }

  /* ================= SIGNIN ================= */
  const signinForm = document.getElementById("signin-form");

  if (signinForm) {
    const signinMsg = document.getElementById("signin-message");

    signinForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(signinForm);
      const data = {
        email: formData.get("email"),
        password: formData.get("password"),
      };

      try {
        const res = await fetch("/api/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          if (signinMsg) signinMsg.textContent = result.message;
          return;
        }

        localStorage.setItem("bpUser", JSON.stringify(result.user));
        window.location.href = "/index.html";

      } catch (err) {
        console.error("Signin error:", err);
      }
    });
  }

  /* ================= SIGNUP ================= */
  const signupForm = document.getElementById("signup-form");

  if (signupForm) {
    const signupMsg = document.getElementById("signup-message");

    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(signupForm);

      const data = {
        name: formData.get("name"),
        dob: formData.get("dob"),
        state: formData.get("state"),
        category: formData.get("category"),
        employmentStatus: formData.get("employmentStatus"),
        casteCategory: formData.get("casteCategory"),
        email: formData.get("email"),
        password: formData.get("password"),
      };

      try {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (signupMsg) signupMsg.textContent = result.message;

        if (result.success) {
          window.location.href = "/signinform.html";
        }

      } catch (err) {
        console.error("Signup error:", err);
      }
    });
  }

  /* ================= PROFILE ================= */
  const profileNameEl = document.getElementById("profile-name");

  if (profileNameEl) {
    if (!rawUser) {
      window.location.href = "/signinform.html";
      return;
    }

    const user = JSON.parse(rawUser);

    document.getElementById("profile-name").textContent = user.name || "";
    document.getElementById("profile-email").textContent = user.email || "";
    document.getElementById("profile-dob").textContent = user.dob || "";
    document.getElementById("profile-state").textContent = user.state || "";
    document.getElementById("profile-category").textContent = user.category || "";
    document.getElementById("profile-employment").textContent = user.employmentStatus || "";
    document.getElementById("profile-caste").textContent = user.casteCategory || "";

    const photoDiv = document.getElementById("profile-photo");
    if (photoDiv) {
      photoDiv.textContent = user.name.charAt(0).toUpperCase();
    }

    /* ===== SAVED SCHEMES (FINAL UI) ===== */
    const savedList = document.getElementById("saved-list");

    if (savedList) {
      let saved = JSON.parse(localStorage.getItem("savedSchemes")) || [];

      savedList.innerHTML = "";

      if (saved.length === 0) {
        savedList.innerHTML = "<p>No saved schemes</p>";
        return;
      }

      saved.forEach((scheme, index) => {
        const div = document.createElement("div");
        div.classList.add("saved-card");

        div.innerHTML = `
          <div class="saved-left">
            <span class="saved-tag">Saved</span>
            <span class="saved-name">${scheme.name}</span>
          </div>

          <div class="saved-right">
            <a href="${scheme.link}" target="_blank" class="view-link">View / Apply</a>
            <button class="remove-btn" onclick="removeScheme(${index})">✖</button>
          </div>
        `;

        savedList.appendChild(div);
      });
    }
  }
});

/* ================= REMOVE FUNCTION ================= */
function removeScheme(index) {
  let saved = JSON.parse(localStorage.getItem("savedSchemes")) || [];

  saved.splice(index, 1);

  localStorage.setItem("savedSchemes", JSON.stringify(saved));

  location.reload();
}