# 🚀 Three-Tier Web Application Deployment (Docker, Kubernetes & CI Pipeline)

## 📌 Project Overview

This project demonstrates an **end-to-end deployment of a three-tier web application** using modern DevOps practices.

### 🧱 Stack

* **Frontend**: React.js
* **Backend**: Node.js (Express)
* **Database**: MongoDB

### 🚀 Deployment Phases

1. **Docker Compose (Single Node Deployment)**
2. **Kubernetes (Cluster Deployment)**

### 🔄 CI Pipeline

* Implemented using **GitHub Actions**
* Integrated security scanning using:

  * **Snyk**
  * **Trivy** (Updated to uncompromised version using pinned sha256 digest)

> ⚠️ CD pipeline is intentionally not enabled to avoid automatic pushes to GHCR.

---

## 🏗️ Architecture Diagram
```
                ┌────────────────────────────┐
                │        User Browser        │
                └────────────┬───────────────┘
                             │
                             ▼
                 ┌─────────────────────────┐
                 │   NGINX Ingress         │
                 │   Controller            │
                 └────────────┬────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌────────────────┐
│  Frontend    │     │  Backend     │     │   MongoDB      │
│  (React)     │◄───►│ (Node.js)    │◄───►│   Database     │
└──────────────┘     └──────────────┘     └────────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
   Kubernetes           Kubernetes           OpenEBS PV
   Deployment           Deployment           (Persistent Storage)
```  

---

## ⚙️ Tech Stack

| Layer         | Technology               |
| ------------- | ------------------------ |
| Frontend      | React.js                 |
| Backend       | Node.js, Express         |
| Database      | MongoDB                  |
| Containers    | Docker, Docker Compose   |
| Orchestration | Kubernetes               |
| Ingress       | NGINX Ingress Controller |
| Storage       | OpenEBS                  |
| Secrets       | Sealed Secrets           |
| CI/CD         | GitHub Actions           |

---

## 🚀 Phase 1: Docker Compose Deployment

### ▶️ Run Locally
 
```bash
git clone https://github.com/NishitRai/ThreeTierWebAppDeployment.git
cd ThreeTierWebAppDeployment/Application

# set environment variables in .env file
BACKEND_URL=http://localhost:3500 (Or Ip address of Vagrant box if using docker on vagrant)
MONGO_ROOT_USERNAME=<your_mongo_root_username>
MONGO_ROOT_PASSWORD=<your_mongo_root_password>

# and then run the application using docker compose
docker compose up --build -d
```

### 🌐 Access

* Frontend → http://localhost:80
* Backend → http://localhost:3500/health
* MongoDB Connection → mongodb://localhost:27017

---

## ☸️ Phase 2: Kubernetes Deployment

### 🧩 Kubernetes Resources

* Deployments (frontend, backend, mongodb)
* Services (all ClusterIP)
* Ingress (NGINX)
* Persistent Volumes (OpenEBS)
* Sealed Secrets

---

## 🔧 Cluster Dependencies

### 1. Install OpenEBS

```bash
kubectl apply -f https://openebs.github.io/charts/openebs-operator.yaml
```

This installs the OpenEBS control plane and creates default StorageClasses, including the LocalPV hostpath class.

#### StorageClass Used

This deployment uses the following StorageClass:
```
openebs-hostpath
```

It is automatically created by OpenEBS and backed by the node’s local filesystem. No additional configuration is required.

### 2. Install NGINX Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

### 3. Install Sealed Secrets

#### *a. Install the Sealed Secrets controller in your cluster*

```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.26.2/controller.yaml
```

Generates a **new keypair** for your cluster.

---

#### *b. Create your own Secret locally*

Create a file like below, with your own MongoDB credentials:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mongo-root-secret
  namespace: default
type: Opaque
stringData:
  MONGO_INITDB_ROOT_USERNAME: <your username>
  MONGO_INITDB_ROOT_PASSWORD: <your password>
```

This file is **not committed** — it’s just local.

---

#### *c. Seal it using your cluster’s public key*
kubeseal can be installed from `https://github.com/bitnami-labs/sealed-secrets/releases`

```bash
kubeseal --format yaml < mongo-root-secret.yaml > mongo-root-sealedsecret.yaml
```

This produces a new encrypted file that works only in *your* cluster.

Replace the checkedout SealedSecret with your generated file.

---

The SealedSecret is decrypted by *your* cluster’s private key, and MongoDB starts with your credentials.

---

## 🚀 Deploy Application
Since the manifest points to the GHCR images under this repo, you can either:
1. Build and push your own images to GHCR (recommended for testing)
2. Use the existing images (if available)

In either case, set the GITHUB_USER variable to your GitHub username (or the username that owns the GHCR images) in your shell environment:

```bash
export GITHUB_USER=<your_github_username>
```

Then deploy using:
```bash
kubectl kustomize . | envsubst | kubectl apply -f -
```

---

## 🔍 Verify Deployment

```bash
kubectl get pods -n threetier-app
kubectl get svc -n threetier-app
kubectl get ingress -n threetier-app
```
Verify that the PVCs are referencing the correct StorageClass.
```bash
kubectl get pvc -n threetier-app -o yaml | grep -i storageClassName
    storageClassName: openebs-hostpath
```

Create a entry in your `/etc/hosts` file to point `taskapp.local` to your cluster’s IP.  
Resolve the cluster IP using `kubectl get svc -n threetier-app` command.

If local machine is Windows, you can find the hosts file at `C:\Windows\System32\drivers\etc\hosts`. Update the file with admin privileges and flush the DNS cache using `ipconfig /flushdns` command in Command Prompt.

Then access:
* http://taskapp.local → Frontend
* http://taskapp.local/api/health → Backend health check
---

## 🔄 CI Pipeline (GitHub Actions)

The CI pipeline is defined under:

```
.github/workflows/
```

### ✅ Pipeline Features

* 🔹 Code checkout
* 🔹 Build Docker images
* 🔹 Security scanning:

  * **Snyk** → dependency vulnerability scanning
  * **Trivy** → container image scanning

### 🔐 Security Focus

This pipeline ensures:

* Early detection of vulnerabilities
* Secure container images before deployment

---

## 🚫 Continuous Deployment (CD)

CD is **not enabled intentionally**.

> Reason: Avoid automatic pushes to **GitHub Container Registry (GHCR)** and maintain manual control over deployments.

---

## 📂 Project Structure

```
.
├── Application
│   ├── backend/
│   ├── docker-compose.yaml
│   ├── frontend/
│   └── mongo-init/
├── Kubernetes
│   ├── backend/
│   ├── database/
│   ├── frontend/
│   ├── ingress.yaml
│   ├── kustomization.yaml
│   └── namespace.yaml
├── LICENSE
└── .github/workflows/         # CI pipelines

```

---

## 🔐 Key Features

* ✅ 3-tier microservices architecture
* ✅ Dockerized services
* ✅ Kubernetes deployment
* ✅ Persistent storage with OpenEBS
* ✅ Secure secrets using Sealed Secrets
* ✅ Ingress-based routing
* ✅ CI pipeline with security scanning (Snyk + Trivy)

---

## 📈 Future Enhancements

* Add CD pipeline (optional GHCR push + deployment)
* Helm chart packaging
* Autoscaling (HPA)
* Monitoring (Prometheus + Grafana)

---

## 📜 License

MIT License
