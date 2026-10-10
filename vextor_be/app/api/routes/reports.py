"""
Endpoints para la gestión y exportación de Reportes del Sistema
"""
import io
import csv
from uuid import UUID
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload, joinedload

from app.database import get_db
from app.models import Vehiculo, Conductor, Ruta, Mantenimiento, Usuario, Reporte, AsignacionConductor, AsignacionVehiculo
from app.api.routes.auth import get_current_user
from app.services.audit_service import AuditService

ADMIN_ROLE_ID = UUID("11111111-2222-3333-4444-555555555551")

router = APIRouter(tags=["Reports"])


class LogReportRequest(BaseModel):
    report_name: str
    format: str


@router.post("/log")
def log_report_generation(
    req: LogReportRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Registra la actividad de generación de un reporte en la auditoría"""
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    AuditService.record_activity(
        db,
        id_usuario=current_user.id_usuario,
        nombres_usuario=user_name,
        tipo_accion="REPORTE",
        modulo="Reportes",
        descripcion=f"Generó y exportó el reporte '{req.report_name}' en formato {req.format.upper()}.",
        id_registro_afectado=None
    )
    return {"status": "success"}


@router.get("/data")
def get_report_data(
    report_type: str = Query(..., description="Tipo de reporte: vehicles, drivers, routes, maintenances, day, week, month, general"),
    status: Optional[str] = None,
    search: Optional[str] = None,
    date_start: Optional[str] = None,
    date_end: Optional[str] = None,
    type_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtiene el conjunto de datos filtrado para la vista previa de reportes"""
    try:
        data = fetch_filtered_report_data(db, report_type, status, search, date_start, date_end, type_filter)
        return {
            "status": "success",
            "report_type": report_type,
            "total_count": len(data),
            "items": data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error procesando datos del reporte: {str(e)}")


@router.get("/export")
def export_report_file(
    report_type: str = Query("general"),
    format: str = Query("csv"),
    status: Optional[str] = None,
    search: Optional[str] = None,
    date_start: Optional[str] = None,
    date_end: Optional[str] = None,
    type_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Genera y descarga un archivo real (PDF/CSV/XLSX) con los datos del reporte filtrado"""
    file_format = format.lower()

    # Restricción RBAC para exportación a Excel
    if file_format in ["xlsx", "excel"]:
        is_admin = (
            current_user.id_rol == ADMIN_ROLE_ID or
            (current_user.rol and current_user.rol.nombre_rol == "Administrador")
        )
        if not is_admin:
            raise HTTPException(
                status_code=403,
                detail="Solo los usuarios con rol 'Administrador' pueden exportar en formato Excel."
            )

    items = fetch_filtered_report_data(db, report_type, status, search, date_start, date_end, type_filter)

    # Registrar en auditoría
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    AuditService.record_activity(
        db,
        id_usuario=current_user.id_usuario,
        nombres_usuario=user_name,
        tipo_accion="REPORTE",
        modulo="Reportes",
        descripcion=f"Exportó reporte '{report_type}' en formato {format.upper()} ({len(items)} registros).",
        id_registro_afectado=None
    )

    filename = f"VEXTOR_Reporte_{report_type.upper()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    if file_format in ["xlsx", "excel"]:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = report_type.capitalize()[:30]

        if items:
            headers = list(items[0].keys())
            ws.append(headers)

            # Header styling
            header_fill = PatternFill(start_color="0F6A43", end_color="0F6A43", fill_type="solid")
            header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
            align_center = Alignment(horizontal="center", vertical="center")

            for col_num, _ in enumerate(headers, 1):
                cell = ws.cell(row=1, column=col_num)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = align_center

            for row in items:
                ws.append([row.get(h, "") for h in headers])

            # Auto-adjust column widths
            for col in ws.columns:
                max_len = max(len(str(cell.value or "")) for cell in col)
                col_letter = openpyxl.utils.get_column_letter(col[0].column)
                ws.column_dimensions[col_letter].width = max(max_len + 4, 12)
        else:
            ws.append(["Sin datos disponibles para los filtros seleccionados"])

        excel_stream = io.BytesIO()
        wb.save(excel_stream)
        excel_data = excel_stream.getvalue()

        return Response(
            content=excel_data,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={filename}.xlsx"
            }
        )

    elif file_format == "csv":
        output = io.StringIO()
        if items:
            headers = list(items[0].keys())
            writer = csv.DictWriter(output, fieldnames=headers)
            writer.writeheader()
            for row in items:
                clean_row = {k: (v if v is not None else "") for k, v in row.items()}
                writer.writerow(clean_row)
        else:
            writer = csv.writer(output)
            writer.writerow(["Sin datos disponibles para los filtros seleccionados"])

        csv_data = output.getvalue().encode("utf-8-sig")

        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}.csv"
            }
        )

    elif file_format == "pdf":
        html_content = generate_pdf_html(report_type, items, user_name)
        return Response(
            content=html_content.encode("utf-8"),
            media_type="text/html",
            headers={
                "Content-Disposition": f"inline; filename={filename}.html"
            }
        )
    else:
        raise HTTPException(status_code=400, detail="Formato de exportación no soportado")


def fetch_filtered_report_data(
    db: Session,
    report_type: str,
    status: Optional[str],
    search: Optional[str],
    date_start: Optional[str],
    date_end: Optional[str],
    type_filter: Optional[str]
) -> List[dict]:
    """Helper para consultar y formatear registros por tipo de reporte"""
    data = []

    if report_type == "vehicles":
        query = db.query(Vehiculo)
        if status:
            query = query.filter(Vehiculo.estado_vehiculo == status)
        if type_filter:
            query = query.filter(Vehiculo.tipo_vehiculo == type_filter)
        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                (Vehiculo.placa.ilike(s)) |
                (Vehiculo.marca.ilike(s)) |
                (Vehiculo.modelo.ilike(s)) |
                (Vehiculo.tipo_vehiculo.ilike(s))
            )
        vehicles = query.all()
        for v in vehicles:
            data.append({
                "Placa": v.placa,
                "Marca": v.marca,
                "Modelo": v.modelo,
                "Año": v.anio,
                "Color": v.color,
                "Tipo": v.tipo_vehiculo,
                "Capacidad": f"{v.capacidad_pasajeros} pasajeros",
                "Kilometraje": v.kilometraje_actual,
                "Límite Mantenimiento": v.kilometraje_limite_mantenimiento,
                "Estado": v.estado_vehiculo
            })

    elif report_type == "drivers":
        query = db.query(Conductor)
        if status:
            query = query.filter(Conductor.estado_conductor == status)
        if type_filter:
            query = query.filter(Conductor.licencia.ilike(f"%{type_filter}%"))
        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                (Conductor.nombre_conductor.ilike(s)) |
                (Conductor.apellido_conductor.ilike(s)) |
                (Conductor.cedula_conductor.ilike(s)) |
                (Conductor.licencia.ilike(s))
            )
        if date_start:
            try:
                ds = datetime.strptime(date_start, "%Y-%m-%d").date()
                query = query.filter(Conductor.fecha_ingreso >= ds)
            except ValueError:
                pass
        if date_end:
            try:
                de = datetime.strptime(date_end, "%Y-%m-%d").date()
                query = query.filter(Conductor.fecha_ingreso <= de)
            except ValueError:
                pass
        drivers = query.all()
        for d in drivers:
            data.append({
                "Nombre": f"{d.nombre_conductor} {d.apellido_conductor}",
                "Cédula": d.cedula_conductor,
                "Teléfono": d.telefono_conductor or "Sin registrar",
                "Licencia": d.licencia,
                "Fecha Ingreso": str(d.fecha_ingreso) if d.fecha_ingreso else "",
                "Estado": d.estado_conductor
            })

    elif report_type == "routes":
        query = db.query(Ruta).options(
            selectinload(Ruta.asignaciones_conductor).joinedload(AsignacionConductor.conductor),
            selectinload(Ruta.asignaciones_vehiculo).joinedload(AsignacionVehiculo.vehiculo)
        )
        if status:
            query = query.filter(Ruta.estado_ruta == status)
        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                (Ruta.codigo_ruta.ilike(s)) |
                (Ruta.nombre_ruta.ilike(s)) |
                (Ruta.origen.ilike(s)) |
                (Ruta.destino.ilike(s))
            )
        if date_start:
            try:
                ds = datetime.strptime(date_start, "%Y-%m-%d")
                query = query.filter(Ruta.fecha_programada >= ds)
            except ValueError:
                pass
        if date_end:
            try:
                de = datetime.strptime(date_end, "%Y-%m-%d") + timedelta(days=1)
                query = query.filter(Ruta.fecha_programada < de)
            except ValueError:
                pass
        routes = query.all()

        for r in routes:
            cond_names = []
            veh_info = []
            if r.asignaciones_conductor:
                for ac in r.asignaciones_conductor:
                    if ac.conductor:
                        cond_names.append(f"{ac.conductor.nombre_conductor} {ac.conductor.apellido_conductor}")
            if r.asignaciones_vehiculo:
                for av in r.asignaciones_vehiculo:
                    if av.vehiculo:
                        veh_info.append(f"{av.vehiculo.marca} {av.vehiculo.modelo} [{av.vehiculo.placa}]")

            data.append({
                "Código": r.codigo_ruta,
                "Nombre Ruta": r.nombre_ruta,
                "Origen": r.origen,
                "Destino": r.destino,
                "Conductor": ", ".join(cond_names) if cond_names else "Sin asignar",
                "Vehículo": ", ".join(veh_info) if veh_info else "Sin vehículo",
                "Fecha Programada": r.fecha_programada.strftime("%Y-%m-%d %H:%M") if r.fecha_programada else "",
                "Estado": r.estado_ruta
            })

    elif report_type == "maintenances":
        query = db.query(Mantenimiento).options(
            joinedload(Mantenimiento.vehiculo)
        )
        if status:
            query = query.filter(Mantenimiento.estado_mantenimiento == status)
        if type_filter:
            query = query.filter(Mantenimiento.tipo_mantenimiento == type_filter)
        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                (Mantenimiento.tipo_mantenimiento.ilike(s)) |
                (Mantenimiento.descripcion_mantenimiento.ilike(s))
            )
        if date_start:
            try:
                ds = datetime.strptime(date_start, "%Y-%m-%d").date()
                query = query.filter(Mantenimiento.fecha_mantenimiento >= ds)
            except ValueError:
                pass
        if date_end:
            try:
                de = datetime.strptime(date_end, "%Y-%m-%d").date()
                query = query.filter(Mantenimiento.fecha_mantenimiento <= de)
            except ValueError:
                pass
        maints = query.all()
        for m in maints:
            v_str = f"{m.vehiculo.marca} {m.vehiculo.modelo} [{m.vehiculo.placa}]" if m.vehiculo else "Vehículo borrado"
            data.append({
                "Vehículo": v_str,
                "Tipo": m.tipo_mantenimiento,
                "Descripción": m.descripcion_mantenimiento,
                "Fecha": str(m.fecha_mantenimiento) if m.fecha_mantenimiento else "",
                "Costo (COP)": f"${m.costo_mantenimiento:,.0f} COP" if m.costo_mantenimiento else "$0 COP",
                "Kilometraje": m.kilometraje_mantenimiento or 0,
                "Estado": m.estado_mantenimiento
            })

    elif report_type in ["day", "week", "month", "general"]:
        now = datetime.now()
        start_bound = None
        if report_type == "day":
            start_bound = now - timedelta(days=1)
        elif report_type == "week":
            start_bound = now - timedelta(days=7)
        elif report_type == "month":
            start_bound = now - timedelta(days=30)

        # 1. Rutas
        r_query = db.query(Ruta).options(
            selectinload(Ruta.asignaciones_conductor).joinedload(AsignacionConductor.conductor)
        )
        if start_bound:
            r_query = r_query.filter(Ruta.fecha_programada >= start_bound)
        for r in r_query.all():
            cond_str = "Sin asignar"
            if r.asignaciones_conductor and r.asignaciones_conductor[0].conductor:
                c = r.asignaciones_conductor[0].conductor
                cond_str = f"{c.nombre_conductor} {c.apellido_conductor}"
            data.append({
                "Módulo": "Rutas",
                "Detalle": f"Ruta {r.codigo_ruta}: {r.nombre_ruta}",
                "Fecha": r.fecha_programada.strftime("%Y-%m-%d %H:%M") if r.fecha_programada else "",
                "Responsable": cond_str,
                "Estado": r.estado_ruta
            })

        # 2. Mantenimientos
        m_query = db.query(Mantenimiento)
        if start_bound:
            m_query = m_query.filter(Mantenimiento.fecha_mantenimiento >= start_bound.date())
        for m in m_query.all():
            data.append({
                "Módulo": "Mantenimientos",
                "Detalle": f"Mantenimiento {m.tipo_mantenimiento}: {m.descripcion_mantenimiento}",
                "Fecha": str(m.fecha_mantenimiento) if m.fecha_mantenimiento else "",
                "Responsable": "Taller Autorizado",
                "Estado": m.estado_mantenimiento
            })

        # 3. Conductores
        d_query = db.query(Conductor)
        if start_bound:
            d_query = d_query.filter(Conductor.fecha_ingreso >= start_bound.date())
        for d in d_query.all():
            data.append({
                "Módulo": "Conductores",
                "Detalle": f"Ingreso Conductor: {d.nombre_conductor} {d.apellido_conductor}",
                "Fecha": str(d.fecha_ingreso) if d.fecha_ingreso else "",
                "Responsable": "Recursos Humanos",
                "Estado": d.estado_conductor
            })

        if status:
            data = [i for i in data if i.get("Estado") == status]
        if search and search.strip():
            s = search.strip().lower()
            data = [i for i in data if any(s in str(val).lower() for val in i.values())]

    return data


def generate_pdf_html(report_type: str, items: List[dict], generated_by: str) -> str:
    """Genera una plantilla HTML estilizada para descarga de reportes oficiales de VEXTOR."""
    date_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    headers = list(items[0].keys()) if items else ["Sin datos"]

    rows_html = ""
    for idx, item in enumerate(items):
        bg_class = "background-color: #1e293b;" if idx % 2 == 0 else "background-color: #0f172a;"
        cells = "".join([f"<td style='padding: 10px; border-bottom: 1px solid #334155;'>{item.get(h, '')}</td>" for h in headers])
        rows_html += f"<tr style='{bg_class}'>{cells}</tr>"

    headers_html = "".join([f"<th style='padding: 12px; text-align: left; background-color: #0284c7; color: white; font-size: 12px;'>{h}</th>" for h in headers])

    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>VEXTOR - Reporte de {report_type.capitalize()}</title>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #090d16; color: #f8fafc; padding: 30px; margin: 0; }}
            .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; }}
            .logo {{ font-size: 26px; font-weight: 800; color: #10b981; letter-spacing: 2px; }}
            .title {{ font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 5px; }}
            .meta {{ font-size: 12px; color: #94a3b8; text-align: right; line-height: 1.5; }}
            table {{ width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px; }}
            .footer {{ margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 15px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <div class="logo">VEXTOR</div>
                <div class="title">REPORTE OFICIAL - {report_type.upper()}</div>
            </div>
            <div class="meta">
                <div><strong>Generado por:</strong> {generated_by}</div>
                <div><strong>Fecha:</strong> {date_str}</div>
                <div><strong>Total Registros:</strong> {len(items)}</div>
            </div>
        </div>
        <table>
            <thead>
                <tr>{headers_html}</tr>
            </thead>
            <tbody>
                {rows_html if items else "<tr><td colspan='100%' style='text-align:center; padding: 20px;'>No hay datos para mostrar</td></tr>"}
            </tbody>
        </table>
        <div class="footer">
            Este documento fue generado automáticamente por la Plataforma Vextor SaaS Fleet Management.
        </div>
        <script>
            window.onload = function() {{ window.print(); }};
        </script>
    </body>
    </html>
    """
