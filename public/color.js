// ====================
// GAMMA
// ====================

function gammaInverse(x) {
  return x <= 0.04045
    ? x / 12.92
    : Math.pow((x + 0.055) / 1.055, 2.4);
}

function gammaForward(x) {
  return x <= 0.0031308
    ? 12.92 * x
    : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

// ====================
// LAB base functions
// ====================

function f(t) {
  return t > 0.008856
    ? Math.cbrt(t)
    : 7.787 * t + 16 / 116;
}

function fInv(t) {
  return t > 0.206893
    ? t * t * t
    : (t - 16 / 116) / 7.787;
}

// ====================
// White point D65 (NORMED)
// ====================

const whitePoint = {
  X: 0.95047,
  Y: 1.00000,
  Z: 1.08883
};

// ====================
// RGB → XYZ
// ====================

function rgbToXyz(r, g, b) {
  let R = gammaInverse(r / 255);
  let G = gammaInverse(g / 255);
  let B = gammaInverse(b / 255);

  const X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  const Y = R * 0.2126729 + G * 0.7151522 + B * 0.0721750;
  const Z = R * 0.0193339 + G * 0.1191920 + B * 0.9503041;

  return { X, Y, Z };
}

// ====================
// XYZ → RGB
// ====================

function xyzToRgb(X, Y, Z) {
  let R =  3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
  let G = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
  let B =  0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;

  R = gammaForward(R);
  G = gammaForward(G);
  B = gammaForward(B);

  const rgb = {
    r: Math.round(Math.max(0, Math.min(255, R * 255))),
    g: Math.round(Math.max(0, Math.min(255, G * 255))),
    b: Math.round(Math.max(0, Math.min(255, B * 255)))
  };

  updateCircleColor(rgb.r, rgb.g, rgb.b);

  return rgb;
}

// ====================
// XYZ → LAB
// ====================

function xyzToLab(X, Y, Z) {
  const fx = f(X / whitePoint.X);
  const fy = f(Y / whitePoint.Y);
  const fz = f(Z / whitePoint.Z);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { L, a, b };
}

// ====================
// LAB → XYZ
// ====================

function labToXyz(L, a, b) {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;

  return {
    X: fInv(fx) * whitePoint.X,
    Y: fInv(fy) * whitePoint.Y,
    Z: fInv(fz) * whitePoint.Z
  };
}

// ====================
// RGB → LAB
// ====================

function rgbToLab(r, g, b, draw) {
  const xyz = rgbToXyz(r, g, b);
  const lab = xyzToLab(xyz.X, xyz.Y, xyz.Z);

  if (draw) {
    const inputs = document.querySelectorAll("#labInput input");
    inputs[0].value = lab.L.toFixed(4);
    inputs[1].value = lab.a.toFixed(4);
    inputs[2].value = lab.b.toFixed(4);
  }

  updateCircleColor(r, g, b);
  return lab;
}

// ====================
// LAB → RGB
// ====================

function labToRgb(L, a, b, draw) {
  const xyz = labToXyz(L, a, b);
  const rgb = xyzToRgb(xyz.X, xyz.Y, xyz.Z);

  if (draw) {
    const inputs = document.querySelectorAll("#rgbInput input");
    inputs[0].value = rgb.r;
    inputs[1].value = rgb.g;
    inputs[2].value = rgb.b;
  }

  updateCircleColor(rgb.r, rgb.g, rgb.b);
  return rgb;
}

// ====================
// RGB → CMYK
// ====================

function rgbToCmyk(r, g, b, draw) {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;

  const k = 1 - Math.max(R, G, B);

  if (k === 1) {
    const res = [0, 0, 0, 1];
    if (draw) {
      const inputs = document.querySelectorAll("#cmykInput input");
      res.forEach((v, i) => inputs[i].value = v);
    }
    updateCircleColor(r, g, b);
    return res;
  }

  const c = (1 - R - k) / (1 - k);
  const m = (1 - G - k) / (1 - k);
  const y = (1 - B - k) / (1 - k);

  const res = [
    +c.toFixed(4),
    +m.toFixed(4),
    +y.toFixed(4),
    +k.toFixed(4)
  ];

  if (draw) {
    const inputs = document.querySelectorAll("#cmykInput input");
    res.forEach((v, i) => inputs[i].value = v);
  }

  updateCircleColor(r, g, b);
  return res;
}

// ====================
// CMYK → RGB
// ====================

function cmykToRgb(c, m, y, k, draw) {
  const R = 255 * (1 - c) * (1 - k);
  const G = 255 * (1 - m) * (1 - k);
  const B = 255 * (1 - y) * (1 - k);

  const rgb = {
    r: Math.round(Math.max(0, Math.min(255, R))),
    g: Math.round(Math.max(0, Math.min(255, G))),
    b: Math.round(Math.max(0, Math.min(255, B)))
  };

  if (draw) {
    const inputs = document.querySelectorAll("#rgbInput input");
    inputs[0].value = rgb.r;
    inputs[1].value = rgb.g;
    inputs[2].value = rgb.b;
  }

  updateCircleColor(rgb.r, rgb.g, rgb.b);
  return rgb;
}

// ====================
// CMYK ↔ LAB
// ====================

function labToCmyk(L, a, b, draw) {
  const rgb = labToRgb(L, a, b);
  return rgbToCmyk(rgb.r, rgb.g, rgb.b, draw);
}

function cmykToLab(c, m, y, k, draw) {
  const rgb = cmykToRgb(c, m, y, k);
  return rgbToLab(rgb.r, rgb.g, rgb.b, draw);
}

// ====================
// VALIDATION
// ====================

function rgbValidate(evt) {
  const v = +evt.target.value;
  if (isNaN(v) || v < 0 || v > 255) evt.target.value = "";
}

function cmykValidate(evt) {
  const v = +evt.target.value;
  if (isNaN(v) || v < 0 || v > 1) evt.target.value = "";
}

function labValidate(evt, isL) {
  const v = evt.target.value;
  if (v === "-") return;

  const num = +v;
  if (isNaN(num)) {
    evt.target.value = "";
    return;
  }

  if (isL && (num < 0 || num > 100)) {
    evt.target.value = "";
    return;
  }

  if (num < -128 || num > 127) {
    evt.target.value = "";
  }
}

// ====================
// UPDATE CIRCLE COLOR
// ====================

function updateCircleColor(r, g, b) {
  const el = document.querySelector(".circle");
  if (!el) return;
  el.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

// ====================
// UPDATE SYSTEM
// ====================

function updateColors(evt, system) {
  const systems = {
    rgb: [rgbToLab, rgbToCmyk],
    lab: [labToRgb, labToCmyk],
    cmyk: [cmykToLab, cmykToRgb]
  };

  const parent = evt.target.parentElement;
  const inputs = parent.querySelectorAll("input");
  const values = Array.from(inputs).map(v => +v.value);

  for (const update of systems[system]) {
    update(...values, true);
  }

  if (system === "rgb") {
    updateCircleColor(values[0], values[1], values[2]);
  }
}

// ====================
// EVENTS
// ====================

document.querySelectorAll("#rgbInput input").forEach(input => {
  input.addEventListener("input", (evt) => {
    rgbValidate(evt);
    updateColors(evt, "rgb");
  });
});

const labInputs = document.querySelectorAll("#labInput input");
labInputs[0].addEventListener("input", (evt) => {
  labValidate(evt, true);
  updateColors(evt, "lab");
});
labInputs[1].addEventListener("input", (evt) => {
  labValidate(evt);
  updateColors(evt, "lab");
});
labInputs[2].addEventListener("input", (evt) => {
  labValidate(evt);
  updateColors(evt, "lab");
});

document.querySelectorAll("#cmykInput input").forEach(input => {
  input.addEventListener("input", (evt) => {
    cmykValidate(evt);
    updateColors(evt, "cmyk");
  });
});
