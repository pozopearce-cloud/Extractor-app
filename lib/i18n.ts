import type { AppLanguage, CurrencyCode, ProductType } from '@/types/extractor';

type UiTranslations = {
  metadataDescription: string;
  languageLabel: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: (maxFiles: number) => string;
  configurationTitle: string;
  configurationSubtitle: string;
  productTypeLabel: string;
  productTypeOptions: Record<ProductType, string>;
  yearModeLabel: string;
  yearAuto: string;
  currencyLabel: string;
  currencyOptions: Record<CurrencyCode, string>;
  customDescriptionLabel: string;
  customDescriptionPlaceholder: string;
  uploadTitle: string;
  uploadHint: string;
  limitsTitle: string;
  limitsMaxFiles: (count: number) => string;
  limitsMaxSize: (sizeMb: number) => string;
  limitsPages: (pages: number) => string;
  buttonExtract: string;
  buttonExtracting: string;
  buttonDownload: string;
  buttonClear: string;
  statsFacturas: string;
  statsLineas: string;
  statsUnidades: string;
  statsTotal: string;
  fileStatusTitle: string;
  fileStatusSubtitle: string;
  fileStatusEmpty: string;
  fileStatusDetected: (count: number) => string;
  fileStatusPending: string;
  fileStatusLabels: Record<'pending' | 'reading' | 'extracting' | 'done' | 'error', string>;
  extractedTitle: string;
  extractedSubtitle: string;
  extractedEmpty: string;
  logsTitle: string;
  logsSubtitle: string;
  logsEmpty: string;
  tableHeaders: {
    factura: string;
    fecha: string;
    destino: string;
    refInterna: string;
    tipo: string;
    modelo: string;
    cantidad: string;
    precioUnitario: string;
    total: string;
    archivo: string;
  };
  validationNoFiles: string;
  validationCustomDescription: string;
  validationTooManyFiles: (count: number) => string;
  validationInvalidPdf: (name: string) => string;
  validationFileTooLarge: (name: string, maxMb: number) => string;
  requestFailed: string;
  exportFailed: string;
  logStart: (count: number) => string;
  logQueuedFile: (name: string, size: string) => string;
  logFileDone: (name: string, count: number) => string;
  logFileError: (name: string, message: string) => string;
  logCompleted: (lines: number, files: number) => string;
  logDownloaded: (filename: string) => string;
  serverMissingApiKey: string;
  serverRequestInvalid: string;
  serverNoPdf: string;
  serverCustomDescriptionRequired: string;
  serverClaudeConfigInvalid: string;
  serverClaudeRateLimited: string;
  serverClaudeFailed: string;
  serverClaudeInvalidJson: string;
  serverClaudeNotArray: string;
  serverPdfNoText: string;
  serverPdfUnreadable: string;
  serverExportInvalid: string;
};

export const DEFAULT_LANGUAGE: AppLanguage = 'es';

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  es: 'ES',
  en: 'EN',
  fr: 'FR',
  zh: '中文'
};

export const LANGUAGE_LOCALES: Record<AppLanguage, string> = {
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
  zh: 'zh-CN'
};

