-- ==============================================================================
-- VetOrder Pro - Datos Iniciales (Seed Data) para NEON
-- ==============================================================================
-- Ejecutar luego de 'schema.sql' en el Neon SQL Editor o mediante psql.
-- ==============================================================================

-- 1. USUARIOS INICIALES
-- Nota: En un entorno de producción con Auth, 'password_hash' puede utilizar bcrypt/argon2.
INSERT INTO users (id, email, nombre, rol, password_hash, avatar_url, activo)
VALUES 
    (
        'usr-admin',
        'admin@vetorder.pro',
        'Dr. Marcos Rossi',
        'admin',
        'password123',
        'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120&auto=format&fit=crop&q=80',
        TRUE
    ),
    (
        'usr-vet',
        'veterinario@feedlot.com',
        'Dra. Valentina Paz',
        'user',
        'password123',
        'https://images.unsplash.com/photo-1594824813627-df790eb93051?w=120&auto=format&fit=crop&q=80',
        TRUE
    ),
    (
        'usr-campo',
        'operaciones@campo.com',
        'Ing. Roberto Méndez',
        'user',
        'password123',
        NULL,
        TRUE
    )
ON CONFLICT (id) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    rol = EXCLUDED.rol,
    avatar_url = EXCLUDED.avatar_url;

-- 2. CUENTAS (FEEDLOTS, CLIENTES, ETC.)
INSERT INTO accounts (id, nombre, tipo, iniciales, bajada, activo, created_at)
VALUES 
    (
        'acc-feedlot-acacias',
        'Feedlot Las Acacias',
        'Feedlot',
        'FLA',
        'Establecimiento Ganadero y Engorde a Corral • Ruta 5 Km 142',
        TRUE,
        '2026-01-15 10:00:00+00'
    ),
    (
        'acc-vet-sanroque',
        'Veterinaria San Roque',
        'Cliente',
        'VSR',
        'Clínica y Sanidad Animal Mayor • Balcarce, Pcia. de Bs. As.',
        TRUE,
        '2026-02-01 11:30:00+00'
    ),
    (
        'acc-cabana-esperanza',
        'Cabaña La Esperanza',
        'Cabaña',
        'CLE',
        'Cría, Recría y Genética Angus • Chascomús',
        TRUE,
        '2026-03-10 09:00:00+00'
    )
ON CONFLICT (id) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    iniciales = EXCLUDED.iniciales,
    bajada = EXCLUDED.bajada;

-- 3. MEMBRESÍAS DE USUARIOS EN CUENTAS
INSERT INTO account_members (account_id, user_id)
VALUES 
    ('acc-feedlot-acacias', 'usr-admin'),
    ('acc-feedlot-acacias', 'usr-vet'),
    ('acc-feedlot-acacias', 'usr-campo'),
    ('acc-vet-sanroque', 'usr-admin'),
    ('acc-vet-sanroque', 'usr-vet'),
    ('acc-cabana-esperanza', 'usr-admin')
ON CONFLICT (account_id, user_id) DO NOTHING;

