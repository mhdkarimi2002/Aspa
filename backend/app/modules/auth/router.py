from fastapi import APIRouter, Depends, Response, status

from app.modules.auth.dependencies import AuthServiceDep
from app.modules.auth.rate_limit import limit_auth_requests
from app.modules.auth.schemas import (
    AuthResponse,
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


@router.post("/refresh", response_model=AuthResponse)
async def refresh_tokens(data: RefreshTokenRequest, service: AuthServiceDep) -> AuthResponse:
    return await service.refresh(data)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(data: RefreshTokenRequest, service: AuthServiceDep) -> Response:
    await service.logout(data)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
