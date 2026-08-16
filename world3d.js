/* ============================================================================
   CHRONOS 3D // Hyper-Realistic 3D Alarm Clock with Crystal-Clear Dial & Numbers
   ============================================================================ */

class AlarmClockHorology3D {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        this.container = document.getElementById('canvas-container');
        this.scrollProgress = 0;
        this.smoothScroll = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;

        this.init();
        this.buildStudioEnvironment();
        this.generateDialTexture();
        this.buildAlarmClock();
        this.setupEvents();
        this.animate();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0xf4f6fb, 0.0010);

        // Perspective camera with wide view to frame the whole alarm clock perfectly
        this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 185);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.explodedParts = [];
    }

    buildStudioEnvironment() {
        const ambient = new THREE.AmbientLight(0xffffff, 2.6);
        this.scene.add(ambient);

        // Key Overhead Softbox
        const keyLight = new THREE.DirectionalLight(0xfff8ee, 3.2);
        keyLight.position.set(60, 120, 140);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        this.scene.add(keyLight);

        // Fill Soft Light
        const fillLight = new THREE.DirectionalLight(0xe8f0fc, 1.8);
        fillLight.position.set(-90, 40, 100);
        this.scene.add(fillLight);

        // Warm Gold Rim Accent
        const rimLight = new THREE.DirectionalLight(0xf2c94c, 2.2);
        rimLight.position.set(0, -90, 70);
        this.scene.add(rimLight);

        // Studio Floor Shadow
        const floorGeo = new THREE.PlaneGeometry(800, 800);
        const floorMat = new THREE.ShadowMaterial({ opacity: 0.15 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.y = -65;
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }

    // ------------------------------------------------------------------------
    // Generate Ultra-Bold, Pure Black-on-White High-Contrast Dial
    // ------------------------------------------------------------------------
    generateDialTexture() {
        const dialCanvas = document.createElement('canvas');
        dialCanvas.width = 2048;
        dialCanvas.height = 2048;
        const ctx = dialCanvas.getContext('2d');
        const cx = 1024, cy = 1024;

        // 1. Pure Opaque Solid White Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 2048, 2048);

        // Subtle Radial Edge Shading
        const radialGrad = ctx.createRadialGradient(cx, cy, 400, cx, cy, 1020);
        radialGrad.addColorStop(0, '#ffffff');
        radialGrad.addColorStop(0.90, '#fbfcfe');
        radialGrad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = radialGrad;
        ctx.fillRect(0, 0, 2048, 2048);

        // 2. Bold Solid Black Outer Rings
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.arc(cx, cy, 970, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#d99e32';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, 940, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, 860, 0, Math.PI * 2);
        ctx.stroke();

        // 3. 60 Minute / Second Railroad Track Ticks
        for (let i = 0; i < 60; i++) {
            const angle = (i / 60) * Math.PI * 2;
            const is5Min = i % 5 === 0;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = is5Min ? 18 : 7;
            ctx.beginPath();
            ctx.moveTo(0, -(is5Min ? 850 : 880));
            ctx.lineTo(0, -940);
            ctx.stroke();
            ctx.restore();
        }

        // 4. Large Jet-Black Bold Arabic Numerals (1 to 12)
        ctx.fillStyle = '#000000';
        ctx.font = '900 180px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let num = 1; num <= 12; num++) {
            const angle = (num / 12) * Math.PI * 2;
            const numDist = 700;
            const x = cx + Math.sin(angle) * numDist;
            const y = cy - Math.cos(angle) * numDist;
            ctx.fillText(String(num), x, y + 10);
        }

        // 5. Emerald Luminous Hour Indicator Dots
        for (let num = 1; num <= 12; num++) {
            const angle = (num / 12) * Math.PI * 2;
            const dotDist = 845;
            const x = cx + Math.sin(angle) * dotDist;
            const y = cy - Math.cos(angle) * dotDist;

            ctx.fillStyle = '#059669';
            ctx.beginPath();
            ctx.arc(x, y, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        // 6. Brand Typography & Horological Labels
        ctx.fillStyle = '#000000';
        ctx.font = '800 58px "Space Grotesk", sans-serif';
        ctx.fillText('CHRONOS', cx, 520);

        ctx.fillStyle = '#d99e32';
        ctx.font = 'bold 28px "JetBrains Mono", monospace';
        ctx.fillText('PRECISION HOROLOGY // 32,768 Hz', cx, 580);

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 26px "JetBrains Mono", monospace';
        ctx.fillText('TWIN BELL CLASSIC', cx, 1440);

        ctx.font = 'bold 22px "Space Grotesk", sans-serif';
        ctx.fillText('SWISS  MADE', cx, 1860);

        this.dialTexture = new THREE.CanvasTexture(dialCanvas);
        this.dialTexture.anisotropy = 16;
        this.dialTexture.needsUpdate = true;
    }

    // ------------------------------------------------------------------------
    // Build 3D Alarm Clock with Proper Layering (Gears Placed Behind Dial)
    // ------------------------------------------------------------------------
    buildAlarmClock() {
        this.clockGroup = new THREE.Group();
        this.scene.add(this.clockGroup);

        // Materials
        const boldOutlineMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,     // Deep contrast slate rim
            metalness: 0.95,
            roughness: 0.15
        });

        const polishedGoldMat = new THREE.MeshStandardMaterial({
            color: 0xe5b869,     // Champagne Gold
            metalness: 0.96,
            roughness: 0.12,
            emissive: 0x443300,
            emissiveIntensity: 0.25
        });

        const whiteEnamelMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.18,
            metalness: 0.05
        });

        // Crisp Unlit / Basic White Dial Material (guarantees crystal-clear pure white face)
        const dialMat = new THREE.MeshBasicMaterial({
            map: this.dialTexture,
            color: 0xffffff,
            depthTest: true,
            depthWrite: true
        });

        const boldBlackHandMat = new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.9,
            roughness: 0.1
        });

        const secondRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const alarmGoldMat = new THREE.MeshStandardMaterial({ color: 0xd99e32, metalness: 0.9 });
        const lumeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        // ====================================================================
        // LAYER 1: Dual-Domed Sapphire Glass Front (Explodes +65)
        // ====================================================================
        const glassGeo = new THREE.CylinderGeometry(44.5, 44.5, 2.5, 64);
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 0.96,
            opacity: 1,
            transparent: true,
            roughness: 0.02,
            ior: 1.77,
            thickness: 3.5,
            reflectivity: 0.9
        });
        this.glassDome = new THREE.Mesh(glassGeo, glassMat);
        this.glassDome.rotation.x = Math.PI / 2;
        this.registerExplodedPart(this.glassDome, 65, 5.0);

        // ====================================================================
        // LAYER 2: Front Bezel Ring & Gold Step (Explodes +38)
        // ====================================================================
        this.bezelGroup = new THREE.Group();

        // Bold Deep Dark Bezel Outer Ring (Guarantees visible outline!)
        const outerBezel = new THREE.Mesh(new THREE.TorusGeometry(44.5, 2.4, 16, 64), boldOutlineMat);
        this.bezelGroup.add(outerBezel);

        // Inner Polished Gold Bezel Step
        const goldInnerBezel = new THREE.Mesh(new THREE.TorusGeometry(43.2, 1.6, 16, 64), polishedGoldMat);
        goldInnerBezel.position.z = 1.8;
        this.bezelGroup.add(goldInnerBezel);

        this.registerExplodedPart(this.bezelGroup, 38, 2.5);

        // ====================================================================
        // LAYER 3: Dial Face & Large High-Visibility Hands (Explodes +15)
        // ====================================================================
        this.dialAndHandsGroup = new THREE.Group();

        // Main White Dial Disc using CircleGeometry (faces forward)
        const dialPlateGeo = new THREE.CircleGeometry(43.5, 64);
        const dialPlate = new THREE.Mesh(dialPlateGeo, dialMat);
        this.dialAndHandsGroup.add(dialPlate);

        // 1. Spade-Style Bold Black Hour Hand (with white inlay)
        const hourHandGroup = new THREE.Group();
        const hourShaft = new THREE.Mesh(new THREE.BoxGeometry(3.4, 23, 1.4), boldBlackHandMat);
        hourShaft.geometry.translate(0, 11.5, 0);
        hourShaft.castShadow = true;

        const hourSpade = new THREE.Mesh(new THREE.ConeGeometry(4.4, 9, 4), boldBlackHandMat);
        hourSpade.position.set(0, 23, 0);

        const hourLume = new THREE.Mesh(new THREE.BoxGeometry(1.5, 14, 1.5), lumeWhiteMat);
        hourLume.geometry.translate(0, 12, 0);

        hourHandGroup.add(hourShaft, hourSpade, hourLume);
        this.hourHand = hourHandGroup;
        this.hourHand.position.z = 1.8;

        // 2. Long Bold Black Minute Hand (reaching the railroad track)
        const minHandGroup = new THREE.Group();
        const minShaft = new THREE.Mesh(new THREE.BoxGeometry(2.8, 34, 1.4), boldBlackHandMat);
        minShaft.geometry.translate(0, 17, 0);
        minShaft.castShadow = true;

        const minSpade = new THREE.Mesh(new THREE.ConeGeometry(3.8, 9.5, 4), boldBlackHandMat);
        minSpade.position.set(0, 34, 0);

        const minLume = new THREE.Mesh(new THREE.BoxGeometry(1.3, 22, 1.5), lumeWhiteMat);
        minLume.geometry.translate(0, 18, 0);

        minHandGroup.add(minShaft, minSpade, minLume);
        this.minuteHand = minHandGroup;
        this.minuteHand.position.z = 2.8;

        // 3. Gold Alarm Indicator Hand (Points to 7:00 / Target Alarm Time)
        const alarmHandGroup = new THREE.Group();
        const alarmShaft = new THREE.Mesh(new THREE.BoxGeometry(1.6, 20, 1.0), alarmGoldMat);
        alarmShaft.geometry.translate(0, 10, 0);
        const alarmArrow = new THREE.Mesh(new THREE.ConeGeometry(2.8, 6, 3), alarmGoldMat);
        alarmArrow.position.set(0, 20, 0);
        alarmHandGroup.add(alarmShaft, alarmArrow);
        alarmHandGroup.rotation.z = -Math.PI * (7 / 6);
        this.alarmHand = alarmHandGroup;
        this.alarmHand.position.z = 1.2;

        // 4. Vibrant Sweeping Red Seconds Hand with Circular Counterweight
        const secHandGroup = new THREE.Group();
        const secShaft = new THREE.Mesh(new THREE.BoxGeometry(1.0, 39, 1.0), secondRedMat);
        secShaft.geometry.translate(0, 16.5, 0);
        const secCounterweight = new THREE.Mesh(new THREE.CircleGeometry(2.8, 24), secondRedMat);
        secCounterweight.position.set(0, -6, 0);
        secHandGroup.add(secShaft, secCounterweight);
        this.secondHand = secHandGroup;
        this.secondHand.position.z = 3.8;

        // Central Polished Gold Cap
        const centerCap = new THREE.Mesh(new THREE.SphereGeometry(3.0, 24, 24), polishedGoldMat);
        centerCap.position.z = 4.2;
        centerCap.scale.set(1, 1, 0.6);

        this.dialAndHandsGroup.add(this.hourHand, this.minuteHand, this.alarmHand, this.secondHand, centerCap);
        this.registerExplodedPart(this.dialAndHandsGroup, 15, 0.5);

        // ====================================================================
        // LAYER 4: Internal Mechanical Bell Gearset (Safely Behind Dial at Z = -8)
        // ====================================================================
        this.movementGroup = new THREE.Group();

        const mainplateGeo = new THREE.CylinderGeometry(40, 40, 3.5, 48);
        const mainplate = new THREE.Mesh(mainplateGeo, polishedGoldMat);
        mainplate.rotation.x = Math.PI / 2;
        this.movementGroup.add(mainplate);

        this.gear1 = this.createWatchGear(16, 20, polishedGoldMat);
        this.gear1.position.set(-14, 12, 2.0);
        this.gear2 = this.createWatchGear(12, 16, polishedGoldMat);
        this.gear2.position.set(2, 15, 2.0);
        this.movementGroup.add(this.gear1, this.gear2);

        // Placed securely BEHIND the dial face (baseZ: -8)
        this.registerExplodedPart(this.movementGroup, 0, -8);

        // ====================================================================
        // LAYER 5: Alarm Clock Body, Twin Bells, Legs & Handle (Explodes -45)
        // ====================================================================
        this.bodyAndBellsGroup = new THREE.Group();

        // Main Cylindrical Body with Bold Contrast Rims
        const bodyGeo = new THREE.CylinderGeometry(45.5, 46.5, 18, 64);
        const clockBody = new THREE.Mesh(bodyGeo, whiteEnamelMat);
        clockBody.rotation.x = Math.PI / 2;
        clockBody.castShadow = true;
        this.bodyAndBellsGroup.add(clockBody);

        // Rear Dark Rim Ring
        const rearRim = new THREE.Mesh(new THREE.TorusGeometry(45.5, 2.2, 16, 64), boldOutlineMat);
        rearRim.position.z = -9;
        this.bodyAndBellsGroup.add(rearRim);

        // Dual Angled Metallic Support Peg Legs (Bottom)
        const legGeo = new THREE.CylinderGeometry(2.8, 4.4, 18, 24);
        const leftLeg = new THREE.Mesh(legGeo, polishedGoldMat);
        leftLeg.position.set(-28, -48, -2);
        leftLeg.rotation.z = -0.45;
        leftLeg.rotation.x = 0.2;
        leftLeg.castShadow = true;

        const rightLeg = new THREE.Mesh(legGeo, polishedGoldMat);
        rightLeg.position.set(28, -48, -2);
        rightLeg.rotation.z = 0.45;
        rightLeg.rotation.x = 0.2;
        rightLeg.castShadow = true;

        const backStand = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.8, 20, 24), boldOutlineMat);
        backStand.position.set(0, -32, -18);
        backStand.rotation.x = -0.7;

        this.bodyAndBellsGroup.add(leftLeg, rightLeg, backStand);

        // Top Twin Bells
        const bellGeo = new THREE.SphereGeometry(18.5, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
        this.leftBell = new THREE.Mesh(bellGeo, polishedGoldMat);
        this.leftBell.position.set(-32, 45, 0);
        this.leftBell.rotation.z = 0.55;
        this.leftBell.castShadow = true;

        this.rightBell = new THREE.Mesh(bellGeo, polishedGoldMat);
        this.rightBell.position.set(32, 45, 0);
        this.rightBell.rotation.z = -0.55;
        this.rightBell.castShadow = true;

        // Bell Mount Stems
        const stemGeo = new THREE.CylinderGeometry(2.2, 2.2, 14, 16);
        const leftStem = new THREE.Mesh(stemGeo, boldOutlineMat);
        leftStem.position.set(-24, 38, 0);
        leftStem.rotation.z = 0.55;

        const rightStem = new THREE.Mesh(stemGeo, boldOutlineMat);
        rightStem.position.set(24, 38, 0);
        rightStem.rotation.z = -0.55;

        // Center Striking Hammer
        this.hammerGroup = new THREE.Group();
        this.hammerGroup.position.set(0, 42, 0);
        const hammerStem = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 12, 12), boldOutlineMat);
        hammerStem.position.y = 6;
        const hammerHead = new THREE.Mesh(new THREE.SphereGeometry(3.8, 16, 16), polishedGoldMat);
        hammerHead.position.y = 12;
        this.hammerGroup.add(hammerStem, hammerHead);

        // Top Carrying Arch Handle
        const handleGeo = new THREE.TorusGeometry(14, 2.4, 16, 32, Math.PI);
        const handle = new THREE.Mesh(handleGeo, boldOutlineMat);
        handle.position.set(0, 52, 0);

        this.bodyAndBellsGroup.add(this.leftBell, this.rightBell, leftStem, rightStem, this.hammerGroup, handle);

        // Rear Winding Knobs
        const knobGeo = new THREE.CylinderGeometry(4.5, 4.5, 6, 20);
        const windKeyTime = new THREE.Mesh(knobGeo, polishedGoldMat);
        windKeyTime.position.set(-15, 6, -11);
        windKeyTime.rotation.x = Math.PI / 2;

        const windKeyAlarm = new THREE.Mesh(knobGeo, polishedGoldMat);
        windKeyAlarm.position.set(15, 6, -11);
        windKeyAlarm.rotation.x = Math.PI / 2;

        this.bodyAndBellsGroup.add(windKeyTime, windKeyAlarm);
        this.registerExplodedPart(this.bodyAndBellsGroup, -45, -12);

        // Set initial orientation
        this.clockGroup.rotation.x = 0.12;
        this.clockGroup.rotation.y = -0.18;
    }

    createWatchGear(radius, teeth, material) {
        const group = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1.2, 24), material);
        body.rotation.x = Math.PI / 2;
        group.add(body);

        for (let i = 0; i < teeth; i++) {
            const angle = (i / teeth) * Math.PI * 2;
            const tooth = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.18, radius * 0.28, 1.2), material);
            tooth.position.set(Math.cos(angle) * (radius + radius * 0.08), Math.sin(angle) * (radius + radius * 0.08), 0);
            tooth.rotation.z = angle;
            group.add(tooth);
        }
        return group;
    }

    registerExplodedPart(mesh, maxOffsetZ, baseZ) {
        this.clockGroup.add(mesh);
        mesh.position.z = baseZ;
        mesh.userData = { baseZ, maxOffsetZ };
        this.explodedParts.push(mesh);
    }

    setupEvents() {
        window.addEventListener('scroll', () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (maxScroll > 0) {
                this.scrollProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
            }
        }, { passive: true });

        window.addEventListener('mousemove', (e) => {
            this.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            this.targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.smoothScroll += (this.scrollProgress - this.smoothScroll) * 0.07;
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.06;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.06;

        const p = this.smoothScroll;
        const time = performance.now() * 0.001;

        // Cinematic 4-Phase Camera & Clock Positioning
        if (p < 0.25) {
            // PHASE 1: Assembled Hero Overview
            const factor = p / 0.25;
            this.clockGroup.position.set(22 + this.mouseX * 6, -3 - this.mouseY * 4, 10);
            this.clockGroup.rotation.x = 0.12 + factor * 0.14 - this.mouseY * 0.16;
            this.clockGroup.rotation.y = -0.18 + factor * 0.28 + this.mouseX * 0.20;
            this.clockGroup.rotation.z = -0.02;

            this.explodedParts.forEach(part => {
                part.position.z = part.userData.baseZ;
            });

        } else if (p >= 0.25 && p < 0.58) {
            // PHASE 2: Exploded Deconstruction (Gears reveal inside only here)
            const factor = (p - 0.25) / (0.58 - 0.25);
            const explodeAmount = Math.sin(factor * Math.PI * 0.5);

            this.clockGroup.position.set(18 + this.mouseX * 8, 2 - this.mouseY * 4, -10);
            this.clockGroup.rotation.x = 0.32 + explodeAmount * 0.38 - this.mouseY * 0.15;
            this.clockGroup.rotation.y = 0.05 + explodeAmount * 0.65 + this.mouseX * 0.2;
            this.clockGroup.rotation.z = explodeAmount * 0.12;

            this.explodedParts.forEach(part => {
                part.position.z = part.userData.baseZ + part.userData.maxOffsetZ * explodeAmount;
            });

        } else if (p >= 0.58 && p < 0.82) {
            // PHASE 3: Macro Dial Zoom
            const factor = (p - 0.58) / (0.82 - 0.58);
            const zoomIn = Math.sin(factor * Math.PI * 0.5);

            this.clockGroup.position.set(-15 * zoomIn + this.mouseX * 5, -2 - this.mouseY * 3, 10 + zoomIn * 45);
            this.clockGroup.rotation.x = 0.10 - zoomIn * 0.08 - this.mouseY * 0.1;
            this.clockGroup.rotation.y = -0.10 + this.mouseX * 0.15;
            this.clockGroup.rotation.z = 0;

            this.explodedParts.forEach(part => {
                part.position.z = part.userData.baseZ;
            });

        } else {
            // PHASE 4: Telemetry Horizon
            const factor = (p - 0.82) / (1.0 - 0.82);
            this.clockGroup.position.set(15 - factor * 8 + this.mouseX * 6, -5 - this.mouseY * 4, 25);
            this.clockGroup.rotation.x = 0.22 + factor * 0.32;
            this.clockGroup.rotation.y = -0.22 + factor * 1.0 + this.mouseX * 0.2;
            this.clockGroup.rotation.z = factor * 0.16;

            this.explodedParts.forEach(part => {
                part.position.z = part.userData.baseZ;
            });
        }

        // Live Real-Time Clock Hands Movement
        const now = new Date();
        const ms = now.getMilliseconds();
        const secs = now.getSeconds() + ms / 1000;
        const mins = now.getMinutes() + secs / 60;
        const hrs = (now.getHours() % 12) + mins / 60;

        if (this.secondHand) this.secondHand.rotation.z = -secs * (Math.PI * 2 / 60);
        if (this.minuteHand) this.minuteHand.rotation.z = -mins * (Math.PI * 2 / 60);
        if (this.hourHand) this.hourHand.rotation.z = -hrs * (Math.PI * 2 / 12);

        // Internal Gears Rotation
        if (this.gear1) this.gear1.rotation.z += 0.025;
        if (this.gear2) this.gear2.rotation.z -= 0.033;

        // Vibrate Hammer during Alarm Chime
        if (window.isAlarmRinging && this.hammerGroup) {
            this.hammerGroup.rotation.z = Math.sin(time * 60) * 0.35;
        } else if (this.hammerGroup) {
            this.hammerGroup.rotation.z = 0;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.alarmClockHorology = new AlarmClockHorology3D();
});
