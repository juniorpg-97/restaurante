# 🍽️ API Restaurante: Ejercicio de configuración de entornos

Este repositorio es una **API REST para un restaurante**, hecha con **NestJS + Prisma**. Incluye autenticación con JWT y la gestión del menú y los pedidos.

La API **ya funciona**, pero tiene un problema de diseño: lee la configuración con `process.env.ALGO` directamente, **en muchos archivos distintos**. Si falta una variable o tiene un valor inválido, la aplicación arranca igual y falla después, en tiempo de ejecución, cuando es mucho más difícil encontrar el error.

**Tu misión:** centralizar y validar toda la configuración con `@nestjs/config` y `Joi`, de modo que **la aplicación no arranque** si alguna variable de entorno falta o no tiene el formato esperado.

---

## 📦 El proyecto

### Modelo de datos (Prisma)

| Tabla       | Descripción                                                 |
| ----------- | ----------------------------------------------------------- |
| `User`      | Usuarios del sistema (`ADMIN`, `WAITER`, `CUSTOMER`)        |
| `Category`  | Categorías del menú (Entradas, Platos de fondo, Bebidas...) |
| `Dish`      | Platos del menú: nombre, precio, disponibilidad, categoría  |
| `Order`     | Pedido de un cliente: estado, total, fecha                  |
| `OrderItem` | Detalle del pedido: plato, cantidad, precio unitario        |

### Módulos

- `auth`: registro, login y guard JWT
- `users`: gestión de usuarios
- `categories`: CRUD de categorías
- `dishes`: CRUD de platos
- `orders`: creación y seguimiento de pedidos
- `prisma`: servicio de conexión a la base de datos

### Cómo levantarlo

Requisitos: Node.js 22 o superior y PostgreSQL.

```bash
npm install
cp .env.example .env          # ajusta DATABASE_URL con tu usuario y contraseña de Postgres
npm run db:generate           # genera el cliente de Prisma
npm run db:migrate            # crea las tablas
npm run db:seed               # carga usuarios y menú de ejemplo
npm run start:dev
```

Usuarios que crea el seed:

| Rol    | Email                    | Contraseña  |
| ------ | ------------------------ | ----------- |
| ADMIN  | `admin@restaurante.com`  | `admin123`  |
| WAITER | `mesero@restaurante.com` | `mesero123` |

### Endpoints

Todas las rutas llevan el prefijo `/api`.

| Método | Ruta                  | Acceso              | Descripción                            |
| ------ | --------------------- | ------------------- | -------------------------------------- |
| GET    | `/`                   | Público             | Nombre del restaurante y estado        |
| POST   | `/auth/register`      | Público             | Registro (rol `CUSTOMER`)              |
| POST   | `/auth/login`         | Público             | Login, devuelve `accessToken`          |
| GET    | `/auth/me`            | Autenticado         | Datos del token actual                 |
| GET    | `/users`              | ADMIN               | Listar usuarios                        |
| PATCH  | `/users/:id/role`     | ADMIN               | Cambiar el rol de un usuario           |
| GET    | `/categories`         | Público             | Listar categorías                      |
| POST   | `/categories`         | ADMIN               | Crear categoría (también PATCH/DELETE) |
| GET    | `/dishes?categoryId=` | Público             | Listar platos                          |
| POST   | `/dishes`             | ADMIN               | Crear plato (también PATCH/DELETE)     |
| POST   | `/orders`             | Autenticado         | Crear pedido (calcula `TAX_RATE`)      |
| GET    | `/orders`             | Autenticado         | Staff ve todos; cliente solo los suyos |
| PATCH  | `/orders/:id/status`  | ADMIN, WAITER       | Cambiar el estado del pedido           |

Ejemplo de pedido:

```json
POST /api/orders
Authorization: Bearer <token>

{ "items": [{ "dishId": 1, "quantity": 2 }, { "dishId": 6, "quantity": 1 }] }
```

---

## 🔑 Variables de entorno

La aplicación usa estas **10 variables**. Hoy se leen con `process.env` en distintos puntos del código. Tu trabajo es validarlas **todas** con las reglas de esta tabla:

| #   | Variable             | Tipo   | Regla de validación                                     | Ejemplo                                              |
| --- | -------------------- | ------ | ------------------------------------------------------- | ---------------------------------------------------- |
| 1   | `NODE_ENV`           | string | Solo `development`, `production` o `test`. Por defecto: `development` | `development`                                        |
| 2   | `PORT`               | number | Número entero entre 1 y 65535. Por defecto: `3000`      | `3000`                                               |
| 3   | `API_PREFIX`         | string | Obligatoria. Sin espacios                               | `api`                                                |
| 4   | `DATABASE_URL`       | string | Obligatoria. URI que empiece con `postgresql://`        | `postgresql://user:pass@localhost:5432/restaurante`  |
| 5   | `JWT_SECRET`         | string | Obligatoria. Mínimo 32 caracteres                       | `una_clave_muy_larga_y_secreta_de_32_chars`          |
| 6   | `JWT_EXPIRES_IN`     | string | Obligatoria. Formato tipo `15m`, `1h`, `7d`             | `1h`                                                 |
| 7   | `BCRYPT_SALT_ROUNDS` | number | Entero entre 8 y 14. Por defecto: `10`                  | `10`                                                 |
| 8   | `CORS_ORIGIN`        | string | Obligatoria. Una URL válida                             | `http://localhost:5173`                              |
| 9   | `RESTAURANT_NAME`    | string | Obligatoria. Entre 3 y 50 caracteres                    | `La Buena Mesa`                                      |
| 10  | `TAX_RATE`           | number | Decimal entre 0 y 1 (ej. `0.13` = 13%)                  | `0.13`                                               |

