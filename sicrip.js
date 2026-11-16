
const $ = (selector) => document.querySelector(selector);

const STORAGE_KEY = "topilmalar_ads_v2";

let ads = [];
let activeType = "all";

// E'lonlarni brauzerdan yuklash
try {
  ads = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (!Array.isArray(ads)) ads = [];
} catch {
  ads = [];
}

// HTML uchun xavfsiz matn
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// E'lonlarni saqlash
function saveAds() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
    return true;
  } catch {
    alert("Saqlash amalga oshmadi. Rasm hajmini kichraytiring.");
    return false;
  }
}

// E'lonlarni ekranga chiqarish
function renderAds() {
  const query = $("#q").value.trim().toLowerCase();
  const city = $("#city").value;
  const category = $("#category").value;

  const filtered = ads.filter(ad => {
    const matchesType =
      activeType === "all" || ad.type === activeType;

    const matchesCity = !city || ad.city === city;
    const matchesCategory =
      !category || ad.category === category;

    const text = [
      ad.title,
      ad.description,
      ad.city,
      ad.address,
      ad.category
    ].join(" ").toLowerCase();

    return matchesType &&
      matchesCity &&
      matchesCategory &&
      text.includes(query);
  });

  filtered.sort((a, b) => b.created - a.created);

  $("#count").textContent = `${filtered.length} ta e'lon`;

  if (filtered.length === 0) {
    $("#list").innerHTML = `
      <div class="empty">
        <h3>E'lon topilmadi</h3>
        <p>Boshqa so'z bilan qidirib ko'ring.</p>
      </div>`;
    return;
  }

  $("#list").innerHTML = filtered.map(ad => `
    <article class="card">
      ${ad.photo
        ? `<img class="card-photo"
             src="${escapeHTML(ad.photo)}"
             alt="${escapeHTML(ad.title)}">`
        : `<div class="no-photo">🔎</div>`}

      <div class="card-body">
        <span class="tag ${ad.type === "found" ? "found" : ""}">
          ${ad.type === "lost" ? "Yo'qolgan" : "Topilgan"}
        </span>

        <h3>${escapeHTML(ad.title)}</h3>

        <p class="description">
          📍 ${escapeHTML(ad.city)}, ${escapeHTML(ad.address)}
        </p>

        <p class="description">
          ${escapeHTML(ad.description)}
        </p>

        <p class="description">
          ${escapeHTML(ad.category)} · ${escapeHTML(ad.date)}
        </p>

        <div class="card-actions">
          <a class="small-btn"
             href="tel:${escapeHTML(ad.phone.replace(/[^\d+]/g, ""))}">
            ☎ Qo'ng'iroq
          </a>

          <button class="small-btn" data-delete="${escapeHTML(ad.id)}">
            O'chirish
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

// E'lon formasini ochish
function openForm() {
  $("#adForm").reset();

  $("#adForm").elements.date.value =
    new Date().toLocaleDateString("en-CA");

  $("#formDialog").showModal();
}

$("#openForm").addEventListener("click", openForm);
$("#openForm2").addEventListener("click", openForm);

$("#cancelForm").addEventListener("click", () => {
  $("#formDialog").close();
});

// Qidiruv va filtrlar
$("#q").addEventListener("input", renderAds);
$("#city").addEventListener("change", renderAds);
$("#category").addEventListener("change", renderAds);
$("#searchBtn").addEventListener("click", renderAds);

// E'lon turini tanlash
document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    activeType = button.dataset.type;

    document.querySelectorAll(".tab").forEach(tab => {
      tab.classList.toggle("active", tab === button);
    });

    renderAds();
  });
});

// Yangi e'lon qo'shish
$("#adForm").addEventListener("submit", event => {
  event.preventDefault();

  const form = event.currentTarget;
  const values = Object.fromEntries(
    new FormData(form).entries()
  );

  const file = form.elements.photo.files[0];

  if (file && !file.type.startsWith("image/")) {
    alert("Rasm faylini tanlang.");
    return;
  }

  if (file && file.size > 900 * 1024) {
    alert("Rasm hajmi 900 KB dan kichik bo'lishi kerak.");
    return;
  }

  if (!/^[+\d][\d\s()-]{6,23}$/.test(values.phone.trim())) {
    alert("Telefon raqamini to'g'ri kiriting.");
    return;
  }

  if (values.date > new Date().toLocaleDateString("en-CA")) {
    alert("Kelajakdagi sanani tanlash mumkin emas.");
    return;
  }

  function addAd(photo) {
    const ad = {
      id: Date.now().toString(36) +
        Math.random().toString(36).slice(2, 7),
      type: values.type,
      title: values.title.trim(),
      category: values.category,
      city: values.city,
      address: values.address.trim(),
      date: values.date,
      description: values.description.trim(),
      phone: values.phone.trim(),
      photo,
      created: Date.now()
    };

    ads.unshift(ad);

    if (!saveAds()) {
      ads.shift();
      return;
    }

    $("#formDialog").close();

    activeType = "all";

    document.querySelectorAll(".tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.type === "all");
    });

    $("#q").value = "";
    $("#city").value = "";
    $("#category").value = "";

    renderAds();
  }

  // Rasm bo'lmasa ham e'lon saqlanadi
  if (!file) {
    addAd("");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => addAd(reader.result);

  reader.onerror = () => {
    alert("Rasmni o'qishda xatolik yuz berdi.");
  };

  reader.readAsDataURL(file);
});

// E'lonni o'chirish
$("#list").addEventListener("click", event => {
  const button = event.target.closest("[data-delete]");

  if (!button) return;

  if (!confirm("E'lonni o'chirmoqchimisiz?")) return;

  const previous = ads;

  ads = ads.filter(ad => ad.id !== button.dataset.delete);

  if (!saveAds()) {
    ads = previous;
    return;
  }

  renderAds();
});

// Sayt ochilganda e'lonlarni chiqarish
renderAds();
