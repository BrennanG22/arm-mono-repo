import { onCleanup, onMount } from "solid-js";
import * as THREE from "three";
import { telemetry } from "../stores/telemetryStore";
import { OrbitControls } from "three/examples/jsm/Addons.js";

export default function ThreeTest() {
  let container!: HTMLDivElement;

  onMount(() => {
    // Scene, camera, renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Grid helper
    const grid = new THREE.GridHelper(10, 10);
    scene.add(grid);

    // Points geometry
    const pointsGeometry = new THREE.BufferGeometry();
    const pointsMaterial = new THREE.PointsMaterial({ color: 0xff0000, size: 0.1 });
    const pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(pointsMesh);

    const currentPointGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const currentPointMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const currentPointMesh = new THREE.Mesh(currentPointGeometry, currentPointMaterial);
    scene.add(currentPointMesh);

    // Animation loop
    const animate = () => {
      const pts = telemetry.points ?? []; 
      if (pts.length > 0) {
        const positions = new Float32Array(pts.length * 3);
        pts.forEach(([x, y, z], i) => {
          positions[i * 3] = x;
          positions[i * 3 + 1] = z;
          positions[i * 3 + 2] = y;
        });
        pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        pointsGeometry.attributes.position.needsUpdate = true;
      }

      const currentPt = telemetry.currentPoint;
      if (currentPt) {
        const [x, y, z] = currentPt;
        currentPointMesh.position.set(x, z, y);
      }

      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    onCleanup(() => {
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    });
  });

  return <div ref={container} style={{ width: "100%", height: "100vh" }} />;
}
