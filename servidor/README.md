# Servidor de la interfaz

Servidor propio de la interfaz de Martian Map, para publicarla en AWS (o en cualquier máquina con Node). Es un solo archivo, [index.js](index.js), sin dependencias: solo necesita **Node 18 o superior**.

Hace tres cosas:

| Ruta | Qué hace |
| --- | --- |
| `/` | Sirve la interfaz ya construida (carpeta `dist/`). |
| `/api/...` | Reenvía al **backend 1** (API del mapa): `/api/plan`, `/api/routes`, `/api/health`… |
| `/analisis/...` | Reenvía al **backend 2** (análisis): `/analisis/gale/analyze` → `/gale/analyze`. |
| `/monitoreo/...` | Reenvía al backend de monitoreo, si se configura. |
| `/control/...` | Pasa los mensajes entre la demo y el teléfono (control remoto). |
| `/salud` | Estado del servidor y qué backends tiene configurados. |

El navegador solo habla con este servidor, así que:

- **da igual que los backends sean `http` o estén por IP**: el servidor los llama de servidor a servidor;
- **el control desde el teléfono funciona en la versión publicada**, sin el servidor de Vite;
- **solo este servidor necesita `https`** (con un túnel de Cloudflare o un dominio).

Si un backend no está configurado, la interfaz sigue funcionando: la ruta y las métricas usan los datos de ejemplo.

## Probarlo en el computador

```bash
npm install
npm run build:servidor
BACKEND_1_URL=http://52.0.36.196:3000 BACKEND_2_URL=http://52.6.216.161:8000 npm start
```

Abre `http://localhost:8080`. El teléfono, en la misma red, abre `http://<ip-del-computador>:8080/#control`.

## Desplegar en AWS automáticamente (CI/CD)

El workflow [.github/workflows/deploy-aws.yml](../.github/workflows/deploy-aws.yml) despliega en cada push a `main`:

1. GitHub Actions corre `npm ci` y `npm run build:servidor`.
2. Copia por SSH la página construida y el servidor a la máquina (`~/martian-interfaz/versiones/<fecha>-<commit>`) y apunta `~/martian-interfaz/actual` a esa versión.
3. Instala o actualiza el servicio `systemd`, lo reinicia y comprueba que `/salud` responda. Si no responde, muestra el registro y el workflow falla.
4. Guarda solo las 3 últimas versiones.

En la máquina **no se clona el repo ni se instala nada con npm**: solo hace falta Node.

### Puesta en marcha (una sola vez)

1. **En la máquina**: instalar Node 18 o superior (`sudo dnf install -y nodejs` en Amazon Linux 2023, `sudo apt-get install -y nodejs` en Ubuntu) y comprobar con `node --version`.
2. **En GitHub**, Settings → Secrets and variables → Actions → **Secrets**:
   - `AWS_HOST`: IP o nombre de la máquina.
   - `AWS_USER`: usuario SSH (`ec2-user` en Amazon Linux, `ubuntu` en Ubuntu).
   - `AWS_SSH_KEY`: la clave privada SSH completa (el contenido del `.pem`).
   - Opcional, en **Variables**: `AWS_DIR` si se quiere otra carpeta que `/home/<usuario>/martian-interfaz`.
3. **Grupo de seguridad de la máquina**: el puerto 22 (SSH) tiene que aceptar conexiones de GitHub Actions, y el puerto del servidor (`8080`) las de quien abra la página (o nada, si se usa un túnel de Cloudflare).
4. **Lanzar el primer despliegue**: hacer push a `main`, o en la pestaña Actions elegir "Desplegar en AWS" → "Run workflow".
5. **Revisar la configuración**: el primer despliegue crea `/etc/martian-interfaz.env` desde el ejemplo. Revisar las direcciones de los backends y, si se cambia algo, `sudo systemctl restart martian-interfaz`.

Sin esos secrets, el workflow construye pero no despliega, y no falla.

El usuario SSH tiene que poder usar `sudo` sin contraseña (así viene en EC2) para instalar el servicio.

## Desplegar en AWS a mano (sin CI/CD)

### 1. La máquina

- Amazon Linux 2023 o Ubuntu, cualquier tamaño chico (`t3.micro` alcanza).
- En el **grupo de seguridad**, abrir el puerto del servidor (por defecto `8080`) si se va a entrar directo por la IP. Con un túnel de Cloudflare no hace falta abrir nada.

### 2. Node y el código

```bash
# Amazon Linux 2023
sudo dnf install -y nodejs git
# Ubuntu
# sudo apt-get update && sudo apt-get install -y nodejs npm git

node --version   # tiene que ser 18 o superior

git clone https://github.com/NasaSpaceChallenge-DeploySinMerken/Interfaz.git
cd Interfaz
npm ci
npm run build:servidor
```

Si el repo es privado, `git clone` pide credenciales: usar un token de GitHub o una clave SSH con acceso al repo.

### 3. Configuración

```bash
sudo cp servidor/interfaz.env.ejemplo /etc/martian-interfaz.env
sudo nano /etc/martian-interfaz.env     # ajustar BACKEND_1_URL, BACKEND_2_URL y PORT
```

Si un backend corre en la misma máquina, usar `http://localhost:PUERTO`.

### 4. Dejarlo corriendo como servicio

El servicio arranca solo al prender la máquina y se reinicia si se cae.

```bash
# si el usuario no es ec2-user o el repo no está en /home/ec2-user/Interfaz,
# editar User y WorkingDirectory en servidor/martian-interfaz.service
sudo cp servidor/martian-interfaz.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now martian-interfaz

systemctl status martian-interfaz      # ¿está corriendo?
journalctl -u martian-interfaz -f      # registro en vivo
curl http://localhost:8080/salud       # {"ok":true,"interfaz":true,...}
```

### 5. `https`

Para que la página sea `https` (y no la bloqueen redes que filtran IPs o puertos poco comunes):

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
nohup ./cloudflared tunnel --url http://localhost:8080 > tunel.log 2>&1 &
grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' tunel.log
```

Esa dirección `https://….trycloudflare.com` es la de la demo, para el computador y para el teléfono (`…/#control`). La dirección cambia si el túnel se reinicia; para una fija, usar un túnel con nombre o un dominio propio.

### Actualizar a una versión nueva (despliegue a mano)

```bash
cd ~/Interfaz
git pull
npm ci
npm run build:servidor
sudo systemctl restart martian-interfaz
```

## Problemas comunes

- **`/salud` dice `"interfaz": false`** → falta construir: `npm run build:servidor`.
- **"El backend 1 no está configurado"** → falta `BACKEND_1_URL` en `/etc/martian-interfaz.env`; después de cambiarlo, `sudo systemctl restart martian-interfaz`.
- **"No se pudo conectar con el backend 1"** → el servidor de la interfaz no llega a esa dirección: probar desde la máquina con `curl $BACKEND_1_URL/api/health`. Revisar el grupo de seguridad del backend (tiene que aceptar la IP de esta máquina).
- **El teléfono no encuentra la demo** → la demo tiene que estar abierta (en "Preparar el viaje" o en la caminata) y los dos tienen que abrir la misma dirección del servidor.
- **Se usó `npm run build` en vez de `npm run build:servidor`** → la página queda armada para GitHub Pages (`/Interfaz/`) y no carga; volver a construir con `build:servidor`.
