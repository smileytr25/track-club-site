if (!sessionStorage.getItem('cmsUser')) {
  window.location.href = '/cms/html-source/index.html';
}

const apiBase = window.location.port === '3000' ? '' : 'http://localhost:3000';
const pageSelect = document.getElementById('pageSelect');
const frame = document.getElementById('siteCopyFrame');
const copyForm = document.getElementById('copyForm');
const copyText = document.getElementById('copyText');
const queueCopyButton = document.getElementById('queueCopyButton');
const saveCopyButton = document.getElementById('saveCopyButton');
const selectedElementLabel = document.getElementById('selectedElementLabel');
const pendingCount = document.getElementById('pendingCount');
const changeList = document.getElementById('changeList');
const copyMessage = document.getElementById('copyMessage');

const textSelector = 'h1,h2,h3,h4,h5,h6,p,a,button,span,blockquote,li,label,strong,em';
let selectedElement = null;
let selectedSelector = '';
let selectedPagePath = pageSelect.value;
let selectedEventEdit = null;
let queuedChanges = [];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function isEditableTextElement(element) {
  if (!element || !element.matches(textSelector)) return false;
  if (element.closest('script,style,svg,.cart-preview')) return false;
  return !!element.textContent.trim();
}

function getElementSelector(element) {
  const parts = [];
  let current = element;
  const doc = element.ownerDocument;

  while (current && current.nodeType === 1 && current !== doc.body) {
    const tag = current.tagName.toLowerCase();
    const parent = current.parentElement;
    if (!parent) break;

    const sameTagSiblings = Array.from(parent.children).filter(child => child.tagName === current.tagName);
    const index = sameTagSiblings.indexOf(current) + 1;
    parts.unshift(sameTagSiblings.length > 1 ? tag + ':nth-of-type(' + index + ')' : tag);
    current = parent;
  }

  return 'body > ' + parts.join(' > ');
}

function clearSelection() {
  if (selectedElement) {
    selectedElement.classList.remove('cms-copy-selected');
  }

  selectedElement = null;
  selectedSelector = '';
  selectedEventEdit = null;
  selectedElementLabel.textContent = 'None';
  copyText.value = '';
  copyText.disabled = true;
  queueCopyButton.disabled = true;
}

function selectElement(element) {
  if (!isEditableTextElement(element)) return;

  if (selectedElement) {
    selectedElement.classList.remove('cms-copy-selected');
  }

  selectedElement = element;
  selectedSelector = getElementSelector(element);
  selectedPagePath = pageSelect.value;
  const eventCard = element.closest('[data-cms-event-id]');
  const eventField = element.dataset.cmsEventField;
  selectedEventEdit = eventCard && eventField
    ? { eventId: eventCard.dataset.cmsEventId, field: eventField }
    : null;
  selectedElement.classList.add('cms-copy-selected');
  selectedElementLabel.textContent = selectedEventEdit
    ? 'event ' + selectedEventEdit.field + ' · ' + selectedEventEdit.eventId
    : element.tagName.toLowerCase() + ' · ' + selectedSelector;
  copyText.disabled = false;
  queueCopyButton.disabled = false;
  copyText.value = element.textContent.trim();
  copyText.focus();
}

function updatePendingCount() {
  pendingCount.textContent = queuedChanges.length + (queuedChanges.length === 1 ? ' unsaved' : ' unsaved');
}

function renderQueuedChanges() {
  updatePendingCount();

  if (!queuedChanges.length) {
    changeList.innerHTML = [
      '<div class="event-empty-state compact">',
      '<span>0</span>',
      '<p>No queued edits.</p>',
      '</div>'
    ].join('');
    return;
  }

  changeList.innerHTML = queuedChanges.map((change, index) => [
    '<article class="site-copy-change">',
    '<div>',
    '<strong>' + escapeHtml(change.type === 'event' ? change.pageLabel + ' event ' + change.field : change.pageLabel) + '</strong>',
    '<p>' + escapeHtml(change.textContent) + '</p>',
    '</div>',
    '<button type="button" data-index="' + index + '">Remove</button>',
    '</article>'
  ].join('')).join('');
}

