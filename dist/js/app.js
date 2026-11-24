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
    earthworkSummary: null,
    activeViewMode: '2d', // '2d' | 'table'
    isEditMode: false,
    configMode: 'tape', // 'tape' | 'regular' | 'talud'
    tapeAlignment: 'center', // 'center' | 'left' | 'right'
    boxMode: 'stake', // 'stake' | 'tape'
    boxTapeCoords: null,
    taludAngleDeg: 90,
    canvas: {
      panX: 60,
      panY: 60,
      zoom: 1.0,
      rotationDeg: 0, // 0 | 90 | 180 | 270
      flipX: false,
      isPanning: false,
      isDraggingStake: false,
      startX: 0,
      startY: 0,
      draggedStake: null,
      hoveredStake: null,
      tinData: null
    },
    repositionStake: null,
    currentTab: 'tab-grid',
    activeModalId: null
  };

  // --- ELEMENTOS DEL DOM ---
  const dom = {};

  function cacheDomElements() {
    // Header & Banners
    dom.pondNameHeader = document.getElementById('header-pond-name');
    dom.bannerStationName = document.getElementById('banner-station-name');
    dom.bannerHI = document.getElementById('banner-hi-val');
    dom.btnToggleTheme = document.getElementById('btn-toggle-theme');
    dom.headerBtnBack = document.getElementById('header-btn-back');
    dom.swipeBackIndicator = document.getElementById('swipe-back-indicator');

    // Tabs
    dom.tabBtns = document.querySelectorAll('.tab-btn');
    dom.tabPanes = document.querySelectorAll('.tab-pane');

    // Tab Cuadrícula / Plano 2D
    dom.lakeGridTable = document.getElementById('lake-grid-table');
    dom.lakeGridContainer = document.getElementById('lake-grid-container');
    dom.gridProgressText = document.getElementById('grid-progress-text');
    dom.gridTolText = document.getElementById('grid-tol-text');
    dom.puddleGlobalAlert = document.getElementById('puddle-global-alert');
    dom.puddleAlertDesc = document.getElementById('puddle-alert-desc');
    dom.btnQuickPC = document.getElementById('btn-quick-pc');
    dom.btnQuickOffset = document.getElementById('btn-quick-offset');
    dom.btnToggleEditMode = document.getElementById('btn-toggle-edit-mode');

    // Vistas 2D vs Tabla
    dom.viewMode2D = document.getElementById('view-mode-2d');
    dom.viewModeTable = document.getElementById('view-mode-table');
    dom.canvas2DWrapper = document.getElementById('canvas-2d-wrapper');
    dom.lakeTinCanvas = document.getElementById('lake-tin-canvas');
    dom.canvasEditBanner = document.getElementById('canvas-edit-banner');
    dom.canvasBtnRot90 = document.getElementById('canvas-btn-rot90');
    dom.canvasBtnMirror = document.getElementById('canvas-btn-mirror');
    dom.canvasViewBadge = document.getElementById('canvas-view-badge');
    dom.canvasBtnZoomIn = document.getElementById('canvas-btn-zoom-in');
    dom.canvasBtnZoomOut = document.getElementById('canvas-btn-zoom-out');
    dom.canvasBtnCenter = document.getElementById('canvas-btn-center');
    dom.chkShowTin = document.getElementById('chk-show-tin');
    dom.chkShowDistances = document.getElementById('chk-show-distances');
    dom.chkShowFlow = document.getElementById('chk-show-flow');

    // Tab Configuración
    dom.cfgPondName = document.getElementById('cfg-pond-name');
    dom.cfgModeTapeBtn = document.getElementById('cfg-mode-tape-btn');
    dom.cfgModeRegularBtn = document.getElementById('cfg-mode-regular-btn');
    dom.cfgModeTaludBtn = document.getElementById('cfg-mode-talud-btn');
    dom.cfgSectionTape = document.getElementById('cfg-section-tape');
    dom.cfgSectionRegular = document.getElementById('cfg-section-regular');
    dom.cfgSectionTalud = document.getElementById('cfg-section-talud');

    // Campos Modo Cinta (4 bordes + 2 diagonales)
    dom.tapeL12 = document.getElementById('tape-l12');
    dom.tapeL23 = document.getElementById('tape-l23');
    dom.tapeL34 = document.getElementById('tape-l34');
    dom.tapeL41 = document.getElementById('tape-l41');
    dom.tapeD13 = document.getElementById('tape-d13');
    dom.tapeD24 = document.getElementById('tape-d24');
    dom.tapeClosureBadge = document.getElementById('tape-closure-badge');
    dom.tapeClosureDesc = document.getElementById('tape-closure-desc');
    dom.tapeRowPattern = document.getElementById('tape-row-pattern');
    dom.tapeAlignCenterBtn = document.getElementById('tape-align-center-btn');
    dom.tapeAlignLeftBtn = document.getElementById('tape-align-left-btn');
    dom.tapeAlignRightBtn = document.getElementById('tape-align-right-btn');

    // Caja de pesca modos (estaca vs cinta)
    dom.boxModeStakeBtn = document.getElementById('box-mode-stake-btn');
    dom.boxModeTapeBtn = document.getElementById('box-mode-tape-btn');
    dom.boxSectionStake = document.getElementById('box-section-stake');
    dom.boxSectionTape = document.getElementById('box-section-tape');
    dom.boxRefCorner1 = document.getElementById('box-ref-corner1');
    dom.boxDistCorner1 = document.getElementById('box-dist-corner1');
    dom.boxRefCorner2 = document.getElementById('box-ref-corner2');
    dom.boxDistCorner2 = document.getElementById('box-dist-corner2');
    dom.btnCalcBoxTape = document.getElementById('btn-calc-box-tape');
    dom.boxTapeResultBadge = document.getElementById('box-tape-result-badge');

    dom.taludLongSections = document.getElementById('talud-long-sections');
    dom.taludWidthSections = document.getElementById('talud-width-sections');
    dom.taludBtnAngle90 = document.getElementById('talud-btn-angle-90');
    dom.taludBtnAngleDiag = document.getElementById('talud-btn-angle-diag');
    dom.taludDiagonalInputs = document.getElementById('talud-diagonal-inputs');
    dom.taludDiagA = document.getElementById('talud-diag-a');
    dom.taludDiagB = document.getElementById('talud-diag-b');
    dom.taludDiagC = document.getElementById('talud-diag-c');
    dom.taludAngleBadge = document.getElementById('talud-angle-badge');
    dom.cfgRows = document.getElementById('cfg-rows');
    dom.cfgCols = document.getElementById('cfg-cols');
    dom.cfgRowPattern = document.getElementById('cfg-row-pattern');
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

    // Tab Maquinaria y Cubicación TIN
    dom.machTinMethodBadge = document.getElementById('mach-tin-method-badge');
    dom.machSoilBadge = document.getElementById('mach-soil-badge');
    dom.machPresetMixto = document.getElementById('mach-preset-mixto');
    dom.machPresetPenon = document.getElementById('mach-preset-penon');
    dom.machPresetArcilla = document.getElementById('mach-preset-arcilla');
    dom.machFactorK = document.getElementById('mach-factor-k');
    dom.machCycleTime = document.getElementById('mach-cycle-time');
    dom.machBucketCap = document.getElementById('mach-bucket-cap');
    dom.machEfficiency = document.getElementById('mach-efficiency');
    dom.machProfilingHours = document.getElementById('mach-profiling-hours');
    dom.machTruckBtn15 = document.getElementById('mach-truck-btn-15');
    dom.machTruckBtn155 = document.getElementById('mach-truck-btn-155');
    dom.machTruckBtn16 = document.getElementById('mach-truck-btn-16');
    dom.machHaulCycleTime = document.getElementById('mach-haul-cycle-time');
    dom.machAreaVal = document.getElementById('mach-area-val');
    dom.machTrianglesCount = document.getElementById('mach-triangles-count');
    dom.machCutBankVal = document.getElementById('mach-cut-bank-val');
    dom.machFillGeomVal = document.getElementById('mach-fill-geom-val');
    dom.machBalanceVal = document.getElementById('mach-balance-val');
    dom.machBalanceStatus = document.getElementById('mach-balance-status');
    dom.machCompensateToggle = document.getElementById('mach-compensate-toggle');
    dom.machEsponjamiento = document.getElementById('mach-esponjamiento');
    dom.machCompactacion = document.getElementById('mach-compactacion');
    dom.machHoursPerDay = document.getElementById('mach-hours-per-day');
    dom.machTruckCap = document.getElementById('mach-truck-cap');
    dom.machExcYieldLabel = document.getElementById('mach-exc-yield-label');
    dom.machExcFormulaDesc = document.getElementById('mach-exc-formula-desc');
    dom.machExcHours = document.getElementById('mach-exc-hours');
    dom.machExcHoursDetail = document.getElementById('mach-exc-hours-detail');
    dom.machExcDays = document.getElementById('mach-exc-days');
    dom.machExcDaysDetail = document.getElementById('mach-exc-days-detail');
    dom.machTruckCapLabel = document.getElementById('mach-truck-cap-label');
    dom.machTripsTotal = document.getElementById('mach-trips-total');
    dom.machLooseTotalDesc = document.getElementById('mach-loose-total-desc');
    dom.machTripsSurplus = document.getElementById('mach-trips-surplus');
    dom.machLooseSurplusDesc = document.getElementById('mach-loose-surplus-desc');
    dom.machBankUsed = document.getElementById('mach-bank-used');
    dom.machDeficitRow = document.getElementById('mach-deficit-row');
    dom.machBankDeficit = document.getElementById('mach-bank-deficit');
    dom.machTruckPasses = document.getElementById('mach-truck-passes');
    dom.machTruckLoadTime = document.getElementById('mach-truck-load-time');
    dom.machTruckFleetOptimal = document.getElementById('mach-truck-fleet-optimal');
    dom.machFleetCycleDesc = document.getElementById('mach-fleet-cycle-desc');

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
    dom.mBtnReposition = document.getElementById('m-btn-reposition');
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

    // Modal Replanteo / Ajuste de Estaca
    dom.modalRepositionStake = document.getElementById('modal-reposition-stake');
    dom.repStakeCode = document.getElementById('rep-stake-code');
    dom.repCurrentCoords = document.getElementById('rep-current-coords');
    dom.repBtnClose = document.getElementById('rep-btn-close');
    dom.repSubTabBtns = document.querySelectorAll('.sub-tab-btn');
    dom.repSubTabPanes = document.querySelectorAll('.sub-tab-pane');
    dom.repRefStake = document.getElementById('rep-ref-stake');
    dom.repDxInput = document.getElementById('rep-dx-input');
    dom.repDyInput = document.getElementById('rep-dy-input');
    dom.repTriStake1 = document.getElementById('rep-tri-stake1');
    dom.repTriDist1 = document.getElementById('rep-tri-dist1');
    dom.repTriStake2 = document.getElementById('rep-tri-stake2');
    dom.repTriDist2 = document.getElementById('rep-tri-dist2');
    dom.repTriSide = document.getElementById('rep-tri-side');
    dom.repBtnCalcTrilateration = document.getElementById('rep-btn-calc-trilateration');
    dom.repTriStatus = document.getElementById('rep-tri-status');
    dom.repDirectX = document.getElementById('rep-direct-x');
    dom.repDirectY = document.getElementById('rep-direct-y');
    dom.repResultCoords = document.getElementById('rep-result-coords');
    dom.repResultDesign = document.getElementById('rep-result-design');
    dom.repBtnApply = document.getElementById('rep-btn-apply');

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

    // Botones accesibles de retorno (← Volver) y zona de pulgar en cada modal
    dom.mBtnBackHeader = document.getElementById('m-btn-back-header');
    dom.mBtnCancelBottom = document.getElementById('m-btn-cancel-bottom');

    dom.pcBtnBackHeader = document.getElementById('pc-btn-back-header');
    dom.pcBtnCancelBottom = document.getElementById('pc-btn-cancel-bottom');

    dom.offBtnBackHeader = document.getElementById('off-btn-back-header');
    dom.offBtnCancelBottom = document.getElementById('off-btn-cancel-bottom');

    dom.repBtnBackHeader = document.getElementById('rep-btn-back-header');
    dom.repBtnCancelBottom = document.getElementById('rep-btn-cancel-bottom');

    dom.edBtnBackHeader = document.getElementById('ed-btn-back-header');
    dom.edBtnCancelBottom = document.getElementById('ed-btn-cancel-bottom');
  }

  // --- INICIALIZACIÓN DE LA APLICACIÓN ---
  async function initApp() {
    cacheDomElements();
    initTheme();
    loadSavedMachineryParams();
    setupEventListeners();
    setupHistoryListener();
    setupSwipeBackGesture();
    setupModalBottomSheetGestures();

    // Estado inicial en el navegador para que retroceder no cierre la app de golpe
    history.replaceState({ tab: 'tab-grid', modal: null }, '');

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

  // --- CREAR PROYECTO INICIAL POR DEFECTO (REPLANTEO 100% CINTA MÉTRICA) ---
  async function createDefaultProject() {
    const projId = 'proj_' + Date.now();
    const defaultProject = {
      id: projId,
      name: 'Lago 1 - Sector Tilapia',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        meshMode: 'tape',
        tapeL12: 60.0,
        tapeL23: 45.0,
        tapeL34: 58.0,
        tapeL41: 44.0,
        tapeD13: 74.5,
        tapeD24: 73.8,
        rowPattern: '5, 7, 7, 7, 5',
        rowAlignment: 'center',
        rows: 5,           // Filas A..E
        cols: 7,           // Columnas 1..7 (máximo en filas B, C, D)
        dx: 10.0,          // 10 metros base
        dy: 10.0,          // 10 metros base
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

    const quad = window.TopoMath.solveQuadrilateralTape(60.0, 45.0, 58.0, 44.0, 74.5, 73.8);
    if (quad.success) {
      defaultProject.settings.tapeCorners = quad;
    }

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

    // Generar estacas de la cuadrícula con 31 estacas (5, 7, 7, 7, 5)
    const stakes = window.TopoMath.generateStakes(projId, defaultProject.settings);
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

  // --- 2. PESTAÑA CUADRÍCULA VISUAL Y PLANO 2D ---
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

    // Conmutar entre vista de Plano 2D y Tabla tradicional
    if (state.activeViewMode === '2d') {
      dom.canvas2DWrapper.style.display = 'block';
      dom.lakeGridContainer.style.display = 'none';
      dom.viewMode2D.classList.add('active');
      dom.viewModeTable.classList.remove('active');
      renderCanvas2D();
    } else {
      dom.canvas2DWrapper.style.display = 'none';
      dom.lakeGridContainer.style.display = 'block';
      dom.viewMode2D.classList.remove('active');
      dom.viewModeTable.classList.add('active');
    }

    // Renderizar tabla HTML de la cuadrícula de forma dinámica (soporta filas irregulares y alineación)
    let html = '';

    const rowMap = new Map();
    state.stakes.forEach(s => {
      if (!rowMap.has(s.row)) rowMap.set(s.row, []);
      rowMap.get(s.row).push(s);
    });
    rowMap.forEach(rowStakes => rowStakes.sort((a, b) => a.col - b.col));

    const sortedRowIndices = Array.from(rowMap.keys()).sort((a, b) => a - b);
    const numRows = sortedRowIndices.length > 0 ? sortedRowIndices.length : (state.project.settings.rows || 5);

    let maxCols = 0;
    sortedRowIndices.forEach(r => {
      const len = rowMap.get(r).length;
      if (len > maxCols) maxCols = len;
    });
    maxCols = Math.max(maxCols, state.project.settings.cols || 1);
    const alignment = state.project.settings.rowAlignment || 'center';

    // Encabezado de columnas (Números 1..maxCols)
    html += '<thead><tr><th class="stake-header-cell">#</th>';
    for (let c = 0; c < maxCols; c++) {
      html += `<th class="stake-header-cell">${c + 1}</th>`;
    }
    html += '</tr></thead><tbody>';

    // Filas (Letras A..Rows con alineación de filas cortas)
    for (let i = 0; i < numRows; i++) {
      const r = sortedRowIndices.length > 0 ? sortedRowIndices[i] : i;
      const rowLetter = window.TopoMath.rowToLetter(r);
      const rowStakes = rowMap.get(r) || [];
      const countInRow = rowStakes.length;

      let leftPad = 0;
      if (alignment === 'center') {
        leftPad = Math.floor((maxCols - countInRow) / 2);
      } else if (alignment === 'right') {
        leftPad = maxCols - countInRow;
      }

      html += `<tr><th class="stake-header-cell">${rowLetter}</th>`;

      for (let c = 0; c < maxCols; c++) {
        if (c < leftPad || c >= leftPad + countInRow) {
          html += '<td></td>';
          continue;
        }

        const stake = rowStakes[c - leftPad];
        if (!stake) {
          html += '<td></td>';
          continue;
        }

        const isCaja = (r === boxRow && stake.col === boxCol);
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
          <td class="${cellClass}" data-row="${stake.row}" data-col="${stake.col}" data-id="${stake.id}">
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
        const id = cell.getAttribute('data-id');
        const idx = state.stakes.findIndex(s => s.id === id);
        if (idx !== -1) {
          state.currentStakeIndex = idx;
          openStakeModal();
        } else {
          const r = parseInt(cell.getAttribute('data-row'), 10);
          const c = parseInt(cell.getAttribute('data-col'), 10);
          openStakeModalByCoord(r, c);
        }
      });
    });
  }

  // --- TRANSFORMACIÓN Y PROYECCIÓN DEL PLANO 2D (ROTACIÓN, ESPEJO, ESCALA) ---
  function getPondTransform() {
    const canvas = dom.lakeTinCanvas;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    state.stakes.forEach(s => {
      if (s.x < minX) minX = s.x;
      if (s.x > maxX) maxX = s.x;
      if (s.y < minY) minY = s.y;
      if (s.y > maxY) maxY = s.y;
    });

    // Considerar esquinas exteriores de cinta si existen
    if (state.project?.settings?.tapeCorners?.corners) {
      state.project.settings.tapeCorners.corners.forEach(c => {
        if (c.x < minX) minX = c.x;
        if (c.x > maxX) maxX = c.x;
        if (c.y < minY) minY = c.y;
        if (c.y > maxY) maxY = c.y;
      });
    }

    if (!isFinite(minX)) {
      minX = 0; maxX = 100; minY = 0; maxY = 100;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const rotDeg = state.canvas.rotationDeg || 0;
    const rad = (rotDeg * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);
    const flip = state.canvas.flipX || false;

    const toTransformed = (x, y) => {
      let dx = x - cx;
      let dy = y - cy;
      if (flip) dx = -dx;
      const rx = dx * cosR - dy * sinR;
      const ry = dx * sinR + dy * cosR;
      return { x: rx + cx, y: ry + cy };
    };

    const fromTransformed = (tx, ty) => {
      let rx = tx - cx;
      let ry = ty - cy;
      let dx = rx * cosR + ry * sinR;
      let dy = -rx * sinR + ry * cosR;
      if (flip) dx = -dx;
      return { x: dx + cx, y: dy + cy };
    };

    let tMinX = Infinity, tMaxX = -Infinity, tMinY = Infinity, tMaxY = -Infinity;
    state.stakes.forEach(s => {
      const t = toTransformed(s.x, s.y);
      if (t.x < tMinX) tMinX = t.x;
      if (t.x > tMaxX) tMaxX = t.x;
      if (t.y < tMinY) tMinY = t.y;
      if (t.y > tMaxY) tMaxY = t.y;
    });

    if (state.project?.settings?.tapeCorners?.corners) {
      state.project.settings.tapeCorners.corners.forEach(c => {
        const t = toTransformed(c.x, c.y);
        if (t.x < tMinX) tMinX = t.x;
        if (t.x > tMaxX) tMaxX = t.x;
        if (t.y < tMinY) tMinY = t.y;
        if (t.y > tMaxY) tMaxY = t.y;
      });
    }

    if (!isFinite(tMinX)) {
      tMinX = 0; tMaxX = 100; tMinY = 0; tMaxY = 100;
    }

    const spanX = Math.max(10, tMaxX - tMinX);
    const spanY = Math.max(10, tMaxY - tMinY);
    const padding = 50 * (window.devicePixelRatio || 1);
    const availW = (canvas ? canvas.width : 800) - padding * 2;
    const availH = (canvas ? canvas.height : 500) - padding * 2;
    const scale = Math.min(availW / spanX, availH / spanY) * state.canvas.zoom;

    const toPx = (x, y) => {
      const t = toTransformed(x, y);
      return {
        x: padding + state.canvas.panX + (t.x - tMinX) * scale,
        y: padding + state.canvas.panY + (t.y - tMinY) * scale
      };
    };

    const fromPx = (px, py) => {
      const tx = tMinX + (px - padding - state.canvas.panX) / scale;
      const ty = tMinY + (py - padding - state.canvas.panY) / scale;
      return fromTransformed(tx, ty);
    };

    return { toTransformed, fromTransformed, toPx, fromPx, scale, rotDeg, flip, minX, maxX, minY, maxY, tMinX, tMaxX, tMinY, tMaxY };
  }

  // --- MOTOR GRÁFICO DEL PLANO 2D ESCALA REAL (TIN / DELAUNAY CON VISTA ROTABLE) ---
  function renderCanvas2D() {
    const canvas = dom.lakeTinCanvas;
    if (!canvas || state.stakes.length === 0) return;

    // Ajustar resolución interna al tamaño CSS
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * (window.devicePixelRatio || 1) || canvas.height !== rect.height * (window.devicePixelRatio || 1)) {
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
    }

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const isDark = document.body.classList.contains('dark-mode');
    const transform = getPondTransform();

    // Actualizar badge de orientación visual
    if (dom.canvasViewBadge) {
      let badgeText = `👁️ Perspectiva: ${transform.rotDeg}° Normal`;
      if (transform.rotDeg === 90) badgeText = `👁️ Perspectiva: 90° Derecha`;
      if (transform.rotDeg === 180) badgeText = `👁️ Perspectiva: 180° Invertida`;
      if (transform.rotDeg === 270) badgeText = `👁️ Perspectiva: 270° Izquierda`;
      if (transform.flip) badgeText += ' (🪞 Espejo)';
      dom.canvasViewBadge.textContent = badgeText;
    }

    // 1. Malla de fondo sutil rotada con la vista
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    const gridStep = state.project.settings.dx || 10;
    for (let gx = Math.floor(transform.minX / gridStep) * gridStep; gx <= transform.maxX + gridStep; gx += gridStep) {
      const pTop = transform.toPx(gx, transform.minY);
      const pBot = transform.toPx(gx, transform.maxY);
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pBot.x, pBot.y);
      ctx.stroke();
    }
    for (let gy = Math.floor(transform.minY / gridStep) * gridStep; gy <= transform.maxY + gridStep; gy += gridStep) {
      const pLeft = transform.toPx(transform.minX, gy);
      const pRight = transform.toPx(transform.maxX, gy);
      ctx.beginPath();
      ctx.moveTo(pLeft.x, pLeft.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.stroke();
    }

    // 1.5 Dibujar Cuadrilátero Exterior con Cinta (si existe en modo tape)
    if (state.project?.settings?.tapeCorners?.corners) {
      const corners = state.project.settings.tapeCorners.corners;
      if (corners.length === 4) {
        ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.7)' : 'rgba(2, 132, 199, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const cp0 = transform.toPx(corners[0].x, corners[0].y);
        ctx.moveTo(cp0.x, cp0.y);
        for (let i = 1; i < 4; i++) {
          const cpi = transform.toPx(corners[i].x, corners[i].y);
          ctx.lineTo(cpi.x, cpi.y);
        }
        ctx.closePath();
        ctx.stroke();

        // Rótulos de esquinas E1..E4
        corners.forEach((cn, i) => {
          const cp = transform.toPx(cn.x, cn.y);
          ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
          ctx.font = `bold ${Math.max(10, 11 * (window.devicePixelRatio || 1))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(`E${i + 1}`, cp.x, cp.y - 14);
        });
      }
    }

    // 2. Calcular y Dibujar Red de Triángulos TIN (Delaunay) y Aristas con Distancias
    const tin = window.TopoMath.computeDelaunayTIN(state.stakes);
    state.canvas.tinData = tin;

    const showTin = dom.chkShowTin ? dom.chkShowTin.checked : true;
    const showDist = dom.chkShowDistances ? dom.chkShowDistances.checked : true;
    const showFlow = dom.chkShowFlow ? dom.chkShowFlow.checked : true;

    // Dibujar aristas TIN
    if (showTin) {
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      tin.edges.forEach(edge => {
        const p1 = state.stakes[edge.from];
        const p2 = state.stakes[edge.to];
        if (!p1 || !p2) return;

        const pt1 = transform.toPx(p1.x, p1.y);
        const pt2 = transform.toPx(p2.x, p2.y);

        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    // Dibujar etiquetas de distancia real en metros sobre las aristas
    if (showDist) {
      ctx.font = `bold ${Math.max(10, 11 * (window.devicePixelRatio || 1))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      tin.edges.forEach(edge => {
        const p1 = state.stakes[edge.from];
        const p2 = state.stakes[edge.to];
        if (!p1 || !p2) return;

        const pt1 = transform.toPx(p1.x, p1.y);
        const pt2 = transform.toPx(p2.x, p2.y);
        const midX = (pt1.x + pt2.x) / 2;
        const midY = (pt1.y + pt2.y) / 2;

        const label = `${edge.length.toFixed(1)}m`;
        const textWidth = ctx.measureText(label).width + 8;
        const textHeight = 16 * (window.devicePixelRatio || 1);

        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)';
        ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(midX - textWidth / 2, midY - textHeight / 2, textWidth, textHeight, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDark ? '#93c5fd' : '#0369a1';
        ctx.fillText(label, midX, midY);
      });
    }

    // 3. Dibujar Flechas de Flujo de Drenaje hacia la Caja de Pesca
    const boxRow = state.project.settings.boxRow ?? 0;
    const boxCol = state.project.settings.boxCol ?? 0;
    const boxStake = state.stakes.find(s => s.row === boxRow && s.col === boxCol) || state.stakes[0];

    if (showFlow && boxStake) {
      const bpt = transform.toPx(boxStake.x, boxStake.y);

      state.stakes.forEach(s => {
        if (s.id === boxStake.id) return;
        const spt = transform.toPx(s.x, s.y);

        const angle = Math.atan2(bpt.y - spt.y, bpt.x - spt.x);
        const len = 16 * (window.devicePixelRatio || 1);
        const ax = spt.x + Math.cos(angle) * len;
        const ay = spt.y + Math.sin(angle) * len;

        ctx.strokeStyle = 'rgba(2, 132, 199, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(spt.x, spt.y);
        ctx.lineTo(ax, ay);
        ctx.stroke();

        // Punta de flecha
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 5 * Math.cos(angle - Math.PI / 6), ay - 5 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(ax - 5 * Math.cos(angle + Math.PI / 6), ay - 5 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      });
    }

    // 4. Dibujar Nodos de Estacas
    const nodeRadius = 14 * (window.devicePixelRatio || 1);
    const tolMeters = (state.project.settings.toleranceCm || 2.0) / 100;

    state.stakes.forEach(stake => {
      const pt = transform.toPx(stake.x, stake.y);
      const px = pt.x, py = pt.y;
      const isCaja = (boxStake && stake.id === boxStake.id);
      const isHovered = (state.canvas.hoveredStake && state.canvas.hoveredStake.id === stake.id);

      let fillColor = '#ffffff';
      let strokeColor = '#000000';
      let textColor = '#000000';

      if (isCaja) {
        fillColor = '#f59e0b';
        strokeColor = '#b45309';
        textColor = '#78350f';
      } else if (stake.reading === null || stake.reading === undefined) {
        fillColor = isDark ? '#1e293b' : '#ffffff';
        strokeColor = isDark ? '#94a3b8' : '#334155';
        textColor = isDark ? '#f8fafc' : '#000000';
      } else {
        const evalRes = window.TopoMath.evaluateStatus(stake.cutFill, tolMeters);
        if (evalRes.status === 'A_NIVEL') {
          fillColor = '#16a34a';
          strokeColor = '#14532d';
          textColor = '#ffffff';
        } else if (evalRes.status === 'CORTE') {
          fillColor = '#dc2626';
          strokeColor = '#7f1d1d';
          textColor = '#ffffff';
        } else {
          fillColor = '#0284c7';
          strokeColor = '#075985';
          textColor = '#ffffff';
        }
      }

      // Anillo de modo replanteo
      if (state.isEditMode) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(px, py, nodeRadius + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Círculo del nodo
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = isHovered ? '#00ff88' : strokeColor;
      ctx.lineWidth = isHovered ? 4 : 2.5;

      ctx.beginPath();
      ctx.arc(px, py, nodeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Alerta de empozamiento / charco
      if (stake.hasPuddleWarning) {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(px + nodeRadius * 0.7, py - nodeRadius * 0.7, 7 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${9 * (window.devicePixelRatio || 1)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('!', px + nodeRadius * 0.7, py - nodeRadius * 0.7 + 3);
      }

      // Texto de Código de Estaca
      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.max(10, 11 * (window.devicePixelRatio || 1))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stake.code, px, py);

      // Cota Rasante o Desbalance debajo de la estaca
      let subLabel = `${stake.designElevation.toFixed(2)}`;
      if (stake.cutFill !== null && stake.cutFill !== undefined) {
        subLabel = `${stake.cutFill > 0 ? '+' : ''}${stake.cutFill.toFixed(2)}m`;
      }

      ctx.font = `bold ${Math.max(9, 10 * (window.devicePixelRatio || 1))}px monospace`;
      ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
      ctx.fillText(subLabel, px, py + nodeRadius + 12);
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
    pushNavigationState(state.currentTab, 'modal-stake-input');
  }

  function closeStakeModal() {
    requestCloseModal('modal-stake-input');
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
    dom.cfgRowPattern.value = s.rowPattern || '5, 7, 7, 7, 5';
    dom.cfgDx.value = s.dx;
    dom.cfgDy.value = s.dy;
    dom.cfgBoxElev.value = s.boxElevation.toFixed(3);
    dom.cfgSlopeMode.value = s.slopeMode || 'orthogonal';
    dom.cfgSlopeX.value = s.slopeX ?? 0.50;
    dom.cfgSlopeY.value = s.slopeY ?? 0.80;
    dom.cfgSlopeRadial.value = s.slopeRadial ?? 0.60;
    dom.cfgTolerance.value = s.toleranceCm ?? 2.0;

    // Valores para modo cinta
    if (dom.tapeL12) dom.tapeL12.value = s.tapeL12 ?? 60.0;
    if (dom.tapeL23) dom.tapeL23.value = s.tapeL23 ?? 45.0;
    if (dom.tapeL34) dom.tapeL34.value = s.tapeL34 ?? 58.0;
    if (dom.tapeL41) dom.tapeL41.value = s.tapeL41 ?? 44.0;
    if (dom.tapeD13) dom.tapeD13.value = s.tapeD13 ?? 74.50;
    if (dom.tapeD24) dom.tapeD24.value = s.tapeD24 ?? 73.80;
    if (dom.tapeRowPattern) dom.tapeRowPattern.value = s.rowPattern || '5, 7, 7, 7, 5';

    selectTapeAlignment(s.rowAlignment || 'center');

    // Configuración de modo activo
    const currentMode = s.meshMode || 'tape';
    setConfigMode(currentMode);

    if (currentMode === 'talud') {
      if (s.taludLongSections && dom.taludLongSections) dom.taludLongSections.value = s.taludLongSections;
      if (s.taludWidthSections && dom.taludWidthSections) dom.taludWidthSections.value = s.taludWidthSections;
      if (s.taludAngleDeg !== undefined) {
        state.taludAngleDeg = s.taludAngleDeg;
        if (Math.abs(s.taludAngleDeg - 90) < 0.1) {
          selectTaludAngleMode('90');
        } else {
          selectTaludAngleMode('diag');
        }
      }
    }

    setBoxMode(s.boxMode || 'stake');

    // Actualizar selects de fila y columna de la caja
    updateBoxSelectOptions(s.rows, s.cols, s.boxRow, s.boxCol);

    // Visibilidad de campos según modo de pendiente
    updateSlopeModeFields(s.slopeMode);
  }

  function setConfigMode(mode) {
    state.configMode = mode;
    if (dom.cfgModeTapeBtn) dom.cfgModeTapeBtn.classList.toggle('active', mode === 'tape');
    if (dom.cfgModeRegularBtn) dom.cfgModeRegularBtn.classList.toggle('active', mode === 'regular');
    if (dom.cfgModeTaludBtn) dom.cfgModeTaludBtn.classList.toggle('active', mode === 'talud');

    if (dom.cfgSectionTape) dom.cfgSectionTape.style.display = (mode === 'tape') ? 'block' : 'none';
    if (dom.cfgSectionRegular) dom.cfgSectionRegular.style.display = (mode === 'regular') ? 'block' : 'none';
    if (dom.cfgSectionTalud) dom.cfgSectionTalud.style.display = (mode === 'talud') ? 'block' : 'none';

    if (mode === 'tape') {
      updateTapeClosurePreview();
    }
  }

  function setBoxMode(mode) {
    state.boxMode = mode;
    if (dom.boxModeStakeBtn) dom.boxModeStakeBtn.classList.toggle('active', mode === 'stake');
    if (dom.boxModeTapeBtn) dom.boxModeTapeBtn.classList.toggle('active', mode === 'tape');
    if (dom.boxSectionStake) dom.boxSectionStake.style.display = (mode === 'stake') ? 'block' : 'none';
    if (dom.boxSectionTape) dom.boxSectionTape.style.display = (mode === 'tape') ? 'block' : 'none';
  }

  function selectTapeAlignment(align) {
    state.tapeAlignment = align;
    if (dom.tapeAlignCenterBtn) dom.tapeAlignCenterBtn.classList.toggle('active', align === 'center');
    if (dom.tapeAlignLeftBtn) dom.tapeAlignLeftBtn.classList.toggle('active', align === 'left');
    if (dom.tapeAlignRightBtn) dom.tapeAlignRightBtn.classList.toggle('active', align === 'right');
  }

  function updateTapeClosurePreview() {
    if (!dom.tapeL12 || !dom.tapeL23 || !dom.tapeL34 || !dom.tapeL41 || !dom.tapeD13) return;
    const l12 = parseFloat(dom.tapeL12.value);
    const l23 = parseFloat(dom.tapeL23.value);
    const l34 = parseFloat(dom.tapeL34.value);
    const l41 = parseFloat(dom.tapeL41.value);
    const d13 = parseFloat(dom.tapeD13.value);
    const d24 = parseFloat(dom.tapeD24 ? dom.tapeD24.value : 0) || 0;

    const res = window.TopoMath.solveQuadrilateralTape(l12, l23, l34, l41, d13, d24);
    if (res.success) {
      if (dom.tapeClosureBadge) {
        dom.tapeClosureBadge.textContent = res.description;
        dom.tapeClosureBadge.style.background = res.isClosed ? '#16a34a' : '#f59e0b';
      }
      if (dom.tapeClosureDesc) {
        if (d24 > 0) {
          dom.tapeClosureDesc.textContent = res.isClosed
            ? `✔ Cierre de cinta validado. Diagonal 2 calculada: ${res.calculatedD24.toFixed(2)}m (Medida: ${d24.toFixed(2)}m, diferencia: ${res.closureErrorCm.toFixed(1)} cm)`
            : `⚠ Descuadre en cinta: Diagonal 2 calculada ${res.calculatedD24.toFixed(2)}m vs medida ${d24.toFixed(2)}m (Diferencia: ${res.closureErrorCm.toFixed(1)} cm). Revisa cintada en campo.`;
        } else {
          dom.tapeClosureDesc.textContent = `Diagonal 2 teórica estimada: ${res.calculatedD24.toFixed(2)}m. Ingrese la medida de campo en D2-4 para validar el cierre geométrico.`;
        }
      }
    } else {
      if (dom.tapeClosureBadge) {
        dom.tapeClosureBadge.textContent = 'Error de Geometría';
        dom.tapeClosureBadge.style.background = '#dc2626';
      }
      if (dom.tapeClosureDesc) {
        dom.tapeClosureDesc.textContent = res.error;
      }
    }
  }

  function calcBoxTapePosition() {
    if (!dom.boxDistCorner1 || !dom.boxDistCorner2) return;
    const quad = state.project?.settings?.tapeCorners;
    if (!quad || !quad.corners) {
      alert('Primero guarde o calcule el cuadrilátero del lago con las medidas de cinta.');
      return;
    }
    const c1Val = parseInt(dom.boxRefCorner1.value, 10);
    const c2Val = parseInt(dom.boxRefCorner2.value, 10);
    const corner1 = quad.corners.find(c => c.id === c1Val) || quad.corners[0];
    const corner2 = quad.corners.find(c => c.id === c2Val) || quad.corners[1];
    const d1 = parseFloat(dom.boxDistCorner1.value);
    const d2 = parseFloat(dom.boxDistCorner2.value);

    const res = window.TopoMath.solveFishingBoxFromCorners(corner1, d1, corner2, d2);
    if (res.success) {
      state.boxTapeCoords = { x: res.x, y: res.y };
      if (dom.boxTapeResultBadge) {
        dom.boxTapeResultBadge.textContent = `✔ Posición: X=${res.x.toFixed(2)}m, Y=${res.y.toFixed(2)}m`;
        dom.boxTapeResultBadge.style.background = '#16a34a';
      }
      alert(`✔ Caja de pesca calculada por cinta:\nCoordenadas: X=${res.x.toFixed(2)} m, Y=${res.y.toFixed(2)} m`);
    } else {
      alert('Error al trilaterar caja de pesca:\n' + res.error);
    }
  }

  function selectTaludAngleMode(mode) {
    if (mode === '90') {
      if (dom.taludBtnAngle90) {
        dom.taludBtnAngle90.classList.remove('btn-outline');
        dom.taludBtnAngle90.classList.add('btn-primary');
      }
      if (dom.taludBtnAngleDiag) {
        dom.taludBtnAngleDiag.classList.remove('btn-primary');
        dom.taludBtnAngleDiag.classList.add('btn-outline');
      }
      if (dom.taludDiagonalInputs) dom.taludDiagonalInputs.style.display = 'none';
      state.taludAngleDeg = 90;
      if (dom.taludAngleBadge) {
        dom.taludAngleBadge.textContent = '90.0° (Escuadra ~90°)';
        dom.taludAngleBadge.style.background = '#0284c7';
      }
    } else {
      if (dom.taludBtnAngleDiag) {
        dom.taludBtnAngleDiag.classList.remove('btn-outline');
        dom.taludBtnAngleDiag.classList.add('btn-primary');
      }
      if (dom.taludBtnAngle90) {
        dom.taludBtnAngle90.classList.remove('btn-primary');
        dom.taludBtnAngle90.classList.add('btn-outline');
      }
      if (dom.taludDiagonalInputs) dom.taludDiagonalInputs.style.display = 'grid';
      updateTaludAngleFromDiagonal();
    }
  }

  function updateTaludAngleFromDiagonal() {
    if (!dom.taludDiagA || !dom.taludDiagB || !dom.taludDiagC) return;
    const a = parseFloat(dom.taludDiagA.value);
    const b = parseFloat(dom.taludDiagB.value);
    const c = parseFloat(dom.taludDiagC.value);
    const res = window.TopoMath.solveLawOfCosinesAngle(a, b, c);
    if (res.success) {
      state.taludAngleDeg = res.angleDeg;
      if (dom.taludAngleBadge) {
        dom.taludAngleBadge.textContent = res.description;
        dom.taludAngleBadge.style.background = '#0284c7';
      }
    } else {
      if (dom.taludAngleBadge) {
        dom.taludAngleBadge.textContent = 'Error: ' + res.error;
        dom.taludAngleBadge.style.background = '#dc2626';
      }
    }
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
    const s = state.project.settings;
    state.project.name = newName;

    const newBoxElev = parseFloat(dom.cfgBoxElev.value);
    const newSlopeMode = dom.cfgSlopeMode.value;
    const newSlopeX = parseFloat(dom.cfgSlopeX.value);
    const newSlopeY = parseFloat(dom.cfgSlopeY.value);
    const newSlopeRadial = parseFloat(dom.cfgSlopeRadial.value);
    const newTolerance = parseFloat(dom.cfgTolerance.value);

    s.boxElevation = newBoxElev;
    s.slopeMode = newSlopeMode;
    s.slopeX = newSlopeX;
    s.slopeY = newSlopeY;
    s.slopeRadial = newSlopeRadial;
    s.toleranceCm = newTolerance;

    let rawStakes;

    if (state.configMode === 'tape') {
      const l12 = parseFloat(dom.tapeL12.value);
      const l23 = parseFloat(dom.tapeL23.value);
      const l34 = parseFloat(dom.tapeL34.value);
      const l41 = parseFloat(dom.tapeL41.value);
      const d13 = parseFloat(dom.tapeD13.value);
      const d24 = parseFloat(dom.tapeD24 ? dom.tapeD24.value : 0) || 0;
      const rowPat = dom.tapeRowPattern.value.trim() || '5, 7, 7, 7, 5';
      const alignment = state.tapeAlignment || 'center';

      const quadRes = window.TopoMath.solveQuadrilateralTape(l12, l23, l34, l41, d13, d24);
      if (!quadRes.success) {
        alert('Error en medidas de cinta:\n' + quadRes.error);
        return;
      }

      s.meshMode = 'tape';
      s.tapeL12 = l12;
      s.tapeL23 = l23;
      s.tapeL34 = l34;
      s.tapeL41 = l41;
      s.tapeD13 = d13;
      s.tapeD24 = d24;
      s.tapeCorners = quadRes;
      s.rowPattern = rowPat;
      s.rowAlignment = alignment;

      const rowCounts = rowPat.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n > 0);
      s.rows = rowCounts.length > 0 ? rowCounts.length : 5;
      s.cols = rowCounts.length > 0 ? Math.max(...rowCounts) : 7;

      rawStakes = window.TopoMath.generateQuadrilateralMesh(state.project.id, quadRes, s);
    } else if (state.configMode === 'talud') {
      const taludRes = window.TopoMath.generateTaludMesh(
        dom.taludLongSections.value,
        dom.taludWidthSections.value,
        state.taludAngleDeg,
        s,
        state.project.id
      );
      rawStakes = taludRes.stakes;
      s.meshMode = 'talud';
      s.rows = taludRes.numRows;
      s.cols = taludRes.numCols;
      s.taludLongSections = dom.taludLongSections.value;
      s.taludWidthSections = dom.taludWidthSections.value;
      s.taludAngleDeg = state.taludAngleDeg;
    } else {
      const newRows = parseInt(dom.cfgRows.value, 10) || 5;
      const newCols = parseInt(dom.cfgCols.value, 10) || 8;
      const newRowPattern = dom.cfgRowPattern.value.trim();
      const newDx = parseFloat(dom.cfgDx.value) || 10;
      const newDy = parseFloat(dom.cfgDy.value) || 10;

      s.meshMode = 'regular';
      s.dx = newDx;
      s.dy = newDy;
      s.rowPattern = newRowPattern;

      const rowCounts = newRowPattern
        ? newRowPattern.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n > 0)
        : [];
      s.rows = rowCounts.length > 0 ? rowCounts.length : newRows;
      s.cols = rowCounts.length > 0 ? Math.max(...rowCounts) : newCols;

      rawStakes = window.TopoMath.generateStakes(state.project.id, s);
    }

    // Ubicación de caja de pesca
    if (state.boxMode === 'tape' && state.boxTapeCoords) {
      s.boxX = state.boxTapeCoords.x;
      s.boxY = state.boxTapeCoords.y;
      let closestStake = rawStakes[0];
      let minDist = Infinity;
      rawStakes.forEach(st => {
        const d = Math.hypot(st.x - s.boxX, st.y - s.boxY);
        if (d < minDist) { minDist = d; closestStake = st; }
      });
      s.boxRow = closestStake.row;
      s.boxCol = closestStake.col;
    } else {
      const newBoxRow = parseInt(dom.cfgBoxRow.value, 10) || 0;
      const newBoxCol = parseInt(dom.cfgBoxCol.value, 10) || 0;
      s.boxRow = newBoxRow;
      s.boxCol = newBoxCol;
      delete s.boxX;
      delete s.boxY;
    }

    if (s.boxRow >= s.rows) s.boxRow = 0;
    if (s.boxCol >= s.cols) s.boxCol = 0;

    // Preservar lecturas previas si existían
    const existingStakesMap = new Map();
    state.stakes.forEach(st => {
      existingStakesMap.set(st.code, st);
    });

    const updatedStakes = rawStakes.map(st => {
      const existing = existingStakesMap.get(st.code);
      let designElev;
      let isCustom = false;

      if (existing && existing.isCustomDesign) {
        designElev = existing.designElevation;
        isCustom = true;
      } else {
        const res = window.TopoMath.calculateDesignElevationAtCoord(st.x, st.y, s, []);
        designElev = res.elevation;
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

      return {
        ...st,
        designElevation: designElev,
        isCustomDesign: isCustom,
        reading,
        measuredElevation: groundElev,
        stationId,
        measuredAt: existing ? existing.measuredAt : null,
        cutFill,
        status,
        hasPuddleWarning: false,
        puddleReason: null,
        note: existing ? (existing.note || '') : ''
      };
    });

    await window.topoDB.clearStakesForProject(state.project.id);
    await window.topoDB.saveStakesBulk(updatedStakes);
    await window.topoDB.saveProject(state.project);

    state.stakes = updatedStakes;
    updateCalculations();
    renderAll();

    alert(`✔ Configuración guardada y rasantes recalculadas.\nMalla activa: ${state.stakes.length} estacas.`);
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
    pushNavigationState(state.currentTab, 'modal-pc-assistant');
  }

  function closePCAssistant() {
    requestCloseModal('modal-pc-assistant');
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

  // --- PESTAÑA CUBICACIÓN EXACTA TIN Y MAQUINARIA PESADA ---
  function selectSoilPreset(presetKey) {
    const preset = window.TopoMath.SOIL_PRESETS[presetKey];
    if (!preset) return;

    if (dom.machPresetMixto) dom.machPresetMixto.classList.toggle('active', presetKey === 'mixto');
    if (dom.machPresetPenon) dom.machPresetPenon.classList.toggle('active', presetKey === 'penon');
    if (dom.machPresetArcilla) dom.machPresetArcilla.classList.toggle('active', presetKey === 'arcilla');

    if (dom.machFactorK) dom.machFactorK.value = preset.factorLlenadoK;
    if (dom.machCycleTime) dom.machCycleTime.value = preset.tiempoCicloSeg;
    if (dom.machEsponjamiento) dom.machEsponjamiento.value = preset.esponjamientoPct;
    if (dom.machCompactacion) dom.machCompactacion.value = preset.contraccionPct;
    if (dom.machSoilBadge) dom.machSoilBadge.textContent = preset.badge;

    state.machineryPreset = presetKey;
    saveMachineryParamsToStorage();
    renderMachineryTab();
  }

  function selectTruckCapacity(cap) {
    const numCap = parseFloat(cap);
    if (isNaN(numCap)) return;

    if (dom.machTruckBtn15) dom.machTruckBtn15.classList.toggle('active', numCap === 15);
    if (dom.machTruckBtn155) dom.machTruckBtn155.classList.toggle('active', Math.abs(numCap - 15.5) < 0.01);
    if (dom.machTruckBtn16) dom.machTruckBtn16.classList.toggle('active', numCap === 16);

    if (dom.machTruckCap) dom.machTruckCap.value = numCap;
    saveMachineryParamsToStorage();
    renderMachineryTab();
  }

  function saveMachineryParamsToStorage() {
    try {
      const params = {
        soilPreset: state.machineryPreset || 'mixto',
        bucketCapQ: parseFloat(dom.machBucketCap ? dom.machBucketCap.value : 1.0) || 1.0,
        factorLlenadoK: parseFloat(dom.machFactorK ? dom.machFactorK.value : 0.72) || 0.72,
        tiempoCicloSeg: parseFloat(dom.machCycleTime ? dom.machCycleTime.value : 24) || 24,
        efficiencyPct: parseFloat(dom.machEfficiency ? dom.machEfficiency.value : 83) || 83,
        esponjamientoPct: parseFloat(dom.machEsponjamiento ? dom.machEsponjamiento.value : 35) || 35,
        contraccionPct: parseFloat(dom.machCompactacion ? dom.machCompactacion.value : 12) || 12,
        horasJornal: parseFloat(dom.machHoursPerDay ? dom.machHoursPerDay.value : 8) || 8,
        horasPerfilado: parseFloat(dom.machProfilingHours ? dom.machProfilingHours.value : 0) || 0,
        capacidadDobleTroque: parseFloat(dom.machTruckCap ? dom.machTruckCap.value : 15.5) || 15.5,
        tiempoViajeBotaderoMin: parseFloat(dom.machHaulCycleTime ? dom.machHaulCycleTime.value : 25) || 25,
        compensarRelleno: dom.machCompensateToggle ? dom.machCompensateToggle.checked : true
      };
      localStorage.setItem('topolago_machinery_calibrated', JSON.stringify(params));
    } catch (e) {
      console.warn('Error al guardar parámetros de maquinaria en storage:', e);
    }
  }

  function loadSavedMachineryParams() {
    try {
      const savedStr = localStorage.getItem('topolago_machinery_calibrated');
      if (!savedStr) return;
      const p = JSON.parse(savedStr);
      if (p.soilPreset) state.machineryPreset = p.soilPreset;
      if (dom.machBucketCap && p.bucketCapQ !== undefined) dom.machBucketCap.value = p.bucketCapQ;
      if (dom.machFactorK && p.factorLlenadoK !== undefined) dom.machFactorK.value = p.factorLlenadoK;
      if (dom.machCycleTime && p.tiempoCicloSeg !== undefined) dom.machCycleTime.value = p.tiempoCicloSeg;
      if (dom.machEfficiency && p.efficiencyPct !== undefined) dom.machEfficiency.value = p.efficiencyPct;
      if (dom.machEsponjamiento && p.esponjamientoPct !== undefined) dom.machEsponjamiento.value = p.esponjamientoPct;
      if (dom.machCompactacion && p.contraccionPct !== undefined) dom.machCompactacion.value = p.contraccionPct;
      if (dom.machHoursPerDay && p.horasJornal !== undefined) dom.machHoursPerDay.value = p.horasJornal;
      if (dom.machProfilingHours && p.horasPerfilado !== undefined) dom.machProfilingHours.value = p.horasPerfilado;
      if (dom.machTruckCap && p.capacidadDobleTroque !== undefined) dom.machTruckCap.value = p.capacidadDobleTroque;
      if (dom.machHaulCycleTime && p.tiempoViajeBotaderoMin !== undefined) dom.machHaulCycleTime.value = p.tiempoViajeBotaderoMin;
      if (dom.machCompensateToggle && p.compensarRelleno !== undefined) dom.machCompensateToggle.checked = p.compensarRelleno;

      if (p.soilPreset) {
        if (dom.machPresetMixto) dom.machPresetMixto.classList.toggle('active', p.soilPreset === 'mixto');
        if (dom.machPresetPenon) dom.machPresetPenon.classList.toggle('active', p.soilPreset === 'penon');
        if (dom.machPresetArcilla) dom.machPresetArcilla.classList.toggle('active', p.soilPreset === 'arcilla');
        const prObj = window.TopoMath.SOIL_PRESETS[p.soilPreset];
        if (prObj && dom.machSoilBadge) dom.machSoilBadge.textContent = prObj.badge;
      }
      if (p.capacidadDobleTroque !== undefined) {
        if (dom.machTruckBtn15) dom.machTruckBtn15.classList.toggle('active', p.capacidadDobleTroque === 15);
        if (dom.machTruckBtn155) dom.machTruckBtn155.classList.toggle('active', Math.abs(p.capacidadDobleTroque - 15.5) < 0.01);
        if (dom.machTruckBtn16) dom.machTruckBtn16.classList.toggle('active', p.capacidadDobleTroque === 16);
      }
    } catch (e) {
      console.warn('Error al cargar parámetros guardados:', e);
    }
  }

  function renderMachineryTab() {
    if (!state.project || !state.stakes) return;

    // Calcular o reutilizar TIN Delaunay
    const tin = state.canvas.tinData || window.TopoMath.computeDelaunayTIN(state.stakes);
    state.canvas.tinData = tin;

    const s = state.project.settings;
    const tinVolumes = window.TopoMath.calculateExactTINVolumes(state.stakes, tin ? tin.triangles : [], s);

    // Parámetros Kobelco 210 LC y Flota Doble Troque
    const bucketCapQ = parseFloat(dom.machBucketCap ? dom.machBucketCap.value : 1.0) || 1.0;
    const factorLlenadoK = parseFloat(dom.machFactorK ? dom.machFactorK.value : 0.72) || 0.72;
    const tiempoCicloSeg = parseFloat(dom.machCycleTime ? dom.machCycleTime.value : 24) || 24;
    const efficiencyPct = parseFloat(dom.machEfficiency ? dom.machEfficiency.value : 83) || 83;
    const esponjamientoPct = parseFloat(dom.machEsponjamiento ? dom.machEsponjamiento.value : 35) || 35;
    const contraccionPct = parseFloat(dom.machCompactacion ? dom.machCompactacion.value : 12) || 12;
    const horasJornal = parseFloat(dom.machHoursPerDay ? dom.machHoursPerDay.value : 8) || 8;
    const horasPerfilado = parseFloat(dom.machProfilingHours ? dom.machProfilingHours.value : 0) || 0;
    const capacidadVolqueta = parseFloat(dom.machTruckCap ? dom.machTruckCap.value : 15.5) || 15.5;
    const tiempoViajeBotaderoMin = parseFloat(dom.machHaulCycleTime ? dom.machHaulCycleTime.value : 25) || 25;
    const compensarRelleno = dom.machCompensateToggle ? dom.machCompensateToggle.checked : true;
    const soilPreset = state.machineryPreset || 'mixto';

    const machSchedule = window.TopoMath.calculateMachinerySchedule(tinVolumes, {
      equipmentName: 'Kobelco 210 LC',
      bucketCapQ,
      factorLlenadoK,
      tiempoCicloSeg,
      efficiencyPct,
      esponjamientoPct,
      contraccionPct,
      horasJornal,
      horasPerfilado,
      capacidadDobleTroque: capacidadVolqueta,
      tiempoViajeBotaderoMin,
      compensarRelleno,
      soilPreset
    });

    if (dom.machTinMethodBadge) {
      dom.machTinMethodBadge.textContent = tinVolumes.method || 'Subdivisión Cota Cero';
    }

    if (dom.machAreaVal) dom.machAreaVal.textContent = `${tinVolumes.totalAreaMeasured.toFixed(1)} m²`;
    if (dom.machTrianglesCount) {
      dom.machTrianglesCount.textContent = `${tinVolumes.measuredTrianglesCount} de ${tinVolumes.totalTrianglesCount || 0} triángulos`;
    }

    if (dom.machCutBankVal) dom.machCutBankVal.textContent = `${tinVolumes.totalCutVolume.toFixed(2)} m³`;
    if (dom.machFillGeomVal) dom.machFillGeomVal.textContent = `${tinVolumes.totalFillVolume.toFixed(2)} m³`;
    if (dom.machBalanceVal) dom.machBalanceVal.textContent = `${tinVolumes.netBalance > 0 ? '+' : ''}${tinVolumes.netBalance.toFixed(2)} m³`;

    if (dom.machBalanceStatus) {
      if (tinVolumes.netBalance > 2) {
        dom.machBalanceStatus.textContent = 'Excedente (Sobra tierra)';
        dom.machBalanceStatus.style.color = '#dc2626';
      } else if (tinVolumes.netBalance < -2) {
        dom.machBalanceStatus.textContent = 'Déficit (Falta tierra)';
        dom.machBalanceStatus.style.color = '#0284c7';
      } else {
        dom.machBalanceStatus.textContent = 'Equilibrado en cota rasante';
        dom.machBalanceStatus.style.color = '#16a34a';
      }
    }

    // Excavadora Kobelco 210 LC
    if (dom.machExcYieldLabel) {
      dom.machExcYieldLabel.textContent = `R_banco = ${machSchedule.rendimientoBancoHora.toFixed(1)} m³/h`;
    }
    if (dom.machExcFormulaDesc) {
      dom.machExcFormulaDesc.textContent = `R_suelto = ${machSchedule.rendimientoSueltoHora.toFixed(1)} m³/h (Q=${bucketCapQ.toFixed(2)}m³, K=${factorLlenadoK.toFixed(2)}, T=${tiempoCicloSeg}s, E=${efficiencyPct}%)`;
    }
    if (dom.machExcHours) dom.machExcHours.textContent = `${machSchedule.excavatorHours.toFixed(1)} h`;
    if (dom.machExcHoursDetail) {
      dom.machExcHoursDetail.textContent = `Base: ${machSchedule.excavatorHoursBase.toFixed(1)}h + Perfilado: ${machSchedule.horasPerfilado.toFixed(1)}h`;
    }
    if (dom.machExcDays) dom.machExcDays.textContent = `${machSchedule.excavatorDays.toFixed(1)} días`;
    if (dom.machExcDaysDetail) {
      dom.machExcDaysDetail.textContent = `Turnos de ${horasJornal}h`;
    }

    // Volqueta Doble Troque
    if (dom.machTruckCapLabel) dom.machTruckCapLabel.textContent = `${capacidadVolqueta.toFixed(1)} m³ sueltos`;
    if (dom.machTripsTotal) dom.machTripsTotal.textContent = `${machSchedule.tripsTotalCut} viajes`;
    if (dom.machLooseTotalDesc) dom.machLooseTotalDesc.textContent = `Vol. Suelto Total: ${machSchedule.cutLooseTotal.toFixed(1)} m³`;
    if (dom.machTripsSurplus) dom.machTripsSurplus.textContent = `${machSchedule.tripsSurplusCompensated} viajes`;
    if (dom.machLooseSurplusDesc) dom.machLooseSurplusDesc.textContent = `Excedente Suelto: ${machSchedule.surplusLooseToHaul.toFixed(1)} m³`;

    // Reutilización y préstamo
    if (dom.machBankUsed) dom.machBankUsed.textContent = `${machSchedule.bankUsedOnSite.toFixed(2)} m³`;
    if (dom.machDeficitRow) {
      if (machSchedule.deficitBankRequired > 0.05) {
        dom.machDeficitRow.style.display = 'block';
        if (dom.machBankDeficit) dom.machBankDeficit.textContent = `${machSchedule.deficitBankRequired.toFixed(2)} m³`;
      } else {
        dom.machDeficitRow.style.display = 'none';
      }
    }

    // Ficha de Control en Campo: Operador & Chequeador
    if (dom.machTruckPasses) {
      dom.machTruckPasses.textContent = `${machSchedule.baldadasPorCamion.toFixed(1)} (~${machSchedule.baldadasExactas})`;
    }
    if (dom.machTruckLoadTime) {
      dom.machTruckLoadTime.textContent = `${machSchedule.tiempoCargueCamionMin.toFixed(1)} min`;
    }
    if (dom.machTruckFleetOptimal) {
      dom.machTruckFleetOptimal.textContent = `${machSchedule.volquetasOptimas} volquetas`;
    }
    if (dom.machFleetCycleDesc) {
      dom.machFleetCycleDesc.textContent = `Para ciclo de ${tiempoViajeBotaderoMin} min botadero`;
    }
  }

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

    // Sección 4: Resumen de Movimiento de Tierras (Prismas)
    const sum = state.earthworkSummary || window.TopoMath.calculateEarthworkVolumes(state.stakes, state.project.settings);
    csv += `--- RESUMEN ESTIMADO DE MOVIMIENTO DE TIERRAS (MÉTODO PRISMAS) ---\n`;
    csv += `Volumen Total de Corte${sep}${fmtNum(sum.totalCutVolume, 2)} m³\n`;
    csv += `Volumen Total de Relleno${sep}${fmtNum(sum.totalFillVolume, 2)} m³\n`;
    csv += `Balance Neto de Tierra${sep}${fmtNum(sum.netBalance, 2)} m³\n`;
    csv += `Estacas Medidas${sep}${sum.measuredCount} de ${sum.totalStakes} (${sum.coveragePercent}%)\n\n`;

    // Sección 5: Cubicación Exacta TIN y Flota Calibrada (Kobelco 210 LC & Doble Troque)
    const tin = state.canvas.tinData || window.TopoMath.computeDelaunayTIN(state.stakes);
    const tinVolumes = window.TopoMath.calculateExactTINVolumes(state.stakes, tin ? tin.triangles : [], state.project.settings);
    const bucketCapQ = parseFloat(dom.machBucketCap ? dom.machBucketCap.value : 1.0) || 1.0;
    const factorLlenadoK = parseFloat(dom.machFactorK ? dom.machFactorK.value : 0.72) || 0.72;
    const tiempoCicloSeg = parseFloat(dom.machCycleTime ? dom.machCycleTime.value : 24) || 24;
    const efficiencyPct = parseFloat(dom.machEfficiency ? dom.machEfficiency.value : 83) || 83;
    const esponjamientoPct = parseFloat(dom.machEsponjamiento ? dom.machEsponjamiento.value : 35) || 35;
    const contraccionPct = parseFloat(dom.machCompactacion ? dom.machCompactacion.value : 12) || 12;
    const horasJornal = parseFloat(dom.machHoursPerDay ? dom.machHoursPerDay.value : 8) || 8;
    const horasPerfilado = parseFloat(dom.machProfilingHours ? dom.machProfilingHours.value : 0) || 0;
    const capacidadVolqueta = parseFloat(dom.machTruckCap ? dom.machTruckCap.value : 15.5) || 15.5;
    const tiempoViajeBotaderoMin = parseFloat(dom.machHaulCycleTime ? dom.machHaulCycleTime.value : 25) || 25;
    const compensarRelleno = dom.machCompensateToggle ? dom.machCompensateToggle.checked : true;
    const soilPreset = state.machineryPreset || 'mixto';

    const machSchedule = window.TopoMath.calculateMachinerySchedule(tinVolumes, {
      equipmentName: 'Kobelco 210 LC',
      bucketCapQ,
      factorLlenadoK,
      tiempoCicloSeg,
      efficiencyPct,
      esponjamientoPct,
      contraccionPct,
      horasJornal,
      horasPerfilado,
      capacidadDobleTroque: capacidadVolqueta,
      tiempoViajeBotaderoMin,
      compensarRelleno,
      soilPreset
    });

    csv += `--- CUBICACIÓN EXACTA TIN Y FLOTA DE MAQUINARIA CALIBRADA ---\n`;
    csv += `Método de Cubicación${sep}${tinVolumes.method || 'TIN Exacto con Subdivisión Cota Cero'}\n`;
    csv += `Área Malla Medida${sep}${fmtNum(tinVolumes.totalAreaMeasured, 2)} m²\n`;
    csv += `Triángulos Medidos${sep}${tinVolumes.measuredTrianglesCount} de ${tinVolumes.totalTrianglesCount || 0}\n`;
    csv += `Corte Puro en Banco${sep}${fmtNum(tinVolumes.totalCutVolume, 2)} m³\n`;
    csv += `Relleno Puro Geométrico${sep}${fmtNum(tinVolumes.totalFillVolume, 2)} m³\n`;
    csv += `Balance Neto de Tierra${sep}${fmtNum(tinVolumes.netBalance, 2)} m³\n`;
    csv += `Tipo de Suelo (Preset)${sep}"${window.TopoMath.SOIL_PRESETS[soilPreset] ? window.TopoMath.SOIL_PRESETS[soilPreset].name : 'Personalizado'}"\n`;
    csv += `Equipo Principal${sep}Excavadora Kobelco 210 LC\n`;
    csv += `Capacidad Cucharón Colmado (Q)${sep}${fmtNum(bucketCapQ, 2)} m³\n`;
    csv += `Factor Llenado Cucharón (K)${sep}${fmtNum(factorLlenadoK, 2)} (${(factorLlenadoK * 100).toFixed(0)}%)\n`;
    csv += `Tiempo Ciclo Excavadora (T)${sep}${tiempoCicloSeg} segundos\n`;
    csv += `Eficiencia Operativa${sep}${efficiencyPct} % (50 min/hora)\n`;
    csv += `Factor de Esponjamiento${sep}${esponjamientoPct} %\n`;
    csv += `Factor de Contracción${sep}${contraccionPct} %\n`;
    csv += `Rendimiento Excavadora en Banco (R_banco)${sep}${fmtNum(machSchedule.rendimientoBancoHora, 2)} m³/h banco\n`;
    csv += `Rendimiento Excavadora en Suelto (R_suelto)${sep}${fmtNum(machSchedule.rendimientoSueltoHora, 2)} m³/h suelto\n`;
    csv += `Horas Base Excavación${sep}${fmtNum(machSchedule.excavatorHoursBase, 1)} horas\n`;
    csv += `Horas Adicionales Perfilado/Cuneteo${sep}${fmtNum(machSchedule.horasPerfilado, 1)} horas\n`;
    csv += `Horas Totales Kobelco 210 LC${sep}${fmtNum(machSchedule.excavatorHours, 1)} horas\n`;
    csv += `Jornales Estimados (${horasJornal}h/día)${sep}${fmtNum(machSchedule.excavatorDays, 1)} días\n`;
    csv += `Capacidad Volqueta Doble Troque${sep}${fmtNum(capacidadVolqueta, 1)} m³ sueltos\n`;
    csv += `Baldadas Colmadas por Camión (Q*K)${sep}${fmtNum(machSchedule.baldadasPorCamion, 1)} (~${machSchedule.baldadasExactas} baldadas)\n`;
    csv += `Tiempo Estimado de Cargue por Volqueta${sep}${fmtNum(machSchedule.tiempoCargueCamionMin, 1)} minutos\n`;
    csv += `Tiempo Ciclo Ida y Vuelta Botadero${sep}${tiempoViajeBotaderoMin} minutos\n`;
    csv += `Volquetas Óptimas en Circuito${sep}${machSchedule.volquetasOptimas} volquetas\n`;
    csv += `Volumen Total Corte Suelto${sep}${fmtNum(machSchedule.cutLooseTotal, 2)} m³ sueltos\n`;
    csv += `Viajes Totales Doble Troque${sep}${machSchedule.tripsTotalCut} viajes\n`;
    csv += `Compensación de Relleno en Sitio${sep}${compensarRelleno ? 'ACTIVADA' : 'DESACTIVADA'}\n`;
    csv += `Tierra Reutilizada en Sitio${sep}${fmtNum(machSchedule.bankUsedOnSite, 2)} m³ banco\n`;
    csv += `Excedente en Banco a Botadero${sep}${fmtNum(machSchedule.surplusBankToHaul, 2)} m³ banco\n`;
    csv += `Excedente Suelto a Botadero${sep}${fmtNum(machSchedule.surplusLooseToHaul, 2)} m³ sueltos\n`;
    csv += `Viajes Netos a Botadero (Compensados)${sep}${machSchedule.tripsSurplusCompensated} viajes\n`;
    if (machSchedule.deficitBankRequired > 0.05) {
      csv += `Déficit de Material (Préstamo Requerido)${sep}${fmtNum(machSchedule.deficitBankRequired, 2)} m³ banco\n`;
    }

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
    pushNavigationState(state.currentTab, 'modal-edit-design');
  }

  function closeEditDesignModal() {
    requestCloseModal('modal-edit-design');
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

  // --- NAVEGACIÓN, HISTORY API Y CONTROL DE MODALES ---
  const MODAL_IDS = [
    'modal-stake-input',
    'modal-pc-assistant',
    'modal-offset-point',
    'modal-reposition-stake',
    'modal-edit-design'
  ];

  function getActiveModalId() {
    for (const id of MODAL_IDS) {
      const el = document.getElementById(id);
      if (el && el.classList.contains('open')) return id;
    }
    return null;
  }

  function pushNavigationState(tabId, modalId = null) {
    const cur = history.state || {};
    if (cur.tab === tabId && cur.modal === modalId) return;
    history.pushState({ tab: tabId, modal: modalId }, '');
  }

  function closeModalDirectly(modalId) {
    if (!modalId) return;
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('open');
    if (modalId === 'modal-stake-input') {
      renderGridTab();
      renderExportTab();
    }
  }

  function requestCloseModal(modalId) {
    if (!modalId) return;
    if (history.state && history.state.modal === modalId) {
      history.back();
    } else {
      closeModalDirectly(modalId);
    }
  }

  function updateHeaderBackButton() {
    if (!dom.headerBtnBack) return;
    if (state.currentTab !== 'tab-grid') {
      dom.headerBtnBack.style.display = 'inline-flex';
    } else {
      dom.headerBtnBack.style.display = 'none';
    }
  }

  function setupHistoryListener() {
    window.addEventListener('popstate', (event) => {
      const curModal = getActiveModalId();
      const targetModal = event.state?.modal || null;
      const targetTab = event.state?.tab || 'tab-grid';

      // 1. Cerrar cualquier modal abierto que no corresponda al estado actual
      if (curModal && curModal !== targetModal) {
        closeModalDirectly(curModal);
      }

      // 2. Si el historial apunta a un modal que estaba antes abierto, reabrirlo
      if (targetModal && curModal !== targetModal) {
        const el = document.getElementById(targetModal);
        if (el) el.classList.add('open');
      }

      // 3. Conmutar pestaña si es diferente
      if (targetTab !== state.currentTab) {
        switchTab(targetTab, false);
      }
    });
  }

  // --- GESTO SWIPE-BACK PARA IPHONE EN MODO PWA STANDALONE ---
  function setupSwipeBackGesture() {
    const indicator = document.getElementById('swipe-back-indicator');
    let startX = 0;
    let startY = 0;
    let isTracking = false;

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      // Solo iniciar si el toque empieza en el borde izquierdo (clientX <= 35px)
      if (touch.clientX <= 35) {
        startX = touch.clientX;
        startY = touch.clientY;
        isTracking = true;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isTracking || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      // Si predomina movimiento vertical, cancelar gesto de volver
      if (Math.abs(deltaY) > 50) {
        isTracking = false;
        if (indicator) {
          indicator.classList.remove('active');
          indicator.style.transform = 'translateY(-50%) translateX(-120%)';
          indicator.style.opacity = '0';
        }
        return;
      }

      if (deltaX > 15) {
        if (indicator) {
          indicator.classList.add('active');
          const visualX = Math.min(80, deltaX) - 50;
          const progress = Math.min(1, deltaX / 70);
          indicator.style.transform = `translateY(-50%) translateX(${visualX}px)`;
          indicator.style.opacity = `${progress}`;
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (!isTracking) return;
      isTracking = false;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      if (indicator) {
        indicator.classList.remove('active');
        indicator.style.transform = 'translateY(-50%) translateX(-120%)';
        indicator.style.opacity = '0';
      }

      // Umbral cumplido: deltaX > 70px y deltaY < 50px
      if (deltaX > 70 && Math.abs(deltaY) < 50) {
        if (navigator.vibrate) {
          try { navigator.vibrate(12); } catch (_) {}
        }
        const activeModal = getActiveModalId();
        if (activeModal) {
          requestCloseModal(activeModal);
        } else if (state.currentTab !== 'tab-grid') {
          history.back();
        } else {
          history.back();
        }
      }
    }, { passive: true });
  }

  // --- GESTO SWIPE-DOWN PARA MODALES (BOTTOM SHEET) ---
  function setupModalBottomSheetGestures() {
    MODAL_IDS.forEach(modalId => {
      const backdrop = document.getElementById(modalId);
      if (!backdrop) return;
      const sheet = backdrop.querySelector('.modal-sheet');
      if (!sheet) return;

      // Cerrar al tocar el fondo oscuro exterior
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          requestCloseModal(modalId);
        }
      });

      // Gesto de deslizar hacia abajo para cerrar (Bottom Sheet)
      let startY = 0;
      let startX = 0;
      let isDraggingDown = false;
      let deltaY = 0;

      sheet.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        // Solo permitir arrastrar hacia abajo si el modal está en el tope de su scroll
        if (sheet.scrollTop <= 2) {
          startY = touch.clientY;
          startX = touch.clientX;
          isDraggingDown = true;
          deltaY = 0;
        } else {
          isDraggingDown = false;
        }
      }, { passive: true });

      sheet.addEventListener('touchmove', (e) => {
        if (!isDraggingDown || e.touches.length !== 1) return;
        const touch = e.touches[0];
        deltaY = touch.clientY - startY;
        const deltaX = touch.clientX - startX;

        if (deltaY > 5 && Math.abs(deltaY) > Math.abs(deltaX)) {
          sheet.style.transform = `translateY(${Math.max(0, deltaY)}px)`;
          sheet.style.transition = 'none';
        }
      }, { passive: true });

      sheet.addEventListener('touchend', (e) => {
        if (!isDraggingDown) return;
        isDraggingDown = false;

        if (deltaY > 80) {
          sheet.style.transition = 'transform 0.18s ease-out';
          sheet.style.transform = 'translateY(100%)';
          setTimeout(() => {
            sheet.style.transform = '';
            sheet.style.transition = '';
            requestCloseModal(modalId);
          }, 180);
        } else {
          sheet.style.transition = 'transform 0.15s ease-out';
          sheet.style.transform = '';
          setTimeout(() => {
            sheet.style.transition = '';
          }, 160);
        }
        deltaY = 0;
      }, { passive: true });
    });
  }

  // --- NAVEGACIÓN DE PESTAÑAS ---
  function switchTab(targetId, pushHistory = true) {
    const curActiveModal = getActiveModalId();
    if (curActiveModal) {
      closeModalDirectly(curActiveModal);
    }

    state.currentTab = targetId;
    if (pushHistory) {
      pushNavigationState(targetId, null);
    }

    updateHeaderBackButton();

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
    else if (targetId === 'tab-config') renderConfigTab();
    else if (targetId === 'tab-aux') renderAuxTab();
    else if (targetId === 'tab-machinery') renderMachineryTab();
    else if (targetId === 'tab-export') renderExportTab();
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Header navigation back button
    if (dom.headerBtnBack) {
      dom.headerBtnBack.addEventListener('click', () => {
        history.back();
      });
    }

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
    dom.btnToggleEditMode.addEventListener('click', toggleEditMode);

    // Conmutadores de vista 2D vs Tabla
    dom.viewMode2D.addEventListener('click', () => {
      state.activeViewMode = '2d';
      renderGridTab();
    });
    dom.viewModeTable.addEventListener('click', () => {
      state.activeViewMode = 'table';
      renderGridTab();
    });

    // Capas del lienzo
    dom.chkShowTin.addEventListener('change', renderCanvas2D);
    dom.chkShowDistances.addEventListener('change', renderCanvas2D);
    dom.chkShowFlow.addEventListener('change', renderCanvas2D);

    // Controles de zoom del lienzo
    dom.canvasBtnZoomIn.addEventListener('click', () => {
      state.canvas.zoom = Math.min(4.0, state.canvas.zoom * 1.25);
      renderCanvas2D();
    });
    dom.canvasBtnZoomOut.addEventListener('click', () => {
      state.canvas.zoom = Math.max(0.3, state.canvas.zoom / 1.25);
      renderCanvas2D();
    });
    dom.canvasBtnCenter.addEventListener('click', () => {
      state.canvas.zoom = 1.0;
      state.canvas.panX = 0;
      state.canvas.panY = 0;
      renderCanvas2D();
    });

    // Modal Lectura
    dom.mBtnClose.addEventListener('click', closeStakeModal);
    if (dom.mBtnBackHeader) dom.mBtnBackHeader.addEventListener('click', closeStakeModal);
    if (dom.mBtnCancelBottom) dom.mBtnCancelBottom.addEventListener('click', closeStakeModal);
    dom.mBtnOffset.addEventListener('click', () => {
      const stake = state.stakes[state.currentStakeIndex];
      closeModalDirectly('modal-stake-input');
      openOffsetModal(stake);
    });
    dom.mBtnReposition.addEventListener('click', () => {
      const stake = state.stakes[state.currentStakeIndex];
      closeModalDirectly('modal-stake-input');
      openRepositionModal(stake);
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

    // Controles de Vista de Plano 2D (Rotación 90° y Espejo)
    if (dom.canvasBtnRot90) {
      dom.canvasBtnRot90.addEventListener('click', () => {
        state.canvas.rotationDeg = (state.canvas.rotationDeg + 90) % 360;
        renderCanvas2D();
      });
    }
    if (dom.canvasBtnMirror) {
      dom.canvasBtnMirror.addEventListener('click', () => {
        state.canvas.flipX = !state.canvas.flipX;
        renderCanvas2D();
      });
    }

    // Modo de Replanteo (Cinta vs Regular vs Talud)
    if (dom.cfgModeTapeBtn) dom.cfgModeTapeBtn.addEventListener('click', () => setConfigMode('tape'));
    if (dom.cfgModeRegularBtn) dom.cfgModeRegularBtn.addEventListener('click', () => setConfigMode('regular'));
    if (dom.cfgModeTaludBtn) dom.cfgModeTaludBtn.addEventListener('click', () => setConfigMode('talud'));

    // Entradas dinámicas modo cinta métrica
    const tapeInputs = [dom.tapeL12, dom.tapeL23, dom.tapeL34, dom.tapeL41, dom.tapeD13, dom.tapeD24];
    tapeInputs.forEach(el => {
      if (el) el.addEventListener('input', updateTapeClosurePreview);
    });

    if (dom.tapeAlignCenterBtn) dom.tapeAlignCenterBtn.addEventListener('click', () => selectTapeAlignment('center'));
    if (dom.tapeAlignLeftBtn) dom.tapeAlignLeftBtn.addEventListener('click', () => selectTapeAlignment('left'));
    if (dom.tapeAlignRightBtn) dom.tapeAlignRightBtn.addEventListener('click', () => selectTapeAlignment('right'));

    // Modos de caja de pesca (estaca vs cinta)
    if (dom.boxModeStakeBtn) dom.boxModeStakeBtn.addEventListener('click', () => setBoxMode('stake'));
    if (dom.boxModeTapeBtn) dom.boxModeTapeBtn.addEventListener('click', () => setBoxMode('tape'));
    if (dom.btnCalcBoxTape) dom.btnCalcBoxTape.addEventListener('click', calcBoxTapePosition);

    if (dom.taludBtnAngle90) dom.taludBtnAngle90.addEventListener('click', () => selectTaludAngleMode('90'));
    if (dom.taludBtnAngleDiag) dom.taludBtnAngleDiag.addEventListener('click', () => selectTaludAngleMode('diag'));
    if (dom.taludDiagA) dom.taludDiagA.addEventListener('input', updateTaludAngleFromDiagonal);
    if (dom.taludDiagB) dom.taludDiagB.addEventListener('input', updateTaludAngleFromDiagonal);
    if (dom.taludDiagC) dom.taludDiagC.addEventListener('input', updateTaludAngleFromDiagonal);

    // Pestaña Maquinaria y Cubicación TIN (Kobelco 210 LC & Doble Troque)
    if (dom.machPresetMixto) dom.machPresetMixto.addEventListener('click', () => selectSoilPreset('mixto'));
    if (dom.machPresetPenon) dom.machPresetPenon.addEventListener('click', () => selectSoilPreset('penon'));
    if (dom.machPresetArcilla) dom.machPresetArcilla.addEventListener('click', () => selectSoilPreset('arcilla'));

    if (dom.machTruckBtn15) dom.machTruckBtn15.addEventListener('click', () => selectTruckCapacity(15));
    if (dom.machTruckBtn155) dom.machTruckBtn155.addEventListener('click', () => selectTruckCapacity(15.5));
    if (dom.machTruckBtn16) dom.machTruckBtn16.addEventListener('click', () => selectTruckCapacity(16));

    if (dom.machCompensateToggle) {
      dom.machCompensateToggle.addEventListener('change', () => {
        saveMachineryParamsToStorage();
        renderMachineryTab();
      });
    }

    const machInputFields = [
      dom.machBucketCap, dom.machFactorK, dom.machCycleTime, dom.machEfficiency,
      dom.machEsponjamiento, dom.machCompactacion, dom.machHoursPerDay,
      dom.machProfilingHours, dom.machTruckCap, dom.machHaulCycleTime
    ];
    machInputFields.forEach(el => {
      if (el) {
        el.addEventListener('input', () => {
          if (dom.machSoilBadge && (el === dom.machFactorK || el === dom.machCycleTime || el === dom.machEsponjamiento || el === dom.machCompactacion)) {
            dom.machSoilBadge.textContent = 'Personalizado';
            if (dom.machPresetMixto) dom.machPresetMixto.classList.remove('active');
            if (dom.machPresetPenon) dom.machPresetPenon.classList.remove('active');
            if (dom.machPresetArcilla) dom.machPresetArcilla.classList.remove('active');
          }
          if (el === dom.machTruckCap) {
            const v = parseFloat(dom.machTruckCap.value);
            if (dom.machTruckBtn15) dom.machTruckBtn15.classList.toggle('active', v === 15);
            if (dom.machTruckBtn155) dom.machTruckBtn155.classList.toggle('active', Math.abs(v - 15.5) < 0.01);
            if (dom.machTruckBtn16) dom.machTruckBtn16.classList.toggle('active', v === 16);
          }
          saveMachineryParamsToStorage();
          renderMachineryTab();
        });
      }
    });

    // Station tab
    dom.stBmElev.addEventListener('input', updateStationCalculationPreview);
    dom.stBacksight.addEventListener('input', updateStationCalculationPreview);
    dom.btnSaveNewStation.addEventListener('click', saveNewStation);
    dom.btnOpenPCModal.addEventListener('click', openPCAssistant);

    // PC Modal
    dom.pcBtnClose.addEventListener('click', closePCAssistant);
    if (dom.pcBtnBackHeader) dom.pcBtnBackHeader.addEventListener('click', closePCAssistant);
    if (dom.pcBtnCancelBottom) dom.pcBtnCancelBottom.addEventListener('click', closePCAssistant);
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
    if (dom.edBtnBackHeader) dom.edBtnBackHeader.addEventListener('click', closeEditDesignModal);
    if (dom.edBtnCancelBottom) dom.edBtnCancelBottom.addEventListener('click', closeEditDesignModal);
    dom.edBtnSave.addEventListener('click', saveCustomDesign);
    dom.edBtnReset.addEventListener('click', resetCustomDesign);

    // Modal Punto Intermedio (Desfase)
    dom.offBtnClose.addEventListener('click', closeOffsetModal);
    if (dom.offBtnBackHeader) dom.offBtnBackHeader.addEventListener('click', closeOffsetModal);
    if (dom.offBtnCancelBottom) dom.offBtnCancelBottom.addEventListener('click', closeOffsetModal);
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

    // Modal Replanteo / Ajuste de Estaca
    dom.repBtnClose.addEventListener('click', closeRepositionModal);
    if (dom.repBtnBackHeader) dom.repBtnBackHeader.addEventListener('click', closeRepositionModal);
    if (dom.repBtnCancelBottom) dom.repBtnCancelBottom.addEventListener('click', closeRepositionModal);
    dom.repSubTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const subtabId = btn.getAttribute('data-subtab');
        switchSubTab(subtabId);
      });
    });
    dom.repRefStake.addEventListener('change', updateRepositionPreview);
    dom.repDxInput.addEventListener('input', updateRepositionPreview);
    dom.repDyInput.addEventListener('input', updateRepositionPreview);
    dom.repDirectX.addEventListener('input', updateRepositionPreview);
    dom.repDirectY.addEventListener('input', updateRepositionPreview);
    dom.repBtnCalcTrilateration.addEventListener('click', calcTrilateration);
    dom.repBtnApply.addEventListener('click', applyRepositionStake);

    // Inicializar eventos táctiles e interactivos del lienzo 2D
    initCanvasEvents();
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
    pushNavigationState(state.currentTab, 'modal-offset-point');
  }

  function closeOffsetModal() {
    requestCloseModal('modal-offset-point');
  }

  function getSelectedBaseStake() {
    const selId = dom.offBaseStake.value;
    return state.stakes.find(s => s.id === selId) || state.stakes[0];
  }

  // Obtener vectores unitarios locales de fila (Derecha) y columna (Adelante) para el cadenero
  function getLocalRowColVectors(baseStake) {
    if (!baseStake || !state.stakes) return { uRow: { x: 1, y: 0 }, uCol: { x: 0, y: 1 } };

    const r = baseStake.row;
    const c = baseStake.col;

    // 1. Vector Fila: hacia la estaca siguiente en la misma fila (Derecha +X)
    let nextInRow = state.stakes.find(s => s.row === r && s.col === c + 1);
    let prevInRow = state.stakes.find(s => s.row === r && s.col === c - 1);
    let vx = 1, vy = 0;
    if (nextInRow) {
      vx = nextInRow.x - baseStake.x;
      vy = nextInRow.y - baseStake.y;
    } else if (prevInRow) {
      vx = baseStake.x - prevInRow.x;
      vy = baseStake.y - prevInRow.y;
    }
    const lenV = Math.hypot(vx, vy);
    const uRow = lenV > 1e-4 ? { x: vx / lenV, y: vy / lenV } : { x: 1, y: 0 };

    // 2. Vector Columna: hacia la fila siguiente (Adelante +Y)
    let nextRowStake = state.stakes.find(s => s.row === r + 1 && s.col === c) ||
                       state.stakes.find(s => s.row === r + 1);
    let prevRowStake = state.stakes.find(s => s.row === r - 1 && s.col === c) ||
                       state.stakes.find(s => s.row === r - 1);
    let wx = -uRow.y, wy = uRow.x;
    if (nextRowStake) {
      wx = nextRowStake.x - baseStake.x;
      wy = nextRowStake.y - baseStake.y;
    } else if (prevRowStake) {
      wx = baseStake.x - prevRowStake.x;
      wy = baseStake.y - prevRowStake.y;
    }
    const lenW = Math.hypot(wx, wy);
    const uCol = lenW > 1e-4 ? { x: wx / lenW, y: wy / lenW } : { x: -uRow.y, y: uRow.x };

    return { uRow, uCol };
  }

  function updateOffsetCalculations() {
    const baseStake = getSelectedBaseStake();
    if (!baseStake || !state.project || !state.activeStation) return;

    const dx = parseFloat(dom.offDxInput.value) || 0;
    const dy = parseFloat(dom.offDyInput.value) || 0;

    // Orientar desfase a lo largo de los vectores reales de filas y columnas del lago
    const { uRow, uCol } = getLocalRowColVectors(baseStake);
    const targetX = baseStake.x + (dx * uRow.x) + (dy * uCol.x);
    const targetY = baseStake.y + (dx * uRow.y) + (dy * uCol.y);

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
    const nextInRow = state.stakes.find(s => s.row === r && s.col === c + 1);
    const nextInCol = state.stakes.find(s => s.row === r + 1 && s.col === c) || state.stakes.find(s => s.row === r + 1);
    const nextDiag = state.stakes.find(s => s.row === r + 1 && s.col === c + 1);

    if (nextInRow) drawStakeNode(originX + gridSpacingX * scaleX, originY, nextInRow.code);
    if (nextInCol) drawStakeNode(originX, originY + gridSpacingY * scaleY, nextInCol.code);
    if (nextDiag) drawStakeNode(originX + gridSpacingX * scaleX, originY + gridSpacingY * scaleY, nextDiag.code);

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

  // --- 10. REPLANTEO DE ESTACA Y CONTROL DEL PLANO 2D (TIN) ---
  function toggleEditMode() {
    state.isEditMode = !state.isEditMode;
    dom.btnToggleEditMode.textContent = state.isEditMode ? '🛠️ Modo Replanteo: ON' : '🛠️ Modo Replanteo: OFF';
    dom.btnToggleEditMode.className = state.isEditMode ? 'btn btn-warning' : 'btn btn-outline';
    dom.canvasEditBanner.style.display = state.isEditMode ? 'flex' : 'none';
    renderCanvas2D();
  }

  function initCanvasEvents() {
    const canvas = dom.lakeTinCanvas;
    if (!canvas) return;

    const getCanvasPos = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (canvas.width / rect.width);
      const y = (clientY - rect.top) * (canvas.height / rect.height);
      return { x, y };
    };

    const getPondCoords = (px, py) => {
      const transform = getPondTransform();
      return transform.fromPx(px, py);
    };

    const findStakeAtPos = (px, py) => {
      const transform = getPondTransform();
      const hitRadius = 24 * (window.devicePixelRatio || 1);

      for (const stake of state.stakes) {
        const pt = transform.toPx(stake.x, stake.y);
        if (Math.hypot(px - pt.x, py - pt.y) <= hitRadius) {
          return stake;
        }
      }
      return null;
    };

    // Pointer Down
    const onPointerDown = (clientX, clientY) => {
      const pos = getCanvasPos(clientX, clientY);
      state.canvas.startX = clientX;
      state.canvas.startY = clientY;

      const clickedStake = findStakeAtPos(pos.x, pos.y);

      if (state.isEditMode && clickedStake) {
        state.canvas.isDraggingStake = true;
        state.canvas.draggedStake = clickedStake;
      } else {
        state.canvas.isPanning = true;
        state.canvas.hoveredStake = clickedStake;
      }
    };

    // Pointer Move
    const onPointerMove = (clientX, clientY) => {
      if (state.canvas.isDraggingStake && state.canvas.draggedStake) {
        const pos = getCanvasPos(clientX, clientY);
        const pondPos = getPondCoords(pos.x, pos.y);
        state.canvas.draggedStake.x = Math.round(pondPos.x * 10) / 10;
        state.canvas.draggedStake.y = Math.round(pondPos.y * 10) / 10;

        if (!state.canvas.draggedStake.isCustomDesign) {
          const res = window.TopoMath.calculateDesignElevationAtCoord(state.canvas.draggedStake.x, state.canvas.draggedStake.y, state.project.settings, []);
          state.canvas.draggedStake.designElevation = res.elevation;
        }
        renderCanvas2D();
      } else if (state.canvas.isPanning) {
        const dx = (clientX - state.canvas.startX) * (window.devicePixelRatio || 1);
        const dy = (clientY - state.canvas.startY) * (window.devicePixelRatio || 1);
        state.canvas.panX += dx;
        state.canvas.panY += dy;
        state.canvas.startX = clientX;
        state.canvas.startY = clientY;
        renderCanvas2D();
      }
    };

    // Pointer Up
    const onPointerUp = (clientX, clientY) => {
      const dist = Math.hypot(clientX - state.canvas.startX, clientY - state.canvas.startY);

      if (state.canvas.isDraggingStake && state.canvas.draggedStake) {
        window.topoDB.saveStake(state.canvas.draggedStake);
        updateCalculations();
        state.canvas.isDraggingStake = false;
        state.canvas.draggedStake = null;
        renderCanvas2D();
      } else if (dist < 6) {
        const pos = getCanvasPos(clientX, clientY);
        const clickedStake = findStakeAtPos(pos.x, pos.y);

        if (clickedStake) {
          if (state.isEditMode) {
            openRepositionModal(clickedStake);
          } else {
            const idx = state.stakes.findIndex(s => s.id === clickedStake.id);
            if (idx !== -1) {
              state.currentStakeIndex = idx;
              openStakeModal();
            }
          }
        } else {
          // Si hace clic en un espacio vacío en modo normal, sugerir medir punto intermedio ahí
          const pondPos = getPondCoords(pos.x, pos.y);
          if (pondPos.x >= 0 && pondPos.y >= 0) {
            // Encontrar estaca más cercana
            let closest = state.stakes[0];
            let minDist = Infinity;
            state.stakes.forEach(st => {
              const d = Math.hypot(st.x - pondPos.x, st.y - pondPos.y);
              if (d < minDist) {
                minDist = d;
                closest = st;
              }
            });
            if (closest) {
              openOffsetModal(closest);
              dom.offDxInput.value = (pondPos.x - closest.x).toFixed(1);
              dom.offDyInput.value = (pondPos.y - closest.y).toFixed(1);
              updateOffsetCalculations();
            }
          }
        }
      }
      state.canvas.isPanning = false;
    };

    canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => {
      if (state.canvas.isPanning || state.canvas.isDraggingStake) {
        onPointerMove(e.clientX, e.clientY);
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (state.canvas.isPanning || state.canvas.isDraggingStake) {
        onPointerUp(e.clientX, e.clientY);
      }
    });

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        onPointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    }, { passive: true });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      state.canvas.zoom = Math.max(0.3, Math.min(4.0, state.canvas.zoom * zoomFactor));
      renderCanvas2D();
    }, { passive: false });
  }

  // --- 11. MODAL DE REPLANTEO DE ESTACA ---
  let activeRepositionSubTab = 'subtab-offset';

  function openRepositionModal(stake) {
    state.repositionStake = stake;
    dom.repStakeCode.textContent = stake.code;
    dom.repCurrentCoords.textContent = `X = ${stake.x.toFixed(2)} m, Y = ${stake.y.toFixed(2)} m`;

    let otherOpts = '';
    state.stakes.forEach(s => {
      if (s.id !== stake.id) {
        otherOpts += `<option value="${s.id}">${s.code} (X=${s.x.toFixed(1)}m, Y=${s.y.toFixed(1)}m)</option>`;
      }
    });
    dom.repRefStake.innerHTML = otherOpts;
    dom.repTriStake1.innerHTML = otherOpts;
    dom.repTriStake2.innerHTML = otherOpts;

    if (dom.repTriStake2.options.length > 1) {
      dom.repTriStake2.selectedIndex = 1;
    }

    dom.repDxInput.value = '0.0';
    dom.repDyInput.value = '0.0';
    dom.repDirectX.value = stake.x.toFixed(2);
    dom.repDirectY.value = stake.y.toFixed(2);

    dom.repTriDist1.value = '';
    dom.repTriDist2.value = '';
    dom.repTriStatus.textContent = '';

    switchSubTab('subtab-offset');
    updateRepositionPreview();
    dom.modalRepositionStake.classList.add('open');
    pushNavigationState(state.currentTab, 'modal-reposition-stake');
  }

  function closeRepositionModal() {
    requestCloseModal('modal-reposition-stake');
  }

  function switchSubTab(subtabId) {
    activeRepositionSubTab = subtabId;
    dom.repSubTabBtns.forEach(btn => {
      if (btn.getAttribute('data-subtab') === subtabId) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    dom.repSubTabPanes.forEach(pane => {
      if (pane.id === subtabId) pane.classList.add('active');
      else pane.classList.remove('active');
    });
    updateRepositionPreview();
  }

  function updateRepositionPreview() {
    if (!state.repositionStake) return;
    let targetX = state.repositionStake.x;
    let targetY = state.repositionStake.y;

    if (activeRepositionSubTab === 'subtab-offset') {
      const refStakeId = dom.repRefStake.value;
      const refStake = state.stakes.find(s => s.id === refStakeId) || state.repositionStake;
      const dX = parseFloat(dom.repDxInput.value) || 0;
      const dY = parseFloat(dom.repDyInput.value) || 0;
      targetX = refStake.x + dX;
      targetY = refStake.y + dY;
    } else if (activeRepositionSubTab === 'subtab-direct') {
      targetX = parseFloat(dom.repDirectX.value) || 0;
      targetY = parseFloat(dom.repDirectY.value) || 0;
    }

    state.repositionNewCoords = { x: targetX, y: targetY };
    dom.repResultCoords.textContent = `X=${targetX.toFixed(2)} m, Y=${targetY.toFixed(2)} m`;

    const calcRes = window.TopoMath.calculateDesignElevationAtCoord(targetX, targetY, state.project.settings, []);
    dom.repResultDesign.textContent = `${calcRes.elevation.toFixed(3)} m`;
  }

  function calcTrilateration() {
    const s1Id = dom.repTriStake1.value;
    const s2Id = dom.repTriStake2.value;
    const d1 = parseFloat(dom.repTriDist1.value);
    const d2 = parseFloat(dom.repTriDist2.value);
    const side = dom.repTriSide.value;

    if (s1Id === s2Id) {
      alert('Elija dos estacas distintas para triangular.');
      return;
    }
    if (isNaN(d1) || isNaN(d2) || d1 <= 0 || d2 <= 0) {
      alert('Ingrese las distancias medidas con cinta (en metros) mayores a 0.');
      return;
    }

    const p1 = state.stakes.find(s => s.id === s1Id);
    const p2 = state.stakes.find(s => s.id === s2Id);
    if (!p1 || !p2) return;

    const sol = window.TopoMath.solveTrilateration(p1, d1, p2, d2, side);
    if (!sol.success) {
      dom.repTriStatus.style.color = '#dc2626';
      dom.repTriStatus.textContent = `❌ ${sol.error}`;
      return;
    }

    dom.repTriStatus.style.color = '#16a34a';
    dom.repTriStatus.textContent = `✔ Intersección calculada: X=${sol.x.toFixed(2)}m, Y=${sol.y.toFixed(2)}m (Base 1➔2: ${sol.baseDist.toFixed(2)}m)`;

    state.repositionNewCoords = { x: sol.x, y: sol.y };
    dom.repResultCoords.textContent = `X=${sol.x.toFixed(2)} m, Y=${sol.y.toFixed(2)} m`;

    const calcRes = window.TopoMath.calculateDesignElevationAtCoord(sol.x, sol.y, state.project.settings, []);
    dom.repResultDesign.textContent = `${calcRes.elevation.toFixed(3)} m`;
  }

  async function applyRepositionStake() {
    if (!state.repositionStake) return;

    const newX = state.repositionNewCoords.x;
    const newY = state.repositionNewCoords.y;

    state.repositionStake.x = Math.round(newX * 1000) / 1000;
    state.repositionStake.y = Math.round(newY * 1000) / 1000;

    if (!state.repositionStake.isCustomDesign) {
      const calcRes = window.TopoMath.calculateDesignElevationAtCoord(newX, newY, state.project.settings, []);
      state.repositionStake.designElevation = calcRes.elevation;
    }

    if (state.repositionStake.measuredElevation !== null && state.repositionStake.measuredElevation !== undefined) {
      state.repositionStake.cutFill = window.TopoMath.calculateCutFill(state.repositionStake.measuredElevation, state.repositionStake.designElevation);
      const tolM = (state.project.settings.toleranceCm || 2.0) / 100;
      state.repositionStake.status = window.TopoMath.evaluateStatus(state.repositionStake.cutFill, tolM).status;
    }

    await window.topoDB.saveStake(state.repositionStake);
    updateCalculations();
    closeRepositionModal();

    renderGridTab();
    renderCanvas2D();
    renderExportTab();

    alert(`✔ Estaca ${state.repositionStake.code} replanteada con éxito en:\nX = ${newX.toFixed(2)} m, Y = ${newY.toFixed(2)} m\nNueva Cota Rasante: ${state.repositionStake.designElevation.toFixed(3)} m`);
  }

  // Iniciar la app al cargar el DOM
  document.addEventListener('DOMContentLoaded', initApp);

})();
