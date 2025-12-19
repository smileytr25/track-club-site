// NeonDB-style horizontal navigation with dropdown functionality

// Mobile menu toggle function (must be global for onclick attribute)
function toggleMenu() {
  const navContent = document.querySelector('.nav-content');
  const backdrop = document.querySelector('.menu-backdrop');
  const body = document.body;
  const hamburger = document.querySelector('.mobile-menu-toggle');

  if (!navContent) return; // Safety check

  const isActive = navContent.classList.toggle('menu-active');
  backdrop.classList.toggle('menu-active', isActive);
  body.classList.toggle('no-scroll', isActive);
  
  // Animate hamburger to X
  if (hamburger) {
    const hamburgers = hamburger.querySelectorAll('.hamburger');
    if (isActive) {
      hamburgers[0].style.transform = 'rotate(45deg) translateY(7px)';
      hamburgers[1].style.opacity = '0';
      hamburgers[2].style.transform = 'rotate(-45deg) translateY(-7px)';
    } else {
      hamburgers[0].style.transform = '';
      hamburgers[1].style.opacity = '1';
      hamburgers[2].style.transform = '';
    }
  }
}

// Desktop dropdown hover (already handled by CSS :hover)
// Mobile dropdown click functionality
document.addEventListener('DOMContentLoaded', function() {
  // Setup dropdown triggers
  document.querySelectorAll('.dropdown-trigger').forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      // Only for mobile view
      if (window.innerWidth <= 1200) {
        e.preventDefault();
        const dropdown = this.closest('.nav-dropdown');
        const wasOpen = dropdown.classList.contains('mobile-open');
        
        // Close all other dropdowns
        document.querySelectorAll('.nav-dropdown').forEach(d => {
          d.classList.remove('mobile-open');
        });
        
        // Toggle current dropdown
        if (!wasOpen) {
          dropdown.classList.add('mobile-open');
        }
      }
    });
  });

  // Close mobile menu when clicking backdrop
  const backdrop = document.querySelector('.menu-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', toggleMenu);
  }

  // Close mobile menu when clicking a link
  document.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
    link.addEventListener('click', function(e) {
      if (window.innerWidth <= 1200 && !this.classList.contains('dropdown-trigger')) {
        const navContent = document.querySelector('.nav-content');
        if (navContent && navContent.classList.contains('menu-active')) {
          toggleMenu();
        }
      }
    });
  });

  // Close mobile dropdowns when resizing to desktop
  window.addEventListener('resize', function() {
    if (window.innerWidth > 1200) {
      document.querySelectorAll('.nav-dropdown').forEach(d => {
        d.classList.remove('mobile-open');
      });
      
      // Also close mobile menu if open
      const navContent = document.querySelector('.nav-content');
      if (navContent && navContent.classList.contains('menu-active')) {
        toggleMenu();
      }
    }
  });
  
  // Desktop: allow click-to-toggle persistent dropdowns so they remain
  // visible even when hovering other nav-links. Click again or click outside
  // to close. This does not affect mobile behavior (<=1200px).
  document.querySelectorAll('.dropdown-trigger').forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      if (window.innerWidth > 1200) {
        e.preventDefault();
        const dropdown = this.closest('.nav-dropdown');
        const isOpen = dropdown.classList.toggle('open');
        if (isOpen) {
          dropdown.setAttribute('data-sticky', 'true');
        } else {
          dropdown.removeAttribute('data-sticky');
        }
      }
    });
  });

  // Clicking outside closes any sticky open dropdowns (desktop only)
  document.addEventListener('click', function(e) {
    if (window.innerWidth > 1200) {
      const inside = e.target.closest('.nav-dropdown');
      if (!inside) {
        document.querySelectorAll('.nav-dropdown').forEach(d => {
          if (d.hasAttribute('data-sticky')) {
            d.classList.remove('open');
            d.removeAttribute('data-sticky');
          }
        });
      }
    }
  });

  // Ensure programmatic opens are cleared when switching to mobile
  window.addEventListener('resize', function() {
    if (window.innerWidth <= 1200) {
      document.querySelectorAll('.nav-dropdown').forEach(d => {
        d.classList.remove('open');
        d.removeAttribute('data-sticky');
      });
    }
  });
});

