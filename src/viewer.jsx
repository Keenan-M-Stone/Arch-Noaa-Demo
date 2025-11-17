import { useState } from "react";
import Papa from "papaparse";
import {renderEditor} from "./table_helpers";

/*
  GOALS:
  -----------------
  1. Upload CSV → Parse → Display in editable table
  2. Allow editing individual cells
  3. Allow deleting rows
  4. Save back to CSV by downloading updated file
  5. Try not to lose mind over tab => 2 spaces.
     (Trust that it's for the best)
*/

export default function Viewer() {
  // Holds parsed CSV rows (array of arrays)
  const [data, setData] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [fileName, setFileName] = useState("");

  // -----------------------------
  // Handle CSV Upload
  // -----------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    // Return on Cancel
    if (!file)
      return;
    // Set filename default
    setFileName(file.name);
    // Parse csv
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cols = results.meta.fields || [];
        const rowsAsArrays = [
          cols,
          ...results.data.map(row =>
            cols.map(col => row[col] ?? "")
          )
        ];
        //TODO: Remove Debug line
        //console.log("Parsed CSV:", results.data);
        setData(rowsAsArrays);
        setLoaded(true);
      },
      error: (err) => {
        console.error("PapaParse error:", err);
      }
    });
  };

  // -----------------------------
  // Edit a single cell in the table
  // -----------------------------
  const updateCell = (rowIndex, colIndex, newValue) => {
    setData((prev) => {
      const copy = [...prev];
      copy[rowIndex][colIndex] = newValue;
      return copy;
      }
    );
  };

  // -----------------------------
  // Delete a row from the table
  // -----------------------------
  const deleteRow = (rowIndex) => {
    setData(
      (prev) => prev.filter((_, i) => i !== rowIndex)
    );
  };

  // -----------------------------
  // Export updated CSV file
  // -----------------------------
  const saveCsv = () => {
    if (!data || data.length === 0)
       return;
    // Ask the user for a filename
    const defaultFileName = prompt("Enter filename to save CSV:", fileName)
    //Return on Cancel
    if (!defaultFileName)
       return;
    // Convert data to CSV string
    const csvString = Papa.unparse(data);
    // Create a blob containing the CSV
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    // Create a temporary link element
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", defaultFileName);
    // Programmatically click the link to trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  //! Don't need this local copy, but I like a clean return.
  const props = {
    loaded,
    data,
    updateCell,
    deleteRow,
    handleFileUpload,
    saveCsv
  };

  return renderEditor(props);
}
