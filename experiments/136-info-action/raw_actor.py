"""One subscription-authenticated app-server turn, no retries or outcome hints."""
import json
from pathlib import Path
import subprocess
import sys

from raw_entry import BASE, SCHEMA
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '136-stop-gate'))
from appserver_actor import rpc

MODEL = 'gpt-5.6-sol'
EFFORT = 'high'


def main():
    sys.stdin.reconfigure(encoding='utf-8')
    sys.stdout.reconfigure(encoding='utf-8')
    request = json.load(sys.stdin)['request']
    proc = subprocess.Popen([sys.argv[1], 'app-server', '--listen', 'stdio://',
        '--disable', 'plugins', '--disable', 'apps', '-c', 'mcp_servers={}'],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, encoding='utf-8', bufsize=1)
    try:
        rpc(proc, 1, 'initialize', {'clientInfo': {'name': 'ron_136_raw_entry', 'version': '0.1'}})
        proc.stdin.write(json.dumps({'method': 'initialized', 'params': {}}) + '\n')
        proc.stdin.flush()
        account = rpc(proc, 2, 'account/read', {})
        if account.get('account', {}).get('type') != 'chatgpt':
            raise RuntimeError('ChatGPT subscription account required; no API fallback')
        started = rpc(proc, 3, 'thread/start', {'cwd': str(Path.cwd()),
            'model': MODEL, 'baseInstructions': BASE, 'developerInstructions': BASE,
            'sandbox': 'read-only', 'approvalPolicy': 'never', 'ephemeral': False,
            'config': {'features': {'skip_host_skill_discovery': True, 'plugins': False, 'apps': False},
                       'mcp_servers': {}}})
        thread_id = started['thread']['id']
        params = {'threadId': thread_id, 'input': [{'type': 'text', 'text': request}],
                  'outputSchema': SCHEMA, 'sandboxPolicy': {'type': 'readOnly'},
                  'approvalPolicy': 'never', 'model': MODEL, 'effort': EFFORT}
        proc.stdin.write(json.dumps({'id': 4, 'method': 'turn/start', 'params': params}) + '\n')
        proc.stdin.flush()
        trace, message, usage = [], None, None
        while True:
            line = proc.stdout.readline()
            if not line:
                raise RuntimeError('app-server ended early')
            event = json.loads(line)
            method = event.get('method', '')
            if event.get('id') == 4 and 'error' in event:
                raise RuntimeError(str(event['error']))
            if method == 'thread/tokenUsage/updated':
                usage = event.get('params')
            if method in ('item/completed', 'turn/completed', 'turn/started'):
                trace.append(event)
            if method == 'item/completed':
                item = event.get('params', {}).get('item', {})
                if item.get('type') == 'agentMessage':
                    message = item.get('text')
                elif item.get('type') not in ('reasoning', 'userMessage'):
                    raise RuntimeError('unexpected tool/action item: ' + str(item.get('type')))
            if method == 'turn/completed':
                turn = event.get('params', {}).get('turn', {})
                if turn.get('status') != 'completed' or message is None:
                    raise RuntimeError('turn not completed: ' + str(turn))
                break
        print(json.dumps({'thread_id': thread_id, 'model': MODEL, 'effort': EFFORT,
            'reported_model': started.get('model'), 'subscription_auth': True,
            'extraction': json.loads(message), 'usage': usage, 'trace': trace}, ensure_ascii=False))
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == '__main__':
    main()
