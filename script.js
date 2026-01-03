document.getElementById('licenseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const prefix = document.getElementById('prefix').value.trim();
    const daysLimit = parseInt(document.getElementById('daysLimit').value.trim(), 10);
    const key = document.getElementById('licenseKey').value.trim();
    const codeArea = document.getElementById('indicatorCode');
    const errorDiv = document.getElementById('error');
    const code = codeArea.value;
    errorDiv.textContent = '';

    localStorage.setItem('indicatorCode', code);
    localStorage.setItem('prefix', prefix);
    localStorage.setItem('daysLimit', isNaN(daysLimit) ? '' : daysLimit);

    if (!prefix) return errorDiv.textContent = 'Prefix cannot be empty.';
    if (isNaN(daysLimit) || daysLimit < 0) return errorDiv.textContent = 'Days limit must be 0 or a positive integer.';
    if (!key) return errorDiv.textContent = 'License key cannot be empty.';
    if (!/^[a-fA-F0-9]{64}$/.test(key)) return errorDiv.textContent = 'License key must be a 64-character SHA256 hex string.';
    if (!code.trim()) return errorDiv.textContent = 'Indicator code cannot be empty.';

    try {
        const marker = /\/\/\/\/ \/\/\/\/ \/\/\/\/ \/\/\/\/ \/\/\/\/ MAXLICENSE \/\/\/\/ \/\/\/\/ \/\/\/\/ \/\/\/\/ \/\/\/\//;
        const today = new Date();
        const startDate = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
        let daysCheck = '';
        if (daysLimit > 0) {
            daysCheck = `\n   // Days limitation check\n   string startDate = "${startDate}";\n   int daysLimit = ${daysLimit};\n   datetime dtStart;\n   if(StringToTime(startDate, dtStart)) {\n      int daysPassed = (TimeCurrent() - dtStart) / 86400;\n      if(daysPassed > daysLimit) {\n         MessageBox("License expired! Days limit reached.", "License Error", MB_ICONERROR);\n         return INIT_FAILED;\n      }\n   } else {\n      MessageBox("License start date error.", "License Error", MB_ICONERROR);\n      return INIT_FAILED;\n   }`;
        }
        const licenseBlock =
    `   // LICENSE CHECK (injected by Max Online Locker Tool)\n   string raw = "${prefix}" + GetMachineID();\n   string hash = SHA256_hex_from_string(raw);\n   if(hash != "${key}")\n   {\n      MessageBox(\"License key is invalid for this machine!\", \"License Error\", MB_ICONERROR);\n      return INIT_FAILED;\n   }${daysCheck}`;
        if (!marker.test(code)) return errorDiv.textContent = 'License marker not found in indicator code.';
        let patched = code.replace(marker, licenseBlock);

        const helpers =
`string CharArrayToHex(const uchar &arr[])\n{\n   string out = \"\";\n   int n = ArraySize(arr);\n   for(int i=0; i<n; i++)\n      out += StringFormat(\"%02X\", arr[i]);\n   return out;\n}\n\nstring SHA256_hex_from_string(const string s)\n{\n   uchar src[];\n   uchar key[];\n   uchar res[];\n\n   int src_len = StringToCharArray(s, src);\n   if(src_len <= 0) return \"\";\n\n   ArrayResize(key,0);\n\n   int ret = CryptEncode(CRYPT_HASH_SHA256, src, key, res);\n   if(ret <= 0) return \"\";\n\n   return CharArrayToHex(res);\n}\n\nstring GetMachineID()\n{\n   string s = \"\";\n   s += \"ACC:\" + IntegerToString((int)AccountInfoInteger(ACCOUNT_LOGIN)) + \";\";\n   s += \"SRV:\" + AccountInfoString(ACCOUNT_SERVER) + \";\";\n   s += \"COMP:\" + TerminalInfoString(TERMINAL_COMPANY) + \";\";\n   s += \"DATA:\" + TerminalInfoString(TERMINAL_DATA_PATH) + \";\";\n   s += \"COMMON:\" + TerminalInfoString(TERMINAL_COMMONDATA_PATH) + \";\";\n   return s;\n}\n\n`;
        const onInitPattern = /(^|\n)\s*int\s+OnInit\s*\(/;
        if (onInitPattern.test(patched)) {
            patched = patched.replace(onInitPattern, '\n' + helpers + 'int OnInit(');
        } else {
            return errorDiv.textContent = 'Could not find int OnInit to insert helpers.';
        }

        const blob = new Blob([patched], {type: 'text/plain'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'Indicator.mq5';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (err) {
        errorDiv.textContent = 'Error: ' + err.message;
    }
});

window.addEventListener('DOMContentLoaded', function() {
    const codeArea = document.getElementById('indicatorCode');
    const prefixInput = document.getElementById('prefix');
    const daysLimitInput = document.getElementById('daysLimit');
    const saved = localStorage.getItem('indicatorCode');
    const savedPrefix = localStorage.getItem('prefix');
    const savedDaysLimit = localStorage.getItem('daysLimit');
    if (saved !== null) codeArea.value = saved;
    if (savedPrefix !== null) prefixInput.value = savedPrefix;
    if (savedDaysLimit !== null) daysLimitInput.value = savedDaysLimit;
    codeArea.addEventListener('input', function(e) {
        localStorage.setItem('indicatorCode', e.target.value);
    });
    prefixInput.addEventListener('input', function(e) {
        localStorage.setItem('prefix', e.target.value);
    });
    daysLimitInput.addEventListener('input', function(e) {
        localStorage.setItem('daysLimit', e.target.value);
    });
});
