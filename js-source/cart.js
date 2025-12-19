// Shopping Cart Management
class ShoppingCart {
  constructor() {
    this.items = this.loadCart();
    this.updateCartUI();
  }

  // Load cart from localStorage
  loadCart() {
    const saved = localStorage.getItem('geneseeSwiftCart');
    return saved ? JSON.parse(saved) : [];
  }

  // Save cart to localStorage
  saveCart() {
    localStorage.setItem('geneseeSwiftCart', JSON.stringify(this.items));
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
      badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
      
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
