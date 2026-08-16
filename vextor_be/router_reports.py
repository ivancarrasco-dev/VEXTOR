import uuid
import io
import csv
from datetime import datetime, timedelta, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from router_auth import get_current_user
from router_activities import record_activity

router = APIRouter(tags=["Reports"])

class LogReportRequest(schemas.BaseModel):
    report_name: str
    format: str

@router.post("/api/reports/log")
def log_report_generation(
    req: LogReportRequest,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(
        db,
        current_user.id_usuario,
        user_name,
        "REPORTE",
        "Reportes",
        f"Generó y exportó el reporte '{req.report_name}' en formato {req.format.upper()}.",
        None
    )
    return {"status": "success"}

@router.get("/api/reports/data")
def get_report_data(
    report_type: str = Query(..., description="Type of report: vehicles, drivers, routes, maintenances, day, week, month, general"),
    status: Optional[str] = None,
    search: Optional[str] = None,
    date_start: Optional[str] = None,
    date_end: Optional[str] = None,
    type_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Returns filtered dataset for preview and dynamic reporting.
    """
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

@router.get("/api/reports/export")
def export_report_file(
    report_type: str = Query("general"),
    format: str = Query("csv"),
    status: Optional[str] = None,
    search: Optional[str] = None,
    date_start: Optional[str] = None,
    date_end: Optional[str] = None,
    type_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    """
    Generates and downloads a real file (PDF/CSV/XLSX) with filtered report data.
    """
    # Enforce role restriction for Excel/XLSX
    if format.lower() in ["xlsx", "excel"] and current_user.rol.nombre_rol != "Administrador":
        raise HTTPException(
            status_code=403,
            detail="Solo los usuarios con rol 'Administrador' pueden exportar en formato Excel."
        )

    items = fetch_filtered_report_data(db, report_type, status, search, date_start, date_end, type_filter)

    # Record activity in audit log
    user_name = f"{current_user.nombres_usuario} {current_user.apellidos_usuario}".strip()
    record_activity(
        db,
        current_user.id_usuario,
        user_name,
        "REPORTE",
        "Reportes",
        f"Exportó reporte '{report_type}' en formato {format.upper()} ({len(items)} registros).",
        None
    )

    file_format = format.lower()
    filename = f"VEXTOR_Reporte_{report_type.upper()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    if file_format in ["csv", "xlsx", "excel"]:
        output = io.StringIO()
        if items:
            headers = list(items[0].keys())
            writer = csv.DictWriter(output, fieldnames=headers)
            writer.writeheader()
            for row in items:
                # Clean up values for CSV
                clean_row = {k: (v if v is not None else "") for k, v in row.items()}
                writer.writerow(clean_row)
        else:
            writer = csv.writer(output)
            writer.writerow(["Sin datos disponibles para los filtros seleccionados"])

        csv_data = output.getvalue().encode("utf-8-sig")
        content_type = "text/csv" if file_format == "csv" else "application/vnd.ms-excel"
        ext = "csv" if file_format == "csv" else "xlsx"

        return Response(
            content=csv_data,
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}.{ext}"
            }
        )

    elif file_format == "pdf":
        # Generate clean printable HTML stream suitable for browser PDF rendering or stream download
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
    """Helper to query and format items per report type."""
    data = []

    if report_type == "vehicles":
        query = db.query(models.Vehiculo)
        if status:
            query = query.filter(models.Vehiculo.estado_vehiculo == status)
        if type_filter:
            query = query.filter(models.Vehiculo.tipo_vehiculo == type_filter)
        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                (models.Vehiculo.placa.ilike(s)) |
                (models.Vehiculo.marca.ilike(s)) |
                (models.Vehiculo.modelo.ilike(s)) |
                (models.Vehiculo.tipo_vehiculo.ilike(s))
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
        query = db.query(models.Conductor)
        if status:
            query = query.filter(models.Conductor.estado_conductor == status)
        if type_filter:
            query = query.filter(models.Conductor.licencia.ilike(f"%{type_filter}%"))
        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                (models.Conductor.nombre_conductor.ilike(s)) |
                (models.Conductor.apellido_conductor.ilike(s)) |
                (models.Conductor.cedula_conductor.ilike(s)) |
                (models.Conductor.licencia.ilike(s))
            )
        if date_start:
            try:
                ds = datetime.strptime(date_start, "%Y-%m-%d").date()
                query = query.filter(models.Conductor.fecha_ingreso >= ds)
            except ValueError:
                pass
        if date_end:
            try:
                de = datetime.strptime(date_end, "%Y-%m-%d").date()
                query = query.filter(models.Conductor.fecha_ingreso <= de)
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
        query = db.query(models.Ruta)
        if status:
            query = query.filter(models.Ruta.estado_ruta == status)
        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                (models.Ruta.codigo_ruta.ilike(s)) |
                (models.Ruta.nombre_ruta.ilike(s)) |
                (models.Ruta.origen.ilike(s)) |
                (models.Ruta.destino.ilike(s))
            )
        if date_start:
            try:
                ds = datetime.strptime(date_start, "%Y-%m-%d")
                query = query.filter(models.Ruta.fecha_programada >= ds)
            except ValueError:
                pass
        if date_end:
            try:
                de = datetime.strptime(date_end, "%Y-%m-%d") + timedelta(days=1)
                query = query.filter(models.Ruta.fecha_programada < de)
            except ValueError:
                pass
        routes = query.all()

        # Build map for driver and vehicle assignments
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
        query = db.query(models.Mantenimiento)
        if status:
            query = query.filter(models.Mantenimiento.estado_mantenimiento == status)
        if type_filter:
            query = query.filter(models.Mantenimiento.tipo_mantenimiento == type_filter)
        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                (models.Mantenimiento.tipo_mantenimiento.ilike(s)) |
                (models.Mantenimiento.descripcion_mantenimiento.ilike(s))
            )
        if date_start:
            try:
                ds = datetime.strptime(date_start, "%Y-%m-%d").date()
                query = query.filter(models.Mantenimiento.fecha_mantenimiento >= ds)
            except ValueError:
                pass
        if date_end:
            try:
                de = datetime.strptime(date_end, "%Y-%m-%d").date()
                query = query.filter(models.Mantenimiento.fecha_mantenimiento <= de)
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
        # Aggregated activity logs
        now = datetime.now()
        start_bound = None
        if report_type == "day":
            start_bound = now - timedelta(days=1)
        elif report_type == "week":
            start_bound = now - timedelta(days=7)
        elif report_type == "month":
            start_bound = now - timedelta(days=30)

        # 1. Routes
        r_query = db.query(models.Ruta)
        if start_bound:
            r_query = r_query.filter(models.Ruta.fecha_programada >= start_bound)
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

        # 2. Maintenances
        m_query = db.query(models.Mantenimiento)
        if start_bound:
            m_query = m_query.filter(models.Mantenimiento.fecha_mantenimiento >= start_bound.date())
        for m in m_query.all():
            data.append({
                "Módulo": "Mantenimientos",
                "Detalle": f"Mantenimiento {m.tipo_mantenimiento}: {m.descripcion_mantenimiento}",
                "Fecha": str(m.fecha_mantenimiento) if m.fecha_mantenimiento else "",
                "Responsable": "Taller Autorizado",
                "Estado": m.estado_mantenimiento
            })

        # 3. Drivers
        d_query = db.query(models.Conductor)
        if start_bound:
            d_query = d_query.filter(models.Conductor.fecha_ingreso >= start_bound.date())
        for d in d_query.all():
            data.append({
                "Módulo": "Conductores",
                "Detalle": f"Ingreso Conductor: {d.nombre_conductor} {d.apellido_conductor}",
                "Fecha": str(d.fecha_ingreso) if d.fecha_ingreso else "",
                "Responsable": "Recursos Humanos",
                "Estado": d.estado_conductor
            })

        # Filter general by text search / status if passed
        if status:
            data = [i for i in data if i.get("Estado") == status]
        if search and search.strip():
            s = search.strip().lower()
            data = [i for i in data if any(s in str(val).lower() for val in i.values())]

    return data

def generate_pdf_html(report_type: str, items: List[dict], generated_by: str) -> str:
    """Generates printable HTML template styled for VEXTOR corporate report downloads."""
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
