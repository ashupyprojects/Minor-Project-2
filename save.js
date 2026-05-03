document.addEventListener("DOMContentLoaded", () => {
  console.log("SAVE JS LOADED ✅");

  // ===== GLOBAL SAVE FUNCTION =====
  window.saveScheme = function(name, link, btn = null) {
    let saved = JSON.parse(localStorage.getItem("savedSchemes")) || [];

    const exists = saved.find(s => s.name === name);

    if (!exists) {
      saved.push({ name, link });
      localStorage.setItem("savedSchemes", JSON.stringify(saved));

      alert(name + " saved!");

      if (btn) {
        btn.innerText = "Saved ✅";
        btn.disabled = true;
        btn.style.background = "gray";
      }

    } else {
      alert("Already saved!");
    }
  };

  // ❌ STOP AUTO BUTTON ON FILTER PAGE
  if (window.location.pathname.includes("schemes.html")) {
    return;
  }

  // ===== AUTO ADD BUTTON (OTHER PAGES ONLY) =====
  const schemes = document.querySelectorAll("h2");

  schemes.forEach(title => {
    const schemeName = title.innerText.trim();

    let linkEl = title.parentElement.querySelector("a");
    const schemeLink = linkEl ? linkEl.href : "#";

    if (title.parentElement.querySelector(".save-btn")) return;

    const btn = document.createElement("button");
    btn.innerText = "Add to My Schemes";
    btn.className = "save-btn";

    btn.onclick = function(e) {
      e.preventDefault();
      saveScheme(schemeName, schemeLink, btn);
    };

    title.parentElement.appendChild(btn);
  });
});