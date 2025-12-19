// Shopping Cart Management
class ShoppingCart {
  constructor() {
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds
    this.warningTime = 28 * 60 * 1000; // Show warning at 28 minutes
    this.timeoutTimer = null;
    this.warningTimer = null;
    
    this.checkSession();
    this.items = this.loadCart();
    this.updateCartUI();
    this.startSessionTimers();
  }

  // Check if session is still valid
  checkSession() {
    const sessionStart = sessionStorage.getItem('cartSessionStart');
    const now = Date.now();
    
    if (sessionStart) {
      const elapsed = now - parseInt(sessionStart);
      if (elapsed > this.sessionTimeout) {
        // Session expired, clear cart
        this.clearSession();
      }
    } else {
      // First visit, set session start time
      sessionStorage.setItem('cartSessionStart', now.toString());
    }
  }

  // Start session timers
  startSessionTimers() {
    // Clear any existing timers
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);

    const sessionStart = sessionStorage.getItem('cartSessionStart');
    if (!sessionStart) return;

    const now = Date.now();
    const elapsed = now - parseInt(sessionStart);
    const timeUntilWarning = this.warningTime - elapsed;
    const timeUntilTimeout = this.sessionTimeout - elapsed;

    // Set warning timer (2 minutes before timeout)
    if (timeUntilWarning > 0) {
      this.warningTimer = setTimeout(() => {
        this.showSessionWarning();
      }, timeUntilWarning);
    }

    // Set timeout timer
    if (timeUntilTimeout > 0) {
      this.timeoutTimer = setTimeout(() => {
        this.handleSessionTimeout();
      }, timeUntilTimeout);
    }
  }

  // Show session warning modal
  showSessionWarning() {
    const modal = document.createElement('div');
    modal.id = 'sessionWarningModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(180deg, rgba(26, 26, 26, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%);
        border: 1px solid rgba(220, 95, 0, 0.5);
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      ">
        <h2 style="
          color: #ff7a1f;
          margin: 0 0 16px 0;
          font-size: 24px;
        ">Still Shopping?</h2>
        <p style="
          color: #e4e4e7;
          margin: 0 0 24px 0;
          font-size: 16px;
          line-height: 1.5;
        ">Your cart session will expire in 2 minutes. Would you like to continue shopping?</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="extendSession" style="
            padding: 12px 24px;
            background: linear-gradient(135deg, #DC5F00 0%, #ff7a1f 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          ">Yes, Continue</button>
          <button id="endSession" style="
            padding: 12px 24px;
            background: transparent;
            color: #a1a1aa;
            border: 1px solid rgba(220, 95, 0, 0.3);
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          ">No, Clear Cart</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('extendSession').addEventListener('click', () => {
      this.extendSession();
      document.body.removeChild(modal);
    });

    document.getElementById('endSession').addEventListener('click', () => {
      this.clearSession();
      document.body.removeChild(modal);
    });
  }

  // Extend session
  extendSession() {
    const now = Date.now();
    sessionStorage.setItem('cartSessionStart', now.toString());
    this.startSessionTimers();
  }

  // Handle session timeout
  handleSessionTimeout() {
    this.clearSession();
    alert('Your cart session has expired. Your cart has been cleared.');
  }

  // Clear session and cart
  clearSession() {
    sessionStorage.removeItem('cartSessionStart');
    sessionStorage.removeItem('geneseeSwiftCart');
    this.items = [];
    this.updateCartUI();
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
  }

  // Load cart from sessionStorage
  loadCart() {
    const saved = sessionStorage.getItem('geneseeSwiftCart');
    return saved ? JSON.parse(saved) : [];
  }

  // Save cart to sessionStorage
  saveCart() {
    sessionStorage.setItem('geneseeSwiftCart', JSON.stringify(this.items));
  }

  // Add item to cart
  addItem(product) {
    const existingItem = this.items.find(
      item => item.id === product.id && item.size === product.size
    );

    if (existingItem) {
      existingItem.quantity += product.quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        size: product.size,
        quantity: product.quantity,
        category: product.category
      });
    }

    this.saveCart();
    this.updateCartUI();
    this.animateCartBadge();
    return true;
  }

  // Remove item from cart
  removeItem(id, size) {
    this.items = this.items.filter(
      item => !(item.id === id && item.size === size)
    );
    this.saveCart();
    this.updateCartUI();
  }

  // Update item quantity
  updateQuantity(id, size, quantity) {
    const item = this.items.find(
      item => item.id === id && item.size === size
    );
    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) {
        this.removeItem(id, size);
      } else {
        this.saveCart();
        this.updateCartUI();
      }
    }
  }

  // Get total items count
  getTotalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Get total price
  getTotalPrice() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Clear cart
  clearCart() {
    this.items = [];
    this.saveCart();
    this.updateCartUI();
    // Reset session timer when cart is manually cleared
    this.extendSession();
  }

  // Animate cart badge
  animateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      // Force a reflow to ensure the badge is properly positioned before animating
      badge.offsetHeight;
      requestAnimationFrame(() => {
        badge.classList.add('pulse');
        setTimeout(() => badge.classList.remove('pulse'), 500);
      });
    }
  }

  // Update cart UI
  updateCartUI() {
    this.updateCartBadge();
    this.updateCartPreview();
  }

  // Update cart badge
  updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    const mobileText = document.querySelector('.mobile-cart-text');
    
    if (badge) {
      const totalItems = this.getTotalItems();
      badge.textContent = totalItems;
      
      if (totalItems > 0) {
        // Hide badge initially, show after transform completes
        badge.style.visibility = 'hidden';
        badge.style.display = 'inline-block';
        
        // Wait for transform to complete, then show badge
        requestAnimationFrame(() => {
          setTimeout(() => {
            badge.style.visibility = 'visible';
          }, 1000);
        });
      } else {
        badge.style.display = 'none';
        badge.style.visibility = 'visible';
      }
      
      // Update mobile cart text
      if (mobileText) {
        if (totalItems > 0) {
          mobileText.textContent = ` | ${totalItems}`;
        } else {
          mobileText.textContent = '';
        }
      }
    }
  }

  // Update cart preview
  updateCartPreview() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartEmptyMessage = document.querySelector('.cart-empty');
    const cartFooter = document.querySelector('.cart-preview-footer');
    const cartCount = document.querySelector('.cart-count');
    const cartTotalAmount = document.querySelector('.cart-total-amount');

    if (!cartItemsContainer) return;

    const totalItems = this.getTotalItems();

    // Update cart count in header
    if (cartCount) {
      cartCount.textContent = totalItems;
    }

    if (totalItems === 0) {
      if (cartEmptyMessage) cartEmptyMessage.style.display = 'block';
      if (cartFooter) cartFooter.style.display = 'none';
      cartItemsContainer.innerHTML = '';
      return;
    }

    if (cartEmptyMessage) cartEmptyMessage.style.display = 'none';
    if (cartFooter) cartFooter.style.display = 'block';

    // Render cart items
    cartItemsContainer.innerHTML = this.items.map(item => `
      <div class="cart-item">
        <div class="cart-item-image">IMG</div>
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-info">Size: ${item.size} • Qty: ${item.quantity}</div>
          <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
        </div>
        <button class="cart-item-remove" onclick="cart.removeItem('${item.id}', '${item.size}')">×</button>
      </div>
    `).join('');

    // Update total
    if (cartTotalAmount) {
      cartTotalAmount.textContent = `$${this.getTotalPrice().toFixed(2)}`;
    }
  }
}

// Initialize cart
const cart = new ShoppingCart();

// Make cart globally available
window.cart = cart;
