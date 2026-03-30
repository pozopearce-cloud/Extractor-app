import type { ProductType } from '@/types/extractor';

interface PromptContext {
  productType: ProductType;
  customDescription?: string;
  filename: string;
  text: string;
}

const productConfigs: Record<
  ProductType,
  {
    role: (custom?: string) => string;
    what: (custom?: string) => string;
    ignore: string;
    typeExample: (custom?: string) => string;
  }
> = {
  filtros: {
    role: () =>
      'experto en extracción de datos de facturas de filtros industriales y de vehículos',
    what: () =>
      'filtros de cualquier tipo (aceite, combustible, gasoil, aire, hidráulico, separador, secador, habitáculo, gasolina, agua)',
    ignore:
      'portes, servicios administrativos, palets, vasos plásticos y cualquier artículo que no sea un filtro',
    typeExample: () =>
      'FILTRO DE ACEITE, FILTRO DE COMBUSTIBLE, FILTRO DE AIRE, FILTRO HIDRÁULICO, FILTRO SEPARADOR, FILTRO SECADOR, FILTRO DE HABITÁCULO'
  },
  refrigeracion: {
    role: () =>
      'experto en extracción de datos de facturas de repuestos de refrigeración y climatización',
    what: () =>
      'repuestos de refrigeración: condensadores, evaporadores, compresores, válvulas de expansión, presostatos, termostatos, ventiladores, carcasas y cualquier componente de sistema frigorífico',
    ignore:
      'portes, servicios y cualquier artículo que no sea un repuesto de refrigeración',
    typeExample: () =>
      'CONDENSADOR, EVAPORADOR, COMPRESOR, VÁLVULA, PRESOSTATO, TERMOSTATO, VENTILADOR, FILTRO DESHIDRATADOR'
  },
  vehiculos: {
    role: () =>
      'experto en extracción de datos de facturas de repuestos de vehículos y maquinaria',
    what: () =>
      'repuestos de vehículos y maquinaria: filtros, frenos, embragues, correas, amortiguadores, juntas, rodamientos, bujías y cualquier pieza de recambio',
    ignore: 'portes, servicios administrativos y consumibles no técnicos',
    typeExample: () =>
      'FILTRO, PASTILLA DE FRENO, CORREA, AMORTIGUADOR, JUNTA, RODAMIENTO, BUJÍA'
  },
  todo: {
    role: () => 'experto en extracción de datos de facturas comerciales',
    what: () =>
      'todos los productos o artículos que aparecen como líneas de producto en la factura',
    ignore: 'solo portes o envíos con precio 0 y líneas de texto descriptivo sin precio',
    typeExample: () => 'la categoría del producto según lo que aparezca en la factura'
  },
  custom: {
    role: (custom) =>
      `experto en extracción de datos de facturas de: ${custom || 'productos varios'}`,
    what: (custom) => custom || 'todos los productos',
    ignore: 'portes, servicios sin producto físico',
    typeExample: () => 'la categoría que corresponda al producto'
  }
};

export function buildExtractionPrompt({
  productType,
  customDescription,
  filename,
  text
}: PromptContext) {
  const config = productConfigs[productType];

  return `Eres un ${config.role(customDescription)}.

Analiza el texto de esta factura PDF y extrae TODOS los artículos que sean: ${config.what(customDescription)}.
Ignora: ${config.ignore}.

Instrucciones de extracción:
- El número de factura suele aparecer al principio del documento.
- La fecha aparece cerca del número de factura.
- El destino suele ser BATA, MALABO, u otro lugar indicado en el documento.
- El tipo debe describir la categoría del producto (${config.typeExample(customDescription)}).
- El modelo es la referencia del fabricante o la referencia comercial del producto.
- La ref_interna es el código que aparece al inicio de cada línea de producto, si existe.
- Si un campo no aparece, usa cadena vacía.
- Si cantidad, precio_unitario o total no aparecen claramente, usa 0.

Responde ÚNICAMENTE con un array JSON válido, sin texto adicional ni bloques markdown:
[
  {
    "factura": "Factura_X-XXXX/XX",
    "fecha": "DD/MM/AAAA",
    "destino": "BATA",
    "ref_interna": "CMF9015",
    "tipo": "FILTRO DE COMBUSTIBLE",
    "modelo": "WK828X",
    "cantidad": 20,
    "precio_unitario": 5.79,
    "total": 115.75
  }
]

Si no hay productos que coincidan, devuelve [].

Texto de la factura (${filename}):
---
${text.slice(0, 12_000)}
---`;
}

export function buildDocumentExtractionPrompt({
  productType,
  customDescription,
  filename
}: Omit<PromptContext, 'text'>) {
  const config = productConfigs[productType];

  return `Eres un ${config.role(customDescription)}.

Analiza el PDF adjunto de la factura "${filename}" y extrae TODOS los artículos que sean: ${config.what(customDescription)}.
Ignora: ${config.ignore}.

Lee tanto el texto como el contenido visual del PDF si fuera necesario.

Instrucciones de extracción:
- El número de factura suele aparecer al principio del documento.
- La fecha aparece cerca del número de factura.
- El destino suele ser BATA, MALABO, u otro lugar indicado en el documento.
- El tipo debe describir la categoría del producto (${config.typeExample(customDescription)}).
- El modelo es la referencia del fabricante o la referencia comercial del producto.
- La ref_interna es el código que aparece al inicio de cada línea de producto, si existe.
- Si un campo no aparece, usa cadena vacía.
- Si cantidad, precio_unitario o total no aparecen claramente, usa 0.

Responde ÚNICAMENTE con un array JSON válido, sin texto adicional ni bloques markdown:
[
  {
    "factura": "Factura_X-XXXX/XX",
    "fecha": "DD/MM/AAAA",
    "destino": "BATA",
    "ref_interna": "CMF9015",
    "tipo": "FILTRO DE COMBUSTIBLE",
    "modelo": "WK828X",
    "cantidad": 20,
    "precio_unitario": 5.79,
    "total": 115.75
  }
]

Si no hay productos que coincidan, devuelve [].`;
}
