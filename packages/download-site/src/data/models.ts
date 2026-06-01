export type CatalogModel = {
  id: string;
  ollamaTag: string;
  displayName: string;
  description: string;
  sizeLabel: string;
  ramLabel: string;
  tier: 'small' | 'medium' | 'large';
  tags: string[];
  isStarter?: boolean;
};

export const MODEL_CATALOG: CatalogModel[] = [
  {
    id: 'qwen2.5-coder-7b',
    ollamaTag: 'qwen2.5-coder:7b',
    displayName: 'Qwen2.5 Coder 7B',
    description: 'Recommended starter — fast coding & chat on 8 GB RAM.',
    sizeLabel: '~4.7 GB',
    ramLabel: '8 GB RAM',
    tier: 'medium',
    tags: ['coding', 'chat'],
    isStarter: true,
  },
  {
    id: 'deepseek-coder-v2-lite',
    ollamaTag: 'deepseek-coder-v2:16b-lite',
    displayName: 'DeepSeek Coder V2 Lite',
    description: 'Strong code generation for larger machines.',
    sizeLabel: '~9 GB',
    ramLabel: '12 GB RAM',
    tier: 'medium',
    tags: ['coding'],
  },
  {
    id: 'starcoder2-7b',
    ollamaTag: 'starcoder2:7b',
    displayName: 'StarCoder2 7B',
    description: 'Autocomplete-friendly coding model.',
    sizeLabel: '~4 GB',
    ramLabel: '8 GB RAM',
    tier: 'small',
    tags: ['coding', 'autocomplete'],
  },
  {
    id: 'qwen2.5-14b',
    ollamaTag: 'qwen2.5:14b',
    displayName: 'Qwen2.5 14B',
    description: 'Better reasoning & architecture planning.',
    sizeLabel: '~9 GB',
    ramLabel: '16 GB RAM',
    tier: 'large',
    tags: ['reasoning', 'chat'],
  },
  {
    id: 'deepseek-r1-8b',
    ollamaTag: 'deepseek-r1:8b',
    displayName: 'DeepSeek R1 8B',
    description: 'Reasoning & debug-heavy workflows.',
    sizeLabel: '~5.2 GB',
    ramLabel: '12 GB RAM',
    tier: 'large',
    tags: ['reasoning', 'debug'],
  },
];
