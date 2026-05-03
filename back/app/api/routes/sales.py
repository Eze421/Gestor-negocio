from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.sale import PendingSaleRead, SaleCreate, SalePaymentCreate, SaleRead
from app.services.sales import SaleService

router = APIRouter()


@router.get("/", response_model=list[SaleRead])
def list_sales(
    pending_only: bool = False,
    db: Session = Depends(get_db),
) -> list[SaleRead]:
    return SaleService(db).list_sales(pending_only=pending_only)


@router.get("/pending", response_model=list[PendingSaleRead])
def list_pending_sales(db: Session = Depends(get_db)) -> list[PendingSaleRead]:
    return SaleService(db).list_pending_sales()


@router.get("/{sale_id}", response_model=SaleRead)
def get_sale(sale_id: int, db: Session = Depends(get_db)) -> SaleRead:
    try:
        return SaleService(db).get_sale(sale_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/", response_model=SaleRead, status_code=status.HTTP_201_CREATED)
def create_sale(payload: SaleCreate, db: Session = Depends(get_db)) -> SaleRead:
    try:
        return SaleService(db).create_sale(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{sale_id}/payments", response_model=SaleRead)
def register_sale_payment(
    sale_id: int,
    payload: SalePaymentCreate,
    db: Session = Depends(get_db),
) -> SaleRead:
    try:
        return SaleService(db).register_payment(sale_id, payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
