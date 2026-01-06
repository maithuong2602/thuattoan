
export type AlgorithmType = 'bubble' | 'selection' | 'linear_search' | 'binary_search';

export interface Customer {
  tt: number;
  name: string;
  address: string;
}

export type Phase = 
  | 'start' 
  | 'compare' 
  | 'swap' 
  | 'check_swap' 
  | 'advance' 
  | 'next_j' 
  | 'next_scan' 
  | 'finish_round' 
  | 'check_match' 
  | 'check_end' 
  | 'found' 
  | 'not_found' 
  | 'calc_mid' 
  | 'go_left' 
  | 'go_right' 
  | 'done';

export interface AlgoState {
  i: number;
  j: number;
  phase: Phase;
}

export interface RangeState {
  low: number;
  high: number;
  mid: number;
}
