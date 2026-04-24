/* ============================================
   3D Background Scene - Three.js
   Floating particles with mouse interaction
   ============================================ */

const canvas = document.getElementById('bg-canvas');

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0f, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Mouse tracking
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) * 0.001;
    mouseY = (event.clientY - windowHalfY) * 0.001;
});

// ============================================
// PARTICLE SYSTEM
// ============================================
const particlesGeometry = new THREE.BufferGeometry();
const particleCount = 800;

const posArray = new Float32Array(particleCount * 3);
const colorArray = new Float32Array(particleCount * 3);

const colors = [
    new THREE.Color(0x6366f1), // Indigo
    new THREE.Color(0xa855f7), // Purple
    new THREE.Color(0xec4899), // Pink
    new THREE.Color(0x3b82f6), // Blue
    new THREE.Color(0xf59e0b)  // Amber accent
];

for (let i = 0; i < particleCount; i++) {
    // Position
    posArray[i * 3] = (Math.random() - 0.5) * 80;     // x
    posArray[i * 3 + 1] = (Math.random() - 0.5) * 80; // y
    posArray[i * 3 + 2] = (Math.random() - 0.5) * 60; // z

    // Color
    const color = colors[Math.floor(Math.random() * colors.length)];
    colorArray[i * 3] = color.r;
    colorArray[i * 3 + 1] = color.g;
    colorArray[i * 3 + 2] = color.b;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// ============================================
// FLOATING ORBS (Larger glowing spheres)
// ============================================
const orbs = [];
const orbColors = [0x6366f1, 0xa855f7, 0xec4899, 0x3b82f6];

for (let i = 0; i < 6; i++) {
    const geometry = new THREE.SphereGeometry(
        Math.random() * 1.5 + 0.5,
        32,
        32
    );
    const material = new THREE.MeshBasicMaterial({
        color: orbColors[i % orbColors.length],
        transparent: true,
        opacity: 0.15
    });
    const orb = new THREE.Mesh(geometry, material);
    
    orb.position.x = (Math.random() - 0.5) * 50;
    orb.position.y = (Math.random() - 0.5) * 50;
    orb.position.z = (Math.random() - 0.5) * 30 - 10;
    
    orb.userData = {
        speedX: (Math.random() - 0.5) * 0.01,
        speedY: (Math.random() - 0.5) * 0.01,
        speedZ: (Math.random() - 0.5) * 0.005,
        originalY: orb.position.y
    };
    
    orbs.push(orb);
    scene.add(orb);
    
    // Glow effect ring around orb
    const ringGeo = new THREE.RingGeometry(
        geometry.parameters.radius * 1.5,
        geometry.parameters.radius * 1.8,
        32
    );
    const ringMat = new THREE.MeshBasicMaterial({
        color: orbColors[i % orbColors.length],
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(orb.position);
    ring.userData = { parentOrb: orb };
    scene.add(ring);
    orbs.push(ring);
}

// ============================================
// CONNECTION LINES between nearby particles
// ============================================
const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x6366f1,
    transparent: true,
    opacity: 0.03
});

// ============================================
// GRID FLOOR (subtle)
// ============================================
const gridHelper = new THREE.GridHelper(100, 50, 0x1a1a2e, 0x0f0f1a);
gridHelper.position.y = -25;
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.15;
scene.add(gridHelper);

// ============================================
// ANIMATION LOOP
// ============================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();
    
    // Smooth camera follow mouse
    targetX = mouseX * 8;
    targetY = mouseY * 8;
    
    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.y += (-targetY - camera.position.y) * 0.02;
    camera.lookAt(scene.position);
    
    // Rotate particles slowly
    particlesMesh.rotation.y = elapsedTime * 0.05;
    particlesMesh.rotation.x = elapsedTime * 0.02;
    
    // Pulse particles size
    particlesMaterial.size = 0.15 + Math.sin(elapsedTime * 2) * 0.03;
    
    // Animate orbs
    orbs.forEach((obj) => {
        if (obj.userData.parentOrb) {
            // Ring follows parent orb
            obj.position.copy(obj.userData.parentOrb.position);
            obj.rotation.x += 0.01;
            obj.rotation.y += 0.005;
        } else {
            // Orb movement
            obj.position.x += obj.userData.speedX;
            obj.position.y = obj.userData.originalY + Math.sin(elapsedTime + obj.position.x) * 2;
            obj.position.z += obj.userData.speedZ;
            
            obj.rotation.x += 0.003;
            obj.rotation.y += 0.005;
            
            // Pulse opacity
            obj.material.opacity = 0.1 + Math.sin(elapsedTime * 1.5 + obj.position.x) * 0.05;
        }
    });
    
    // Rotate grid
    gridHelper.rotation.y = elapsedTime * 0.02;
    
    renderer.render(scene, camera);
}

animate();

// ============================================
// RESIZE HANDLER
// ============================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================
// TOUCH SUPPORT for mobile
// ============================================
document.addEventListener('touchmove', (event) => {
    if (event.touches.length > 0) {
        mouseX = (event.touches[0].clientX - windowHalfX) * 0.001;
        mouseY = (event.touches[0].clientY - windowHalfY) * 0.001;
    }
}, { passive: true });
