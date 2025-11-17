// table_helpers.jsx
import React from "react";

// -----------------------------------
// Render Header (Upload + Save Button)
// -----------------------------------
export const renderHeader = ({ loaded, handleFileUpload, saveCsv }) => (
  <div style={{ marginBottom: "10px" }}>
    {/* Load CSV button */}
    <label
      style={{
        marginRight: "10px",
        cursor: "pointer",
        border: "1px solid #666",
        padding: "5px 10px",
        borderRadius: "4px",
        backgroundColor: "#eee",
      }}
    >
      Load CSV
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />
    </label>
    {/* Save CSV button */}
    <button
      onClick={saveCsv}
      style={{
        border: "1px solid #666",
        padding: "5px 10px",
        borderRadius: "4px",
        backgroundColor: "#ddd",
      }}
    >
      Save CSV
    </button>
  </div>
);

// -----------------------------------
// Render Table Rows
// -----------------------------------
const renderTableRows = ({ data, updateCell, deleteRow }) =>
  data.map((row, rowIndex) => (
    <tr key={rowIndex}>
      {row.map((cell, colIndex) => (
        // Set header row apart from others
        rowIndex === 0 ? (
          <th key={colIndex}>{cell}</th>
        ) : (
        // Set the rest of the table
          <td key={colIndex}>
            <input
              value={cell}
              onChange={(e) =>
                updateCell(rowIndex, colIndex, e.target.value)
              }
            />
          </td>
        )
      ))}
      {/*Don't let them delete the header row*/}
      {rowIndex !== 0 && (
        <td>
          <button onClick={() => deleteRow(rowIndex)}>Delete</button>
        </td>
      )}
    </tr>
  ));

// -----------------------------------
// Render Table Wrapper
// -----------------------------------
export const renderTable = (params) => (
  <table>
    <tbody>{renderTableRows(params)}</tbody>
  </table>
);

// -----------------------------------
// Render Editor
// -----------------------------------
export const renderEditor = (params) => (
    <div style={{ padding: "20px" }}>
      <h2>CSV Editor - For Arch/NOAA Demo</h2>
      {renderHeader(params)}
      {params.data && params.data.length > 0 && renderTable(params)}
    </div>
);