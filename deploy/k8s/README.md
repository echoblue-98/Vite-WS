# Kubernetes Manifests (Prototype)

These manifests provide a starting point for deploying the EQ Adaptive Interview platform on Kubernetes.
They are intentionally minimal; adjust for production (resource sizing, autoscaling, secrets, network policy, persistence).

## Files

- `backend-deployment.yaml` – FastAPI backend Deployment + Service
- `frontend-deployment.yaml` – Nginx-served static frontend Deployment + Service
- `ingress.yaml` – Single ingress routing API and app hosts with security headers
- `redis-deployment.yaml` – Optional Redis (future: shared cache & rate limiting)

## Apply

```bash
kubectl apply -f deploy/k8s/backend-deployment.yaml
kubectl apply -f deploy/k8s/frontend-deployment.yaml
kubectl apply -f deploy/k8s/redis-deployment.yaml   # optional
kubectl apply -f deploy/k8s/ingress.yaml
```

## Environment & Configuration
Update image references:
- `your-registry/eq-backend:0.1.0`
- `your-registry/eq-frontend:0.1.0`

Inject secrets via (choose one):
- External Secrets Operator
- Sealed Secrets
- `kubectl create secret generic eq-config --from-literal=APP_VERSION=0.1.0 ...`

Then mount via `envFrom` or explicit `env` entries.

## Scaling
Add an HPA (example – CPU based):
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: eq-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: eq-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Future Hardening
- Pod Security: add securityContext (runAsNonRoot, readOnlyRootFilesystem)
- NetworkPolicy restricting ingress to only ingress controller
- Prometheus scraping (/metrics) once added
- Redis persistence + password
- Image provenance (cosign signing)

## Removal
```bash
kubectl delete -f deploy/k8s/ingress.yaml
kubectl delete -f deploy/k8s/redis-deployment.yaml
kubectl delete -f deploy/k8s/frontend-deployment.yaml
kubectl delete -f deploy/k8s/backend-deployment.yaml
```
