const API_URL = "https://bringit-server.taild897f3.ts.net";

let inventory = {};
let cart = {};


const productsContainer = document.getElementById("products");
const cartContainer = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const cartDrawer = document.getElementById("cartDrawer");
const checkoutModal = document.getElementById("checkoutModal");
const backdrop = document.getElementById("cartBackdrop");
const profileModal = document.getElementById("profileModal");
const loginModal = document.getElementById("loginModal");


function openLogin() {
    loginModal.hidden = false;

    requestAnimationFrame(() => {
        loginModal.classList.add("show");
    });
}

function closeLogin() {
    loginModal.classList.remove("show");

    setTimeout(() => {
        loginModal.hidden = true;
    }, 300);
}

function loginUser() {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!username) {
        toast("Enter username");
        return;
    }

    if (!password) {
        toast("Enter password");
        return;
    }

    localStorage.setItem("username", username);
    localStorage.setItem("password", password);

    closeLogin();
    renderAuthButtons();
    toast("Logged in");
}

function logoutUser() {
    localStorage.removeItem("username");
    localStorage.removeItem("password");

    closeProfile();
    renderAuthButtons();

    toast("Logged out");
}



function renderAuthButtons() {
    const auth = document.getElementById("authButtons");

    if (!auth) return;

    const username = localStorage.getItem("username");

    if (username) {
        auth.innerHTML = `
            <button class="profile-btn" onclick="openProfile()">
                👤 Profile
            </button>

            <button class="logout-btn" onclick="logoutUser()">
                Logout
            </button>
        `;
    } else {
        auth.innerHTML = `
            <button class="login-btn" onclick="openLogin()">
                Login
            </button>
        `;
    }
}


function parseItem(itemKey) {
    const parts = itemKey.split(".");

    return {
        raw: itemKey,
        name: parts[0] || itemKey,
        realPrice: Number(parts[1] || 0),
        gotPrice: Number(parts[2] || 0),
        soldPrice: Number(parts[3] || 0)
    };
}


async function loadInventory() {
    try {
        const response = await fetch(`${API_URL}/list`);
        inventory = await response.json();
        renderProducts();
    } catch (err) {
        console.error(err);
        toast("Unable to load inventory");
    }
}



