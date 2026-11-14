# Backends por https con túneles de Cloudflare

**Para:** Marti (backend 1, API del mapa) y Javier (backend 2, análisis).
**Por qué:** la interfaz publicada en GitHub Pages es `https`, y el navegador bloquea las llamadas a direcciones `http://IP:puerto`. Además, algunas redes (por ejemplo, la del evento) bloquean esas IPs. Un túnel de Cloudflare le da a cada backend una dirección `https://….trycloudflare.com` que funciona desde cualquier red.

**No hay que cambiar nada en las APIs**: CORS ya está abierto (`*`) y el backend 1 puede seguir llamando al análisis por `http` entre servidores.

## 1. Instalar `cloudflared` (una vez, en cada servidor)

Linux x86_64 (Amazon Linux o Ubuntu):

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
```

No necesita cuenta de Cloudflare.

## 2. Abrir el túnel

Con el backend ya corriendo en su puerto:

```bash
# Marti, backend 1 (puerto 3000):
nohup ./cloudflared tunnel --url http://localhost:3000 > tunel.log 2>&1 &

# Javier, backend 2 (puerto 8000):
nohup ./cloudflared tunnel --url http://localhost:8000 > tunel.log 2>&1 &
```

Para ver la dirección (tarda unos segundos en aparecer):

```bash
grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' tunel.log
```

Comprobar que responde:

```bash
curl https://<la-dirección>/api/health   # backend 1
curl https://<la-dirección>/health       # backend 2
```

## 3. Pasar las direcciones

Mándenle a Juan las dos direcciones `https://….trycloudflare.com`. Con eso él corre:

```bash
./scripts/configurar-backends.sh <dirección-backend-1> <dirección-backend-2>
```

y la interfaz (local y publicada) queda usando los backends reales.

## Ojo

- **La dirección cambia cada vez que se reinicia el túnel** (o el servidor). Si cambia, hay que pasar la nueva y volver a correr el script. Durante la demo, dejen el túnel corriendo.
- **Los pedidos largos se cortan a los 100 s** en los túneles gratuitos. El backend 1 corta el análisis a los 60 s (`ANALYSIS_TIMEOUT_MS`), así que no debería pasar.
- **Para una dirección fija** que no cambie, hace falta un túnel con nombre (cuenta gratuita de Cloudflare y un dominio) o un dominio propio con certificado. Para la demo alcanza con el túnel rápido.
- **Para detener el túnel:** `pkill -f "cloudflared tunnel"`.
