document.getElementById('licenseForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const prefix = document.getElementById('prefix').value.trim();
    const daysRaw = document.getElementById('daysLimit').value.trim();
    const minutesRaw = document.getElementById('minutesLimit').value.trim();
    const key = document.getElementById('licenseKey').value.trim();
    const codeArea = document.getElementById('indicatorCode');
    const errorDiv = document.getElementById('error');
    const code = codeArea.value;

    errorDiv.textContent = '';

    const days = daysRaw === '' ? 30 : parseInt(daysRaw, 10);
    const minutes = minutesRaw === '' ? 0 : parseInt(minutesRaw, 10);

    localStorage.setItem('indicatorCode', code);
    localStorage.setItem('prefix', prefix);
    localStorage.setItem('daysLimit', days);
    localStorage.setItem('minutesLimit', minutes);

    if (!prefix) {
        errorDiv.textContent = 'Prefix cannot be empty.';
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

    if (days === 0 && minutes === 0) {
        errorDiv.textContent = 'Days and minutes cannot both be zero.';
        return;
    }

    if (days === 0 && minutes < 0) {
        errorDiv.textContent = 'Minutes cannot be negative when days is zero.';
        return;
    }

    const totalSeconds = (days * 86400) + (minutes * 60);

    if (totalSeconds <= 0) {
        errorDiv.textContent = 'Total license duration must be greater than zero.';
        return;
    }

    if (!key) {
        errorDiv.textContent = 'License key cannot be empty.';
        return;
    }

    if (!/^[a-fA-F0-9]{64,}$/.test(key)) {
        errorDiv.textContent = 'License key must be a valid SHA256 hex string.';
        return;
    }

    if (!code.trim()) {
        errorDiv.textContent = 'Indicator code cannot be empty.';
        return;
    }

    try {
        const marker =
            /\/\/\/\/ \/\/\/\/ \/\/\/\/ \/\/\/\/ \/\/\/\/ MAXLICENSE \/\/\/\/ \/\/\/\/ \/\/\/\/ \/\/\/\//;

        if (!marker.test(code)) {
            errorDiv.textContent = 'License marker not found in indicator code.';
            return;
        }

        const today = new Date();
        const startDate =
            `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const timeCheck = `
   // TIME LIMIT CHECK
   string licenseStart = "${startDate}";
   long totalSeconds = ${totalSeconds};

   datetime dtStart = StringToTime(licenseStart);
   if(dtStart == 0)
   {
      MessageBox("License start date error.", "License Error", MB_ICONERROR);
      return INIT_FAILED;
   }

   datetime now = TimeCurrent();

   if(now < dtStart)
   {
      MessageBox("License not yet valid.", "License Error", MB_ICONERROR);
      return INIT_FAILED;
   }

   if(now > dtStart + totalSeconds)
   {
      MessageBox("License expired.", "License Error", MB_ICONERROR);
      return INIT_FAILED;
   }`;

        const licenseBlock = `
   // LICENSE CHECK (injected by Max Online Locker Tool)
   string raw = "${prefix}" + GetMachineID();
   string hash = SHA256_hex_from_string(raw);
   if(hash != "${key}")
   {
      MessageBox("License key is invalid for this machine!", "License Error", MB_ICONERROR);
      return INIT_FAILED;
   }${timeCheck}
`;

        let patched = code.replace(marker, licenseBlock);

        const helpers = `
string CharArrayToHex(const uchar &arr[])
{
   string out = "";
   int n = ArraySize(arr);
   for(int i=0; i<n; i++)
      out += StringFormat("%02X", arr[i]);
   return out;
}

string SHA256_hex_from_string(const string s)
{
   uchar src[];
   uchar key[];
   uchar res[];

   int src_len = StringToCharArray(s, src);
   if(src_len <= 0) return "";

   ArrayResize(key,0);

   int ret = CryptEncode(CRYPT_HASH_SHA256, src, key, res);
   if(ret <= 0) return "";

   return CharArrayToHex(res);
}

string GetMachineID()
{
   string s = "";
   s += "ACC:" + IntegerToString((int)AccountInfoInteger(ACCOUNT_LOGIN)) + ";";
   s += "SRV:" + AccountInfoString(ACCOUNT_SERVER) + ";";
   s += "COMP:" + TerminalInfoString(TERMINAL_COMPANY) + ";";
   s += "DATA:" + TerminalInfoString(TERMINAL_DATA_PATH) + ";";
   s += "COMMON:" + TerminalInfoString(TERMINAL_COMMONDATA_PATH) + ";";
   return s;
}
`;

        const onInitPattern = /(^|\n)\s*int\s+OnInit\s*\(/;
        if (onInitPattern.test(patched)) {
            patched = patched.replace(onInitPattern, '\n' + helpers + '\nint OnInit(');
        } else {
            errorDiv.textContent = 'Could not find int OnInit() in indicator.';
            return;
        }

        const blob = new Blob([patched], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Indicator.mq5';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

    } catch (err) {
        errorDiv.textContent = 'Error: ' + (err?.message || err);
    }
});

window.addEventListener('DOMContentLoaded', function () {
    const codeArea = document.getElementById('indicatorCode');
    const prefixInput = document.getElementById('prefix');
    const daysInput = document.getElementById('daysLimit');
    const minutesInput = document.getElementById('minutesLimit');

    const savedCode = localStorage.getItem('indicatorCode');
    const savedPrefix = localStorage.getItem('prefix');
    const savedDays = localStorage.getItem('daysLimit');
    const savedMinutes = localStorage.getItem('minutesLimit');

    if (savedCode !== null) codeArea.value = savedCode;
    if (savedPrefix !== null) prefixInput.value = savedPrefix;
    if (savedDays !== null) daysInput.value = savedDays;
    if (savedMinutes !== null) minutesInput.value = savedMinutes;

    codeArea.addEventListener('input', e =>
        localStorage.setItem('indicatorCode', e.target.value)
    );
    prefixInput.addEventListener('input', e =>
        localStorage.setItem('prefix', e.target.value)
    );
    daysInput.addEventListener('input', e =>
        localStorage.setItem('daysLimit', e.target.value)
    );
    minutesInput.addEventListener('input', e =>
        localStorage.setItem('minutesLimit', e.target.value)
    );
});
