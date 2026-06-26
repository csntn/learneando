# ⚽ Predicciones Mundial 2026

Aplicación web que predice los resultados de los partidos de la Copa del Mundo 2026 basándose en un sistema de **rating de fuerza** de cada selección (estilo Elo). Consulta los partidos del día a través de la API de [API-Football](https://www.api-football.com/) y muestra los pronósticos en una interfaz limpia y responsive.

![Estado](https://img.shields.io/badge/estado-funcional-success)
![Node](https://img.shields.io/badge/node-%E2%89%A518-green)

## 📋 Características

- Selección de fecha para consultar los partidos del Mundial de ese día.
- Predicción de marcador, ganador y probabilidad de victoria para cada partido.
- Cálculo basado en ratings de fuerza de selecciones con fórmula Elo.
- Interfaz responsive con tarjetas, barras de probabilidad y veredicto coloreado.
- Backend en Node.js + Express que sirve tanto la API interna como los archivos estáticos.

## 🛠️ Tecnologías

- **Backend:** Node.js, Express
- **Frontend:** HTML, CSS y JavaScript vanilla (sin frameworks)
- **Datos:** API-Football (api-sports.io)
- **Config:** dotenv

## 📁 Estructura del proyecto

```
WorldCup2026/
├── server.js          # Servidor Express + lógica de predicción
├── package.json
├── .env               # Variables de entorno (NO subir a git)
├── .gitignore
└── public/
    ├── index.html     # Interfaz de usuario
    └── app.js         # Lógica del frontend
```

## 🚀 Instalación y uso

### 1. Requisitos previos

- Node.js 18 o superior (necesario para `fetch` nativo).
- Una API key gratuita de [API-Football](https://www.api-football.com/) (registro en api-sports.io).

### 2. Clonar e instalar

```bash
git clone <url-de-tu-repo>
cd WorldCup2026
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
APISPORTS_KEY=tu_api_key_aqui
PORT=3000
```

### 4. Arrancar el servidor

```bash
npm start
```

Abre tu navegador en **http://localhost:3000**

> ⚠️ Importante: accede siempre por `http://localhost:3000` (el servidor de Node), **no** a través de Apache/XAMPP ni abriendo el archivo `index.html` directamente. De lo contrario las peticiones a `/api/predictions` no funcionarán.

## 🔌 Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/predictions?date=YYYY-MM-DD` | Devuelve las predicciones de los partidos del Mundial en esa fecha. |
| `GET` | `/api/debug?date=YYYY-MM-DD` | Diagnóstico: lista las ligas/partidos disponibles esa fecha. |
| `GET` | `/api/ping` | Comprobación de que el servidor responde. |

### Ejemplo de respuesta

```json
{
  "date": "2026-06-26",
  "predictions": [
    {
      "matchId": 1489416,
      "homeTeam": "Norway",
      "awayTeam": "France",
      "predictedScore": "0-2",
      "predictedResult": "AWAY_WIN",
      "winner": "France",
      "confidence": 0.8,
      "reasoning": "Basado en rating de fuerza — Norway: 1770, France: 2050. Probabilidad de victoria local: 20%."
    }
  ]
}
```

## Cómo funciona la predicción

El modelo asigna a cada selección un **rating de fuerza** (definido en la tabla `TEAM_RATINGS` dentro de `server.js`). A partir de la diferencia de ratings entre los dos equipos:

1. Se calcula la probabilidad de victoria local con la **fórmula Elo**:

   `P(local) = 1 / (1 + 10^(-diff/400))`

2. Se estima un marcador en función de la diferencia de fuerza.
3. Si la diferencia es pequeña (< 60 puntos), se predice empate.
4. La confianza refleja cuán lejos está el pronóstico de un 50/50.

Los ratings son aproximados y **totalmente editables**. Puedes ajustarlos en `server.js` con valores reales del ranking FIFA o de [eloratings.net](https://www.eloratings.net/) para afinar las predicciones.

## Limitaciones importantes del plan gratuito (free tier)

El free tier de API-Football tiene restricciones notables que condicionan el diseño de este proyecto:

- **Fechas:** solo permite consultar una ventana de **ayer, hoy y mañana**. No hay acceso a fechas pasadas ni futuras lejanas.
- **Seasons:** al filtrar por liga solo acepta temporadas **2022–2024**, no 2026.
- **Parámetros bloqueados:** `last` (últimos partidos), datos de forma reciente y head-to-head **no están disponibles**.
- **Cupo:** ~100 peticiones al día.

Por estas razones, el proyecto **no usa la forma reciente ni el historial directo** (era la idea original, pero la API lo bloquea). En su lugar se filtra el Mundial en el propio código (`league.id === 1`) y se predice con la tabla de ratings interna, lo que además resulta más estable para selecciones nacionales, que juegan pocos partidos.

## Aviso sobre las predicciones

Este es un proyecto educativo. Las predicciones son **heurísticas** y no deben usarse para apuestas ni tomarse como pronósticos fiables. Incluso los modelos profesionales aciertan el marcador exacto solo un 15-20% de las veces. El objetivo es practicar el consumo de APIs y el desarrollo full-stack, no acertar resultados.

## Licencia

MIT