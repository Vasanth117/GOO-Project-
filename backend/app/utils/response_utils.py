from fastapi import HTTPException, status


def success_response(data=None, message: str = "Success"):
    return {"success": True, "message": message, "data": data}


def error_response(message: str, status_code: int = 400):
    raise HTTPException(status_code=status_code, detail=message)


def not_found(resource: str = "Resource"):
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} not found"
    )


def unauthorized(message: str = "Not authorized"):
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=message,
        headers={"WWW-Authenticate": "Bearer"},
    )


def forbidden(message: str = "Access forbidden"):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=message
    )
