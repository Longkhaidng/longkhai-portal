export type FoodInspectionStepKey =
  | 'STEP1_FRESH'
  | 'STEP1_DRY'
  | 'STEP2_COOKING'
  | 'STEP3_SERVING'
  | 'STEP4_SAMPLE';

export type FoodReportFormKey = 'ALL' | 'M1_1' | 'M1_2' | 'M2' | 'M3' | 'M4';

export interface FoodInspectionSettings {
  companyName: string;
  inspector: string;
  location: string;
}

export interface FoodInspectionRecord {
  id: string;
  rowIndex?: number;
  date: string;
  col_0?: string;
  col_1?: string;
  col_2?: string;
  col_3?: string;
  col_4?: string;
  col_5?: string;
  col_6?: string;
  col_7?: string;
  col_8?: string;
  col_9?: string;
  col_10?: string;
  col_11?: string;
  col_12?: string;
  col_13?: string;
  col_14?: string;
  col_15?: string;
  col_16?: string;
  col_17?: string;
  col_18?: string;
  col_19?: string;
  [key: string]: any;
}

export interface FreshTemplateItem {
  id?: string;
  stt?: number;
  importDate?: string;
  name: string;
  time?: string;
  qty?: string;
  unit?: string;
  supplier?: string;
  addr?: string;
  deliverer?: string;
  doc?: string;
  vet?: string;
  quar?: string;
  sense?: string;
  test?: string;
  handle?: string;
  note?: string;
}

export interface DryTemplateItem {
  id?: string;
  stt?: number;
  importDate?: string;
  name: string;
  producer?: string;
  prod_addr?: string;
  time?: string;
  qty?: string;
  unit?: string;
  supplier?: string;
  deliverer?: string;
  addr?: string;
  phone?: string;
  exp?: string;
  storage?: string;
  doc?: string;
  cert?: string;
  sense?: string;
  handle?: string;
  note?: string;
}

export interface CookingTemplateItem {
  stt?: number;
  meal?: string;
  dishName: string;
  name?: string;
  ingName?: string;
  ingredients?: string;
  ingQty?: string;
  servings?: string;
  prepTime?: string;
  cookTime?: string;
  hygienePerson?: string;
  hygieneEquipment?: string;
  hygieneArea?: string;
  sense?: string;
  handle?: string;
  note?: string;
}

export interface ServingTemplateItem {
  stt?: number;
  meal?: string;
  dishName: string;
  name?: string;
  servings?: string;
  finishTime?: string;
  startEatTime?: string;
  container?: string;
  sense?: string;
  handle?: string;
  note?: string;
}

export interface SampleFoodTemplateItem {
  stt?: number;
  dishName: string;
  name?: string;
  meal?: string;
  servings?: string;
  weight?: string;
  box?: string;
  temp?: string;
  takeTime?: string;
  destroyTime?: string;
  note?: string;
}

export interface FoodInspectionStore {
  settings: FoodInspectionSettings;
  STEP1_FRESH: FoodInspectionRecord[];
  STEP1_DRY: FoodInspectionRecord[];
  STEP2_COOKING: FoodInspectionRecord[];
  STEP3_SERVING: FoodInspectionRecord[];
  STEP4_SAMPLE: FoodInspectionRecord[];
  freshTemplates: FreshTemplateItem[];
  dryTemplates: DryTemplateItem[];
  cookingTemplates: CookingTemplateItem[];
  servingTemplates: ServingTemplateItem[];
  sampleFoodTemplates: SampleFoodTemplateItem[];
  updatedAt?: string;
}

export const DEFAULT_FRESH_TEMPLATES: FreshTemplateItem[] = [];
export const DEFAULT_DRY_TEMPLATES: DryTemplateItem[] = [];
export const DEFAULT_COOKING_TEMPLATES: CookingTemplateItem[] = [];
export const DEFAULT_SERVING_TEMPLATES: ServingTemplateItem[] = [];
export const DEFAULT_SAMPLE_FOOD_TEMPLATES: SampleFoodTemplateItem[] = [];

const SAMPLE_RECORD_IDS = new Set([
  'TS_001', 'TS_002', 'TS_003', 'TS_004', 'TS_005', 'TS_006', 'TS_007',
  'KG_001', 'KG_002', 'KG_003', 'KG_004', 'KG_005',
  'CB_001', 'CB_002', 'CB_003', 'CB_004', 'CB_005', 'CB_006', 'CB_007',
  'KA_001', 'KA_002', 'KA_003', 'KA_004', 'KA_005',
  'LM_001', 'LM_002', 'LM_003', 'LM_004', 'LM_005',
]);

export function stripSampleFoodInspectionRecords(
  list?: FoodInspectionRecord[]
): FoodInspectionRecord[] {
  if (!Array.isArray(list)) return [];
  return list.filter((r) => r && !SAMPLE_RECORD_IDS.has(r.id));
}

const SAMPLE_DISH_NAMES = new Set([
  'Thịt vịt kho đậu',
  'Khoai tây xào',
  'Canh rau má nấu tôm',
  'Cơm trắng',
  'Cá ngừ kho thơm',
  'Cải thìa xào tỏi',
  'Canh bí đỏ nấu tôm',
]);

const SAMPLE_INGREDIENT_NAMES = new Set([
  'Thịt vịt',
  'Đậu phộng sống',
  'Khoai tây',
  'Tôm bạc',
  'Rau má',
  'Gạo',
]);

export function stripSampleCookingTemplates(
  list?: CookingTemplateItem[]
): CookingTemplateItem[] {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (t) =>
      t &&
      !SAMPLE_DISH_NAMES.has(t.dishName?.trim() || '') &&
      !SAMPLE_INGREDIENT_NAMES.has(t.ingName?.trim() || '')
  );
}

export function stripSampleServingTemplates(
  list?: ServingTemplateItem[]
): ServingTemplateItem[] {
  if (!Array.isArray(list)) return [];
  return list.filter((t) => t && !SAMPLE_DISH_NAMES.has(t.dishName?.trim() || ''));
}

export function stripSampleSampleFoodTemplates(
  list?: SampleFoodTemplateItem[]
): SampleFoodTemplateItem[] {
  if (!Array.isArray(list)) return [];
  return list.filter((t) => t && !SAMPLE_DISH_NAMES.has(t.dishName?.trim() || ''));
}

export function createInitialFoodInspectionStore(): FoodInspectionStore {
  return {
    settings: {
      companyName: 'Công ty CP Long Khải tại Đà Nẵng',
      inspector: 'Võ Thị Tuyết',
      location: 'Nhà ăn',
    },
    STEP1_FRESH: [],
    STEP1_DRY: [],
    STEP2_COOKING: [],
    STEP3_SERVING: [],
    STEP4_SAMPLE: [],
    freshTemplates: [],
    dryTemplates: [],
    cookingTemplates: [],
    servingTemplates: [],
    sampleFoodTemplates: [],
    updatedAt: new Date().toISOString(),
  };
}
