import React, { KeyboardEvent, useCallback, useEffect, useState } from "react";

import { RecordProps } from "../../components/RecordComponent";
import SlideDialog from "../../components/SlideDialog";
import { post } from "../../fetch";
import { getCurrentLanguge, trans } from "../../i18n";
import { showErrorDialog } from "../../error-dialog";
import ResultRow from "./ResultRow";
import { useGoToAdminPage } from "../../components/use-go-to-admin-page";

export type SearchResult = {
  parents: { title: string }[];
  path: string;
  title: string;
};

function FindFiles({
  page,
  record,
  dismiss,
}: RecordProps & { dismiss: () => void }): JSX.Element {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(-1);

  const goToAdminPage = useGoToAdminPage();

  const { alt } = record;

  useEffect(() => {
    if (!query) {
      setResults([]);
      setSelected(-1);
      return;
    }
    let ignore = false;

    post("/find", { q: query, alt, lang: getCurrentLanguge() }).then(
      ({ results }) => {
        if (!ignore) {
          setResults(results);
          setSelected((selected) => Math.min(selected, results.length - 1));
        }
      },
      showErrorDialog
    );
    return () => {
      ignore = true;
    };
  }, [alt, query]);

  const goto = useCallback(
    (item: SearchResult) => {
      const target = page === "preview" ? "preview" : "edit";
      dismiss();
      goToAdminPage(target, item.path, alt);
    },
    [alt, dismiss, goToAdminPage, page]
  );

  const onInputKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelected((selected) => (selected + 1) % results.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelected(
          (selected) => (selected - 1 + results.length) % results.length
        );
      } else if (event.key === "Enter") {
        const item = results[selected];
        if (item) {
          goto(item);
        }
      }
    },
    [goto, results, selected]
  );

  return (
    <SlideDialog dismiss={dismiss} hasCloseButton title={trans("FIND_FILES")}>
      <div className="form-group">
        <input
          type="text"
          autoFocus
          className="form-control"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          onKeyDown={onInputKey}
          placeholder={trans("FIND_FILES_PLACEHOLDER")}
        />
      </div>
      <ul className="search-results">
        {results.map((result, idx) => (
          <ResultRow
            key={result.path}
            result={result}
            isActive={idx === selected}
            onClick={() => goto(result)}
            onMouseEnter={() => setSelected(idx)}
          />
        ))}
      </ul>
    </SlideDialog>
  );
}

export default FindFiles;