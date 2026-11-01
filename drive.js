/* TradeMind <-> Google Drive: optional storage for big screen recordings.
   - Uses the narrow "drive.file" permission: TradeMind can only see files it created itself.
   - Each trader uses their own Google Client ID (Settings). Files go into a "TradeMind" folder in THEIR Drive.
   - The Google sign-in lasts about an hour; after that, tap Connect again. Nothing secret is stored.   */
(function (root) {
  'use strict';
  const SCOPE = 'https://www.googleapis.com/auth/drive.file', API = 'https://www.googleapis.com/drive/v3', UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

  const Drive = {
    token: null, expires: 0, folderId: null, clientId: '',
    get available() { return !!(root.google && root.google.accounts && root.google.accounts.oauth2); },
    get connected() { return !!this.token && Date.now() < this.expires - 30000; },
    setClientId(id) { id = (id || '').trim(); if (id !== this.clientId) { this.clientId = id; this.token = null; this.folderId = null; } },

    /* Opens Google's sign-in popup (must be called from a tap/click). */
    connect() {
      return new Promise((resolve, reject) => {
        if (this.connected) return resolve();
        if (!this.clientId) return reject(new Error('Add your Google Client ID in Settings first.'));
        if (!this.available) return reject(new Error('Google sign-in has not loaded - check your internet connection and try again.'));
        const client = root.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId, scope: SCOPE,
          callback: async r => {
            if (r.error) return reject(new Error('Google sign-in failed: ' + (r.error_description || r.error)));
            this.token = r.access_token; this.expires = Date.now() + (Number(r.expires_in) || 3600) * 1000;
            try { this.folderId = await this.ensureFolder(); resolve(); } catch (e) { this.token = null; reject(e); }
          },
          error_callback: e => reject(new Error(e && e.type === 'popup_closed' ? 'The Google window was closed before finishing.' : 'Google sign-in was blocked or failed.'))
        });
        let seen = false; try { seen = localStorage.getItem('tm-drive-consent') === '1'; localStorage.setItem('tm-drive-consent', '1'); } catch (e) { /* private mode */ }
        client.requestAccessToken({ prompt: seen ? '' : 'consent' });
      });
    },
    disconnect() { if (this.token && this.available) { try { root.google.accounts.oauth2.revoke(this.token, () => {}); } catch (e) { /* ignore */ } } this.token = null; this.folderId = null; },
    forget() { this.disconnect(); try { localStorage.removeItem('tm-drive-consent'); } catch (e) { /* ignore */ } },

    async api(url, opts = {}) {
      if (!this.connected) throw new Error('Google Drive is not connected. Tap Connect Google Drive in Settings.');
      const r = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + this.token } });
      if (r.status === 401) { this.token = null; throw new Error('Your Google session ended. Tap Connect Google Drive again.'); }
      if (!r.ok) throw new Error(((await r.text()) || '').slice(0, 200) || 'Google Drive error ' + r.status);
      return r;
    },
    async ensureFolder() {
      const q = encodeURIComponent("name='TradeMind' and mimeType='application/vnd.google-apps.folder' and trashed=false");
      const found = await (await this.api(`${API}/files?q=${q}&fields=files(id)&pageSize=5`)).json();
      if (found.files && found.files.length) return found.files[0].id;
      const made = await (await this.api(`${API}/files?fields=id`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'TradeMind', mimeType: 'application/vnd.google-apps.folder' }) })).json();
      return made.id;
    },

    /* Resumable upload with a live percentage. Resolves { id, webViewLink }. */
    async upload(blob, name, onProgress) {
      if (!this.connected) throw new Error('Google Drive is not connected.');
      if (!this.folderId) this.folderId = await this.ensureFolder();
      const type = blob.type || 'application/octet-stream';
      const init = await this.api(`${UPLOAD}?uploadType=resumable&fields=id,name,webViewLink`, { method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': type, 'X-Upload-Content-Length': String(blob.size) },
        body: JSON.stringify({ name, parents: [this.folderId] }) });
      const loc = init.headers.get('Location'); if (!loc) throw new Error('Google Drive did not start the upload.');
      return new Promise((resolve, reject) => {
        const x = new XMLHttpRequest(); x.open('PUT', loc); x.setRequestHeader('Content-Type', type);
        x.upload.onprogress = e => { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 100)); };
        x.onload = () => { if (x.status >= 200 && x.status < 300) { try { resolve(JSON.parse(x.responseText)); } catch (e) { reject(new Error('Unexpected reply from Google Drive.')); } } else reject(new Error('Google Drive upload failed (' + x.status + ').')); };
        x.onerror = () => reject(new Error('Connection lost during the Drive upload.')); x.send(blob);
      });
    },
    async download(fileId) { return (await this.api(`${API}/files/${encodeURIComponent(fileId)}?alt=media`)).blob(); },
    async remove(fileId) { await this.api(`${API}/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' }); }
  };
  root.Drive = Drive;
})(self);
