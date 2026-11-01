// A small three.js scene: a thermal printer feeding out a paper receipt.
// Loaded with a dynamic import from ReceiptPrinter, so three.js only ships to the confirmation page.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Receipt } from "@/features/orders/receipt";

export type ReceiptScene = { replay(): void; dispose(): void };

const PAPER_WIDTH = 1.62; // scene units
const LID_TOP = 0.972; // height of the printer's top surface
const SLOT_Z = -0.22;
const FONT = `ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", "DejaVu Sans Mono", monospace`;

// ---------------------------------------------------------------- receipt texture

function drawReceipt(receipt: Receipt) {
  const W = 768;
  const pad = 58;
  const ink = "#23252a";

  // Lay out once without drawing to learn the height, then again for real.
  const run = (ctx: CanvasRenderingContext2D | null) => {
    let y = 0;
    const text = (s: string, size: number, opts: { weight?: number; align?: "left" | "right" | "center"; x?: number; color?: string } = {}) => {
      if (!ctx) return;
      ctx.font = `${opts.weight ?? 600} ${size}px ${FONT}`;
      ctx.fillStyle = opts.color ?? ink;
      ctx.textAlign = opts.align ?? "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(s, opts.x ?? (opts.align === "center" ? W / 2 : opts.align === "right" ? W - pad : pad), y);
    };
    const fit = (s: string, size: number, maxWidth: number) => {
      if (!ctx) return s;
      ctx.font = `600 ${size}px ${FONT}`;
      if (ctx.measureText(s).width <= maxWidth) return s;
      let out = s;
      while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
      return `${out.trimEnd()}…`;
    };
    const rule = (dash: number[], gap = 30) => {
      y += gap;
      if (ctx) {
        ctx.save();
        ctx.strokeStyle = "rgba(35,37,42,0.55)";
        ctx.lineWidth = 4;
        ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(W - pad, y);
        ctx.stroke();
        ctx.restore();
      }
      y += gap;
    };
    const row = (label: string, amount: string, size: number, weight = 600) => {
      y += size * 1.45;
      if (!ctx) return;
      ctx.font = `${weight} ${size}px ${FONT}`;
      const amountWidth = ctx.measureText(amount).width;
      text(fit(label, size, W - pad * 2 - amountWidth - 28), size, { weight });
      text(amount, size, { weight, align: "right" });
    };

    y = 40; // room for the torn edge
    y += 88;
    text(receipt.store, 74, { weight: 800, align: "center" });
    y += 50;
    text(receipt.stamp, 30, { align: "center", color: "rgba(35,37,42,0.62)" });
    rule([14, 10], 28);
    receipt.items.forEach((item) => row(item.label, item.amount, 38));
    if (receipt.hiddenItems > 0) {
      y += 44;
      text(`+ ${receipt.hiddenItems} more item${receipt.hiddenItems === 1 ? "" : "s"}`, 30, { color: "rgba(35,37,42,0.62)" });
    }
    rule([14, 10], 26);
    receipt.charges.forEach((c) => row(c.label, c.amount, 31, 500));
    rule([], 24);
    row(receipt.total.label, receipt.total.amount, 48, 800);
    rule([14, 10], 28);
    y += 34;
    text(`ORDER ${receipt.orderNumber}`, 30, { align: "center" });
    // A decorative barcode made from the order number.
    y += 30;
    if (ctx) {
      const code = receipt.orderNumber.split("").map((c) => c.charCodeAt(0));
      let x = pad + 60;
      ctx.fillStyle = ink;
      for (let i = 0; x < W - pad - 60; i++) {
        const v = code[i % code.length] + i * 7;
        const w = 3 + (v % 4) * 2;
        if (i % 2 === 0) ctx.fillRect(x, y, w, 70);
        x += w + 2 + ((v >> 2) % 3) * 2;
      }
    }
    y += 70 + 54;
    text("THANK YOU FOR SHOPPING", 30, { align: "center" });
    y += 40;
    text("tiny clothes, big adventures", 26, { weight: 500, align: "center", color: "rgba(35,37,42,0.62)" });
    y += 120; // tail that stays inside the printer
    return y;
  };

  const height = Math.ceil(run(null) + 40);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Paper with a torn zig-zag top edge.
  ctx.save();
  ctx.beginPath();
  const tooth = 24;
  ctx.moveTo(0, height);
  ctx.lineTo(0, 22);
  for (let x = 0; x <= W; x += tooth) {
    ctx.lineTo(x + tooth / 2, 6);
    ctx.lineTo(x + tooth, 22);
  }
  ctx.lineTo(W, height);
  ctx.closePath();
  ctx.clip();
  const paper = ctx.createLinearGradient(0, 0, 0, height);
  paper.addColorStop(0, "#fbfaf6");
  paper.addColorStop(1, "#efede6");
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, height);
  run(ctx);
  // Thermal print is never perfectly even: knock a few speckles out of the ink.
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = "rgba(251,250,246,0.35)";
  for (let i = 0; i < 2200; i++) ctx.fillRect(Math.random() * W, Math.random() * height, 1.5, 1.5);
  ctx.restore();
  return canvas;
}

