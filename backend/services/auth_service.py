import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from jwt.exceptions import InvalidTokenError, DecodeError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from models.auth_models import TokenData, User as UserResponse
from models.database_models import User
from database import get_db_session
from config import config
import logging

# Initialize password hashing
password_hash = PasswordHash.recommended()

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


class AuthService:
    def __init__(self):
        # SQLAlchemy doesn't need explicit DB config like mysql.connector
        # Precompute a fake hashed password to use for timing-protection in
        # authenticate_user when the username does not exist. This avoids
        # performing an expensive hash() operation on every failed lookup.
        self._logger = logging.getLogger(__name__)
        try:
            self._fake_hashed = password_hash.hash("managepetro_dummy_hash")
        except Exception:
            # Fallback: if hashing fails for some reason, store None and
            # handle it defensively in authenticate_user.
            self._fake_hashed = None

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return password_hash.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        return password_hash.hash(password)

    async def get_user_by_username(
        self, session: AsyncSession, username: str
    ) -> Optional[User]:
        """Get user by username from database using SQLAlchemy 2.0"""
        try:
            stmt = select(User).where(User.username == username)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}",
            )

    async def get_user_by_email(
        self, session: AsyncSession, email: str
    ) -> Optional[User]:
        """Get user by email from database using SQLAlchemy 2.0"""
        try:
            stmt = select(User).where(User.email == email)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}",
            )

    async def create_user(
        self, session: AsyncSession, username: str, email: str, password: str
    ) -> User:
        """Create a new user in the database using SQLAlchemy 2.0"""
        self._logger.info(f"create_user called for username: {username}")
        try:
            # Check if username or email already exists
            self._logger.debug(f"Checking if username exists: {username}")
            existing_user = await self.get_user_by_username(session, username)
            if existing_user:
                self._logger.warning(f"Username already exists: {username}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already exists",
                )

            self._logger.debug(f"Checking if email exists: {email}")
            existing_email = await self.get_user_by_email(session, email)
            if existing_email:
                self._logger.warning(f"Email already registered: {email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )

            self._logger.debug("Hashing password...")
            hashed_password = self.get_password_hash(password)

            # Create new user using SQLAlchemy model
            self._logger.debug("Creating User model instance...")
            new_user = User(
                username=username,
                email=email,
                hashed_password=hashed_password,
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            self._logger.debug(f"User model created: {new_user.username}")

            self._logger.debug("Adding user to session...")
            session.add(new_user)

            self._logger.debug("Committing transaction...")
            await session.commit()

            self._logger.debug("Refreshing user object...")
            await session.refresh(new_user)

            self._logger.info(
                f"User created successfully: {new_user.username} (ID: {new_user.id})"
            )
            return new_user

        except HTTPException:
            self._logger.debug("HTTPException raised, re-raising...")
            raise
        except IntegrityError as ie:
            self._logger.error(
                f"IntegrityError during user creation: {str(ie)}", exc_info=True
            )
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already exists",
            )
        except Exception as e:
            self._logger.error(
                f"Unexpected error during user creation: {type(e).__name__}: {str(e)}",
                exc_info=True,
            )
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {str(e)}",
            )

    async def authenticate_user(
        self, session: AsyncSession, username: str, password: str
    ) -> Optional[User]:
        """Authenticate user with username/email and password with timing attack protection"""
        # Try to get user by username first
        user = await self.get_user_by_username(session, username)

        # If not found, try by email
        if not user:
            user = await self.get_user_by_email(session, username)

        if not user:
            # Perform dummy hash operation to prevent timing attacks.
            # Use the precomputed fake hash to avoid expensive hash() calls
            try:
                if self._fake_hashed is not None:
                    # Verify against the precomputed fake hash to keep timing
                    # characteristics similar to a real user verification.
                    password_hash.verify(password, self._fake_hashed)
                else:
                    # Last resort: fall back to a one-off hash/verify to keep
                    # behavior correct, but this should be rare.
                    tmp = password_hash.hash("managepetro_dummy_hash")
                    password_hash.verify(password, tmp)
            except Exception:
                # Swallow any exception: the goal is only to make timing similar
                self._logger.debug(
                    "Dummy password verification failed during auth timing-protection"
                )
            return None

        if not self.verify_password(password, user.hashed_password):
            return None

        return user

    def create_access_token(
        self, data: dict, expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        current_time = datetime.now(timezone.utc)

        if expires_delta:
            expire = current_time + expires_delta
        else:
            expire = current_time + timedelta(
                minutes=config.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
            )

        to_encode.update(
            {
                "exp": expire,
                "iat": current_time,
                "nbf": current_time,
            }
        )
        encoded_jwt = jwt.encode(
            to_encode, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM
        )
        return encoded_jwt

    async def get_current_user(
        self,
        token: str = Depends(oauth2_scheme),
        session: AsyncSession = Depends(get_db_session),
    ) -> UserResponse:
        """Get current user from JWT token using SQLAlchemy 2.0"""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = jwt.decode(
                token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM]
            )
            username: str = payload.get("sub")
            if username is None:
                raise credentials_exception

            # Additional JWT claims validation
            issued_at = payload.get("iat")
            expires_at = payload.get("exp")
            current_time = datetime.now(timezone.utc).timestamp()

            # Validate token timing
            if issued_at and issued_at > current_time:
                raise credentials_exception
            if expires_at and expires_at < current_time:
                raise credentials_exception

            token_data = TokenData(username=username)
        except (InvalidTokenError, DecodeError, Exception):
            raise credentials_exception

        user = await self.get_user_by_username(
            session=session, username=token_data.username
        )
        if user is None:
            raise credentials_exception

        # Convert SQLAlchemy model to Pydantic response model
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            created_at=user.created_at,
        )

    async def get_current_active_user(self, current_user: UserResponse) -> UserResponse:
        """Get current active user"""
        if not current_user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        return current_user


# Create global instance
auth_service = AuthService()


# Export dependency functions for use in routes
async def get_current_user(
    token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_db_session)
) -> UserResponse:
    """Dependency to get current user"""
    return await auth_service.get_current_user(token, session)


async def get_current_active_user(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """Dependency to get current active user"""
    return await auth_service.get_current_active_user(current_user)
