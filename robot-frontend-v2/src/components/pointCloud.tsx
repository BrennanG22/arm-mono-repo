import { onMount, onCleanup, createEffect, on } from "solid-js";
import * as THREE from "three";
import { FontLoader, OrbitControls, TextGeometry } from "three/examples/jsm/Addons.js";

export interface PointCloudProps {
  points: [number, number, number][];
  currentPoint?: [number, number, number];
}

export default function PointCloud({ points, currentPoint }: PointCloudProps) {
  let container!: HTMLDivElement;
  
  // Store Three.js objects
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let controls: OrbitControls | null = null;
  let pointsMesh: THREE.Points | null = null;
  let currentPointMesh: THREE.Mesh | null = null;
  let hitSphere: THREE.Mesh | null = null;
  let animationFrameId: number;
  let isMounted = false;

  // Use on() for better control over effect execution
  createEffect(on(
    () => points,
    (currentPoints) => {
      if (!isMounted || !pointsMesh || !scene) {
        console.log("Points update skipped - not ready");
        return;
      }
      
      console.log("Updating points mesh with", currentPoints.length, "points");
      
      const reordered = currentPoints.map(([x, y, z]) => [x, z, y]);
      const positions = new Float32Array(reordered.flat());
      const pointsGeo = new THREE.BufferGeometry();
      pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      
      // Dispose old geometry
      if (pointsMesh.geometry) {
        pointsMesh.geometry.dispose();
      }
      
      pointsMesh.geometry = pointsGeo;
    },
    { defer: true } // Don't run on initial render
  ));

  createEffect(on(
    () => currentPoint,
    (point) => {
      if (!isMounted || !scene) {
        console.log("Current point update skipped - not ready");
        return;
      }
      
      console.log("Updating current point:", point);
      
      // Remove old current point
      if (currentPointMesh) {
        scene.remove(currentPointMesh);
        currentPointMesh.geometry?.dispose();
        currentPointMesh = null;
      }
      
      // Add new current point if provided
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
  ));

  onMount(() => {
    console.log("PointCloud mounted");
    isMounted = true;
    
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
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
    const grid = new THREE.GridHelper(10, 10);
    grid.position.y = -0.01;
    scene.add(grid);
    scene.add(new THREE.AxesHelper(5));

    // Initial points
    const reordered = points.map(([x, y, z]) => [x, z, y]);
    const positions = new Float32Array(reordered.flat());
    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pointsMat = new THREE.PointsMaterial({ 
      size: 0.06, 
      color: 0xffffff, 
      sizeAttenuation: true 
    });
    pointsMesh = new THREE.Points(pointsGeo, pointsMat);
    scene.add(pointsMesh);

    // Initial current point
    if (currentPoint) {
      const [x, y, z] = currentPoint;
      const geo = new THREE.SphereGeometry(0.1, 16, 16);
      const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      currentPointMesh = new THREE.Mesh(geo, mat);
      currentPointMesh.position.set(x, z, y);
      scene.add(currentPointMesh);
    }

    // Bounding box (simplified - removed font loading to avoid errors)
    const boxWidth = 1;
    const boxHeight = 1;
    const boxGeo = new THREE.BoxGeometry(boxWidth, 0, boxHeight);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x0000ff }));
    line.position.set(1, 0, 1);
    scene.add(line);

    // Hit sphere for mouse interaction
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
    
    if (renderer) {
      renderer.domElement.addEventListener("pointermove", onMove);
    }

    // Animation loop
    function animate() {
      if (!isMounted || !scene || !camera || !renderer) return;
      
      animationFrameId = requestAnimationFrame(animate);

      // Mouse intersection
      if (raycaster && hitSphere) {
        raycaster.setFromCamera(mouse, camera);
        const intersect = raycaster.ray.intersectPlane(plane, hitPoint);
        if (intersect && -5 < hitPoint.x && hitPoint.x < 5 && -5 < hitPoint.z && hitPoint.z < 5) {
          hitSphere.position.copy(hitPoint);
          hitSphere.visible = true;
        } else {
          hitSphere.visible = false;
        }
      }

      if (controls) controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    
    resizeObserver.observe(container);

    onCleanup(() => {
      console.log("PointCloud cleanup");
      isMounted = false;
      
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      
      if (renderer) {
        renderer.domElement.removeEventListener("pointermove", onMove);
        renderer.dispose();
      }
      
      if (controls) controls.dispose();
      
      // Clean up geometries and materials
      const cleanupObject = (obj: any) => {
        if (obj?.geometry) obj.geometry.dispose();
        if (obj?.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m: THREE.Material) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      };
      
      cleanupObject(pointsMesh);
      cleanupObject(currentPointMesh);
      cleanupObject(hitSphere);
      
      // Remove renderer from DOM
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