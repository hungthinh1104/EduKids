import { PronunciationAssessmentProvider } from '../dto/pronunciation-assessment.dto';
import { PronunciationProviderRegistryService } from './pronunciation-provider-registry.service';

describe('PronunciationProviderRegistryService', () => {
  const originalProvider = process.env.PRONUNCIATION_PROVIDER;

  afterEach(() => {
    process.env.PRONUNCIATION_PROVIDER = originalProvider;
  });

  it('returns AZURE_SPEECH when configured', () => {
    process.env.PRONUNCIATION_PROVIDER = 'AZURE_SPEECH';
    const service = new PronunciationProviderRegistryService();

    expect(service.resolveConfiguredProvider()).toBe(
      PronunciationAssessmentProvider.AZURE_SPEECH,
    );
  });

  it('returns CUSTOM when config is missing', () => {
    delete process.env.PRONUNCIATION_PROVIDER;
    const service = new PronunciationProviderRegistryService();

    expect(service.resolveConfiguredProvider()).toBe(
      PronunciationAssessmentProvider.CUSTOM,
    );
  });

  it('returns CUSTOM for unsupported provider', () => {
    process.env.PRONUNCIATION_PROVIDER = 'UNSUPPORTED_PROVIDER';
    const service = new PronunciationProviderRegistryService();

    expect(service.resolveConfiguredProvider()).toBe(
      PronunciationAssessmentProvider.CUSTOM,
    );
  });
});
