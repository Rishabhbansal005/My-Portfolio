// ================================================================
// 3D Ashoka Chakra — Simple spinning wheel divider
// ================================================================

import * as THREE from 'three';

export function initChakraDividers() {
    document.querySelectorAll('.chakra-3d').forEach(container => {
        buildChakra(container as HTMLElement);
    });
}

function buildChakra(container: HTMLElement) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.z = 3.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    function isDark() {
        return document.body.getAttribute('data-theme') !== 'light';
    }
    function getColor() { return isDark() ? 0xB87333 : 0xC27840; }

    const chakraGroup = new THREE.Group();
    scene.add(chakraGroup);

    // ── Outer rim ──
    const rimGeom = new THREE.TorusGeometry(1.2, 0.04, 8, 64);
    const rimMat = new THREE.MeshBasicMaterial({
        color: getColor(),
        transparent: true,
        opacity: 0.7,
    });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    chakraGroup.add(rim);

    // ── Inner hub ──
    const hubGeom = new THREE.TorusGeometry(0.2, 0.03, 8, 32);
    const hubMat = new THREE.MeshBasicMaterial({
        color: getColor(),
        transparent: true,
        opacity: 0.8,
    });
    const hub = new THREE.Mesh(hubGeom, hubMat);
    chakraGroup.add(hub);

    // ── Center dot ──
    const dotGeom = new THREE.SphereGeometry(0.08, 12, 12);
    const dotMat = new THREE.MeshBasicMaterial({
        color: getColor(),
        transparent: true,
        opacity: 0.7,
    });
    const dot = new THREE.Mesh(dotGeom, dotMat);
    chakraGroup.add(dot);

    // ── 24 Spokes ──
    const spokeMats = [];
    for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const points = [
            new THREE.Vector3(Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, 0),
            new THREE.Vector3(Math.cos(angle) * 1.16, Math.sin(angle) * 1.16, 0),
        ];
        const spokeGeom = new THREE.BufferGeometry().setFromPoints(points);
        const spokeMat = new THREE.LineBasicMaterial({
            color: getColor(),
            transparent: true,
            opacity: 0.55,
        });
        const spoke = new THREE.Line(spokeGeom, spokeMat);
        chakraGroup.add(spoke);
        spokeMats.push(spokeMat);
    }

    // ── Subtle outer decoration — small triangular teeth ──
    for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const halfStep = (0.5 / 24) * Math.PI * 2;
        const r1 = 1.2;
        const r2 = 1.35;
        const points = [
            new THREE.Vector3(Math.cos(angle - halfStep) * r1, Math.sin(angle - halfStep) * r1, 0),
            new THREE.Vector3(Math.cos(angle) * r2, Math.sin(angle) * r2, 0),
            new THREE.Vector3(Math.cos(angle + halfStep) * r1, Math.sin(angle + halfStep) * r1, 0),
        ];
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
            color: getColor(),
            transparent: true,
            opacity: 0.35,
        });
        const tooth = new THREE.Line(geom, mat);
        chakraGroup.add(tooth);
    }

    // Collect all materials for theme updates
    const allMats = [rimMat, hubMat, dotMat, ...spokeMats];

    // ── HOVER SPEED BOOST ──
    let hovered = false;
    container.addEventListener('mouseenter', () => { hovered = true; });
    container.addEventListener('mouseleave', () => { hovered = false; });

    // ── RESIZE ──
    function onResize() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }
    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    onResize();

    // ── THEME OBSERVER ──
    const observer = new MutationObserver(() => {
        const c = getColor();
        allMats.forEach(m => m.color.setHex(c));
        chakraGroup.children.forEach((child: any) => {
            if (child.material && !allMats.includes(child.material)) {
                child.material.color.setHex(c);
            }
        });
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    // ── ANIMATE & PERFORMANCE OBSERVER ──
    let isVisible = false;
    let animationId: number | null = null;

    function animate() {
        if (!isVisible) return; // Pause rendering when off-screen
        
        const speed = hovered ? 0.015 : 0.004;
        chakraGroup.rotation.z -= speed; // Clockwise
        renderer.render(scene, camera);
        
        animationId = requestAnimationFrame(animate);
    }

    const visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;
            if (isVisible) {
                if (!animationId) animate(); // Resume
            } else {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null; // Pause
                }
            }
        });
    }, { rootMargin: '50px' });
    
    visibilityObserver.observe(container);
}