-- 4. PROVEEDORES / LABORATORIOS
INSERT INTO suppliers (id, cuenta_id, nombre, contacto, telefono, email, direccion, notas, activo)
VALUES 
    -- Feedlot Las Acacias
    (
        'sup-fla-01',
        'acc-feedlot-acacias',
        'Zoetis',
        'Dr. Alejandro Dupont',
        '+54 9 11 4455-8899',
        'pedidos@zoetis.com.ar',
        'Av. Libertador 6250, CABA',
        'Proveedor principal de biológicos y antibióticos de alta exigencia.',
        TRUE
    ),
    (
        'sup-fla-02',
        'acc-feedlot-acacias',
        'Biogénesis Bagó',
        'Dra. Mariana Solís',
        '+54 9 11 5566-7788',
        'ventas@biogenesisbago.com',
        'Ruta Panamericana Km 38.5, Garín',
        'Cadena de frío estricta para vacunas reproductivas.',
        TRUE
    ),
    (
        'sup-fla-03',
        'acc-feedlot-acacias',
        'MSD Salud Animal',
        'Ing. Lucas Varela',
        '+54 9 11 3344-9900',
        'contacto.ganaderia@msd.com',
        'Parque Industrial Pilar',
        'Entregas semanales los días martes y jueves.',
        TRUE
    ),
    (
        'sup-fla-04',
        'acc-feedlot-acacias',
        'Boehringer Ingelheim',
        'Valeria Rossi',
        '+54 9 11 2233-4455',
        'atencion@boehringer-ingelheim.com',
        'Av. del Libertador 7208',
        'Línea Metacam e Ivomec.',
        TRUE
    ),
    (
        'sup-fla-05',
        'acc-feedlot-acacias',
        'Insumos Generales',
        'Depósito Central',
        '+54 9 2346 55-1234',
        'deposito@feedlot-insumos.com',
        NULL,
        'Material descartable, agujas y jeringas.',
        TRUE
    ),
    -- Veterinaria San Roque
    (
        'sup-vsr-01',
        'acc-vet-sanroque',
        'MSD Salud Animal',
        'Distribuidora del Sud',
        '+54 9 2266 42-8800',
        'pedidos@distribuidoradelsud.com',
        NULL,
        NULL,
        TRUE
    ),
    (
        'sup-vsr-02',
        'acc-vet-sanroque',
        'Biogénesis Bagó',
        'Representante Balcarce',
        '+54 9 2266 43-1122',
        'bago.balcarce@agroveterinaria.com',
        NULL,
        NULL,
        TRUE
    ),
    (
        'sup-vsr-03',
        'acc-vet-sanroque',
        'Zoetis',
        'Agencia Tandil',
        '+54 9 249 444-5566',
        'tandil@zoetis.com.ar',
        NULL,
        NULL,
        TRUE
    )
ON CONFLICT (id) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    contacto = EXCLUDED.contacto,
    telefono = EXCLUDED.telefono,
    email = EXCLUDED.email;

-- 5. CATEGORÍAS DE PRODUCTOS
INSERT INTO categories (id, cuenta_id, nombre, descripcion, color, activo)
VALUES 
    -- Categorías Feedlot Las Acacias
    ('cat-01', 'acc-feedlot-acacias', 'Vacunas', 'Biológicos y preventivos', '#059669', TRUE),
    ('cat-02', 'acc-feedlot-acacias', 'Antibióticos', 'Tratamientos antimicrobianos', '#0284c7', TRUE),
    ('cat-03', 'acc-feedlot-acacias', 'Antiinflamatorios', 'Analgésicos y antipiréticos', '#d97706', TRUE),
    ('cat-04', 'acc-feedlot-acacias', 'Antiparasitarios', 'Endectocidas e inmunidad', '#7c3aed', TRUE),
    ('cat-05', 'acc-feedlot-acacias', 'Insumos', 'Descartables, jeringas y equipos', '#57534e', TRUE),
    ('cat-06', 'acc-feedlot-acacias', 'Otros', 'Varios y accesorios', '#475569', TRUE),
    -- Categorías Veterinaria San Roque
    ('cat-vsr-01', 'acc-vet-sanroque', 'Vacunas', 'Biológicos y preventivos', '#059669', TRUE),
    ('cat-vsr-02', 'acc-vet-sanroque', 'Antibióticos', 'Tratamientos antimicrobianos', '#0284c7', TRUE),
    ('cat-vsr-03', 'acc-vet-sanroque', 'Antiinflamatorios', 'Analgésicos', '#d97706', TRUE),
    ('cat-vsr-04', 'acc-vet-sanroque', 'Antiparasitarios', 'Endectocidas', '#7c3aed', TRUE),
    ('cat-vsr-05', 'acc-vet-sanroque', 'Insumos', 'Descartables', '#57534e', TRUE),
    ('cat-vsr-06', 'acc-vet-sanroque', 'Otros', 'Varios', '#475569', TRUE)
ON CONFLICT (id) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    color = EXCLUDED.color;

