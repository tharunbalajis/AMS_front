
import type {
  Block,
  Society,
} from "@ams/api-types";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* -------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------- */

type QueryParams = {
  society_id?: number;
  block_id?: number;
};

type ScopeContextValue = {

  society?: Society;

  block?: Block;

  selectedSocietyId?: number;

  selectedBlockId?: number;

  setSociety: (
    society?: Society
  ) => void;

  setBlock: (
    block?: Block
  ) => void;

  clearScope: () => void;

  queryParams: QueryParams;
};

/* -------------------------------------------------- */
/* CONTEXT */
/* -------------------------------------------------- */

const ScopeContext =
  createContext<
    ScopeContextValue | undefined
  >(undefined);

/* -------------------------------------------------- */
/* STORAGE KEYS */
/* -------------------------------------------------- */

const STORAGE_KEYS = {

  society:
    "ams_selected_society",

  block:
    "ams_selected_block",
};

/* -------------------------------------------------- */
/* PROVIDER */
/* -------------------------------------------------- */

export function ScopeProvider({
  children,
}: {
  children: ReactNode;
}) {

  /* -------------------------------------------------- */
  /* STATE */
  /* -------------------------------------------------- */

  const [
    society,
    setSocietyState,
  ] = useState<
    Society | undefined
  >(undefined);

  const [
    block,
    setBlockState,
  ] = useState<
    Block | undefined
  >(undefined);

  /* -------------------------------------------------- */
  /* LOAD FROM STORAGE */
  /* -------------------------------------------------- */

  useEffect(() => {

    try {

      const savedSociety =
        localStorage.getItem(
          STORAGE_KEYS.society
        );

      const savedBlock =
        localStorage.getItem(
          STORAGE_KEYS.block
        );

      if (savedSociety) {

        setSocietyState(
          JSON.parse(
            savedSociety
          )
        );
      }

      if (savedBlock) {

        setBlockState(
          JSON.parse(
            savedBlock
          )
        );
      }

    } catch (err) {

      console.error(
        "Failed to restore scope",
        err
      );
    }

  }, []);

  /* -------------------------------------------------- */
  /* SET SOCIETY */
  /* -------------------------------------------------- */

  const setSociety =
    useCallback((
      next?: Society
    ) => {

      try {

        if (next) {

          localStorage.setItem(
            STORAGE_KEYS.society,
            JSON.stringify(next)
          );

        } else {

          localStorage.removeItem(
            STORAGE_KEYS.society
          );
        }

      } catch (err) {

        console.error(
          err
        );
      }

      /* IMPORTANT */
      /* RESET BLOCK ON SOCIETY CHANGE */

      setBlockState(undefined);

      localStorage.removeItem(
        STORAGE_KEYS.block
      );

      setSocietyState(next);

    }, []);

  /* -------------------------------------------------- */
  /* SET BLOCK */
  /* -------------------------------------------------- */

  const setBlock =
    useCallback((
      next?: Block
    ) => {

      try {

        if (next) {

          localStorage.setItem(
            STORAGE_KEYS.block,
            JSON.stringify(next)
          );

        } else {

          localStorage.removeItem(
            STORAGE_KEYS.block
          );
        }

      } catch (err) {

        console.error(
          err
        );
      }

      setBlockState(next);

    }, []);

  /* -------------------------------------------------- */
  /* CLEAR */
  /* -------------------------------------------------- */

  const clearScope =
    useCallback(() => {

      try {

        localStorage.removeItem(
          STORAGE_KEYS.society
        );

        localStorage.removeItem(
          STORAGE_KEYS.block
        );

      } catch (err) {

        console.error(
          err
        );
      }

      setSocietyState(
        undefined
      );

      setBlockState(
        undefined
      );

    }, []);

  /* -------------------------------------------------- */
  /* STABLE IDS */
  /* -------------------------------------------------- */

  const selectedSocietyId =
    useMemo(() => {

      return society?.society_id
        ? Number(
            society.society_id
          )
        : undefined;

    }, [society]);

  const selectedBlockId =
    useMemo(() => {

      return block?.block_id
        ? Number(
            block.block_id
          )
        : undefined;

    }, [block]);

  /* -------------------------------------------------- */
  /* STABLE QUERY PARAMS */
  /* -------------------------------------------------- */

  const queryParams =
    useMemo<QueryParams>(() => {

      return {

        society_id:
          selectedSocietyId,

        block_id:
          selectedBlockId,
      };

    }, [
      selectedSocietyId,
      selectedBlockId,
    ]);

  /* -------------------------------------------------- */
  /* CONTEXT VALUE */
  /* -------------------------------------------------- */

  const value =
    useMemo<ScopeContextValue>(() => {

      return {

        society,

        block,

        selectedSocietyId,

        selectedBlockId,

        setSociety,

        setBlock,

        clearScope,

        queryParams,
      };

    }, [

      society,

      block,

      selectedSocietyId,

      selectedBlockId,

      setSociety,

      setBlock,

      clearScope,

      queryParams,
    ]);

  return (

    <ScopeContext.Provider
      value={value}
    >
      {children}
    </ScopeContext.Provider>
  );
}

/* -------------------------------------------------- */
/* HOOK */
/* -------------------------------------------------- */

export function useScope() {

  const value =
    useContext(
      ScopeContext
    );

  if (!value) {

    throw new Error(
      "useScope must be used inside ScopeProvider"
    );
  }

  return value;
}
