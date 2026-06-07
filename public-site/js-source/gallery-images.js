const galleryImages = [
  { file: "Photo Jul 19 2025, 1 34 11 PM.jpg", caption: "Women's Relay" },
  { file: "Photo Jul 19 2025, 2 06 05 PM.jpg", caption: "138 Running Hard" },
  { file: "Photo Jul 19 2025, 2 11 49 PM.jpg", caption: "152 Running Hard" },
  { file: "Photo Jul 19 2025, 2 17 36 PM.jpg", caption: "148 Finishing Strong" },
  { file: "Photo Jul 19 2025, 2 28 10 PM.jpg", caption: "132 Celebrating Victory" },
  { file: "Photo Jul 19 2025, 2 51 42 PM.jpg", caption: "Team Photo 2025" },
  { file: "Photo Jul 19 2025, 3 00 42 PM.jpg", caption: "157 All Smiles" },
  { file: "Photo Jul 19 2025, 9 45 48 AM (2).jpg", caption: "Long Jump Action" },
  { file: "Photo Jul 19 2025, 9 45 48 AM.jpg", caption: "146 Hitting the Dirt" },
  { file: "Photo Jul 19 2025, 9 54 21 AM.jpg", caption: "Bryson Letting It Fly" },
  { file: "Photo Jul 19 2025, 10 02 16 AM.jpg", caption: "151 Pushing Through" },
  { file: "Photo Jul 19 2025, 10 11 01 AM.jpg", caption: "156 In Full Focus" },
  { file: "Photo Jul 19 2025, 10 11 42 AM.jpg", caption: "146 Holding Up The Medals" },
  { file: "Photo Jul 19 2025, 10 36 26 AM (1).jpg", caption: "Pure Power" },
  { file: "Photo Jul 19 2025, 10 43 32 AM (1).jpg", caption: "122 Using Full Extension" },
  { file: "Photo Jul 19 2025, 10 48 20 AM.jpg", caption: "133 Having Fun" },
  { file: "Photo Jul 19 2025, 10 49 33 AM.jpg", caption: "120 Mid-Stride" },
  { file: "Photo Jul 19 2025, 10 52 39 AM.jpg", caption: "151 Gaining Ground" },
  { file: "Photo Jul 19 2025, 10 56 04 AM.jpg", caption: "130 Focused Finish" },
  { file: "Photo Jul 19 2025, 10 57 42 AM.jpg", caption: "135 Reaching Out" },
  { file: "Photo Jul 19 2025, 11 00 14 AM (1).jpg", caption: "143 Perfect Form" },
  { file: "Photo Jul 19 2025, 11 01 22 AM.jpg", caption: "140 Fighting Through" },
  { file: "Photo Jul 19 2025, 11 03 04 AM.jpg", caption: "124 Smiling The Whole Way" },
  { file: "Photo Jul 19 2025, 11 07 16 AM.jpg", caption: "127 Determined Finish" },
  { file: "Photo Jul 19 2025, 11 08 05 AM (1).jpg", caption: "122 All In" },
  { file: "Photo Jul 19 2025, 11 18 31 AM.jpg", caption: "142 Running Hard" },
  { file: "Photo Jul 19 2025, 11 24 06 AM.jpg", caption: "141 Catching Up" },
  { file: "Photo Jul 19 2025, 11 32 57 AM.jpg", caption: "High Jump Focus" },
  { file: "Photo Jul 19 2025, 11 45 48 AM.jpg", caption: "126 Off The Blocks" },
  { file: "Photo Jul 19 2025, 12 03 53 PM.jpg", caption: "126 Taking Off" },
  { file: "Photo Jul 19 2025, 12 06 55 PM (1).jpg", caption: "141 Going Airbourne" },
  { file: "Photo Jul 19 2025, 12 06 55 PM.jpg", caption: "141 Soaring High" },
  { file: "Photo Jul 19 2025, 12 09 11 PM.jpg", caption: "158 Securing The Landing" },
  { file: "Photo Jul 19 2025, 12 10 20 PM.jpg", caption: "127 Hitting The Hurdle" },
  { file: "Photo Jul 19 2025, 12 10 22 PM.jpg", caption: "127 Clearing The Hurdle" },
  { file: "Photo Jul 19 2025, 12 10 24 PM.jpg", caption: "127 Focused On Form" },
  { file: "Photo Jul 19 2025, 12 11 03 PM.jpg", caption: "123 On The Move" },
  { file: "Photo Jul 19 2025, 12 12 24 PM.jpg", caption: "161 Mid Air" },
  { file: "Photo Jul 19 2025, 12 22 11 PM.jpg", caption: "134 Eyes On The Prize" },
  { file: "Photo Jul 19 2025, 12 24 11 PM.jpg", caption: "139 Clearing The Hurdle" },
  { file: "Photo Jul 19 2025, 12 24 13 PM.jpg", caption: "Up And Over" },
  { file: "Photo Jul 19 2025, 12 25 55 PM (1).jpg", caption: "144 Full Extension" },
  { file: "Photo Jul 19 2025, 12 25 59 PM.jpg", caption: "Coach Cheering On" },
  { file: "Photo Jul 19 2025, 12 38 46 PM.jpg", caption: "120 Doing Work" },
  { file: "Photo Jul 19 2025, 12 41 10 PM.jpg", caption: "151 Giving It Their All" },
  { file: "Photo Jul 19 2025, 12 42 13 PM.jpg", caption: "130 Picking Up Speed" },
  { file: "Photo Jul 19 2025, 12 52 30 PM (1).jpg", caption: "Supporters Cheering" },
  { file: "Photo Jul 19 2025, 12 56 07 PM.jpg", caption: "141 And 149 In The FInal Stretch" },
  { file: "Photo Jul 19 2025, 12 57 58 PM.jpg", caption: "118 Sprinting Strong" },
  { file: "Photo Jul 19 2025, 12 59 31 PM.jpg", caption: "150 Focused Finish" },
  { file: "Photo Jun 21 2025, 2 12 09 PM.jpg", caption: "262 Rounding The Curve" },
  { file: "Photo Jun 21 2025, 2 12 10 PM (1).jpg", caption: "262 Into The Pass"},
  { file: "Photo Jun 21 2025, 2 32 28 PM.jpg", caption: "251 Hitting Peak Speed" },
  { file: "Photo Jun 21 2025, 3 06 00 PM (1).jpg", caption: " 272 Finishing Up Strong" },
  { file: "Photo Jun 21 2025, 3 25 22 PM (1).jpg", caption: "266 Eyes On The Finish" },
  { file: "Photo Jun 21 2025, 3 38 52 PM.jpg", caption: "251 Gliding" },
  { file: "Photo Jun 21 2025, 3 38 56 PM.jpg", caption: "245 In Style" },
  { file: "Photo Jun 21 2025, 3 46 44 PM.jpg", caption: "263 Mid-Stride" },
  { file: "Photo Jun 21 2025, 4 05 59 PM.jpg", caption: "268 Pulling Away" },
  { file: "Photo Jun 21 2025, 4 11 16 PM.jpg", caption: "262 Breathing Easy" },
  { file: "Photo Jun 21 2025, 10 06 24 AM.jpg", caption: "Over The Bar" },
  { file: "Photo Jun 28 2025, 1 05 03 PM.jpg", caption: "Holding Up The Medals" },
  { file: "Photo Jun 28 2025, 1 11 11 PM.jpg", caption: "Hurling The Discus" },
  { file: "Photo Jun 28 2025, 1 14 52 PM.jpg", caption: "Reaching Over The Bar" },
  { file: "Photo Jun 28 2025, 1 17 32 PM.jpg", caption: "378 Running Hard" },
  { file: "Photo Jun 28 2025, 2 38 41 PM.jpg", caption: "391 Running Steady" },
  { file: "Photo Jun 28 2025, 2 38 42 PM.jpg", caption: "393 Pushing Through" },
  { file: "Photo Jun 28 2025, 2 56 27 PM.jpg", caption: "387 Keeping Pace" },
  { file: "Photo Jun 28 2025, 3 27 04 PM.jpg", caption: "395 Working Hard" },
  { file: "Photo Jun 28 2025, 3 45 35 PM (1).jpg", caption: "364 Mid-Air" },
  { file: "Photo Jun 28 2025, 4 13 04 PM (1).jpg", caption: "361 Getting Height" },
  { file: "Photo Jun 28 2025, 10 02 03 AM (1).jpg", caption: "379 Finding The Camera" },
  { file: "Photo Jun 28 2025, 10 03 48 AM.jpg", caption: "398 Watching It Fly" },
  { file: "Photo Jun 28 2025, 11 26 19 AM (1).jpg", caption: "368 Fighting For Extra Inches" },
  { file: "Photo Jun 28 2025, 12 04 15 PM.jpg", caption: "Hurdle Focus" },
  { file: "Photo Jun 28 2025, 12 32 02 PM (1).jpg", caption: "390 Passing The Fans" },
  { file: "Photo Jun 28 2025, 12 34 32 PM.jpg", caption: "370 Getting Busy" },
  { file: "Photo Jun 28 2025, 12 36 52 PM (1).jpg", caption: "Teammates Pushing Each Other" },
  { file: "Photo Jun 28 2025, 12 36 53 PM.jpg", caption: "Keeping Her Distance" },
  { file: "Photo Jun 28 2025, 12 40 33 PM.jpg", caption: "Long Strides" },
  { file: "Photo Jun 28 2025, 12 44 51 PM.jpg", caption: "Finishing The Job" },
  { file: "Photo Jun 29 2025, 1 43 54 PM.jpg", caption: "Coach Fist Bump" },
  { file: "Photo Jun 29 2025, 1 43 57 PM.jpg", caption: "Coach Encouragement" },
  { file: "Photo Jun 29 2025, 2 11 03 PM.jpg", caption: "Relay Pass" },
  { file: "Photo Jun 29 2025, 2 16 57 PM.jpg", caption: "Perfect Exchange" },
  { file: "Photo Jun 29 2025, 2 20 41 PM.jpg", caption: "Time To Go" },
  { file: "Photo Jun 29 2025, 2 20 42 PM.jpg", caption: "Completing The Leg" },
  { file: "Photo Jun 29 2025, 2 26 43 PM.jpg", caption: "Team Coordination" },
  { file: "Photo Jun 29 2025, 12 57 52 PM.jpg", caption: "Shotput Power" }
];