function renderProducts() {
    productsContainer.innerHTML = "";

    let items = Object.entries(inventory);

    const sortType =
        document.getElementById("sortSelect")?.value || "default";

    if (sortType === "price") {
        items.sort((a, b) => {
            return parseItem(a[0]).soldPrice - parseItem(b[0]).soldPrice;
        });
    }

    if (sortType === "discount") {
        // items.sort((a, b) => {
        //     const A = parseItem(a[0]);
        //     const B = parseItem(b[0]);

        //     return (B.realPrice - B.soldPrice) - (A.realPrice - A.soldPrice);
        // });
            items.sort((a, b) => {
        const A = parseItem(a[0]);
        const B = parseItem(b[0]);

        const discountA = A.realPrice > 0
            ? ((A.realPrice - A.soldPrice) / A.realPrice) * 100
            : 0;

        const discountB = B.realPrice > 0
            ? ((B.realPrice - B.soldPrice) / B.realPrice) * 100
            : 0;

        return discountB - discountA;
    });

    }

    items.forEach(([itemKey, qty]) => {
        const item = parseItem(itemKey);

        const availableStock = qty - (cart[itemKey] || 0);

        const discount = item.realPrice - item.soldPrice;

        const discountPercent =
            item.realPrice > 0
                ? Math.round((discount / item.realPrice) * 100)
                : 0;

        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
            <div class="image-container">
                <img
                    src="${API_URL}/image/${encodeURIComponent(item.name)}"
                >
                <div class="discount-badge">
                    ${discountPercent}% OFF
                </div>
            </div>

            <div class="product-info">
                <h3>${item.name}</h3>

                <div class="price-box">
                    <span class="old-price">₹${item.realPrice}</span>
                    <span class="new-price">₹${item.soldPrice}</span>
                </div>

                <p class="stock">${availableStock} left</p>

                <button
                    class="add-btn"
                    onclick="addToCart('${item.raw}')"
                    ${availableStock <= 0 ? "disabled" : ""}
                >
                    ${availableStock <= 0 ? "Out Of Stock" : "Add To Cart"}
                </button>
            </div>
        `;

        productsContainer.appendChild(card);
    });
}


function addToCart(itemKey) {
    const stock = inventory[itemKey];
    const already = cart[itemKey] || 0;

    if (already >= stock) {
        toast("No more stock available");
        return;
    }

    cart[itemKey] = already + 1;

    renderCart();
    renderProducts();
    toast("Added to cart");
}

function increaseCart(itemKey) {
    const stock = inventory[itemKey];
    const current = cart[itemKey] || 0;

    if (current >= stock) {
        toast("Max stock reached");
        return;
    }

    cart[itemKey]++;
    renderCart();
    renderProducts();
}

function decreaseCart(itemKey) {
    if (!cart[itemKey]) return;

    cart[itemKey]--;

    if (cart[itemKey] <= 0) {
        delete cart[itemKey];
    }

    renderCart();
    renderProducts();
}

function clearCart() {
    cart = {};
    renderCart();
    renderProducts();
    toast("Cart cleared");
}


function renderCart() {
    cartContainer.innerHTML = "";

    let totalItems = 0;
    let totalPrice = 0;

    if (Object.keys(cart).length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <h3>Cart Empty</h3>
                <p>Add products to continue</p>
            </div>
        `;
    }

    Object.entries(cart).forEach(([itemKey, qty]) => {
        const item = parseItem(itemKey);

        totalItems += qty;
        totalPrice += qty * item.soldPrice;

        const row = document.createElement("div");
        row.className = "cart-row";

        row.innerHTML = `
            <div class="cart-left">
                <div class="cart-name">${item.name}</div>
                <div class="cart-price">₹${item.soldPrice}</div>
            </div>

            <div class="qty-controls">
                <button onclick="decreaseCart('${itemKey}')">−</button>
                <span>${qty}</span>
                <button onclick="increaseCart('${itemKey}')">+</button>
            </div>
        `;

        cartContainer.appendChild(row);
    });

    cartCount.innerText = totalItems;
    cartTotal.innerText = `₹${totalPrice}`;
}

function openCart() {
    cartDrawer.classList.add("show");
    backdrop.classList.add("show");
}

function closeCart() {
    cartDrawer.classList.remove("show");
    backdrop.classList.remove("show");
}



function openCheckout() {
    if (Object.keys(cart).length === 0) {
        toast("Cart is empty");
        return;
    }

    checkoutModal.hidden = false;

    requestAnimationFrame(() => {
        checkoutModal.classList.add("show");
    });
}

function closeCheckout() {
    checkoutModal.classList.remove("show");

    setTimeout(() => {
        checkoutModal.hidden = true;
    }, 300);
}


async function placeOrder() {

    const name =
        document.getElementById("customerName").value.trim();

    const location =
        document.getElementById("deliveryLocation").value.trim();

    if (!name) {
        toast("Enter name");
        return;
    }

    if (!location) {
        toast("Enter location");
        return;
    }

    const username =
        localStorage.getItem("username");

    const password =
        localStorage.getItem("password");


    if (!username) {
        toast("Please login first");
        return;
    }

    try {

        const response =
            await fetch(`${API_URL}/order_for`, {
                method: "GET",

                headers: {
                    username: username,
                    password: password,
                    name: name,
                    delivery_location: location,
                    items: JSON.stringify(cart)
                }
            });

        const result =
            await response.json();

        if (result === 1) {

            toast("Order placed successfully");

            cart = {};

            renderCart();
            renderProducts();

            closeCheckout();
            closeCart();

            await loadInventory();
        }

        else if (result === -1) {
            toast("Some items unavailable");
        }

        else {
            toast("No items available");
        }

    } catch (err) {
        console.error(err);
        toast("Server error");
    }
}



function openProfile() {
    profileModal.hidden = false;

    requestAnimationFrame(() => {
        profileModal.classList.add("show");
    });

    loadProfile();
}

function closeProfile() {
    profileModal.classList.remove("show");

    setTimeout(() => {
        profileModal.hidden = true;
    }, 300);
}

async function loadProfile() {
    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");

    if (!username) {
        document.getElementById("profileData").innerHTML =
            "<h3>Not logged in</h3>";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/profile`, {
            method: "GET",
            headers: { username, password }
            
        });

        const data = await res.json();
        renderProfile(data);

    } catch (err) {
        console.error(err);

        document.getElementById("profileData").innerHTML =
            "<h3>Failed to load profile</h3>";
    }
}



function renderProfile(data) {
    const bills = data.purchase_list || [];

    let rows = "";

    bills.forEach(bill => {
        rows += `
            <tr>
                <td>${bill.itemname || ""}</td>
                <td>₹${bill.profit || 0}</td>
                <td>${bill.time || ""}</td>
            </tr>
        `;
    });

    document.getElementById("profileData").innerHTML = `
        <div class="profile-grid">

            <div class="profile-card">
                <h4>Username</h4>
                <p>${data.username || ""}</p>
            </div>

            <div class="profile-card">
                <h4>Total Earnings</h4>
                <p>₹${data.total_earnings || 0}</p>
            </div>

            <div class="profile-card">
                <h4>Share</h4>
                <p>${data.share || 0}%</p>
            </div>

            <div class="profile-card">
                <h4>Total Orders</h4>
                <p>${bills.length}</p>
            </div>

        </div>

        <h3 style="margin-top:30px;margin-bottom:15px;">
            Purchase History
        </h3>

        <table class="bill-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Profit</th>
                    <th>Time</th>
                </tr>
            </thead>

            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}



function toast(message) {
    const t = document.getElementById("toast");

    t.innerText = message;
    t.classList.add("show");

    setTimeout(() => {
        t.classList.remove("show");
    }, 3000);
}



document.addEventListener("DOMContentLoaded", () => {
    checkoutModal.hidden = true;
    profileModal.hidden = true;

    closeCart();

    renderCart();
    loadInventory();
    renderAuthButtons();

    const sortSelect = document.getElementById("sortSelect");

    if (sortSelect) {
        sortSelect.addEventListener("change", renderProducts);
    }

    setInterval(loadInventory, 120000);
});



window.addToCart = addToCart;
window.increaseCart = increaseCart;
window.decreaseCart = decreaseCart;
window.clearCart = clearCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.openCheckout = openCheckout;
window.closeCheckout = closeCheckout;
window.placeOrder = placeOrder;
window.openProfile = openProfile;
window.closeProfile = closeProfile;
window.openLogin = openLogin;
window.closeLogin = closeLogin;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
