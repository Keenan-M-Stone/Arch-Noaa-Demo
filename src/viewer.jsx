// viewer.jsx
import React, { useEffect, useState, useCallback } from "react";
import Papa from "papaparse";
import { renderEditor } from "./table_helpers";

/*
  GOALS:
  -----------------
  1. Upload CSV → Parse → Display in editable table
  2. Allow editing individual cells
  3. Allow deleting rows (via context menu)
  4. Save back to CSV by native Save (File System Access API) or Download
  5. Undo / Redo (Ctrl+Z / Ctrl+Shift+Z)
*/

export default function Viewer() {
  // core table data: rows represented as arrays; header is rowIndex 0
  const [data, setData] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [fileName, setFileName] = useState("");

  // history stacks for undo/redo
  const [undoStack, setUndoStack] = useState([]); // array of past data snapshots
  const [redoStack, setRedoStack] = useState([]); // array of undone snapshots

  // Context menu state for rows and headers
  const [rowMenu, setRowMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    rowIndex: null,
  });
  const [headerMenu, setHeaderMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    colIndex: null,
  });

  // -----------------------------
  // History helpers
  // -----------------------------
  const pushHistory = useCallback(
    (prevData) => {
      // store a deep-ish copy (arrays of arrays) so later mutations don't mutate snapshots
      const snapshot = prevData.map((r) => [...r]);
      setUndoStack((u) => [...u, snapshot]);
      setRedoStack([]); // clear redo on new action
    },
    [setUndoStack, setRedoStack]
  );

  const undo = useCallback(() => {
    setUndoStack((prevUndo) => {
      if (prevUndo.length === 0) return prevUndo;
      setData((current) => {
        const last = prevUndo[prevUndo.length - 1];
        setRedoStack((r) => [...r, current.map((r2) => [...r2])]);
        return last.map((r) => [...r]);
      });
      return prevUndo.slice(0, -1);
    });
  }, [setUndoStack, setRedoStack, setData]);

  const redo = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      setData((current) => {
        const next = prevRedo[prevRedo.length - 1];
        setUndoStack((u) => [...u, current.map((r) => [...r])]);
        return next.map((r) => [...r]);
      });
      return prevRedo.slice(0, -1);
    });
  }, [setRedoStack, setUndoStack, setData]);

  // Keyboard listeners for ctrl+z & ctrl+shift+z
  useEffect(() => {
    const handler = (e) => {
      // use lower-case to be safe
      const key = e.key;
      if ((e.ctrlKey || e.metaKey) && (key === "z" || key === "Z") && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (key === "Z" || (e.shiftKey && key === "z"))) {
        // ctrl+shift+z or cmd+shift+z
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // -----------------------------
  // CSV Upload / parse
  // -----------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cols = results.meta.fields || [];
        const rowsAsArrays = [
          cols,
          ...results.data.map((row) => cols.map((col) => row[col] ?? "")),
        ];
        // reset history when loading a new file
        setUndoStack([]);
        setRedoStack([]);
        setData(rowsAsArrays);
        setLoaded(true);
      },
      error: (err) => {
        console.error("PapaParse error:", err);
      },
    });
  };

  // -----------------------------
  // Cell edit
  // -----------------------------
  const updateCell = (rowIndex, colIndex, newValue) => {
    setData((prev) => {
      pushHistory(prev);
      const next = prev.map((r) => [...r]);
      next[rowIndex][colIndex] = newValue;
      return next;
    });
  };

  // -----------------------------
  // Row operations (now invoked from context menu)
  // -----------------------------
  const deleteRow = (rowIndex) => {
    if (rowIndex === 0) return; // never delete header
    setData((prev) => {
      pushHistory(prev);
      return prev.filter((_, i) => i !== rowIndex);
    });
  };

  const insertRowAbove = (rowIndex) => {
    setData((prev) => {
      pushHistory(prev);
      const cols = prev[0] ? prev[0].length : 0;
      const empty = Array(cols).fill("");
      const next = prev.map((r) => [...r]);
      next.splice(rowIndex, 0, empty);
      return next;
    });
  };

  const insertRowBelow = (rowIndex) => {
    setData((prev) => {
      pushHistory(prev);
      const cols = prev[0] ? prev[0].length : 0;
      const empty = Array(cols).fill("");
      const next = prev.map((r) => [...r]);
      next.splice(rowIndex + 1, 0, empty);
      return next;
    });
  };

  // -----------------------------
  // Column operations (header menu)
  // -----------------------------
  const deleteColumn = (colIndex) => {
    setData((prev) => {
      pushHistory(prev);
      return prev.map((row) => row.filter((_, i) => i !== colIndex));
    });
  };

  const renameColumn = (colIndex, newName) => {
    setData((prev) => {
      pushHistory(prev);
      const next = prev.map((r) => [...r]);
      if (next[0]) next[0][colIndex] = newName;
      return next;
    });
  };

  const insertColumnLeft = (colIndex) => {
    setData((prev) => {
      pushHistory(prev);
      return prev.map((row) => {
        const next = [...row];
        next.splice(colIndex, 0, "");
        return next;
      });
    });
  };

  const insertColumnRight = (colIndex) => {
    setData((prev) => {
      pushHistory(prev);
      return prev.map((row) => {
        const next = [...row];
        next.splice(colIndex + 1, 0, "");
        return next;
      });
    });
  };

  // -----------------------------
  // Download
  // -----------------------------
  const doDownload = () => {
    if (!data || data.length === 0) return;

    const defaultFileName = window.prompt(
      "Enter filename to save CSV:",
      fileName || "data.csv"
    );
    if (!defaultFileName) return;

    const csvString = Papa.unparse(data);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const href = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = href;
    link.setAttribute("download", defaultFileName);
    document.body.appendChild(link);

    setTimeout(() => {
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    }, 0);
  };



  // -----------------------------
  // Save/SaveAs
  // -----------------------------
  const saveCsv = async () => {
    if (!data || data.length === 0) return;

    if (!window.showSaveFilePicker) {
      alert("Your browser doesn't support Save As.\nA download will be triggered instead.");
      return doDownload();
    }

    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName || "data.csv",
        types: [
          {
            description: "CSV File",
            accept: { "text/csv": [".csv"] }
          }
        ]
      });

      const writable = await handle.createWritable();
      const csvString = Papa.unparse(data);
      await writable.write(csvString);
      await writable.close();
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("Save failed:", err);
      alert("Error saving file.\nA download will be triggered instead.");
      doDownload();
    }
  };


  // -----------------------------
  // helpers to open/close menus (passed to table rendering)
  // -----------------------------
  const openRowMenu = (e, rowIndex) => {
    e.preventDefault();
    setRowMenu({ visible: true, x: e.clientX, y: e.clientY, rowIndex });
    // close header menu if open
    setHeaderMenu((h) => ({ ...h, visible: false }));
  };

  const closeRowMenu = () => setRowMenu({ visible: false, x: 0, y: 0, rowIndex: null });

  const openHeaderMenu = (e, colIndex) => {
    e.preventDefault();
    // left click uses clientX/Y; keep consistent
    setHeaderMenu({ visible: true, x: e.clientX, y: e.clientY, colIndex });
    setRowMenu((r) => ({ ...r, visible: false }));
  };

  const closeHeaderMenu = () => setHeaderMenu({ visible: false, x: 0, y: 0, colIndex: null });

  // expose the props expected by table_helpers.renderEditor
  const props = {
    // data + flags
    data,
    loaded,
    // actions
    handleFileUpload,
    saveCsv,
    doDownload,
    updateCell,
    // row ops
    deleteRow,
    insertRowAbove,
    insertRowBelow,
    // column ops
    deleteColumn,
    renameColumn,
    insertColumnLeft,
    insertColumnRight,
    // menus
    rowMenu,
    headerMenu,
    openRowMenu,
    closeRowMenu,
    openHeaderMenu,
    closeHeaderMenu,
  };

  return renderEditor(props);
}
