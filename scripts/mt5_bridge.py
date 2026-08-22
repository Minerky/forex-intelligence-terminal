"""
=============================================================================
MetaTrader 5 (MT5) to Forex Intelligence Terminal Bridge
=============================================================================
Script ini menghubungkan terminal MetaTrader 5 Anda (Exness, XM, IC Markets, dll)
langsung ke web Forex Intelligence Terminal secara real-time.

CARA MENJALANKAN:
1. Pastikan MetaTrader 5 sudah terinstal dan login ke akun broker Anda.
2. Install library Python MT5:
   pip install MetaTrader5 requests
3. Jalankan script ini:
   python scripts/mt5_bridge.py
=============================================================================
"""

import time
import requests
import sys

# URL target Forex Terminal Anda (Localhost atau Vercel)
TERMINAL_URL = "http://localhost:3000/api/mt-bridge"
# Jika sudah di-deploy ke Vercel, ganti dengan:
# TERMINAL_URL = "https://forex-intelligence-terminal.vercel.app/api/mt-bridge"

SYMBOLS = [
    "XAUUSD", "EURUSD", "GBPUSD", "USDJPY",
    "USDCHF", "AUDUSD", "USDCAD", "NZDUSD",
    "EURGBP", "EURJPY", "GBPJPY"
]

def main():
    try:
        import MetaTrader5 as mt5
    except ImportError:
        print("[ERROR] Library MetaTrader5 belum terinstall.")
        print("Silakan jalankan: pip install MetaTrader5 requests")
        sys.exit(1)

    print("=" * 60)
    print("Inisialisasi MetaTrader 5 Bridge...")
    if not mt5.initialize():
        print(f"[ERROR] Gagal menghubungkan ke MT5: {mt5.last_error()}")
        sys.exit(1)

    account_info = mt5.account_info()
    broker_name = account_info.company if account_info else "MetaTrader 5 Broker"
    account_num = account_info.login if account_info else "Demo"

    print(f"✓ Berhasil terhubung ke MT5: {broker_name} (Akun: {account_num})")
    print(f"✓ Mengirim data tick ke: {TERMINAL_URL}")
    print("=" * 60)
    print("Streaming harga aktif... Tekan Ctrl+C untuk berhenti.")

    while True:
        try:
            quotes = {}
            for sym in SYMBOLS:
                # Coba cari simbol (dengan suffix broker seperti EURUSD.m atau EURUSD+)
                tick = mt5.symbol_info_tick(sym)
                if tick is None:
                    # Coba cari nama simbol di broker
                    symbols_all = mt5.symbols_get()
                    for s in symbols_all:
                        if s.name.startswith(sym):
                            tick = mt5.symbol_info_tick(s.name)
                            break

                if tick:
                    quotes[sym] = {
                        "bid": tick.bid,
                        "ask": tick.ask,
                        "price": (tick.bid + tick.ask) / 2.0,
                        "spread": round((tick.ask - tick.bid) / (0.1 if "XAU" in sym else 0.0001 if "JPY" not in sym else 0.01), 1),
                    }

            if quotes:
                payload = {
                    "broker": broker_name,
                    "account": account_num,
                    "serverTime": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "quotes": quotes
                }
                
                res = requests.post(TERMINAL_URL, json=payload, timeout=2)
                if res.status_code == 200:
                    sys.stdout.write(f"\r[OK] Ticks terkirim: {len(quotes)} instrumen | Emas: ${quotes.get('XAUUSD', {}).get('price', 0):.2f}")
                    sys.stdout.flush()

            time.sleep(1.0) # Kirim update setiap 1 detik
        except KeyboardInterrupt:
            print("\nBridge dihentikan.")
            break
        except Exception as e:
            print(f"\n[Warning] Gagal kirim tick: {e}")
            time.sleep(2.0)

    mt5.shutdown()

if __name__ == "__main__":
    main()
