#!/usr/bin/env python3
import json, socket, sys
from pathlib import Path
cfg=json.loads(Path(sys.argv[1]).read_text())
req={'action':sys.argv[2] if len(sys.argv)>2 else 'status'}
if len(sys.argv)>3: req['peer']=int(sys.argv[3])
with socket.socket(socket.AF_UNIX) as s:
    s.settimeout(5)
    s.connect(str(Path(cfg['runtime_dir'])/'control.sock'))
    s.sendall(json.dumps(req).encode()+b'\n')
    print(s.recv(8192).decode().strip())
