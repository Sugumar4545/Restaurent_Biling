// Default menu items with reliable open-source images from Unsplash - Tamil names
const defaultMenuItems = [
    { id: 1, name: 'இட்லி', price: 30, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=300&q=80', favorite: false },
    { id: 2, name: 'தோசை', price: 50, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=300&q=80', favorite: false },
    { id: 3, name: 'பொங்கல்', price: 40, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561b1e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=300&q=80', favorite: false },
    { id: 4, name: 'பூரி', price: 35, image: 'https://images.unsplash.com/photo-1563379091339-03246963d29b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=300&q=80', favorite: false },
    { id: 5, name: 'பரோட்டா', price: 45, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=300&q=80', favorite: false }
];

// Initialize data from localStorage or use defaults
let storedItems = localStorage.getItem('menuItems');
let menuItems;

if (storedItems) {
    try {
        menuItems = JSON.parse(storedItems);
        // Check if items are in English, if so reset to Tamil
        const hasEnglishNames = menuItems.some(item => 
            ['Idly', 'Dosai', 'Pongal', 'Poori', 'Parotta'].includes(item.name)
        );
        if (hasEnglishNames) {
            menuItems = defaultMenuItems;
            localStorage.setItem('menuItems', JSON.stringify(menuItems));
        }
        // Ensure all items have favorite property
        menuItems.forEach(item => {
            if (item.favorite === undefined) {
                item.favorite = false;
            }
        });
    } catch (e) {
        menuItems = defaultMenuItems;
    }
} else {
    menuItems = defaultMenuItems;
}

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let nextId = Math.max(...menuItems.map(item => item.id), 0) + 1;

// Save to localStorage
function saveMenuItems() {
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    renderMenu();
    renderManageMenu();
    renderBill();
    setupEventListeners();
    setupTabs();
});

// Setup tabs
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const mainWrapper = document.querySelector('.main-content-wrapper');
    const billSection = document.getElementById('billSectionRight');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const tabName = this.getAttribute('data-tab');
            const currentActiveTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');

            // 1. Cart Clear Confirmation Logic
            if (currentActiveTab === 'menu' && tabName === 'manage' && cart.length > 0) {
                const confirmation = confirm('நீங்கள் மெனு மேலாண்மைக்கு செல்லும்போது, வண்டியில் உள்ள பொருட்கள் அனைத்தும் நீக்கப்படும். தொடரலாமா?');
                
                if (!confirmation) {
                    e.preventDefault(); // Stop the tab switch
                    return;
                }
                
                // User confirmed, clear cart and update UI
                cart = [];
                saveCart();
                document.getElementById('moneyReceived').value = '';
                document.getElementById('changeAmount').style.display = 'none';
                calculateChange();
                updateAllMenuBadges();
                renderBill();
            }

            // 2. Bill Section Visibility and Layout Logic
            if (tabName === 'manage') {
                billSection.style.display = 'none';
                mainWrapper.classList.add('full-width');
            } else { // 'menu' tab
                billSection.style.display = 'flex'; // Revert to its default display style
                mainWrapper.classList.remove('full-width');
            }
            
            // 3. Normal tab switching logic
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(tabName + 'Tab').classList.add('active');
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Add item button
    document.getElementById('addItemBtn').addEventListener('click', function() {
        const form = document.getElementById('addItemForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    // Cancel add button
    document.getElementById('cancelAddBtn').addEventListener('click', function() {
        document.getElementById('addItemForm').style.display = 'none';
        document.getElementById('newItemForm').reset();
    });

    // New item form submission
    document.getElementById('newItemForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('itemName').value.trim();
        const price = parseFloat(document.getElementById('itemPrice').value);
        const image = document.getElementById('itemImage').value.trim() || 
                     'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=300&q=80';

        if (name && price >= 0) {
            addMenuItem(name, price, image);
            document.getElementById('newItemForm').reset();
            document.getElementById('addItemForm').style.display = 'none';
        }
    });

    // Edit form submission
    document.getElementById('editItemForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('editItemId').value);
        const name = document.getElementById('editItemName').value.trim();
        const price = parseFloat(document.getElementById('editItemPrice').value);
        const image = document.getElementById('editItemImage').value.trim();

        if (name && price >= 0) {
            updateMenuItem(id, name, price, image);
            closeEditModal();
        } else {
            alert('சரியான பெயர் மற்றும் விலையை உள்ளிடவும்');
        }
    });

    // Close modal buttons
    document.querySelector('.close-modal').addEventListener('click', closeEditModal);
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);

    // Close modal when clicking outside
    document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditModal();
        }
    });

    // Clear cart button
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
}

