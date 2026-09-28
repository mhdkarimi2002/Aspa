from fastapi import APIRouter, Response, status

from app.modules.auth.dependencies import CurrentUser
from app.modules.users.dependencies import UserServiceDep
from app.modules.users.schemas import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


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
    return Response(status_code=status.HTTP_204_NO_CONTENT)
