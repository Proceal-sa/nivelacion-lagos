/**
 * topo-math.js - Mathematical & Topographic Surveying Engine
 * TopoPiscícola PWA
 */

const TopoMath = {
  // Convert 0-indexed row number to letter (0 -> A, 25 -> Z, 26 -> AA...)
  rowToLetter(index) {
    let result = '';
    let temp = index;
    while (temp >= 0) {
      result = String.fromCharCode((temp % 26) + 65) + result;
      temp = Math.floor(temp / 26) - 1;
    }
    return result;
  },

  // Convert letter back to 0-indexed row number
  letterToRow(letter) {
    const str = letter.toUpperCase();
    let row = 0;
    for (let i = 0; i < str.length; i++) {
      row = row * 26 + (str.charCodeAt(i) - 64);
    }
    return row - 1;
  },

  // Get Stake Code e.g. "A-1"
  getStakeCode(row, col) {
    return `${this.rowToLetter(row)}-${col + 1}`;
  },

  // Calculate coordinates in meters
  getCoordinates(row, col, dx, dy) {
    return {
      x: col * dx,
      y: row * dy
    };
  },

  // Calculate Design Elevation for a stake
  calculateDesignElevation(row, col, settings) {
    const dx = settings.dx || 10;
    const dy = settings.dy || 10;
    const boxRow = settings.boxRow ?? 0;
    const boxCol = settings.boxCol ?? 0;
    const baseElevation = settings.boxElevation ?? 100.0;
    const slopeMode = settings.slopeMode || 'orthogonal';

    const p = this.getCoordinates(row, col, dx, dy);
    const boxP = this.getCoordinates(boxRow, boxCol, dx, dy);

    const deltaX = Math.abs(p.x - boxP.x);
    const deltaY = Math.abs(p.y - boxP.y);

    if (slopeMode === 'orthogonal') {
      // Doble pendiente: longitudinal hacia la columna de la caja + transversal hacia la fila del canal
      const sx = (settings.slopeX ?? 0.5) / 100; // e.g. 0.5% = 0.005
      const sy = (settings.slopeY ?? 0.8) / 100; // e.g. 0.8% = 0.008
      const elev = baseElevation + (deltaX * sx) + (deltaY * sy);
      return Math.round(elev * 1000) / 1000;
    } else {
      // Pendiente radial directa: distancia euclidiana a la caja
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const sRadial = (settings.slopeRadial ?? 0.6) / 100; // e.g. 0.6%
      const elev = baseElevation + (dist * sRadial);
      return Math.round(elev * 1000) / 1000;
    }
  },

  // Calculate Instrument Height (HI = BM + V+)
  calculateHI(bmElevation, backsight) {
    const bm = Number(bmElevation) || 0;
    const bs = Number(backsight) || 0;
    return Math.round((bm + bs) * 1000) / 1000;
  },

  // Calculate Ground Elevation (Cota Terreno = HI - Lectura)
  calculateGroundElevation(hi, reading) {
    const h = Number(hi);
    const r = Number(reading);
    if (isNaN(h) || isNaN(r)) return null;
    return Math.round((h - r) * 1000) / 1000;
  },

  // Calculate Cut / Fill difference
  calculateCutFill(groundElev, designElev) {
    const g = Number(groundElev);
    const d = Number(designElev);
    if (isNaN(g) || isNaN(d)) return null;
    return Math.round((g - d) * 1000) / 1000;
  },

  // Calculate Ideal Rod Reading: Lectura Ideal = HI - Cota Diseño
  calculateIdealReading(hi, designElev) {
    const h = Number(hi);
    const d = Number(designElev);
    if (isNaN(h) || isNaN(d)) return null;
    return Math.round((h - d) * 1000) / 1000;
  },

  // Evaluate Leveling Status
  evaluateStatus(cutFill, toleranceMeters = 0.02) {
    if (cutFill === null || cutFill === undefined || isNaN(cutFill)) {
      return { status: 'PENDIENTE', label: 'Sin Medir', color: 'gray' };
    }
    const diff = Number(cutFill);
    const tol = Math.abs(Number(toleranceMeters));

    if (Math.abs(diff) <= tol) {
      return {
        status: 'A_NIVEL',
        label: 'A NIVEL',
        color: 'green',
        diffText: `${(diff * 100).toFixed(1)} cm`,
        fullText: `A NIVEL (±${(tol * 100).toFixed(0)} cm)`
      };
    } else if (diff > tol) {
      return {
        status: 'CORTE',
        label: 'CORTE',
        color: 'red',
        diffText: `+${diff.toFixed(2)} m (+${(diff * 100).toFixed(1)} cm)`,
        fullText: `CORTE: ${diff.toFixed(2)} m (Bajar terreno)`
      };
    } else {
      const fillMag = Math.abs(diff);
      return {
        status: 'RELLENO',
        label: 'RELLENO',
        color: 'blue',
        diffText: `-${fillMag.toFixed(2)} m (-${(fillMag * 100).toFixed(1)} cm)`,
        fullText: `RELLENO: ${fillMag.toFixed(2)} m (Subir terreno)`
      };
    }
  },

  // Calculate Ground Elevation at Change Point (PC)
  // Cota PC = HI_anterior - V_adelante
  calculatePCElevation(prevHI, foresight) {
    const hi = Number(prevHI);
    const fs = Number(foresight);
    if (isNaN(hi) || isNaN(fs)) return null;
    return Math.round((hi - fs) * 1000) / 1000;
  },

  // Drainage & Pooling / Contrapendiente Detection
  // Checks if measured stakes create counter-slopes towards the drainage box
  analyzeDrainage(stakes, settings) {
    const boxRow = settings.boxRow ?? 0;
    const boxCol = settings.boxCol ?? 0;
    const dx = settings.dx || 10;
    const dy = settings.dy || 10;
    const boxPos = this.getCoordinates(boxRow, boxCol, dx, dy);

    // Map by key "row_col"
    const stakeMap = new Map();
    for (const s of stakes) {
      stakeMap.set(`${s.row}_${s.col}`, s);
    }

    const warnings = [];

    for (const stake of stakes) {
      // Clear warning first
      stake.hasPuddleWarning = false;
      stake.puddleReason = null;

      if (stake.measuredElevation === null || stake.measuredElevation === undefined) {
        continue;
      }

      // If this is the box itself, no downstream neighbors
      if (stake.row === boxRow && stake.col === boxCol) {
        continue;
      }

      const pStake = this.getCoordinates(stake.row, stake.col, dx, dy);
      const distToBox = Math.hypot(pStake.x - boxPos.x, pStake.y - boxPos.y);

      // Check orthogonal and diagonal immediate neighbors
      const neighbors = [
        { r: stake.row - 1, c: stake.col },
        { r: stake.row + 1, c: stake.col },
        { r: stake.row, c: stake.col - 1 },
        { r: stake.row, c: stake.col + 1 },
        { r: stake.row - 1, c: stake.col - 1 },
        { r: stake.row - 1, c: stake.col + 1 },
        { r: stake.row + 1, c: stake.col - 1 },
        { r: stake.row + 1, c: stake.col + 1 }
      ];

      for (const nCoord of neighbors) {
        const neighbor = stakeMap.get(`${nCoord.r}_${nCoord.c}`);
        if (!neighbor || neighbor.measuredElevation === null || neighbor.measuredElevation === undefined) {
          continue;
        }

        const pNeighbor = this.getCoordinates(nCoord.r, nCoord.c, dx, dy);
        const neighborDistToBox = Math.hypot(pNeighbor.x - boxPos.x, pNeighbor.y - boxPos.y);

        // A downstream neighbor is closer to the box than this stake
        // By design, water MUST flow from stake to neighbor.
        // Therefore, stake.measuredElevation MUST be higher than neighbor.measuredElevation!
        if (neighborDistToBox < distToBox - 0.5) {
          // If stake ground elevation is lower than neighbor ground elevation by more than 5mm:
          const diff = neighbor.measuredElevation - stake.measuredElevation;
          if (diff > 0.005) {
            stake.hasPuddleWarning = true;
            stake.puddleReason = `Contrapendiente hacia ${neighbor.code}: la estaca está ${(diff * 100).toFixed(1)} cm más baja que su vecina de desagüe.`;
            warnings.push({
              stakeId: stake.id,
              stakeCode: stake.code,
              neighborCode: neighbor.code,
              diffCm: (diff * 100).toFixed(1),
              reason: stake.puddleReason
            });
            break; // Stop after first detected contrapendiente
          }
        }
      }
    }

    return warnings;
  },

  // Calculate Approximate Earthwork Volumes (Corte y Relleno)
  calculateEarthworkVolumes(stakes, settings) {
    const dx = settings.dx || 10;
    const dy = settings.dy || 10;
    const cellArea = dx * dy;

    let totalCutVolume = 0;
    let totalFillVolume = 0;
    let measuredCount = 0;
    let totalStakes = stakes.length;

    // Grid prism calculation
    for (const s of stakes) {
      if (s.cutFill !== null && s.cutFill !== undefined && !isNaN(s.cutFill)) {
        measuredCount++;
        // Prismoidal weight depending on boundary
        const isEdgeRow = (s.row === 0 || s.row === settings.rows - 1);
        const isEdgeCol = (s.col === 0 || s.col === settings.cols - 1);
        let weight = 1.0;
        if (isEdgeRow && isEdgeCol) weight = 0.25; // Corner
        else if (isEdgeRow || isEdgeCol) weight = 0.5; // Edge
        
        const effectiveArea = cellArea * weight;
        const diff = s.cutFill;

        if (diff > 0) {
          totalCutVolume += diff * effectiveArea;
        } else if (diff < 0) {
          totalFillVolume += Math.abs(diff) * effectiveArea;
        }
      }
    }

    const netBalance = totalCutVolume - totalFillVolume; // + if surplus dirt, - if deficit dirt

    return {
      totalCutVolume: Math.round(totalCutVolume * 100) / 100,
      totalFillVolume: Math.round(totalFillVolume * 100) / 100,
      netBalance: Math.round(netBalance * 100) / 100,
      measuredCount,
      totalStakes,
      coveragePercent: totalStakes > 0 ? Math.round((measuredCount / totalStakes) * 100) : 0
    };
  },

  // Calculate Design Elevation at ANY arbitrary coordinate (x, y)
  // Supports either exact slope formulas or bilinear interpolation if manual nodes exist
  calculateDesignElevationAtCoord(x, y, settings, stakes = []) {
    const dx = settings.dx || 10;
    const dy = settings.dy || 10;
    const rows = settings.rows || 5;
    const cols = settings.cols || 8;
    const boxRow = settings.boxRow ?? 0;
    const boxCol = settings.boxCol ?? 0;
    const baseElevation = settings.boxElevation ?? 100.0;
    const slopeMode = settings.slopeMode || 'orthogonal';

    // Determinar coordenadas reales de la caja de pesca
    let boxX, boxY;
    if (settings.boxX !== undefined && settings.boxY !== undefined && !isNaN(settings.boxX) && !isNaN(settings.boxY)) {
      boxX = Number(settings.boxX);
      boxY = Number(settings.boxY);
    } else if (stakes && stakes.length > 0) {
      const boxStake = stakes.find(s => s.row === boxRow && s.col === boxCol) || stakes[0];
      boxX = boxStake.x;
      boxY = boxStake.y;
    } else {
      const boxPos = this.getCoordinates(boxRow, boxCol, dx, dy);
      boxX = boxPos.x;
      boxY = boxPos.y;
    }

    // Check if any stake has a custom design elevation override
    if (stakes && stakes.length >= 3) {
      const hasCustom = stakes.some(s => s.isCustomDesign);
      if (hasCustom) {
        // Attempt TIN interpolation first
        const tin = this.computeDelaunayTIN(stakes);
        const tinRes = this.interpolateTIN(x, y, stakes, tin.triangles);
        if (tinRes) {
          return {
            elevation: tinRes.elevation,
            method: tinRes.method,
            isTIN: true,
            triangle: tinRes.triangle,
            weights: tinRes.weights
          };
        }
      }
    }

    // Pure mathematical formula based on drainage slope mode
    const deltaX = Math.abs(x - boxX);
    const deltaY = Math.abs(y - boxY);

    if (slopeMode === 'orthogonal') {
      const sx = (settings.slopeX ?? 0.5) / 100;
      const sy = (settings.slopeY ?? 0.8) / 100;
      const elev = baseElevation + (deltaX * sx) + (deltaY * sy);
      return {
        elevation: Math.round(elev * 1000) / 1000,
        method: 'Doble Pendiente Ortogonal',
        isBilinear: false
      };
    } else {
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const sRadial = (settings.slopeRadial ?? 0.6) / 100;
      const elev = baseElevation + (dist * sRadial);
      return {
        elevation: Math.round(elev * 1000) / 1000,
        method: 'Pendiente Radial Directa',
        isBilinear: false
      };
    }
  },

  // Generates human readable offset description (e.g. "B-2 +3.5m Der, +2.0m Arr")
  getOffsetLabel(stakeCode, dX, dY) {
    const parts = [];
    if (dX > 0) parts.push(`+${dX.toFixed(1)}m Der`);
    else if (dX < 0) parts.push(`-${Math.abs(dX).toFixed(1)}m Izq`);

    if (dY > 0) parts.push(`+${dY.toFixed(1)}m Adel`);
    else if (dY < 0) parts.push(`-${Math.abs(dY).toFixed(1)}m Atr`);

    if (parts.length === 0) return `${stakeCode} (En Estaca)`;
    return `${stakeCode} (${parts.join(', ')})`;
  },

  // Parse stake pattern strings like "A=8, B=10, C=10..." or "8, 10, 10..."
  parseStakePattern(patternStr) {
    if (!patternStr || typeof patternStr !== 'string' || !patternStr.trim()) {
      return { hasPattern: false, isLetterMapped: false, letterMap: {}, counts: [] };
    }
    const tokens = patternStr.split(',').map(s => s.trim()).filter(Boolean);
    const letterMap = {};
    const counts = [];
    let isLetterMapped = false;

    for (const tok of tokens) {
      if (tok.includes('=')) {
        const parts = tok.split('=');
        const letter = parts[0].trim().toUpperCase();
        const count = parseInt(parts[1].trim(), 10);
        if (letter && !isNaN(count) && count > 0) {
          letterMap[letter] = count;
          isLetterMapped = true;
        }
      } else {
        const count = parseInt(tok, 10);
        if (!isNaN(count) && count > 0) {
          counts.push(count);
        }
      }
    }

    return {
      hasPattern: isLetterMapped || counts.length > 0,
      isLetterMapped,
      letterMap,
      counts
    };
  },

  // Distance between two points in meters
  distance(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  },

  // Trilateration / Circle-Circle Intersection from 2 stakes with tape measure
  // Returns { success: boolean, x, y, error }
  solveTrilateration(p1, d1, p2, d2, side = 'derecha') {
    const D = this.distance(p1, p2);
    if (D < 0.001) {
      return { success: false, error: 'Las dos estacas están en el mismo punto' };
    }
    if (d1 + d2 < D - 0.005) {
      return {
        success: false,
        error: `Las distancias no se alcanzan con cinta (Suma: ${(d1 + d2).toFixed(2)}m < Distancia entre estacas: ${D.toFixed(2)}m)`
      };
    }
    if (Math.abs(d1 - d2) > D + 0.005) {
      return {
        success: false,
        error: `Una distancia es demasiado corta respecto a la otra para intersectar (Diferencia: ${Math.abs(d1 - d2).toFixed(2)}m > ${D.toFixed(2)}m)`
      };
    }

    const a = (d1 * d1 - d2 * d2 + D * D) / (2 * D);
    const hSq = d1 * d1 - a * a;
    const h = Math.sqrt(Math.max(0, hSq));

    // Unit vector from p1 to p2
    const ux = (p2.x - p1.x) / D;
    const uy = (p2.y - p1.y) / D;

    // Perpendicular vector to the right (looking from p1 to p2 in +Y forward screen system)
    const vrx = -uy;
    const vry = ux;

    // Point along base line
    const p0x = p1.x + a * ux;
    const p0y = p1.y + a * uy;

    let resX, resY;
    const isRight = (side.toLowerCase() === 'derecha' || side.toLowerCase() === 'right');

    if (isRight) {
      // Derecha respecto al vector p1 -> p2 (+vr)
      resX = p0x + h * vrx;
      resY = p0y + h * vry;
    } else {
      // Izquierda respecto al vector p1 -> p2 (-vr)
      resX = p0x - h * vrx;
      resY = p0y - h * vry;
    }

    return {
      success: true,
      x: Math.round(resX * 1000) / 1000,
      y: Math.round(resY * 1000) / 1000,
      baseDist: D,
      sideChosen: isRight ? 'Derecha' : 'Izquierda'
    };
  },

  // 2D Delaunay Triangulation (Bowyer-Watson Algorithm)
  // Input: array of points [{ id, x, y, ... }]
  // Output: { triangles: [[idx0, idx1, idx2]], edges: [[idx0, idx1]] }
  computeDelaunayTIN(points) {
    if (!points || points.length < 3) {
      return { triangles: [], edges: [] };
    }

    const n = points.length;
    // Find bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < n; i++) {
      if (points[i].x < minX) minX = points[i].x;
      if (points[i].x > maxX) maxX = points[i].x;
      if (points[i].y < minY) minY = points[i].y;
      if (points[i].y > maxY) maxY = points[i].y;
    }

    const dx = (maxX - minX) * 2 || 100;
    const dy = (maxY - minY) * 2 || 100;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    // Super-triangle vertices added at indices n, n+1, n+2
    const allPts = points.slice();
    allPts.push({ x: midX - 2 * dx, y: midY - dy, isSuper: true });
    allPts.push({ x: midX, y: midY + 2 * dy, isSuper: true });
    allPts.push({ x: midX + 2 * dx, y: midY - dy, isSuper: true });

    let triangles = [[n, n + 1, n + 2]];

    // Circumcircle test helper
    const inCircumcircle = (p, t) => {
      const p1 = allPts[t[0]];
      const p2 = allPts[t[1]];
      const p3 = allPts[t[2]];

      const d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
      if (Math.abs(d) < 1e-9) return false;

      const p1Sq = p1.x * p1.x + p1.y * p1.y;
      const p2Sq = p2.x * p2.x + p2.y * p2.y;
      const p3Sq = p3.x * p3.x + p3.y * p3.y;

      const cx = (p1Sq * (p2.y - p3.y) + p2Sq * (p3.y - p1.y) + p3Sq * (p1.y - p2.y)) / d;
      const cy = (p1Sq * (p3.x - p2.x) + p2Sq * (p1.x - p3.x) + p3Sq * (p2.x - p1.x)) / d;
      const rSq = (p1.x - cx) * (p1.x - cx) + (p1.y - cy) * (p1.y - cy);

      const distSq = (p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy);
      return distSq <= rSq + 1e-7;
    };

    // Incremental insertion of each point
    for (let i = 0; i < n; i++) {
      const p = allPts[i];
      const badTriangles = [];

      for (let j = 0; j < triangles.length; j++) {
        if (inCircumcircle(p, triangles[j])) {
          badTriangles.push(triangles[j]);
        }
      }

      // Find boundary of polygonal hole
      const polygon = [];
      for (let j = 0; j < badTriangles.length; j++) {
        const tri = badTriangles[j];
        const triEdges = [
          [tri[0], tri[1]],
          [tri[1], tri[2]],
          [tri[2], tri[0]]
        ];

        for (let e = 0; e < 3; e++) {
          const edge = triEdges[e];
          let isShared = false;
          for (let k = 0; k < badTriangles.length; k++) {
            if (j === k) continue;
            const other = badTriangles[k];
            const otherEdges = [
              [other[0], other[1]],
              [other[1], other[2]],
              [other[2], other[0]]
            ];
            for (let oe = 0; oe < 3; oe++) {
              if ((edge[0] === otherEdges[oe][0] && edge[1] === otherEdges[oe][1]) ||
                  (edge[0] === otherEdges[oe][1] && edge[1] === otherEdges[oe][0])) {
                isShared = true;
                break;
              }
            }
            if (isShared) break;
          }
          if (!isShared) {
            polygon.push(edge);
          }
        }
      }

      // Remove bad triangles
      triangles = triangles.filter(t => !badTriangles.includes(t));

      // Re-triangulate the hole connecting to point i
      for (let j = 0; j < polygon.length; j++) {
        triangles.push([polygon[j][0], polygon[j][1], i]);
      }
    }

    // Filter out triangles containing any vertex of super-triangle
    const finalTriangles = triangles.filter(t => t[0] < n && t[1] < n && t[2] < n);

    // Collect unique edges with lengths
    const edgeMap = new Map();
    for (const t of finalTriangles) {
      const pairs = [
        [Math.min(t[0], t[1]), Math.max(t[0], t[1])],
        [Math.min(t[1], t[2]), Math.max(t[1], t[2])],
        [Math.min(t[2], t[0]), Math.max(t[2], t[0])]
      ];
      for (const [a, b] of pairs) {
        const key = `${a}_${b}`;
        if (!edgeMap.has(key)) {
          const length = this.distance(points[a], points[b]);
          edgeMap.set(key, { from: a, to: b, length: Math.round(length * 100) / 100 });
        }
      }
    }

    return {
      triangles: finalTriangles,
      edges: Array.from(edgeMap.values())
    };
  },

  // Interpolate elevation inside a Delaunay Triangulated Irregular Network (TIN)
  interpolateTIN(x, y, points, triangles) {
    if (!triangles || triangles.length === 0 || !points || points.length === 0) {
      return null;
    }

    for (const tri of triangles) {
      const p1 = points[tri[0]];
      const p2 = points[tri[1]];
      const p3 = points[tri[2]];

      const z1 = p1.designElevation ?? p1.elevation ?? 0;
      const z2 = p2.designElevation ?? p2.elevation ?? 0;
      const z3 = p3.designElevation ?? p3.elevation ?? 0;

      // Barycentric coordinates
      const det = (p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y);
      if (Math.abs(det) < 1e-9) continue;

      const l1 = ((p2.y - p3.y) * (x - p3.x) + (p3.x - p2.x) * (y - p3.y)) / det;
      const l2 = ((p3.y - p1.y) * (x - p3.x) + (p1.x - p3.x) * (y - p3.y)) / det;
      const l3 = 1 - l1 - l2;

      // Inside triangle check with small tolerance for boundary points
      if (l1 >= -0.005 && l2 >= -0.005 && l3 >= -0.005) {
        const interpolatedZ = l1 * z1 + l2 * z2 + l3 * z3;
        return {
          elevation: Math.round(interpolatedZ * 1000) / 1000,
          method: 'Interpolación Triangular (TIN Delaunay)',
          triangle: [p1.code, p2.code, p3.code],
          weights: [Math.round(l1 * 100), Math.round(l2 * 100), Math.round(l3 * 100)]
        };
      }
    }

    return null;
  },

  // Rotate offset vector (dX, dY) by reference axis angle
  // If lake axis is rotated by angleRad, local (dX_der, dY_adel) transforms to global (dX_g, dY_g)
  rotateOffsetByAxis(dX, dY, axisAngleRad = 0) {
    if (Math.abs(axisAngleRad) < 1e-6) {
      return { dx: dX, dy: dY };
    }
    const cosA = Math.cos(axisAngleRad);
    const sinA = Math.sin(axisAngleRad);
    return {
      dx: dX * cosA - dY * sinA,
      dy: dX * sinA + dY * cosA
    };
  },

  // =========================================================================
  // CUADRO SEMILLA VECTORIAL (A1, A2, B1, B2) CON INCLINACIÓN REAL EN X Y Y
  // =========================================================================

  /**
   * Resuelve el Cuadro Semilla Vectorial (A1, A2, B1, B2).
   * Ambas direcciones se inclinan respecto a los ejes fijos X y Y:
   * 1. Ángulo interno exacto por las 2 Diagonales (alpha):
   *    cos1 = (d1*d1 - d_col*d_col - d_fila*d_fila) / (2 * d_col * d_fila)
   *    cos2 = (d_col*d_col + d_fila*d_fila - d2*d2) / (2 * d_col * d_fila)
   *    alpha = Math.acos(clamp((cos1 + cos2) / 2, -0.999, 0.999))
   * 2. Giro global respecto a X y Y (sin bloquear Uy = 0):
   *    Opción 1 (Retiro x_B1 al Eje Y):
   *      theta_V = Math.atan2(Math.sqrt(d_fila*d_fila - (x_B1 - x_A1)^2), x_B1 - x_A1)
   *      theta_U = theta_V - alpha
   *    Opción 2 (Retiro y_A2 al Eje X):
   *      theta_U = Math.asin((y_A2 - y_A1) / d_col)
   *      theta_V = theta_U + alpha
   * 3. Vectores inclinados U y V:
   *    Ux = d_col * Math.cos(theta_U), Uy = d_col * Math.sin(theta_U)
   *    Vx = d_fila * Math.cos(theta_V), Vy = d_fila * Math.sin(theta_V)
   */
  /**
   * Resuelve el Cuadro Semilla (A1, A2, B1, B2) con trigonometría exacta de campo.
   * - Entrada: d_col (A1->A2), d_fila (A1->B1), d_corta (A2->B1), d_larga (A1->B2)
   * - alpha: ángulo interno exacto por ley de cosenos (74.69° con 15m, 18.20m y 23.85m)
   * - Modo 1 (Talud Base Paralelo - Por defecto): theta_U = 0°, theta_V = alpha (74.69°)
   * - Modo 2 (Ejes Ortogonales a 90°): Vx = x_B1 - x_A1, theta_V = atan2(Vy, Vx), theta_U = theta_V - alpha (+15.31° hacia arriba)
   */
  solveSeedFrameVectorial(params) {
    const dCol = Number(params.dCol || params.dx || 15.0);
    const dFila = Number(params.dFila || params.dy || 15.0);
    const d1 = Number(params.d1 !== undefined ? params.d1 : (params.seedD1 !== undefined ? params.seedD1 : 23.85)); // diagonal larga A1->B2
    const d2 = Number(params.d2 !== undefined ? params.d2 : (params.seedD2 !== undefined ? params.seedD2 : 18.20)); // diagonal corta A2->B1
    const xA1 = Number(params.xA1 !== undefined ? params.xA1 : (params.seedXA1 !== undefined ? params.seedXA1 : 1.5));
    const yA1 = Number(params.yA1 !== undefined ? params.yA1 : (params.seedYA1 !== undefined ? params.seedYA1 : 1.5));
    const refMode = params.refMode || params.seedRefMode || 'dual_inclinado';
    const reparto = Number(params.reparto !== undefined ? params.reparto : (params.seedReparto !== undefined ? params.seedReparto : 0.5));
    const xB1 = Number(params.xB1 !== undefined ? params.xB1 : (params.seedXB1 !== undefined ? params.seedXB1 : 1.5));
    const yA2 = Number(params.yA2 !== undefined ? params.yA2 : (params.seedYA2 !== undefined ? params.seedYA2 : 1.5));
    const namingMode = params.namingMode || params.seedNamingMode || 'letters_on_base';

    if (dCol <= 0 || dFila <= 0) {
      return { success: false, error: 'd_col y d_fila deben ser mayores a cero' };
    }

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    // 1. Cálculo del ángulo interno del rombo (alpha en A1):
    // Triángulo A1-A2-B1 cerrado por diagonal corta d2 (18.20 m):
    const cosAlpha1 = (dCol * dCol + dFila * dFila - d2 * d2) / (2 * dCol * dFila);
    // Y verifica/promedia con B2 cerrado por diagonal larga d1 (23.85 m):
    const cosAlpha2 = (d1 * d1 - dCol * dCol - dFila * dFila) / (2 * dCol * dFila);

    const cosAvg = clamp((cosAlpha1 + cosAlpha2) / 2, -0.999, 0.999);
    const alpha = Math.acos(cosAvg); // Para 15, 18.2, 23.85 da exactamente 74.69° (cosAvg = +0.264)
    const alphaDeg = alpha * 180 / Math.PI;

    // Discrepancia entre diagonales
    const calcD1 = Math.sqrt(Math.max(0, dCol * dCol + dFila * dFila + 2 * dCol * dFila * cosAlpha1));
    const closureErrorM = Math.abs(d1 - calcD1);

    // Convergencia total de ambos taludes respecto al plano cartesiano a 90° (Math.PI / 2):
    const delta = (Math.PI / 2) - alpha; // ~15.31°
    const deltaDeg = delta * 180 / Math.PI;

    let thetaU = 0;
    let thetaV = 0;

    if (refMode === 'ejes_ortogonales' || refMode === 'y_axis_xB1') {
      // Modo con retiro medido x_B1 a Eje Y
      const Vx_diff = xB1 - xA1;
      const Vy_calc = Math.sqrt(Math.max(0, dFila * dFila - Vx_diff * Vx_diff));
      thetaV = Math.atan2(Vy_calc, Vx_diff);
      thetaU = thetaV - alpha;
    } else if (refMode === 'x_axis_yA2') {
      const Uy_diff = yA2 - yA1;
      const Ux_calc = Math.sqrt(Math.max(0, dCol * dCol - Uy_diff * Uy_diff));
      thetaU = Math.atan2(Uy_diff, Ux_calc);
      thetaV = thetaU + alpha;
    } else if (refMode === 'both_retires') {
      const Uy_diff = yA2 - yA1;
      const Ux_calc = Math.sqrt(Math.max(0, dCol * dCol - Uy_diff * Uy_diff));
      thetaU = Math.atan2(Uy_diff, Ux_calc);
      const Vx_diff = xB1 - xA1;
      const Vy_calc = Math.sqrt(Math.max(0, dFila * dFila - Vx_diff * Vx_diff));
      thetaV = Math.atan2(Vy_calc, Vx_diff);
    } else if (refMode === 'talud_paralelo_base') {
      thetaU = 0;
      thetaV = alpha;
    } else {
      // MODO PREDETERMINADO: Inclinación Dual de AMBOS taludes dentro del plano X, Y de 90°
      // Reparte delta en ambos ejes según reparto (0.5 por defecto = 50% en X, 50% en Y)
      const rClamped = clamp(Number(reparto), 0, 1);
      thetaU = delta * rClamped; // +7.65° con reparto = 0.5
      thetaV = thetaU + alpha;   // 82.35° respecto a X (7.65° despegado de Eje Y)
    }

    // 3. Vectores inclinados U y V en el plano cartesiano topográfico
    const Ux = dCol * Math.cos(thetaU);
    const Uy = dCol * Math.sin(thetaU);
    const Vx = dFila * Math.cos(thetaV);
    const Vy = dFila * Math.sin(thetaV);

    // Cuatro esquinas del cuadro semilla
    const A1 = { x: xA1, y: yA1 };
    let B1, A2, B2;

    if (namingMode === 'numbers_on_base') {
      // Números sobre Talud Base (vector U), Letras subiendo por Talud Lateral (vector V)
      A2 = { x: xA1 + Ux, y: yA1 + Uy };
      B1 = { x: xA1 + Vx, y: yA1 + Vy };
      B2 = { x: xA1 + Ux + Vx, y: yA1 + Uy + Vy };
    } else {
      // letters_on_base (POR DEFECTO):
      // Letras sobre Talud Base (vector U: A1 -> B1 -> C1...)
      // Números subiendo por Talud Lateral (vector V: A1 -> A2 -> A3...)
      B1 = { x: xA1 + Ux, y: yA1 + Uy };
      A2 = { x: xA1 + Vx, y: yA1 + Vy };
      B2 = { x: xA1 + Ux + Vx, y: yA1 + Uy + Vy };
    }

    const thetaUDeg = thetaU * 180 / Math.PI;
    const thetaVDeg = thetaV * 180 / Math.PI;

    return {
      success: true,
      refMode,
      reparto: clamp(Number(reparto), 0, 1),
      namingMode,
      dCol,
      dFila,
      d1,
      d2,
      xA1,
      yA1,
      xB1: Math.round(B1.x * 1000) / 1000,
      yA2: Math.round(A2.y * 1000) / 1000,
      alpha,
      alphaDeg: Math.round(alphaDeg * 100) / 100,
      delta,
      deltaDeg: Math.round(deltaDeg * 100) / 100,
      thetaU,
      thetaUDeg: Math.round(thetaUDeg * 100) / 100,
      thetaV,
      thetaVDeg: Math.round(thetaVDeg * 100) / 100,
      despegueXDeg: Math.round(thetaUDeg * 100) / 100,
      despegueYDeg: Math.round((90 - thetaVDeg) * 100) / 100,
      cosAlpha1: Math.round(cosAlpha1 * 1000) / 1000,
      cosAlpha2: Math.round(cosAlpha2 * 1000) / 1000,
      cos1: Math.round(cosAlpha2 * 1000) / 1000,
      cos2: Math.round(cosAlpha1 * 1000) / 1000,
      closureErrorMeters: Math.round(closureErrorM * 1000) / 1000,
      closureErrorCm: Math.round(closureErrorM * 1000) / 10,
      Ux: Math.round(Ux * 1000) / 1000,
      Uy: Math.round(Uy * 1000) / 1000,
      Vx: Math.round(Vx * 1000) / 1000,
      Vy: Math.round(Vy * 1000) / 1000,
      uRow: { x: Math.cos(thetaU), y: Math.sin(thetaU) },
      uCol: { x: Math.cos(thetaV), y: Math.sin(thetaV) },
      A1: { x: Math.round(A1.x * 1000) / 1000, y: Math.round(A1.y * 1000) / 1000 },
      A2: { x: Math.round(A2.x * 1000) / 1000, y: Math.round(A2.y * 1000) / 1000 },
      B1: { x: Math.round(B1.x * 1000) / 1000, y: Math.round(B1.y * 1000) / 1000 },
      B2: { x: Math.round(B2.x * 1000) / 1000, y: Math.round(B2.y * 1000) / 1000 }
    };
  },

  /**
   * Genera las estacas del lago usando los vectores inclinados U y V del Cuadro Semilla.
   * - namingMode = 'letters_on_base': Letras sobre U (Talud Base), Números subiendo en V (Talud Lateral).
   * - namingMode = 'numbers_on_base': Números sobre U, Letras subiendo en V.
   */
  generateSeedFrameMesh(projId, seedFrame, settings) {
    const { Ux, Uy, Vx, Vy, xA1, yA1 } = seedFrame;
    const namingMode = seedFrame.namingMode || settings.seedNamingMode || settings.namingMode || 'letters_on_base';
    const patternStr = (settings.meshMode === 'seed' ? settings.seedRowPattern : settings.rowPattern) || '';
    const parsed = this.parseStakePattern(patternStr);
    const stakes = [];

    if (namingMode === 'letters_on_base') {
      // MODO PREDETERMINADO:
      // Letras avanzan sobre Talud Base (vector U, paralelo al Eje X, a 1.50m constantes)
      // Números de cada letra suben por Talud Lateral (vector V, paralelo al Eje Y, a 1.50m constantes)
      let numLetters = Number(settings.seedRows || settings.rows || 7);
      const defaultCols = Number(settings.seedCols || settings.cols || 10);

      if (parsed.isLetterMapped) {
        for (const letChar of Object.keys(parsed.letterMap)) {
          const idx = this.letterToRow(letChar);
          if (idx >= 0 && idx + 1 > numLetters) {
            numLetters = idx + 1;
          }
        }
      } else if (parsed.counts.length > 0) {
        numLetters = parsed.counts.length;
      }

      for (let l = 0; l < numLetters; l++) {
        const letChar = this.rowToLetter(l);
        let countInLetter = defaultCols;

        if (parsed.isLetterMapped) {
          if (parsed.letterMap[letChar] !== undefined) {
            countInLetter = parsed.letterMap[letChar];
          }
        } else if (parsed.counts.length > 0) {
          if (parsed.counts[l] !== undefined) {
            countInLetter = parsed.counts[l];
          }
        }

        // Cada letra nace con su #1 abajo a 1.50m del Talud Base (offset = 0 en Y/V)
        for (let n = 0; n < countInLetter; n++) {
          const x = xA1 + l * Ux + n * Vx;
          const y = yA1 + l * Uy + n * Vy;

          const code = this.getStakeCode(l, n);
          const designElev = this.calculateDesignElevationAtCoord(x, y, settings, []);

          stakes.push({
            id: `${projId}_${l}_${n}`,
            projId: projId,
            row: l,
            col: n,
            code: code,
            x: Math.round(x * 1000) / 1000,
            y: Math.round(y * 1000) / 1000,
            designElevation: designElev.elevation,
            isCustomDesign: false,
            reading: null,
            measuredElevation: null,
            stationId: null,
            measuredAt: null,
            cutFill: null,
            status: 'PENDIENTE',
            hasPuddleWarning: false,
            puddleReason: null,
            note: ''
          });
        }
      }
    } else {
      // MODO ALTERNATIVO: numbers_on_base
      // Números avanzan sobre Talud Base (vector U), Letras suben por Talud Lateral (vector V)
      const rowCounts = parsed.counts.length > 0
        ? parsed.counts
        : (parsed.isLetterMapped ? Object.values(parsed.letterMap) : []);

      const numRows = rowCounts.length > 0 ? rowCounts.length : Number(settings.seedRows || settings.rows || 7);
      const maxCols = rowCounts.length > 0 ? Math.max(...rowCounts) : Number(settings.seedCols || settings.cols || 10);
      const alignment = settings.seedAlignment || settings.rowAlignment || 'center'; // 'center', 'left', 'right'

      for (let r = 0; r < numRows; r++) {
        const countInRow = rowCounts.length > 0 ? rowCounts[r] : maxCols;

        for (let c = 0; c < countInRow; c++) {
          let offsetFila = 0;
          if (alignment === 'center') {
            offsetFila = (maxCols - countInRow) / 2;
          } else if (alignment === 'right') {
            offsetFila = maxCols - countInRow;
          }

          const effC = c + offsetFila;
          const x = xA1 + effC * Ux + r * Vx;
          const y = yA1 + effC * Uy + r * Vy;

          const code = this.getStakeCode(r, c);
          const designElev = this.calculateDesignElevationAtCoord(x, y, settings, []);

          stakes.push({
            id: `${projId}_${r}_${c}`,
            projId: projId,
            row: r,
            col: c,
            code: code,
            x: Math.round(x * 1000) / 1000,
            y: Math.round(y * 1000) / 1000,
            designElevation: designElev.elevation,
            isCustomDesign: false,
            reading: null,
            measuredElevation: null,
            stationId: null,
            measuredAt: null,
            cutFill: null,
            status: 'PENDIENTE',
            hasPuddleWarning: false,
            puddleReason: null,
            note: ''
          });
        }
      }
    }

    return stakes;
  },

  // =========================================================================
  // REPLANTEO 100% CINTA MÉTRICA (4 BORDES + 2 DIAGONALES) & MALLA IRREGULAR
  // =========================================================================

  /**
   * Resuelve los 4 vértices del cuadrilátero del lago usando medidas de cinta métrica
   * y Ley de Cosenos (Trilateración pura sin necesidad de ángulos ni rumbos).
   * P1 = (0, 0) [Esquina Frontal Izquierda]
   * P2 = (L12, 0) [Esquina Frontal Derecha]
   * P3 = Trilaterado con L12, L23 y Diagonal D13 [Esquina Trasera Derecha]
   * P4 = Trilaterado con L41, L34 y Diagonal D13 [Esquina Trasera Izquierda]
   * Cierre Geométrico: Compara la distancia calculada P2-P4 con D24 medida.
   */
  solveQuadrilateralTape(L12, L23, L34, L41, D13, D24 = 0) {
    const l12 = Number(L12);
    const l23 = Number(L23);
    const l34 = Number(L34);
    const l41 = Number(L41);
    const d13 = Number(D13);
    const d24 = Number(D24);

    if (l12 <= 0 || l23 <= 0 || l34 <= 0 || l41 <= 0 || d13 <= 0) {
      return { success: false, error: 'Todas las medidas de borde y la diagonal D13 deben ser mayores a 0' };
    }

    // Validación Desigualdad Triangular para Triángulo 1-2-3 (l12, l23, d13)
    if (l12 + l23 <= d13 || l12 + d13 <= l23 || l23 + d13 <= l12) {
      return { success: false, error: 'El Triángulo 1-2-3 (Borde Frontal, Borde Derecho, Diagonal 1) no cierra geométricamente con las medidas ingresadas.' };
    }

    // Validación Desigualdad Triangular para Triángulo 1-4-3 (l41, l34, d13)
    if (l41 + l34 <= d13 || l41 + d13 <= l34 || l34 + d13 <= l41) {
      return { success: false, error: 'El Triángulo 1-4-3 (Borde Izquierdo, Borde Trasero, Diagonal 1) no cierra geométricamente con las medidas ingresadas.' };
    }

    // 1. P1 en origen y P2 sobre el eje base
    const P1 = { x: 0, y: 0 };
    const P2 = { x: l12, y: 0 };

    // 2. Resolver P3 en Triángulo 1-2-3 usando el ángulo interior en P2 (theta2)
    // Por Ley de Cosenos: d13^2 = l12^2 + l23^2 - 2 * l12 * l23 * cos(theta2)
    const cosTheta2 = (l12 * l12 + l23 * l23 - d13 * d13) / (2 * l12 * l23);
    const clampedCosTheta2 = Math.max(-1, Math.min(1, cosTheta2));
    const sinTheta2 = Math.sqrt(Math.max(0, 1 - clampedCosTheta2 * clampedCosTheta2));

    const P3 = {
      x: l12 - l23 * clampedCosTheta2,
      y: l23 * sinTheta2
    };

    // 3. Resolver P4 en Triángulo 1-4-3 usando el ángulo interior en P1 (gamma1) respecto a la diagonal P1-P3
    // Por Ley de Cosenos: l34^2 = l41^2 + d13^2 - 2 * l41 * d13 * cos(gamma1)
    const cosGamma1 = (l41 * l41 + d13 * d13 - l34 * l34) / (2 * l41 * d13);
    const clampedCosGamma1 = Math.max(-1, Math.min(1, cosGamma1));
    const gamma1 = Math.acos(clampedCosGamma1);

    // Ángulo de la diagonal P1 -> P3
    const phi13 = Math.atan2(P3.y, P3.x);
    // Vértice P4 queda a la izquierda del vector P1->P3 (hacia el interior del cuadrilátero)
    const phi14 = phi13 + gamma1;

    const P4 = {
      x: l41 * Math.cos(phi14),
      y: l41 * Math.sin(phi14)
    };

    // 4. Chequeo de Cierre con Diagonal 2 (D24)
    const calcD24 = Math.hypot(P4.x - P2.x, P4.y - P2.y);
    let closureErrorM = 0;
    let closureErrorCm = 0;
    let isClosed = true;

    if (d24 > 0) {
      closureErrorM = Math.abs(d24 - calcD24);
      closureErrorCm = Math.round(closureErrorM * 1000) / 10;
      isClosed = closureErrorM <= 0.10; // Tolerancia 10 cm
    }

    return {
      success: true,
      P1: { x: Math.round(P1.x * 1000) / 1000, y: Math.round(P1.y * 1000) / 1000 },
      P2: { x: Math.round(P2.x * 1000) / 1000, y: Math.round(P2.y * 1000) / 1000 },
      P3: { x: Math.round(P3.x * 1000) / 1000, y: Math.round(P3.y * 1000) / 1000 },
      P4: { x: Math.round(P4.x * 1000) / 1000, y: Math.round(P4.y * 1000) / 1000 },
      corners: [
        { id: 1, label: 'E1 (Frontal-Izq)', x: P1.x, y: P1.y },
        { id: 2, label: 'E2 (Frontal-Der)', x: P2.x, y: P2.y },
        { id: 3, label: 'E3 (Trasera-Der)', x: P3.x, y: P3.y },
        { id: 4, label: 'E4 (Trasera-Izq)', x: P4.x, y: P4.y }
      ],
      calculatedD24: Math.round(calcD24 * 1000) / 1000,
      measuredD24: d24 > 0 ? d24 : null,
      closureErrorMeters: Math.round(closureErrorM * 1000) / 1000,
      closureErrorCm,
      isClosed,
      description: d24 > 0
        ? (isClosed
            ? `✔ Cierre Preciso (±${closureErrorCm.toFixed(1)} cm)`
            : `⚠ Descuadre en cinta: ±${closureErrorCm.toFixed(1)} cm (Diag 2 calc: ${calcD24.toFixed(2)}m vs medida: ${d24.toFixed(2)}m)`)
        : `Diagonal 2 Teórica: ${calcD24.toFixed(2)}m (Sin medir en campo)`
    };
  },

  /**
   * Genera la malla interior interpolando bilinealmente sobre el cuadrilátero deformado
   * respetando el patrón de estacas por fila (ej. "5, 7, 7, 7, 5") y la alineación.
   */
  generateQuadrilateralMesh(projId, corners, settings) {
    const { P1, P2, P3, P4 } = corners;
    const rowCounts = settings.rowPattern
      ? settings.rowPattern.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0)
      : [];

    const numRows = rowCounts.length > 0 ? rowCounts.length : (settings.rows || 5);
    const maxCols = rowCounts.length > 0 ? Math.max(...rowCounts) : (settings.cols || 7);
    const alignment = settings.rowAlignment || 'center'; // 'center', 'left', 'right'

    const stakes = [];

    for (let r = 0; r < numRows; r++) {
      const countInRow = rowCounts.length > 0 ? rowCounts[r] : maxCols;
      // Parámetro vertical v en [0, 1] desde borde frontal (r=0) hasta trasero (r=numRows-1)
      const v = numRows > 1 ? r / (numRows - 1) : 0;

      for (let c = 0; c < countInRow; c++) {
        // Cálculo de columna efectiva según alineamiento
        let cEff = c;
        if (alignment === 'center') {
          const offset = (maxCols - countInRow) / 2;
          cEff = offset + c;
        } else if (alignment === 'right') {
          cEff = (maxCols - countInRow) + c;
        } else {
          cEff = c;
        }

        // Parámetro horizontal u en [0, 1]
        const u = maxCols > 1 ? cEff / (maxCols - 1) : 0.5;

        // Interpolación bilineal sobre el cuadrilátero deformado
        // P(u, v) = (1-u)(1-v)*P1 + u(1-v)*P2 + u*v*P3 + (1-u)*v*P4
        const x = (1 - u) * (1 - v) * P1.x + u * (1 - v) * P2.x + u * v * P3.x + (1 - u) * v * P4.x;
        const y = (1 - u) * (1 - v) * P1.y + u * (1 - v) * P2.y + u * v * P3.y + (1 - u) * v * P4.y;

        const code = this.getStakeCode(r, c);
        const designElev = this.calculateDesignElevationAtCoord(x, y, settings, []);

        stakes.push({
          id: `${projId}_${r}_${c}`,
          projId: projId,
          row: r,
          col: c,
          code: code,
          x: Math.round(x * 1000) / 1000,
          y: Math.round(y * 1000) / 1000,
          designElevation: designElev.elevation,
          isCustomDesign: false,
          reading: null,
          measuredElevation: null,
          stationId: null,
          measuredAt: null,
          cutFill: null,
          status: 'PENDIENTE',
          hasPuddleWarning: false,
          puddleReason: null,
          note: ''
        });
      }
    }

    return stakes;
  },

  /**
   * Resuelve la ubicación de la Caja de Pesca por medidas de cinta desde 2 esquinas conocidas
   */
  solveFishingBoxFromCorners(corner1, dist1, corner2, dist2) {
    const c1 = corner1;
    const c2 = corner2;
    const d1 = Number(dist1);
    const d2 = Number(dist2);

    const D = Math.hypot(c2.x - c1.x, c2.y - c1.y);
    if (D < 1e-4) return { success: false, error: 'Las esquinas de referencia no pueden coincidir' };
    if (d1 + d2 < D || Math.abs(d1 - d2) > D) {
      return { success: false, error: 'Las distancias de cinta no se intersectan (triángulo no cierra)' };
    }

    const a = (d1 * d1 - d2 * d2 + D * D) / (2 * D);
    const h = Math.sqrt(Math.max(0, d1 * d1 - a * a));

    const angleBase = Math.atan2(c2.y - c1.y, c2.x - c1.x);

    // Vértice hacia el interior (lado con Y mayor / ángulo positivo)
    const x1 = c1.x + a * Math.cos(angleBase) - h * Math.sin(angleBase);
    const y1 = c1.y + a * Math.sin(angleBase) + h * Math.cos(angleBase);

    return {
      success: true,
      x: Math.round(x1 * 1000) / 1000,
      y: Math.round(y1 * 1000) / 1000
    };
  },

  // Generates stakes array with seed frame, tape quadrilateral, regular grid, or variable row counts
  generateStakes(projId, settings) {
    // 1. Modo Cuadro Semilla Vectorial (Inclinación real U y V con cinta y retiros a ejes)
    if (settings.meshMode === 'seed' || (!settings.meshMode && settings.seedFrame)) {
      let seedRes = settings.seedFrame;
      if (!seedRes || !seedRes.success) {
        seedRes = this.solveSeedFrameVectorial(settings);
      }
      if (seedRes && seedRes.success) {
        return this.generateSeedFrameMesh(projId, seedRes, settings);
      }
    }

    // 2. Modo Cuadrilátero 4 Bordes Cinta
    if (settings.meshMode === 'tape' && settings.tapeCorners) {
      return this.generateQuadrilateralMesh(projId, settings.tapeCorners, settings);
    }

    const stakes = [];
    const dx = settings.dx || 10;
    const dy = settings.dy || 10;
    const rowCounts = settings.rowPattern
      ? settings.rowPattern.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0)
      : [];

    const numRows = rowCounts.length > 0 ? rowCounts.length : (settings.rows || 5);
    const maxCols = rowCounts.length > 0 ? Math.max(...rowCounts) : (settings.cols || 8);
    const alignment = settings.rowAlignment || 'center';

    for (let r = 0; r < numRows; r++) {
      const colsInRow = rowCounts.length > 0 ? rowCounts[r] : (settings.cols || 8);
      for (let c = 0; c < colsInRow; c++) {
        let cEff = c;
        if (alignment === 'center') {
          const offset = (maxCols - colsInRow) / 2;
          cEff = offset + c;
        } else if (alignment === 'right') {
          cEff = (maxCols - colsInRow) + c;
        } else {
          cEff = c;
        }

        const code = this.getStakeCode(r, c);
        const x = Math.round(cEff * dx * 1000) / 1000;
        const y = Math.round(r * dy * 1000) / 1000;
        const designElev = this.calculateDesignElevationAtCoord(x, y, settings, []);

        stakes.push({
          id: `${projId}_${r}_${c}`,
          projId: projId,
          row: r,
          col: c,
          code: code,
          x: x,
          y: y,
          designElevation: designElev.elevation,
          isCustomDesign: false,
          reading: null,
          measuredElevation: null,
          stationId: null,
          measuredAt: null,
          cutFill: null,
          status: 'PENDIENTE',
          hasPuddleWarning: false,
          puddleReason: null,
          note: ''
        });
      }
    }
    return stakes;
  },

  // Solve real angle between two embankments (taludes) using Law of Cosines
  // a = distance on long edge, b = distance on width edge, c = measured diagonal
  solveLawOfCosinesAngle(a, b, c) {
    const numA = Number(a);
    const numB = Number(b);
    const numC = Number(c);

    if (numA <= 0 || numB <= 0 || numC <= 0) {
      return { success: false, error: 'Las distancias deben ser mayores a 0' };
    }
    if (numA + numB <= numC || numA + numC <= numB || numB + numC <= numA) {
      return { success: false, error: 'Las distancias no forman un triángulo válido (no se alcanzan)' };
    }

    const cosTheta = (numA * numA + numB * numB - numC * numC) / (2 * numA * numB);
    const clampedCos = Math.max(-1, Math.min(1, cosTheta));
    const rad = Math.acos(clampedCos);
    const deg = (rad * 180) / Math.PI;

    return {
      success: true,
      angleDeg: Math.round(deg * 100) / 100,
      angleRad: rad,
      cosTheta: clampedCos,
      description: `${deg.toFixed(1)}° (${deg < 89 ? 'Ángulo Agudo' : deg > 91 ? 'Ángulo Obtuso' : 'Escuadra ~90°'})`
    };
  },

  // Generates complete mesh parallel to two real embankments / taludes
  generateTaludMesh(longSectionsStr, widthSectionsStr, angleDeg, settings, projId) {
    // Parse long edge intervals
    const parseIntervals = (str, fallbackStep) => {
      if (!str || !str.trim()) return [fallbackStep, fallbackStep, fallbackStep];
      const parts = str.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
      return parts.length > 0 ? parts : [fallbackStep, fallbackStep, fallbackStep];
    };

    const longIntervals = parseIntervals(longSectionsStr, settings.dx || 10);
    const widthIntervals = parseIntervals(widthSectionsStr, settings.dy || 10);

    // Cumulative distances from origin (0,0)
    const longDists = [0];
    let curL = 0;
    for (const val of longIntervals) {
      curL += val;
      longDists.push(Math.round(curL * 1000) / 1000);
    }

    const widthDists = [0];
    let curW = 0;
    for (const val of widthIntervals) {
      curW += val;
      widthDists.push(Math.round(curW * 1000) / 1000);
    }

    const rad = (Number(angleDeg) * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const stakes = [];
    const numRows = widthDists.length;
    const numCols = longDists.length;

    for (let r = 0; r < numRows; r++) {
      const W = widthDists[r];
      for (let c = 0; c < numCols; c++) {
        const L = longDists[c];

        // Coordinate projection parallel to slopes
        const x = Math.round((L + W * cosA) * 1000) / 1000;
        const y = Math.round((W * sinA) * 1000) / 1000;

        const code = this.getStakeCode(r, c);
        const designElev = this.calculateDesignElevationAtCoord(x, y, settings, []);

        stakes.push({
          id: `${projId}_${r}_${c}`,
          projId: projId,
          row: r,
          col: c,
          code: code,
          x: x,
          y: y,
          designElevation: designElev.elevation,
          isCustomDesign: false,
          reading: null,
          measuredElevation: null,
          stationId: null,
          measuredAt: null,
          cutFill: null,
          status: 'PENDIENTE',
          hasPuddleWarning: false,
          puddleReason: null,
          note: ''
        });
      }
    }

    return {
      stakes,
      numRows,
      numCols,
      longIntervals,
      widthIntervals,
      totalLength: curL,
      totalWidth: curW,
      angleDeg: Number(angleDeg)
    };
  },

  // Exact TIN volume calculation using zero-contour linear subdivision
  // Subdivides mixed triangles into pure Cut (+) and pure Fill (-) sub-volumes
  calculateExactTINVolumes(stakes, triangles, settings) {
    if (!triangles || triangles.length === 0 || !stakes || stakes.length === 0) {
      return this.calculateEarthworkVolumes(stakes, settings);
    }

    let totalCutBank = 0;
    let totalFillGeom = 0;
    let totalAreaMeasured = 0;
    let measuredTrianglesCount = 0;

    for (const tri of triangles) {
      const p1 = stakes[tri[0]];
      const p2 = stakes[tri[1]];
      const p3 = stakes[tri[2]];

      if (!p1 || !p2 || !p3) continue;

      // Only evaluate if all 3 vertices have measured elevations
      if (p1.cutFill === null || p1.cutFill === undefined ||
          p2.cutFill === null || p2.cutFill === undefined ||
          p3.cutFill === null || p3.cutFill === undefined) {
        continue;
      }

      measuredTrianglesCount++;

      // Triangle 2D Area
      const area = 0.5 * Math.abs((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y));
      totalAreaMeasured += area;

      const h1 = p1.cutFill;
      const h2 = p2.cutFill;
      const h3 = p3.cutFill;

      // Tolerance for numerical zero
      const eps = 1e-5;

      // CASE 1: All vertices in pure CUT (h >= 0)
      if (h1 >= -eps && h2 >= -eps && h3 >= -eps) {
        const vCut = area * (Math.max(0, h1) + Math.max(0, h2) + Math.max(0, h3)) / 3;
        totalCutBank += vCut;
        continue;
      }

      // CASE 2: All vertices in pure FILL (h <= 0)
      if (h1 <= eps && h2 <= eps && h3 <= eps) {
        const vFill = area * (Math.abs(h1) + Math.abs(h2) + Math.abs(h3)) / 3;
        totalFillGeom += vFill;
        continue;
      }

      // CASE 3: Mixed Triangle (Zero contour line crosses the triangle)
      const verts = [
        { x: p1.x, y: p1.y, h: h1 },
        { x: p2.x, y: p2.y, h: h2 },
        { x: p3.x, y: p3.y, h: h3 }
      ];

      const pos = verts.filter(v => v.h > 0);
      const neg = verts.filter(v => v.h <= 0);

      if (pos.length === 1 && neg.length === 2) {
        // One positive vertex (A), two negative vertices (B, C)
        const A = pos[0];
        const B = neg[0];
        const C = neg[1];

        const tAB = A.h / (A.h - B.h);
        const tAC = A.h / (A.h - C.h);

        const D = { x: A.x + tAB * (B.x - A.x), y: A.y + tAB * (B.y - A.y), h: 0 };
        const E = { x: A.x + tAC * (C.x - A.x), y: A.y + tAC * (C.y - A.y), h: 0 };

        const areaADE = tAB * tAC * area;
        const vCut = areaADE * A.h / 3;
        totalCutBank += vCut;

        // Quadrilateral BCED split into two triangles (B-C-E and B-E-D)
        const areaBCE = 0.5 * Math.abs((C.x - B.x) * (E.y - B.y) - (E.x - B.x) * (C.y - B.y));
        const areaBED = 0.5 * Math.abs((E.x - B.x) * (D.y - B.y) - (D.x - B.x) * (E.y - B.y));

        const vFillBCE = areaBCE * (Math.abs(B.h) + Math.abs(C.h) + 0) / 3;
        const vFillBED = areaBED * (Math.abs(B.h) + 0 + 0) / 3;
        totalFillGeom += (vFillBCE + vFillBED);

      } else if (neg.length === 1 && pos.length === 2) {
        // One negative vertex (A), two positive vertices (B, C)
        const A = neg[0];
        const B = pos[0];
        const C = pos[1];

        const tAB = Math.abs(A.h) / (Math.abs(A.h) + B.h);
        const tAC = Math.abs(A.h) / (Math.abs(A.h) + C.h);

        const D = { x: A.x + tAB * (B.x - A.x), y: A.y + tAB * (B.y - A.y), h: 0 };
        const E = { x: A.x + tAC * (C.x - A.x), y: A.y + tAC * (C.y - A.y), h: 0 };

        const areaADE = tAB * tAC * area;
        const vFill = areaADE * Math.abs(A.h) / 3;
        totalFillGeom += vFill;

        // Quadrilateral BCED split into two triangles (B-C-E and B-E-D)
        const areaBCE = 0.5 * Math.abs((C.x - B.x) * (E.y - B.y) - (E.x - B.x) * (C.y - B.y));
        const areaBED = 0.5 * Math.abs((E.x - B.x) * (D.y - B.y) - (D.x - B.x) * (E.y - B.y));

        const vCutBCE = areaBCE * (B.h + C.h + 0) / 3;
        const vCutBED = areaBED * (B.h + 0 + 0) / 3;
        totalCutBank += (vCutBCE + vCutBED);
      }
    }

    // Fallback if no full triangles are measured yet: use grid prism method
    if (measuredTrianglesCount === 0) {
      return this.calculateEarthworkVolumes(stakes, settings);
    }

    const netBalance = totalCutBank - totalFillGeom;
    const measuredStakesCount = stakes.filter(s => s.cutFill !== null && s.cutFill !== undefined).length;

    return {
      totalCutVolume: Math.round(totalCutBank * 100) / 100,
      totalFillVolume: Math.round(totalFillGeom * 100) / 100,
      netBalance: Math.round(netBalance * 100) / 100,
      totalAreaMeasured: Math.round(totalAreaMeasured * 100) / 100,
      measuredTrianglesCount,
      totalTrianglesCount: triangles.length,
      measuredCount: measuredStakesCount,
      totalStakes: stakes.length,
      coveragePercent: stakes.length > 0 ? Math.round((measuredStakesCount / stakes.length) * 100) : 0,
      method: 'TIN Exacto con Subdivisión Cota Cero'
    };
  },

  // Presets de Suelo para Nivelación de Lagos (Valores calibrados para excavación real)
  SOIL_PRESETS: {
    mixto: {
      id: 'mixto',
      name: 'Mixto: Peñón + Arcilla Pesada',
      factorLlenadoK: 0.72,
      tiempoCicloSeg: 24,
      esponjamientoPct: 35,
      contraccionPct: 12,
      badge: 'Peñón + Arcilla (Default)',
      description: 'K=0.72 (72%), T=24s, Esponjamiento=35%, Contracción=12%'
    },
    penon: {
      id: 'penon',
      name: 'Peñón Predominante (Roca blanda/cementada)',
      factorLlenadoK: 0.65,
      tiempoCicloSeg: 27,
      esponjamientoPct: 40,
      contraccionPct: 10,
      badge: 'Peñón 40%',
      description: 'K=0.65 (65%), T=27s, Esponjamiento=40%, Contracción=10%'
    },
    arcilla: {
      id: 'arcilla',
      name: 'Arcilla Pesada Húmeda',
      factorLlenadoK: 0.80,
      tiempoCicloSeg: 21,
      esponjamientoPct: 30,
      contraccionPct: 15,
      badge: 'Arcilla Húmeda',
      description: 'K=0.80 (80%), T=21s, Esponjamiento=30%, Contracción=15%'
    }
  },

  // Machinery Scheduling and Volumetric Breakdown (Kobelco 210 LC & Doble Troque)
  calculateMachinerySchedule(volumeData, customParams = {}) {
    const cutBank = volumeData.totalCutVolume || 0;
    const fillGeom = volumeData.totalFillVolume || 0;

    // 1. Equipo: Kobelco 210 LC
    const equipmentName = customParams.equipmentName || 'Kobelco 210 LC';
    const bucketCapQ = customParams.bucketCapQ !== undefined ? Number(customParams.bucketCapQ) : 1.00; // Q = 1.00 m³ colmado
    const efficiencyPct = customParams.efficiencyPct !== undefined ? Number(customParams.efficiencyPct) : 83; // 83% (50 min/h)
    const factorLlenadoK = customParams.factorLlenadoK !== undefined ? Number(customParams.factorLlenadoK) : 0.72; // 0.72 (72%)
    const tiempoCicloSeg = customParams.tiempoCicloSeg !== undefined ? Number(customParams.tiempoCicloSeg) : 24; // 24 seg
    const esponjamientoPct = customParams.esponjamientoPct !== undefined ? Number(customParams.esponjamientoPct) : 35; // 35% (1.35)
    const contraccionPct = customParams.contraccionPct !== undefined ? Number(customParams.contraccionPct) : 12; // 12%
    const horasJornal = customParams.horasJornal !== undefined ? Number(customParams.horasJornal) : 8; // 8 h/día
    const horasPerfilado = customParams.horasPerfilado !== undefined ? Number(customParams.horasPerfilado) : 0.0; // Adicionales perfilado
    const capacidadVolqueta = customParams.capacidadDobleTroque !== undefined ? Number(customParams.capacidadDobleTroque) : 15.5; // 15.5 m³ por defecto
    const tiempoViajeBotaderoMin = customParams.tiempoViajeBotaderoMin !== undefined ? Number(customParams.tiempoViajeBotaderoMin) : 25; // min ida y vuelta
    const compensarRelleno = customParams.compensarRelleno ?? true;
    const soilPreset = customParams.soilPreset || 'mixto';

    const efficiency = efficiencyPct / 100;
    const swellFactor = 1 + esponjamientoPct / 100;
    const shrinkFactor = 1 + contraccionPct / 100;

    // 2. Rendimiento horario Kobelco 210 LC:
    // Ciclos teóricos por hora = 3600 / T
    const ciclosHora = tiempoCicloSeg > 0 ? (3600 / tiempoCicloSeg) : 0;
    // Carga real efectiva por baldada suelta = Q * K
    const volumenEfectivoCucharon = bucketCapQ * factorLlenadoK;
    // Rendimiento en suelto (m³/h sueltos) = (3600 / T) * Q * K * Eficiencia
    const rendimientoSueltoHora = ciclosHora * volumenEfectivoCucharon * efficiency;
    // Rendimiento en banco (m³/h en banco) = Rendimiento suelto / (1 + Esponjamiento/100)
    const rendimientoBancoHora = swellFactor > 0 ? (rendimientoSueltoHora / swellFactor) : 0;

    // 3. Horas de Kobelco 210 LC y Jornales:
    const excavatorHoursBase = rendimientoBancoHora > 0 ? (cutBank / rendimientoBancoHora) : 0;
    const excavatorHoursTotal = excavatorHoursBase + (isNaN(horasPerfilado) ? 0 : horasPerfilado);
    const excavatorDays = horasJornal > 0 ? (excavatorHoursTotal / horasJornal) : 0;

    // 4. Volúmenes Suelto y Banco Requerido para Relleno
    const cutLooseTotal = cutBank * swellFactor;
    const fillBankRequired = fillGeom * shrinkFactor;

    // 5. Compensación en Sitio y Excedentes a Botadero
    let bankUsedOnSite = 0;
    let surplusBankToHaul = 0;
    let deficitBankRequired = 0;

    if (compensarRelleno) {
      bankUsedOnSite = Math.min(cutBank, fillBankRequired);
      surplusBankToHaul = Math.max(0, cutBank - fillBankRequired);
      deficitBankRequired = Math.max(0, fillBankRequired - cutBank);
    } else {
      bankUsedOnSite = 0;
      surplusBankToHaul = cutBank;
      deficitBankRequired = fillBankRequired;
    }

    const surplusLooseToHaul = surplusBankToHaul * swellFactor;

    // 6. Viajes de Volqueta Doble Troque (15, 15.5 o 16 m³ sueltos)
    const tripsTotalCut = capacidadVolqueta > 0 ? Math.ceil(cutLooseTotal / capacidadVolqueta) : 0;
    const tripsSurplusCompensated = capacidadVolqueta > 0 ? Math.ceil(surplusLooseToHaul / capacidadVolqueta) : 0;

    // 7. Datos de Control en Campo para Operador / Chequeador
    // Pases / Baldadas colmadas por camión = Capacidad_Volqueta / (Q * K)
    const baldadasPorCamion = volumenEfectivoCucharon > 0 ? (capacidadVolqueta / volumenEfectivoCucharon) : 0;
    // Tiempo estimado de cargue por volqueta en minutos = (Capacidad_Volqueta / Rendimiento_Suelto) * 60
    const tiempoCargueCamionMin = rendimientoSueltoHora > 0 ? (capacidadVolqueta / rendimientoSueltoHora) * 60 : 0;
    // Flota óptima de volquetas en circuito para trabajo continuo
    const tiempoCicloCompletoCamionMin = tiempoCargueCamionMin + tiempoViajeBotaderoMin;
    const volquetasOptimas = tiempoCargueCamionMin > 0 ? Math.ceil(tiempoCicloCompletoCamionMin / tiempoCargueCamionMin) : 1;

    return {
      cutBank: Math.round(cutBank * 100) / 100,
      fillGeom: Math.round(fillGeom * 100) / 100,
      cutLooseTotal: Math.round(cutLooseTotal * 100) / 100,
      fillBankRequired: Math.round(fillBankRequired * 100) / 100,
      bankUsedOnSite: Math.round(bankUsedOnSite * 100) / 100,
      surplusBankToHaul: Math.round(surplusBankToHaul * 100) / 100,
      surplusLooseToHaul: Math.round(surplusLooseToHaul * 100) / 100,
      deficitBankRequired: Math.round(deficitBankRequired * 100) / 100,
      
      // Kobelco 210 LC
      equipmentName,
      bucketCapQ,
      efficiencyPct,
      factorLlenadoK,
      tiempoCicloSeg,
      ciclosHora: Math.round(ciclosHora * 10) / 10,
      volumenEfectivoCucharon: Math.round(volumenEfectivoCucharon * 1000) / 1000,
      rendimientoSueltoHora: Math.round(rendimientoSueltoHora * 100) / 100,
      rendimientoBancoHora: Math.round(rendimientoBancoHora * 100) / 100,
      excavatorHoursBase: Math.round(excavatorHoursBase * 10) / 10,
      horasPerfilado: Math.round(horasPerfilado * 10) / 10,
      excavatorHours: Math.round(excavatorHoursTotal * 10) / 10,
      excavatorDays: Math.round(excavatorDays * 10) / 10,
      
      // Doble Troque y Chequeador
      capacidadVolqueta,
      tripsTotalCut,
      tripsSurplusCompensated,
      baldadasPorCamion: Math.round(baldadasPorCamion * 10) / 10,
      baldadasExactas: Math.ceil(baldadasPorCamion),
      tiempoCargueCamionMin: Math.round(tiempoCargueCamionMin * 10) / 10,
      tiempoViajeBotaderoMin,
      tiempoCicloCompletoCamionMin: Math.round(tiempoCicloCompletoCamionMin * 10) / 10,
      volquetasOptimas,

      params: {
        soilPreset,
        esponjamientoPct,
        contraccionPct,
        factorLlenadoK,
        tiempoCicloSeg,
        bucketCapQ,
        efficiencyPct,
        rendimientoExcavadora: Math.round(rendimientoBancoHora * 100) / 100,
        horasJornal,
        horasPerfilado,
        capacidadVolqueta,
        tiempoViajeBotaderoMin,
        compensarRelleno
      }
    };
  }
};

window.TopoMath = TopoMath;
