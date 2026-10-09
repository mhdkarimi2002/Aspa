from fastapi import APIRouter, Response, status

from app.modules.auth.dependencies import CurrentUser
from app.modules.users.avatar import router as avatar_router
from app.modules.users.dependencies import UserServiceDep
from app.modules.users.provinces import PROVINCES, Province
from app.modules.users.schemas import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])
router.include_router(avatar_router)


@router.get("/provinces", response_model=list[Province])
async def list_provinces() -> list[Province]:
    return list(PROVINCES)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate, current_user: CurrentUser, service: UserServiceDep
) -> UserResponse:
    user = await service.update_profile(current_user, data)
    return UserResponse.model_validate(user)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(current_user: CurrentUser, service: UserServiceDep) -> Response:
    await service.delete_account(current_user)
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(
        "aspa_refresh", path="/api/auth/session", httponly=True, samesite="strict"
    )
    return response
