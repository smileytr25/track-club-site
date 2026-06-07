if (!sessionStorage.getItem('cmsUser')) {
  window.location.href = '/cms/html-source/index.html';
}

const apiBase = window.location.port === '3000' ? '' : 'http://localhost:3000';
const list = document.getElementById('registrationList');
const searchInput = document.getElementById('registrationSearch');
const programFilter = document.getElementById('programFilter');
const paymentFilter = document.getElementById('paymentFilter');
const summary = document.getElementById('registrationSummary');
const form = document.getElementById('registrationForm');
const editorEmpty = document.getElementById('editorEmpty');
const message = document.getElementById('registrationMessage');
const deleteButton = document.getElementById('deleteRegistrationButton');
let registrations = [];
let selectedRegistration = null;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function formatMoney(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format((Number(cents) || 0) / 100);
}

function isPaid(registration) {
  return ['paid', 'waived'].includes(registration.paymentStatus);
}

function statusLabel(status) {
  if (status === 'paid') return 'Paid';
  if (status === 'waived') return 'Waived';
  if (status === 'pending') return 'Pending';
  return 'Unpaid';
}

async function readJson(response) {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text);
  } catch (_error) {
    throw new Error('The API returned an unexpected response. Make sure the API is running on port 3000.');
  }
}

function renderPrograms() {
  const selected = programFilter.value;
  const programs = [...new Set(registrations.map(item => item.program).filter(Boolean))].sort();

  programFilter.innerHTML = '<option value="all">All Programs</option>' + programs.map(program => (
    '<option value="' + escapeAttribute(program) + '">' + escapeHtml(program) + '</option>'
  )).join('');
  programFilter.value = programs.includes(selected) ? selected : 'all';
}

function renderSummary() {
  const paid = registrations.filter(isPaid).length;

  summary.innerHTML = [
    '<div><span>Total</span><strong>' + registrations.length + '</strong></div>',
    '<div><span>Paid</span><strong>' + paid + '</strong></div>',
    '<div><span>Open</span><strong>' + (registrations.length - paid) + '</strong></div>'
  ].join('');
}

function getVisibleRegistrations() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedProgram = programFilter.value;
  const selectedPayment = paymentFilter.value;

  return registrations.filter(registration => {
    const searchable = [
      registration.fullName,
      registration.guardianName,
      registration.email,
      registration.phone,
      registration.program,
      registration.schoolDistrict
    ].join(' ').toLowerCase();
    const matchesSearch = !query || searchable.includes(query);
    const matchesProgram = selectedProgram === 'all' || registration.program === selectedProgram;
    const matchesPayment = selectedPayment === 'all' || registration.paymentStatus === selectedPayment;
    return matchesSearch && matchesProgram && matchesPayment;
  });
}

function renderRegistrations() {
  renderPrograms();
  renderSummary();
  const visible = getVisibleRegistrations();

  if (!visible.length) {
    list.innerHTML = [
      '<div class="event-empty-state">',
      '<span>0</span>',
      '<p>No registrations match your filters.</p>',
      '</div>'
    ].join('');
    return;
  }

  list.innerHTML = visible.map(registration => {
    const selectedClass = selectedRegistration?.id === registration.id ? ' selected' : '';
    const paidMark = isPaid(registration) ? '&#10003; ' : '';
    const phone = registration.phone ? ' &middot; ' + escapeHtml(registration.phone) : '';

    return [
      '<article class="cms-event-card registration-card' + selectedClass + '" tabindex="0" role="button" data-id="' + escapeAttribute(registration.id) + '">',
      '<div>',
      '<p class="event-status payment-' + escapeAttribute(registration.paymentStatus) + '">' + paidMark + escapeHtml(statusLabel(registration.paymentStatus)) + '</p>',
      '<h2>' + escapeHtml(registration.fullName) + '</h2>',
      '<p>' + escapeHtml(registration.guardianName) + ' &middot; ' + escapeHtml(registration.email) + phone + '</p>',
      '</div>',
      '<div class="event-meta">',
      '<span>' + escapeHtml(registration.program) + '</span>',
      '<span>' + formatMoney(registration.registrationFeeCents) + '</span>',
      '</div>',
      '</article>'
    ].join('');
  }).join('');
}

