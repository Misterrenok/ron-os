"""Single-user MCP bridge. Run as an unprivileged service user behind HTTPS.
The 256-bit connection capability is supplied by the owner, never stored here.
"""
import hashlib,hmac,json,os,pathlib,re,subprocess,threading,time,urllib.request,urllib.error,urllib.parse
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
ROOT=pathlib.Path(__file__).resolve().parent
CFG=json.loads((ROOT/'config.json').read_text())
HOST=CFG['hostname']; BASE=CFG.get('hermes_base','http://127.0.0.1:9119')
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):return None
LOCAL_OPENER=urllib.request.build_opener(NoRedirect)
def local_request(path,method='GET',data=None):
    parsed=urllib.parse.urlsplit(path)
    if parsed.scheme or parsed.netloc or not parsed.path.startswith('/api/') or '..' in parsed.path.split('/'):
        raise ValueError('Only local Hermes /api/ paths are allowed')
    page=urllib.request.urlopen(BASE+'/',timeout=10).read().decode()
    match=re.search(r'__HERMES_SESSION_TOKEN__\s*=\s*["\x27]([^"\x27]+)',page)
    if not match:raise RuntimeError('Hermes local session is unavailable')
    headers={'X-Hermes-Session-Token':match.group(1),'Content-Type':'application/json'}
    raw=None if data is None else json.dumps(data).encode()
    req=urllib.request.Request(BASE+path,data=raw,headers=headers,method=method)
    try:
        with LOCAL_OPENER.open(req,timeout=60) as r:
            body=r.read(24000).decode(errors='replace')
            try:return json.loads(body)
            except ValueError:return {'text':body}
    except urllib.error.HTTPError as e:return {'http_status':e.code,'error':e.read(3000).decode(errors='replace')}
def redact(value):
    if isinstance(value,dict):
        return {k:('[REDACTED]' if any(s in k.lower() for s in ['password','secret','api_key','access_token','refresh_token','session_token']) else redact(v)) for k,v in value.items()}
    if isinstance(value,list):return [redact(v) for v in value]
    return value
TOOLS=[
 {'name':'server_status','description':'Read this Oracle VPS status; reports the bridge user and resource usage. This bridge has no root privileges.','inputSchema':{'type':'object','properties':{}},'annotations':{'readOnlyHint':True}},
 {'name':'server_command','description':'Execute a shell command on the Oracle VPS as the unprivileged ocarun user. Use for authorized inspection or maintenance. Cannot sudo or read protected Hermes home files; use Hermes API tools for Hermes settings. Never request passwords or print private keys.','inputSchema':{'type':'object','properties':{'command':{'type':'string'},'timeout':{'type':'integer','minimum':1,'maximum':60}},'required':['command']},'annotations':{'readOnlyHint':False,'destructiveHint':True}},
 {'name':'hermes_api_schema','description':'Read exact local Hermes dashboard API paths and schemas before using Hermes API operations. Optional substring filter.','inputSchema':{'type':'object','properties':{'filter':{'type':'string'}}},'annotations':{'readOnlyHint':True}},
 {'name':'hermes_read','description':'Read an exact local Hermes dashboard /api/ endpoint discovered with hermes_api_schema. Credentials are redacted.','inputSchema':{'type':'object','properties':{'path':{'type':'string'}},'required':['path']},'annotations':{'readOnlyHint':True}},
 {'name':'hermes_write','description':'Change Hermes settings or perform a Hermes dashboard action through an exact previously inspected /api/ endpoint. Use only for the user\'s authorized change, then verify with hermes_read.','inputSchema':{'type':'object','properties':{'path':{'type':'string'},'method':{'type':'string','enum':['POST','PUT','PATCH','DELETE']},'data':{}},'required':['path','method']},'annotations':{'readOnlyHint':False,'destructiveHint':True}}
]
def execute(name,a):
    if name=='server_status':return {'user':subprocess.check_output(['id','-un'],text=True).strip(),'hostname':os.uname().nodename,'load':os.getloadavg(),'memory':subprocess.check_output(['free','-m'],text=True),'hermes_http':urllib.request.urlopen(BASE+'/',timeout=10).status}
    if name=='server_command':
        t=max(1,min(int(a.get('timeout',30)),60))
        p=subprocess.run(['/bin/bash','-lc',a['command']],capture_output=True,text=True,timeout=t)
        return {'exit_code':p.returncode,'stdout':p.stdout[-20000:],'stderr':p.stderr[-4000:]}
    if name=='hermes_api_schema':
        spec=json.load(urllib.request.urlopen(BASE+'/openapi.json',timeout=10));f=a.get('filter','')
        return {'paths':{k:v for k,v in spec['paths'].items() if f in k},'schemas':spec.get('components',{}).get('schemas',{})}
    if name=='hermes_read':return redact(local_request(a['path']))
    if name=='hermes_write':return redact(local_request(a['path'],a['method'],a.get('data')))
    raise ValueError('Unknown tool')
