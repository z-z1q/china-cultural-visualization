function bindWhenAvailable(selector, key, init) {
  function tryInit() {
    var el = document.querySelector(selector);
    if (!el) return;
    if (el.dataset && el.dataset[key] === "1") return;
    if (el.dataset) el.dataset[key] = "1";
    init(el);
  }

  tryInit();
  if (document.body) {
    var mo = new MutationObserver(function () {
      tryInit();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }
}

function bindHomeGuqin() {
  var btn = document.getElementById("btn-guqin");
  var audio = document.getElementById("guqin-audio");
  if (!btn || !audio) return;
  if (btn.dataset && btn.dataset.guqinBound === "1") return;
  if (btn.dataset) btn.dataset.guqinBound = "1";
  btn.textContent = "古风";

  function sync() {
    if (audio.paused) btn.classList.remove("is-playing");
    else btn.classList.add("is-playing");
  }

  btn.addEventListener("click", function () {
    playGuqin();
    setTimeout(sync, 0);
  });
  audio.addEventListener("play", sync);
  audio.addEventListener("pause", sync);
  audio.addEventListener("ended", sync);
  sync();
}


function playGuqin() {
  var audio = document.getElementById("guqin-audio");
  if (audio) {
    if (audio.paused) {
      if (audio.dataset) audio.dataset.userPaused = "0";
      audio.play().catch(function (e) {
        console.warn("Audio autoplay blocked:", e);
      });
    } else {
      if (audio.dataset) audio.dataset.userPaused = "1";
      audio.pause();
    }
  }
}

function ensureGuqinAutoplay() {
  var audio = document.getElementById("guqin-audio");
  if (!audio) return;
  if (audio.dataset && audio.dataset.userPaused === "1") return;
  if (audio.dataset && audio.dataset.autoplayTried === "1" && !audio.paused) return;
  if (audio.dataset) audio.dataset.autoplayTried = "1";
  if (!audio.paused) return;
  audio.play().catch(function () {
    try {
      audio.muted = true;
      audio.play().then(function () {
        function unmuteOnce() {
          audio.muted = false;
          document.removeEventListener("pointerdown", unmuteOnce);
          document.removeEventListener("keydown", unmuteOnce);
        }
        document.addEventListener("pointerdown", unmuteOnce);
        document.addEventListener("keydown", unmuteOnce);
      });
    } catch (e) {}
  });
}

function initCountUp() {
  var items = document.querySelectorAll(".count-up");
  if (!items || !items.length) return;

  function animate(el) {
    if (!el) return;
    if (el.dataset && el.dataset.countUpRunning === "1") return;
    if (el.dataset && el.dataset.countUpInit === "1") {
      var text = (el.textContent || "").trim();
      if (text !== "" && text !== "0") return;
    }
    if (el.dataset) el.dataset.countUpInit = "1";
    if (el.dataset) el.dataset.countUpRunning = "1";

    var target = parseFloat(el.getAttribute("data-target") || "0");
    if (!isFinite(target)) target = 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    var start = 0;
    var duration = 900;
    var t0 = performance.now();

    function tick(t) {
      var p = Math.min(1, (t - t0) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      var value = Math.round(start + (target - start) * eased);
      el.textContent = prefix + String(value) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else {
        el.textContent = prefix + String(Math.round(target)) + suffix;
        if (el.dataset) el.dataset.countUpRunning = "0";
      }
    }

    requestAnimationFrame(tick);
  }

  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    items.forEach(function (el) {
      io.observe(el);
    });
  } else {
    items.forEach(function (el) {
      animate(el);
    });
  }
}

function initHomeEffects() {
  bindHomeGuqin();
  initCountUp();
}


function dashAssetUrl(pathInAssets) {
  var cfg = window.__dash_config || window.__dashconfig || {};
  var prefix = cfg.requests_pathname_prefix || cfg.url_base_pathname || "/";
  if (typeof prefix !== "string" || prefix.trim() === "") prefix = "/";
  if (prefix.charAt(0) !== "/") prefix = "/" + prefix;
  if (prefix.charAt(prefix.length - 1) !== "/") prefix = prefix + "/";
  var p = String(pathInAssets || "").replace(/^\/+/, "");
  return prefix + "assets/" + p;
}


function initBuildingGLTF(container, building, fallback) {
  if (!container || !window.THREE || !window.THREE.GLTFLoader) return false;

  var b = building || (container.dataset && container.dataset.building) || "siheyuan";
  var specMap = {
    siheyuan: { gltf: "models/siheyuan/siheyuan.gltf", label: "四合院" },
    huipai: { gltf: "models/huipaiminju/huipaiminju.gltf", label: "徽派民居" },
    tongzhaigulou: { gltf: "models/tongzhaigulou/tongzhaigulou.gltf", label: "桐寨鼓楼" },
    diaojiaolou: { gltf: "models/diaojiaolou/diaojiaolou.gltf", label: "吊脚楼" },
    zhedongtaimen: { gltf: "models/zhedongtaimen/zhedongtaimen.gltf", label: "浙东台门" },
    mulengfang: { gltf: "models/mulengfang/mulengfang.gltf", label: "木楞房" },
    menggubao: { gltf: "models/menggubao/menggubao.gltf", label: "蒙古包" },
  };
  var spec = specMap[b];
  if (!spec) return false;

  container.innerHTML = "";
  if (container.dataset) container.dataset.viewerMode = "gltf";
  var w = container.clientWidth || 640;
  var h = container.clientHeight || 420;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
  camera.position.set(0, 1.9, 5.4);
  camera.lookAt(0, 0, 0);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  if (renderer.outputColorSpace !== undefined && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (renderer.outputEncoding !== undefined && THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (renderer.physicallyCorrectLights !== undefined) renderer.physicallyCorrectLights = true;
  if (renderer.shadowMap) {
    renderer.shadowMap.enabled = true;
    if (THREE.PCFSoftShadowMap) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  if (renderer.toneMapping !== undefined && THREE.ACESFilmicToneMapping !== undefined) renderer.toneMapping = THREE.ACESFilmicToneMapping;
  if (renderer.toneMappingExposure !== undefined) renderer.toneMappingExposure = 1.08;
  renderer.domElement.className = "three-webgl-canvas";
  renderer.domElement.style.touchAction = "none";
  container.appendChild(renderer.domElement);

  var ambient = new THREE.AmbientLight(0xffffff, 0.58);
  var hemi = new THREE.HemisphereLight(0xbfd6ff, 0x8a6a4a, 0.35);
  var dir1 = new THREE.DirectionalLight(0xfff1d6, 1.35);
  var dir2 = new THREE.DirectionalLight(0xb6d0ff, 0.65);
  dir1.position.set(4, 8, 6);
  dir2.position.set(-5, 3, -6);
  dir1.castShadow = true;
  dir2.castShadow = false;
  if (dir1.shadow) {
    dir1.shadow.mapSize.width = 1024;
    dir1.shadow.mapSize.height = 1024;
    if (dir1.shadow.camera) {
      dir1.shadow.camera.near = 0.5;
      dir1.shadow.camera.far = 30;
      dir1.shadow.camera.left = -8;
      dir1.shadow.camera.right = 8;
      dir1.shadow.camera.top = 8;
      dir1.shadow.camera.bottom = -8;
    }
    dir1.shadow.bias = -0.00012;
  }
  scene.add(ambient, hemi, dir1, dir2);

  var root = new THREE.Group();
  scene.add(root);

  var model = null;
  var rotating = false;
  var targetExplode = 0;
  var currentExplode = 0;
  var frame = null;
  var resizeFrame = null;
  var drag = { active: false, x: 0, y: 0 };
  var highlighted = [];
  var allMeshes = [];
  var partGroups = { roof: [], columns: [], beams: [], walls: [], foundation: [] };
  var dock = { active: false, t: 0, prevRotating: false };
  var rotateToZero = false;
  var rotateTargetY = 0;
  var ground = null;
  var home = { camPos: null, lookAt: null, rotY: 0 };
  var loadingEl = null;
  var hintEl = null;
  var lockedPart = null;

  var partMeta = { offsets: {}, colors: {} };
  var partOffsetVecCache = {};
  var highlightGroups = { roof: [], columns: [], beams: [], walls: [], foundation: [] };
  var modelConstraints = { limitedPartSplit: false, explodeDisabled: false, reason: "" };
  var viewState = {
    target: new THREE.Vector3(0, 0, 0),
    minY: 0.7,
    maxY: 3.3,
    minRadius: 2.4,
    maxRadius: 9.2,
  };
  var modelProfile = getBuildingProfile(b);

  function createEmptyPartGroups() {
    return { roof: [], columns: [], beams: [], walls: [], foundation: [] };
  }

  function getPartOrder() {
    return ["foundation", "walls", "columns", "beams", "roof"];
  }

  function getBuildingProfile(buildingId) {
    var base = {
      fitSize: 3.2,
      cameraLift: 0.76,
      cameraDistance: 2.9,
      targetLift: 0.12,
      explodeScale: 1,
      explodeLifts: {
        foundation: 0.0,
        walls: 0.2,
        columns: 0.42,
        beams: 0.7,
        roof: 1.0,
      },
    };
    var overrides = {
      siheyuan: {},
      huipai: { cameraDistance: 2.8 },
      tongzhaigulou: { cameraLift: 0.92, cameraDistance: 2.55 },
      diaojiaolou: { cameraLift: 0.86, cameraDistance: 2.65 },
      zhedongtaimen: { cameraDistance: 2.75 },
      mulengfang: { cameraDistance: 2.85 },
      menggubao: {
        cameraLift: 0.62,
        cameraDistance: 2.45,
        targetLift: 0.08,
      },
    };
    var profile = overrides[buildingId] || {};
    var merged = {
      fitSize: profile.fitSize !== undefined ? profile.fitSize : base.fitSize,
      cameraLift: profile.cameraLift !== undefined ? profile.cameraLift : base.cameraLift,
      cameraDistance: profile.cameraDistance !== undefined ? profile.cameraDistance : base.cameraDistance,
      targetLift: profile.targetLift !== undefined ? profile.targetLift : base.targetLift,
      explodeScale: profile.explodeScale !== undefined ? profile.explodeScale : base.explodeScale,
      explodeLifts: {},
    };
    var ids = getPartOrder();
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      merged.explodeLifts[id] =
        profile.explodeLifts && profile.explodeLifts[id] !== undefined
          ? profile.explodeLifts[id]
          : base.explodeLifts[id];
    }
    return merged;
  }

  function syncCameraLookAt() {
    camera.lookAt(viewState.target);
  }

  function configureViewBounds(target, radius) {
    var safeRadius = Math.max(radius || 1, 0.35);
    viewState.target.copy(target);
    viewState.minRadius = Math.max(1.8, safeRadius * 1.45);
    viewState.maxRadius = Math.max(viewState.minRadius + 1.4, safeRadius * 5.4);
    viewState.minY = target.y - safeRadius * 0.5;
    viewState.maxY = target.y + safeRadius * 1.9;
  }

  function clampCameraPosition() {
    var dz = camera.position.z - viewState.target.z;
    var clampedDz = Math.max(viewState.minRadius, Math.min(viewState.maxRadius, dz));
    camera.position.z = viewState.target.z + clampedDz;
    camera.position.y = Math.max(viewState.minY, Math.min(viewState.maxY, camera.position.y));
  }

  function setPrimaryPart(mesh, partId) {
    if (!mesh || !partGroups[partId]) return;
    partGroups[partId].push(mesh);
    mesh.userData.partId = partId;
  }

  function addHighlightMesh(partId, mesh) {
    if (!mesh || !highlightGroups[partId]) return;
    if (highlightGroups[partId].indexOf(mesh) === -1) highlightGroups[partId].push(mesh);
  }

  function mirrorHighlightGroups() {
    highlightGroups = createEmptyPartGroups();
    Object.keys(partGroups).forEach(function (pid) {
      var group = partGroups[pid] || [];
      for (var i = 0; i < group.length; i++) addHighlightMesh(pid, group[i]);
    });
  }

  function collectMeshMetrics(meshes) {
    return meshes.map(function (mesh) {
      var box = new THREE.Box3().setFromObject(mesh);
      var size = box.getSize(new THREE.Vector3());
      return {
        mesh: mesh,
        box: box,
        midY: (box.min.y + box.max.y) * 0.5,
        height: Math.max(size.y, 0.001),
      };
    });
  }

  function buildPalette() {
    function pick(partId, fallback) {
      var hex = getPartColorHex(partId);
      return hex === null ? fallback : hex;
    }
    var columnsHex = pick("columns", 0x8a5a3a);
    return {
      roof: pick("roof", 0x4a4744),
      columns: columnsHex,
      beams: pick("beams", columnsHex),
      walls: pick("walls", 0xf1e6d3),
      foundation: pick("foundation", 0xb9b1a6),
    };
  }

  function enhanceExistingMaterial(mat, paletteHex, mix) {
    if (!mat) return;
    var mixFactor = mix === undefined ? 0.72 : mix;
    if (mat.color && paletteHex !== null && paletteHex !== undefined) {
      mat.color.lerp(new THREE.Color(paletteHex), mixFactor);
    }
    if (mat.roughness !== undefined) mat.roughness = Math.max(0.35, Math.min(0.92, mat.roughness));
    if (mat.metalness !== undefined) mat.metalness = Math.min(0.12, mat.metalness || 0);
    if (mat.emissive && mat.emissive.setHex) mat.emissive.setHex(0x0f0b08);
    if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = 0.12;
    if (mat.side !== undefined && THREE.DoubleSide !== undefined) mat.side = THREE.DoubleSide;
    mat.needsUpdate = true;
  }

  function applyVertexBandMaterial(mesh, palette) {
    if (!mesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) return false;
    if (!THREE.BufferAttribute || !THREE.MeshStandardMaterial) return false;
    var geom = mesh.geometry;
    if (!mesh.userData.__bandGeometryCloned && geom.clone) {
      geom = geom.clone();
      mesh.geometry = geom;
      mesh.userData.__bandGeometryCloned = true;
    }
    var pos = geom.attributes.position;
    if (!pos || !pos.count) return false;
    var minY = Infinity;
    var maxY = -Infinity;
    for (var i = 0; i < pos.count; i++) {
      var y = pos.getY(i);
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    var range = Math.max(maxY - minY, 0.001);
    var colors = new Float32Array(pos.count * 3);
    var paletteByBand = [
      new THREE.Color(palette.foundation),
      new THREE.Color(palette.walls),
      new THREE.Color(palette.columns),
      new THREE.Color(palette.beams),
      new THREE.Color(palette.roof),
    ];
    for (var pi = 0; pi < pos.count; pi++) {
      var t = (pos.getY(pi) - minY) / range;
      var band = 0;
      if (t > 0.82) band = 4;
      else if (t > 0.66) band = 3;
      else if (t > 0.48) band = 2;
      else if (t > 0.18) band = 1;
      var c = paletteByBand[band];
      colors[pi * 3] = c.r;
      colors[pi * 3 + 1] = c.g;
      colors[pi * 3 + 2] = c.b;
    }
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    if (geom.computeVertexNormals) {
      try {
        geom.computeVertexNormals();
      } catch (e) {}
    }
    var mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.74,
      metalness: 0.06,
      emissive: 0x0f0b08,
      emissiveIntensity: 0.1,
    });
    if (THREE.DoubleSide !== undefined) mat.side = THREE.DoubleSide;
    mesh.material = mat;
    ensureMaterialBase(mesh);
    if (mesh.material) mesh.material.needsUpdate = true;
    return true;
  }

  function parseJSONSafe(raw) {
    if (raw === null || raw === undefined) return null;
    if (typeof raw !== "string") return null;
    var s = raw.trim();
    if (!s) return null;
    try {
      return JSON.parse(s);
    } catch (e) {
      return null;
    }
  }

  function cssColorToHexInt(colorStr) {
    if (!colorStr || typeof colorStr !== "string") return null;
    var s = colorStr.trim();
    if (!s) return null;
    if (s.charAt(0) === "#") {
      var h = s.slice(1);
      if (h.length === 3) {
        h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
      }
      if (h.length === 6 && /^[0-9a-fA-F]+$/.test(h)) return parseInt(h, 16);
      return null;
    }
    var m = s.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i);
    if (m) {
      var r = Math.max(0, Math.min(255, Math.round(parseFloat(m[1]))));
      var g = Math.max(0, Math.min(255, Math.round(parseFloat(m[2]))));
      var b = Math.max(0, Math.min(255, Math.round(parseFloat(m[3]))));
      return (r << 16) | (g << 8) | b;
    }
    return null;
  }

  function refreshPartMeta() {
    partMeta = { offsets: {}, colors: {} };
    partOffsetVecCache = {};
    if (!container || !container.dataset) return;
    var offsets = parseJSONSafe(container.dataset.partOffsets);
    var colors = parseJSONSafe(container.dataset.partColors);
    if (offsets && typeof offsets === "object") partMeta.offsets = offsets;
    if (colors && typeof colors === "object") partMeta.colors = colors;
  }

  function getPartOffsetVec(partId) {
    if (partOffsetVecCache[partId]) return partOffsetVecCache[partId];
    var v = null;
    var raw = partMeta && partMeta.offsets ? partMeta.offsets[partId] : null;
    if (Array.isArray(raw) && raw.length >= 3) {
      var x = +raw[0] || 0;
      var y = +raw[1] || 0;
      var z = +raw[2] || 0;
      if (x !== 0 || y !== 0 || z !== 0) v = new THREE.Vector3(x, y, z);
    }
    partOffsetVecCache[partId] = v;
    return v;
  }

  function getLegendColorHex(partId) {
    var nameEl = document.getElementById("part-" + partId);
    if (!nameEl) return null;
    var item = nameEl.closest ? nameEl.closest(".part-item") : (nameEl.parentNode || null);
    var colorEl = item && item.querySelector ? item.querySelector(".part-color") : null;
    var c = null;
    if (colorEl && colorEl.style && colorEl.style.backgroundColor) c = colorEl.style.backgroundColor;
    if (!c) {
      try {
        c = window.getComputedStyle(colorEl).backgroundColor;
      } catch (e) {}
    }
    return cssColorToHexInt(c);
  }

  function getPartColorHex(partId) {
    var fromCfg = partMeta && partMeta.colors ? partMeta.colors[partId] : null;
    var hex = cssColorToHexInt(fromCfg);
    if (hex !== null) return hex;
    return getLegendColorHex(partId);
  }

  refreshPartMeta();

  function setLegendActive(partId) {
    ["roof", "columns", "beams", "walls", "foundation"].forEach(function (id) {
      var el = document.getElementById("part-" + id);
      if (!el) return;
      if (id === partId) el.classList.add("is-active");
      else el.classList.remove("is-active");
    });
  }

  function ensureMaterialBase(mesh) {
    if (!mesh || !mesh.material) return;
    var mat = mesh.material;
    if (Array.isArray(mat)) {
      if (mesh.userData.__baseEmissiveArr === undefined) {
        mesh.userData.__baseEmissiveArr = mat.map(function (m) {
          return m && m.emissive && m.emissive.getHex ? m.emissive.getHex() : null;
        });
      }
      if (mesh.userData.__baseEmissiveIntensityArr === undefined) {
        mesh.userData.__baseEmissiveIntensityArr = mat.map(function (m) {
          return m && m.emissiveIntensity !== undefined ? m.emissiveIntensity : null;
        });
      }
      if (mesh.userData.__baseColorArr === undefined) {
        mesh.userData.__baseColorArr = mat.map(function (m) {
          return m && m.color && m.color.getHex ? m.color.getHex() : null;
        });
      }
      return;
    }
    if (mat.emissive && mesh.userData.__baseEmissive === undefined) mesh.userData.__baseEmissive = mat.emissive.getHex();
    if (mesh.userData.__baseEmissiveIntensity === undefined && mat.emissiveIntensity !== undefined) mesh.userData.__baseEmissiveIntensity = mat.emissiveIntensity;
    if (mat.color && mesh.userData.__baseColor === undefined) mesh.userData.__baseColor = mat.color.getHex();
  }

  function clearHighlight() {
    highlighted.forEach(function (mesh) {
      if (!mesh || !mesh.material) return;
      ensureMaterialBase(mesh);
      if (Array.isArray(mesh.material)) {
        for (var mi = 0; mi < mesh.material.length; mi++) {
          var m = mesh.material[mi];
          if (!m) continue;
          if (m.emissive && mesh.userData.__baseEmissiveArr && mesh.userData.__baseEmissiveArr[mi] !== null && mesh.userData.__baseEmissiveArr[mi] !== undefined) {
            m.emissive.setHex(mesh.userData.__baseEmissiveArr[mi]);
          }
          if (m.emissiveIntensity !== undefined && mesh.userData.__baseEmissiveIntensityArr && mesh.userData.__baseEmissiveIntensityArr[mi] !== null && mesh.userData.__baseEmissiveIntensityArr[mi] !== undefined) {
            m.emissiveIntensity = mesh.userData.__baseEmissiveIntensityArr[mi];
          }
          if (m.color && mesh.userData.__baseColorArr && mesh.userData.__baseColorArr[mi] !== null && mesh.userData.__baseColorArr[mi] !== undefined) {
            m.color.setHex(mesh.userData.__baseColorArr[mi]);
          }
          m.needsUpdate = true;
        }
        return;
      }
      if (mesh.material.emissive && mesh.userData.__baseEmissive !== undefined) mesh.material.emissive.setHex(mesh.userData.__baseEmissive);
      if (mesh.material.emissiveIntensity !== undefined && mesh.userData.__baseEmissiveIntensity !== undefined) mesh.material.emissiveIntensity = mesh.userData.__baseEmissiveIntensity;
      if (mesh.material.color && mesh.userData.__baseColor !== undefined) mesh.material.color.setHex(mesh.userData.__baseColor);
      mesh.material.needsUpdate = true;
    });
    highlighted = [];
  }

  function setActivePart(partId) {
    setLegendActive(partId || null);
    clearHighlight();
    if (!partId) return;
    var colorHex = getPartColorHex(partId);
    if (colorHex === null) colorHex = 0x6b2e2c;
    var targets = highlightGroups[partId] || [];
    targets.forEach(function (mesh) {
      if (!mesh || !mesh.material) return;
      ensureMaterialBase(mesh);
      if (Array.isArray(mesh.material)) {
        for (var mi = 0; mi < mesh.material.length; mi++) {
          var m = mesh.material[mi];
          if (!m) continue;
          if (m.emissive) m.emissive.setHex(colorHex);
          if (m.emissiveIntensity !== undefined) m.emissiveIntensity = Math.max(m.emissiveIntensity || 0, 1.15);
          if (!m.emissive && m.color) m.color.setHex(colorHex);
          m.needsUpdate = true;
        }
      } else {
        if (mesh.material.emissive) mesh.material.emissive.setHex(colorHex);
        if (mesh.material.emissiveIntensity !== undefined) mesh.material.emissiveIntensity = Math.max(mesh.material.emissiveIntensity || 0, 1.15);
        if (!mesh.material.emissive && mesh.material.color) mesh.material.color.setHex(colorHex);
        mesh.material.needsUpdate = true;
      }
      highlighted.push(mesh);
    });
  }

  function applyExplode(v) {
    if (!model || !allMeshes.length) return;
    for (var ai = 0; ai < allMeshes.length; ai++) {
      var baseMesh = allMeshes[ai];
      if (!baseMesh.userData.basePos) baseMesh.userData.basePos = baseMesh.position.clone();
      if (!baseMesh.userData.baseRot) baseMesh.userData.baseRot = baseMesh.rotation.clone();
    }
    if (modelConstraints.explodeDisabled) {
      for (var ri = 0; ri < allMeshes.length; ri++) {
        var resetMesh = allMeshes[ri];
        if (resetMesh.userData.basePos) resetMesh.position.copy(resetMesh.userData.basePos);
      }
      return;
    }
    var order = getPartOrder();
    for (var gi = 0; gi < order.length; gi++) {
      var id = order[gi];
      var group = partGroups[id] || [];
      if (!group.length) continue;
      var liftY = ((modelProfile.explodeLifts[id] || 0) * modelProfile.explodeScale) * v;
      var partOffset = getPartOffsetVec(id);
      var ox = 0;
      var oz = 0;
      if (partOffset) {
        ox = partOffset.x * 0.18 * v;
        oz = partOffset.z * 0.18 * v;
        if (partOffset.y > 0) liftY += partOffset.y * 0.12 * v;
      }
      for (var mi = 0; mi < group.length; mi++) {
        var mesh = group[mi];
        mesh.position.x = mesh.userData.basePos.x + ox;
        mesh.position.y = mesh.userData.basePos.y + liftY;
        mesh.position.z = mesh.userData.basePos.z + oz;
      }
    }
  }

  function splitPartGroups() {
    partGroups = createEmptyPartGroups();
    highlightGroups = createEmptyPartGroups();
    modelConstraints = { limitedPartSplit: false, explodeDisabled: false, reason: "" };
    if (!model) return;
    var meshes = [];
    model.traverse(function (obj) {
      if (obj && obj.isMesh) meshes.push(obj);
    });
    if (!meshes.length) return;
    allMeshes = meshes.slice(0);
    if (b === "huipai") {
      if (!splitMeshesByVerticalBands(meshes)) {
        splitBySpatialPosition(meshes);
        if (!hasAllPartGroups()) splitMeshesByVerticalBands(meshes);
      }
    } else if (b === "mulengfang") {
      if (!splitMeshesByVerticalBands(meshes, ["roof", "walls"])) {
        if (meshes.length === 1) splitSingleMeshModel(meshes);
        else splitSmallModelGroups(meshes);
      }
    } else if (meshes.length <= 5) {
      if (!splitMeshesByVerticalBands(meshes)) {
        if (meshes.length === 1) splitSingleMeshModel(meshes);
        else splitSmallModelGroups(meshes);
      }
    } else {
      splitBySpatialPosition(meshes);
      if (!hasAllPartGroups()) splitMeshesByVerticalBands(meshes);
    }
    mirrorHighlightGroups();
  }

  function hasRequiredPartGroups(groups, requiredIds) {
    var g = groups || partGroups;
    var ids = requiredIds && requiredIds.length ? requiredIds : ["roof", "columns", "beams", "walls", "foundation"];
    for (var i = 0; i < ids.length; i++) {
      if (!g[ids[i]] || !g[ids[i]].length) return false;
    }
    return true;
  }

  function hasAllPartGroups(groups) {
    return hasRequiredPartGroups(groups, null);
  }

  function getBandIdByT(t) {
    var band = 0;
    if (t > 0.82) band = 4;
    else if (t > 0.66) band = 3;
    else if (t > 0.48) band = 2;
    else if (t > 0.18) band = 1;
    var ids = ["foundation", "walls", "columns", "beams", "roof"];
    return ids[band] || "walls";
  }

  function splitMeshesByVerticalBands(meshes, requiredIds) {
    if (!model || !meshes || !meshes.length) return false;
    var bakedList = [];
    var minY = Infinity;
    var maxY = -Infinity;
    for (var bi = 0; bi < meshes.length; bi++) {
      var bm = bakeMeshToModelSpace(meshes[bi]);
      if (!bm || !bm.geometry || !bm.geometry.attributes || !bm.geometry.attributes.position) continue;
      bakedList.push({ src: meshes[bi], baked: bm });
      var g = bm.geometry;
      if (!g.boundingBox && g.computeBoundingBox) {
        try {
          g.computeBoundingBox();
        } catch (e) {}
      }
      if (g.boundingBox) {
        minY = Math.min(minY, g.boundingBox.min.y);
        maxY = Math.max(maxY, g.boundingBox.max.y);
      } else {
        var pos = g.attributes.position;
        for (var vi = 0; vi < pos.count; vi++) {
          var y = pos.getY(vi);
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    var range = maxY - minY;
    if (!isFinite(range) || range <= 0) range = 1;

    function pickByCuts(t, cuts) {
      if (!cuts || cuts.length < 4) return getBandIdByT(t);
      var band = 0;
      if (t > cuts[3]) band = 4;
      else if (t > cuts[2]) band = 3;
      else if (t > cuts[1]) band = 2;
      else if (t > cuts[0]) band = 1;
      var ids = ["foundation", "walls", "columns", "beams", "roof"];
      return ids[band] || "walls";
    }

    function buildAdaptiveCuts() {
      var samples = [];
      for (var si = 0; si < bakedList.length; si++) {
        var g = bakedList[si].baked.geometry;
        var pos = g && g.attributes ? g.attributes.position : null;
        if (!pos || !pos.count) continue;
        var step = Math.max(1, Math.floor(pos.count / 1800));
        for (var vi = 0; vi < pos.count; vi += step) samples.push((pos.getY(vi) - minY) / range);
      }
      if (samples.length < 20) return null;
      samples.sort(function (a, b) {
        return a - b;
      });
      function q(p) {
        var idx = Math.max(0, Math.min(samples.length - 1, Math.floor(p * (samples.length - 1))));
        return samples[idx];
      }
      var cuts = [q(0.2), q(0.4), q(0.6), q(0.8)];
      if (!(cuts[0] < cuts[1] && cuts[1] < cuts[2] && cuts[2] < cuts[3])) return null;
      return cuts;
    }

    function attempt(cuts, reason) {
      var nextPartGroups = createEmptyPartGroups();
      var createdMeshes = [];
      var createdRecords = [];
      var picker = cuts ? function (t) { return pickByCuts(t, cuts); } : null;
      for (var i = 0; i < bakedList.length; i++) {
        var mesh = bakedList[i].baked;
        var created = splitMeshByBands(mesh, minY, range, picker);
        if (!created || !created.length) continue;
        for (var ci = 0; ci < created.length; ci++) {
          var item = created[ci];
          if (!item || !item.mesh || !item.partId) continue;
          if (!nextPartGroups[item.partId]) nextPartGroups[item.partId] = [];
          nextPartGroups[item.partId].push(item.mesh);
          item.mesh.userData.partId = item.partId;
          try {
            (item.parent || model).add(item.mesh);
          } catch (e) {}
          createdMeshes.push(item.mesh);
          createdRecords.push({ mesh: item.mesh, parent: item.parent || model });
        }
      }
      var ok = createdMeshes.length > 0 && hasRequiredPartGroups(nextPartGroups, requiredIds);
      if (!ok) {
        for (var ri = 0; ri < createdRecords.length; ri++) {
          var rec = createdRecords[ri];
          if (!rec || !rec.mesh || !rec.parent) continue;
          try {
            rec.parent.remove(rec.mesh);
          } catch (e2) {}
        }
        return false;
      }
      for (var hi = 0; hi < meshes.length; hi++) {
        try {
          meshes[hi].visible = false;
        } catch (e3) {}
      }
      partGroups = nextPartGroups;
      allMeshes = createdMeshes;
      modelConstraints.limitedPartSplit = true;
      modelConstraints.explodeDisabled = false;
      modelConstraints.reason = reason;
      return true;
    }

    if (attempt(null, "band-split")) return true;
    var cuts = buildAdaptiveCuts();
    if (cuts && attempt(cuts, "band-split-adaptive")) return true;
    return false;
  }

  function splitMeshByBands(mesh, minY, range, picker) {
    if (!mesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) return null;
    var baked = bakeMeshToModelSpace(mesh);
    if (!baked || !baked.geometry || !baked.geometry.attributes || !baked.geometry.attributes.position) return null;
    var geom = baked.geometry;
    if (Array.isArray(baked.material) && geom.groups && geom.groups.length) {
      return splitMultiMaterialMeshByGroups(baked, minY, range, picker);
    }
    return splitSingleMaterialMeshByTriangles(baked, minY, range, picker);
  }

  function bakeMeshToModelSpace(mesh) {
    if (mesh && mesh.__bakedToModelSpace === 1) return mesh;
    if (!mesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) return null;
    if (!model || !THREE || !THREE.Matrix4) return null;
    try {
      if (model.updateMatrixWorld) model.updateMatrixWorld(true);
      if (mesh.updateMatrixWorld) mesh.updateMatrixWorld(true);
    } catch (e) {}
    var invModel = new THREE.Matrix4();
    try {
      invModel.copy(model.matrixWorld);
      if (invModel.invert) invModel.invert();
      else if (invModel.getInverse) invModel.getInverse(model.matrixWorld);
    } catch (e2) {
      return null;
    }
    var toModel = new THREE.Matrix4();
    try {
      if (toModel.multiplyMatrices) toModel.multiplyMatrices(invModel, mesh.matrixWorld);
      else {
        toModel.copy(invModel);
        toModel.multiply(mesh.matrixWorld);
      }
    } catch (e3) {
      return null;
    }
    var geom = mesh.geometry;
    if (!geom || !geom.clone || !geom.applyMatrix4) return null;
    var bakedGeom = geom.clone();
    try {
      bakedGeom.applyMatrix4(toModel);
    } catch (e4) {}
    var baked = {
      geometry: bakedGeom,
      material: mesh.material,
      name: mesh.name,
      castShadow: !!mesh.castShadow,
      receiveShadow: !!mesh.receiveShadow,
      userData: mesh.userData,
    };
    baked.__bakedToModelSpace = 1;
    return baked;
  }

  function splitMultiMaterialMeshByGroups(mesh, minY, range, picker) {
    var geom = mesh.geometry;
    var pos = geom.attributes.position;
    var idxAttr = geom.index || null;
    var indexArray = idxAttr ? idxAttr.array : null;
    if (!indexArray && !(geom.groups && geom.groups.length)) return null;

    if (b === "huipai" && indexArray && indexArray.length && geom.groups && geom.groups.length) {
      var byPartIdx = { foundation: {}, walls: {}, columns: {}, beams: {}, roof: {} };
      for (var gi = 0; gi < geom.groups.length; gi++) {
        var grp0 = geom.groups[gi];
        if (!grp0 || !isFinite(grp0.start) || !isFinite(grp0.count) || grp0.count <= 0) continue;
        var mIdx = grp0.materialIndex || 0;
        var end0 = grp0.start + grp0.count;
        for (var si0 = grp0.start; si0 + 2 < end0; si0 += 3) {
          var a0 = indexArray[si0], b0 = indexArray[si0 + 1], c0 = indexArray[si0 + 2];
          if (a0 === undefined || b0 === undefined || c0 === undefined) continue;
          var cy0 = (pos.getY(a0) + pos.getY(b0) + pos.getY(c0)) / 3;
          var t0 = (cy0 - minY) / range;
          var pid0 = picker ? picker(t0) : getBandIdByT(t0);
          var bag = byPartIdx[pid0] || byPartIdx.walls;
          if (!bag[mIdx]) bag[mIdx] = [];
          bag[mIdx].push(a0, b0, c0);
        }
      }
      var created0 = [];
      var ids0 = ["foundation", "walls", "columns", "beams", "roof"];
      for (var pi0 = 0; pi0 < ids0.length; pi0++) {
        var partId0 = ids0[pi0];
        var matMap0 = byPartIdx[partId0];
        if (!matMap0) continue;
        var materialKeys = Object.keys(matMap0);
        if (!materialKeys.length) continue;
        materialKeys.sort(function (a, b) {
          return Number(a) - Number(b);
        });
        var indices0 = [];
        var newGroups0 = [];
        var offset0 = 0;
        for (var k0 = 0; k0 < materialKeys.length; k0++) {
          var mk0 = materialKeys[k0];
          var arr0 = matMap0[mk0];
          if (!arr0 || !arr0.length) continue;
          for (var ii0 = 0; ii0 < arr0.length; ii0++) indices0.push(arr0[ii0]);
          newGroups0.push({ start: offset0, count: arr0.length, materialIndex: Number(mk0) || 0 });
          offset0 += arr0.length;
        }
        if (!indices0.length) continue;
        var newGeom0 = new THREE.BufferGeometry();
        Object.keys(geom.attributes).forEach(function (k) {
          newGeom0.setAttribute(k, geom.attributes[k]);
        });
        newGeom0.setIndex(indices0);
        newGeom0.clearGroups();
        for (var ggi0 = 0; ggi0 < newGroups0.length; ggi0++) {
          var ng0 = newGroups0[ggi0];
          newGeom0.addGroup(ng0.start, ng0.count, ng0.materialIndex);
        }
        var nm0 = cloneMeshShell(mesh, newGeom0, partId0);
        created0.push({ partId: partId0, mesh: nm0.mesh, parent: nm0.parent });
      }
      return created0;
    }

    var byPart = { foundation: [], walls: [], columns: [], beams: [], roof: [] };
    for (var gi = 0; gi < geom.groups.length; gi++) {
      var g = geom.groups[gi];
      if (!g || !isFinite(g.start) || !isFinite(g.count) || g.count <= 0) continue;
      var sampleY = 0;
      var sampleN = 0;
      var step = 3;
      var maxSample = Math.min(g.count, 120);
      if (indexArray) {
        for (var si = 0; si < maxSample; si += step) {
          var ii = g.start + si;
          var vi = indexArray[ii];
          if (vi === undefined) continue;
          sampleY += pos.getY(vi);
          sampleN++;
        }
      } else {
        for (var sj = 0; sj < maxSample; sj += step) {
          var vj = g.start + sj;
          if (vj >= pos.count) break;
          sampleY += pos.getY(vj);
          sampleN++;
        }
      }
      var midY = sampleN ? sampleY / sampleN : 0;
      var t = (midY - minY) / range;
      var partId = picker ? picker(t) : getBandIdByT(t);
      byPart[partId].push(g);
    }

    var created = [];
    var ids = ["foundation", "walls", "columns", "beams", "roof"];
    for (var pi = 0; pi < ids.length; pi++) {
      var partId2 = ids[pi];
      var groups = byPart[partId2] || [];
      if (!groups.length) continue;
      var newGeom = new THREE.BufferGeometry();
      Object.keys(geom.attributes).forEach(function (k) {
        newGeom.setAttribute(k, geom.attributes[k]);
      });
      var newGroups = [];
      var indices = [];
      var offset = 0;
      if (indexArray) {
        for (var kgi = 0; kgi < groups.length; kgi++) {
          var grp = groups[kgi];
          var slice = Array.prototype.slice.call(indexArray, grp.start, grp.start + grp.count);
          for (var si2 = 0; si2 < slice.length; si2++) indices.push(slice[si2]);
          newGroups.push({ start: offset, count: grp.count, materialIndex: grp.materialIndex || 0 });
          offset += grp.count;
        }
        newGeom.setIndex(indices);
      } else {
        var attrs = {};
        var keys = Object.keys(geom.attributes);
        for (var kk = 0; kk < keys.length; kk++) {
          var key = keys[kk];
          var attr = geom.attributes[key];
          if (!attr || !attr.array) continue;
          attrs[key] = [];
        }
        for (var gg = 0; gg < groups.length; gg++) {
          var grp2 = groups[gg];
          var start = grp2.start;
          var count = grp2.count;
          for (var key2 in attrs) {
            var a2 = geom.attributes[key2];
            var itemSize = a2.itemSize || 3;
            var base = start * itemSize;
            var end = (start + count) * itemSize;
            var arr = a2.array;
            for (var ai = base; ai < end; ai++) attrs[key2].push(arr[ai]);
          }
          newGroups.push({ start: offset, count: count, materialIndex: grp2.materialIndex || 0 });
          offset += count;
        }
        for (var key3 in attrs) {
          var a3 = geom.attributes[key3];
          var ctor = a3.array && a3.array.constructor ? a3.array.constructor : Float32Array;
          newGeom.setAttribute(key3, new THREE.BufferAttribute(new ctor(attrs[key3]), a3.itemSize || 3, a3.normalized));
        }
      }
      newGeom.clearGroups();
      for (var ggi = 0; ggi < newGroups.length; ggi++) {
        var ng = newGroups[ggi];
        newGeom.addGroup(ng.start, ng.count, ng.materialIndex);
      }
      var nm = cloneMeshShell(mesh, newGeom, partId2);
      created.push({ partId: partId2, mesh: nm.mesh, parent: nm.parent });
    }
    return created;
  }

  function splitSingleMaterialMeshByTriangles(mesh, minY, range, picker) {
    var geom = mesh.geometry;
    var pos = geom.attributes.position;
    var norm = geom.attributes.normal || null;
    var uv = geom.attributes.uv || null;
    var col = geom.attributes.color || null;
    var idx = geom.index ? geom.index.array : null;
    var byPart = {
      foundation: { p: [], n: [], u: [], c: [] },
      walls: { p: [], n: [], u: [], c: [] },
      columns: { p: [], n: [], u: [], c: [] },
      beams: { p: [], n: [], u: [], c: [] },
      roof: { p: [], n: [], u: [], c: [] },
    };

    function pushVertex(bucket, vi) {
      bucket.p.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
      if (norm) bucket.n.push(norm.getX(vi), norm.getY(vi), norm.getZ(vi));
      if (uv) bucket.u.push(uv.getX(vi), uv.getY(vi));
      if (col) bucket.c.push(col.getX(vi), col.getY(vi), col.getZ(vi));
    }

    var triCount = 0;
    if (idx && idx.length) {
      for (var i = 0; i + 2 < idx.length; i += 3) {
        var a = idx[i], b = idx[i + 1], c = idx[i + 2];
        var cy = (pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3;
        var t = (cy - minY) / range;
        var partId = picker ? picker(t) : getBandIdByT(t);
        var bucket = byPart[partId] || byPart.walls;
        pushVertex(bucket, a);
        pushVertex(bucket, b);
        pushVertex(bucket, c);
        triCount++;
      }
    } else {
      for (var j = 0; j + 2 < pos.count; j += 3) {
        var cy2 = (pos.getY(j) + pos.getY(j + 1) + pos.getY(j + 2)) / 3;
        var t2 = (cy2 - minY) / range;
        var partId2 = picker ? picker(t2) : getBandIdByT(t2);
        var bucket2 = byPart[partId2] || byPart.walls;
        pushVertex(bucket2, j);
        pushVertex(bucket2, j + 1);
        pushVertex(bucket2, j + 2);
        triCount++;
      }
    }
    if (!triCount) return null;

    var created = [];
    ["foundation", "walls", "columns", "beams", "roof"].forEach(function (partId3) {
      var bucket3 = byPart[partId3];
      if (!bucket3 || bucket3.p.length < 9) return;
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(bucket3.p), 3));
      if (bucket3.n.length) g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(bucket3.n), 3));
      if (bucket3.u.length) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(bucket3.u), 2));
      if (bucket3.c.length) g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(bucket3.c), 3));
      if (!bucket3.n.length && g.computeVertexNormals) {
        try {
          g.computeVertexNormals();
        } catch (e) {}
      }
      var nm = cloneMeshShell(mesh, g, partId3);
      created.push({ partId: partId3, mesh: nm.mesh, parent: nm.parent });
    });
    return created;
  }

  function cloneMeshShell(srcMesh, geometry, partId) {
    var parent = model;
    var nm = new THREE.Mesh(geometry, srcMesh.material);
    nm.name = (srcMesh.name || "mesh") + "__" + partId;
    if (nm.position && nm.position.set) nm.position.set(0, 0, 0);
    if (nm.rotation && nm.rotation.set) nm.rotation.set(0, 0, 0);
    if (nm.scale && nm.scale.set) nm.scale.set(1, 1, 1);
    nm.matrixAutoUpdate = true;
    nm.castShadow = !!srcMesh.castShadow;
    nm.receiveShadow = !!srcMesh.receiveShadow;
    nm.frustumCulled = false;
    nm.visible = true;
    nm.userData = nm.userData || {};
    if (srcMesh.userData) {
      for (var k in srcMesh.userData) nm.userData[k] = srcMesh.userData[k];
    }
    nm.userData.partId = partId;
    return { mesh: nm, parent: parent };
  }

  function splitSingleMeshModel(meshes) {
    var mesh = meshes[0];
    modelConstraints.limitedPartSplit = true;
    modelConstraints.explodeDisabled = true;
    modelConstraints.reason = "single-mesh";
    setPrimaryPart(mesh, "walls");
    ["roof", "columns", "beams", "walls", "foundation"].forEach(function (id) {
      addHighlightMesh(id, mesh);
    });
  }

  function splitSmallModelGroups(meshes) {
    var metrics = collectMeshMetrics(meshes).sort(function (a, b) {
      return a.midY - b.midY;
    });
    modelConstraints.limitedPartSplit = true;
    modelConstraints.reason = "low-mesh-count";
    if (metrics.length === 2) {
      setPrimaryPart(metrics[0].mesh, "walls");
      setPrimaryPart(metrics[1].mesh, "roof");
      ["foundation", "walls", "columns", "beams"].forEach(function (id) {
        addHighlightMesh(id, metrics[0].mesh);
      });
      addHighlightMesh("roof", metrics[1].mesh);
      return;
    }
    var mapByCount = {
      3: ["foundation", "walls", "roof"],
      4: ["foundation", "walls", "columns", "roof"],
      5: ["foundation", "walls", "columns", "beams", "roof"],
    };
    var ids = mapByCount[metrics.length] || ["foundation", "walls", "columns", "beams", "roof"];
    for (var i = 0; i < metrics.length; i++) {
      setPrimaryPart(metrics[i].mesh, ids[i] || ids[ids.length - 1]);
    }
  }

  function splitBySpatialPosition(meshes) {
    var metrics = collectMeshMetrics(meshes).sort(function (a, b) {
      return a.midY - b.midY;
    });
    var minH = metrics[0].midY;
    var maxH = metrics[metrics.length - 1].midY;
    var range = maxH - minH || 1;
    for (var i = 0; i < metrics.length; i++) {
      var item = metrics[i];
      var normY = (item.midY - minH) / range;
      var id = "walls";
      if (i === 0 || normY <= 0.08) id = "foundation";
      else if (i === metrics.length - 1 || normY >= 0.84) id = "roof";
      else if (normY >= 0.68) id = "beams";
      else if (normY >= 0.44) id = "columns";
      else if (normY >= 0.2) id = "walls";
      else id = "foundation";
      setPrimaryPart(item.mesh, id);
    }
  }

  function applyRealisticMaterials() {
    if (!model || !allMeshes.length) return;
    var useStandard = !!THREE.MeshStandardMaterial;
    var MatCtor = useStandard ? THREE.MeshStandardMaterial : THREE.MeshLambertMaterial;
    var palette = buildPalette();
    var templates = {
      roof: new MatCtor({ color: palette.roof, roughness: 0.84, metalness: 0.08 }),
      columns: new MatCtor({ color: palette.columns, roughness: 0.56, metalness: 0.1 }),
      beams: new MatCtor({ color: palette.beams, roughness: 0.6, metalness: 0.08 }),
      walls: new MatCtor({ color: palette.walls, roughness: 0.82, metalness: 0.02 }),
      foundation: new MatCtor({ color: palette.foundation, roughness: 0.88, metalness: 0.01 }),
    };
    function isMeaningfulTexture(tex) {
      if (!tex) return false;
      var img = tex.image || (tex.source && tex.source.data) || null;
      if (img && img.width !== undefined && img.height !== undefined) {
        if (img.width <= 1 && img.height <= 1) return false;
      }
      return true;
    }
    function matHasDetail(m) {
      if (!m) return false;
      if (isMeaningfulTexture(m.map)) return true;
      if (isMeaningfulTexture(m.normalMap)) return true;
      if (isMeaningfulTexture(m.roughnessMap)) return true;
      if (isMeaningfulTexture(m.metalnessMap)) return true;
      if (isMeaningfulTexture(m.emissiveMap)) return true;
      if (isMeaningfulTexture(m.aoMap)) return true;
      return false;
    }

    allMeshes.forEach(function (mesh) {
      if (!mesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (mesh.geometry && !mesh.geometry.attributes.normal && mesh.geometry.computeVertexNormals) {
        try {
          mesh.geometry.computeVertexNormals();
        } catch (e) {}
      }
    });

    if (modelConstraints.reason === "single-mesh") {
      applyVertexBandMaterial(allMeshes[0], palette);
      return;
    }

    Object.keys(partGroups).forEach(function (pid) {
      var group = partGroups[pid] || [];
      var tpl = templates[pid] || templates.walls;
      for (var i = 0; i < group.length; i++) {
        var mesh = group[i];
        if (!mesh) continue;
        var srcMat = mesh.material;
        var hasDetail = false;
        if (srcMat) {
          if (Array.isArray(srcMat)) {
            for (var mi = 0; mi < srcMat.length; mi++) {
              var sm = srcMat[mi];
              if (!sm) continue;
              if (matHasDetail(sm)) {
                hasDetail = true;
                break;
              }
            }
          } else {
            if (matHasDetail(srcMat)) hasDetail = true;
          }
        }

        var mat = null;
        if (hasDetail && modelConstraints.limitedPartSplit) {
          mat = srcMat;
          if (Array.isArray(mat)) {
            for (var si = 0; si < mat.length; si++) enhanceExistingMaterial(mat[si], palette[pid], 0.68);
          } else {
            enhanceExistingMaterial(mat, palette[pid], 0.68);
          }
        } else if (hasDetail) {
          mat = srcMat;
          if (Array.isArray(mat)) {
            for (var di = 0; di < mat.length; di++) enhanceExistingMaterial(mat[di], palette[pid], 0.8);
          } else {
            enhanceExistingMaterial(mat, palette[pid], 0.8);
          }
        }
        else mat = tpl.clone ? tpl.clone() : new MatCtor({ color: tpl.color ? tpl.color.getHex() : 0xf1e6d3 });
        if (THREE.DoubleSide !== undefined) mat.side = THREE.DoubleSide;
        if (mat.transparent !== undefined) mat.transparent = false;
        if (mat.opacity !== undefined) mat.opacity = 1;
        if (useStandard) {
          if (mat.emissive) mat.emissive.setHex(0x0f0b08);
          if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = 0.12;
        }
        mesh.material = mat;
        ensureMaterialBase(mesh);
        if (mesh.material) mesh.material.needsUpdate = true;
      }
    });
  }

  function applyDockEffect(v) {
    if (!dock.active || !model || !allMeshes.length) return;
    var enter = Math.max(0, Math.min(1, (0.2 - v) / 0.2));
    if (enter > 0) dock.t = Math.min(1, dock.t + 0.038 * enter);
    var strength = (1 - dock.t) * Math.max(0, Math.min(1, (0.12 - v) / 0.12));
    if (strength <= 0) return;

    var pulse = Math.sin(dock.t * Math.PI * 6) * 0.5 + 0.5;
    var a = strength * (0.25 + 0.75 * pulse);

    for (var i = 0; i < allMeshes.length; i++) {
      var mesh = allMeshes[i];
      if (!mesh || !mesh.material || highlighted.indexOf(mesh) !== -1) continue;
      ensureMaterialBase(mesh);
      if (mesh.material.emissive) mesh.material.emissive.setHex(0x6b2e2c);
      if (mesh.material.emissiveIntensity !== undefined && mesh.userData.__baseEmissiveIntensity !== undefined) {
        mesh.material.emissiveIntensity = mesh.userData.__baseEmissiveIntensity + 1.25 * a;
      }
      mesh.material.needsUpdate = true;
      if (!mesh.userData.basePos) mesh.userData.basePos = mesh.position.clone();
      mesh.position.y += Math.sin(dock.t * Math.PI * 10) * 0.015 * a;
    }
  }

  function endDockEffect() {
    if (!dock.active) return;
    dock.active = false;
    dock.t = 0;
    if (dock.prevRotating) {
      dock.prevRotating = false;
      rotating = true;
      var rotateBtn = document.getElementById("btn-rotate");
      if (rotateBtn) rotateBtn.classList.add("is-active");
    }
    for (var i = 0; i < allMeshes.length; i++) {
      var mesh = allMeshes[i];
      if (!mesh || !mesh.material || highlighted.indexOf(mesh) !== -1) continue;
      ensureMaterialBase(mesh);
      if (mesh.material.emissive && mesh.userData.__baseEmissive !== undefined) mesh.material.emissive.setHex(mesh.userData.__baseEmissive);
      if (mesh.material.emissiveIntensity !== undefined && mesh.userData.__baseEmissiveIntensity !== undefined) mesh.material.emissiveIntensity = mesh.userData.__baseEmissiveIntensity;
      if (mesh.userData.basePos) mesh.position.copy(mesh.userData.basePos);
      mesh.material.needsUpdate = true;
    }
  }

  function normalizeAngle(a) {
    a = (a + Math.PI) % (Math.PI * 2);
    if (a < 0) a += Math.PI * 2;
    return a - Math.PI;
  }

  function lerpAngle(from, to, t) {
    var delta = normalizeAngle(to - from);
    return from + delta * t;
  }

  function render() {
    renderer.render(scene, camera);
  }

  function tick() {
    if (!document.body.contains(container)) {
      cleanup();
      return;
    }
    currentExplode += (targetExplode - currentExplode) * 0.1;
    if (Math.abs(targetExplode - currentExplode) < 0.001) currentExplode = targetExplode;
    applyExplode(currentExplode);
    if (model && rotating) model.rotation.y += 0.01;
    if (model && rotateToZero) {
      model.rotation.y = lerpAngle(model.rotation.y, rotateTargetY, 0.12);
      if (Math.abs(normalizeAngle(rotateTargetY - model.rotation.y)) < 0.002) rotateToZero = false;
    }
    applyDockEffect(currentExplode);
    if (dock.active && dock.t >= 1) endDockEffect();
    render();
    frame = requestAnimationFrame(tick);
  }

  function bindControls() {
    var explodeBtn = document.getElementById("btn-explode");
    var collapseBtn = document.getElementById("btn-collapse");
    var rotateBtn = document.getElementById("btn-rotate");
    var resetBtn = document.getElementById("btn-reset");
    var fullscreenBtn = document.getElementById("btn-fullscreen");

    window.__three3dState = {
      setExploded: function (v) {
        if (v) {
          if (dock.active) endDockEffect();
          rotateToZero = false;
        }
        if (!v && targetExplode > 0.5) {
          dock.active = true;
          dock.t = 0;
          dock.prevRotating = !!rotating;
          if (dock.prevRotating) {
            rotating = false;
            if (rotateBtn) rotateBtn.classList.remove("is-active");
          }
          rotateToZero = true;
          rotateTargetY = 0;
        }
        targetExplode = v ? 1 : 0;
      },
      toggleRotate: function () {
        rotating = !rotating;
        if (rotateBtn) {
          if (rotating) rotateBtn.classList.add("is-active");
          else rotateBtn.classList.remove("is-active");
        }
      },
      resetView: function () {
        if (dock.active) endDockEffect();
        rotating = false;
        if (rotateBtn) rotateBtn.classList.remove("is-active");
        rotateToZero = false;
        targetExplode = 0;
        currentExplode = 0;
        lockedPart = null;
        clearHighlight();
        setLegendActive(null);
        if (model) model.rotation.y = home.rotY || 0;
        if (home.camPos) camera.position.copy(home.camPos);
        if (home.lookAt) camera.lookAt(home.lookAt);
        render();
      },
      toggleFullscreen: function () {
        var host = null;
        if (container && container.closest) host = container.closest(".model-viewer");
        if (!host) host = container;
        if (!document.fullscreenElement) {
          if (host && host.requestFullscreen) host.requestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
        }
      },
      setActivePart: setActivePart,
    };

    if (explodeBtn) {
      explodeBtn.onclick = function () {
        if (window.__three3dState) window.__three3dState.setExploded(true);
      };
    }
    if (collapseBtn) {
      collapseBtn.onclick = function () {
        if (window.__three3dState) window.__three3dState.setExploded(false);
      };
    }
    if (rotateBtn) {
      rotateBtn.onclick = function () {
        if (window.__three3dState) window.__three3dState.toggleRotate();
      };
    }
    if (resetBtn) {
      resetBtn.onclick = function () {
        if (window.__three3dState) window.__three3dState.resetView();
      };
    }
    if (fullscreenBtn) {
      fullscreenBtn.onclick = function () {
        if (window.__three3dState) window.__three3dState.toggleFullscreen();
      };
    }

    ["roof", "columns", "beams", "walls", "foundation"].forEach(function (id) {
      var el = document.getElementById("part-" + id);
      if (!el) return;
      el.onmouseenter = function () {
        if (lockedPart) return;
        if (window.__three3dState) window.__three3dState.setActivePart(id);
      };
      el.onmouseleave = function () {
        if (lockedPart) return;
        if (window.__three3dState) window.__three3dState.setActivePart(null);
      };
      el.onclick = function (e) {
        if (e && e.preventDefault) e.preventDefault();
        if (lockedPart === id) {
          lockedPart = null;
          if (window.__three3dState) window.__three3dState.setActivePart(null);
        } else {
          lockedPart = id;
          if (window.__three3dState) window.__three3dState.setActivePart(id);
        }
      };
    });
  }

  function bindMouseDrag() {
    renderer.domElement.addEventListener("pointerdown", function (e) {
      drag.active = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    });
    renderer.domElement.addEventListener("pointermove", function (e) {
      if (!drag.active || !model) return;
      var dx = e.clientX - drag.x;
      var dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      model.rotation.y += dx * 0.006;
      camera.position.y -= dy * 0.004;
      clampCameraPosition();
      syncCameraLookAt();
    });
    renderer.domElement.addEventListener("pointerup", function () {
      drag.active = false;
    });
    renderer.domElement.addEventListener("pointercancel", function () {
      drag.active = false;
    });
    renderer.domElement.addEventListener("dblclick", function () {
      if (window.__three3dState) window.__three3dState.resetView();
    });
    renderer.domElement.addEventListener("wheel", function (e) {
      e.preventDefault();
      var z = camera.position.z + e.deltaY * 0.004;
      camera.position.z = z;
      clampCameraPosition();
      syncCameraLookAt();
    }, { passive: false });
  }

  function cleanup() {
    if (frame) cancelAnimationFrame(frame);
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    if (ro) ro.disconnect();
    if (window.__three3dState) window.__three3dState = null;
    try {
      if (loadingEl && loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
    } catch (e) {}
    try {
      if (hintEl && hintEl.parentNode) hintEl.parentNode.removeChild(hintEl);
    } catch (e) {}
    loadingEl = null;
    hintEl = null;
    try {
      if (ground) scene.remove(ground);
    } catch (e) {}
    ground = null;
    try {
      if (root) scene.remove(root);
    } catch (e) {}
    try {
      var disposedGeoms = [];
      var disposedMats = [];
      var disposedTex = [];
      function seen(list, item) {
        return list.indexOf(item) !== -1;
      }
      function track(list, item) {
        if (!item) return;
        if (!seen(list, item)) list.push(item);
      }
      function collectMaterial(m) {
        if (!m) return;
        if (Array.isArray(m)) {
          for (var i = 0; i < m.length; i++) collectMaterial(m[i]);
          return;
        }
        track(disposedMats, m);
        ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap", "alphaMap", "envMap"].forEach(function (k) {
          if (m[k]) track(disposedTex, m[k]);
        });
      }
      if (root && root.traverse) {
        root.traverse(function (obj) {
          if (!obj) return;
          if (obj.isMesh) {
            if (obj.geometry) track(disposedGeoms, obj.geometry);
            if (obj.material) collectMaterial(obj.material);
          }
        });
      }
      for (var gi = 0; gi < disposedGeoms.length; gi++) {
        try {
          disposedGeoms[gi].dispose();
        } catch (e) {}
      }
      for (var ti = 0; ti < disposedTex.length; ti++) {
        try {
          disposedTex[ti].dispose();
        } catch (e) {}
      }
      for (var mi = 0; mi < disposedMats.length; mi++) {
        try {
          disposedMats[mi].dispose();
        } catch (e) {}
      }
    } catch (e) {}
    try {
      renderer.dispose();
    } catch (e) {}
    try {
      if (renderer.forceContextLoss) renderer.forceContextLoss();
    } catch (e) {}
    try {
      if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    } catch (e) {}
    try {
      if (placeholderURL && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(placeholderURL);
    } catch (e) {}
    placeholderURL = null;
    try {
      if (restoreCreateImageBitmap) restoreCreateImageBitmap();
    } catch (e) {}
  }

  var ro = new ResizeObserver(function () {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(function () {
      var rw = container.clientWidth || 640;
      var rh = container.clientHeight || 420;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh, false);
      render();
    });
  });
  ro.observe(container);

  bindControls();
  bindMouseDrag();

  hintEl = document.createElement("div");
  hintEl.className = "three-hint";
  hintEl.textContent = "拖拽旋转 · 滚轮/触控板缩放 · 双击重置";
  container.appendChild(hintEl);

  loadingEl = document.createElement("div");
  loadingEl.style.position = "absolute";
  loadingEl.style.left = "50%";
  loadingEl.style.top = "50%";
  loadingEl.style.transform = "translate(-50%, -50%)";
  loadingEl.style.padding = "8px 10px";
  loadingEl.style.borderRadius = "10px";
  loadingEl.style.background = "rgba(255,255,255,0.75)";
  loadingEl.style.color = "rgba(43,41,38,0.8)";
  loadingEl.style.fontSize = "13px";
  loadingEl.style.backdropFilter = "blur(6px)";
  loadingEl.textContent = (spec.label || "模型") + "加载中…";
  container.appendChild(loadingEl);

  var manager = new THREE.LoadingManager();
  var placeholderURL = null;
  placeholderURL = (function () {
    try {
      var b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6oJ3cAAAAASUVORK5CYII=";
      var bin = atob(b64);
      var arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      var blob = new Blob([arr], { type: "image/png" });
      return URL.createObjectURL(blob);
    } catch (e) {
      return null;
    }
  })();
  manager.setURLModifier(function (url) {
    if (typeof url !== "string") return url;
    var clean = url.split("?")[0].toLowerCase();
    if (clean.endsWith(".bin") || clean.endsWith(".gltf") || clean.endsWith(".glb")) return url;
    if (placeholderURL && (clean.endsWith(".png") || clean.endsWith(".jpg") || clean.endsWith(".jpeg") || clean.endsWith(".webp"))) {
      return placeholderURL;
    }
    return url;
  });

  var loader = new THREE.GLTFLoader(manager);
  var prevCreateImageBitmap = null;
  var restoreCreateImageBitmap = function () {};
  try {
    prevCreateImageBitmap = window.createImageBitmap;
    window.createImageBitmap = undefined;
    restoreCreateImageBitmap = function () {
      try {
        window.createImageBitmap = prevCreateImageBitmap;
      } catch (e) {}
    };
  } catch (e) {}
  loader.load(
    dashAssetUrl(spec.gltf),
    function (gltf) {
      restoreCreateImageBitmap();
      if (loadingEl && loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
      loadingEl = null;
      model = gltf.scene || gltf.scenes[0];
      if (!model) return;
      root.add(model);
      model.visible = true;
      model.traverse(function (obj) {
        if (!obj) return;
        if (obj.layers && obj.layers.set) obj.layers.set(0);
        if (obj.isMesh) {
          obj.visible = true;
          obj.frustumCulled = false;
        }
      });
      if (model.updateMatrixWorld) model.updateMatrixWorld(true);

      var box = new THREE.Box3().setFromObject(model);
      var center = box.getCenter(new THREE.Vector3());
      var size = box.getSize(new THREE.Vector3());
      var maxSize = Math.max(size.x, size.y, size.z) || 1;
      var scale = modelProfile.fitSize / maxSize;
      if (scale < 0.02) scale = 0.02;
      model.position.sub(center);
      model.scale.setScalar(scale);
      if (model.updateMatrixWorld) model.updateMatrixWorld(true);

      var sphere = new THREE.Sphere();
      box = new THREE.Box3().setFromObject(model);
      box.getBoundingSphere(sphere);
      var r = sphere.radius || 1;
      var cx = sphere.center ? sphere.center.x : 0;
      var cy = sphere.center ? sphere.center.y : 0;
      var cz = sphere.center ? sphere.center.z : 0;
      camera.far = Math.max(camera.far || 100, r * 10);
      camera.updateProjectionMatrix();
      var target = new THREE.Vector3(cx, cy + r * modelProfile.targetLift, cz);
      configureViewBounds(target, r);
      camera.position.set(cx, cy + r * modelProfile.cameraLift, cz + r * modelProfile.cameraDistance);
      clampCameraPosition();
      syncCameraLookAt();
      home.camPos = camera.position.clone();
      home.lookAt = target.clone();
      home.rotY = 0;

      splitPartGroups();
      applyRealisticMaterials();

      if (renderer.shadowMap && renderer.shadowMap.enabled && THREE.PlaneGeometry && THREE.ShadowMaterial) {
        try {
          if (ground) scene.remove(ground);
          var gbox = new THREE.Box3().setFromObject(model);
          var minY = gbox.min.y;
          var geom = new THREE.PlaneGeometry(24, 24);
          var mat = new THREE.ShadowMaterial({ opacity: 0.16 });
          ground = new THREE.Mesh(geom, mat);
          ground.rotation.x = -Math.PI / 2;
          ground.position.y = minY - 0.02;
          ground.receiveShadow = true;
          scene.add(ground);
        } catch (e) {}
      }

      render();
    },
    undefined,
    function (err) {
      console.warn("Failed to load glTF:", spec.gltf, err);
      restoreCreateImageBitmap();
      cleanup();
      if (loadingEl && loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
      loadingEl = null;
      if (typeof fallback === "function") fallback();
      else {
        var tip = document.createElement("div");
        tip.style.position = "absolute";
        tip.style.left = "50%";
        tip.style.top = "50%";
        tip.style.transform = "translate(-50%, -50%)";
        tip.style.fontSize = "13px";
        tip.style.color = "rgba(43,41,38,0.75)";
        tip.textContent = (spec.label || "模型") + "加载失败，请检查模型资源路径。";
        container.appendChild(tip);
      }
    }
  );

  container.__viewerCleanup = cleanup;
  tick();
  return true;
}


function initExplodedViewSVG(container) {
  if (!container) return;
  if (container.dataset) container.dataset.viewerMode = "svg";
  if (window.__three3dState) window.__three3dState = null;

  var exploded = false;
  var rotating = false;
  var rotationAngle = 0;
  var activePart = null;

  var animFrame = null;
  var tweenFrame = null;
  var sizeFrame = null;
  var buildingMo = null;
  var ro = null;

  var currentOffset = { roof: 0, columns: 0, beams: 0, walls: 0, foundation: 0 };
  var targetOffset = { roof: 0, columns: 0, beams: 0, walls: 0, foundation: 0 };
  function getBuilding() {
    return (container.dataset && container.dataset.building) ? container.dataset.building : "siheyuan";
  }

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  function setActivePart(partId) {
    activePart = partId;
    var ids = ["roof", "columns", "beams", "walls", "foundation"];
    ids.forEach(function (id) {
      var el = document.getElementById("part-" + id);
      if (!el) return;
      if (id === activePart) el.classList.add("is-active");
      else el.classList.remove("is-active");
    });
    drawScene();
  }

  function buildSVG(w, h) {
    container.innerHTML = "";
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.style.display = "block";
    svg.style.position = "relative";
    svg.style.zIndex = "1";

    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    function addShadow(id, dy, blur, opacity) {
      var f = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      f.setAttribute("id", id);
      f.setAttribute("x", "-30%");
      f.setAttribute("y", "-30%");
      f.setAttribute("width", "160%");
      f.setAttribute("height", "160%");

      var fe1 = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
      fe1.setAttribute("in", "SourceAlpha");
      fe1.setAttribute("stdDeviation", String(blur));

      var fe2 = document.createElementNS("http://www.w3.org/2000/svg", "feOffset");
      fe2.setAttribute("dx", "0");
      fe2.setAttribute("dy", String(dy));
      fe2.setAttribute("result", "off");

      var fe3 = document.createElementNS("http://www.w3.org/2000/svg", "feComponentTransfer");
      var feA = document.createElementNS("http://www.w3.org/2000/svg", "feFuncA");
      feA.setAttribute("type", "linear");
      feA.setAttribute("slope", String(opacity));
      fe3.appendChild(feA);

      var fe4 = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
      var m1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
      m1.setAttribute("in", "off");
      var m2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
      m2.setAttribute("in", "SourceGraphic");
      fe4.appendChild(m1);
      fe4.appendChild(m2);

      f.appendChild(fe1);
      f.appendChild(fe2);
      f.appendChild(fe3);
      f.appendChild(fe4);
      defs.appendChild(f);
    }

    function addGradient(id, c1, c2) {
      var lg = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
      lg.setAttribute("id", id);
      lg.setAttribute("x1", "0%");
      lg.setAttribute("y1", "0%");
      lg.setAttribute("x2", "0%");
      lg.setAttribute("y2", "100%");
      var s1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      s1.setAttribute("offset", "0%");
      s1.setAttribute("stop-color", c1);
      var s2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      s2.setAttribute("offset", "100%");
      s2.setAttribute("stop-color", c2);
      lg.appendChild(s1);
      lg.appendChild(s2);
      defs.appendChild(lg);
    }

    addShadow("softShadow", 10, 12, 0.22);
    addShadow("tightShadow", 6, 6, 0.18);
    addGradient("gRoof", "#C44C44", "#7E1B1C");
    addGradient("gColumns", "#E1A06F", "#B55D2C");
    addGradient("gBeams", "#7E91A6", "#445363");
    addGradient("gWalls", "#69A98A", "#2F6A52");
    addGradient("gFoundation", "#9B8867", "#5C4A33");

    svg.appendChild(defs);

    var bg = document.createElementNS("http://www.w3.org/2000/svg", "g");
    bg.setAttribute("opacity", "0.55");
    for (var i = 0; i <= 10; i++) {
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "0");
      line.setAttribute("x2", String(w));
      line.setAttribute("y1", String((h * i) / 10));
      line.setAttribute("y2", String((h * i) / 10));
      line.setAttribute("stroke", "rgba(92,107,122,0.10)");
      line.setAttribute("stroke-width", "1");
      bg.appendChild(line);
    }
    svg.appendChild(bg);

    var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("id", "model-root");
    group.setAttribute("transform-origin", "50% 50%");
    svg.appendChild(group);

    var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("id", "model-hint");
    label.setAttribute("x", String(w / 2));
    label.setAttribute("y", String(h - 18));
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", "rgba(43,41,38,0.72)");
    label.setAttribute("font-size", "12");
    label.setAttribute("font-family", "Noto Sans SC, sans-serif");
    label.textContent = "悬停部件查看名称 · 使用按钮拆解/组装/旋转";
    svg.appendChild(label);

    container.appendChild(svg);
    return svg;
  }

  function drawParts(svg, w, h) {
    var group = svg.querySelector("#model-root");
    if (!group) return;

    var cx = w / 2;
    var cy = h / 2 - 6;
    group.setAttribute("transform", "rotate(" + rotationAngle + "," + cx + "," + cy + ")");

    group.innerHTML = "";

    function partGroup(id) {
      var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("data-part", id);
      g.style.cursor = "pointer";
      g.addEventListener("mouseenter", function () {
        setActivePart(id);
      });
      g.addEventListener("mouseleave", function () {
        setActivePart(null);
      });
      return g;
    }

    var glow = activePart ? "tightShadow" : "softShadow";
    var highlight = function (id) {
      return activePart === id ? 1 : 0.82;
    };
    function syncHint(buildingKey) {
      var hint = svg.querySelector("#model-hint");
      if (!hint) return;
      hint.textContent = activePart
        ? ({ roof: "屋顶", columns: "立柱", beams: "梁架", walls: "墙体", foundation: "台基" }[activePart] || "")
        : (({ siheyuan: "四合院", huipai: "徽派民居", diaojiaolou: "吊脚楼" }[buildingKey] || "建筑") + " · 悬停部件查看名称 · 使用按钮拆解/组装/旋转");
    }

    var roofY = cy - 110 + currentOffset.roof;
    var wallsY = cy - 18 + currentOffset.walls;
    var beamsY = cy - 52 + currentOffset.beams;
    var colsY = cy + 14 + currentOffset.columns;
    var baseY = cy + 98 + currentOffset.foundation;

    var b = getBuilding();
    if (b === "diaojiaolou") {
      var gRoof = partGroup("roof");
      var roof = document.createElementNS("http://www.w3.org/2000/svg", "path");
      var rw = 236;
      var rh = 66;
      roof.setAttribute(
        "d",
        "M " + (cx - rw / 2) + " " + (roofY + rh) +
          " L " + (cx - 30) + " " + (roofY + 10) +
          " L " + cx + " " + roofY +
          " L " + (cx + 30) + " " + (roofY + 10) +
          " L " + (cx + rw / 2) + " " + (roofY + rh) +
          " L " + (cx + rw / 2 - 22) + " " + (roofY + rh) +
          " L " + cx + " " + (roofY + 22) +
          " L " + (cx - rw / 2 + 22) + " " + (roofY + rh) +
          " Z"
      );
      roof.setAttribute("fill", "url(#gRoof)");
      roof.setAttribute("filter", "url(#" + glow + ")");
      roof.setAttribute("opacity", String(highlight("roof")));
      gRoof.appendChild(roof);
      group.appendChild(gRoof);

      var gBeams = partGroup("beams");
      var deck = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      deck.setAttribute("x", String(cx - 170));
      deck.setAttribute("y", String(beamsY + 34));
      deck.setAttribute("width", "340");
      deck.setAttribute("height", "18");
      deck.setAttribute("rx", "9");
      deck.setAttribute("fill", "url(#gBeams)");
      deck.setAttribute("filter", "url(#tightShadow)");
      deck.setAttribute("opacity", String(highlight("beams")));
      gBeams.appendChild(deck);
      group.appendChild(gBeams);

      var gWalls = partGroup("walls");
      var body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      body.setAttribute("x", String(cx - 140));
      body.setAttribute("y", String(wallsY + 18));
      body.setAttribute("width", "280");
      body.setAttribute("height", "98");
      body.setAttribute("rx", "14");
      body.setAttribute("fill", "url(#gWalls)");
      body.setAttribute("filter", "url(#softShadow)");
      body.setAttribute("opacity", String(highlight("walls")));
      gWalls.appendChild(body);

      var winX = [cx - 92, cx - 20, cx + 52];
      winX.forEach(function (x) {
        var w1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        w1.setAttribute("x", String(x));
        w1.setAttribute("y", String(wallsY + 42));
        w1.setAttribute("width", "44");
        w1.setAttribute("height", "34");
        w1.setAttribute("rx", "8");
        w1.setAttribute("fill", "rgba(245,240,230,0.22)");
        gWalls.appendChild(w1);
      });
      group.appendChild(gWalls);

      var gCols = partGroup("columns");
      var colX = [cx - 150, cx - 90, cx - 30, cx + 30, cx + 90, cx + 150];
      colX.forEach(function (x) {
        var c = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        c.setAttribute("x", String(x - 8));
        c.setAttribute("y", String(colsY + 48));
        c.setAttribute("width", "16");
        c.setAttribute("height", "150");
        c.setAttribute("rx", "8");
        c.setAttribute("fill", "url(#gColumns)");
        c.setAttribute("filter", "url(#tightShadow)");
        c.setAttribute("opacity", String(highlight("columns")));
        gCols.appendChild(c);
      });
      group.appendChild(gCols);

      var gBase = partGroup("foundation");
      var base = document.createElementNS("http://www.w3.org/2000/svg", "path");
      base.setAttribute(
        "d",
        "M " + (cx - 240) + " " + (baseY + 44) +
          " L " + (cx - 204) + " " + baseY +
          " L " + (cx + 204) + " " + baseY +
          " L " + (cx + 240) + " " + (baseY + 44) +
          " L " + (cx + 204) + " " + (baseY + 70) +
          " L " + (cx - 204) + " " + (baseY + 70) +
          " Z"
      );
      base.setAttribute("fill", "url(#gFoundation)");
      base.setAttribute("filter", "url(#softShadow)");
      base.setAttribute("opacity", String(highlight("foundation")));
      gBase.appendChild(base);
      group.appendChild(gBase);
      syncHint(b);
      return;
    }

    if (b === "huipai") {
      var gRoof = partGroup("roof");
      var roof = document.createElementNS("http://www.w3.org/2000/svg", "path");
      var rw = 250;
      var rh = 66;
      roof.setAttribute(
        "d",
        "M " + (cx - rw / 2) + " " + (roofY + rh) +
          " L " + (cx - 12) + " " + (roofY + 12) +
          " L " + cx + " " + roofY +
          " L " + (cx + 12) + " " + (roofY + 12) +
          " L " + (cx + rw / 2) + " " + (roofY + rh) +
          " L " + (cx + rw / 2 - 24) + " " + (roofY + rh) +
          " L " + cx + " " + (roofY + 22) +
          " L " + (cx - rw / 2 + 24) + " " + (roofY + rh) +
          " Z"
      );
      roof.setAttribute("fill", "url(#gRoof)");
      roof.setAttribute("filter", "url(#" + glow + ")");
      roof.setAttribute("opacity", String(highlight("roof")));
      gRoof.appendChild(roof);
      group.appendChild(gRoof);

      var gBeams = partGroup("beams");
      var beam = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      beam.setAttribute("x", String(cx - 170));
      beam.setAttribute("y", String(beamsY + 8));
      beam.setAttribute("width", "340");
      beam.setAttribute("height", "20");
      beam.setAttribute("rx", "8");
      beam.setAttribute("fill", "url(#gBeams)");
      beam.setAttribute("filter", "url(#tightShadow)");
      beam.setAttribute("opacity", String(highlight("beams")));
      gBeams.appendChild(beam);
      group.appendChild(gBeams);

      var gWalls = partGroup("walls");
      var body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      body.setAttribute("x", String(cx - 162));
      body.setAttribute("y", String(wallsY - 8));
      body.setAttribute("width", "324");
      body.setAttribute("height", "136");
      body.setAttribute("rx", "16");
      body.setAttribute("fill", "url(#gWalls)");
      body.setAttribute("filter", "url(#softShadow)");
      body.setAttribute("opacity", String(highlight("walls")));
      gWalls.appendChild(body);

      var gableL = document.createElementNS("http://www.w3.org/2000/svg", "path");
      gableL.setAttribute(
        "d",
        "M " + (cx - 162) + " " + (wallsY - 8) +
          " L " + (cx - 162) + " " + (wallsY - 56) +
          " L " + (cx - 144) + " " + (wallsY - 56) +
          " L " + (cx - 144) + " " + (wallsY - 34) +
          " L " + (cx - 126) + " " + (wallsY - 34) +
          " L " + (cx - 126) + " " + (wallsY - 8) +
          " Z"
      );
      gableL.setAttribute("fill", "url(#gWalls)");
      gableL.setAttribute("opacity", String(highlight("walls")));
      gWalls.appendChild(gableL);

      var gableR = document.createElementNS("http://www.w3.org/2000/svg", "path");
      gableR.setAttribute(
        "d",
        "M " + (cx + 162) + " " + (wallsY - 8) +
          " L " + (cx + 162) + " " + (wallsY - 56) +
          " L " + (cx + 144) + " " + (wallsY - 56) +
          " L " + (cx + 144) + " " + (wallsY - 34) +
          " L " + (cx + 126) + " " + (wallsY - 34) +
          " L " + (cx + 126) + " " + (wallsY - 8) +
          " Z"
      );
      gableR.setAttribute("fill", "url(#gWalls)");
      gableR.setAttribute("opacity", String(highlight("walls")));
      gWalls.appendChild(gableR);
      group.appendChild(gWalls);

      var gCols = partGroup("columns");
      var colX = [cx - 96, cx - 32, cx + 32, cx + 96];
      colX.forEach(function (x) {
        var c = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        c.setAttribute("x", String(x - 10));
        c.setAttribute("y", String(colsY + 14));
        c.setAttribute("width", "20");
        c.setAttribute("height", "110");
        c.setAttribute("rx", "10");
        c.setAttribute("fill", "url(#gColumns)");
        c.setAttribute("filter", "url(#tightShadow)");
        c.setAttribute("opacity", String(highlight("columns")));
        gCols.appendChild(c);
      });
      group.appendChild(gCols);

      var gBase = partGroup("foundation");
      var base = document.createElementNS("http://www.w3.org/2000/svg", "path");
      base.setAttribute(
        "d",
        "M " + (cx - 220) + " " + (baseY + 26) +
          " L " + (cx - 192) + " " + baseY +
          " L " + (cx + 192) + " " + baseY +
          " L " + (cx + 220) + " " + (baseY + 26) +
          " L " + (cx + 192) + " " + (baseY + 52) +
          " L " + (cx - 192) + " " + (baseY + 52) +
          " Z"
      );
      base.setAttribute("fill", "url(#gFoundation)");
      base.setAttribute("filter", "url(#softShadow)");
      base.setAttribute("opacity", String(highlight("foundation")));
      gBase.appendChild(base);
      group.appendChild(gBase);
      syncHint(b);
      return;
    }

    var gRoof = partGroup("roof");
    var roof = document.createElementNS("http://www.w3.org/2000/svg", "path");
    var rw = 260;
    var rh = 70;
    roof.setAttribute(
      "d",
      "M " + (cx - rw / 2) + " " + (roofY + rh) +
        " L " + cx + " " + roofY +
        " L " + (cx + rw / 2) + " " + (roofY + rh) +
        " L " + (cx + rw / 2 - 28) + " " + (roofY + rh) +
        " L " + cx + " " + (roofY + 18) +
        " L " + (cx - rw / 2 + 28) + " " + (roofY + rh) +
        " Z"
    );
    roof.setAttribute("fill", "url(#gRoof)");
    roof.setAttribute("filter", "url(#" + glow + ")");
    roof.setAttribute("opacity", String(highlight("roof")));
    gRoof.appendChild(roof);
    group.appendChild(gRoof);

    var gBeams = partGroup("beams");
    var beam = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    beam.setAttribute("x", String(cx - 176));
    beam.setAttribute("y", String(beamsY));
    beam.setAttribute("width", "352");
    beam.setAttribute("height", "22");
    beam.setAttribute("rx", "8");
    beam.setAttribute("fill", "url(#gBeams)");
    beam.setAttribute("filter", "url(#tightShadow)");
    beam.setAttribute("opacity", String(highlight("beams")));
    gBeams.appendChild(beam);
    group.appendChild(gBeams);

    var gWalls = partGroup("walls");
    var body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    body.setAttribute("x", String(cx - 160));
    body.setAttribute("y", String(wallsY));
    body.setAttribute("width", "320");
    body.setAttribute("height", "120");
    body.setAttribute("rx", "16");
    body.setAttribute("fill", "url(#gWalls)");
    body.setAttribute("filter", "url(#softShadow)");
    body.setAttribute("opacity", String(highlight("walls")));
    gWalls.appendChild(body);

    var door = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    door.setAttribute("x", String(cx - 22));
    door.setAttribute("y", String(wallsY + 44));
    door.setAttribute("width", "44");
    door.setAttribute("height", "76");
    door.setAttribute("rx", "10");
    door.setAttribute("fill", "rgba(245,240,230,0.25)");
    gWalls.appendChild(door);
    group.appendChild(gWalls);

    var gCols = partGroup("columns");
    var colX = [cx - 120, cx - 60, cx, cx + 60, cx + 120];
    colX.forEach(function (x) {
      var c = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      c.setAttribute("x", String(x - 10));
      c.setAttribute("y", String(colsY));
      c.setAttribute("width", "20");
      c.setAttribute("height", "110");
      c.setAttribute("rx", "10");
      c.setAttribute("fill", "url(#gColumns)");
      c.setAttribute("filter", "url(#tightShadow)");
      c.setAttribute("opacity", String(highlight("columns")));
      gCols.appendChild(c);
    });
    group.appendChild(gCols);

    var gBase = partGroup("foundation");
    var base = document.createElementNS("http://www.w3.org/2000/svg", "path");
    base.setAttribute(
      "d",
      "M " + (cx - 220) + " " + (baseY + 26) +
        " L " + (cx - 190) + " " + baseY +
        " L " + (cx + 190) + " " + baseY +
        " L " + (cx + 220) + " " + (baseY + 26) +
        " L " + (cx + 190) + " " + (baseY + 52) +
        " L " + (cx - 190) + " " + (baseY + 52) +
        " Z"
    );
    base.setAttribute("fill", "url(#gFoundation)");
    base.setAttribute("filter", "url(#softShadow)");
    base.setAttribute("opacity", String(highlight("foundation")));
    gBase.appendChild(base);
    group.appendChild(gBase);

    syncHint(b);
  }

  function drawScene() {
    if (!document.body.contains(container)) {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (tweenFrame) cancelAnimationFrame(tweenFrame);
      if (sizeFrame) cancelAnimationFrame(sizeFrame);
      return;
    }

    var w = container.clientWidth || 640;
    var h = container.clientHeight || 420;
    var svg = container.querySelector("svg");
    if (!svg || svg.getAttribute("width") !== String(w) || svg.getAttribute("height") !== String(h)) {
      svg = buildSVG(w, h);
    }
    drawParts(svg, w, h);
  }

  function tweenToTargets(durationMs) {
    if (tweenFrame) cancelAnimationFrame(tweenFrame);
    var start = performance.now();
    var startOffset = {
      roof: currentOffset.roof,
      columns: currentOffset.columns,
      beams: currentOffset.beams,
      walls: currentOffset.walls,
      foundation: currentOffset.foundation,
    };

    function step(t) {
      if (!document.body.contains(container)) return;
      var p = Math.min(1, (t - start) / durationMs);
      var k = easeOutCubic(p);
      Object.keys(currentOffset).forEach(function (id) {
        currentOffset[id] = startOffset[id] + (targetOffset[id] - startOffset[id]) * k;
      });
      drawScene();
      if (p < 1) tweenFrame = requestAnimationFrame(step);
    }
    tweenFrame = requestAnimationFrame(step);
  }

  function setExploded(next) {
    exploded = next;
    targetOffset = next
      ? { roof: -52, columns: -18, beams: 6, walls: 28, foundation: 52 }
      : { roof: 0, columns: 0, beams: 0, walls: 0, foundation: 0 };
    tweenToTargets(520);
  }

  function resetViewerState() {
    exploded = false;
    activePart = null;
    rotationAngle = 0;
    if (animFrame) cancelAnimationFrame(animFrame);
    if (tweenFrame) cancelAnimationFrame(tweenFrame);
    if (rotating) {
      rotating = false;
      var rotateBtn = document.getElementById("btn-rotate");
      if (rotateBtn) rotateBtn.classList.remove("is-active");
    }
    targetOffset = { roof: 0, columns: 0, beams: 0, walls: 0, foundation: 0 };
    Object.keys(currentOffset).forEach(function (id) {
      currentOffset[id] = 0;
    });
  }

  if (window.MutationObserver) {
    buildingMo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === "attributes" && m.attributeName === "data-building") {
          resetViewerState();
          drawScene();
          break;
        }
      }
    });
    buildingMo.observe(container, { attributes: true, attributeFilter: ["data-building"] });
  }

  function animateRotation() {
    if (!rotating) return;
    rotationAngle = (rotationAngle + 0.35) % 360;
    drawScene();
    animFrame = requestAnimationFrame(animateRotation);
  }

  function bindControls() {
    var explodeBtn = document.getElementById("btn-explode");
    var collapseBtn = document.getElementById("btn-collapse");
    var rotateBtn = document.getElementById("btn-rotate");

    if (explodeBtn) {
      if (!(explodeBtn.dataset && explodeBtn.dataset.explodeBound === "1")) {
        if (explodeBtn.dataset) explodeBtn.dataset.explodeBound = "1";
        explodeBtn.addEventListener("click", function () {
          setExploded(true);
        });
      }
    }
    if (collapseBtn) {
      if (!(collapseBtn.dataset && collapseBtn.dataset.collapseBound === "1")) {
        if (collapseBtn.dataset) collapseBtn.dataset.collapseBound = "1";
        collapseBtn.addEventListener("click", function () {
          setExploded(false);
        });
      }
    }
    if (rotateBtn) {
      if (!(rotateBtn.dataset && rotateBtn.dataset.rotateBound === "1")) {
        if (rotateBtn.dataset) rotateBtn.dataset.rotateBound = "1";
        rotateBtn.addEventListener("click", function () {
          rotating = !rotating;
          if (rotating) rotateBtn.classList.add("is-active");
          else rotateBtn.classList.remove("is-active");
          if (rotating) animateRotation();
          else if (animFrame) cancelAnimationFrame(animFrame);
        });
      }
    }

    var ids = ["roof", "columns", "beams", "walls", "foundation"];
    ids.forEach(function (id) {
      var el = document.getElementById("part-" + id);
      if (!el) return;
      el.addEventListener("mouseenter", function () {
        setActivePart(id);
      });
      el.addEventListener("mouseleave", function () {
        setActivePart(null);
      });
    });
  }

  bindControls();
  setExploded(false);
  drawScene();

  ro = new ResizeObserver(function () {
    if (sizeFrame) cancelAnimationFrame(sizeFrame);
    sizeFrame = requestAnimationFrame(drawScene);
  });
  ro.observe(container);

  container.__viewerCleanup = function () {
    if (animFrame) cancelAnimationFrame(animFrame);
    if (tweenFrame) cancelAnimationFrame(tweenFrame);
    if (sizeFrame) cancelAnimationFrame(sizeFrame);
    if (ro) ro.disconnect();
    if (buildingMo) buildingMo.disconnect();
  };
}


