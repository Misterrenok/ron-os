#!/usr/bin/env python3
"""Authorize an independent voice connection using the already trusted account.

Telegram's official acceptLoginToken flow. No QR display, phone number, code,
or password is needed when the existing session can approve the new one.
Original SQLite session and original authorization are preserved.
"""
import asyncio
import contextlib
import json
import os
from pathlib import Path
import sys
from telethon import TelegramClient, functions
from telethon.sessions import StringSession


async def main():
    os.umask(0o077)
    path=Path(sys.argv[1]);cfg=json.loads(path.read_text())
    if cfg.get('independent_voice_session'):
        print('INDEPENDENT_SESSION_ALREADY_CONFIGURED');return
    old=TelegramClient(StringSession(cfg['session']),cfg['api_id'],cfg['api_hash'])
    new=TelegramClient(str(path.parent/'voice.session'),cfg['api_id'],cfg['api_hash'],
                       device_model='Hermes Telegram Voice Bridge',app_version='1.0')
    accepted=False
    try:
        await old.connect()
        if not await old.is_user_authorized():raise RuntimeError('existing_session_unauthorized')
        original=await old.get_me()
        if original.id!=cfg['expected_account_id']:raise RuntimeError('wrong_existing_account')
        await new.connect()
        if not await new.is_user_authorized():
            qr=await new.qr_login()
            waiter=asyncio.create_task(qr.wait(timeout=25))
            await asyncio.sleep(0)
            try:
                await old(functions.auth.AcceptLoginTokenRequest(token=qr.token))
                await waiter
            finally:
                if not waiter.done():waiter.cancel()
                await asyncio.gather(waiter,return_exceptions=True)
        me=await new.get_me()
        if me.id!=original.id or not await new.is_user_authorized():
            raise RuntimeError('wrong_new_account')
        distinct=new.session.auth_key.key!=old.session.auth_key.key
        if not distinct:raise RuntimeError('shared_auth_key')
        new.session.save()
        cfg['session_file']=str(path.parent/'voice.session')
        cfg.pop('session',None)
        cfg['independent_voice_session']=True
        tmp=path.with_suffix('.private-tmp');tmp.write_text(json.dumps(cfg));os.chmod(tmp,0o600)
        tmp.replace(path)
        accepted=True
        state={'new_authorized':True,'same_account':True,'distinct_auth_key':distinct,
               'original_authorized':await old.is_user_authorized()}
        (path.parent/'voice-authorization-state.json').write_text(json.dumps(state))
        print(json.dumps(state))
    finally:
        if not accepted and new.is_connected():
            # Dispose only this newly created authorization on failed onboarding.
            with contextlib.suppress(Exception):
                if await new.is_user_authorized():
                    await new.log_out()
        await new.disconnect()
        await old.disconnect()


if __name__=='__main__':asyncio.run(main())
