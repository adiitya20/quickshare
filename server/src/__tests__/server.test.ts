import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../app.js';
import { initDatabase, db } from '../db/index.js';
import { purgeExpiredSessionsNow, stopCleanupTask } from '../services/cleanupService.js';
import { createSession } from '../services/sessionService.js';

const request = supertest(app);

describe('QRPrint API & Security Integration Tests', () => {
  beforeAll(() => {
    initDatabase();
  });

  afterAll(() => {
    stopCleanupTask();
    db.close();
  });

  it('1. GET /api/health should return ok', async () => {
    const res = await request.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('2. POST /api/sessions should create session with 64-char crypto token & QR URL', async () => {
    const res = await request.post('/api/sessions').send({ pcId: 'LAB-01 / PC-05' });
    expect(res.status).toBe(201);
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.pcId).toBe('LAB-01 / PC-05');
    expect(res.body.token).toBeDefined();
    expect(res.body.token.length).toBe(64); // 32 bytes hex
    expect(res.body.qrUrl).toContain(`/upload/${res.body.token}`);
  });

  it('3. GET /api/sessions/:token should return valid session info', async () => {
    const createRes = await request.post('/api/sessions').send({ pcId: 'LAB-02 / PC-12' });
    const token = createRes.body.token;

    const infoRes = await request.get(`/api/sessions/${token}`);
    expect(infoRes.status).toBe(200);
    expect(infoRes.body.pcId).toBe('LAB-02 / PC-12');
    expect(infoRes.body.status).toBe('WAITING');
    expect(infoRes.body.isExpired).toBe(false);
    expect(Array.isArray(infoRes.body.files)).toBe(true);
  });

  it('4. POST /api/sessions/:token/files should allow PDF/PNG and reject .exe files', async () => {
    const createRes = await request.post('/api/sessions').send({ pcId: 'LAB-03 / PC-01' });
    const token = createRes.body.token;

    // Test valid file upload (mock text/pdf buffer)
    const validUpload = await request
      .post(`/api/sessions/${token}/files`)
      .attach('files', Buffer.from('%PDF-1.4 Mock PDF Content'), 'Assignment.pdf');

    expect(validUpload.status).toBe(201);
    expect(validUpload.body.success).toBe(true);
    expect(validUpload.body.files.length).toBe(1);
    expect(validUpload.body.files[0].originalName).toBe('Assignment.pdf');

    // Test invalid executable file upload (.exe)
    const invalidUpload = await request
      .post(`/api/sessions/${token}/files`)
      .attach('files', Buffer.from('MZ... executable payload'), 'malicious_virus.exe');

    expect(invalidUpload.status).toBe(500);
    expect(invalidUpload.body.error).toContain('not allowed');
  });

  it('5. DELETE /api/files/:fileId should delete single file', async () => {
    const createRes = await request.post('/api/sessions').send({ pcId: 'LAB-01 / PC-09' });
    const token = createRes.body.token;

    const uploadRes = await request
      .post(`/api/sessions/${token}/files`)
      .attach('files', Buffer.from('Sample Notes text content'), 'Notes.txt');

    const fileId = uploadRes.body.files[0].id;

    const deleteRes = await request.delete(`/api/files/${fileId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Verify file is gone
    const fileCheck = await request.get(`/api/files/${fileId}`);
    expect(fileCheck.status).toBe(404);
  });

  it('6. Automatic purge of expired sessions', async () => {
    // Manually insert an already expired session into DB
    const { session, rawToken } = createSession('EXPIRED-PC');
    db.prepare(`UPDATE sessions SET expires_at = ? WHERE id = ?`).run(
      new Date(Date.now() - 10000).toISOString(),
      session.id
    );

    const count = purgeExpiredSessionsNow();
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify getting info returns 410 or status EXPIRED
    const checkRes = await request.get(`/api/sessions/${rawToken}`);
    expect(checkRes.body.status).toBe('EXPIRED');
    expect(checkRes.body.isExpired).toBe(true);
  });
});