function queueSelectedEdit(event) {
  event.preventDefault();
  if (!selectedSelector) return;

  const textContent = copyText.value.trim();
  if (!textContent) return;

  const pageLabel = pageSelect.options[pageSelect.selectedIndex].textContent;
  const existingIndex = queuedChanges.findIndex(change => (
    selectedEventEdit
      ? change.type === 'event' && change.eventId === selectedEventEdit.eventId && change.field === selectedEventEdit.field
      : change.type !== 'event' && change.pagePath === selectedPagePath && change.selector === selectedSelector
  ));
  const change = selectedEventEdit
    ? {
      type: 'event',
      pagePath: selectedPagePath,
      pageLabel,
      eventId: selectedEventEdit.eventId,
      field: selectedEventEdit.field,
      selector: selectedSelector,
      textContent
    }
    : {
      type: 'copy',
      pagePath: selectedPagePath,
      pageLabel,
      selector: selectedSelector,
      textContent
    };

  if (existingIndex >= 0) {
    queuedChanges[existingIndex] = change;
  } else {
    queuedChanges.push(change);
  }

  if (selectedElement) {
    selectedElement.textContent = textContent;
  }

  copyMessage.textContent = 'Queued.';
  copyMessage.className = 'auth-message success';
  renderQueuedChanges();
}

async function saveQueuedChanges() {
  if (!queuedChanges.length) return;

  saveCopyButton.disabled = true;
  copyMessage.textContent = 'Saving...';
  copyMessage.className = 'auth-message';

  try {
    const response = await fetch(apiBase + '/api/site-copy/cms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes: queuedChanges })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to save site copy.');
    }

    queuedChanges = [];
    copyMessage.textContent = 'Saved.';
    copyMessage.className = 'auth-message success';
    renderQueuedChanges();
    frame.contentWindow.location.reload();
  } catch (error) {
    copyMessage.textContent = error.message;
    copyMessage.className = 'auth-message error';
  } finally {
    saveCopyButton.disabled = false;
  }
}

function injectFrameEditor() {
  clearSelection();
  const doc = frame.contentDocument;
  if (!doc) return;

  const style = doc.createElement('style');
  style.textContent = [
    '.cms-copy-hover { outline: 2px solid #f97316 !important; cursor: text !important; }',
    '.cms-copy-selected { outline: 3px solid #22c55e !important; box-shadow: 0 0 0 4px rgba(34,197,94,.2) !important; }'
  ].join('');
  doc.head.appendChild(style);

  doc.addEventListener('mouseover', event => {
    const element = event.target.closest(textSelector);
    if (!isEditableTextElement(element)) return;
    element.classList.add('cms-copy-hover');
  }, true);

  doc.addEventListener('mouseout', event => {
    const element = event.target.closest(textSelector);
    if (!element) return;
    element.classList.remove('cms-copy-hover');
  }, true);

  doc.addEventListener('click', event => {
    const element = event.target.closest(textSelector);
    if (!isEditableTextElement(element)) return;
    event.preventDefault();
    event.stopPropagation();
    selectElement(element);
  }, true);
}

pageSelect.addEventListener('change', () => {
  selectedPagePath = pageSelect.value;
  frame.src = pageSelect.value;
});

frame.addEventListener('load', injectFrameEditor);
copyForm.addEventListener('submit', queueSelectedEdit);
saveCopyButton.addEventListener('click', saveQueuedChanges);
changeList.addEventListener('click', event => {
  const button = event.target.closest('button[data-index]');
  if (!button) return;
  queuedChanges.splice(Number(button.dataset.index), 1);
  renderQueuedChanges();
});

renderQueuedChanges();
