import { MemoryStorageAdapter } from '@shiftly/core-data-access';
import { describe, expect, it } from 'vitest';
import { LocalAuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('meldet den Admin mit Demo-Zugangsdaten an', async () => {
    const service = new AuthService(new LocalAuthRepository(new MemoryStorageAdapter()));
    const user = await service.login('mama', 'mama123');
    expect(user.role).toBe('admin');
    expect(service.isAdmin()).toBe(true);
  });

  it('weist falsche Zugangsdaten ab', async () => {
    const service = new AuthService(new LocalAuthRepository(new MemoryStorageAdapter()));
    await expect(service.login('mama', 'falsch')).rejects.toThrow('nicht korrekt');
  });

  it('stellt eine lokale Sitzung wieder her', async () => {
    const storage = new MemoryStorageAdapter();
    await new LocalAuthRepository(storage).login('familie', 'familie123');
    const service = new AuthService(new LocalAuthRepository(storage));
    await service.initialize();
    expect(service.currentUser()?.role).toBe('viewer');
  });

  it('verhindert Admin-Funktionen für Viewer', async () => {
    const service = new AuthService(new LocalAuthRepository(new MemoryStorageAdapter()));
    await service.login('familie', 'familie123');
    expect(() => service.requireAdmin()).toThrow('Nur Administratoren');
  });
});
