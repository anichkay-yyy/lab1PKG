function gammaCorrection(x) {
  return x >= 0.04045 ? Math.pow((x + 0.055) / 1.055, 2.4) : x / 12.92;
}

function inverseGammaCorrection(x) {
  return x >= 0.0031308 ? 1.055 * Math.pow(x, 1/2.4) - 0.055 : 12.92 * x;
}

function f(t) {
  return t > 0.008856 ? Math.pow(t, 1/3) : 7.787 * t + 16/116;
}

function fInv(t) {
  return t > 0.008856 ? Math.pow(t, 3) : (t - 16/116) / 7.787;
}

const whitePoint = {X: 95.047, Y: 100.000, Z: 108.883};

function rgbToXyz(r, g, b) {
  let Rn = gammaCorrection(r / 255);
  let Gn = gammaCorrection(g / 255);
  let Bn = gammaCorrection(b / 255);

  const X = Rn * 0.412453 + Gn * 0.357580 + Bn * 0.180423;
  const Y = Rn * 0.212671 + Gn * 0.715160 + Bn * 0.072169;
  const Z = Rn * 0.019334 + Gn * 0.119193 + Bn * 0.950227;

  return {X: X * 100, Y: Y * 100, Z: Z * 100};
}

function xyzToRgb(X, Y, Z) {
  X = X / 100;
  Y = Y / 100;
  Z = Z / 100;

  let Rn = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
  let Gn = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
  let Bn = X * 0.0557 + Y * -0.2040 + Z * 1.0570;

  Rn = inverseGammaCorrection(Rn);
  Gn = inverseGammaCorrection(Gn);
  Bn = inverseGammaCorrection(Bn);

  return {
    r: Math.round(Rn * 255),
    g: Math.round(Gn * 255),
    b: Math.round(Bn * 255)
  };
}

function xyzToLab(X, Y, Z) {
  const Xn = whitePoint.X;
  const Yn = whitePoint.Y;
  const Zn = whitePoint.Z;

  const fx = f(X / Xn);
  const fy = f(Y / Yn);
  const fz = f(Z / Zn);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return {L, a, b};
}

function labToXyz(L, a, b) {
  const Xn = whitePoint.X;
  const Yn = whitePoint.Y;
  const Zn = whitePoint.Z;

  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const X = fInv(fx) * Xn;
  const Y = fInv(fy) * Yn;
  const Z = fInv(fz) * Zn;

  return {X, Y, Z};
}

function rgbToLab(r, g, b, draw) {
  const xyz = rgbToXyz(r, g, b);
  const inputs = document.getElementById("labInput").children;
  const res = xyzToLab(xyz.X, xyz.Y, xyz.Z);;
  if (draw) {
    const fields = "Lab";
    for (inputNum in inputs) {
      inputs[inputNum].value = res[fields[inputNum]]
    }
  }
  return res;
}

function labToRgb(L, a, b, draw) {
  const safeL = Math.max(0, Math.min(100, L));
  const safeA = Math.max(-128, Math.min(127, a));
  const safeB = Math.max(-128, Math.min(127, b));

  const xyz = labToXyz(safeL, safeA, safeB);
  const rgb = xyzToRgb(xyz.X, xyz.Y, xyz.Z);

  const res = {
    r: Math.max(0, Math.min(255, Math.round(rgb.r))),
    g: Math.max(0, Math.min(255, Math.round(rgb.g))),
    b: Math.max(0, Math.min(255, Math.round(rgb.b)))
  };

  if (draw) {
    const inputs = document.getElementById("rgbInput").children;
    const fields = "rgb";
    for (inputNum in inputs) {
      inputs[inputNum].value = res[fields[inputNum]]
    }
  }
  return res;
}

function labToCmyk(L, a, b, draw) {
  const rgb = labToRgb(L, a, b);
  const res = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  if (draw) {
    const inputs = document.getElementById("cmykInput").children;
    for (inputNum in inputs) {
      inputs[inputNum].value = res[inputNum]
    }
  }
  return res;
}

function cmykToLab(c, m, y, k) {
  const rgb = cmykToRgb(c, m, y, k);
  return rgbToLab(rgb.r, rgb.g, rgb.b);
}

function rgbToCmyk(r, g, b, draw) {
  r = r / 255;
  g = g / 255;
  b = b / 255;

  const k = 1 - Math.max(r, g, b);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 1 };
  }

  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);

  const res = [
    Math.round(c * 100) / 100,
    Math.round(m * 100) / 100,
    Math.round(y * 100) / 100,
    Math.round(k * 100) / 100
  ];
  if (draw) {
    const inputs = document.getElementById("cmykInput").children;
    for (inputNum in inputs) {
      inputs[inputNum].value = res[inputNum]
    }
  }
  return res;
}

function cmykToRgb(c, m, y, k) {
  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);

  return {
    r: Math.round(Math.max(0, Math.min(255, r))),
    g: Math.round(Math.max(0, Math.min(255, g))),
    b: Math.round(Math.max(0, Math.min(255, b)))
  };
}


const rgbValidate = (evt) => {
  if (isNaN(+evt.target.value)) {
    evt.target.value = "";
  }
  if (+evt.target.value > 255 || +evt.target.value < 0) {
    evt.target.value = "";
  }
}

const cmykValidate = (evt) => {
  if (isNaN(+evt.target.value)) {
    evt.target.value = "";
    return;
  }
  if (+evt.target.value > 1 || +evt.target.value < 0) {
    evt.target.value = "";
  }
}

const labValidate = (evt, isL) => {
  if (isNaN(+evt.target.value) && evt.target.value !== "-") {
    evt.target.value = "";
    return;
  }

  if (isL) {
    if (+evt.target.value > 100 || +evt.target.value < 0) {
      evt.target.value = "";
      return;
    }
  }

  if (+evt.target.value > 127 || +evt.target.value < -128) {
    evt.target.value = "";
  }
}


const updateColors = (evt, system) => {
  const systems = {
    "rgb": [rgbToLab, rgbToCmyk],
    "lab": [labToRgb, labToCmyk],
    "cmyk": []
  };

  const values = [];
  for (const input of evt.target.parentElement.children) {
    values.push(+input.value)
  }
  for (const updateFunc of systems[system]) {
    updateFunc(...values, true);
  }
};

const
  rgbColorInputs = Array.from(document.getElementById("rgbInput").getElementsByTagName("input")),
  labColorInputs = Array.from(document.getElementById("labInput").getElementsByTagName("input")),
  cmykColorInputs = Array.from(document.getElementById("cmykInput").getElementsByTagName("input"));

rgbColorInputs.forEach(input => {
  input.addEventListener("input", (evt) => {
    rgbValidate(evt)
    updateColors(evt, "rgb");
  });
});

labColorInputs.shift().addEventListener("input", (evt) => {
  labValidate(evt, true);
  updateColors(evt, "lab");
});

labColorInputs.forEach(input => {
input.addEventListener("input", (evt) => {
    labValidate(evt);
    updateColors(evt, "lab");
  });
});


cmykColorInputs.forEach(input => {
  input.addEventListener("input", (evt) => {
    cmykValidate(evt);
    updateColors(evt, "cmyk");
  });
});
