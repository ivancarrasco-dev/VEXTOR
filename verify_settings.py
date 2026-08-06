from playwright.sync_api import sync_playwright

def run_cuj(page):
    # Navigate to login
    page.goto("http://localhost:5173/login")
    page.wait_for_timeout(1000)

    # Fill credentials
    page.locator("input[name='email']").fill("admin@vextor.com")
    page.wait_for_timeout(500)
    page.locator("input[name='password']").fill("password123")
    page.wait_for_timeout(500)

    # Submit login
    page.get_by_role("button", name="Iniciar sesión").click()
    page.wait_for_timeout(2000) # Wait for simulation delay

    # Verify we are on dashboard, then click Configuración in Sidebar
    page.get_by_role("link", name="Configuración").click()
    page.wait_for_timeout(1000)

    # Take screenshot of default Configuration view (Mi Perfil)
    page.screenshot(path="verification_perfil.png")
    page.wait_for_timeout(500)

    # Click on "Empresa"
    page.get_by_role("button", name="Empresa").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification_empresa.png")

    # Click on "Usuarios y Roles"
    page.get_by_role("button", name="Usuarios y Roles").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification_usuarios.png")

    # Click on "Vehículos"
    page.get_by_role("button", name="Vehículos").click()
    page.wait_for_timeout(1000)

    # Click on "Notificaciones"
    page.get_by_role("button", name="Notificaciones").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification_notificaciones.png")

    # Click on "Apariencia"
    page.get_by_role("button", name="Apariencia").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification_apariencia.png")

    # Click on "Copias de Seguridad"
    page.get_by_role("button", name="Copias de Seguridad").click()
    page.wait_for_timeout(1000)

    # Trigger Create Backup
    page.get_by_role("button", name="Crear Respaldo").click()
    page.wait_for_timeout(2500) # Wait for simulation delay
    page.screenshot(path="verification_backup_created.png")

    # Click on "Auditoría"
    page.get_by_role("button", name="Auditoría").click()
    page.wait_for_timeout(1000)

    # Take final screenshot
    page.screenshot(path="verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            record_video_dir="videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