// CRUD Operations for Menu Items
function addMenuItem(name, price, image) {
    const newItem = {
        id: nextId++,
        name: name,
        price: price,
        image: image,
        favorite: false
    };
    menuItems.push(newItem);
    saveMenuItems();
    renderMenu();
    renderManageMenu();
}

function updateMenuItem(id, name, price, image) {
    const item = menuItems.find(item => item.id === id);
    if (item) {
        item.name = name;
        item.price = price;
        if (image) item.image = image;
        saveMenuItems();
        renderMenu();
        renderManageMenu();
    }
}

function deleteMenuItem(id) {
    if (confirm('இந்த மெனு பொருளை நீக்க விரும்புகிறீர்களா?')) {
        menuItems = menuItems.filter(item => item.id !== id);
        // Also remove from cart if present
        cart = cart.filter(item => item.id !== id);
        saveMenuItems();
        saveCart();
        renderMenu();
        renderManageMenu();
        renderBill();
    }
}

// Toggle favorite
function toggleFavorite(itemId, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const item = menuItems.find(item => item.id === itemId);
    if (item) {
        item.favorite = !item.favorite;
        saveMenuItems();
        renderMenu(); // Re-render customer menu to re-sort favorites
        
        // Use flicker-free update for manage tab icon
        updateManageMenuFavoriteIcon(itemId);
    }
    return false;
}

// Flicker-free update for manage tab icon
function updateManageMenuFavoriteIcon(itemId) {
    const manageGrid = document.getElementById('manageGrid');
    if (!manageGrid) return;

    // Find the favorite button for the specific item
    const favoriteBtn = manageGrid.querySelector(`.favorite-btn[data-item-id="${itemId}"]`);
    if (!favoriteBtn) return;

    // Find the item in our data array
    const item = menuItems.find(item => item.id === itemId);
    if (!item) return;

    // Update the icon text
    favoriteBtn.innerHTML = item.favorite ? '❤️' : '🤍';
}


// Render menu items (for customer view) - sorted with favorites first
function renderMenu() {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';

    // Sort items: favorites first, then by id
    const sortedItems = [...menuItems].sort((a, b) => {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return a.id - b.id;
    });

    sortedItems.forEach(item => {
        const menuItemDiv = document.createElement('div');
        menuItemDiv.className = 'menu-item';
        menuItemDiv.setAttribute('onclick', `addToCart(${item.id}, this);`);
        // Add data-item-id to update badges without flickering
        menuItemDiv.setAttribute('data-item-id', item.id);
        
        // Get cart quantity for this item
        const cartItem = cart.find(c => c.id === item.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        const countBadge = quantity > 0 ? `<div class="item-count-badge">${quantity}</div>` : '';
        
        menuItemDiv.innerHTML = `
            ${countBadge}
            <img src="${item.image}" alt="${item.name}" class="menu-item-image" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80';" loading="lazy">
            <div class="menu-item-info">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-price">₹${item.price}</div>
            </div>
        `;
        menuGrid.appendChild(menuItemDiv);
    });
}

// Render manage menu items (for management view)
function renderManageMenu() {
    const manageGrid = document.getElementById('manageGrid');
    manageGrid.innerHTML = '';

    menuItems.forEach(item => {
        const menuItemDiv = document.createElement('div');
        menuItemDiv.className = 'menu-item';
        const favoriteIcon = item.favorite ? '❤️' : '🤍';
        menuItemDiv.innerHTML = `
            <div class="favorite-btn" data-item-id="${item.id}">${favoriteIcon}</div>
            <img src="${item.image}" alt="${item.name}" class="menu-item-image" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80';" loading="lazy">
            <div class="menu-item-info">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-price">₹${item.price}</div>
                <div class="menu-item-actions">
                    <button class="btn btn-primary btn-small" onclick="openEditModal(${item.id}); event.stopPropagation();">திருத்த</button>
                    <button class="btn btn-danger btn-small" onclick="deleteMenuItem(${item.id}); event.stopPropagation();">நீக்கு</button>
                </div>
            </div>
        `;
        manageGrid.appendChild(menuItemDiv);
        
        // Add event listener to favorite button
        const favoriteBtn = menuItemDiv.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            toggleFavorite(item.id, e);
        });
    });
}