def caddy_ready():
    # Preserve existing servers. Recreate only this dedicated host after Caddy
    # restarts from its original file; do not replace other routes or services.
    url='http://127.0.0.1:2019/config/apps/http/servers/ron_bridge'
    try:
        existing=json.load(urllib.request.urlopen(url,timeout=5))
        if existing:return
    except urllib.error.HTTPError as e:
        if e.code!=404:raise
    cfg={'listen':[':443'],'routes':[{'match':[{'host':[HOST]}],'handle':[{'handler':'reverse_proxy','upstreams':[{'dial':'127.0.0.1:9120'}]}],'terminal':True}]}
    req=urllib.request.Request(url,data=json.dumps(cfg).encode(),method='PUT',headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=20) as r:r.read()
def maintain_proxy():
    while True:
        try:caddy_ready()
        except Exception as e:print('Proxy maintenance:',type(e).__name__,flush=True)
        time.sleep(60)
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args):pass  # Never log the connection capability.
    def send_json(self,status,obj=None):
        raw=b'' if obj is None else json.dumps(obj,ensure_ascii=False).encode()
        self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(raw)
    def authorized(self):
        digest=hashlib.sha256(urllib.parse.urlsplit(self.path).path.encode()).hexdigest()
        return hmac.compare_digest(digest,CFG['path_hash'])
    def do_GET(self):self.send_json(405 if self.authorized() else 404,{'error':'POST required'} if self.authorized() else None)
    def do_POST(self):
        if not self.authorized():return self.send_json(404)
        origin=self.headers.get('Origin')
        if origin and origin not in ['https://chatgpt.com','https://'+HOST]:return self.send_json(403)
        try:
            n=int(self.headers.get('Content-Length','0'))
            if not 0<n<=65536:return self.send_json(413)
            req=json.loads(self.rfile.read(n));ident=req.get('id');method=req.get('method');params=req.get('params') or {}
            if ident is None:return self.send_json(202)
            if method=='initialize':result={'protocolVersion':params.get('protocolVersion','2025-03-26'),'capabilities':{'tools':{}},'serverInfo':{'name':'Ron Oracle Hermes','version':'1.0.0'},'instructions':'You control Ron\'s Oracle VPS as ocarun. You have no root privileges. Inspect hermes_api_schema before changing Hermes and verify writes. Never disclose connection URLs or credentials.'}
            elif method=='ping':result={}
            elif method=='tools/list':result={'tools':TOOLS}
            elif method=='tools/call':
                try:
                    output=execute(params['name'],params.get('arguments') or {})
                    result={'content':[{'type':'text','text':json.dumps(output,ensure_ascii=False)[:50000]}],'isError':False}
                except Exception as e:result={'content':[{'type':'text','text':str(e)[:2000]}],'isError':True}
            else:return self.send_json(200,{'jsonrpc':'2.0','id':ident,'error':{'code':-32601,'message':'Method not found'}})
            self.send_json(200,{'jsonrpc':'2.0','id':ident,'result':result})
        except Exception:self.send_json(400,{'error':'Invalid request'})
if __name__=='__main__':
    os.umask(0o077)
    threading.Thread(target=maintain_proxy,daemon=True).start()
    ThreadingHTTPServer(('127.0.0.1',9120),Handler).serve_forever()
