// Close all submenus helper
function closeAllSubmenus() {
  document.querySelectorAll('.nav-button-wrapper').forEach(item => {
    const button = item.querySelector('.nav-button');
    const submenu = item.querySelector('.nav-submenu');
    const expandButton = item.querySelector('.expand-submenu-button');

    if (submenu && submenu.classList.contains('clicked')) {
      // First, collapse height and margin immediately
      submenu.classList.remove('clicked');
      submenu.style.maxHeight = null;
      submenu.style.marginTop = null;
      submenu.style.opacity = 0;

      // Delay the opacity transition (after collapse finishes)
      setTimeout(() => {
        item.classList.remove('clicked');
      }, 300); // match the max-height/margin-top transition time

      setTimeout(() => {
        expandButton.textContent = '+';
      }, 700);
    }

    button.classList.remove('button-clicked');
    if (expandButton) expandButton.classList.remove('menu-expanded');
  });
}

// Main submenu click logic
document.querySelectorAll('.nav-button-wrapper').forEach(item => {
  const navButton = item.querySelector('.nav-button');
  const expandButton = item.querySelector('.expand-submenu-button');
  const submenu = item.querySelector('.nav-submenu');

  function openSubmenu() {
    closeAllSubmenus(); // close others first

    submenu.classList.add('clicked');
    submenu.style.maxHeight = submenu.scrollHeight + 'px';
    submenu.style.marginTop = '5px';
    submenu.style.opacity = 1;

    item.classList.add('clicked');
    navButton.classList.add('button-clicked');

    expandButton.textContent = '-';
  }

  navButton.addEventListener('click', function (e) {
    if (submenu) {
      e.preventDefault();
      const isOpen = submenu.classList.contains('clicked');

      if (!isOpen) {
        openSubmenu();
      } else {
        // Navigate if submenu already open
        location.href = navButton.dataset.href;
      }
    } else {
      location.href = navButton.dataset.href;
    }
  });

  expandButton.addEventListener('click', function (e) {
    if (submenu) {
      e.preventDefault();
      const isOpen = submenu.classList.contains('clicked');

      if (!isOpen) {
        openSubmenu();
      } else {
        closeAllSubmenus();
      }
    } else {
      location.href = navButton.dataset.href;
    }
  });
});

function toggleMenu() {
  const menu = document.querySelector(".navigation-menu");
  const body = document.body;
  const backdrop = document.querySelector(".menu-backdrop");

  const isActive = menu.classList.toggle('menu-active');
  backdrop.classList.toggle('menu-active', isActive);
  body.classList.toggle('no-scroll', isActive);

  if (!isActive) {
    // Menu is closing — wait for menu slide animation to finish, then close all submenus
    setTimeout(() => {
      closeAllSubmenus();
    }, 300); // <-- match your menu slide transition duration (adjust if needed)
  }
}