-- 6. PRODUCTOS / INSUMOS DEL CATÁLOGO
INSERT INTO products (id, cuenta_id, nombre, laboratorio, categoria, presentacion, unidad, minimo, paso, activo)
VALUES 
    -- Feedlot Las Acacias
    ('prod-fla-01', 'acc-feedlot-acacias', 'Bioabortogen H', 'Biogénesis Bagó', 'Vacunas', 'frasco 125 ml / 25 dosis', 'dosis', 25, 25, TRUE),
    ('prod-fla-02', 'acc-feedlot-acacias', 'Bagomisin 200 LA', 'Biogénesis Bagó', 'Antibióticos', 'frasco 250 ml', 'unidad', 2, 1, TRUE),
    ('prod-fla-03', 'acc-feedlot-acacias', 'Flunixin Bagó', 'Biogénesis Bagó', 'Antiinflamatorios', 'frasco 100 ml', 'unidad', 1, 1, TRUE),
    ('prod-fla-04', 'acc-feedlot-acacias', 'Bovilis Vista Once SQ', 'Zoetis', 'Vacunas', 'frasco 10 dosis', 'dosis', 10, 10, TRUE),
    ('prod-fla-05', 'acc-feedlot-acacias', 'Draxxin 100 mg/ml', 'Zoetis', 'Antibióticos', 'frasco 100 ml', 'unidad', 1, 1, TRUE),
    ('prod-fla-06', 'acc-feedlot-acacias', 'Dectomax Inyectable 1%', 'Zoetis', 'Antiparasitarios', 'frasco 500 ml', 'unidad', 1, 1, TRUE),
    ('prod-fla-07', 'acc-feedlot-acacias', 'Metacam 20 mg/ml', 'Boehringer Ingelheim', 'Antiinflamatorios', 'frasco 100 ml', 'unidad', 1, 1, TRUE),
    ('prod-fla-08', 'acc-feedlot-acacias', 'Ivomec Clásico', 'Boehringer Ingelheim', 'Antiparasitarios', 'frasco 500 ml', 'unidad', 2, 1, TRUE),
    ('prod-fla-09', 'acc-feedlot-acacias', 'Resflor Gold Solución', 'MSD Salud Animal', 'Antibióticos', 'frasco 250 ml', 'unidad', 1, 1, TRUE),
    ('prod-fla-10', 'acc-feedlot-acacias', 'Bovilis Bovipast RSP', 'MSD Salud Animal', 'Vacunas', 'frasco 50 ml / 10 dosis', 'dosis', 10, 10, TRUE),
    ('prod-fla-11', 'acc-feedlot-acacias', 'Agujas descartables 18G x 1 1/2', 'Insumos Generales', 'Insumos', 'caja x 100 unidades', 'caja', 1, 1, TRUE),
    ('prod-fla-12', 'acc-feedlot-acacias', 'Jeringa dosificadora Roux 50 ml', 'Insumos Generales', 'Insumos', 'unidad metálica con repuestos', 'unidad', 1, 1, TRUE),
    -- Veterinaria San Roque
    ('prod-vsr-01', 'acc-vet-sanroque', 'Rotavec Corona', 'MSD Salud Animal', 'Vacunas', 'frasco 100 ml', 'unidad', 1, 1, TRUE),
    ('prod-vsr-02', 'acc-vet-sanroque', 'Flunixin Meglumina', 'Biogénesis Bagó', 'Antiinflamatorios', 'frasco 50 ml', 'unidad', 2, 1, TRUE),
    ('prod-vsr-03', 'acc-vet-sanroque', 'Synanthic 9.06%', 'Zoetis', 'Antiparasitarios', 'bidón 5 litros', 'unidad', 1, 1, TRUE)
ON CONFLICT (id) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    laboratorio = EXCLUDED.laboratorio,
    categoria = EXCLUDED.categoria,
    presentacion = EXCLUDED.presentacion,
    unidad = EXCLUDED.unidad,
    minimo = EXCLUDED.minimo,
    paso = EXCLUDED.paso;

