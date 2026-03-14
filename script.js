fetch("data.json")
.then(res => res.json())
.then(data => {

const container = document.getElementById("app")

Object.keys(data).forEach(state => {

  const stateDiv = document.createElement("div")
  stateDiv.className = "state"
  stateDiv.innerHTML = `<h2>${state}</h2>`

  const cities = data[state]

  Object.keys(cities).forEach(city => {

    const cityDiv = document.createElement("div")
    cityDiv.className = "city"
    cityDiv.innerHTML = `<h3>${city}</h3>`

    cities[city].forEach(coupon => {

      const card = document.createElement("div")
      card.className = "card"

      if(coupon.expired){
        card.classList.add("expired")
      }

      // Handle the logic for Price and Discount
      if (coupon.price_off !== null && coupon.price_off !== undefined) {
        price_string = `<div class="price">Discount: $${coupon.price_off}</div>`;
      } else if (coupon.price !== null && coupon.price !== undefined) {
        price_string = `<div class="price">Price: $${coupon.price}</div>`;
      } else {
        price_string = `<div class="price">Price: Unknown</div>`;
      }

      card.innerHTML = `
        <div><strong>${coupon.location || "Location Unknown"}</strong></div>
        ${price_string}
        <div>Expires: ${coupon.expires ?? "Unknown"}</div>
        <a href="${coupon.url}" target="_blank">View Coupon</a>
        <a href="${coupon.coupon_url}" target="_blank">View Offer</a>
      `

      cityDiv.appendChild(card)

    })

    stateDiv.appendChild(cityDiv)

  })

  container.appendChild(stateDiv)

})

})