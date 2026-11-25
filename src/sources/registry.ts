/**
 * All playlist sources, by kind. The order of SOURCE_ORDER is the order of the
 * sections in the library.
 */
import type { SourceKind } from '../domain/types.ts';
import { accountSource } from './account/account-source.ts';
import { catalogSource } from './catalog/catalog-source.ts';
import { manualSource } from './manual/manual-source.ts';
import type { PlaylistSource } from './types.ts';

export const SOURCES: Record<SourceKind, PlaylistSource> = {
  catalog: catalogSource,
  account: accountSource,
  manual: manualSource,
};

export const SOURCE_ORDER: readonly SourceKind[] = ['account', 'catalog', 'manual'];
