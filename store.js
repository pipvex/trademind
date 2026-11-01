/* TradeMind storage + sync.
   - Every account gets its own IndexedDB database on the device (so accounts never mix).
   - All data lives in memory + IndexedDB first (works offline), then syncs automatically to Supabase.
   - Records are last-write-wins by client timestamp; deletes are soft deletes so they sync too.      */
(function (root) {
  'use strict';
  const BUCKET = 'trade-media';
  const iso = () => new Date().toISOString();
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));

  const Store = {
    uid: null, sb: null, db: null, records: new Map(), meta: {}, settings: null,
    uploadErrors: {}, status: 'idle', lastSync: null, lastError: '', syncing: false, again: false, timer: null, listeners: new Set(),

    /* ---------- IndexedDB plumbing ---------- */
    _tx(store, mode, fn) {
      return new Promise((res, rej) => {
        const tx = this.db.transaction(store, mode); const out = fn(tx.objectStore(store));
        tx.oncomplete = () => res(out && 'result' in out ? out.result : out); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
      });
    },
    _put(store, v) { return this._tx(store, 'readwrite', s => { s.put(v); }); },
    _all(store) { return this._tx(store, 'readonly', s => s.getAll()); },
    _get(store, id) { return this._tx(store, 'readonly', s => s.get(id)); },
    _del(store, id) { return this._tx(store, 'readwrite', s => { s.delete(id); }); },

    async open(uid, sb) {
      this.close();
      this.uid = uid; this.sb = sb; this.settingsId = uid;
      this.db = await new Promise((res, rej) => {
        const r = indexedDB.open('trademind-' + uid, 1);
        r.onupgradeneeded = () => { const d = r.result; ['records', 'blobs', 'meta'].forEach(n => { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }); }); };
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      });
      this.records = new Map((await this._all('records')).map(r => [r.id, r]));
      this.meta = Object.fromEntries((await this._all('meta')).map(m => [m.id, m.value]));
      this._loadSettings();
      this.lastSync = this.meta.lastSync ? new Date(this.meta.lastSync) : null;
      this.setStatus(this.isCloud ? 'idle' : 'local');
    },
    close() { clearTimeout(this.timer); if (this.db) { this.db.close(); this.db = null; } this.uid = null; this.records = new Map(); },
    get isCloud() { return !!this.sb && this.uid !== 'local'; },
    async wipeDevice() { const uid = this.uid; this.close(); await new Promise(r => { const q = indexedDB.deleteDatabase('trademind-' + uid); q.onsuccess = q.onerror = q.onblocked = () => r(); }); },

    /* ---------- events ---------- */
    on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
    emit(type, detail) { this.listeners.forEach(f => { try { f(type, detail); } catch (e) { console.error(e); } }); },
    setStatus(s) { this.status = s; this.emit('status'); },

    /* ---------- records ---------- */
    list(kind) { const out = []; this.records.forEach(r => { if (r.kind === kind && !r.deleted) out.push({ ...r.data, id: r.id, updatedAt: r.updatedAt }); }); return out; },
    get(id) { const r = this.records.get(id); return r && !r.deleted ? { ...r.data, id: r.id, updatedAt: r.updatedAt } : null; },
    async _write(rec, source) {
      this.records.set(rec.id, rec); await this._put('records', rec);
      this.emit('change', { source: source || 'local', kind: rec.kind });
      if (!source) { if (this.isCloud && this.status !== 'syncing') this.setStatus(navigator.onLine ? 'pending' : 'offline'); this.queueSync(); }
    },
    async save(kind, obj) {
      const id = obj.id || uuid(); const prev = this.records.get(id); const { id: _i, updatedAt: _u, ...data } = obj;
      if (!data.createdAt) data.createdAt = (prev && prev.data.createdAt) || iso();
      await this._write({ id, kind, data, updatedAt: iso(), deleted: false, dirty: 1 });
      return { ...data, id };
    },
    async remove(id) {
      const r = this.records.get(id); if (!r || r.deleted) return;
      await this._write({ ...r, deleted: true, updatedAt: iso(), dirty: 1 });
    },

    /* ---------- settings (one record per account) ---------- */
    _loadSettings() {
      const r = this.records.get(this.settingsId); const d = Calc.DEFAULT_SETTINGS();
      this.settings = r && !r.deleted ? { ...d, ...r.data } : d; this.settingsSaved = !!(r && !r.deleted);
    },
    async saveSettings(s) {
      const data = { ...s }; delete data.id; delete data.updatedAt;
      await this._write({ id: this.settingsId, kind: 'settings', data, updatedAt: iso(), deleted: false, dirty: 1 });
      this._loadSettings();
    },

    /* ---------- screenshot blobs ---------- */
    putBlob(id, blob) { return this._put('blobs', { id, blob }); },
    dropBlob(id) { return this._del('blobs', id); },
    get maxCloudBytes() { return Math.max(1, Number(this.settings && this.settings.maxCloudMB) || 50) * 1048576; },
    async signedUrl(rec) {                       // streamable link for big videos (no full download needed)
      if (!this.isCloud || !rec.path) return null;
      const { data, error } = await this.sb.storage.from(BUCKET).createSignedUrl(rec.path, 3600);
      return error || !data ? null : data.signedUrl;
    },
    retryUploads() { this.uploadErrors = {}; this.emit('change', { source: 'sync' }); this.queueSync(100); },
    async getBlob(id) { const r = await this._get('blobs', id); return r ? r.blob : null; },
    async mediaBlob(rec) {
      let b = await this.getBlob(rec.id); if (b) return b;
      if (!this.isCloud || !rec.path || !rec.uploaded || !navigator.onLine) return null;
      const { data, error } = await this.sb.storage.from(BUCKET).download(rec.path);
      if (error || !data) return null; await this.putBlob(rec.id, data); return data;
    },

    /* ---------- sync ---------- */
    queueSync(ms = 1500) { if (!this.isCloud) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.sync(), ms); },
    get dirtyCount() { let n = 0; this.records.forEach(r => { if (r.dirty) n++; }); return n; },

    async sync() {
      if (!this.isCloud) return;
      if (this.syncing) { this.again = true; return; }
      if (!navigator.onLine) { this.setStatus('offline'); return; }
      this.syncing = true; this.setStatus('syncing');
      const uid = this.uid;
      try {
        const { data: { session } } = await this.sb.auth.getSession();
        if (!session) { this.setStatus('signin'); return; }
        await this._pull(); await this._uploadMedia(); await this._push();
        if (uid !== this.uid) return;
        this.lastSync = new Date(); this.meta.lastSync = this.lastSync.toISOString(); await this._put('meta', { id: 'lastSync', value: this.meta.lastSync });
        this.lastError = ''; this.setStatus('synced');
      } catch (e) {
        console.error('sync failed', e); this.lastError = (e && e.message) || String(e); this.setStatus(navigator.onLine ? 'error' : 'offline');
      } finally {
        this.syncing = false; if (this.again) { this.again = false; setTimeout(() => this.sync(), 400); }
      }
    },

    async _pull() {
      let cursor = this.meta.lastPull || null, maxSeen = cursor, changed = false;
      for (let page = 0; page < 200; page++) {
        let q = this.sb.from('records').select('id,kind,data,deleted,client_updated_at,updated_at').order('updated_at', { ascending: true }).limit(1000);
        if (cursor) q = q.gte('updated_at', cursor);
        const { data, error } = await q; if (error) throw error;
        for (const row of data) {
          const rt = Date.parse(row.client_updated_at), local = this.records.get(row.id);
          const take = !local || rt > Date.parse(local.updatedAt) || (!local.dirty && rt >= Date.parse(local.updatedAt));
          if (take) {
            const rec = { id: row.id, kind: row.kind, data: row.data || {}, deleted: !!row.deleted, updatedAt: new Date(rt).toISOString(), dirty: 0 };
            this.records.set(rec.id, rec); await this._put('records', rec); changed = true;
          }
          if (!maxSeen || row.updated_at > maxSeen) maxSeen = row.updated_at;
        }
        if (data.length < 1000) break;
        const last = data[data.length - 1].updated_at; if (last === cursor) break; cursor = last;
      }
      if (maxSeen && maxSeen !== this.meta.lastPull) { this.meta.lastPull = maxSeen; await this._put('meta', { id: 'lastPull', value: maxSeen }); }
      if (changed) { this._loadSettings(); this.emit('change', { source: 'remote' }); }
    },

    _ext(d) {
      const m = /\.([a-z0-9]{2,5})$/i.exec(d.name || ''); if (m) return m[1].toLowerCase();
      return ({ 'video/quicktime': 'mov', 'video/webm': 'webm', 'video/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/webm': 'webm', 'audio/wav': 'wav', 'image/png': 'png' })[d.mime] || 'jpg';
    },
    async _uploadMedia() {
      const mb = Math.round(this.maxCloudBytes / 1048576);
      for (const r of [...this.records.values()]) {
        if (r.kind !== 'media') continue;
        if (!r.deleted && r.data.uploaded === false) {
          const prev = this.uploadErrors[r.id]; if (prev && (prev.permanent || Date.now() - prev.at < 600000)) continue;   // back off after a failure
          const blob = await this.getBlob(r.id); if (!blob) continue;
          if (blob.size > this.maxCloudBytes) { this.uploadErrors[r.id] = { msg: `Over your ${mb} MB cloud limit - use a shorter clip`, at: Date.now(), permanent: true }; this.emit('change', { source: 'sync' }); continue; }
          try {
            const path = this.uid + '/' + r.id + '.' + this._ext(r.data);
            const { error } = await this.sb.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: blob.type || r.data.mime || 'image/jpeg' });
            if (error) throw error;
            delete this.uploadErrors[r.id];
            await this._write({ ...r, data: { ...r.data, uploaded: true, path }, updatedAt: iso(), dirty: 1 }, 'sync');
          } catch (e) {
            const msg = (e && e.message) || String(e);
            if (!navigator.onLine || /failed to fetch|network|load failed/i.test(msg)) throw e;    // connection problem: retry the whole sync later
            this.uploadErrors[r.id] = { msg: msg.slice(0, 140), at: Date.now() };                   // file problem: skip this file, keep syncing everything else
            this.emit('change', { source: 'sync' });
          }
        } else if (r.deleted && r.data.path && !r.data.removed) {
          const { error } = await this.sb.storage.from(BUCKET).remove([r.data.path]);
          if (!error) await this._write({ ...r, data: { ...r.data, removed: true }, updatedAt: iso(), dirty: 1 }, 'sync');
          await this._del('blobs', r.id);
        }
      }
    },

    async _push() {
      const dirty = [...this.records.values()].filter(r => r.dirty);
      for (let i = 0; i < dirty.length; i += 100) {
        const chunk = dirty.slice(i, i + 100).map(r => ({ r, sent: r.updatedAt }));
        const rows = chunk.map(({ r }) => ({ id: r.id, user_id: this.uid, kind: r.kind, data: r.data, deleted: !!r.deleted, client_updated_at: r.updatedAt }));
        const { error } = await this.sb.from('records').upsert(rows, { onConflict: 'id' }); if (error) throw error;
        for (const { r, sent } of chunk) { const cur = this.records.get(r.id); if (cur && cur.updatedAt === sent) { cur.dirty = 0; await this._put('records', cur); } }
      }
    },

    /* ---------- backup ---------- */
    exportAll() {
      return { app: 'TradeMind', version: 2, exportedAt: iso(),
        records: [...this.records.values()].filter(r => !r.deleted && r.kind !== 'media').map(r => ({ id: r.id === this.settingsId ? 'settings' : r.id, kind: r.kind, data: r.data, updatedAt: r.updatedAt })) };
    },
    async importAll(json) {
      if (!json || json.app !== 'TradeMind' || !Array.isArray(json.records)) throw new Error('This is not a TradeMind backup file.');
      let n = 0;
      for (const x of json.records) {
        const id = x.id === 'settings' || x.kind === 'settings' ? this.settingsId : x.id; const cur = this.records.get(id);
        if (cur && !cur.deleted && Date.parse(cur.updatedAt) >= Date.parse(x.updatedAt)) continue;
        await this._write({ id, kind: x.kind, data: x.data, updatedAt: x.updatedAt || iso(), deleted: false, dirty: 1 }, 'import'); n++;
      }
      this._loadSettings(); this.queueSync(300); this.emit('change', { source: 'import' }); return n;
    }
  };
  root.Store = Store; root.uuid = uuid;
})(self);
