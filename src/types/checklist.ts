export type ChecklistItemSnapshot = {
  label: string;
  checked: boolean;
  isCustom: boolean;
};

export type ChecklistSnapshot = {
  items: ChecklistItemSnapshot[];
  confirmedAt: string; // ISO 8601
};
