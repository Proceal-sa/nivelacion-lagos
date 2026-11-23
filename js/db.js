/**
 * db.js - IndexedDB storage wrapper for TopoPiscícola PWA
 * 100% Offline-First client-side database
 */

const DB_NAME = 'TopoPiscicolaDB';
const DB_VERSION = 1;

class TopoDB {
  constructor() {
    this.db = null;
    this._initPromise = null;
  }

  async init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const store = db.createObjectStore('projects', { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Stakes store (malla de estacas)
        if (!db.objectStoreNames.contains('stakes')) {
          const store = db.createObjectStore('stakes', { keyPath: 'id' });
          store.createIndex('projId', 'projId', { unique: false });
          store.createIndex('proj_coord', ['projId', 'row', 'col'], { unique: true });
        }

        // Stations store (Armadas e historial de BM / PC)
        if (!db.objectStoreNames.contains('stations')) {
          const store = db.createObjectStore('stations', { keyPath: 'id' });
          store.createIndex('projId', 'projId', { unique: false });
        }

        // Auxiliary points (Puntos libres fuera de malla)
        if (!db.objectStoreNames.contains('auxPoints')) {
          const store = db.createObjectStore('auxPoints', { keyPath: 'id' });
          store.createIndex('projId', 'projId', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
    return this._initPromise;
  }

  async _tx(storeNames, mode = 'readonly') {
    await this.init();
    return this.db.transaction(storeNames, mode);
  }

  // --- PROJECTS ---
  async getAllProjects() {
    const tx = await this._tx('projects', 'readonly');
    const store = tx.objectStore('projects');
    return new Promise((res, rej) => {
      const req = store.getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => rej(req.error);
    });
  }

  async getProject(id) {
    const tx = await this._tx('projects', 'readonly');
    const store = tx.objectStore('projects');
    return new Promise((res, rej) => {
      const req = store.get(id);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => rej(req.error);
    });
  }

  async saveProject(project) {
    project.updatedAt = new Date().toISOString();
    const tx = await this._tx('projects', 'readwrite');
    const store = tx.objectStore('projects');
    return new Promise((res, rej) => {
      const req = store.put(project);
      req.onsuccess = () => res(project);
      req.onerror = () => rej(req.error);
    });
  }

  async deleteProject(id) {
    const tx = await this._tx(['projects', 'stakes', 'stations', 'auxPoints'], 'readwrite');
    const pStore = tx.objectStore('projects');
    const sStore = tx.objectStore('stakes');
    const stStore = tx.objectStore('stations');
    const aStore = tx.objectStore('auxPoints');

    pStore.delete(id);

    // Delete related stakes
    const sIdx = sStore.index('projId');
    const sReq = sIdx.openKeyCursor(IDBKeyRange.only(id));
    sReq.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        sStore.delete(cursor.primaryKey);
        cursor.continue();
      }
    };

    // Delete related stations
    const stIdx = stStore.index('projId');
    const stReq = stIdx.openKeyCursor(IDBKeyRange.only(id));
    stReq.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        stStore.delete(cursor.primaryKey);
        cursor.continue();
      }
    };

    // Delete related aux points
    const aIdx = aStore.index('projId');
    const aReq = aIdx.openKeyCursor(IDBKeyRange.only(id));
    aReq.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        aStore.delete(cursor.primaryKey);
        cursor.continue();
      }
    };

    return new Promise((res, rej) => {
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  }

  // --- STAKES ---
  async getStakes(projId) {
    const tx = await this._tx('stakes', 'readonly');
    const store = tx.objectStore('stakes');
    const idx = store.index('projId');
    return new Promise((res, rej) => {
      const req = idx.getAll(IDBKeyRange.only(projId));
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => rej(req.error);
    });
  }

  async saveStake(stake) {
    const tx = await this._tx('stakes', 'readwrite');
    const store = tx.objectStore('stakes');
    return new Promise((res, rej) => {
      const req = store.put(stake);
      req.onsuccess = () => res(stake);
      req.onerror = () => rej(req.error);
    });
  }

  async saveStakesBulk(stakes) {
    const tx = await this._tx('stakes', 'readwrite');
    const store = tx.objectStore('stakes');
    for (const stake of stakes) {
      store.put(stake);
    }
    return new Promise((res, rej) => {
      tx.oncomplete = () => res(stakes);
      tx.onerror = () => rej(tx.error);
    });
  }

  async clearStakesForProject(projId) {
    const tx = await this._tx('stakes', 'readwrite');
    const store = tx.objectStore('stakes');
    const idx = store.index('projId');
    const req = idx.openKeyCursor(IDBKeyRange.only(projId));
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
    return new Promise((res, rej) => {
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  }

  // --- STATIONS (ARMADAS & PC) ---
  async getStations(projId) {
    const tx = await this._tx('stations', 'readonly');
    const store = tx.objectStore('stations');
    const idx = store.index('projId');
    return new Promise((res, rej) => {
      const req = idx.getAll(IDBKeyRange.only(projId));
      req.onsuccess = () => {
        const list = req.result || [];
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        res(list);
      };
      req.onerror = () => rej(req.error);
    });
  }

  async saveStation(station) {
    const tx = await this._tx('stations', 'readwrite');
    const store = tx.objectStore('stations');
    return new Promise((res, rej) => {
      const req = store.put(station);
      req.onsuccess = () => res(station);
      req.onerror = () => rej(req.error);
    });
  }

  async setActiveStation(projId, stationId) {
    const stations = await this.getStations(projId);
    const tx = await this._tx(['stations', 'projects'], 'readwrite');
    const stStore = tx.objectStore('stations');
    for (const s of stations) {
      s.isActive = (s.id === stationId);
      stStore.put(s);
    }
    const pStore = tx.objectStore('projects');
    const pReq = pStore.get(projId);
    pReq.onsuccess = () => {
      if (pReq.result) {
        pReq.result.settings.currentStationId = stationId;
        pStore.put(pReq.result);
      }
    };
    return new Promise((res, rej) => {
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  }

  // --- AUX POINTS ---
  async getAuxPoints(projId) {
    const tx = await this._tx('auxPoints', 'readonly');
    const store = tx.objectStore('auxPoints');
    const idx = store.index('projId');
    return new Promise((res, rej) => {
      const req = idx.getAll(IDBKeyRange.only(projId));
      req.onsuccess = () => {
        const list = req.result || [];
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res(list);
      };
      req.onerror = () => rej(req.error);
    });
  }

  async saveAuxPoint(point) {
    const tx = await this._tx('auxPoints', 'readwrite');
    const store = tx.objectStore('auxPoints');
    return new Promise((res, rej) => {
      const req = store.put(point);
      req.onsuccess = () => res(point);
      req.onerror = () => rej(req.error);
    });
  }

  async deleteAuxPoint(id) {
    const tx = await this._tx('auxPoints', 'readwrite');
    const store = tx.objectStore('auxPoints');
    return new Promise((res, rej) => {
      const req = store.delete(id);
      req.onsuccess = () => res(true);
      req.onerror = () => rej(req.error);
    });
  }
}

// Export single instance globally
window.topoDB = new TopoDB();
