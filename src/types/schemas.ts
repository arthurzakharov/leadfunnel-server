export type FieldType =
    | 'boolean'
    | 'date'
    | 'document'
    | 'email'
    | 'multi_record'
    | 'multi_select'
    | 'number'
    | 'phone'
    | 'read_only'
    | 'record'
    | 'select'
    | 'string'
    | 'text'
    | 'unknown'
    ;

export type CaseCategory =
    | 'Arbeitsrecht'
    | 'Einbuergerung'
    | 'Ordnungswidrigkeiten'
    | 'Ordnungswidrigkeiten__Verkehrsstrafrecht'
    | 'Schuldnerberatung'
    | 'global';

export interface CaseFieldDefinition {
    label: string;
    type: FieldType;
    id: string;
    category: CaseCategory;
}

export type CaseStructure = Record<string, CaseFieldDefinition>
