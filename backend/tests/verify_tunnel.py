import urllib.request, ssl, json

ctx = ssl.create_default_context()
base = 'https://prescribed-extension-nice-stage.trycloudflare.com'

print('1. Testing Frontend through tunnel...')
req_fe = urllib.request.Request(f'{base}/', headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req_fe, context=ctx, timeout=10) as resp:
        print('Frontend Status:', resp.status)
        content = resp.read().decode('utf-8')
        print('Content length:', len(content))
        print('Root element found:', ('root' in content))
except Exception as e:
    print('Frontend error:', e)

print('\n2. Testing API through tunnel proxy...')
req_api = urllib.request.Request(f'{base}/api/v1/health', headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req_api, context=ctx, timeout=10) as resp:
        print('API Status:', resp.status)
        body = json.loads(resp.read().decode('utf-8'))
        print('API Health:', body['status'])
        print('Bot Status:', body['components']['telegram_bot']['status'])
except Exception as e:
    print('API error:', e)
