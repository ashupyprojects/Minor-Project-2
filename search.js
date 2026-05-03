document.addEventListener("DOMContentLoaded", () => {
  const searchBox = document.querySelector(".search-box");
  const resultDiv = document.getElementById("search-results");

  searchBox.addEventListener("input", function () {
    const query = this.value.toLowerCase();
    resultDiv.innerHTML = "";

    if (query === "") return;

    const results = schemes.filter(s =>
      s.name.toLowerCase().includes(query)
    );

    results.forEach(s => {
      const p = document.createElement("p");
      p.textContent = s.name;

      // ✅ FIXED HERE
      p.addEventListener("click", () => {
        window.location.href = s.page;
      });

      resultDiv.appendChild(p);
    });
  });
});