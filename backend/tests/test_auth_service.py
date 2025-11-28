import pytest
from services.auth_service import auth_service

@pytest.mark.parametrize("password", ["abc123", "secure!@#", "Pa$$w0rd"])
def test_hash_and_verify_password(password):
    hashed = auth_service.get_password_hash(password)
    assert hashed != password
    assert auth_service.verify_password(password, hashed)
    assert not auth_service.verify_password(password + "x", hashed)
