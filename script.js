const $ = id => document.getElementById(id);

/* =======================
   FIELDS TO PERSIST
======================= */
const fields = [
    'indicatorCode',
    'outputCode',
    'prefix',
    'daysLimit',
    'minutesLimit',
    'licenseKey'
];

/* =======================
   LOAD / SAVE LOCALSTORAGE
======================= */
window.addEventListener('DOMContentLoaded', () => {
    fields.forEach(id => {
        const el = $(id);
        if (!el) return;

        const saved = localStorage.getItem(id);
        if (saved !== null) el.value = saved;

        el.addEventListener('input', () =>
            localStorage.setItem(id, el.value)
        );
    });
});

/* =======================
   APPLY LICENSE
======================= */
$('applyBtn').addEventListener('click', () => {
    const errorDiv = $('error');
    errorDiv.textContent = '';

    const prefix = $('prefix').value.trim();
    const key = $('licenseKey').value.trim();
    const code = $('indicatorCode').value;

    const daysRaw = $('daysLimit').value.trim();
    const minutesRaw = $('minutesLimit').value.trim();

    const days = daysRaw === '' ? 30 : parseInt(daysRaw, 10);
    const minutes = minutesRaw === '' ? 0 : parseInt(minutesRaw, 10);

    /* ---- VALIDATION ---- */
    if (!prefix) {
        errorDiv.textContent = 'Prefix cannot be empty.';
        return;
    }

    if (!/^[a-fA-F0-9]{64}$/.test(key)) {
        errorDiv.textContent = 'License key must be a valid SHA256 hex string.';
        return;
    }

    if (isNaN(days) || isNaN(minutes)) {
        errorDiv.textContent = 'Days and minutes must be valid integers.';
        return;
    }

    if (days < 0) {
        errorDiv.textContent = 'Days cannot be negative.';
        return;
    }

    if (days === 0 && minutes <= 0) {
        errorDiv.textContent = 'Invalid license duration.';
        return;
    }

    if (!code.trim()) {
        errorDiv.textContent = 'Indicator code cannot be empty.';
        return;
    }

    const marker =
        /\/\/\/\/ \/\/\/\/ \/\/\/\/ \/\/\/\/ \/\/\/\/ MAXLICENSE \/\/\/\/ \/\/\/\/ \/\/\/\/ \/\/\/\//;

    if (!marker.test(code)) {
        errorDiv.textContent = 'License marker not found in indicator code.';
        return;
    }

    /* ---- GENERATE LICENSE BLOCK ---- */
    const totalSeconds = (days * 86400) + (minutes * 60);
    const today = new Date().toISOString().slice(0, 10);

    const licenseBlock = `
   // LICENSE CHECK (injected by Max Online Locker Tool)
   string raw = "${prefix}" + GetMachineID();
   string hash = SHA256_hex_from_string(raw);
   if(hash != "${key}")
   {
      MessageBox("License key is invalid!", "License Error", MB_ICONERROR);
      return INIT_FAILED;
   }

   string licenseStart = "${today}";
   long totalSeconds = ${totalSeconds};

   datetime now = GetServerTime();
   if(now < StringToTime(licenseStart))
      return INIT_FAILED;

   if(now > StringToTime(licenseStart) + totalSeconds)
      return INIT_FAILED;
`;

    const patched = code.replace(marker, licenseBlock);

    $('outputCode').value = patched;
    localStorage.setItem('outputCode', patched);
});

/* =======================
   COPY OUTPUT
======================= */
$('copyBtn').addEventListener('click', async () => {
    const out = $('outputCode').value;
    if (!out) return;
    await navigator.clipboard.writeText(out);
});

/* =======================
   DOWNLOAD OUTPUT
======================= */
$('downloadBtn').addEventListener('click', () => {
    const out = $('outputCode').value;
    if (!out) return;

    const blob = new Blob([out], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Indicator.mq5';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

/* =======================
   CLEAR OUTPUT
======================= */
$('clearBtn').addEventListener('click', () => {
    $('outputCode').value = '';
    localStorage.removeItem('outputCode');
});
