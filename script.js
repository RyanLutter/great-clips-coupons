const app = document.getElementById("app");
const searchInput = document.getElementById("search");
const stateFilter = document.getElementById("state-filter");
const statusFilter = document.getElementById("status-filter");
const resultSummary = document.getElementById("result-summary");
const activeCount = document.getElementById("active-count");

let offers = [];

function isExpired(coupon) {
  if (coupon.expires) {
    // Parse as a local calendar date to avoid UTC timezone shifts.
    const [year, month, day] = coupon.expires.split("-").map(Number);
    const expiry = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiry < today;
  }
  return Boolean(coupon.expired);
}

function formatDate(value) {
  if (!value) return "Expiration date unavailable";
  const [year, month, day] = value.split("-").map(Number);
  return `Expires ${new Intl.DateTimeFormat(undefined, {
    month: "short", day: "numeric", year: "numeric"
  }).format(new Date(year, month - 1, day))}`;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createLink(url, label, primary = false) {
  const link = createElement("a", `button${primary ? " primary" : ""}`, label);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function createCouponCard(coupon) {
  const expired = isExpired(coupon);
  const card = createElement("article", `coupon-card${expired ? " expired" : ""}`);
  const top = createElement("div", "coupon-top");
  top.appendChild(createElement("p", "coupon-location", coupon.location || "Participating Great Clips salons"));
  top.appendChild(createElement("span", `badge${expired ? " expired-badge" : ""}`, expired ? "Expired" : "Active"));
  card.appendChild(top);

  const price = coupon.price_off !== null && coupon.price_off !== undefined
    ? `$${Number(coupon.price_off).toFixed(2)} off`
    : coupon.price !== null && coupon.price !== undefined
      ? `$${Number(coupon.price).toFixed(2)}`
      : "See offer";
  card.appendChild(createElement("div", "deal-price", price));
  card.appendChild(createElement("div", "deal-label", coupon.price_off !== null && coupon.price_off !== undefined ? "discount on a haircut" : "haircut offer"));
  card.appendChild(createElement("p", "expires", formatDate(coupon.expires)));

  const actions = createElement("div", "card-actions");
  if (coupon.url) actions.appendChild(createLink(coupon.url, "Get coupon", true));
  if (coupon.coupon_url) actions.appendChild(createLink(coupon.coupon_url, "Offer details"));
  card.appendChild(actions);
  return card;
}

function getVisibleOffers() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const selectedState = stateFilter.value;
  const status = statusFilter.value;

  return offers.filter(({ state, city, coupon }) => {
    const expired = isExpired(coupon);
    const searchable = `${state} ${city} ${coupon.location || ""} ${coupon.price ?? ""} ${coupon.price_off ?? ""}`.toLocaleLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (selectedState && state !== selectedState) return false;
    if (status === "active" && expired) return false;
    if (status === "expired" && !expired) return false;
    return true;
  });
}

function render() {
  const visible = getVisibleOffers();
  const active = offers.filter(({ coupon }) => !isExpired(coupon)).length;
  activeCount.textContent = active.toLocaleString();
  const activeLabel = statusFilter.value === "active";
  resultSummary.innerHTML = `<strong>${visible.length.toLocaleString()}</strong> ${activeLabel ? "active " : ""}${visible.length === 1 ? "deal" : "deals"} found`;

  if (!visible.length) {
    app.replaceChildren();
    const empty = createElement("div", "empty");
    empty.appendChild(createElement("strong", "", "No matching deals"));
    empty.appendChild(document.createTextNode("Try a different city, state, or filter."));
    app.appendChild(empty);
    return;
  }

  const byState = new Map();
  for (const item of visible) {
    if (!byState.has(item.state)) byState.set(item.state, new Map());
    const cities = byState.get(item.state);
    if (!cities.has(item.city)) cities.set(item.city, []);
    cities.get(item.city).push(item.coupon);
  }

  const fragment = document.createDocumentFragment();
  for (const state of [...byState.keys()].sort((a, b) => a.localeCompare(b))) {
    const cities = byState.get(state);
    const stateSection = createElement("section", "state-section");
    const heading = createElement("div", "state-heading");
    heading.appendChild(createElement("span", "state-code", state === "Unknown" ? "AREA" : state));
    heading.appendChild(createElement("h2", "", state === "Unknown" ? "Regional offers" : `${state} offers`));
    const stateTotal = [...cities.values()].reduce((sum, coupons) => sum + coupons.length, 0);
    heading.appendChild(createElement("span", "state-count", `${stateTotal} ${stateTotal === 1 ? "deal" : "deals"}`));
    stateSection.appendChild(heading);

    for (const city of [...cities.keys()].sort((a, b) => a.localeCompare(b))) {
      const citySection = createElement("div", "city-section");
      citySection.appendChild(createElement("h3", "city-heading", city === "Unknown" ? "Location details unavailable" : city));
      const grid = createElement("div", "coupon-grid");
      cities.get(city).forEach(coupon => grid.appendChild(createCouponCard(coupon)));
      citySection.appendChild(grid);
      stateSection.appendChild(citySection);
    }
    fragment.appendChild(stateSection);
  }
  app.replaceChildren(fragment);
}

function loadOffers(data) {
  offers = Object.entries(data).flatMap(([state, cities]) =>
    Object.entries(cities || {}).flatMap(([city, coupons]) =>
      (Array.isArray(coupons) ? coupons : []).map(coupon => ({ state, city, coupon }))
    )
  );

  const states = [...new Set(offers.map(item => item.state))].sort((a, b) => a.localeCompare(b));
  states.forEach(state => stateFilter.appendChild(new Option(state, state)));
  if (!offers.length) {
    statusFilter.value = "all";
    app.replaceChildren();
    const empty = createElement("div", "empty");
    empty.appendChild(createElement("strong", "", "No offers yet"));
    empty.appendChild(document.createTextNode("The next scraper run will populate this page."));
    app.appendChild(empty);
    resultSummary.textContent = "0 deals found";
    activeCount.textContent = "0";
    return;
  }
  render();
}

searchInput.addEventListener("input", render);
stateFilter.addEventListener("change", render);
statusFilter.addEventListener("change", render);

fetch("data.json", { cache: "no-store" })
  .then(response => {
    if (!response.ok) throw new Error(`Could not load offers (${response.status})`);
    return response.json();
  })
  .then(loadOffers)
  .catch(error => {
    console.error("Error loading coupon data:", error);
    app.replaceChildren();
    const message = createElement("div", "error");
    message.appendChild(createElement("strong", "", "Offers couldn't be loaded"));
    message.appendChild(document.createTextNode("Please refresh the page in a moment."));
    app.appendChild(message);
    resultSummary.textContent = "";
    activeCount.textContent = "—";
  });
