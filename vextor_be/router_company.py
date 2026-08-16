from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from database import get_db
import models
import schemas
from router_auth import get_current_user, require_admin
from router_activities import record_activity

router = APIRouter(prefix="/api/company", tags=["Company"])

@router.get("", response_model=schemas.Empresa)
def get_company(db: Session = Depends(get_db)):
    company = db.query(models.Empresa).first()
    if not company:
        # Create a default company row if it does not exist
        company = models.Empresa(
            name="Vextor Transportes S.A.S.",
            nit="901.458.125-3",
            address="Calle 100 # 15-42, Oficina 402",
            city="Bogotá, D.C.",
            email="contacto@vextor.com",
            phone="+57 (601) 345-6789"
        )
        db.add(company)
        db.commit()
        db.refresh(company)
    return company

@router.put("", response_model=schemas.Empresa)
def update_company(company_data: schemas.EmpresaUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(require_admin)):
    company = db.query(models.Empresa).first()
    if not company:
        company = models.Empresa(
            name="Vextor Transportes S.A.S.",
            nit="901.458.125-3"
        )
        db.add(company)
        db.commit()
        db.refresh(company)

    update_dict = company_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(company, key, value)

    db.commit()
    db.refresh(company)

    # Record Activity
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(db, current_user.id_usuario, user_name, "CONFIGURACION", "Configuración", "Modificó la información institucional y configuración de la empresa.", str(company.id_empresa))

    return company
