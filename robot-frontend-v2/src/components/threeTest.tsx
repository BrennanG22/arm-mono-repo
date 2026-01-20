import { onCleanup, onMount } from "solid-js";
import * as THREE from "three";
import { telemetry } from "../stores/telemetryStore";
import { OrbitControls } from "three/examples/jsm/Addons.js";

import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

export default function ThreeTest() {
  let container!: HTMLDivElement;

  onMount(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(3, 3, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Orbit controls (same as before)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = 0 + 0.3;
    controls.maxPolarAngle = (Math.PI / 2) - 0.1;
    controls.maxDistance = 10;
    controls.minDistance = 2;

    controls.enablePan = false;

    // Grid and axes
    const grid = new THREE.GridHelper(10, 10);
    scene.add(grid);
    const axis = new THREE.AxesHelper(5);
    axis.position.setY(0.001);
    scene.add(axis);

    // Current point mesh (single sphere)
    const currentPointGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const currentPointMaterial = new THREE.MeshBasicMaterial({ color: 0xff9a1f });
    const currentPointMesh = new THREE.Mesh(currentPointGeometry, currentPointMaterial);
    scene.add(currentPointMesh);

    // Variables for points and lines
    let pointsInstancedMesh: THREE.InstancedMesh | null = null;
    let linesMesh: THREE.LineSegments | null = null;
    let currentPointsCount = 0;
    const dummy = new THREE.Object3D();

    // Create reusable geometries
    const sphereGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // Line material
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: false,
      opacity: 0.6
    });

    // Animation loop
    const animate = () => {
      const pts = telemetry.points ?? [];

      if (pts.length > 0) {
        if (!pointsInstancedMesh || currentPointsCount !== pts.length) {
          if (pointsInstancedMesh) {
            scene.remove(pointsInstancedMesh);
            pointsInstancedMesh.dispose();
          }

          pointsInstancedMesh = new THREE.InstancedMesh(
            sphereGeometry,
            sphereMaterial,
            pts.length
          );
          pointsInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          scene.add(pointsInstancedMesh);
          currentPointsCount = pts.length;
        }

        // Update point positions
        pts.forEach(([x, y, z], i) => {
          dummy.position.set(x, z, y);
          dummy.updateMatrix();
          pointsInstancedMesh!.setMatrixAt(i, dummy.matrix);
        });
        pointsInstancedMesh.instanceMatrix.needsUpdate = true;

        // Update lines between points
        updateLines(pts);
      } else {
        // Clean up if no points
        if (pointsInstancedMesh) {
          scene.remove(pointsInstancedMesh);
          pointsInstancedMesh.dispose();
          pointsInstancedMesh = null;
        }
        if (linesMesh) {
          scene.remove(linesMesh);
          linesMesh.geometry.dispose();
          linesMesh = null;
        }
      }

      // Update current point position
      const currentPt = telemetry.currentPoint;
      if (currentPt) {
        const [x, y, z] = currentPt;
        currentPointMesh.position.set(x, z, y);
      }

      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    // Function to update lines between points
    function updateLines(points: number[][]) {
      // Create line geometry connecting consecutive points
      const lineGeometry = new THREE.BufferGeometry();

      // Each pair of consecutive points needs 2 vertices for a line segment
      const positions = new Float32Array((points.length - 1) * 3 * 2);

      let index = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const [x1, y1, z1] = points[i];
        const [x2, y2, z2] = points[i + 1];

        // First vertex of line segment
        positions[index++] = x1;
        positions[index++] = z1; // Swap Y and Z if needed
        positions[index++] = y1;

        // Second vertex of line segment
        positions[index++] = x2;
        positions[index++] = z2; // Swap Y and Z if needed
        positions[index++] = y2;
      }

      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // Remove old lines
      if (linesMesh) {
        scene.remove(linesMesh);
        linesMesh.geometry.dispose();
      }

      // Create new lines if we have more than 1 point
      if (points.length > 1) {
        linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(linesMesh);
      }
    }

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

      // Dispose of geometries and materials
      if (pointsInstancedMesh) pointsInstancedMesh.dispose();
      if (linesMesh) {
        linesMesh.geometry.dispose();
        lineMaterial.dispose();
      }

      sphereGeometry.dispose();
      sphereMaterial.dispose();
      currentPointGeometry.dispose();
      currentPointMaterial.dispose();

      renderer.dispose();
    });
  });

  return <div ref={container} class="w-full h-full" />;
}