import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * When the URL has ?page=N (e.g. /beekeeping?page=5), scroll to the
 * <section id="pageN"> on the page. Used by the links in the intro TOC.
 */
export function useScrollToPageParam() {
  const [params] = useSearchParams();
  const page = params.get("page");

  useEffect(() => {
    if (!page) return;
    document
      .getElementById(`page${page}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);
}
