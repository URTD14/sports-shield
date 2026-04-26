"""
socket_manager.py — Shared Socket.IO instance accessor.

main.py creates the sio instance and calls set_sio() so that
route handlers and background tasks can emit events without
circular imports.
"""

_sio = None


def set_sio(sio_instance):
    global _sio
    _sio = sio_instance


def get_sio():
    return _sio


async def emit(event: str, data: dict, room=None):
    """Emit a Socket.IO event if the server is initialised."""
    if _sio is None:
        return
    if room:
        await _sio.emit(event, data, to=room)
    else:
        await _sio.emit(event, data)
