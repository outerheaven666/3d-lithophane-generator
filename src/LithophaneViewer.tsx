import {
  forwardRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type LithophaneViewerHandle = {
  setMesh: (
    positions: Float32Array,
    indices: Uint16Array | Uint32Array
  ) => void;
  updatePositions: (
    positions: Float32Array,
    options?: { refit?: boolean }
  ) => void;
  resetView: () => void;
  clear: () => void;
};

type ViewerState = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  material: THREE.MeshStandardMaterial;
  mesh: THREE.Mesh | null;
  frameId: number;
};

function disposeMesh(mesh: THREE.Mesh | null) {
  if (!mesh) return;
  mesh.geometry.dispose();
}

function resizeRenderer(host: HTMLDivElement, state: ViewerState) {
  const rect = host.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));

  state.renderer.setSize(width, height, false);
  state.camera.aspect = width / height;
  state.camera.updateProjectionMatrix();
}

function refitCamera(mesh: THREE.Mesh, state: ViewerState) {
  const box = new THREE.Box3().setFromObject(mesh);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const center = sphere.center;
  const radius = Math.max(8, sphere.radius);
  const fov = THREE.MathUtils.degToRad(state.camera.fov);
  const distance = radius / Math.sin(fov / 2);

  state.controls.target.copy(center);
  state.camera.near = Math.max(0.1, distance / 200);
  state.camera.far = distance * 8;
  state.camera.position.set(
    center.x,
    center.y - distance * 0.78,
    center.z + distance * 0.55
  );
  state.camera.updateProjectionMatrix();
  state.controls.update();
}

function createGeometry(
  positions: Float32Array,
  indices: Uint16Array | Uint32Array
) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function installScene(host: HTMLDivElement): ViewerState {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f6f7f9");

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
  camera.position.set(0, -120, 90);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0, 1.5);

  const material = new THREE.MeshStandardMaterial({
    color: "#efe8d4",
    roughness: 0.72,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const hemi = new THREE.HemisphereLight("#ffffff", "#a9b3c2", 1.5);
  scene.add(hemi);

  const key = new THREE.DirectionalLight("#ffffff", 2.2);
  key.position.set(80, -100, 130);
  scene.add(key);

  const fill = new THREE.DirectionalLight("#d8eef0", 0.9);
  fill.position.set(-90, 80, 70);
  scene.add(fill);

  const state: ViewerState = {
    scene,
    camera,
    renderer,
    controls,
    material,
    mesh: null,
    frameId: 0,
  };

  const render = () => {
    state.frameId = window.requestAnimationFrame(render);
    state.controls.update();
    state.renderer.render(state.scene, state.camera);
  };

  resizeRenderer(host, state);
  render();

  return state;
}

function useViewerApi(
  stateRef: MutableRefObject<ViewerState | null>,
  setHasMesh: Dispatch<SetStateAction<boolean>>
): LithophaneViewerHandle {
  return {
    setMesh(positions, indices) {
      const state = stateRef.current;
      if (!state) return;

      const geometry = createGeometry(positions, indices);
      const mesh = new THREE.Mesh(geometry, state.material);

      if (state.mesh) {
        state.scene.remove(state.mesh);
        disposeMesh(state.mesh);
      }

      state.mesh = mesh;
      state.scene.add(mesh);
      refitCamera(mesh, state);
      setHasMesh(true);
    },

    updatePositions(positions, options) {
      const state = stateRef.current;
      const mesh = state?.mesh;
      if (!state || !mesh) return;

      const geometry = mesh.geometry;
      const attribute = geometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;

      if (attribute.array.length === positions.length) {
        (attribute.array as Float32Array).set(positions);
        attribute.needsUpdate = true;
      } else {
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3)
        );
      }

      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();

      if (options?.refit) {
        refitCamera(mesh, state);
      }
    },

    resetView() {
      const state = stateRef.current;
      if (!state?.mesh) return;
      refitCamera(state.mesh, state);
    },

    clear() {
      const state = stateRef.current;
      if (!state?.mesh) return;

      state.scene.remove(state.mesh);
      disposeMesh(state.mesh);
      state.mesh = null;
      setHasMesh(false);
    },
  };
}

type LithophaneViewerProps = {
  emptyLabel: string;
  previewLabel: string;
};

export const LithophaneViewer = forwardRef<
  LithophaneViewerHandle,
  LithophaneViewerProps
>(function LithophaneViewer(props, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const stateRef = useRef<ViewerState | null>(null);
    const [hasMesh, setHasMesh] = useState(false);

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;

      const state = installScene(host);
      stateRef.current = state;

      const observer = new ResizeObserver(() => resizeRenderer(host, state));
      observer.observe(host);

      return () => {
        observer.disconnect();
        window.cancelAnimationFrame(state.frameId);
        disposeMesh(state.mesh);
        state.material.dispose();
        state.controls.dispose();
        state.renderer.dispose();
        state.renderer.domElement.remove();
        stateRef.current = null;
      };
    }, []);

    useImperativeHandle(ref, () => useViewerApi(stateRef, setHasMesh), []);

    return (
      <div className="viewer-shell" data-has-mesh={hasMesh}>
        <div ref={hostRef} className="viewer-canvas" aria-label={props.previewLabel} />
        <div className="viewer-empty" aria-hidden="true">
          <span>{props.emptyLabel}</span>
        </div>
      </div>
    );
  });
