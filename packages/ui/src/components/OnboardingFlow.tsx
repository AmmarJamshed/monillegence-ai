import { useTranslation } from 'react-i18next';
import { LEGAL_DISCLAIMER } from '@monillegence/shared';
import { useAppStore } from '../stores/appStore';

export function OnboardingFlow() {
  const { t } = useTranslation();
  const step = useAppStore((s) => s.onboardingStep);
  const setStep = useAppStore((s) => s.setOnboardingStep);
  const updateConfig = useAppStore((s) => s.updateConfig);
  const installRuntime = useAppStore((s) => s.installRuntime);
  const startRuntime = useAppStore((s) => s.startRuntime);
  const installProgress = useAppStore((s) => s.installProgress);
  const setLocale = useAppStore((s) => s.setLocale);

  if (step >= 99) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-monil-bg/95 backdrop-blur">
      <div className="w-full max-w-lg rounded-2xl border border-monil-border bg-monil-surface p-8 shadow-2xl">
        <div className="mb-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setLocale('en')}
            className="text-xs text-monil-muted hover:text-white"
          >
            {t('english')}
          </button>
          <span className="text-monil-border">|</span>
          <button
            type="button"
            onClick={() => setLocale('ur')}
            className="text-xs text-monil-muted hover:text-white"
          >
            {t('urdu')}
          </button>
        </div>

        {step === 0 && (
          <>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pakistan-green text-xl font-bold">
                🇵🇰
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{t('welcome')}</h1>
                <p className="text-sm text-monil-muted">{t('tagline')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-8 w-full rounded-lg bg-monil-primary py-3 font-semibold text-monil-bg hover:bg-emerald-400"
            >
              {t('getStarted')}
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold">{t('legalTitle')}</h2>
            <p className="mt-4 text-sm leading-relaxed text-monil-muted">
              {LEGAL_DISCLAIMER}
            </p>
            <button
              type="button"
              onClick={async () => {
                await updateConfig({ legalDisclaimerAccepted: true });
                setStep(2);
              }}
              className="mt-8 w-full rounded-lg bg-monil-primary py-3 font-semibold text-monil-bg"
            >
              {t('acceptContinue')}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold">{t('installRuntime')}</h2>
            <p className="mt-3 text-sm text-monil-muted">{t('installRuntimeDesc')}</p>
            <p className="mt-2 text-xs text-amber-400/90">{t('diskEstimate')}</p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={async () => {
                  setStep(3);
                  await installRuntime();
                  await startRuntime();
                  await updateConfig({ starterModelInstalled: true });
                }}
                className="w-full rounded-lg bg-monil-primary py-3 font-semibold text-monil-bg"
              >
                {t('installContinue')}
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-full rounded-lg border border-monil-border py-3 text-monil-muted"
              >
                {t('skipLimited')}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-bold">{t('downloadingModel')}</h2>
            {installProgress && (
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-monil-border">
                  <div
                    className="h-full bg-monil-primary transition-all"
                    style={{ width: `${installProgress.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-monil-muted">{installProgress.message}</p>
              </div>
            )}
            <button
              type="button"
              onClick={async () => {
                await updateConfig({ onboardingCompleted: true });
                setStep(99);
              }}
              className="mt-8 w-full rounded-lg bg-monil-primary py-3 font-semibold text-monil-bg"
            >
              {t('openWorkspace')}
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-xl font-bold">{t('ready')}</h2>
            <p className="mt-3 text-sm text-monil-muted">
              Limited mode — install runtime from Settings to enable AI.
            </p>
            <button
              type="button"
              onClick={async () => {
                await updateConfig({ onboardingCompleted: true });
                setStep(99);
              }}
              className="mt-8 w-full rounded-lg bg-monil-primary py-3 font-semibold text-monil-bg"
            >
              {t('openWorkspace')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