function bindBuildingDropdownShield() {
  if (!document.body) return;
  if (document.body.dataset && document.body.dataset.dropdownShield === "1") return;
  if (document.body.dataset) document.body.dataset.dropdownShield = "1";

  function setOpen(on) {
    if (!document.body) return;
    if (on) document.body.classList.add("dropdown-open");
    else document.body.classList.remove("dropdown-open");
  }

  function isInDropdownTarget(t) {
    if (!t || !t.closest) return false;
    if (t.closest(".building-toolbar")) return true;
    if (t.closest(".Select-menu-outer")) return true;
    if (t.closest(".Select")) return true;
    return false;
  }

  document.addEventListener("mousedown", function (e) {
    setOpen(isInDropdownTarget(e && e.target));
  }, true);
  document.addEventListener("touchstart", function (e) {
    setOpen(isInDropdownTarget(e && e.target));
  }, true);
  document.addEventListener("keydown", function (e) {
    if (!e) return;
    if (e.key === "Escape") setOpen(false);
  }, true);
}

function initExplodedView() {
  bindBuildingDropdownShield();
  var container = document.getElementById("three-container");
  if (!container) return;

  function mount() {
    if (!document.body.contains(container)) return;
    if (typeof container.__viewerCleanup === "function") {
      try {
        container.__viewerCleanup();
      } catch (e) {}
      container.__viewerCleanup = null;
    }
    var b = (container.dataset && container.dataset.building) ? container.dataset.building : "siheyuan";
    if (
      b === "siheyuan" ||
      b === "huipai" ||
      b === "tongzhaigulou" ||
      b === "diaojiaolou" ||
      b === "zhedongtaimen" ||
      b === "mulengfang" ||
      b === "menggubao"
    ) {
      if (!(window.THREE && window.THREE.GLTFLoader)) {
        container.innerHTML = "";
        var tip = document.createElement("div");
        tip.style.position = "absolute";
        tip.style.left = "50%";
        tip.style.top = "50%";
        tip.style.transform = "translate(-50%, -50%)";
        tip.style.fontSize = "13px";
        tip.style.color = "rgba(43,41,38,0.75)";
        tip.textContent = "3D 渲染库未加载，请刷新页面重试。";
        container.appendChild(tip);
        return;
      }
      initBuildingGLTF(container, b, null);
      return;
    }
    initExplodedViewSVG(container);
  }

  if (!(container.dataset && container.dataset.viewerInit === "1")) {
    if (container.dataset) container.dataset.viewerInit = "1";
    if (window.MutationObserver) {
      container.__threeModeMo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var m = muts[i];
          if (m.type === "attributes" && m.attributeName === "data-building") {
            mount();
            break;
          }
        }
      });
      container.__threeModeMo.observe(container, { attributes: true, attributeFilter: ["data-building"] });
    }
  }

  mount();
}

document.addEventListener("DOMContentLoaded", function () {
  initHomeEffects();
  initExplodedView();
});

bindWhenAvailable(".home-page", "homeInit", function () {
  initHomeEffects();
});

bindWhenAvailable("#three-container", "threeInit", function () {
  initExplodedView();
});

if (window.setInterval) {
  (function () {
    var lastPath = location.pathname;
    setInterval(function () {
      var p = location.pathname;
      if (p === lastPath) return;
      lastPath = p;
      if (p === "/") initHomeEffects();
    }, 400);
  })();
}