const baseURL = "https://raw.githubusercontent.com/smileytr25/GeneseeSwiftImages/main/";

const slideshow = document.querySelector(".slideshow-container");
const thumbsRow = document.querySelector(".thumb-row");
const prevBtn = slideshow.querySelector(".prev");

galleryImages.forEach((img, index) => {
  const encodedFile = encodeURIComponent(img.file);
  const imageURL = baseURL + encodedFile;

  // Slide
  const slide = document.createElement("div");
  slide.className = "mySlides";
  slide.innerHTML = `
    <img
      src="${imageURL}"
      class="slide-image"
      alt="${img.caption}"
      loading="lazy"
    >
    <div class="text">${img.caption}</div>
  `;
  slideshow.insertBefore(slide, prevBtn);

  // Thumbnail
  const thumb = document.createElement("img");
  thumb.src = imageURL;
  thumb.className = "thumb dot";
  if (index >= 10) thumb.classList.add('extra');
  thumb.alt = img.caption;
  thumb.onclick = () => showSlides(index);
  thumbsRow.appendChild(thumb);
});

// Initialize slideshow
document.addEventListener("DOMContentLoaded", () => {
  showSlides(0);

  // Create mobile toggle button for extra thumbnails
  const thumbsRowEl = document.querySelector('.thumb-row');
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'thumb-toggle';
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.innerHTML = 'Show more ▾';
  toggleBtn.onclick = () => {
    const isCollapsed = thumbsRowEl.classList.toggle('collapsed');
    toggleBtn.setAttribute('aria-expanded', (!isCollapsed).toString());
    toggleBtn.innerHTML = isCollapsed ? 'Show more ▾' : 'Show less ▴';
  };
  if (thumbsRowEl) thumbsRowEl.appendChild(toggleBtn);

  // initial collapsed state on small screens
  const applyInitialCollapse = () => {
    if (window.innerWidth <= 900) {
      thumbsRowEl && thumbsRowEl.classList.add('collapsed');
      toggleBtn && toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn && (toggleBtn.innerHTML = 'Show more ▾');
    } else {
      thumbsRowEl && thumbsRowEl.classList.remove('collapsed');
      toggleBtn && toggleBtn.setAttribute('aria-expanded', 'true');
    }
  };
  applyInitialCollapse();
  window.addEventListener('resize', applyInitialCollapse);

  // Keep loader visible for 5 seconds after page load, then hide it
  setTimeout(() => {
    const loader = document.querySelector('.thumb-loader');
    const thumbsRow = document.querySelector('.thumb-row');
    // reveal thumbnails and hide loader
    if (thumbsRow) thumbsRow.classList.remove('loading');
    if (loader) loader.style.display = 'none';
    // add small visual active state to first thumbnail if present
    const firstThumb = document.querySelector('.thumb-row .thumb');
    if (firstThumb) firstThumb.classList.add('active');
  }, 5000);
});