function selectRegistration(id) {
  selectedRegistration = registrations.find(item => item.id === id) || null;
  message.textContent = '';
  message.className = 'auth-message';

  if (!selectedRegistration) {
    form.hidden = true;
    editorEmpty.hidden = false;
    renderRegistrations();
    return;
  }

  editorEmpty.hidden = true;
  form.hidden = false;
  document.getElementById('detailAthlete').textContent = selectedRegistration.fullName + ' (' + (selectedRegistration.dateOfBirth || 'DOB unknown') + ')';
  document.getElementById('detailGuardian').textContent = selectedRegistration.guardianName;
  document.getElementById('detailContact').textContent = selectedRegistration.email + (selectedRegistration.phone ? ' · ' + selectedRegistration.phone : '');
  document.getElementById('editProgram').value = selectedRegistration.program;
  document.getElementById('editSchoolDistrict').value = selectedRegistration.schoolDistrict || '';
  document.getElementById('editPaymentStatus').value = selectedRegistration.paymentStatus;
  document.getElementById('editPaymentReference').value = selectedRegistration.paymentReference || '';
  document.getElementById('editInterestSprints').checked = !!selectedRegistration.interests.sprints;
  document.getElementById('editInterestDistance').checked = !!selectedRegistration.interests.distance;
  document.getElementById('editInterestRelays').checked = !!selectedRegistration.interests.relays;
  document.getElementById('editInterestJumps').checked = !!selectedRegistration.interests.jumps;
  document.getElementById('editInterestThrows').checked = !!selectedRegistration.interests.throws;
  document.getElementById('editAllergies').value = selectedRegistration.allergies || '';
  renderRegistrations();
}

async function loadRegistrations() {
  try {
    const response = await fetch(apiBase + '/api/register/cms');
    const data = await readJson(response);

    if (!response.ok) {
      throw new Error(data.error || 'Unable to load registrations.');
    }

    registrations = data.registrations || [];
    renderRegistrations();
  } catch (error) {
    list.innerHTML = [
      '<div class="event-empty-state">',
      '<span>!</span>',
      '<p>' + escapeHtml(error.message) + '</p>',
      '</div>'
    ].join('');
  }
}