-- 7. ÓRDENES DE COMPRA
INSERT INTO orders (id, numero, cuenta_id, laboratorio, fecha, estado, observaciones, created_at)
VALUES 
    (
        'ord-fla-001',
        'OC-2026-0045',
        'acc-feedlot-acacias',
        'Zoetis',
        CURRENT_DATE,
        'Emitida',
        'Entregar antes de las 14hs en manga principal. Coordinar con capataz.',
        NOW() - INTERVAL '1 day'
    ),
    (
        'ord-fla-002',
        'OC-2026-0044',
        'acc-feedlot-acacias',
        'Biogénesis Bagó',
        CURRENT_DATE - INTERVAL '9 days',
        'Enviada',
        'Mantener cadena de frío para vacuna Bioabortogen (2°C a 8°C).',
        NOW() - INTERVAL '9 days'
    ),
    (
        'ord-fla-003',
        'OC-2026-0043',
        'acc-feedlot-acacias',
        'MSD Salud Animal',
        CURRENT_DATE - INTERVAL '17 days',
        'Recibida',
        'Pedido recibido conforme en depósito veterinario.',
        NOW() - INTERVAL '17 days'
    ),
    (
        'ord-fla-004',
        'OC-2026-0038',
        'acc-feedlot-acacias',
        '',
        CURRENT_DATE - INTERVAL '34 days',
        'Recibida',
        'Pedido general de insumos para campaña de vacunación de primavera.',
        NOW() - INTERVAL '34 days'
    ),
    (
        'ord-vsr-001',
        'OC-2026-0012',
        'acc-vet-sanroque',
        'MSD Salud Animal',
        CURRENT_DATE,
        'Emitida',
        'Facturar a nombre de Veterinaria San Roque SRL.',
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET 
    numero = EXCLUDED.numero,
    laboratorio = EXCLUDED.laboratorio,
    fecha = EXCLUDED.fecha,
    estado = EXCLUDED.estado,
    observaciones = EXCLUDED.observaciones;

-- 8. RENGLONES DE ÓRDENES DE COMPRA (ITEMS)
INSERT INTO order_items (id, order_id, producto_id, nombre, presentacion, unidad, cantidad, minimo, paso, laboratorio, orden)
VALUES 
    -- Items de ord-fla-001 (Zoetis)
    ('itm-001-1', 'ord-fla-001', 'prod-fla-04', 'Bovilis Vista Once SQ', 'frasco 10 dosis', 'dosis', 60, 10, 10, 'Zoetis', 1),
    ('itm-001-2', 'ord-fla-001', 'prod-fla-05', 'Draxxin 100 mg/ml', 'frasco 100 ml', 'unidad', 3, 1, 1, 'Zoetis', 2),
    ('itm-001-3', 'ord-fla-001', 'prod-fla-06', 'Dectomax Inyectable 1%', 'frasco 500 ml', 'unidad', 2, 1, 1, 'Zoetis', 3),

    -- Items de ord-fla-002 (Biogénesis Bagó)
    ('itm-002-1', 'ord-fla-002', 'prod-fla-01', 'Bioabortogen H', 'frasco 125 ml / 25 dosis', 'dosis', 150, 25, 25, 'Biogénesis Bagó', 1),
    ('itm-002-2', 'ord-fla-002', 'prod-fla-02', 'Bagomisin 200 LA', 'frasco 250 ml', 'unidad', 5, 2, 1, 'Biogénesis Bagó', 2),
    ('itm-002-3', 'ord-fla-002', 'prod-fla-03', 'Flunixin Bagó', 'frasco 100 ml', 'unidad', 2, 1, 1, 'Biogénesis Bagó', 3),

    -- Items de ord-fla-003 (MSD)
    ('itm-003-1', 'ord-fla-003', 'prod-fla-09', 'Resflor Gold Solución', 'frasco 250 ml', 'unidad', 4, 1, 1, 'MSD Salud Animal', 1),
    ('itm-003-2', 'ord-fla-003', 'prod-fla-10', 'Bovilis Bovipast RSP', 'frasco 50 ml / 10 dosis', 'dosis', 40, 10, 10, 'MSD Salud Animal', 2),

    -- Items de ord-fla-004 (Insumos Generales)
    ('itm-004-1', 'ord-fla-004', 'prod-fla-11', 'Agujas descartables 18G x 1 1/2', 'caja x 100 unidades', 'caja', 5, 1, 1, 'Insumos Generales', 1),
    ('itm-004-2', 'ord-fla-004', 'prod-fla-12', 'Jeringa dosificadora Roux 50 ml', 'unidad metálica con repuestos', 'unidad', 2, 1, 1, 'Insumos Generales', 2),

    -- Items de ord-vsr-001 (San Roque)
    ('itm-vsr-1', 'ord-vsr-001', 'prod-vsr-01', 'Rotavec Corona', 'frasco 100 ml', 'unidad', 3, 1, 1, 'MSD Salud Animal', 1)
ON CONFLICT (id) DO NOTHING;
