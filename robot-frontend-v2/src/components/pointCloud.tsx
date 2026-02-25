import { onMount, onCleanup, createEffect, on } from "solid-js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

export interface PointCloudProps {
  points: [number, number, number][];
  currentPoint?: [number, number, number];
}

export default function PointCloud(props: PointCloudProps) {
  let container!: HTMLDivElement;

  // Three.js objects
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let controls: OrbitControls | null = null;
  let pointsMesh: THREE.Points | null = null;
  let currentPointMesh: THREE.Mesh | null = null;
  let hitSphere: THREE.Mesh | null = null;
  let animationFrameId = 0;
  let isMounted = false;


  createEffect(
    on(
      () => props.points,
      (points) => {
        if (!isMounted || !pointsMesh) return;

        const reordered = points.map(([x, y, z]) => [x, z, y]);
        const positions = new Float32Array(reordered.flat());

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3)
        );

        pointsMesh.geometry.dispose();
        pointsMesh.geometry = geometry;
      },
      { defer: true }
    )
  );

  createEffect(
    on(
      () => props.currentPoint,
      (point) => {
        if (!isMounted || !scene) return;

        if (currentPointMesh) {
          scene.remove(currentPointMesh);
          currentPointMesh.geometry?.dispose();
          (currentPointMesh.material as THREE.Material)?.dispose();
          currentPointMesh = null;
        }

        if (point) {
          const [x, y, z] = point;
          const geo = new THREE.SphereGeometry(0.1, 16, 16);
          const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
          currentPointMesh = new THREE.Mesh(geo, mat);
          currentPointMesh.position.set(x, z, y);
          scene.add(currentPointMesh);
        }
      },
      { defer: true }
    )
  );


  onMount(() => {
    isMounted = true;

    // Scene
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(4, 4, 4);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // Helpers
    scene.add(new THREE.GridHelper(10, 10));
    scene.add(new THREE.AxesHelper(5));

    // Initial points
    const reordered = props.points.map(([x, y, z]) => [x, z, y]);
    const positions = new Float32Array(reordered.flat());

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
      size: 0.06,
      color: 0xffffff,
      sizeAttenuation: true
    });

    pointsMesh = new THREE.Points(geometry, material);
    scene.add(pointsMesh);

    // Initial current point
    if (props.currentPoint) {
      const [x, y, z] = props.currentPoint;
      const geo = new THREE.SphereGeometry(0.1, 16, 16);
      const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      currentPointMesh = new THREE.Mesh(geo, mat);
      currentPointMesh.position.set(x, z, y);
      scene.add(currentPointMesh);
    }

    // Hit sphere
    hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffff00 })
    );
    hitSphere.visible = false;
    scene.add(hitSphere);

    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hitPoint = new THREE.Vector3();

    function onMove(e: MouseEvent) {
      if (!renderer) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    renderer.domElement.addEventListener("pointermove", onMove);

    // Animation loop
    const animate = () => {
      if (!isMounted || !scene || !camera || !renderer) return;
      animationFrameId = requestAnimationFrame(animate);

      raycaster.setFromCamera(mouse, camera);
      if (
        raycaster.ray.intersectPlane(plane, hitPoint) &&
        Math.abs(hitPoint.x) < 5 &&
        Math.abs(hitPoint.z) < 5
      ) {
        hitSphere!.position.copy(hitPoint);
        hitSphere!.visible = true;
      } else {
        hitSphere!.visible = false;
      }

      controls?.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize
    const resizeObserver = new ResizeObserver(() => {
      if (!camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });

    resizeObserver.observe(container);


    onCleanup(() => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      renderer?.domElement.removeEventListener("pointermove", onMove);
      controls?.dispose();
      renderer?.dispose();

      const dispose = (obj: any) => {
        obj?.geometry?.dispose();
        if (Array.isArray(obj?.material)) {
          obj.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          obj?.material?.dispose();
        }
      };

      dispose(pointsMesh);
      dispose(currentPointMesh);
      dispose(hitSphere);

      if (renderer && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      scene = null;
      camera = null;
      renderer = null;
      controls = null;
      pointsMesh = null;
      currentPointMesh = null;
      hitSphere = null;
    });
  });

  return <div ref={container} style={{ width: "100%", height: "100%" }} />;
}