async function saveRegistration(event) {
  event.preventDefault();
  if (!selectedRegistration) return;

  message.textContent = 'Saving...';
  message.className = 'auth-message';

  const payload = {
    program: document.getElementById('editProgram').value,
    schoolDistrict: document.getElementById('editSchoolDistrict').value,
    paymentStatus: document.getElementById('editPaymentStatus').value,
    paymentReference: document.getElementById('editPaymentReference').value,
    interestSprints: document.getElementById('editInterestSprints').checked,
    interestDistance: document.getElementById('editInterestDistance').checked,
    interestRelays: document.getElementById('editInterestRelays').checked,
    interestJumps: document.getElementById('editInterestJumps').checked,
    interestThrows: document.getElementById('editInterestThrows').checked,
    allergies: document.getElementById('editAllergies').value
  };

  try {
    const response = await fetch(apiBase + '/api/register/cms/' + encodeURIComponent(selectedRegistration.id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await readJson(response);

    if (!response.ok) {
      throw new Error(data.error || 'Unable to save registration.');
    }

    registrations = registrations.map(item => item.id === data.registration.id ? data.registration : item);
    selectedRegistration = data.registration;
    message.textContent = 'Saved.';
    message.className = 'auth-message success';
    renderRegistrations();
  } catch (error) {
    message.textContent = error.message;
    message.className = 'auth-message error';
  }
}

async function deleteRegistration() {
  if (!selectedRegistration) return;

  const confirmed = window.confirm('Delete registration for ' + selectedRegistration.fullName + '? This cannot be undone.');
  if (!confirmed) return;

  message.textContent = 'Deleting...';
  message.className = 'auth-message';
  deleteButton.disabled = true;

  try {
    const response = await fetch(apiBase + '/api/register/cms/' + encodeURIComponent(selectedRegistration.id), {
      method: 'DELETE'
    });
    const data = await readJson(response);

    if (!response.ok) {
      throw new Error(data.error || 'Unable to delete registration.');
    }

    registrations = registrations.filter(item => item.id !== selectedRegistration.id);
    selectedRegistration = null;
    form.hidden = true;
    editorEmpty.hidden = false;
    message.textContent = '';
    renderRegistrations();
  } catch (error) {
    message.textContent = error.message;
    message.className = 'auth-message error';
  } finally {
    deleteButton.disabled = false;
  }
}

function generateReportRows() {
  return getVisibleRegistrations().sort((a, b) => (
    (a.program + ' ' + a.lastName + ' ' + a.firstName).localeCompare(b.program + ' ' + b.lastName + ' ' + b.firstName)
  ));
}

function printReport() {
  const rows = generateReportRows();
  const paidCount = rows.filter(isPaid).length;
  const reportWindow = window.open('', '_blank', 'width=1100,height=800');
  const generatedAt = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date());
  const bodyRows = rows.map(row => [
    '<tr>',
    '<td class="paid">' + (isPaid(row) ? '&#10003;' : '') + '</td>',
    '<td>' + escapeHtml(row.fullName) + '</td>',
    '<td>' + escapeHtml(row.program) + '</td>',
    '<td>' + escapeHtml(row.guardianName) + '</td>',
    '<td>' + escapeHtml(row.email) + '</td>',
    '<td>' + escapeHtml(row.phone || '') + '</td>',
    '<td>' + formatMoney(row.registrationFeeCents) + '</td>',
    '<td>' + escapeHtml(statusLabel(row.paymentStatus)) + '</td>',
    '</tr>'
  ].join('')).join('');

  reportWindow.document.write([
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<title>Registration Fee Report</title>',
    '<style>',
    'body { font-family: Arial, sans-serif; margin: 28px; color: #1f2937; }',
    'h1 { margin: 0 0 6px; font-size: 26px; }',
    'p { margin: 0 0 18px; color: #4b5563; }',
    'table { width: 100%; border-collapse: collapse; font-size: 13px; }',
    'th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }',
    'th { background: #f3f4f6; }',
    '.paid { text-align: center; font-size: 18px; font-weight: 700; }',
    '</style>',
    '</head>',
    '<body>',
    '<h1>Registration Fee Report</h1>',
    '<p>' + generatedAt + ' · ' + rows.length + ' registrations · ' + paidCount + ' paid / waived</p>',
    '<table>',
    '<thead>',
    '<tr>',
    '<th>Paid</th>',
    '<th>Athlete</th>',
    '<th>Program</th>',
    '<th>Guardian</th>',
    '<th>Email</th>',
    '<th>Phone</th>',
    '<th>Fee</th>',
    '<th>Status</th>',
    '</tr>',
    '</thead>',
    '<tbody>' + bodyRows + '</tbody>',
    '</table>',
    '</body>',
    '</html>'
  ].join(''));
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
}

function downloadCsv() {
  const rows = generateReportRows();
  const header = ['Paid', 'Athlete', 'Program', 'Guardian', 'Email', 'Phone', 'Fee', 'Payment Status', 'Payment Reference'];
  const csvRows = [header, ...rows.map(row => [
    isPaid(row) ? 'yes' : 'no',
    row.fullName,
    row.program,
    row.guardianName,
    row.email,
    row.phone || '',
    formatMoney(row.registrationFeeCents),
    statusLabel(row.paymentStatus),
    row.paymentReference || ''
  ])];
  const csv = csvRows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'registration-fee-report.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

searchInput.addEventListener('input', renderRegistrations);
programFilter.addEventListener('change', renderRegistrations);
paymentFilter.addEventListener('change', renderRegistrations);
form.addEventListener('submit', saveRegistration);
deleteButton.addEventListener('click', deleteRegistration);
document.getElementById('printReportButton').addEventListener('click', printReport);
document.getElementById('downloadReportButton').addEventListener('click', downloadCsv);

list.addEventListener('click', event => {
  const card = event.target.closest('.registration-card');
  if (!card) return;
  selectRegistration(card.dataset.id);
});

list.addEventListener('keydown', event => {
  if (!['Enter', ' '].includes(event.key)) return;
  const card = event.target.closest('.registration-card');
  if (!card) return;
  event.preventDefault();
  selectRegistration(card.dataset.id);
});

loadRegistrations();
