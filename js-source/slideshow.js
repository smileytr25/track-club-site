let slideIndex = 0;
const slides = document.getElementsByClassName('mySlides');
const dots   = document.getElementsByClassName('dot');
let isAnimating = false;
let autoTimer;

function showSlides(n) {
  if (isAnimating) return;
  clearInterval(autoTimer);

  const oldIndex = slideIndex;
  const rawIndex = n;
  let newIndex   = rawIndex;

  // wrap around
  if (newIndex >= slides.length) newIndex = 0;
  if (newIndex < 0)              newIndex = slides.length - 1;

  // same slide? just restart auto
  if (newIndex === oldIndex) {
    restartAuto();
    return;
  }

  // determine direction based on raw input
  const direction = rawIndex > oldIndex ? 'next' : 'prev';

  isAnimating = true;
  const outgoing = slides[oldIndex];
  const incoming = slides[newIndex];

  // prepare incoming off-screen
  incoming.style.display = 'block';
  incoming.classList.add(
    direction === 'next' ? 'slide-in-from-right' : 'slide-in-from-left'
  );

  // force reflow for starting position
  incoming.getBoundingClientRect();

  // animate outgoing & incoming
  outgoing.classList.add('slide-exit');
  outgoing.classList.add(
    direction === 'next' ? 'slide-to-left' : 'slide-to-right'
  );
  incoming.classList.add('slide-active');

  // update dots
  if (dots[oldIndex]) dots[oldIndex].classList.remove('active');
  if (dots[newIndex]) dots[newIndex].classList.add('active');

  // cleanup after transition
  outgoing.addEventListener('transitionend', function handler() {
    outgoing.style.display = 'none';
    outgoing.classList.remove('slide-exit', 'slide-to-left', 'slide-to-right');
    incoming.classList.remove('slide-in-from-right', 'slide-in-from-left', 'slide-active');
    outgoing.removeEventListener('transitionend', handler);

    slideIndex = newIndex;
    isAnimating = false;
    restartAuto();
  });
}

function restartAuto() {
  autoTimer = setInterval(() => showSlides(slideIndex + 1), 10000);
}

// initialize on load
for (let s of slides) s.style.display = 'none';
slides[slideIndex].style.display = 'block';
if (dots[slideIndex]) dots[slideIndex].classList.add('active');
restartAuto();