// Open edit modal
function openEditModal(id) {
    const item = menuItems.find(item => item.id === id);
    if (item) {
        document.getElementById('editItemId').value = item.id;
        document.getElementById('editItemName').value = item.name;
        document.getElementById('editItemPrice').value = item.price;
        document.getElementById('editItemImage').value = item.image;
        document.getElementById('editModal').style.display = 'block';
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editItemForm').reset();
}

// Cart Operations
function addToCart(itemId, eventElement) {
    const menuItem = menuItems.find(item => item.id === itemId);
    if (!menuItem) return;

    // Add glowing effect
    const menuItemElement = eventElement || (window.event ? window.event.currentTarget : null);
    if (menuItemElement) {
        menuItemElement.classList.add('click-glow');
        setTimeout(() => {
            menuItemElement.classList.remove('click-glow');
        }, 600);
    }

    const cartItem = cart.find(item => item.id === itemId);
    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1
        });
    }
    saveCart();
    updateAllMenuBadges();
    renderBill();
}

function updateCartQuantity(itemId, change) {
    const cartItem = cart.find(item => item.id === itemId);
    if (cartItem) {
        cartItem.quantity += change;
        if (cartItem.quantity <= 0) {
            cart = cart.filter(item => item.id !== itemId);
        }
        saveCart();
        updateAllMenuBadges();
        renderBill();
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateAllMenuBadges();
    renderBill();
}

function clearCart() {
    if (cart.length === 0) return;
    if (confirm('வாங்கிய பொருட்களை அழிக்க விரும்புகிறீர்களா?')) {
        cart = [];
        saveCart();
        document.getElementById('moneyReceived').value = '';
        document.getElementById('changeAmount').style.display = 'none';
        calculateChange();
        updateAllMenuBadges();
        renderBill();
    }
}

// This function updates only the badges, preventing the flicker
function updateAllMenuBadges() {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;

    menuItems.forEach(item => {
        // Find the corresponding DOM element
        const menuItemElement = menuGrid.querySelector(`.menu-item[data-item-id="${item.id}"]`);
        if (!menuItemElement) return;

        // Find the quantity in the cart
        const cartItem = cart.find(c => c.id === item.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        
        let badge = menuItemElement.querySelector('.item-count-badge');
        
        if (quantity > 0) {
            if (!badge) {
                // Create badge if it doesn't exist
                badge = document.createElement('div');
                badge.className = 'item-count-badge';
                menuItemElement.appendChild(badge);
            }
            badge.textContent = quantity;
        } else {
            // Remove badge if quantity is 0
            if (badge) {
                badge.remove();
            }
        }
    });
}

// Render bill
function renderBill() {
    const billDetails = document.getElementById('billDetails');
    const grandTotalEl = document.getElementById('grandTotal');
    
    if (cart.length === 0) {
        billDetails.innerHTML = '<p class="empty-bill">வாங்கிய பொருட்கள் இல்லை</p>';
        grandTotalEl.textContent = '0';
        calculateChange(); // Ensure change is calculated when total is 0
        return;
    }

    let grandTotal = 0;
    billDetails.innerHTML = '';

    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        grandTotal += subtotal;

        const billItemDiv = document.createElement('div');
        billItemDiv.className = 'bill-item';
        billItemDiv.innerHTML = `
            <div class="bill-item-left">
                <div class="bill-item-name">${item.name}</div>
                <div class="bill-item-price">₹${item.price} × ${item.quantity}</div>
            </div>
            <div class="bill-item-right">
                <div class="bill-item-controls">
                    <button class="quantity-btn-small" onclick="updateCartQuantity(${item.id}, -1)">-</button>
                    <span class="quantity-display-small">${item.quantity}</span>
                    <button class="quantity-btn-small" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                </div>
                <div class="bill-item-subtotal">₹${subtotal.toFixed(2)}</div>
                <button class="remove-item-btn-small" onclick="removeFromCart(${item.id})">×</button>
            </div>
        `;
        billDetails.appendChild(billItemDiv);
    });

    grandTotalEl.textContent = grandTotal.toFixed(2);
    calculateChange();
}

// Calculate change amount
function calculateChange() {
    const grandTotal = parseFloat(document.getElementById('grandTotal').textContent) || 0;
    const moneyReceived = parseFloat(document.getElementById('moneyReceived').value) || 0;
    const changeAmountDiv = document.getElementById('changeAmount');
    const changeValue = document.getElementById('changeValue');
    
    if (grandTotal === 0) {
        document.getElementById('moneyReceived').value = '';
        changeAmountDiv.style.display = 'none';
        return;
    }

    if (moneyReceived > 0) {
        const change = moneyReceived - grandTotal;
        changeValue.textContent = change.toFixed(2);
        
        if (change >= 0) {
            changeAmountDiv.style.display = 'block';
            changeAmountDiv.className = 'change-amount change-positive';
        } else {
            changeAmountDiv.style.display = 'block';
            changeAmountDiv.className = 'change-amount change-negative';
        }
    } else {
        changeAmountDiv.style.display = 'none';
    }
}