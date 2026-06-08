import type { Block, Society } from "@ams/api-types";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type ScopeContextValue = {
  society?: Society;
  block?: Block;
  setSociety: (society?: Society) => void;
  setBlock: (block?: Block) => void;
  queryParams: { society_id?: number; block_id?: number };
};

const ScopeContext = createContext<ScopeContextValue | undefined>(undefined);

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [society, setSocietyState] = useState<Society | undefined>(undefined);
  const [block, setBlock] = useState<Block | undefined>();

  const value = useMemo(
    () => ({
      society,
      block,
      setSociety: (next?: Society) => {
        setSocietyState(next);
        setBlock(undefined);
      },
      setBlock,
      queryParams: {
        society_id: society?.society_id,
        block_id: block?.block_id
      }
    }),
    [block, society]
  );

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useScope() {
  const value = useContext(ScopeContext);
  if (!value) throw new Error("useScope must be used inside ScopeProvider");
  return value;
}
