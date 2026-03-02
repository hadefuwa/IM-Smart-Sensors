import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import occtimportjs from 'occt-import-js';
import occtWasmUrl from 'occt-import-js/dist/occt-import-js.wasm?url';

let occtPromise = null;
let viewerInstance = null;

async function getOcct() {
  if (!occtPromise) {
    occtPromise = occtimportjs({
      locateFile: () => occtWasmUrl
    });
  }
  return occtPromise;
}

class CadViewer {
  constructor(canvas, statusEl) {
    this.canvas = canvas;
    this.statusEl = statusEl;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1220);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    this.camera.position.set(120, 90, 120);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 100000;

    this.modelRoot = new THREE.Group();
    this.scene.add(this.modelRoot);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x1f2937, 0.95);
    const dir = new THREE.DirectionalLight(0xffffff, 1.05);
    dir.position.set(60, 100, 40);
    this.scene.add(hemi, dir);

    const grid = new THREE.GridHelper(400, 24, 0x334155, 0x1e293b);
    grid.position.y = -0.01;
    this.scene.add(grid);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas.parentElement || this.canvas);
    this.resize();
    this.animate();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  animate() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }

  setStatus(message, type = 'info') {
    if (!this.statusEl) return;
    const cls =
      type === 'error'
        ? 'text-error'
        : type === 'success'
          ? 'text-success'
          : type === 'warning'
            ? 'text-warning'
            : 'text-base-content/70';
    this.statusEl.className = `text-sm ${cls}`;
    this.statusEl.textContent = message;
  }

  clearModel() {
    while (this.modelRoot.children.length > 0) {
      const obj = this.modelRoot.children[0];
      this.modelRoot.remove(obj);
      obj.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (Array.isArray(node.material)) node.material.forEach((m) => m.dispose());
          else node.material.dispose();
        }
      });
    }
  }

  fitView() {
    const box = new THREE.Box3().setFromObject(this.modelRoot);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z, 1);
    const distance = maxSize * 1.8;

    this.controls.target.copy(center);
    this.camera.position.set(center.x + distance, center.y + distance * 0.7, center.z + distance);
    this.camera.near = Math.max(0.01, maxSize / 1000);
    this.camera.far = maxSize * 100;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  async loadStepFromUrl(modelUrl) {
    this.setStatus('Loading STEP model...', 'info');
    this.clearModel();

    const resp = await fetch(modelUrl);
    if (!resp.ok) {
      throw new Error(`Failed to fetch model (${resp.status})`);
    }
    const fileBuffer = new Uint8Array(await resp.arrayBuffer());
    const occt = await getOcct();
    const result = occt.ReadStepFile(fileBuffer, null);

    if (!result || !result.success || !Array.isArray(result.meshes) || result.meshes.length === 0) {
      throw new Error('STEP import returned no mesh data');
    }

    for (const meshData of result.meshes) {
      const geometry = new THREE.BufferGeometry();
      const pos = meshData?.attributes?.position?.array || [];
      if (!Array.isArray(pos) || pos.length === 0) continue;

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const normal = meshData?.attributes?.normal?.array || null;
      if (Array.isArray(normal) && normal.length > 0) {
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
      } else {
        geometry.computeVertexNormals();
      }
      const indices = meshData?.index?.array || null;
      if (Array.isArray(indices) && indices.length > 0) {
        geometry.setIndex(indices);
      }
      geometry.computeBoundingSphere();

      const c = Array.isArray(meshData.color) ? meshData.color : [160, 170, 190];
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color((c[0] || 160) / 255, (c[1] || 170) / 255, (c[2] || 190) / 255),
        metalness: 0.15,
        roughness: 0.6
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      this.modelRoot.add(mesh);
    }

    if (this.modelRoot.children.length === 0) {
      throw new Error('Imported STEP had no renderable geometry');
    }

    this.fitView();
    this.setStatus('STEP model loaded. Drag to orbit, two-finger drag/scroll to zoom.', 'success');
  }
}

export function initCadViewer(canvasId, statusId) {
  const canvas = document.getElementById(canvasId);
  const statusEl = document.getElementById(statusId);
  if (!canvas) return null;
  if (!viewerInstance || viewerInstance.canvas !== canvas) {
    viewerInstance = new CadViewer(canvas, statusEl);
  }
  return viewerInstance;
}

export async function loadCadModel(canvasId, statusId, modelPath) {
  const viewer = initCadViewer(canvasId, statusId);
  if (!viewer) return;
  const lower = String(modelPath || '').toLowerCase();
  if (lower.endsWith('.stp') || lower.endsWith('.step')) {
    await viewer.loadStepFromUrl(modelPath);
    return;
  }
  viewer.clearModel();
  viewer.setStatus('SAT preview is not supported in-browser yet. Use Download/Open Raw File for SAT.', 'warning');
}
