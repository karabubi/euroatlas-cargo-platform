import { CloudinaryStorageService } from './cloudinary-storage.service';

describe('CloudinaryStorageService', () => {
  const originalCloudName = process.env.CLOUDINARY_CLOUD_NAME;

  const originalApiKey = process.env.CLOUDINARY_API_KEY;

  const originalApiSecret = process.env.CLOUDINARY_API_SECRET;

  const restoreEnv = (name: string, value: string | undefined) => {
    if (value === undefined) {
      delete process.env[name];
      return;
    }

    process.env[name] = value;
  };

  afterEach(() => {
    restoreEnv('CLOUDINARY_CLOUD_NAME', originalCloudName);

    restoreEnv('CLOUDINARY_API_KEY', originalApiKey);

    restoreEnv('CLOUDINARY_API_SECRET', originalApiSecret);
  });

  it('reports unconfigured without credentials', () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const service = new CloudinaryStorageService();

    expect(service.isConfigured()).toBe(false);
  });

  it('reports configured with all credentials', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';

    process.env.CLOUDINARY_API_KEY = 'test-key';

    process.env.CLOUDINARY_API_SECRET = 'test-secret';

    const service = new CloudinaryStorageService();

    expect(service.isConfigured()).toBe(true);
  });

  it('rejects upload when credentials are absent', async () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const service = new CloudinaryStorageService();

    await expect(
      service.uploadVehiclePhoto(Buffer.from('test'), 'vehicle-test'),
    ).rejects.toThrow('Cloudinary vehicle photo storage is not configured.');
  });

  it('rejects delete when credentials are absent', async () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const service = new CloudinaryStorageService();

    await expect(service.deleteVehiclePhoto('test/public-id')).rejects.toThrow(
      'Cloudinary vehicle photo storage is not configured.',
    );
  });
});
