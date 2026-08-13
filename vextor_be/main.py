import random
import uuid
import unicodedata
from datetime import date, datetime, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, SessionLocal
import models
from router_vehicles import router as vehicles_router
from router_drivers import router as drivers_router
from router_routes import router as routes_router
from router_maintenance import router as maintenance_router
from router_auth import router as auth_router
from router_company import router as company_router
from router_users import router as users_router

app = FastAPI(title="Vextor API", description="Backend para la gestión de flota y transporte de Vextor")

@app.get("/")
def root():
    return {
        "message": "Vextor API funcionando correctamente",
        "status": "online"
    }

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all or restrict as needed e.g., ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(company_router)
app.include_router(users_router)
app.include_router(vehicles_router)
app.include_router(drivers_router)
app.include_router(routes_router)
app.include_router(maintenance_router)


# Database Seeding/Initialization on startup
@app.on_event("startup")
def startup_populate():
    db = SessionLocal()
    try:
        # Check if Rol has any records
        if db.query(models.Rol).count() == 0:
            rol_admin = models.Rol(
                id_rol=uuid.UUID("11111111-2222-3333-4444-555555555551"),
                nombre_rol="Super Administrador",
                descripcion_rol="Administrador de todo el sistema Vextor"
            )
            rol_conductor = models.Rol(
                id_rol=uuid.UUID("11111111-2222-3333-4444-555555555552"),
                nombre_rol="rol-conductor",
                descripcion_rol="Conductor de la flota Vextor"
            )
            db.add_all([rol_admin, rol_conductor])
            db.commit()

        # Check if Usuario has any records
        if db.query(models.Usuario).count() == 0:
            rol_admin = db.query(models.Rol).filter(models.Rol.nombre_rol == "Super Administrador").first()
            admin_user = models.Usuario(
                id_usuario=uuid.UUID("abc12345-6789-4000-b000-000000000002"),
                id_rol=rol_admin.id_rol,
                nombres_usuario="Admin",
                apellidos_usuario="Vextor",
                correo_usuario="admin@vextor.com",
                contrasenia_usuario="pbkdf2:sha256:admin",
                telefono_usuario="+593 99 999 9999",
                estado_usuario="ACTIVO"
            )
            db.add(admin_user)
            db.commit()

        # Seed Vehicles if empty (to match 42 in the mock db)
        if db.query(models.Vehiculo).count() == 0:
            vehicles_to_add = []
            
            # Special standard vehicle
            special_v = models.Vehiculo(
                id_vehiculo=uuid.UUID("abc12345-6789-4000-a000-000000000001"),
                placa="ABC-1234",
                marca="Toyota",
                modelo="Hilux",
                anio=2022,
                color="Gris",
                tipo_vehiculo="Camioneta",
                capacidad_pasajeros=5,
                kilometraje_actual=45200,
                kilometraje_limite_mantenimiento=50000,
                estado_vehiculo="DISPONIBLE",
                documentacion_vehiculo="SOAT vigente hasta Dic 2026"
            )
            vehicles_to_add.append(special_v)

            brands_models = [
                {"brand": "Toyota", "model": "Hilux", "type": "Camioneta", "capacity": 5},
                {"brand": "Chevrolet", "model": "Onix", "type": "Automóvil", "capacity": 5},
                {"brand": "Hyundai", "model": "Accent", "type": "Automóvil", "capacity": 5},
                {"brand": "Ford", "model": "F-150", "type": "Camioneta", "capacity": 5},
                {"brand": "Mercedes-Benz", "model": "Sprinter", "type": "Furgón", "capacity": 15},
                {"brand": "Hino", "model": "Dutro 300", "type": "Camión", "capacity": 3},
                {"brand": "Scania", "model": "G410", "type": "Camión", "capacity": 2},
                {"brand": "Volvo", "model": "FH16", "type": "Camión", "capacity": 2},
                {"brand": "Volkswagen", "model": "Constellation", "type": "Camión", "capacity": 3},
                {"brand": "Nissan", "model": "Urvan", "type": "Bus", "capacity": 18}
            ]
            colors = ["Blanco", "Negro", "Gris", "Plateado", "Azul", "Rojo", "Amarillo"]
            statuses = ["DISPONIBLE", "EN_RUTA", "MANTENIMIENTO", "INACTIVO"]
            used_plates = {"ABC-1234"}

            for _ in range(41):
                # Generate unique plate
                placa = ""
                while True:
                    letters = "".join(random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ") for _ in range(3))
                    numbers = random.randint(1000, 9999)
                    placa = f"{letters}-{numbers}"
                    if placa not in used_plates:
                        used_plates.add(placa)
                        break

                bm = random.choice(brands_models)
                curr_km = random.randint(5000, 250000)
                limit_km = curr_km + random.randint(3000, 7000)

                v = models.Vehiculo(
                    id_vehiculo=uuid.uuid4(),
                    placa=placa,
                    marca=bm["brand"],
                    modelo=bm["model"],
                    anio=random.randint(2015, 2025),
                    color=random.choice(colors),
                    tipo_vehiculo=bm["type"],
                    capacidad_pasajeros=bm["capacity"],
                    kilometraje_actual=curr_km,
                    kilometraje_limite_mantenimiento=limit_km,
                    estado_vehiculo=random.choice(statuses),
                    documentacion_vehiculo="SOAT vigente hasta Fin de Año" if random.random() > 0.15 else "Revisión técnica pendiente"
                )
                vehicles_to_add.append(v)
            
            db.add_all(vehicles_to_add)
            db.commit()

        # Seed Drivers & Users if empty
        if db.query(models.Conductor).count() == 0:
            drivers_to_add = []
            rol_conductor = db.query(models.Rol).filter(models.Rol.nombre_rol == "rol-conductor").first()

            # Special driver
            special_user_id = uuid.UUID("abc12345-6789-4000-b000-000000000001")
            
            # Validar si el usuario ya existe en la BD antes de intentar insertarlo
            special_user = db.query(models.Usuario).filter(models.Usuario.id_usuario == special_user_id).first()
            if not special_user:
                special_user = models.Usuario(
                    id_usuario=special_user_id,
                    id_rol=rol_conductor.id_rol,
                    nombres_usuario="Juan",
                    apellidos_usuario="Pérez",
                    correo_usuario="juan.perez@vextor.com",
                    contrasenia_usuario="pbkdf2:sha256:123456",
                    telefono_usuario="+593 98 765 4321",
                    estado_usuario="ACTIVO"
                )
                db.add(special_user)
                db.commit()

            special_cond = models.Conductor(
                id_conductor=uuid.UUID("abc12345-6789-4000-c000-000000000001"),
                id_usuario=special_user_id,
                nombre_conductor="Juan",
                apellido_conductor="Pérez",
                cedula_conductor="1723456789",
                telefono_conductor="+593 98 765 4321",
                licencia="C2",
                estado_conductor="ACTIVO",
                fecha_ingreso=date(2021, 3, 15)
            )
            drivers_to_add.append(special_cond)

            first_names = [
                'Juan', 'Carlos', 'Luis', 'Andrés', 'Jorge', 'José', 'Miguel', 'Santiago', 'Manuel', 'Pedro',
                'David', 'Fernando', 'Sofía', 'María', 'Alejandro', 'Gabriel', 'Daniel', 'Javier', 'Francisco', 'Ricardo'
            ]
            last_names = [
                'Pérez', 'Mendoza', 'Rodríguez', 'Gómez', 'Castillo', 'Altamirano', 'Sánchez', 'López', 'Martínez', 'Ramírez',
                'González', 'Alvarez', 'Torres', 'Fernández', 'Vargas', 'Herrera', 'Castro', 'Ríos', 'Guerrero', 'Ortega'
            ]
            licenses = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']
            cond_statuses = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO']
            used_cedulas = {"1723456789"}
            used_emails = {"juan.perez@vextor.com", "admin@vextor.com"}

            for _ in range(37):
                f_name = random.choice(first_names)
                l_name = random.choice(last_names)
                
                cedula = ""
                while True:
                    cedula = str(random.randint(1000000000, 9999999999))
                    if cedula not in used_cedulas:
                        used_cedulas.add(cedula)
                        break

                u_id = uuid.uuid4()
                
                # Make email unique
                email = ""
                while True:
                    email_prefix = f"{f_name.lower()}.{l_name.lower()}"
                    email_prefix = "".join(c for c in unicodedata.normalize("NFD", email_prefix) if unicodedata.category(c) != "Mn")
                    email = f"{email_prefix}{random.randint(10, 9999)}@vextor.com"
                    if email not in used_emails:
                        used_emails.add(email)
                        break

                u = models.Usuario(
                    id_usuario=u_id,
                    id_rol=rol_conductor.id_rol,
                    nombres_usuario=f_name,
                    apellidos_usuario=l_name,
                    correo_usuario=email,
                    contrasenia_usuario="pbkdf2:sha256:123456",
                    telefono_usuario=f"+593 9{random.randint(10000000, 99999999)}",
                    estado_usuario="ACTIVO"
                )
                db.add(u)
                db.commit()

                c = models.Conductor(
                    id_conductor=uuid.uuid4(),
                    id_usuario=u_id,
                    nombre_conductor=f_name,
                    apellido_conductor=l_name,
                    cedula_conductor=cedula,
                    telefono_conductor=u.telefono_usuario,
                    licencia=random.choice(licenses),
                    estado_conductor=random.choice(cond_statuses),
                    fecha_ingreso=date.today() - timedelta(days=random.randint(10, 1000))
                )
                drivers_to_add.append(c)

            db.add_all(drivers_to_add)
            db.commit()

        # Seed Maintenances if empty
        if db.query(models.Mantenimiento).count() == 0:
            vehicles = db.query(models.Vehiculo).all()
            if vehicles:
                m_types = ['PREVENTIVO', 'CORRECTIVO', 'PREDICTIVO']
                m_descs = [
                    'Cambio de aceite, filtros y chequeo general',
                    'Reemplazo de pastillas de freno delanteras',
                    'Rotación y balanceo de neumáticos',
                    'Reparación del sistema eléctrico de luces'
                ]
                m_statuses = ['PROGRAMADO', 'EN_PROCESO', 'COMPLETADA', 'CANCELADO']
                for i in range(4):
                    v = random.choice(vehicles)
                    m = models.Mantenimiento(
                        id_mantenimiento=uuid.uuid4(),
                        id_vehiculo=v.id_vehiculo,
                        tipo_mantenimiento=m_types[i % len(m_types)],
                        descripcion_mantenimiento=m_descs[i % len(m_descs)],
                        fecha_mantenimiento=date.today() + timedelta(days=(i - 1) * 3),
                        costo_mantenimiento=round(100.0 + random.random() * 500.0, 2),
                        kilometraje_mantenimiento=v.kilometraje_actual - random.randint(100, 5000),
                        estado_mantenimiento=m_statuses[i % len(m_statuses)]
                    )
                    db.add(m)
                db.commit()

        # Seed Routes if empty
        if db.query(models.Ruta).count() == 0:
            drivers = db.query(models.Conductor).all()
            vehicles = db.query(models.Vehiculo).all()
            if drivers and vehicles:
                routes_data = [
                    {
                        "id_ruta": uuid.UUID("11111111-1111-4000-a000-000000000001"),
                        "codigo_ruta": "RUT-101",
                        "nombre_ruta": "Ruta Portal Norte a Andino",
                        "origen": "4.7554, -74.0463",
                        "destino": "4.6669, -74.0528",
                        "fecha_programada": datetime.now() + timedelta(days=1),
                        "estado_ruta": "PROGRAMADA",
                        "id_conductor": drivers[0].id_conductor,
                        "id_vehiculo": vehicles[0].id_vehiculo
                    },
                    {
                        "id_ruta": uuid.UUID("22222222-2222-4000-a000-000000000002"),
                        "codigo_ruta": "RUT-102",
                        "nombre_ruta": "Ruta Portal 80 a Parque de la 93",
                        "origen": "4.7100, -74.1120",
                        "destino": "4.6768, -74.0483",
                        "fecha_programada": datetime.now(),
                        "hora_inicio_real": datetime.now() - timedelta(hours=1),
                        "estado_ruta": "EN_PROCESO",
                        "id_conductor": drivers[min(1, len(drivers)-1)].id_conductor,
                        "id_vehiculo": vehicles[min(1, len(vehicles)-1)].id_vehiculo
                    },
                    {
                        "id_ruta": uuid.UUID("33333333-3333-4000-a000-000000000003"),
                        "codigo_ruta": "RUT-103",
                        "nombre_ruta": "Ruta Terminal Salitre a Aeropuerto",
                        "origen": "4.6534, -74.1158",
                        "destino": "4.6975, -74.1411",
                        "fecha_programada": datetime.now() - timedelta(days=2),
                        "hora_inicio_real": datetime.now() - timedelta(days=2, hours=1),
                        "hora_fin_real": datetime.now() - timedelta(days=2, minutes=30),
                        "estado_ruta": "COMPLETADA",
                        "id_conductor": drivers[min(2, len(drivers)-1)].id_conductor,
                        "id_vehiculo": vehicles[min(2, len(vehicles)-1)].id_vehiculo
                    }
                ]

                for rd in routes_data:
                    cond_id = rd.pop("id_conductor")
                    veh_id = rd.pop("id_vehiculo")
                    r = models.Ruta(**rd)
                    db.add(r)
                    db.commit()

                    asig_c = models.AsignacionConductor(id_conductor=cond_id, id_ruta=r.id_ruta)
                    asig_v = models.AsignacionVehiculo(id_vehiculo=veh_id, id_ruta=r.id_ruta)
                    db.add_all([asig_c, asig_v])
                db.commit()

    finally:
        db.close()