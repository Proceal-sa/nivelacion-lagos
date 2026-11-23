/**
 * app.js - Controlador Principal de la PWA TopoPiscícola Pro
 * Flujo de campo optimizado para celulares en exteriores
 */

(function () {
  'use strict';

  // --- ESTADO DE LA APLICACIÓN ---
  const state = {
    project: null,
    stakes: [],
    stations: [],
    auxPoints: [],
    activeStation: null,
    currentStakeIndex: 0,
    modalReadingBuffer: '',
    drainageWarnings: [],
    earthworkSummary: null
  };

  // --- ELEMENTOS DEL DOM ---
  const dom = {};

  function cacheDomElements() {
    // Header & Banners
    dom.pondNameHeader = document.getElementById('header-pond-name');
    dom.bannerStationName = document.getElementById('banner-station-name');
    dom.bannerHI = document.getElementById('banner-hi-val');
    dom.btnToggleTheme = document.getElementById('btn-toggle-theme');

    // Tabs
    dom.tabBtns = document.querySelectorAll('.tab-btn');
    dom.tabPanes = document.querySelectorAll('.tab-pane');

    // Tab Cuadrícula
    dom.lakeGridTable = document.getElementById('lake-grid-table');
    dom.gridProgressText = document.getElementById('grid-progress-text');
    dom.gridTolText = document.getElementById('grid-tol-text');
    dom.puddleGlobalAlert = document.getElementById('puddle-global-alert');
    dom.puddleAlertDesc = document.getElementById('puddle-alert-desc');
    dom.btnQuickPC = document.getElementById('btn-quick-pc');
    dom.btnQuickOffset = document.getElementById('btn-quick-offset');

    // Tab Configuración
    dom.cfgPondName = document.getElementById('cfg-pond-name');
    dom.cfgRows = document.getElementById('cfg-rows');
    dom.cfgCols = document.getElementById('cfg-cols');
    dom.cfgDx = document.getElementById('cfg-dx');
    dom.cfgDy = document.getElementById('cfg-dy');
    dom.cfgBoxRow = document.getElementById('cfg-box-row');
    dom.cfgBoxCol = document.getElementById('cfg-box-col');
    dom.cfgBoxElev = document.getElementById('cfg-box-elev');
    dom.cfgSlopeMode = document.getElementById('cfg-slope-mode');
    dom.cfgSlopeX = document.getElementById('cfg-slope-x');
    dom.cfgSlopeY = document.getElementById('cfg-slope-y');
    dom.cfgSlopeRadial = document.getElementById('cfg-slope-radial');
    dom.cfgOrthogonalFields = document.getElementById('cfg-orthogonal-fields');
    dom.cfgRadialFields = document.getElementById('cfg-radial-fields');
    dom.cfgTolerance = document.getElementById('cfg-tolerance');
    dom.btnSaveConfig = document.getElementById('btn-save-config');

    // Tab Armada / Estación
    dom.stBmName = document.getElementById('st-bm-name');
    dom.stBmElev = document.getElementById('st-bm-elev');
    dom.stBacksight = document.getElementById('st-backsight');
    dom.stCalculatedHI = document.getElementById('st-calculated-hi');
    dom.btnSaveNewStation = document.getElementById('btn-save-new-station');
    dom.btnOpenPCModal = document.getElementById('btn-open-pc-modal');
    dom.stationsTableBody = document.getElementById('stations-table-body');

    // Tab Auxiliares
    dom.auxPointName = document.getElementById('aux-point-name');
    dom.auxReading = document.getElementById('aux-reading');
    dom.auxDesign = document.getElementById('aux-design');
    dom.auxNote = document.getElementById('aux-note');
    dom.btnSaveAuxPoint = document.getElementById('btn-save-aux-point');
    dom.auxTableBody = document.getElementById('aux-table-body');

    // Tab Cartera & CSV
    dom.sumCutVol = document.getElementById('sum-cut-vol');
    dom.sumCutStakes = document.getElementById('sum-cut-stakes');
    dom.sumFillVol = document.getElementById('sum-fill-vol');
    dom.sumFillStakes = document.getElementById('sum-fill-stakes');
    dom.sumBalanceVol = document.getElementById('sum-balance-vol');
    dom.sumBalanceDesc = document.getElementById('sum-balance-desc');
    dom.expSeparator = document.getElementById('exp-separator');
    dom.expDecimal = document.getElementById('exp-decimal');
    dom.btnExportCsv = document.getElementById('btn-export-csv');
    dom.btnExportJsonBackup = document.getElementById('btn-export-json-backup');
    dom.carteraTableBody = document.getElementById('cartera-table-body');

    // Modal Lectura de Estaca & Teclado
    dom.modalStakeInput = document.getElementById('modal-stake-input');
    dom.mStakeCode = document.getElementById('m-stake-code');
    dom.mCustomBadge = document.getElementById('m-custom-badge');
    dom.mBtnPrev = document.getElementById('m-btn-prev');
    dom.mBtnNext = document.getElementById('m-btn-next');
    dom.mBtnClose = document.getElementById('m-btn-close');
    dom.mIdealReading = document.getElementById('m-ideal-reading');
    dom.mReadingDisplay = document.getElementById('m-reading-display');
    dom.mResDesign = document.getElementById('m-res-design');
    dom.mResGround = document.getElementById('m-res-ground');
    dom.mLiveStatusBadge = document.getElementById('m-live-status-badge');
    dom.mPuddleNote = document.getElementById('m-puddle-note');
    dom.mPuddleDesc = document.getElementById('m-puddle-desc');
    dom.mBtnOffset = document.getElementById('m-btn-offset');
    dom.mBtnEditDesign = document.getElementById('m-btn-edit-design');
    dom.mBtnAddNote = document.getElementById('m-btn-add-note');
    dom.virtualKeypad = document.querySelector('.virtual-keypad');

    // Modal Punto Intermedio (Desfase)
    dom.modalOffsetPoint = document.getElementById('modal-offset-point');
    dom.offBtnClose = document.getElementById('off-btn-close');
    dom.offBaseStake = document.getElementById('off-base-stake');
    dom.offDxInput = document.getElementById('off-dx-input');
    dom.offDyInput = document.getElementById('off-dy-input');
    dom.offQuadrantCanvas = document.getElementById('off-quadrant-canvas');
    dom.offCoordDisplay = document.getElementById('off-coord-display');
    dom.offMethodBadge = document.getElementById('off-method-badge');
    dom.offIdealReading = document.getElementById('off-ideal-reading');
    dom.offResDesign = document.getElementById('off-res-design');
    dom.offHiVal = document.getElementById('off-hi-val');
    dom.offReadingInput = document.getElementById('off-reading-input');
    dom.offResGround = document.getElementById('off-res-ground');
    dom.offStatusBadge = document.getElementById('off-status-badge');
    dom.offPointTag = document.getElementById('off-point-tag');
    dom.offBtnSavePoint = document.getElementById('off-btn-save-point');
    dom.offsetStepBtns = document.querySelectorAll('.offset-step-btn');

    // Modal Punto de Cambio (PC)
    dom.modalPCAssistant = document.getElementById('modal-pc-assistant');
    dom.pcBtnClose = document.getElementById('pc-btn-close');
    dom.pcCurrentHIDesc = document.getElementById('pc-current-hi-desc');
    dom.pcForesight = document.getElementById('pc-foresight');
    dom.pcCalculatedGround = document.getElementById('pc-calculated-ground');
    dom.pcBacksight = document.getElementById('pc-backsight');
    dom.pcNewHI = document.getElementById('pc-new-hi');
    dom.pcStationName = document.getElementById('pc-station-name');
    dom.pcBtnSaveConfirm = document.getElementById('pc-btn-save-confirm');

    // Modal Edición Cota Diseño
    dom.modalEditDesign = document.getElementById('modal-edit-design');
    dom.edStakeCode = document.getElementById('ed-stake-code');
    dom.edBtnClose = document.getElementById('ed-btn-close');
    dom.edInputElevation = document.getElementById('ed-input-elevation');
    dom.edBtnSave = document.getElementById('ed-btn-save');
    dom.edBtnReset = document.getElementById('ed-btn-reset');
  }

  // --- INICIALIZACIÓN DE LA APLICACIÓN ---
  async function initApp() {
    cacheDomElements();
    initTheme();
    setupEventListeners();

    try {
      await window.topoDB.init();
      const projects = await window.topoDB.getAllProjects();

      if (projects.length === 0) {
        // Crear proyecto inicial por defecto si la base de datos está vacía
        state.project = await createDefaultProject();
      } else {
        // Cargar el proyecto más reciente
        projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        state.project = projects[0];
      }

      await loadProjectData(state.project.id);
      renderAll();
    } catch (err) {
      console.error('Error inicializando app:', err);
      alert('Error inicializando base de datos local: ' + err.message);
    }
  }

  // --- CREAR PROYECTO INICIAL POR DEFECTO ---
  async function createDefaultProject() {
    const projId = 'proj_' + Date.now();
    const defaultProject = {
      id: projId,
      name: 'Lago 1 - Sector Tilapia',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        rows: 5,           // Filas A..E
        cols: 8,           // Columnas 1..8
        dx: 10.0,          // 10 metros entre columnas
        dy: 10.0,          // 10 metros entre filas
        boxRow: 0,         // Fila A
        boxCol: 0,         // Columna 1
        boxElevation: 100.000, // Cota de Diseño más baja en la caja
        slopeMode: 'orthogonal', // Doble pendiente ortogonal
        slopeX: 0.50,      // 0.5% longitudinal hacia la caja
        slopeY: 0.80,      // 0.8% transversal hacia el eje de cosecha
        slopeRadial: 0.60, // 0.6% radial
        toleranceCm: 2.0,  // ±2.0 cm
        currentStationId: null
      }
    };

    await window.topoDB.saveProject(defaultProject);

    // Crear Armada Inicial (Estación de Referencia)
    const initialStation = {
      id: 'st_' + Date.now(),
      projId: projId,
      name: 'Armada 1 (BM Inicial)',
      createdAt: new Date().toISOString(),
      bmName: 'BM-1 (Mojón Corona Dique)',
      bmElevation: 102.500,
      backsight: 1.250,
      hi: 103.750,
      foresightOnPrev: null,
      isActive: true
    };
    await window.topoDB.saveStation(initialStation);
    defaultProject.settings.currentStationId = initialStation.id;
    await window.topoDB.saveProject(defaultProject);

    // Generar estacas de la cuadrícula
    const stakes = [];
    for (let r = 0; r < defaultProject.settings.rows; r++) {
      for (let c = 0; c < defaultProject.settings.cols; c++) {
        const code = window.TopoMath.getStakeCode(r, c);
        const coords = window.TopoMath.getCoordinates(r, c, defaultProject.settings.dx, defaultProject.settings.dy);
        const designElev = window.TopoMath.calculateDesignElevation(r, c, defaultProject.settings);

        stakes.push({
          id: `${projId}_${r}_${c}`,
          projId: projId,
          row: r,
          col: c,
          code: code,
          x: coords.x,
          y: coords.y,
          designElevation: designElev,
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
    await window.topoDB.saveStakesBulk(stakes);

    return defaultProject;
  }

  // --- CARGAR DATOS COMPLETOS DEL PROYECTO ---
  async function loadProjectData(projId) {
    state.project = await window.topoDB.getProject(projId);
    state.stakes = await window.topoDB.getStakes(projId);
    state.stations = await window.topoDB.getStations(projId);
    state.auxPoints = await window.topoDB.getAuxPoints(projId);

    // Ordenar estacas por fila y luego columna
    state.stakes.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    // Identificar estación activa
    state.activeStation = state.stations.find(s => s.id === state.project.settings.currentStationId) ||
                          state.stations.find(s => s.isActive) ||
                          state.stations[0] || null;

    if (state.activeStation && !state.activeStation.isActive) {
      await window.topoDB.setActiveStation(projId, state.activeStation.id);
      state.activeStation.isActive = true;
    }

    // Ejecutar análisis de drenaje y cálculo de volúmenes
    updateCalculations();
  }

  // --- ACTUALIZAR CÁLCULOS DERIVADOS ---
  function updateCalculations() {
    state.drainageWarnings = window.TopoMath.analyzeDrainage(state.stakes, state.project.settings);
    state.earthworkSummary = window.TopoMath.calculateEarthworkVolumes(state.stakes, state.project.settings);
  }

  // --- RENDERIZADO GLOBAL ---
  function renderAll() {
    renderHeaderAndBanners();
    renderGridTab();
    renderConfigTab();
    renderStationTab();
    renderAuxTab();
    renderExportTab();
  }

  // --- 1. HEADER Y BANNERS ---
  function renderHeaderAndBanners() {
    if (dom.pondNameHeader && state.project) {
      dom.pondNameHeader.textContent = `Lago: ${state.project.name}`;
    }

    if (state.activeStation) {
      dom.bannerStationName.textContent = `📍 ${state.activeStation.name} [BM: ${state.activeStation.bmName}]`;
      dom.bannerHI.textContent = `${state.activeStation.hi.toFixed(3)} m`;
    } else {
      dom.bannerStationName.textContent = '📍 Sin Armada Activa';
      dom.bannerHI.textContent = '---.--- m';
    }
  }

  // --- 2. PESTAÑA CUADRÍCULA VISUAL ---
  function renderGridTab() {
    if (!state.project || !state.stakes) return;

    const rows = state.project.settings.rows;
    const cols = state.project.settings.cols;
    const boxRow = state.project.settings.boxRow ?? 0;
    const boxCol = state.project.settings.boxCol ?? 0;
    const tolMeters = (state.project.settings.toleranceCm || 2.0) / 100;

    // Alerta de empozamiento / contrapendiente
    if (state.drainageWarnings.length > 0) {
      dom.puddleGlobalAlert.style.display = 'flex';
      dom.puddleAlertDesc.textContent = `Se detectó contrapendiente en ${state.drainageWarnings.length} estaca(s) hacia la caja de pesca. Riesgo de charcos durante el vaciado.`;
    } else {
      dom.puddleGlobalAlert.style.display = 'none';
    }

    // Progreso de estacas
    const measuredCount = state.stakes.filter(s => s.reading !== null && s.reading !== undefined).length;
    const totalCount = state.stakes.length;
    const pct = totalCount > 0 ? Math.round((measuredCount / totalCount) * 100) : 0;
    dom.gridProgressText.textContent = `Medidas: ${measuredCount} / ${totalCount} (${pct}%)`;
    dom.gridTolText.textContent = `Tolerancia 'A Nivel': ±${(tolMeters * 100).toFixed(0)} cm`;

    // Renderizar tabla HTML de la cuadrícula
    let html = '';

    // Encabezado de columnas (Números 1..Cols)
    html += '<thead><tr><th class="stake-header-cell">#</th>';
    for (let c = 0; c < cols; c++) {
      html += `<th class="stake-header-cell">${c + 1}</th>`;
    }
    html += '</tr></thead><tbody>';

    // Filas (Letras A..Rows)
    for (let r = 0; r < rows; r++) {
      const rowLetter = window.TopoMath.rowToLetter(r);
      html += `<tr><th class="stake-header-cell">${rowLetter}</th>`;

      for (let c = 0; c < cols; c++) {
        const stake = state.stakes.find(s => s.row === r && s.col === c);
        if (!stake) {
          html += '<td></td>';
          continue;
        }

        const isCaja = (r === boxRow && c === boxCol);
        let cellClass = 'stake-cell';
        let diffHtml = '';

        if (isCaja) cellClass += ' is-caja';
        if (stake.hasPuddleWarning) cellClass += ' has-warning';

        if (stake.reading === null || stake.reading === undefined) {
          cellClass += ' unmeasured';
          diffHtml = '<span class="stake-diff-val" style="color:#9ca3af;">--</span>';
        } else {
          const evalRes = window.TopoMath.evaluateStatus(stake.cutFill, tolMeters);
          if (evalRes.status === 'A_NIVEL') {
            cellClass += ' a-nivel';
            diffHtml = `<span class="stake-diff-val" style="color:var(--nivel-text);">✔ NIVEL</span>`;
          } else if (evalRes.status === 'CORTE') {
            cellClass += ' corte';
            diffHtml = `<span class="stake-diff-val" style="color:var(--corte-text);">${stake.cutFill > 0 ? '+' : ''}${stake.cutFill.toFixed(2)}m</span>`;
          } else {
            cellClass += ' relleno';
            diffHtml = `<span class="stake-diff-val" style="color:var(--relleno-text);">${stake.cutFill.toFixed(2)}m</span>`;
          }
        }

        html += `
          <td class="${cellClass}" data-row="${r}" data-col="${c}" data-id="${stake.id}">
            <div class="stake-code">${stake.code}</div>
            <div class="stake-design-val">${stake.designElevation.toFixed(2)}</div>
            ${diffHtml}
          </td>
        `;
      }
      html += '</tr>';
    }
    html += '</tbody>';

    dom.lakeGridTable.innerHTML = html;

    // Asignar eventos de clic a cada celda de estaca
    const cells = dom.lakeGridTable.querySelectorAll('.stake-cell');
    cells.forEach(cell => {
      cell.addEventListener('click', () => {
        const r = parseInt(cell.getAttribute('data-row'), 10);
        const c = parseInt(cell.getAttribute('data-col'), 10);
        openStakeModalByCoord(r, c);
      });
    });
  }

  // --- 3. MODAL DE ENTRADA Y TECLADO TÁCTIL (CADENERO) ---
  function openStakeModalByCoord(row, col) {
    const idx = state.stakes.findIndex(s => s.row === row && s.col === col);
    if (idx !== -1) {
      state.currentStakeIndex = idx;
      openStakeModal();
    }
  }

  function openStakeModal() {
    const stake = state.stakes[state.currentStakeIndex];
    if (!stake) return;

    if (!state.activeStation) {
      alert('Atención: Configure primero una Armada (Altura Instrumental HI) para poder tomar lecturas.');
      switchTab('tab-station');
      return;
    }

    // Inicializar buffer con lectura previa si existe
    if (stake.reading !== null && stake.reading !== undefined) {
      state.modalReadingBuffer = stake.reading.toFixed(3);
    } else {
      state.modalReadingBuffer = '';
    }

    updateStakeModalUI();
    dom.modalStakeInput.classList.add('open');
  }

  function closeStakeModal() {
    dom.modalStakeInput.classList.remove('open');
    renderGridTab();
    renderExportTab();
  }

  function updateStakeModalUI() {
    const stake = state.stakes[state.currentStakeIndex];
    if (!stake || !state.activeStation) return;

    dom.mStakeCode.textContent = stake.code;
    dom.mCustomBadge.style.display = stake.isCustomDesign ? 'inline-block' : 'none';

    // Lectura Ideal de Mira = HI - Cota Diseño
    const idealReading = window.TopoMath.calculateIdealReading(state.activeStation.hi, stake.designElevation);
    dom.mIdealReading.textContent = `${idealReading.toFixed(3)} m`;

    // Cota Rasante
    dom.mResDesign.textContent = `${stake.designElevation.toFixed(3)} m`;

    // Buffer de pantalla
    const displayVal = state.modalReadingBuffer === '' ? '0.000' : state.modalReadingBuffer;
    dom.mReadingDisplay.textContent = displayVal;

    // Cálculos instantáneos en vivo
    const numReading = parseFloat(state.modalReadingBuffer);
    const tolMeters = (state.project.settings.toleranceCm || 2.0) / 100;

    if (!isNaN(numReading) && state.modalReadingBuffer !== '') {
      const groundElev = window.TopoMath.calculateGroundElevation(state.activeStation.hi, numReading);
      const cutFill = window.TopoMath.calculateCutFill(groundElev, stake.designElevation);
      const evalRes = window.TopoMath.evaluateStatus(cutFill, tolMeters);

      dom.mResGround.textContent = `${groundElev.toFixed(3)} m`;

      dom.mLiveStatusBadge.className = `live-status-badge ${evalRes.status.toLowerCase().replace('_', '-')}`;
      dom.mLiveStatusBadge.textContent = evalRes.fullText;
    } else {
      if (stake.measuredElevation !== null && stake.measuredElevation !== undefined) {
        dom.mResGround.textContent = `${stake.measuredElevation.toFixed(3)} m`;
        const evalRes = window.TopoMath.evaluateStatus(stake.cutFill, tolMeters);
        dom.mLiveStatusBadge.className = `live-status-badge ${evalRes.status.toLowerCase().replace('_', '-')}`;
        dom.mLiveStatusBadge.textContent = evalRes.fullText;
      } else {
        dom.mResGround.textContent = '---.--- m';
        dom.mLiveStatusBadge.className = 'live-status-badge pendiente';
        dom.mLiveStatusBadge.textContent = 'DIGITE LA LECTURA';
      }
    }

    // Nota de contrapendiente
    if (stake.hasPuddleWarning && stake.puddleReason) {
      dom.mPuddleNote.style.display = 'flex';
      dom.mPuddleDesc.textContent = stake.puddleReason;
    } else {
      dom.mPuddleNote.style.display = 'none';
    }
  }

  // Manejador del Teclado Numérico Táctil
  async function handleKeypadPress(key) {
    // Haptic feedback en dispositivos móviles compatibles
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }

    if (key >= '0' && key <= '9') {
      if (state.modalReadingBuffer.length >= 7) return;
      state.modalReadingBuffer += key;
    } else if (key === '.') {
      if (!state.modalReadingBuffer.includes('.')) {
        if (state.modalReadingBuffer === '') state.modalReadingBuffer = '0.';
        else state.modalReadingBuffer += '.';
      }
    } else if (key === 'backspace') {
      state.modalReadingBuffer = state.modalReadingBuffer.slice(0, -1);
    } else if (key === 'clear') {
      state.modalReadingBuffer = '';
    } else if (key === '+0.01' || key === '-0.01') {
      let current = parseFloat(state.modalReadingBuffer) || 0;
      current += (key === '+0.01' ? 0.01 : -0.01);
      if (current < 0) current = 0;
      state.modalReadingBuffer = current.toFixed(3);
    } else if (key === 'delete-reading') {
      await deleteCurrentStakeReading();
      return;
    } else if (key === 'save-stay') {
      await saveCurrentStakeReading(false);
      return;
    } else if (key === 'save-next') {
      await saveCurrentStakeReading(true);
      return;
    }

    updateStakeModalUI();
  }

  // Guardar lectura de la estaca activa
  async function saveCurrentStakeReading(advanceToNext = true) {
    const stake = state.stakes[state.currentStakeIndex];
    if (!stake || !state.activeStation) return;

    const numReading = parseFloat(state.modalReadingBuffer);
    if (isNaN(numReading)) {
      alert('Por favor ingrese una lectura válida en metros.');
      return;
    }

    const groundElev = window.TopoMath.calculateGroundElevation(state.activeStation.hi, numReading);
    const cutFill = window.TopoMath.calculateCutFill(groundElev, stake.designElevation);
    const tolMeters = (state.project.settings.toleranceCm || 2.0) / 100;
    const evalRes = window.TopoMath.evaluateStatus(cutFill, tolMeters);

    stake.reading = numReading;
    stake.measuredElevation = groundElev;
    stake.stationId = state.activeStation.id;
    stake.measuredAt = new Date().toISOString();
    stake.cutFill = cutFill;
    stake.status = evalRes.status;

    await window.topoDB.saveStake(stake);
    updateCalculations();

    if (advanceToNext) {
      // Avanzar a la siguiente estaca
      if (state.currentStakeIndex < state.stakes.length - 1) {
        state.currentStakeIndex++;
        const nextStake = state.stakes[state.currentStakeIndex];
        state.modalReadingBuffer = (nextStake.reading !== null && nextStake.reading !== undefined) ? nextStake.reading.toFixed(3) : '';
        updateStakeModalUI();
      } else {
        alert('🎉 ¡Ha completado la medición de todas las estacas del lago!');
        closeStakeModal();
      }
    } else {
      updateStakeModalUI();
    }
  }

  // Eliminar lectura de la estaca activa
  async function deleteCurrentStakeReading() {
    const stake = state.stakes[state.currentStakeIndex];
    if (!stake) return;

    if (confirm(`¿Eliminar la medición de la estaca ${stake.code}?`)) {
      stake.reading = null;
      stake.measuredElevation = null;
      stake.stationId = null;
      stake.measuredAt = null;
      stake.cutFill = null;
      stake.status = 'PENDIENTE';
      stake.hasPuddleWarning = false;
      stake.puddleReason = null;

      await window.topoDB.saveStake(stake);
      updateCalculations();
      state.modalReadingBuffer = '';
      updateStakeModalUI();
    }
  }

  // --- 4. PESTAÑA CONFIGURACIÓN DEL LAGO ---
  function renderConfigTab() {
    if (!state.project) return;
    const s = state.project.settings;

    dom.cfgPondName.value = state.project.name || '';
    dom.cfgRows.value = s.rows;
    dom.cfgCols.value = s.cols;
    dom.cfgDx.value = s.dx;
    dom.cfgDy.value = s.dy;
    dom.cfgBoxElev.value = s.boxElevation.toFixed(3);
    dom.cfgSlopeMode.value = s.slopeMode || 'orthogonal';
    dom.cfgSlopeX.value = s.slopeX ?? 0.50;
    dom.cfgSlopeY.value = s.slopeY ?? 0.80;
    dom.cfgSlopeRadial.value = s.slopeRadial ?? 0.60;
    dom.cfgTolerance.value = s.toleranceCm ?? 2.0;

    // Actualizar selects de fila y columna de la caja
    updateBoxSelectOptions(s.rows, s.cols, s.boxRow, s.boxCol);

    // Visibilidad de campos según modo de pendiente
    updateSlopeModeFields(s.slopeMode);
  }

  function updateBoxSelectOptions(rows, cols, selectedRow, selectedCol) {
    let rowOpts = '';
    for (let r = 0; r < rows; r++) {
      const letter = window.TopoMath.rowToLetter(r);
      const isSel = (r === selectedRow) ? 'selected' : '';
      rowOpts += `<option value="${r}" ${isSel}>Fila ${letter}</option>`;
    }
    dom.cfgBoxRow.innerHTML = rowOpts;

    let colOpts = '';
    for (let c = 0; c < cols; c++) {
      const isSel = (c === selectedCol) ? 'selected' : '';
      colOpts += `<option value="${c}" ${isSel}>Columna ${c + 1}</option>`;
    }
    dom.cfgBoxCol.innerHTML = colOpts;
  }

  function updateSlopeModeFields(mode) {
    if (mode === 'orthogonal') {
      dom.cfgOrthogonalFields.style.display = 'block';
      dom.cfgRadialFields.style.display = 'none';
    } else {
      dom.cfgOrthogonalFields.style.display = 'none';
      dom.cfgRadialFields.style.display = 'block';
    }
  }

  async function savePondConfig() {
    const newName = dom.cfgPondName.value.trim() || 'Lago Piscícola';
    const newRows = parseInt(dom.cfgRows.value, 10);
    const newCols = parseInt(dom.cfgCols.value, 10);
    const newDx = parseFloat(dom.cfgDx.value);
    const newDy = parseFloat(dom.cfgDy.value);
    const newBoxRow = parseInt(dom.cfgBoxRow.value, 10);
    const newBoxCol = parseInt(dom.cfgBoxCol.value, 10);
    const newBoxElev = parseFloat(dom.cfgBoxElev.value);
    const newSlopeMode = dom.cfgSlopeMode.value;
    const newSlopeX = parseFloat(dom.cfgSlopeX.value);
    const newSlopeY = parseFloat(dom.cfgSlopeY.value);
    const newSlopeRadial = parseFloat(dom.cfgSlopeRadial.value);
    const newTolerance = parseFloat(dom.cfgTolerance.value);

    if (isNaN(newRows) || isNaN(newCols) || newRows < 2 || newCols < 2) {
      alert('Ingrese dimensiones válidas (mínimo 2 filas y 2 columnas).');
      return;
    }

    const s = state.project.settings;
    s.rows = newRows;
    s.cols = newCols;
    s.dx = newDx;
    s.dy = newDy;
    s.boxRow = newBoxRow;
    s.boxCol = newBoxCol;
    s.boxElevation = newBoxElev;
    s.slopeMode = newSlopeMode;
    s.slopeX = newSlopeX;
    s.slopeY = newSlopeY;
    s.slopeRadial = newSlopeRadial;
    s.toleranceCm = newTolerance;
    state.project.name = newName;

    // Reconstruir o actualizar malla de estacas
    const existingStakesMap = new Map();
    state.stakes.forEach(st => existingStakesMap.set(`${st.row}_${st.col}`, st));

    const updatedStakes = [];
    for (let r = 0; r < newRows; r++) {
      for (let c = 0; c < newCols; c++) {
        const key = `${r}_${c}`;
        const existing = existingStakesMap.get(key);
        const code = window.TopoMath.getStakeCode(r, c);
        const coords = window.TopoMath.getCoordinates(r, c, newDx, newDy);

        let designElev;
        let isCustom = false;

        if (existing && existing.isCustomDesign) {
          designElev = existing.designElevation;
          isCustom = true;
        } else {
          designElev = window.TopoMath.calculateDesignElevation(r, c, s);
        }

        let reading = existing ? existing.reading : null;
        let groundElev = existing ? existing.measuredElevation : null;
        let stationId = existing ? existing.stationId : null;
        let cutFill = null;
        let status = 'PENDIENTE';

        if (groundElev !== null && groundElev !== undefined) {
          cutFill = window.TopoMath.calculateCutFill(groundElev, designElev);
          const tolM = newTolerance / 100;
          status = window.TopoMath.evaluateStatus(cutFill, tolM).status;
        }

        updatedStakes.push({
          id: `${state.project.id}_${r}_${c}`,
          projId: state.project.id,
          row: r,
          col: c,
          code: code,
          x: coords.x,
          y: coords.y,
          designElevation: designElev,
          isCustomDesign: isCustom,
          reading: reading,
          measuredElevation: groundElev,
          stationId: stationId,
          measuredAt: existing ? existing.measuredAt : null,
          cutFill: cutFill,
          status: status,
          hasPuddleWarning: false,
          puddleReason: null,
          note: existing ? existing.note : ''
        });
      }
    }

    await window.topoDB.clearStakesForProject(state.project.id);
    await window.topoDB.saveStakesBulk(updatedStakes);
    await window.topoDB.saveProject(state.project);

    state.stakes = updatedStakes;
    updateCalculations();
    renderAll();

    alert('✔ Configuración guardada y rasantes recalculadas correctamente.');
    switchTab('tab-grid');
  }

  // --- 5. PESTAÑA ARMADA & PUNTOS DE CAMBIO (PC) ---
  function renderStationTab() {
    updateStationCalculationPreview();

    // Renderizar historial de armadas
    let html = '';
    state.stations.forEach(st => {
      const isActive = (state.activeStation && st.id === state.activeStation.id);
      const rowClass = isActive ? 'active-row' : '';
      const statusBadge = isActive ? '<span style="color:#16a34a; font-weight:900;">★ ACTIVA</span>' : '<span style="color:#6b7280;">Histórica</span>';

      html += `
        <tr class="${rowClass}">
          <td>${statusBadge}</td>
          <td>${st.name}</td>
          <td>${st.bmName}</td>
          <td class="mono-num">${st.bmElevation.toFixed(3)}</td>
          <td class="mono-num">${st.backsight.toFixed(3)}</td>
          <td class="mono-num" style="font-weight:900;">${st.hi.toFixed(3)}</td>
          <td>
            ${!isActive ? `<button class="btn btn-outline" style="min-height:30px; padding:2px 8px; font-size:0.75rem;" onclick="window.activateStationById('${st.id}')">Activar</button>` : 'En uso'}
          </td>
        </tr>
      `;
    });

    dom.stationsTableBody.innerHTML = html;
  }

  function updateStationCalculationPreview() {
    const bm = parseFloat(dom.stBmElev.value) || 0;
    const bs = parseFloat(dom.stBacksight.value) || 0;
    const hi = window.TopoMath.calculateHI(bm, bs);
    dom.stCalculatedHI.textContent = `HI = ${hi.toFixed(3)} m`;
  }

  async function saveNewStation() {
    const name = dom.stBmName.value.trim() || 'Armada';
    const bm = parseFloat(dom.stBmElev.value);
    const bs = parseFloat(dom.stBacksight.value);

    if (isNaN(bm) || isNaN(bs)) {
      alert('Ingrese valores numéricos válidos para la cota del BM y la Vista Atrás (V+).');
      return;
    }

    const hi = window.TopoMath.calculateHI(bm, bs);
    const newStation = {
      id: 'st_' + Date.now(),
      projId: state.project.id,
      name: `Armada ${state.stations.length + 1}`,
      createdAt: new Date().toISOString(),
      bmName: name,
      bmElevation: bm,
      backsight: bs,
      hi: hi,
      foresightOnPrev: null,
      isActive: true
    };

    await window.topoDB.saveStation(newStation);
    await window.topoDB.setActiveStation(state.project.id, newStation.id);

    state.stations = await window.topoDB.getStations(state.project.id);
    state.activeStation = newStation;

    renderHeaderAndBanners();
    renderStationTab();
    alert(`✔ Nueva armada activada con éxito. Altura Instrumental HI = ${hi.toFixed(3)} m`);
  }

  window.activateStationById = async function (stationId) {
    await window.topoDB.setActiveStation(state.project.id, stationId);
    state.stations = await window.topoDB.getStations(state.project.id);
    state.activeStation = state.stations.find(s => s.id === stationId);
    renderHeaderAndBanners();
    renderStationTab();
  };

  // Asistente de Punto de Cambio (PC)
  function openPCAssistant() {
    if (!state.activeStation) {
      alert('Debe tener una Armada inicial activa para realizar un Punto de Cambio.');
      return;
    }

    dom.pcCurrentHIDesc.textContent = `HI = ${state.activeStation.hi.toFixed(3)} m`;
    dom.pcForesight.value = '';
    dom.pcCalculatedGround.textContent = '---.--- m';
    dom.pcBacksight.value = '';
    dom.pcNewHI.textContent = '---.--- m';
    dom.pcStationName.value = `Armada ${state.stations.length + 1} (PC-${state.stations.length})`;

    dom.modalPCAssistant.classList.add('open');
  }

  function closePCAssistant() {
    dom.modalPCAssistant.classList.remove('open');
  }

  function updatePCAssistantCalculations() {
    if (!state.activeStation) return;
    const fs = parseFloat(dom.pcForesight.value);
    const bs = parseFloat(dom.pcBacksight.value);

    let pcElev = null;
    if (!isNaN(fs)) {
      pcElev = window.TopoMath.calculatePCElevation(state.activeStation.hi, fs);
      dom.pcCalculatedGround.textContent = `${pcElev.toFixed(3)} m`;
    } else {
      dom.pcCalculatedGround.textContent = '---.--- m';
    }

    if (pcElev !== null && !isNaN(bs)) {
      const newHI = window.TopoMath.calculateHI(pcElev, bs);
      dom.pcNewHI.textContent = `${newHI.toFixed(3)} m`;
    } else {
      dom.pcNewHI.textContent = '---.--- m';
    }
  }

  async function confirmPCAssistant() {
    if (!state.activeStation) return;
    const fs = parseFloat(dom.pcForesight.value);
    const bs = parseFloat(dom.pcBacksight.value);
    const name = dom.pcStationName.value.trim() || `Armada ${state.stations.length + 1}`;

    if (isNaN(fs) || isNaN(bs)) {
      alert('Por favor complete las dos lecturas: Vista Adelante (V-) en el PC y nueva Vista Atrás (V+).');
      return;
    }

    const pcElev = window.TopoMath.calculatePCElevation(state.activeStation.hi, fs);
    const newHI = window.TopoMath.calculateHI(pcElev, bs);

    const newStation = {
      id: 'st_' + Date.now(),
      projId: state.project.id,
      name: name,
      createdAt: new Date().toISOString(),
      bmName: `PC-${state.stations.length} (desde ${state.activeStation.name})`,
      bmElevation: pcElev,
      backsight: bs,
      hi: newHI,
      foresightOnPrev: fs,
      isActive: true
    };

    await window.topoDB.saveStation(newStation);
    await window.topoDB.setActiveStation(state.project.id, newStation.id);

    state.stations = await window.topoDB.getStations(state.project.id);
    state.activeStation = newStation;

    closePCAssistant();
    renderHeaderAndBanners();
    renderStationTab();
    renderGridTab();

    alert(`🎉 ¡Punto de Cambio guardado y activado!\nNueva Altura Instrumental HI = ${newHI.toFixed(3)} m`);
  }

  // --- 6. PESTAÑA PUNTOS AUXILIARES / LIBRES ---
  function renderAuxTab() {
    let html = '';
    state.auxPoints.forEach(pt => {
      const diffHtml = pt.cutFill !== null && pt.cutFill !== undefined
        ? `${pt.cutFill > 0 ? '+' : ''}${pt.cutFill.toFixed(2)} m`
        : '--';

      html += `
        <tr>
          <td><strong>${pt.name}</strong></td>
          <td class="mono-num">${pt.hi.toFixed(3)}</td>
          <td class="mono-num">${pt.reading.toFixed(3)}</td>
          <td class="mono-num" style="color:var(--primary-accent); font-weight:900;">${pt.elevation.toFixed(3)}</td>
          <td class="mono-num">${pt.designElevation ? pt.designElevation.toFixed(3) : '--'}</td>
          <td class="mono-num">${diffHtml}</td>
          <td><small>${pt.note || ''}</small></td>
          <td>
            <button class="btn btn-outline" style="min-height:28px; padding:2px 8px; color:#dc2626;" onclick="window.deleteAuxPointById('${pt.id}')">🗑️</button>
          </td>
        </tr>
      `;
    });

    dom.auxTableBody.innerHTML = html;
  }

  async function saveAuxPoint() {
    if (!state.activeStation) {
      alert('Configure primero una Armada activa con Altura Instrumental.');
      return;
    }

    const name = dom.auxPointName.value.trim() || 'Punto Libre';
    const reading = parseFloat(dom.auxReading.value);
    const design = parseFloat(dom.auxDesign.value);
    const note = dom.auxNote.value.trim();

    if (isNaN(reading)) {
      alert('Ingrese una lectura de mira válida en metros.');
      return;
    }

    const elev = window.TopoMath.calculateGroundElevation(state.activeStation.hi, reading);
    let cutFill = null;
    if (!isNaN(design)) {
      cutFill = window.TopoMath.calculateCutFill(elev, design);
    }

    const newPt = {
      id: 'aux_' + Date.now(),
      projId: state.project.id,
      name: name,
      reading: reading,
      stationId: state.activeStation.id,
      hi: state.activeStation.hi,
      elevation: elev,
      designElevation: isNaN(design) ? null : design,
      cutFill: cutFill,
      createdAt: new Date().toISOString(),
      note: note
    };

    await window.topoDB.saveAuxPoint(newPt);
    state.auxPoints = await window.topoDB.getAuxPoints(state.project.id);

    dom.auxPointName.value = '';
    dom.auxReading.value = '';
    dom.auxDesign.value = '';
    dom.auxNote.value = '';

    renderAuxTab();
    alert(`✔ Punto auxiliar guardado: Cota = ${elev.toFixed(3)} m`);
  }

  window.deleteAuxPointById = async function (id) {
    if (confirm('¿Eliminar este punto auxiliar?')) {
      await window.topoDB.deleteAuxPoint(id);
      state.auxPoints = await window.topoDB.getAuxPoints(state.project.id);
      renderAuxTab();
    }
  };

  // --- 7. PESTAÑA CARTERA TOPOGRÁFICA Y EXPORTACIÓN ---
  function renderExportTab() {
    if (!state.project || !state.stakes) return;

    // Resumen de volúmenes
    const sum = state.earthworkSummary || window.TopoMath.calculateEarthworkVolumes(state.stakes, state.project.settings);
    dom.sumCutVol.textContent = `${sum.totalCutVolume.toFixed(2)} m³`;
    dom.sumFillVol.textContent = `${sum.totalFillVolume.toFixed(2)} m³`;
    dom.sumBalanceVol.textContent = `${sum.netBalance > 0 ? '+' : ''}${sum.netBalance.toFixed(2)} m³`;

    const cutStakes = state.stakes.filter(s => s.status === 'CORTE').length;
    const fillStakes = state.stakes.filter(s => s.status === 'RELLENO').length;
    dom.sumCutStakes.textContent = `${cutStakes} estacas en corte`;
    dom.sumFillStakes.textContent = `${fillStakes} estacas en relleno`;

    if (sum.netBalance > 5) dom.sumBalanceDesc.textContent = 'Sobra material (Excavación neta)';
    else if (sum.netBalance < -5) dom.sumBalanceDesc.textContent = 'Falta material (Préstamo requerido)';
    else dom.sumBalanceDesc.textContent = 'Volumen compensado / equilibrado';

    // Tabla de Cartera Topográfica
    let html = '';
    state.stakes.forEach(st => {
      const readStr = st.reading !== null && st.reading !== undefined ? st.reading.toFixed(3) : '--';
      const groundStr = st.measuredElevation !== null && st.measuredElevation !== undefined ? st.measuredElevation.toFixed(3) : '--';
      const diffStr = st.cutFill !== null && st.cutFill !== undefined ? `${st.cutFill > 0 ? '+' : ''}${st.cutFill.toFixed(2)} m` : '--';
      const alertStr = st.hasPuddleWarning ? '⚠️ CONTRAPENDIENTE' : '✔ Normal';

      html += `
        <tr>
          <td><strong>${st.code}</strong></td>
          <td class="mono-num">${st.x.toFixed(1)}</td>
          <td class="mono-num">${st.y.toFixed(1)}</td>
          <td class="mono-num">${st.designElevation.toFixed(3)}</td>
          <td class="mono-num">${readStr}</td>
          <td class="mono-num" style="font-weight:900;">${groundStr}</td>
          <td class="mono-num">${diffStr}</td>
          <td>${st.status}</td>
          <td style="${st.hasPuddleWarning ? 'color:#dc2626; font-weight:800;' : 'color:#16a34a;'}">${alertStr}</td>
        </tr>
      `;
    });

    dom.carteraTableBody.innerHTML = html;
  }

  // Generar y descargar archivo CSV
  function exportCsvFile() {
    if (!state.project) return;

    const sep = dom.expSeparator.value || ';';
    const dec = dom.expDecimal.value || ',';

    const fmtNum = (val, decimals = 3) => {
      if (val === null || val === undefined || isNaN(val)) return '';
      let s = Number(val).toFixed(decimals);
      if (dec === ',') s = s.replace('.', ',');
      return s;
    };

    let csv = '\uFEFF'; // UTF-8 BOM para compatibilidad con Excel

    // Metadatos
    csv += `CARTERA TOPOGRÁFICA DE NIVELACIÓN DE LAGOS PISCÍCOLAS\n`;
    csv += `Proyecto${sep}${state.project.name}\n`;
    csv += `Fecha Exportación${sep}${new Date().toLocaleString()}\n`;
    csv += `Geometría Malla${sep}${state.project.settings.rows} Filas x ${state.project.settings.cols} Columnas (dx=${state.project.settings.dx}m, dy=${state.project.settings.dy}m)\n`;
    csv += `Caja de Pesca${sep}Fila ${window.TopoMath.rowToLetter(state.project.settings.boxRow)} - Columna ${state.project.settings.boxCol + 1} (Cota Base=${fmtNum(state.project.settings.boxElevation)})\n`;
    csv += `Modo Pendiente${sep}${state.project.settings.slopeMode === 'orthogonal' ? 'Doble Ortogonal' : 'Radial Directa'}\n`;
    csv += `Tolerancia 'A Nivel'${sep}±${state.project.settings.toleranceCm} cm\n\n`;

    // Sección 1: Armadas y Puntos de Cambio
    csv += `--- HISTORIAL DE ARMADAS Y PUNTOS DE CAMBIO ---\n`;
    csv += `Armada${sep}Punto Referencia${sep}Cota Referencia (m)${sep}Vista Atrás V+ (m)${sep}Altura Instrumental HI (m)${sep}Vista Adelante V- (m)${sep}Estado\n`;
    state.stations.forEach(st => {
      csv += `"${st.name}"${sep}"${st.bmName}"${sep}${fmtNum(st.bmElevation)}${sep}${fmtNum(st.backsight)}${sep}${fmtNum(st.hi)}${sep}${fmtNum(st.foresightOnPrev)}${sep}${st.isActive ? 'ACTIVA' : 'HISTÓRICA'}\n`;
    });
    csv += `\n`;

    // Sección 2: Malla de Estacas
    csv += `--- CARTERA DE MALLA DE ESTACAS (PISO DEL LAGO) ---\n`;
    csv += `Estaca${sep}Fila${sep}Columna${sep}Coord X (m)${sep}Coord Y (m)${sep}Cota Rasante (m)${sep}Lectura Mira VI (m)${sep}Cota Terreno (m)${sep}Diferencia (m)${sep}Estado Topográfico${sep}Alerta Drenaje${sep}Nota\n`;
    state.stakes.forEach(st => {
      const alertTxt = st.hasPuddleWarning ? `CONTRAPENDIENTE: ${st.puddleReason}` : 'DRENAJE CORRECTO';
      csv += `"${st.code}"${sep}"${window.TopoMath.rowToLetter(st.row)}"${sep}${st.col + 1}${sep}${fmtNum(st.x, 1)}${sep}${fmtNum(st.y, 1)}${sep}${fmtNum(st.designElevation)}${sep}${fmtNum(st.reading)}${sep}${fmtNum(st.measuredElevation)}${sep}${fmtNum(st.cutFill, 2)}${sep}"${st.status}"${sep}"${alertTxt}"${sep}"${st.note || ''}"\n`;
    });
    csv += `\n`;

    // Sección 3: Puntos Libres / Auxiliares
    if (state.auxPoints.length > 0) {
      csv += `--- PUNTOS LIBRES Y AUXILIARES (BORDES, TALUDES, TUBERÍAS) ---\n`;
      csv += `Nombre${sep}HI Estación (m)${sep}Lectura VI (m)${sep}Cota Medida (m)${sep}Cota Teórica (m)${sep}Diferencia (m)${sep}Observación\n`;
      state.auxPoints.forEach(pt => {
        csv += `"${pt.name}"${sep}${fmtNum(pt.hi)}${sep}${fmtNum(pt.reading)}${sep}${fmtNum(pt.elevation)}${sep}${fmtNum(pt.designElevation)}${sep}${fmtNum(pt.cutFill, 2)}${sep}"${pt.note || ''}"\n`;
      });
      csv += `\n`;
    }

    // Sección 4: Resumen de Movimiento de Tierras
    const sum = state.earthworkSummary;
    csv += `--- RESUMEN ESTIMADO DE MOVIMIENTO DE TIERRAS (MÉTODO PRISMAS) ---\n`;
    csv += `Volumen Total de Corte${sep}${fmtNum(sum.totalCutVolume, 2)} m³\n`;
    csv += `Volumen Total de Relleno${sep}${fmtNum(sum.totalFillVolume, 2)} m³\n`;
    csv += `Balance Neto de Tierra${sep}${fmtNum(sum.netBalance, 2)} m³\n`;
    csv += `Estacas Medidas${sep}${sum.measuredCount} de ${sum.totalStakes} (${sum.coveragePercent}%)\n`;

    // Descargar archivo Blob
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (state.project.name || 'Lago').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `cartera_topografica_${safeName}_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Respaldo en JSON
  function exportJsonBackup() {
    const backupData = {
      project: state.project,
      stakes: state.stakes,
      stations: state.stations,
      auxPoints: state.auxPoints,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0'
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (state.project.name || 'Lago').replace(/[^a-zA-Z0-9_\-]/g, '_');
    a.href = url;
    a.download = `respaldo_topolago_${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- 8. EDICIÓN MANUAL DE COTA DE DISEÑO ---
  function openEditDesignModal() {
    const stake = state.stakes[state.currentStakeIndex];
    if (!stake) return;

    dom.edStakeCode.textContent = stake.code;
    dom.edInputElevation.value = stake.designElevation.toFixed(3);
    dom.modalEditDesign.classList.add('open');
  }

  function closeEditDesignModal() {
    dom.modalEditDesign.classList.remove('open');
  }

  async function saveCustomDesign() {
    const stake = state.stakes[state.currentStakeIndex];
    if (!stake) return;

    const newElev = parseFloat(dom.edInputElevation.value);
    if (isNaN(newElev)) {
      alert('Ingrese una cota de diseño válida en metros.');
      return;
    }

    stake.designElevation = Math.round(newElev * 1000) / 1000;
    stake.isCustomDesign = true;

    if (stake.measuredElevation !== null && stake.measuredElevation !== undefined) {
      stake.cutFill = window.TopoMath.calculateCutFill(stake.measuredElevation, stake.designElevation);
      const tolM = (state.project.settings.toleranceCm || 2.0) / 100;
      stake.status = window.TopoMath.evaluateStatus(stake.cutFill, tolM).status;
    }

    await window.topoDB.saveStake(stake);
    updateCalculations();
    closeEditDesignModal();
    updateStakeModalUI();
  }

  async function resetCustomDesign() {
    const stake = state.stakes[state.currentStakeIndex];
    if (!stake) return;

    const teoric = window.TopoMath.calculateDesignElevation(stake.row, stake.col, state.project.settings);
    stake.designElevation = teoric;
    stake.isCustomDesign = false;

    if (stake.measuredElevation !== null && stake.measuredElevation !== undefined) {
      stake.cutFill = window.TopoMath.calculateCutFill(stake.measuredElevation, stake.designElevation);
      const tolM = (state.project.settings.toleranceCm || 2.0) / 100;
      stake.status = window.TopoMath.evaluateStatus(stake.cutFill, tolM).status;
    }

    await window.topoDB.saveStake(stake);
    updateCalculations();
    closeEditDesignModal();
    updateStakeModalUI();
  }

  // --- TEMA SOL / NOCHE ---
  function initTheme() {
    const savedTheme = localStorage.getItem('topolago_theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      dom.btnToggleTheme.textContent = '🌙';
    } else {
      document.body.classList.remove('dark-mode');
      dom.btnToggleTheme.textContent = '☀️';
    }
  }

  function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    dom.btnToggleTheme.textContent = isDark ? '🌙' : '☀️';
    localStorage.setItem('topolago_theme', isDark ? 'dark' : 'light');
  }

  // --- NAVEGACIÓN DE PESTAÑAS ---
  function switchTab(targetId) {
    dom.tabBtns.forEach(btn => {
      if (btn.getAttribute('data-tab') === targetId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    dom.tabPanes.forEach(pane => {
      if (pane.id === targetId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    if (targetId === 'tab-grid') renderGridTab();
    else if (targetId === 'tab-station') renderStationTab();
    else if (targetId === 'tab-aux') renderAuxTab();
    else if (targetId === 'tab-export') renderExportTab();
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Theme toggle
    dom.btnToggleTheme.addEventListener('click', toggleTheme);

    // Tabs
    dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        switchTab(tabId);
      });
    });

    // Quick PC button
    dom.btnQuickPC.addEventListener('click', openPCAssistant);
    dom.btnQuickOffset.addEventListener('click', () => openOffsetModal());

    // Modal Lectura
    dom.mBtnClose.addEventListener('click', closeStakeModal);
    dom.mBtnOffset.addEventListener('click', () => {
      const stake = state.stakes[state.currentStakeIndex];
      closeStakeModal();
      openOffsetModal(stake);
    });
    dom.mBtnPrev.addEventListener('click', () => {
      if (state.currentStakeIndex > 0) {
        state.currentStakeIndex--;
        const prev = state.stakes[state.currentStakeIndex];
        state.modalReadingBuffer = (prev.reading !== null && prev.reading !== undefined) ? prev.reading.toFixed(3) : '';
        updateStakeModalUI();
      }
    });
    dom.mBtnNext.addEventListener('click', () => {
      if (state.currentStakeIndex < state.stakes.length - 1) {
        state.currentStakeIndex++;
        const next = state.stakes[state.currentStakeIndex];
        state.modalReadingBuffer = (next.reading !== null && next.reading !== undefined) ? next.reading.toFixed(3) : '';
        updateStakeModalUI();
      }
    });
    dom.mBtnEditDesign.addEventListener('click', openEditDesignModal);
    dom.mBtnAddNote.addEventListener('click', () => {
      const stake = state.stakes[state.currentStakeIndex];
      if (!stake) return;
      const note = prompt('Nota de campo para ' + stake.code + ':', stake.note || '');
      if (note !== null) {
        stake.note = note.trim();
        window.topoDB.saveStake(stake);
      }
    });

    // Virtual keypad delegator
    dom.virtualKeypad.addEventListener('click', (e) => {
      const btn = e.target.closest('.keypad-btn');
      if (!btn) return;
      const key = btn.getAttribute('data-key');
      if (key) handleKeypadPress(key);
    });

    // Config tab
    dom.cfgRows.addEventListener('input', () => {
      const r = parseInt(dom.cfgRows.value, 10) || 5;
      const c = parseInt(dom.cfgCols.value, 10) || 8;
      updateBoxSelectOptions(r, c, 0, 0);
    });
    dom.cfgCols.addEventListener('input', () => {
      const r = parseInt(dom.cfgRows.value, 10) || 5;
      const c = parseInt(dom.cfgCols.value, 10) || 8;
      updateBoxSelectOptions(r, c, 0, 0);
    });
    dom.cfgSlopeMode.addEventListener('change', () => {
      updateSlopeModeFields(dom.cfgSlopeMode.value);
    });
    dom.btnSaveConfig.addEventListener('click', savePondConfig);

    // Station tab
    dom.stBmElev.addEventListener('input', updateStationCalculationPreview);
    dom.stBacksight.addEventListener('input', updateStationCalculationPreview);
    dom.btnSaveNewStation.addEventListener('click', saveNewStation);
    dom.btnOpenPCModal.addEventListener('click', openPCAssistant);

    // PC Modal
    dom.pcBtnClose.addEventListener('click', closePCAssistant);
    dom.pcForesight.addEventListener('input', updatePCAssistantCalculations);
    dom.pcBacksight.addEventListener('input', updatePCAssistantCalculations);
    dom.pcBtnSaveConfirm.addEventListener('click', confirmPCAssistant);

    // Aux tab
    dom.btnSaveAuxPoint.addEventListener('click', saveAuxPoint);

    // Export tab
    dom.btnExportCsv.addEventListener('click', exportCsvFile);
    dom.btnExportJsonBackup.addEventListener('click', exportJsonBackup);

    // Edit design modal
    dom.edBtnClose.addEventListener('click', closeEditDesignModal);
    dom.edBtnSave.addEventListener('click', saveCustomDesign);
    dom.edBtnReset.addEventListener('click', resetCustomDesign);

    // Modal Punto Intermedio (Desfase)
    dom.offBtnClose.addEventListener('click', closeOffsetModal);
    dom.offBaseStake.addEventListener('change', updateOffsetCalculations);
    dom.offDxInput.addEventListener('input', updateOffsetCalculations);
    dom.offDyInput.addEventListener('input', updateOffsetCalculations);
    dom.offReadingInput.addEventListener('input', updateOffsetCalculations);
    dom.offBtnSavePoint.addEventListener('click', saveOffsetPointToProject);
    dom.offQuadrantCanvas.addEventListener('click', handleCanvasClick);

    // Botones de incremento rápido de desfase
    dom.offsetStepBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const axis = btn.getAttribute('data-axis');
        const val = parseFloat(btn.getAttribute('data-val'));
        if (axis === 'x') {
          let cur = parseFloat(dom.offDxInput.value) || 0;
          if (val === 0) cur = 0;
          else cur += val;
          dom.offDxInput.value = cur.toFixed(1);
        } else if (axis === 'y') {
          let cur = parseFloat(dom.offDyInput.value) || 0;
          if (val === 0) cur = 0;
          else cur += val;
          dom.offDyInput.value = cur.toFixed(1);
        }
        updateOffsetCalculations();
      });
    });
  }

  // --- 9. MODAL DE PUNTO INTERMEDIO / DESFASE DESDE ESTACA ---
  function populateOffsetBaseStakes(selectedStakeId = null) {
    let opts = '';
    state.stakes.forEach(s => {
      const isSel = (selectedStakeId && s.id === selectedStakeId) ? 'selected' : '';
      opts += `<option value="${s.id}" ${isSel}>${s.code} (X=${s.x.toFixed(1)}m, Y=${s.y.toFixed(1)}m - Rasante=${s.designElevation.toFixed(2)}m)</option>`;
    });
    dom.offBaseStake.innerHTML = opts;
  }

  function openOffsetModal(baseStake = null) {
    if (!state.activeStation) {
      alert('Atención: Configure primero una Armada (Altura Instrumental HI) para poder calcular la lectura ideal de mira.');
      switchTab('tab-station');
      return;
    }

    const targetStake = baseStake || state.stakes[state.currentStakeIndex] || state.stakes[0];
    populateOffsetBaseStakes(targetStake ? targetStake.id : null);

    dom.offDxInput.value = '0.0';
    dom.offDyInput.value = '0.0';
    dom.offReadingInput.value = '';

    updateOffsetCalculations();
    dom.modalOffsetPoint.classList.add('open');
  }

  function closeOffsetModal() {
    dom.modalOffsetPoint.classList.remove('open');
  }

  function getSelectedBaseStake() {
    const selId = dom.offBaseStake.value;
    return state.stakes.find(s => s.id === selId) || state.stakes[0];
  }

  function updateOffsetCalculations() {
    const baseStake = getSelectedBaseStake();
    if (!baseStake || !state.project || !state.activeStation) return;

    const dx = parseFloat(dom.offDxInput.value) || 0;
    const dy = parseFloat(dom.offDyInput.value) || 0;

    const targetX = baseStake.x + dx;
    const targetY = baseStake.y + dy;

    // Mostrar coordenadas absolutas calculadas
    dom.offCoordDisplay.textContent = `X=${targetX.toFixed(2)} m, Y=${targetY.toFixed(2)} m`;

    // Calcular Cota de Diseño (Rasante)
    const calcResult = window.TopoMath.calculateDesignElevationAtCoord(targetX, targetY, state.project.settings, state.stakes);
    const designZ = calcResult.elevation;
    dom.offResDesign.textContent = `${designZ.toFixed(3)} m`;
    dom.offMethodBadge.textContent = calcResult.method;

    // Altura Instrumental y Lectura Ideal de Mira
    const hi = state.activeStation.hi;
    dom.offHiVal.textContent = `${hi.toFixed(3)} m`;

    const idealReading = window.TopoMath.calculateIdealReading(hi, designZ);
    dom.offIdealReading.textContent = `${idealReading.toFixed(3)} m`;

    // Etiqueta automática del punto
    dom.offPointTag.value = window.TopoMath.getOffsetLabel(baseStake.code, dx, dy);

    // Lectura real opcional digitada
    const realReading = parseFloat(dom.offReadingInput.value);
    const tolM = (state.project.settings.toleranceCm || 2.0) / 100;

    if (!isNaN(realReading) && dom.offReadingInput.value.trim() !== '') {
      const groundZ = window.TopoMath.calculateGroundElevation(hi, realReading);
      const cutFill = window.TopoMath.calculateCutFill(groundZ, designZ);
      const evalRes = window.TopoMath.evaluateStatus(cutFill, tolM);

      dom.offResGround.textContent = `${groundZ.toFixed(3)} m`;
      dom.offStatusBadge.className = `live-status-badge ${evalRes.status.toLowerCase().replace('_', '-')}`;
      dom.offStatusBadge.textContent = evalRes.fullText;
    } else {
      dom.offResGround.textContent = '---.--- m';
      dom.offStatusBadge.className = 'live-status-badge pendiente';
      dom.offStatusBadge.textContent = 'DIGITE LECTURA PARA COMPARAR';
    }

    drawQuadrantCanvas(baseStake, dx, dy);
  }

  function drawQuadrantCanvas(baseStake, currentDx, currentDy) {
    const canvas = dom.offQuadrantCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const isDark = document.body.classList.contains('dark-mode');
    const gridSpacingX = state.project.settings.dx || 10;
    const gridSpacingY = state.project.settings.dy || 10;

    // Centrar la estaca base un poco hacia la izquierda y arriba para dejar espacio al cuadrante
    const originX = w * 0.28;
    const originY = h * 0.35;
    const scaleX = (w * 0.52) / gridSpacingX;
    const scaleY = (h * 0.48) / gridSpacingY;

    // Malla del cuadrante
    ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(originX, originY, gridSpacingX * scaleX, gridSpacingY * scaleY);
    ctx.setLineDash([]);

    // Ejes ortogonales
    ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
    ctx.lineWidth = 2;

    // Eje X
    ctx.beginPath();
    ctx.moveTo(originX - 35, originY);
    ctx.lineTo(originX + gridSpacingX * scaleX + 35, originY);
    ctx.stroke();

    // Eje Y
    ctx.beginPath();
    ctx.moveTo(originX, originY - 25);
    ctx.lineTo(originX, originY + gridSpacingY * scaleY + 25);
    ctx.stroke();

    // Textos de orientación
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('+X (Der)', originX + gridSpacingX * scaleX + 5, originY - 6);
    ctx.fillText('-X (Izq)', originX - 35, originY - 6);

    ctx.fillStyle = '#16a34a';
    ctx.fillText('+Y (Adel)', originX + 8, originY + gridSpacingY * scaleY + 18);
    ctx.fillText('-Y (Atrás)', originX + 8, originY - 14);

    // Dibujar nodos de las 4 estacas
    const drawStakeNode = (x, y, label, isBase = false) => {
      ctx.beginPath();
      ctx.arc(x, y, isBase ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = isBase ? '#f59e0b' : (isDark ? '#64748b' : '#94a3b8');
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = isDark ? '#ffffff' : '#000000';
      ctx.font = isBase ? 'bold 12px sans-serif' : '10px sans-serif';
      ctx.fillText(label, x - 10, y - 10);
    };

    drawStakeNode(originX, originY, baseStake.code, true);

    const r = baseStake.row;
    const c = baseStake.col;
    if (c + 1 < state.project.settings.cols) {
      drawStakeNode(originX + gridSpacingX * scaleX, originY, window.TopoMath.getStakeCode(r, c + 1));
    }
    if (r + 1 < state.project.settings.rows) {
      drawStakeNode(originX, originY + gridSpacingY * scaleY, window.TopoMath.getStakeCode(r + 1, c));
    }
    if (r + 1 < state.project.settings.rows && c + 1 < state.project.settings.cols) {
      drawStakeNode(originX + gridSpacingX * scaleX, originY + gridSpacingY * scaleY, window.TopoMath.getStakeCode(r + 1, c + 1));
    }

    // Punto del Cadenero (Objetivo con desfase)
    const targetPx = originX + (currentDx * scaleX);
    const targetPy = originY + (currentDy * scaleY);

    // Vector de desplazamiento
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(targetPx, targetPy);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Mira / Diana del cadenero
    ctx.beginPath();
    ctx.arc(targetPx, targetPy, 11, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(220, 38, 38, 0.35)';
    ctx.fill();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(targetPx, targetPy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();

    // Etiqueta flotante del cadenero
    ctx.fillStyle = isDark ? '#fecaca' : '#991b1b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`Cadenero (${currentDx > 0 ? '+' : ''}${currentDx.toFixed(1)}m, ${currentDy > 0 ? '+' : ''}${currentDy.toFixed(1)}m)`, targetPx + 14, targetPy + 4);
  }

  function handleCanvasClick(e) {
    const canvas = dom.offQuadrantCanvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const gridSpacingX = state.project.settings.dx || 10;
    const gridSpacingY = state.project.settings.dy || 10;

    const originX = canvas.width * 0.28;
    const originY = canvas.height * 0.35;
    const scaleX = (canvas.width * 0.52) / gridSpacingX;
    const scaleY = (canvas.height * 0.48) / gridSpacingY;

    let dX = (clickX - originX) / scaleX;
    let dY = (clickY - originY) / scaleY;

    // Redondear a 0.5m más cercano
    dX = Math.round(dX * 2) / 2;
    dY = Math.round(dY * 2) / 2;

    dom.offDxInput.value = dX.toFixed(1);
    dom.offDyInput.value = dY.toFixed(1);

    updateOffsetCalculations();
  }

  async function saveOffsetPointToProject() {
    const baseStake = getSelectedBaseStake();
    if (!baseStake || !state.activeStation) return;

    const tag = dom.offPointTag.value.trim() || 'Punto Desfase';
    const dx = parseFloat(dom.offDxInput.value) || 0;
    const dy = parseFloat(dom.offDyInput.value) || 0;
    const targetX = baseStake.x + dx;
    const targetY = baseStake.y + dy;

    const calcResult = window.TopoMath.calculateDesignElevationAtCoord(targetX, targetY, state.project.settings, state.stakes);
    const designZ = calcResult.elevation;
    const hi = state.activeStation.hi;

    let realReading = parseFloat(dom.offReadingInput.value);
    let groundZ;
    let cutFill;

    if (!isNaN(realReading)) {
      groundZ = window.TopoMath.calculateGroundElevation(hi, realReading);
      cutFill = window.TopoMath.calculateCutFill(groundZ, designZ);
    } else {
      realReading = window.TopoMath.calculateIdealReading(hi, designZ);
      groundZ = designZ;
      cutFill = 0.00;
    }

    const auxPt = {
      id: 'aux_off_' + Date.now(),
      projId: state.project.id,
      name: tag,
      reading: realReading,
      stationId: state.activeStation.id,
      hi: hi,
      elevation: groundZ,
      designElevation: designZ,
      cutFill: cutFill,
      createdAt: new Date().toISOString(),
      note: `Desfase desde ${baseStake.code} [dX=${dx > 0 ? '+' : ''}${dx.toFixed(1)}m, dY=${dy > 0 ? '+' : ''}${dy.toFixed(1)}m] (${calcResult.method})`
    };

    await window.topoDB.saveAuxPoint(auxPt);
    state.auxPoints = await window.topoDB.getAuxPoints(state.project.id);

    renderAuxTab();
    renderExportTab();
    closeOffsetModal();

    alert(`✔ Punto intermedio guardado en Cartera Topográfica:\n${tag}\nCota Rasante: ${designZ.toFixed(3)} m | Lectura Ideal: ${window.TopoMath.calculateIdealReading(hi, designZ).toFixed(3)} m`);
  }

  // Iniciar la app al cargar el DOM
  document.addEventListener('DOMContentLoaded', initApp);

})();
