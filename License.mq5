#property copyright "Max Base."
#property link      "https://github.com/BaseMax"
#property version   "1.00"
#property indicator_chart_window
#property strict
#property indicator_plots 0
 
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

datetime GetServerTime()
{
   return TimeCurrent();
   /*
   datetime t = TimeTradeServer();
   if(t <= 0)
      t = TimeCurrent();
   return t;
   */
}

int OnInit()
{
   string prefix = "";
   string raw = prefix + GetMachineID();
   string hash = SHA256_hex_from_string(raw);

   Alert("NDS - Your License Code: " + hash);
   Comment("NDS - Your License Code: " + hash);
   Print("NDS - Your License Code: " + hash);

   return(INIT_SUCCEEDED);
}

int OnCalculate(const int rates_total,
                const int prev_calculated,
                const datetime &time[],
                const double &open[],
                const double &high[],
                const double &low[],
                const double &close[],
                const long &tick_volume[],
                const long &volume[],
                const int &spread[])
{
   return(rates_total);
}


