export interface ImportCostItem {
  label: string;
  amount: number;
}

export interface ImportCostsConfig {
  default: ImportCostItem[];
  bySubcategorySlug: Record<string, ImportCostItem[]>;
}

export const IMPORT_COSTS: ImportCostsConfig = {
  default: [
    { label: 'Costo de envio', amount: 35000 },
    { label: 'Ext', amount: 100000 }
  ],
  bySubcategorySlug: {
    celulares: [
      { label: 'Costo de envio', amount: 35000 },
      { label: 'Ext', amount: 100000 }
    ],
    consolas_videojuego: [
      { label: 'Costo de envio', amount: 60000 },
      { label: 'Ext', amount: 100000 }
    ]
  }
};