function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, "rgba(40,34,28,0.5)");
  g.addColorStop(0.55, "rgba(40,34,28,0.18)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

// ---------------------------------------------------------------- scene

export function mountReceiptScene(container: HTMLElement, receipt: Receipt, { animate }: { animate: boolean }): ReceiptScene | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    return null; // no WebGL: the written summary on the page is enough
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.localClippingEnabled = true;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.6;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc6b8, 1.0));
  const key = new THREE.DirectionalLight(0xfffaf2, 1.9);
  key.position.set(2.5, 4.5, 3.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe6ff, 1.3);
  rim.position.set(-3.5, 2.5, -3);
  scene.add(rim);

  // The printer
  const model = new THREE.Group();
  scene.add(model);
  // A charcoal body with a soft satin coat, like a real desktop receipt printer.
  const body = new THREE.MeshPhysicalMaterial({ color: 0x2b2e34, roughness: 0.48, metalness: 0.1, clearcoat: 0.35, clearcoatRoughness: 0.45 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x101216, roughness: 0.32, metalness: 0.3 });

  const base = new THREE.Mesh(new RoundedBoxGeometry(2.7, 0.62, 2.0, 6, 0.2), body);
  base.position.y = 0.31;
  const seam = new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.03, 1.9, 4, 0.012), dark);
  seam.position.y = 0.625;
  const lid = new THREE.Mesh(new RoundedBoxGeometry(2.66, 0.34, 1.96, 6, 0.16), body);
  lid.position.y = 0.802;
  const slot = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.02, 0.11), new THREE.MeshBasicMaterial({ color: 0x030405 }));
  slot.position.set(0, LID_TOP - 0.006, SLOT_Z);
  const lip = new THREE.Mesh(new RoundedBoxGeometry(2.05, 0.04, 0.06, 2, 0.015), dark);
  lip.position.set(0, LID_TOP + 0.012, SLOT_Z + 0.1);
  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.035, 32), dark);
  button.position.set(1.0, LID_TOP + 0.01, SLOT_Z + 0.32);
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x0b1a12, emissive: new THREE.Color(0x34d399), emissiveIntensity: 0.2 });
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.03, 24), ledMat);
  led.position.set(1.05, 0.8, 0.981);
  model.add(base, seam, lid, slot, lip, button, led);

  const shadowTex = shadowTexture();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 3.6),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.001;
  scene.add(shadow);

  // The receipt: a gently bowed sheet, clipped at the printer's top so it rises out of the slot.
  const canvas = drawReceipt(receipt);
  const paperTex = new THREE.CanvasTexture(canvas);
  paperTex.colorSpace = THREE.SRGBColorSpace;
  paperTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const paperHeight = PAPER_WIDTH * (canvas.height / canvas.width);
  const paperGeo = new THREE.PlaneGeometry(PAPER_WIDTH, paperHeight, 1, 32);
  paperGeo.translate(0, paperHeight / 2, 0);
  const pos = paperGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / paperHeight;
    pos.setZ(i, 0.05 * Math.sin(Math.PI * t) - 0.04 * t * t * t);
  }
  paperGeo.computeVertexNormals();
  const paperMat = new THREE.MeshStandardMaterial({
    map: paperTex,
    roughness: 0.85,
    metalness: 0,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
    clippingPlanes: [new THREE.Plane(new THREE.Vector3(0, 1, 0), -LID_TOP)],
  });
  const paper = new THREE.Mesh(paperGeo, paperMat);
  const feed = new THREE.Group();
  feed.position.set(0, LID_TOP, SLOT_Z);
  feed.rotation.x = -0.09;
  feed.add(paper);
  model.add(feed);

  const hiddenY = -paperHeight - 0.02;
  const shownY = -0.1;

  // Camera fitted so the finished receipt and the whole printer stay in view.
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const target = new THREE.Vector3();
  const fit = () => {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const top = LID_TOP + paperHeight + shownY + 0.15;
    target.set(0, top / 2 - 0.02, 0);
    const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max(top / 2 / half, 3.3 / 2 / (half * camera.aspect)) * 1.12 + 1;
    const dir = new THREE.Vector3(0.2, 0.42, 1).normalize();
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  };

  // ------------------------------------------------------------ animation
  const startDelay = 0.9;
  const feedTime = 2.4 + paperHeight * 1.1;
  let start = performance.now();
  let frame = 0;
  let tilt = 0;
  let tiltTarget = 0;
  let printed = !animate;

  const pose = (now: number) => {
    const t = (now - start) / 1000 - startDelay;
    const p = printed ? 1 : THREE.MathUtils.clamp(t / feedTime, 0, 1);
    // Thermal printers feed in short bursts: an eased ramp with a small stutter on top.
    const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    const stutter = p > 0 && p < 1 ? Math.sin(t * 38) * 0.006 : 0;
    paper.position.y = hiddenY + (shownY - hiddenY) * eased + stutter;
    const feeding = p > 0 && p < 1;
    model.position.y = feeding ? Math.sin(t * 95) * 0.0025 : 0;
    ledMat.emissive.set(feeding ? 0x60a5fa : 0x34d399);
    ledMat.emissiveIntensity = feeding ? 1.4 + Math.sin(t * 18) : p >= 1 ? 1.6 : 0.4;
    if (p >= 1) printed = true;
    tilt += (tiltTarget - tilt) * 0.08;
    model.rotation.y = tilt;
  };

  const loop = (now: number) => {
    pose(now);
    renderer.render(scene, camera);
    const settling = Math.abs(tiltTarget - tilt) > 0.0005;
    frame = !printed || settling ? requestAnimationFrame(loop) : 0;
  };
  const wake = () => {
    if (!frame) frame = requestAnimationFrame(loop);
  };

  const onPointer = (e: PointerEvent) => {
    if (!animate) return;
    const r = container.getBoundingClientRect();
    tiltTarget = ((e.clientX - r.left) / r.width - 0.5) * 0.35;
    wake();
  };
  const onLeave = () => {
    tiltTarget = 0;
    wake();
  };
  container.addEventListener("pointermove", onPointer);
  container.addEventListener("pointerleave", onLeave);

  const resize = new ResizeObserver(() => {
    fit();
    wake();
  });
  resize.observe(container);
  fit();
  wake();

  return {
    replay() {
      printed = false;
      start = performance.now() - startDelay * 500;
      wake();
    },
    dispose() {
      cancelAnimationFrame(frame);
      resize.disconnect();
      container.removeEventListener("pointermove", onPointer);
      container.removeEventListener("pointerleave", onLeave);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
      paperTex.dispose();
      shadowTex.dispose();
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