export const translations: Record<AppLanguage, UiTranslations> = {
  es: {
    metadataDescription: 'Convierte facturas PDF en Excel con extracción server-side y Claude.',
    languageLabel: 'Idioma',
    heroEyebrow: 'Extractor.app v1 · Next.js + Claude server-side',
    heroTitle: 'Facturas PDF a Excel, sin exponer tu API key.',
    heroSubtitle: (maxFiles) =>
      `Sube hasta ${maxFiles} PDFs con texto embebido, elige qué productos quieres extraer y genera un Excel con detalle, resumen por factura y resumen por tipo.`,
    configurationTitle: 'Configuración',
    configurationSubtitle: 'Esta versión procesa lotes pequeños en servidor y no guarda los PDFs.',
    productTypeLabel: 'Tipo de producto',
    productTypeOptions: {
      filtros: 'Filtros (aceite, combustible, aire...)',
      refrigeracion: 'Repuestos de refrigeración',
      vehiculos: 'Repuestos de vehículos',
      todo: 'Todos los productos de la factura',
      custom: 'Personalizado'
    },
    yearModeLabel: 'Año de las facturas',
    yearAuto: 'Automático (recomendado)',
    currencyLabel: 'Moneda de salida',
    currencyOptions: {
      EUR: 'Euro (EUR)',
      XAF: 'Franco CFA África Central (XAF / BEAC)',
      XOF: 'Franco CFA África Occidental (XOF / BCEAO)'
    },
    customDescriptionLabel: 'Descripción personalizada',
    customDescriptionPlaceholder: 'Ej: condensadores, compresores y evaporadores industriales',
    uploadTitle: 'Sube tus facturas PDF',
    uploadHint: 'PDFs con texto embebido o escaneados. Si no hay texto legible, Claude analizará el PDF visualmente.',
    limitsTitle: 'Límites del MVP',
    limitsMaxFiles: (count) => `Hasta ${count} PDFs por envío.`,
    limitsMaxSize: (sizeMb) => `Máximo ${sizeMb} MB por archivo.`,
    limitsPages: (pages) => `Hasta ${pages} páginas leídas por factura.`,
    buttonExtract: 'Extraer datos',
    buttonExtracting: 'Extrayendo...',
    buttonDownload: 'Descargar Excel',
    buttonClear: 'Limpiar',
    statsFacturas: 'Facturas',
    statsLineas: 'Líneas',
    statsUnidades: 'Unidades',
    statsTotal: 'Total',
    fileStatusTitle: 'Estado por archivo',
    fileStatusSubtitle: 'El procesamiento es secuencial para simplificar costes, errores y tiempos de respuesta.',
    fileStatusEmpty: 'Aún no has seleccionado archivos. Cuando los cargues, aquí verás el estado de cada factura.',
    fileStatusDetected: (count) => `${count} línea(s) detectada(s).`,
    fileStatusPending: 'Pendiente de procesar.',
    fileStatusLabels: {
      pending: 'pendiente',
      reading: 'leyendo',
      extracting: 'extrayendo',
      done: 'completado',
      error: 'error'
    },
    extractedTitle: 'Datos extraídos',
    extractedSubtitle: 'Los resultados se agregan por línea y luego se reutilizan para generar el Excel.',
    extractedEmpty: 'Aquí aparecerán las líneas extraídas cuando completes el procesamiento.',
    logsTitle: 'Log de sesión',
    logsSubtitle: 'Mensajes de alto nivel para detectar fallos sin exponer datos sensibles.',
    logsEmpty: 'El log se irá llenando durante la extracción y al descargar el Excel.',
    tableHeaders: {
      factura: 'Factura',
      fecha: 'Fecha',
      destino: 'Destino',
      refInterna: 'Ref. interna',
      tipo: 'Tipo',
      modelo: 'Modelo',
      cantidad: 'Cantidad',
      precioUnitario: 'P.Unit.',
      total: 'Total',
      archivo: 'Archivo'
    },
    validationNoFiles: 'Debes seleccionar al menos un PDF.',
    validationCustomDescription: 'Debes describir qué productos quieres extraer.',
    validationTooManyFiles: (count) => `Solo puedes subir hasta ${count} PDFs por envío.`,
    validationInvalidPdf: (name) => `"${name}" no es un PDF válido.`,
    validationFileTooLarge: (name, maxMb) => `"${name}" supera el límite de ${maxMb} MB.`,
    requestFailed: 'La extracción no se pudo completar.',
    exportFailed: 'No se pudo generar el Excel.',
    logStart: (count) => `Iniciando extracción de ${count} factura(s).`,
    logQueuedFile: (name, size) => `PDF en cola: ${name} (${size})`,
    logFileDone: (name, count) => `${name}: ${count} línea(s) extraída(s).`,
    logFileError: (name, message) => `${name}: ${message}`,
    logCompleted: (lines, files) => `Proceso completado: ${lines} línea(s) extraída(s) de ${files} archivo(s).`,
    logDownloaded: (filename) => `Excel descargado: ${filename}`,
    serverMissingApiKey: 'La API key de Anthropic no está configurada en el servidor.',
    serverRequestInvalid: 'La solicitud no se pudo procesar.',
    serverNoPdf: 'Debes subir al menos un PDF.',
    serverCustomDescriptionRequired: 'Debes describir qué productos quieres extraer.',
    serverClaudeConfigInvalid: 'La configuración de Anthropic en el servidor no es válida.',
    serverClaudeRateLimited: 'Anthropic ha rechazado temporalmente la petición. Inténtalo de nuevo.',
    serverClaudeFailed: 'No se pudo completar la extracción con Claude.',
    serverClaudeInvalidJson: 'Claude devolvió JSON inválido.',
    serverClaudeNotArray: 'Claude no devolvió un array JSON válido.',
    serverPdfNoText: 'No se pudo extraer texto legible del PDF. Se intentará análisis visual con Claude.',
    serverPdfUnreadable: 'No se pudo leer el PDF. Verifica que no esté corrupto.',
    serverExportInvalid: 'Los datos para exportar el Excel no son válidos.'
  },
  en: {
    metadataDescription: 'Convert PDF invoices into Excel with server-side extraction and Claude.',
    languageLabel: 'Language',
    heroEyebrow: 'Extractor.app v1 · Next.js + server-side Claude',
    heroTitle: 'PDF invoices to Excel, without exposing your API key.',
    heroSubtitle: (maxFiles) =>
      `Upload up to ${maxFiles} text-based PDFs, choose which products to extract, and generate an Excel with detail, invoice summary, and type summary.`,
    configurationTitle: 'Configuration',
    configurationSubtitle: 'This version processes small batches on the server and does not store PDFs.',
    productTypeLabel: 'Product type',
    productTypeOptions: {
      filtros: 'Filters (oil, fuel, air...)',
      refrigeracion: 'Refrigeration spare parts',
      vehiculos: 'Vehicle spare parts',
      todo: 'All invoice products',
      custom: 'Custom'
    },
    yearModeLabel: 'Invoice year',
    yearAuto: 'Automatic (recommended)',
    currencyLabel: 'Output currency',
    currencyOptions: {
      EUR: 'Euro (EUR)',
      XAF: 'Central African CFA franc (XAF / BEAC)',
      XOF: 'West African CFA franc (XOF / BCEAO)'
    },
    customDescriptionLabel: 'Custom description',
    customDescriptionPlaceholder: 'Example: industrial condensers, compressors and evaporators',
    uploadTitle: 'Upload your PDF invoices',
    uploadHint: 'Text-based or scanned PDFs. If readable text is missing, Claude will analyze the PDF visually.',
    limitsTitle: 'MVP limits',
    limitsMaxFiles: (count) => `Up to ${count} PDFs per request.`,
    limitsMaxSize: (sizeMb) => `Maximum ${sizeMb} MB per file.`,
    limitsPages: (pages) => `Up to ${pages} pages read per invoice.`,
    buttonExtract: 'Extract data',
    buttonExtracting: 'Extracting...',
    buttonDownload: 'Download Excel',
    buttonClear: 'Clear',
    statsFacturas: 'Invoices',
    statsLineas: 'Lines',
    statsUnidades: 'Units',
    statsTotal: 'Total',
    fileStatusTitle: 'File status',
    fileStatusSubtitle: 'Processing is sequential to simplify costs, errors, and response times.',
    fileStatusEmpty: 'You have not selected any files yet. Once uploaded, each invoice status will appear here.',
    fileStatusDetected: (count) => `${count} line(s) detected.`,
    fileStatusPending: 'Pending processing.',
    fileStatusLabels: {
      pending: 'pending',
      reading: 'reading',
      extracting: 'extracting',
      done: 'done',
      error: 'error'
    },
    extractedTitle: 'Extracted data',
    extractedSubtitle: 'Results are aggregated by line and then reused to generate the Excel file.',
    extractedEmpty: 'Extracted lines will appear here once processing is complete.',
    logsTitle: 'Session log',
    logsSubtitle: 'High-level messages to spot failures without exposing sensitive data.',
    logsEmpty: 'The log will fill during extraction and when downloading the Excel file.',
    tableHeaders: {
      factura: 'Invoice',
      fecha: 'Date',
      destino: 'Destination',
      refInterna: 'Internal ref.',
      tipo: 'Type',
      modelo: 'Model',
      cantidad: 'Quantity',
      precioUnitario: 'Unit price',
      total: 'Total',
      archivo: 'File'
    },
    validationNoFiles: 'You must select at least one PDF.',
    validationCustomDescription: 'You must describe which products to extract.',
    validationTooManyFiles: (count) => `You can only upload up to ${count} PDFs per request.`,
    validationInvalidPdf: (name) => `"${name}" is not a valid PDF.`,
    validationFileTooLarge: (name, maxMb) => `"${name}" exceeds the ${maxMb} MB limit.`,
    requestFailed: 'The extraction could not be completed.',
    exportFailed: 'The Excel file could not be generated.',
    logStart: (count) => `Starting extraction for ${count} invoice(s).`,
    logQueuedFile: (name, size) => `Queued PDF: ${name} (${size})`,
    logFileDone: (name, count) => `${name}: ${count} line(s) extracted.`,
    logFileError: (name, message) => `${name}: ${message}`,
    logCompleted: (lines, files) => `Process completed: ${lines} extracted line(s) from ${files} file(s).`,
    logDownloaded: (filename) => `Excel downloaded: ${filename}`,
    serverMissingApiKey: 'The Anthropic API key is not configured on the server.',
    serverRequestInvalid: 'The request could not be processed.',
    serverNoPdf: 'You must upload at least one PDF.',
    serverCustomDescriptionRequired: 'You must describe which products to extract.',
    serverClaudeConfigInvalid: 'The Anthropic server configuration is not valid.',
    serverClaudeRateLimited: 'Anthropic temporarily rejected the request. Please try again.',
    serverClaudeFailed: 'The extraction with Claude could not be completed.',
    serverClaudeInvalidJson: 'Claude returned invalid JSON.',
    serverClaudeNotArray: 'Claude did not return a valid JSON array.',
    serverPdfNoText: 'No readable text could be extracted from the PDF. Claude visual analysis will be used instead.',
    serverPdfUnreadable: 'The PDF could not be read. Please verify that it is not corrupted.',
    serverExportInvalid: 'The data used to export the Excel file is not valid.'
  },
  fr: {
    metadataDescription: 'Convertissez des factures PDF en Excel avec extraction côté serveur et Claude.',
    languageLabel: 'Langue',
    heroEyebrow: 'Extractor.app v1 · Next.js + Claude côté serveur',
    heroTitle: 'Factures PDF vers Excel, sans exposer votre clé API.',
    heroSubtitle: (maxFiles) =>
      `Téléversez jusqu’à ${maxFiles} PDF avec texte intégré, choisissez les produits à extraire et générez un fichier Excel avec détail, résumé par facture et résumé par type.`,
    configurationTitle: 'Configuration',
    configurationSubtitle: 'Cette version traite de petits lots sur le serveur et ne stocke pas les PDF.',
    productTypeLabel: 'Type de produit',
    productTypeOptions: {
      filtros: 'Filtres (huile, carburant, air...)',
      refrigeracion: 'Pièces de réfrigération',
      vehiculos: 'Pièces de véhicules',
      todo: 'Tous les produits de la facture',
      custom: 'Personnalisé'
    },
    yearModeLabel: 'Année des factures',
    yearAuto: 'Automatique (recommandé)',
    currencyLabel: 'Devise de sortie',
    currencyOptions: {
      EUR: 'Euro (EUR)',
      XAF: 'Franc CFA d’Afrique centrale (XAF / BEAC)',
      XOF: 'Franc CFA d’Afrique de l’Ouest (XOF / BCEAO)'
    },
    customDescriptionLabel: 'Description personnalisée',
    customDescriptionPlaceholder: 'Ex. : condenseurs, compresseurs et évaporateurs industriels',
    uploadTitle: 'Téléversez vos factures PDF',
    uploadHint: 'PDF avec texte intégré ou scanné. Si aucun texte lisible n’est trouvé, Claude analysera le PDF visuellement.',
    limitsTitle: 'Limites du MVP',
    limitsMaxFiles: (count) => `Jusqu’à ${count} PDF par envoi.`,
    limitsMaxSize: (sizeMb) => `Maximum ${sizeMb} Mo par fichier.`,
    limitsPages: (pages) => `Jusqu’à ${pages} pages lues par facture.`,
    buttonExtract: 'Extraire les données',
    buttonExtracting: 'Extraction...',
    buttonDownload: 'Télécharger Excel',
    buttonClear: 'Effacer',
    statsFacturas: 'Factures',
    statsLineas: 'Lignes',
    statsUnidades: 'Unités',
    statsTotal: 'Total',
    fileStatusTitle: 'État par fichier',
    fileStatusSubtitle: 'Le traitement est séquentiel pour simplifier les coûts, les erreurs et les temps de réponse.',
    fileStatusEmpty: 'Aucun fichier sélectionné pour le moment. Une fois envoyés, l’état de chaque facture apparaîtra ici.',
    fileStatusDetected: (count) => `${count} ligne(s) détectée(s).`,
    fileStatusPending: 'En attente de traitement.',
    fileStatusLabels: {
      pending: 'en attente',
      reading: 'lecture',
      extracting: 'extraction',
      done: 'terminé',
      error: 'erreur'
    },
    extractedTitle: 'Données extraites',
    extractedSubtitle: 'Les résultats sont agrégés par ligne puis réutilisés pour générer le fichier Excel.',
    extractedEmpty: 'Les lignes extraites apparaîtront ici une fois le traitement terminé.',
    logsTitle: 'Journal de session',
    logsSubtitle: 'Messages de haut niveau pour détecter les problèmes sans exposer de données sensibles.',
    logsEmpty: 'Le journal se remplira pendant l’extraction et lors du téléchargement du fichier Excel.',
    tableHeaders: {
      factura: 'Facture',
      fecha: 'Date',
      destino: 'Destination',
      refInterna: 'Réf. interne',
      tipo: 'Type',
      modelo: 'Modèle',
      cantidad: 'Quantité',
      precioUnitario: 'Prix unitaire',
      total: 'Total',
      archivo: 'Fichier'
    },
    validationNoFiles: 'Vous devez sélectionner au moins un PDF.',
    validationCustomDescription: 'Vous devez décrire les produits à extraire.',
    validationTooManyFiles: (count) => `Vous pouvez téléverser au maximum ${count} PDF par envoi.`,
    validationInvalidPdf: (name) => `"${name}" n’est pas un PDF valide.`,
    validationFileTooLarge: (name, maxMb) => `"${name}" dépasse la limite de ${maxMb} Mo.`,
    requestFailed: 'L’extraction n’a pas pu être terminée.',
    exportFailed: 'Le fichier Excel n’a pas pu être généré.',
    logStart: (count) => `Démarrage de l’extraction pour ${count} facture(s).`,
    logQueuedFile: (name, size) => `PDF en file d’attente : ${name} (${size})`,
    logFileDone: (name, count) => `${name} : ${count} ligne(s) extraite(s).`,
    logFileError: (name, message) => `${name} : ${message}`,
    logCompleted: (lines, files) => `Traitement terminé : ${lines} ligne(s) extraite(s) depuis ${files} fichier(s).`,
    logDownloaded: (filename) => `Excel téléchargé : ${filename}`,
    serverMissingApiKey: 'La clé API Anthropic n’est pas configurée sur le serveur.',
    serverRequestInvalid: 'La requête n’a pas pu être traitée.',
    serverNoPdf: 'Vous devez téléverser au moins un PDF.',
    serverCustomDescriptionRequired: 'Vous devez décrire les produits à extraire.',
    serverClaudeConfigInvalid: 'La configuration Anthropic côté serveur n’est pas valide.',
    serverClaudeRateLimited: 'Anthropic a temporairement rejeté la requête. Réessayez.',
    serverClaudeFailed: 'L’extraction avec Claude n’a pas pu être terminée.',
    serverClaudeInvalidJson: 'Claude a renvoyé un JSON invalide.',
    serverClaudeNotArray: 'Claude n’a pas renvoyé de tableau JSON valide.',
    serverPdfNoText: 'Aucun texte lisible n’a pu être extrait du PDF. Une analyse visuelle avec Claude sera utilisée à la place.',
    serverPdfUnreadable: 'Le PDF n’a pas pu être lu. Vérifiez qu’il n’est pas corrompu.',
    serverExportInvalid: 'Les données utilisées pour exporter le fichier Excel ne sont pas valides.'
  },
  zh: {
    metadataDescription: '使用服务端 Claude 将 PDF 发票转换为 Excel。',
    languageLabel: '语言',
    heroEyebrow: 'Extractor.app v1 · Next.js + 服务端 Claude',
    heroTitle: '将 PDF 发票转为 Excel，同时不暴露你的 API Key。',
    heroSubtitle: (maxFiles) =>
      `最多上传 ${maxFiles} 个带可提取文本的 PDF，选择要提取的产品类型，并生成包含明细、按发票汇总和按类型汇总的 Excel。`,
    configurationTitle: '配置',
    configurationSubtitle: '此版本在服务器上处理小批量文件，不会保存 PDF。',
    productTypeLabel: '产品类型',
    productTypeOptions: {
      filtros: '过滤器（机油、燃油、空气等）',
      refrigeracion: '制冷配件',
      vehiculos: '车辆配件',
      todo: '发票中的全部产品',
      custom: '自定义'
    },
    yearModeLabel: '发票年份',
    yearAuto: '自动（推荐）',
    currencyLabel: '输出货币',
    currencyOptions: {
      EUR: '欧元 (EUR)',
      XAF: '中非 CFA 法郎 (XAF / BEAC)',
      XOF: '西非 CFA 法郎 (XOF / BCEAO)'
    },
    customDescriptionLabel: '自定义说明',
    customDescriptionPlaceholder: '例如：工业冷凝器、压缩机和蒸发器',
    uploadTitle: '上传 PDF 发票',
    uploadHint: '支持带文本的 PDF 和扫描 PDF。如果没有可读文本，Claude 会直接进行视觉分析。',
    limitsTitle: 'MVP 限制',
    limitsMaxFiles: (count) => `每次最多上传 ${count} 个 PDF。`,
    limitsMaxSize: (sizeMb) => `每个文件最大 ${sizeMb} MB。`,
    limitsPages: (pages) => `每张发票最多读取 ${pages} 页。`,
    buttonExtract: '提取数据',
    buttonExtracting: '提取中...',
    buttonDownload: '下载 Excel',
    buttonClear: '清空',
    statsFacturas: '发票数',
    statsLineas: '行数',
    statsUnidades: '数量',
    statsTotal: '总额',
    fileStatusTitle: '文件状态',
    fileStatusSubtitle: '处理按顺序进行，以简化成本、错误处理和响应时间。',
    fileStatusEmpty: '你还没有选择文件。上传后，每张发票的状态会显示在这里。',
    fileStatusDetected: (count) => `检测到 ${count} 行。`,
    fileStatusPending: '等待处理。',
    fileStatusLabels: {
      pending: '等待中',
      reading: '读取中',
      extracting: '提取中',
      done: '完成',
      error: '错误'
    },
    extractedTitle: '提取结果',
    extractedSubtitle: '结果会按行聚合，然后用于生成 Excel 文件。',
    extractedEmpty: '处理完成后，提取出的数据行会显示在这里。',
    logsTitle: '会话日志',
    logsSubtitle: '用于发现问题的高层级消息，不会暴露敏感数据。',
    logsEmpty: '提取和下载 Excel 时，这里会逐步显示日志。',
    tableHeaders: {
      factura: '发票',
      fecha: '日期',
      destino: '目的地',
      refInterna: '内部编号',
      tipo: '类型',
      modelo: '型号',
      cantidad: '数量',
      precioUnitario: '单价',
      total: '总额',
      archivo: '文件'
    },
    validationNoFiles: '请至少选择一个 PDF。',
    validationCustomDescription: '请说明要提取哪些产品。',
    validationTooManyFiles: (count) => `每次最多只能上传 ${count} 个 PDF。`,
    validationInvalidPdf: (name) => `"${name}" 不是有效的 PDF。`,
    validationFileTooLarge: (name, maxMb) => `"${name}" 超过 ${maxMb} MB 限制。`,
    requestFailed: '提取未能完成。',
    exportFailed: '无法生成 Excel 文件。',
    logStart: (count) => `开始提取 ${count} 份发票。`,
    logQueuedFile: (name, size) => `加入队列的 PDF：${name}（${size}）`,
    logFileDone: (name, count) => `${name}：已提取 ${count} 行。`,
    logFileError: (name, message) => `${name}：${message}`,
    logCompleted: (lines, files) => `处理完成：共从 ${files} 个文件中提取 ${lines} 行。`,
    logDownloaded: (filename) => `Excel 已下载：${filename}`,
    serverMissingApiKey: '服务器未配置 Anthropic API Key。',
    serverRequestInvalid: '请求无法处理。',
    serverNoPdf: '请至少上传一个 PDF。',
    serverCustomDescriptionRequired: '请说明要提取哪些产品。',
    serverClaudeConfigInvalid: '服务器上的 Anthropic 配置无效。',
    serverClaudeRateLimited: 'Anthropic 暂时拒绝了请求，请稍后重试。',
    serverClaudeFailed: '无法完成 Claude 提取。',
    serverClaudeInvalidJson: 'Claude 返回了无效 JSON。',
    serverClaudeNotArray: 'Claude 没有返回有效的 JSON 数组。',
    serverPdfNoText: '无法从 PDF 中提取可读文本。将改用 Claude 视觉分析。',
    serverPdfUnreadable: '无法读取该 PDF，请检查文件是否损坏。',
    serverExportInvalid: '用于导出 Excel 的数据无效。'
  }
};

export function normalizeLanguage(input: unknown): AppLanguage {
  return input === 'es' || input === 'en' || input === 'fr' || input === 'zh'
    ? input
    : DEFAULT_LANGUAGE;
}

export function getTranslations(language: AppLanguage) {
  return translations[language] || translations[DEFAULT_LANGUAGE];
}
