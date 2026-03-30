'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { MAX_FILES, MAX_FILE_SIZE_BYTES, YEAR_OPTIONS } from '@/lib/constants';
import {
  convertExtractedItemsCurrency,
  convertSummaryCurrency,
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  formatCurrencyValue
} from '@/lib/currency';
import {
  DEFAULT_LANGUAGE,
  getTranslations,
  LANGUAGE_LABELS,
  LANGUAGE_LOCALES,
  normalizeLanguage
} from '@/lib/i18n';
import { buildSummary } from '@/lib/summary';
import type {
  AppLanguage,
  CurrencyCode,
  ExtractResponse,
  ExtractResponseFile,
  ExtractSummary,
  ExtractedLine,
  FileProcessStatus,
  ProductType,
  YearMode
} from '@/types/extractor';
import type { HistoryRecord, SessionCompany } from '@/types/history';

type ClientFileStatus = {
  name: string;
  status: FileProcessStatus;
  extractedCount: number;
  errorMessage?: string;
};

function isExtractResponse(
  payload: ExtractResponse | { error?: string }
): payload is ExtractResponse {
  return (
    'items' in payload &&
    'files' in payload &&
    'summary' in payload &&
    Array.isArray(payload.items)
  );
}

function formatFileSize(bytes: number, locale: string) {
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(bytes / 1024 / 1024)} MB`;
}

function formatCount(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value || 0);
}

export function ExtractorApp() {
  const [language, setLanguage] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sessionCompany, setSessionCompany] = useState<SessionCompany | null>(null);
  const [companies, setCompanies] = useState<SessionCompany[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [productType, setProductType] = useState<ProductType>('filtros');
  const [yearMode, setYearMode] = useState<YearMode>('auto');
  const [customDescription, setCustomDescription] = useState('');
  const [rawItems, setRawItems] = useState<ExtractedLine[]>([]);
  const [items, setItems] = useState<ExtractedLine[]>([]);
  const [summary, setSummary] = useState<ExtractSummary>({
    facturas: 0,
    lineas: 0,
    unidades: 0,
    total: 0
  });
  const [fileStatuses, setFileStatuses] = useState<ClientFileStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const progressTimer = useRef<number | null>(null);

  const locale = LANGUAGE_LOCALES[language];
  const t = getTranslations(language);

  useEffect(() => {
    const storedLanguage = normalizeLanguage(window.localStorage.getItem('extractor_language'));
    setLanguage(storedLanguage);
  }, []);

  useEffect(() => {
    void (async () => {
      setIsSessionLoading(true);
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        const payload = (await response.json()) as {
          session: SessionCompany | null;
          companies: SessionCompany[];
        };
        setSessionCompany(payload.session);
        setCompanies(payload.companies);
        setCompanyId(payload.session?.id || payload.companies[0]?.id || '');
        if (payload.session) {
          const historyResponse = await fetch('/api/history', { cache: 'no-store' });
          const historyPayload = (await historyResponse.json()) as { records?: HistoryRecord[] };
          setHistory(historyPayload.records || []);
        }
      } finally {
        setIsSessionLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem('extractor_language', language);
  }, [language]);

  useEffect(() => {
    setItems(convertExtractedItemsCurrency(rawItems, currency));
    setSummary(convertSummaryCurrency(buildSummary(rawItems), currency));
  }, [rawItems, currency]);

  useEffect(() => {
    return () => {
      if (progressTimer.current) {
        window.clearInterval(progressTimer.current);
      }
    };
  }, []);

  function resetProgressLoop() {
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }

  function startProgressLoop(files: File[]) {
    resetProgressLoop();

    const baseStatuses: ClientFileStatus[] = files.map((file) => ({
      name: file.name,
      status: 'pending',
      extractedCount: 0
    }));

    setFileStatuses(baseStatuses);

    let index = 0;
    let phase: 'reading' | 'extracting' = 'reading';

    progressTimer.current = window.setInterval(() => {
      setFileStatuses((current) =>
        current.map((file, fileIndex) => {
          if (fileIndex < index) {
            return file.status === 'done' || file.status === 'error'
              ? file
              : { ...file, status: 'done' };
          }

          if (fileIndex > index) {
            return file;
          }

          return {
            ...file,
            status: phase
          };
        })
      );

      if (phase === 'reading') {
        phase = 'extracting';
        return;
      }

      phase = 'reading';
      index += 1;

      if (index >= files.length) {
        resetProgressLoop();
      }
    }, 1000);
  }

  function appendLog(message: string) {
    setLogs((current) => [
      `${new Date().toLocaleTimeString(locale, { hour12: false })} · ${message}`,
      ...current
    ]);
  }

  function handleFileSelection(files: FileList | null) {
    const incomingFiles = Array.from(files || []);

    if (!incomingFiles.length) {
      setSelectedFiles([]);
      setFileStatuses([]);
      setError(null);
      return;
    }

    if (incomingFiles.length > MAX_FILES) {
      setError(t.validationTooManyFiles(MAX_FILES));
      return;
    }

    const invalidTypeFile = incomingFiles.find((file) => file.type !== 'application/pdf');
    if (invalidTypeFile) {
      setSelectedFiles([]);
      setFileStatuses([]);
      setError(t.validationInvalidPdf(invalidTypeFile.name));
      return;
    }

    const oversizedFile = incomingFiles.find((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversizedFile) {
      setSelectedFiles([]);
      setFileStatuses([]);
      setError(
        t.validationFileTooLarge(
          oversizedFile.name,
          Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)
        )
      );
      return;
    }

    setSelectedFiles(incomingFiles);
    setFileStatuses(
      incomingFiles.map((file) => ({
        name: file.name,
        status: 'pending',
        extractedCount: 0
      }))
    );
    setError(null);
  }

  async function handleLogin() {
    setAuthError(null);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        companyId,
        password
      })
    });

    const payload = (await response.json()) as {
      session?: SessionCompany;
      error?: string;
    };

    if (!response.ok || !payload.session) {
      setAuthError(payload.error || t.authInvalid);
      return;
    }

    setSessionCompany(payload.session);
    setPassword('');
    const historyResponse = await fetch('/api/history', { cache: 'no-store' });
    const historyPayload = (await historyResponse.json()) as { records?: HistoryRecord[] };
    setHistory(historyPayload.records || []);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSessionCompany(null);
    setHistory([]);
    setPassword('');
  }

  async function handleExtract() {
    if (!sessionCompany) {
      setError(t.authNoSession);
      return;
    }

    if (!selectedFiles.length) {
      setError(t.validationNoFiles);
      return;
    }

    if (productType === 'custom' && !customDescription.trim()) {
      setError(t.validationCustomDescription);
      return;
    }

    setError(null);
    setLogs([]);
    setRawItems([]);
    setItems([]);
    setSummary({
      facturas: 0,
      lineas: 0,
      unidades: 0,
      total: 0
    });

    startProgressLoop(selectedFiles);
    appendLog(t.logStart(selectedFiles.length));
    selectedFiles.forEach((file) => {
      appendLog(t.logQueuedFile(file.name, formatFileSize(file.size, locale)));
    });

    const formData = new FormData();
    formData.set('language', language);
    formData.set('productType', productType);
    formData.set('yearMode', yearMode);
    formData.set('customDescription', customDescription);
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch('/api/extract', {
            method: 'POST',
            body: formData
          });

          const payload = (await response.json()) as ExtractResponse | { error?: string };

          if (!response.ok || !isExtractResponse(payload)) {
            const message =
              'error' in payload && payload.error ? payload.error : t.requestFailed;
            throw new Error(message);
          }

          resetProgressLoop();
          setRawItems(payload.items);
          setFileStatuses(
            payload.files.map((file: ExtractResponseFile) => ({
              name: file.name,
              status: file.status,
              extractedCount: file.extractedCount,
              errorMessage: file.errorMessage
            }))
          );

          payload.files.forEach((file) => {
            appendLog(
              file.status === 'done'
                ? t.logFileDone(file.name, file.extractedCount)
                : t.logFileError(file.name, file.errorMessage || t.requestFailed)
            );
          });
          appendLog(t.logCompleted(payload.summary.lineas, selectedFiles.length));
          const historyResponse = await fetch('/api/history', { cache: 'no-store' });
          const historyPayload = (await historyResponse.json()) as { records?: HistoryRecord[] };
          setHistory(historyPayload.records || []);
        } catch (requestError) {
          resetProgressLoop();
          const message =
            requestError instanceof Error ? requestError.message : t.requestFailed;

          setError(message);
          setFileStatuses((current) =>
            current.map((file) =>
              file.status === 'done'
                ? file
                : {
                    ...file,
                    status: 'error',
                    errorMessage: message
                  }
            )
          );
          appendLog(message);
        }
      })();
    });
  }

  async function handleDownloadExcel() {
    if (!items.length) {
      return;
    }

    setError(null);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items,
          productType,
          yearMode,
          language,
          currency
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || t.exportFailed);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const contentDisposition = response.headers.get('content-disposition');
      const match = contentDisposition?.match(/filename="(.+)"/);
      const filename = match?.[1] || 'Extractor.xlsx';
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      window.URL.revokeObjectURL(url);
      appendLog(t.logDownloaded(filename));
    } catch (downloadError) {
      const message =
        downloadError instanceof Error ? downloadError.message : t.exportFailed;
      setError(message);
      appendLog(message);
    }
  }

  function handleClear() {
    resetProgressLoop();
    setSelectedFiles([]);
    setRawItems([]);
    setItems([]);
    setLogs([]);
    setError(null);
    setCustomDescription('');
    setFileStatuses([]);
    setSummary({
      facturas: 0,
      lineas: 0,
      unidades: 0,
      total: 0
    });
  }

  const effectiveSummary = items.length ? summary : convertSummaryCurrency(buildSummary(rawItems), currency);
  const canExtract = selectedFiles.length > 0 && !isPending;
  const canDownload = items.length > 0 && !isPending;

  return (
    <main className="shell">
      <section className="hero">
        <div className="topbar">
          <span className="eyebrow">{t.heroEyebrow}</span>
          <div className="languageSwitcher" aria-label={t.languageLabel}>
            {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`langButton ${language === value ? 'langButtonActive' : ''}`}
                onClick={() => setLanguage(value as AppLanguage)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <h1 className="title">{t.heroTitle}</h1>
        <p className="subtitle">{t.heroSubtitle(MAX_FILES)}</p>
      </section>

      <section className="grid">
        <aside className="card panel stack">
          <div>
            <h2 className="panelTitle">{t.authTitle}</h2>
            <p className="panelSubtitle">{t.authSubtitle}</p>
            {isSessionLoading ? (
              <div className="hint">{t.authLoading}</div>
            ) : sessionCompany ? (
              <div className="stack">
                <div className="limitBox">
                  <strong>{t.authCurrentCompany}</strong>
                  <div className="hint">
                    {sessionCompany.name}
                    {sessionCompany.region ? ` · ${sessionCompany.region}` : ''}
                  </div>
                </div>
                <button type="button" className="button buttonSecondary" onClick={handleLogout}>
                  {t.authLogout}
                </button>
              </div>
            ) : (
              <div className="stack">
                <div className="field">
                  <label htmlFor="company">{t.authCompanyLabel}</label>
                  <select
                    id="company"
                    className="select"
                    value={companyId}
                    onChange={(event) => setCompanyId(event.target.value)}
                  >
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                        {company.region ? ` · ${company.region}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="password">{t.authPasswordLabel}</label>
                  <input
                    id="password"
                    className="input"
                    type="password"
                    placeholder={t.authPasswordPlaceholder}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                {authError ? <div className="errorBox">{authError}</div> : null}
                <button type="button" className="button buttonPrimary" onClick={handleLogin}>
                  {t.authButton}
                </button>
              </div>
            )}
          </div>

          <div>
            <h2 className="panelTitle">{t.configurationTitle}</h2>
            <p className="panelSubtitle">{t.configurationSubtitle}</p>
          </div>

          <div className="field">
            <label htmlFor="productType">{t.productTypeLabel}</label>
            <select
              id="productType"
              className="select"
              value={productType}
              onChange={(event) => setProductType(event.target.value as ProductType)}
            >
              {(['filtros', 'refrigeracion', 'vehiculos', 'todo', 'custom'] as ProductType[]).map(
                (option) => (
                  <option key={option} value={option}>
                    {t.productTypeOptions[option]}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="field">
            <label htmlFor="yearMode">{t.yearModeLabel}</label>
            <select
              id="yearMode"
              className="select"
              value={yearMode}
              onChange={(event) => setYearMode(event.target.value as YearMode)}
            >
              {YEAR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'auto' ? t.yearAuto : option}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="currency">{t.currencyLabel}</label>
            <select
              id="currency"
              className="select"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t.currencyOptions[option]}
                </option>
              ))}
            </select>
          </div>

          {productType === 'custom' ? (
            <div className="field">
              <label htmlFor="customDescription">{t.customDescriptionLabel}</label>
              <textarea
                id="customDescription"
                className="textarea"
                placeholder={t.customDescriptionPlaceholder}
                value={customDescription}
                onChange={(event) => setCustomDescription(event.target.value)}
              />
            </div>
          ) : null}

          <div className="dropzone">
            <strong>{t.uploadTitle}</strong>
            <span className="hint">{t.uploadHint}</span>
            <input
              className="filepicker"
              type="file"
              accept="application/pdf"
              multiple
              onChange={(event) => handleFileSelection(event.target.files)}
            />
            {selectedFiles.length ? (
              <div className="fileList">
                {selectedFiles.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="fileItem">
                    <div className="fileRow">
                      <strong>{file.name}</strong>
                      <span className="hint">{formatFileSize(file.size, locale)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="limitBox">
            <strong>{t.limitsTitle}</strong>
            <ul>
              <li>{t.limitsMaxFiles(MAX_FILES)}</li>
              <li>{t.limitsMaxSize(Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024))}</li>
              <li>{t.limitsPages(8)}</li>
            </ul>
          </div>

          {error ? <div className="errorBox">{error}</div> : null}

          <div className="actions">
            <button
              type="button"
              className="button buttonPrimary"
              disabled={!canExtract}
              onClick={handleExtract}
            >
              {isPending ? t.buttonExtracting : t.buttonExtract}
            </button>
            <button
              type="button"
              className="button buttonSecondary"
              disabled={!canDownload}
              onClick={handleDownloadExcel}
            >
              {t.buttonDownload}
            </button>
            <button type="button" className="button buttonSecondary" onClick={handleClear}>
              {t.buttonClear}
            </button>
          </div>
        </aside>

        <section className="stack">
          <div className="statusGrid">
            <div className="card stat">
              <div className="statLabel">{t.statsFacturas}</div>
              <div className="statValue">{formatCount(effectiveSummary.facturas, locale)}</div>
            </div>
            <div className="card stat">
              <div className="statLabel">{t.statsLineas}</div>
              <div className="statValue">{formatCount(effectiveSummary.lineas, locale)}</div>
            </div>
            <div className="card stat">
              <div className="statLabel">{t.statsUnidades}</div>
              <div className="statValue">{formatCount(effectiveSummary.unidades, locale)}</div>
            </div>
            <div className="card stat">
              <div className="statLabel">{t.statsTotal}</div>
              <div className="statValue">
                {formatCurrencyValue(effectiveSummary.total, locale, currency)}
              </div>
            </div>
          </div>

          <div className="card panel">
            <h2 className="panelTitle">{t.historyTitle}</h2>
            <p className="panelSubtitle">{t.historySubtitle}</p>
            {history.length ? (
              <div className="fileList">
                {history.map((record) => (
                  <article key={record.id} className="fileItem">
                    <div className="fileRow">
                      <strong>{new Date(record.createdAt).toLocaleString(locale)}</strong>
                      <span className="badge badge_done">
                        {formatCount(record.summary.lineas, locale)} {t.statsLineas}
                      </span>
                    </div>
                    <span className="hint">
                      {record.sourceFiles.join(', ')}
                    </span>
                    <span className="hint">
                      {t.historyFiles}: {record.sourceFiles.length} · {t.statsTotal}:{' '}
                      {formatCurrencyValue(record.summary.total, locale, record.currency)}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="emptyState">{t.historyEmpty}</div>
            )}
          </div>

          <div className="card panel">
            <h2 className="panelTitle">{t.fileStatusTitle}</h2>
            <p className="panelSubtitle">{t.fileStatusSubtitle}</p>
            {fileStatuses.length ? (
              <div className="fileList">
                {fileStatuses.map((file) => (
                  <article key={file.name} className="fileItem">
                    <div className="fileRow">
                      <strong>{file.name}</strong>
                      <span className={`badge badge_${file.status}`}>
                        {t.fileStatusLabels[file.status]}
                      </span>
                    </div>
                    <span className="hint">
                      {file.status === 'done'
                        ? t.fileStatusDetected(file.extractedCount)
                        : file.errorMessage || t.fileStatusPending}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="emptyState">{t.fileStatusEmpty}</div>
            )}
          </div>

          <div className="card panel">
            <h2 className="panelTitle">{t.extractedTitle}</h2>
            <p className="panelSubtitle">{t.extractedSubtitle}</p>
            {items.length ? (
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t.tableHeaders.factura}</th>
                      <th>{t.tableHeaders.fecha}</th>
                      <th>{t.tableHeaders.destino}</th>
                      <th>{t.tableHeaders.refInterna}</th>
                      <th>{t.tableHeaders.tipo}</th>
                      <th>{t.tableHeaders.modelo}</th>
                      <th className="alignRight">{t.tableHeaders.cantidad}</th>
                      <th className="alignRight">{t.tableHeaders.precioUnitario}</th>
                      <th className="alignRight">{t.tableHeaders.total}</th>
                      <th>{t.tableHeaders.archivo}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={`${item.factura}-${item.modelo}-${index}`}>
                        <td>{item.factura || '-'}</td>
                        <td>{item.fecha || '-'}</td>
                        <td>{item.destino || '-'}</td>
                        <td>{item.ref_interna || '-'}</td>
                        <td>{item.tipo || '-'}</td>
                        <td>{item.modelo || '-'}</td>
                        <td className="alignRight">{formatCount(item.cantidad, locale)}</td>
                        <td className="alignRight">
                          {formatCurrencyValue(item.precio_unitario, locale, currency)}
                        </td>
                        <td className="alignRight">
                          {formatCurrencyValue(item.total, locale, currency)}
                        </td>
                        <td>{item.source_file}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="emptyState">{t.extractedEmpty}</div>
            )}
          </div>

          <div className="card panel">
            <h2 className="panelTitle">{t.logsTitle}</h2>
            <p className="panelSubtitle">{t.logsSubtitle}</p>
            {logs.length ? (
              <div className="logList">
                {logs.map((log) => (
                  <div key={log} className="logItem">
                    {log}
                  </div>
                ))}
              </div>
            ) : (
              <div className="emptyState">{t.logsEmpty}</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
