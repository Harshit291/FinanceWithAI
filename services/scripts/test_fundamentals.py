import yfinance as yf

t = yf.Ticker("RELIANCE.NS")
info = t.info
keys_with_data = {k: v for k, v in info.items() if v is not None}
print("Available keys with data:", list(keys_with_data.keys())[:35])
print()
print("PE Ratio:", info.get("trailingPE"))
print("Forward PE:", info.get("forwardPE"))
print("Market Cap:", info.get("marketCap"))
print("EPS (trailing):", info.get("trailingEps"))
print("Revenue:", info.get("totalRevenue"))
print("Net Margins:", info.get("profitMargins"))
print("Book Value:", info.get("bookValue"))
print("Debt/Equity:", info.get("debtToEquity"))
print("ROE:", info.get("returnOnEquity"))
print("Dividend Yield:", info.get("dividendYield"))
print("52W High:", info.get("fiftyTwoWeekHigh"))
print("52W Low:", info.get("fiftyTwoWeekLow"))
print()

qf = t.quarterly_financials
print("Quarterly Financials columns:", list(qf.columns) if not qf.empty else "empty")
if not qf.empty:
    print(qf.head())
