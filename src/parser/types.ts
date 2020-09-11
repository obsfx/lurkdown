import Element from './Element'

export type t_spottedSeq = { idx: number, len: number };
export type t_seqs = { [key: string]: string[][] };

export type t_extractFixesResult = { source: string, left: boolean, right: boolean };

export type t_operateResult = { type: 'inlinecontainer' | 'element', el: Element | null, nextStartingIdx: number };
export type t_inlineOperateResult = { el: Element | null, nextStartingIdx: number };
export type t_inlineParseResult = { el: Element, refs: t_ref[], reflinks: t_reflink[] };

export type t_ref = { key: string, url: string, title: string };
export type t_refUrlTitlePair = { url: string, title: string };
export type t_reflink = { elid: string, key: string, keyEl: Element, strEl: Element | null };

export type t_textAlign = { align: 'left' | 'right' | 'center' };
//          t_tableMatchResult   checkResult, rowsRange, columnCount, textAligns
export type t_tableMatchResult = [ boolean, number, number, t_textAlign[] | null ];
