import pytest
from utils.error_handlers import handle_db_error

class DummyException(Exception):
    pass

@pytest.mark.asyncio
def test_handle_db_error():
    exc = DummyException("fail")
    import pytest
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as e:
        handle_db_error("fail", exc)
    assert e.value.status_code == 500