---

## 🎯 Consigna

### Parte 1: Instalación y configuración base

1. Instala las dependencias necesarias:
   ```bash
   npm install @nestjs/config joi
   ```
2. Registra `ConfigModule` en `AppModule` como **módulo global**.

### Parte 2: Schema de validación con Joi

1. Crea el archivo `src/config/env.validation.ts` y exporta allí un schema de Joi con **las 10 variables** de la tabla.
2. Respeta las reglas de cada variable: tipo, obligatoriedad, rangos, valores permitidos y valores por defecto.
3. Conecta el schema a `ConfigModule` para que la validación ocurra al arrancar.
4. La validación debe mostrar **todos** los errores de una vez, no solo el primero, y no debe fallar por otras variables del sistema operativo que no están en tu schema.

### Parte 3: Eliminar `process.env` del código

1. Busca **todos** los usos de `process.env` en `src/` (la carpeta `generated` es código de Prisma y no se toca):
   ```bash
   grep -rn "process.env" src/ --exclude-dir=generated
   ```
2. Reemplázalos por `ConfigService`. **Todos**, sin excepción, aunque algunos casos no sean tan directos como otros.
3. El único responsable de cargar el `.env` debe ser `ConfigModule`.
4. Al terminar, el único lugar dentro de `src/` donde puede aparecer `process.env` es la carpeta `src/config/`, si es que lo necesitas ahí.

> `prisma.config.ts` y `prisma/seed.ts` se ejecutan fuera de NestJS con la CLI de Prisma, así que ahí **sí** es correcto seguir usando `process.env`.

### Parte 4: Archivo `.env.example`

1. Revisa que `.env.example` tenga las 10 variables con valores de ejemplo válidos para tu schema y **sin secretos reales**.
2. Verifica que `.env` esté en `.gitignore`.

---

## 💡 Pistas

<details>
<summary>Ábrelas solo si te trabas 😉</summary>

<br>

- `ConfigModule.forRoot()` acepta más opciones de las que parece. Lee con calma la sección **Schema validation** de la documentación de NestJS.
- Para `JWT_EXPIRES_IN`, una expresión regular te puede ayudar.
- `TAX_RATE` no es un entero. Revisa qué ofrece Joi para limitar un número decimal a un rango.
- No todos los archivos pueden recibir `ConfigService` de la misma forma. Pregúntate si ese código se ejecuta **antes** o **después** de que Nest cree los providers.
- Algunos módulos que se configuran con `.register()` tienen una "versión hermana" pensada justamente para este problema.
- En una clase que hereda de otra, `this` no está disponible hasta llamar a `super()`... pero los parámetros del constructor sí lo están desde el inicio.

</details>

---

## ✅ Criterios de aceptación

Tu solución está completa si pasa **todas** estas pruebas:

| Prueba                                     | Resultado esperado                            |
| ------------------------------------------ | --------------------------------------------- |
| `.env` completo y correcto                 | La app arranca normalmente                    |
| Borrar `JWT_SECRET` del `.env`             | ❌ La app **no arranca** y muestra el error    |
| `PORT=abc`                                 | ❌ No arranca: "PORT" must be a number         |
| `NODE_ENV=staging`                         | ❌ No arranca: valor no permitido              |
| `JWT_SECRET=corto`                         | ❌ No arranca: menos de 32 caracteres          |
| `TAX_RATE=13`                              | ❌ No arranca: debe estar entre 0 y 1          |
| `DATABASE_URL=mysql://...`                 | ❌ No arranca: esquema no permitido            |
| Varias variables mal a la vez              | ❌ Se muestran **todos** los errores juntos    |
| Quitar `PORT` del `.env`                   | ✅ Arranca en el puerto `3000` (valor por defecto) |
| `grep -rn "process.env" src/ --exclude-dir=generated` | Sin resultados fuera de `src/config/` |
| Revisar `main.ts` | No carga el `.env` por su cuenta |

---

## ⭐ Retos extra (opcional)

- Agrupa la configuración por dominio (app, base de datos, JWT y negocio) en lugar de leer variables sueltas.
- Haz que `ConfigService` sea fuertemente tipado, con autocompletado de las variables.
- Soporta distintos archivos `.env` según el valor de `NODE_ENV`.

---

## 📤 Entrega

1. Haz un **fork** o usa este repositorio como **template**.
2. Trabaja en una rama llamada `feat/env-config`.
3. Abre un Pull Request con:
   - una captura de la app arrancando correctamente;
   - una captura de la app **fallando** con varias variables inválidas a la vez;
   - una breve explicación de por qué validar la configuración al arrancar es mejor que fallar en tiempo de ejecución.

---

## 📚 Recursos

- [NestJS: Configuration](https://docs.nestjs.com/techniques/configuration)
- [Joi: API Reference](https://joi.dev/api/)
- [Prisma: Environment variables](https://www.prisma.io/docs/orm/more/development-environment/environment-variables)
