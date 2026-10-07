import sys
import urllib.request
import re

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://www.youtube.com/watch?v=gK4gON8hvLc'
req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8'
})

try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    title_m = re.search(r'<title>(.*?)</title>', html)
    print("TITLE:", title_m.group(1) if title_m else "N/A")

    matches = re.findall(r'"title":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"', html)
    print("RUNS TITLES:", matches[:5])

    short_desc = re.findall(r'"shortDescription":\s*"([^"]+)"', html)
    print("SHORT DESC:", short_desc[:3])

except Exception as e:
    print("ERROR:", e)
