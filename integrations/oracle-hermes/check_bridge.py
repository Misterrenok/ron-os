import hashlib,importlib.util,json,pathlib,threading,urllib.request,urllib.error
root=pathlib.Path(__file__).parent
path='/mcp/test-only-capability'
(root/'config.json').write_text(json.dumps({'hostname':'localhost','path_hash':hashlib.sha256(path.encode()).hexdigest()}))
spec=importlib.util.spec_from_file_location('bridge',root/'bridge.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
srv=m.ThreadingHTTPServer(('127.0.0.1',0),m.Handler);threading.Thread(target=srv.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(srv.server_port)
def call(path,method,params=None,headers=None):
 req=urllib.request.Request(base+path,data=json.dumps({'jsonrpc':'2.0','id':1,'method':method,'params':params or {}}).encode(),headers={'Content-Type':'application/json',**(headers or {})})
 return json.load(urllib.request.urlopen(req))
assert call(path,'initialize')['result']['capabilities']=={'tools':{}}
assert len(call(path,'tools/list')['result']['tools'])==5
assert call(path,'tools/call',{'name':'missing'})['result']['isError']
for bad,headers,expected in [('/mcp/wrong',{},404),(path,{'Origin':'https://evil.invalid'},403)]:
 try:call(bad,'ping',headers=headers);raise AssertionError('Unauthorized request accepted')
 except urllib.error.HTTPError as e:assert e.code==expected
for bad in ['http://evil.invalid/api/x','//evil.invalid/api/x','/other','/api/../x']:
 try:m.local_request(bad);raise AssertionError('Unsafe URL accepted')
 except ValueError:pass
assert m.redact({'api_key':'private','ok':1})=={'api_key':'[REDACTED]','ok':1}
srv.shutdown();(root/'config.json').unlink();print('PASS: initialize, tool discovery, errors, capability auth, origin, local URL bounds, redaction')
