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

    const boxPos = this.getCoordinates(boxRow, boxCol, dx, dy);

    // Check if any stake in the enclosing quadrant has a custom design elevation override
    if (stakes && stakes.length > 0) {
      // Find enclosing cell index
      let c = Math.floor(x / dx);
      let r = Math.floor(y / dy);

      // Clamp to valid quadrant range
      c = Math.max(0, Math.min(cols - 2, c));
      r = Math.max(0, Math.min(rows - 2, r));

      const stakeMap = new Map();
      stakes.forEach(s => stakeMap.set(`${s.row}_${s.col}`, s));

      const q00 = stakeMap.get(`${r}_${c}`);
      const q10 = stakeMap.get(`${r}_${c + 1}`);
      const q01 = stakeMap.get(`${r + 1}_${c}`);
      const q11 = stakeMap.get(`${r + 1}_${c + 1}`);

      if (q00 && q10 && q01 && q11) {
        const hasCustom = q00.isCustomDesign || q10.isCustomDesign || q01.isCustomDesign || q11.isCustomDesign;

        if (hasCustom) {
          // Perform Bilinear Interpolation
          const x0 = c * dx;
          const y0 = r * dy;
          const u = Math.max(0, Math.min(1, (x - x0) / dx));
          const v = Math.max(0, Math.min(1, (y - y0) / dy));

          const z00 = q00.designElevation;
          const z10 = q10.designElevation;
          const z01 = q01.designElevation;
          const z11 = q11.designElevation;

          const interpolatedZ = (1 - u) * (1 - v) * z00 +
                                u * (1 - v) * z10 +
                                (1 - u) * v * z01 +
                                u * v * z11;

          return {
            elevation: Math.round(interpolatedZ * 1000) / 1000,
            method: 'Interpolación Bilineal',
            isBilinear: true,
            quadrant: [q00.code, q10.code, q01.code, q11.code],
            weights: { u: Math.round(u * 100), v: Math.round(v * 100) }
          };
        }
      }
    }

    // Pure mathematical formula based on drainage slope mode
    const deltaX = Math.abs(x - boxPos.x);
    const deltaY = Math.abs(y - boxPos.y);

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
  }
};

window.TopoMath = TopoMath;
