// Hide loading screen after 1 second
window.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      // Remove from DOM after transition
      setTimeout(function() {
        loadingScreen.remove();
      }, 300);
    }
  }, 1000);
});
