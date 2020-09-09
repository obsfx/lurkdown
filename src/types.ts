import Element from './Element'

export type t_spottedSeq = { idx: number, len: number };
export type t_extractFixesResult = { source: string, left: boolean, right: boolean };
export type t_seqs = { [key: string]: string[][] };
export type t_operateResult = [ Element | null, number ];
export type t_reflink = { key: string, url: string, title: string };
export type t_reflinkSpec = { elid: string, key: string, keyEl: Element, strEl: Element | null };
export type t_textAlign = { align: 'left' | 'right' | 'center' };
//          t_tableMatchResult   checkResult, rowsRange, columnCount, textAligns
export type t_tableMatchResult = [ boolean, number, number, t_textAlign[] | null ];
