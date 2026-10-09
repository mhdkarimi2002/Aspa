from fastapi import APIRouter, Depends, Request, Response, status

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.modules.auth.dependencies import AuthServiceDep
from app.modules.auth.rate_limit import limit_auth_requests
from app.modules.auth.schemas import (
    AuthResponse,
    LocalAdminLogin,
    OtpRequestResponse,
    OtpVerify,
    PhoneNumberRequest,
    RefreshTokenRequest,
    RegistrationOtpRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"], dependencies=[Depends(limit_auth_requests)])


@router.post(
    "/register/otp/request",
    response_model=OtpRequestResponse,
    response_model_exclude_none=True,
    status_code=status.HTTP_202_ACCEPTED,
)
async def request_registration_otp(
    data: RegistrationOtpRequest, service: AuthServiceDep
) -> OtpRequestResponse:
    return await service.request_registration_otp(data)


@router.post(
    "/register/otp/verify",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
async def verify_registration_otp(data: OtpVerify, service: AuthServiceDep) -> AuthResponse:
    return await service.verify_registration_otp(data)


@router.post(
    "/login/otp/request",
    response_model=OtpRequestResponse,
    response_model_exclude_none=True,
    status_code=status.HTTP_202_ACCEPTED,
)
async def request_login_otp(
    data: PhoneNumberRequest, service: AuthServiceDep
) -> OtpRequestResponse:
    return await service.request_login_otp(data)


@router.post("/login/otp/verify", response_model=AuthResponse)
async def verify_login_otp(data: OtpVerify, service: AuthServiceDep) -> AuthResponse:
    return await service.verify_login_otp(data)


@router.post("/admin/login", response_model=AuthResponse, include_in_schema=False)
async def login_local_admin(data: LocalAdminLogin, service: AuthServiceDep) -> AuthResponse:
    return await service.login_local_admin(data)


@router.post("/refresh", response_model=AuthResponse)
async def refresh_tokens(data: RefreshTokenRequest, service: AuthServiceDep) -> AuthResponse:
    return await service.refresh(data)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(data: RefreshTokenRequest, service: AuthServiceDep) -> Response:
    await service.logout(data)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def set_session_cookie(response: Response, auth: AuthResponse) -> None:
    response.set_cookie(
        "aspa_refresh",
        auth.refresh_token,
        max_age=auth.refresh_expires_in,
        httponly=True,
        secure=get_settings().environment not in {"local", "test"},
        samesite="strict",
        path="/api/auth/session",
    )


@router.post(
    "/otp/request",
    response_model=OtpRequestResponse,
    response_model_exclude_none=True,
    status_code=202,
)
async def request_access_otp(
    data: PhoneNumberRequest, service: AuthServiceDep
) -> OtpRequestResponse:
    return await service.request_access_otp(data)


@router.post("/otp/verify", response_model=AuthResponse)
async def verify_access_otp(
    data: OtpVerify, request: Request, response: Response, service: AuthServiceDep
) -> AuthResponse:
    auth = await service.verify_access_otp(data)
    if request.headers.get("X-Session-Mode") == "cookie":
        set_session_cookie(response, auth)
    return auth


def require_cookie_request(request: Request) -> str:
    if request.headers.get("X-Session-Mode") != "cookie":
        raise AppError("Cookie session header required", status_code=403)
    token = request.cookies.get("aspa_refresh")
    if not token:
        raise AppError("No session", status_code=401)
    return token


@router.post("/session/refresh", response_model=AuthResponse)
async def refresh_cookie(
    request: Request, response: Response, service: AuthServiceDep
) -> AuthResponse:
    auth = await service.refresh(RefreshTokenRequest(refresh_token=require_cookie_request(request)))
    set_session_cookie(response, auth)
    return auth


@router.post("/session/logout", status_code=204)
async def logout_cookie(request: Request, response: Response, service: AuthServiceDep) -> Response:
    token = require_cookie_request(request)
    await service.logout(RefreshTokenRequest(refresh_token=token))
    response.delete_cookie(
        "aspa_refresh", path="/api/auth/session", httponly=True, samesite="strict"
    )
    response.status_code = 204
    return response
