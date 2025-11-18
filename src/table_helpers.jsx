// table_helpers.jsx
import React from "react";

// small shared styles to keep UI usable out-of-the-box
const buttonStyle = {
  border: "1px solid #666",
  padding: "5px 10px",
  borderRadius: "4px",
  backgroundColor: "#ddd",
  cursor: "pointer",
};

const menuStyle = {
  position: "fixed",
  background: "#fff",
  border: "1px solid #ccc",
  borderRadius: 4,
  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  zIndex: 9999,
  minWidth: 160,
};

const menuItemStyle = {
  padding: "6px 12px",
  cursor: "pointer",
};

// -----------------------------------
// Render Header (Upload + Save + Download Buttons)
// -----------------------------------
export const renderHeader = ({ loaded, handleFileUpload, saveCsv, doDownload }) => (
  <div style={{ marginBottom: "10px" }}>
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

    {/* Download - legacy behavior */}
    <button onClick={doDownload} style={{ ...buttonStyle, marginRight: 8 }}>
      Download
    </button>

    {/* Save - native file dialog (if supported) */}
    <button onClick={saveCsv} style={buttonStyle}>
      Save CSV
    </button>
  </div>
);

// -----------------------------------
// Render Table Rows
// -----------------------------------
const renderTableRows = (params) => {
  const {
    data,
    updateCell,
    openRowMenu,
    openHeaderMenu,
  } = params;

  return data.map((row, rowIndex) => (
    <tr
      key={rowIndex}
      onContextMenu={(e) => {
        if (rowIndex !== 0) openRowMenu(e, rowIndex);
      }}
    >
      {row.map((cell, colIndex) => {
        // header row
        if (rowIndex === 0) {
          return (
            <th
              key={colIndex}
              onClick={(e) => openHeaderMenu(e, colIndex)}
              style={{
                padding: "6px 8px",
                textAlign: "left",
                userSelect: "none",
                cursor: "pointer",
                background: "#f6f6f6",
                borderBottom: "1px solid #ddd",
              }}
            >
              {cell}
            </th>
          );
        }

        // data rows
        return (
          <td key={colIndex} style={{ padding: 4 }}>
            <input
              style={{ width: "100%", boxSizing: "border-box", padding: "4px" }}
              value={cell}
              onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
            />
          </td>
        );
      })}
    </tr>
  ));
};

// -----------------------------------
// Render Table Wrapper
// -----------------------------------
export const renderTable = (params) => (
  <div 
    // Scroll bars
    style={{
      width: "100%",
      height: "100%",
      overflow: "auto",
      whiteSpace: "nowrap",
      border: "1px solid #ccc",
    }}
  >
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <tbody>{renderTableRows(params)}</tbody>
    </table>
  </div>
);

// -----------------------------------
// Render Editor (full layout including menus)
// -----------------------------------
export const renderEditor = (params) => {
  const {
    fileName,
    data,
    loaded,
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
    // menus state & handlers
    rowMenu,
    headerMenu,
    closeRowMenu,
    closeHeaderMenu,
  } = params;

  // Handlers invoked from context menu items
  const onDeleteRow = () => {
    if (rowMenu.rowIndex != null) {
      deleteRow(rowMenu.rowIndex);
    }
    closeRowMenu();
  };
  const onInsertRowAbove = () => {
    if (rowMenu.rowIndex != null) insertRowAbove(rowMenu.rowIndex);
    closeRowMenu();
  };
  const onInsertRowBelow = () => {
    if (rowMenu.rowIndex != null) insertRowBelow(rowMenu.rowIndex);
    closeRowMenu();
  };

  // Header menu handlers
  const onDeleteColumn = () => {
    if (headerMenu.colIndex != null) deleteColumn(headerMenu.colIndex);
    closeHeaderMenu();
  };
  const onRenameColumn = () => {
    if (headerMenu.colIndex == null) {
      closeHeaderMenu();
      return;
    }
    const newName = window.prompt("Enter new column name:", data[0][headerMenu.colIndex] || "");
    if (newName != null) {
      renameColumn(headerMenu.colIndex, newName);
    }
    closeHeaderMenu();
  };
  const onInsertColumnLeft = () => {
    if (headerMenu.colIndex != null) insertColumnLeft(headerMenu.colIndex);
    closeHeaderMenu();
  };
  const onInsertColumnRight = () => {
    if (headerMenu.colIndex != null) insertColumnRight(headerMenu.colIndex);
    closeHeaderMenu();
  };

  return (
    <div style={{ padding: "20px" }} onClick={
        () => { /* click-away: let menus close when clicking elsewhere */ }
      }>
      <h2>CSV Editor - For Arch/NOAA Demo</h2>
      {renderHeader({ loaded, handleFileUpload, saveCsv, doDownload })}
      {data && data.length > 0 && renderTable({ data, updateCell, openRowMenu: params.openRowMenu, openHeaderMenu: params.openHeaderMenu })}

      {/* Row context menu (right-click on a data row) */}
      {rowMenu.visible && (
        <div
          style={{
            ...menuStyle,
            left: rowMenu.x,
            top: rowMenu.y,
          }}
          onMouseLeave={closeRowMenu}
        >
          <div
            style={menuItemStyle}
            onClick={() => {
              onDeleteRow();
            }}
          >
            Delete Row
          </div>
          <div
            style={menuItemStyle}
            onClick={() => {
              onInsertRowAbove();
            }}
          >
            Insert Row Above
          </div>
          <div
            style={menuItemStyle}
            onClick={() => {
              onInsertRowBelow();
            }}
          >
            Insert Row Below
          </div>
        </div>
      )}

      {/* Header menu (left-click on header cell) */}
      {headerMenu.visible && (
        <div
          style={{
            ...menuStyle,
            left: headerMenu.x,
            top: headerMenu.y,
          }}
          onMouseLeave={closeHeaderMenu}
        >
          <div
            style={menuItemStyle}
            onClick={() => {
              onDeleteColumn();
            }}
          >
            Delete Column
          </div>

          <div
            style={menuItemStyle}
            onClick={() => {
              onRenameColumn();
            }}
          >
            Rename Column
          </div>

          <div
            style={menuItemStyle}
            onClick={() => {
              onInsertColumnLeft();
            }}
          >
            Insert Column Left
          </div>

          <div
            style={menuItemStyle}
            onClick={() => {
              onInsertColumnRight();
            }}
          >
            Insert Column Right
          </div>
        </div>
      )},
      <div
        style={{
          marginTop: "8px",
          padding: "6px 10px",
          borderTop: "1px solid #ccc",
          background: "#f8f8f8",
          fontSize: "0.9rem",
          color: "#333",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>File: {fileName || "No file loaded"}</span>
      </div>
    </div>
  );
};
