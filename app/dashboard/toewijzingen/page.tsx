"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { Upload, Download, Trash2, X, Palette } from "lucide-react";
import { ThemeToggle } from "../../components/ui/theme-toggle";
import * as XLSX from "xlsx";
import { useData } from "../../../lib/DataContext";

interface CellData {
  [key: string]: string;
}

interface CellColorData {
  [key: string]: "red" | "blue" | "gray" | null;
}

type ColorStatus = "red" | "blue" | "gray" | null;

interface StaffMember {
  position: number;
  name: string;
}

interface GridData {
  row_number: number;
  column_number: number;
  resident_name: string;
  color_status?: ColorStatus;
}

const DEFAULT_IB_NAMES: Record<number, string> = {
  1: "Kris B",
  2: "Torben",
  3: "Didar",
  4: "Dorien",
  5: "Evelien",
  6: "Yasmina",
  7: "Imane",
  8: "Kirsten",
  9: "Monica",
};

const RESIDENT_ROW_MIN = 3;
const RESIDENT_ROW_MAX = 13;
const IB_COLUMN_MIN = 1;
const IB_COLUMN_MAX = 9;

const Toewijzingen = () => {
  const { dataMatchIt, updateInDataMatchIt } = useData();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [cellData, setCellData] = useState<CellData>({});
  const [cellColors, setCellColors] = useState<CellColorData>({});
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [tempValue, setTempValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [showColorMenu, setShowColorMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic row and column counts
  const [maxRow, setMaxRow] = useState(RESIDENT_ROW_MAX);
  const [maxColumn, setMaxColumn] = useState(IB_COLUMN_MAX);

  // Add paste event listener
  useEffect(() => {
    const handlePasteEvent = (event: ClipboardEvent) => {
      // Only handle paste if focus is on the table area
      const target = event.target as HTMLElement;
      if (
        target.closest("table") ||
        target.closest(".toewijzingen-container")
      ) {
        handlePaste(event);
      }
    };

    document.addEventListener("paste", handlePasteEvent);

    return () => {
      document.removeEventListener("paste", handlePasteEvent);
    };
  }, []);

  const saveGridData = useCallback(
    async (
      rowNumber: number,
      columnNumber: number,
      residentName: string,
      colorStatus?: ColorStatus,
    ) => {
      try {
        // If residentName is empty, the PUT endpoint will handle deletion automatically
        const response = await fetch("/api/toewijzingen/grid", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            row_number: rowNumber,
            column_number: columnNumber,
            resident_name: residentName || "", // Ensure it's a string
            color_status: colorStatus,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to save grid data to database:", errorText);
          throw new Error(
            `Failed to save: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        console.log("Grid data processed successfully:", data);
        return data;
      } catch (error) {
        console.error("Error saving grid data to database:", error);
        throw error; // Re-throw to allow caller to handle
      }
    },
    [],
  );

  const persistResidentCells = useCallback(
    async (cells: CellData, colors: CellColorData) => {
      const pending: Array<Promise<any>> = [];

      for (let row = RESIDENT_ROW_MIN; row <= RESIDENT_ROW_MAX; row++) {
        for (let column = IB_COLUMN_MIN; column <= IB_COLUMN_MAX; column++) {
          const cellKey = `${row}-${column}`;
          const rawName = cells[cellKey];
          const residentName =
            typeof rawName === "string" ? rawName.trim() : "";
          const color = colors[cellKey] ?? null;

          pending.push(
            saveGridData(row, column, residentName, color).catch((error) => {
              console.warn(`Failed to persist cell ${cellKey}:`, error);
              // Don't fail the whole batch if one cell fails
            }),
          );

          if (pending.length >= 10) {
            await Promise.allSettled(pending);
            pending.length = 0;
          }
        }
      }

      if (pending.length > 0) {
        await Promise.allSettled(pending);
      }
    },
    [saveGridData],
  );

  const loadData = useCallback(async () => {
    const defaultCellData: CellData = {
      // Initialize backup row with default values
      "15-1": "Kris B",
      "15-2": "Torben",
      "15-3": "Didar",
      "15-4": "Dorien",
      "15-5": "Evelien",
      "15-6": "Yasmina",
      "15-7": "Imane",
      "15-8": "Kirsten",
      "15-9": "Monica",
    };
    const fallbackStaff = Object.entries(DEFAULT_IB_NAMES).map(
      ([position, name]) => ({
        position: Number(position),
        name,
      }),
    );

    try {
      let staff: StaffMember[] = [];
      try {
        const staffResponse = await fetch("/api/toewijzingen/staff");
        if (staffResponse.ok) {
          const staffData = await staffResponse.json();
          if (Array.isArray(staffData)) {
            staff = staffData;
          }
        }
      } catch (error) {
        console.warn("Failed to load staff data from API, using defaults");
      }

      if (staff.length === 0) {
        staff = fallbackStaff;
      }
      setStaffData(staff);

      let cellDataMap: CellData = {};
      let cellColorMap: CellColorData = {};

      try {
        const gridResponse = await fetch("/api/toewijzingen/grid");
        if (gridResponse.ok) {
          const grid = await gridResponse.json();
          if (Array.isArray(grid)) {
            const dbCellData: CellData = {};
            const dbCellColors: CellColorData = {};
            grid.forEach((item: GridData) => {
              const cellKey = `${item.row_number}-${item.column_number}`;
              const name =
                typeof item.resident_name === "string"
                  ? item.resident_name
                  : "";
              dbCellData[cellKey] = name;
              if (item.color_status) {
                dbCellColors[cellKey] = item.color_status;
              }
            });
            cellDataMap =
              Object.keys(dbCellData).length === 0
                ? { ...defaultCellData }
                : dbCellData;
            cellColorMap = dbCellColors;
          }
        }
      } catch (error) {
        console.warn("Failed to load grid data from API, using defaults");
        cellDataMap = { ...defaultCellData };
        cellColorMap = {};
      }

      if (Object.keys(cellDataMap).length === 0) {
        cellDataMap = { ...defaultCellData };
      }

      setCellData(cellDataMap);
      setCellColors(cellColorMap);

      await persistResidentCells(cellDataMap, cellColorMap);

      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setStaffData(fallbackStaff);
      const fallbackCellData = { ...defaultCellData };
      setCellData(fallbackCellData);
      setCellColors({});
      await persistResidentCells(fallbackCellData, {});
      setLoading(false);
    }
  }, [persistResidentCells]);

  // Load data from database on mount
  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleColorChange = async (cellId: string, color: ColorStatus) => {
    const [rowStr, colStr] = cellId.split("-");
    const rowNumber = parseInt(rowStr);
    const columnNumber = parseInt(colStr);

    // Update local state
    if (color === null) {
      setCellColors((prev) => {
        const newColors = { ...prev };
        delete newColors[cellId];
        return newColors;
      });
    } else {
      setCellColors((prev) => {
        const newColors = { ...prev, [cellId]: color };
        return newColors;
      });
    }

    // Save to database - always save color status, even for empty cells
    const residentName = cellData[cellId] || "";
    await saveGridData(rowNumber, columnNumber, residentName, color);

    setShowColorMenu(null);
  };

  const saveAllStaffData = async () => {
    const defaultStaff = [
      { position: 1, name: "Kris B" },
      { position: 2, name: "Torben" },
      { position: 3, name: "Didar" },
      { position: 4, name: "Dorien" },
      { position: 5, name: "Evelien" },
      { position: 6, name: "Yasmina" },
      { position: 7, name: "Imane" },
      { position: 8, name: "Kirsten" },
      { position: 9, name: "Monica" },
    ];

    for (const staff of defaultStaff) {
      try {
        await fetch("/api/toewijzingen/staff", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(staff),
        });
      } catch (error) {
        console.error("Error saving staff:", staff.name, error);
      }
    }
  };

  const saveAllGridData = async () => {
    for (const [cellKey, residentName] of Object.entries(cellData)) {
      if (residentName && residentName.trim() !== "") {
        const [rowStr, colStr] = cellKey.split("-");
        const rowNumber = parseInt(rowStr);
        const columnNumber = parseInt(colStr);

        try {
          await fetch("/api/toewijzingen/grid", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              row_number: rowNumber,
              column_number: columnNumber,
              resident_name: residentName,
            }),
          });
        } catch (error) {
          console.error("Error saving grid data:", cellKey, error);
        }
      }
    }
  };

  const setupDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/toewijzingen/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        alert("Database setup succesvol voltooid!");
        // Reload data after setup
        await loadData();
      } else {
        console.error("Setup error:", result);
        alert("Database setup mislukt. Controleer de console voor details.");
      }
    } catch (error) {
      console.error("Error setting up database:", error);
      alert("Fout bij het instellen van database. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async (event: ClipboardEvent) => {
    event.preventDefault();

    try {
      const clipboardData = event.clipboardData?.getData("text/plain");
      if (!clipboardData) return;

      // Parse clipboard data (assuming tab-separated values like from Excel/Sheets)
      const rows = clipboardData.trim().split("\n");
      const pastedData: CellData = {};

      rows.forEach((row, rowIndex) => {
        const cells = row.split("\t"); // Tab-separated
        cells.forEach((cellValue, colIndex) => {
          if (cellValue.trim()) {
            // Start pasting from row 3 (index 3) and column 1 (index 1) - the resident area
            const targetRow = rowIndex + 3; // Start from row 3 (number 1)
            const targetCol = colIndex + 1; // Start from column 1 (Kris B column)

            // Only paste in valid areas (rows 3-13, columns 1-9) or backup rows (rows 15-17, columns 0-9)
            if (
              (targetRow >= 3 &&
                targetRow <= 13 &&
                targetCol >= 1 &&
                targetCol <= 9) ||
              ((targetRow === 15 || targetRow === 16 || targetRow === 17) &&
                targetCol >= 0 &&
                targetCol <= 9)
            ) {
              const cellKey = `${targetRow}-${targetCol}`;
              pastedData[cellKey] = cellValue.trim();
            }
          }
        });
      });

      // Update state with pasted data
      setCellData((prev) => ({
        ...prev,
        ...pastedData,
      }));

      // Save pasted data to database
      for (const [cellKey, residentName] of Object.entries(pastedData)) {
        const [rowStr, colStr] = cellKey.split("-");
        const rowNumber = parseInt(rowStr);
        const columnNumber = parseInt(colStr);
        // Preserve existing color when pasting
        const existingColor = cellColors[cellKey] ?? undefined;
        await saveGridData(
          rowNumber,
          columnNumber,
          residentName,
          existingColor,
        );

        if (
          rowNumber >= RESIDENT_ROW_MIN &&
          rowNumber <= RESIDENT_ROW_MAX &&
          columnNumber >= IB_COLUMN_MIN &&
          columnNumber <= IB_COLUMN_MAX
        ) {
          const trimmedName = residentName.trim();
          const ibName = resolveIbNameForColumn(columnNumber);
          if (trimmedName && ibName) {
            updateResidentsReferent(columnNumber, ibName, trimmedName);
          }
        }
      }

      alert(`${Object.keys(pastedData).length} cellen succesvol geplakt!`);
    } catch (error) {
      console.error("Error pasting data:", error);
      alert("Fout bij het plakken van gegevens. Probeer het opnieuw.");
    }
  };

  // Count residents for each column
  const getResidentCount = (columnIndex: number) => {
    let count = 0;
    for (let row = 3; row <= 13; row++) {
      // rows 4-14 (numbers 1-11)
      const cellKey = `${row}-${columnIndex}`;
      if (cellData[cellKey] && cellData[cellKey].trim() !== "") {
        count++;
      }
    }
    return count;
  };

  const handleCellClick = (
    e: React.MouseEvent,
    cellId: string,
    currentValue: string,
  ) => {
    // Handle multi-selection with Ctrl/Cmd key
    if (e.ctrlKey || e.metaKey) {
      setSelectedCells((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(cellId)) {
          newSet.delete(cellId);
        } else {
          newSet.add(cellId);
        }
        return newSet;
      });
    } else if (e.shiftKey && selectionStart) {
      // Handle range selection with Shift key
      const [startRow, startCol] = selectionStart.split("-").map(Number);
      const [endRow, endCol] = cellId.split("-").map(Number);
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);

      const newSelection = new Set<string>();
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          // Only select valid cells (resident cells and backup rows)
          if (
            (row >= 3 && row <= 13 && col >= 1 && col <= 9) ||
            ((row === 15 || row === 16 || row === 17) && col >= 0 && col <= 9)
          ) {
            newSelection.add(`${row}-${col}`);
          }
        }
      }
      setSelectedCells(newSelection);
    } else {
      // Regular click - start editing or set as selection start
      setEditingCell(cellId);
      setTempValue(currentValue);
      setSelectedCells(new Set());
      setSelectionStart(cellId);
    }
  };

  const clearSelectedCells = async () => {
    if (selectedCells.size === 0) return;

    const selectedCellsArray = Array.from(selectedCells);
    const confirmMessage = `${selectedCellsArray.length} geselecteerde cellen wissen?`;
    if (!confirm(confirmMessage)) return;

    setLoading(true);
    try {
      // Clear selected cells from database and local state
      for (const cellId of selectedCellsArray) {
        const [rowStr, colStr] = cellId.split("-");
        const rowNumber = parseInt(rowStr);
        const columnNumber = parseInt(colStr);

        // Clear from database
        await saveGridData(rowNumber, columnNumber, "", undefined);
      }

      // Clear local state
      setCellData((prev) => {
        const newData = { ...prev };
        selectedCellsArray.forEach((cellId) => {
          delete newData[cellId];
        });
        return newData;
      });

      // Clear colors for selected cells
      setCellColors((prev) => {
        const newColors = { ...prev };
        selectedCellsArray.forEach((cellId) => {
          delete newColors[cellId];
        });
        return newColors;
      });

      // Clear selection
      setSelectedCells(new Set());
      
      alert(`${selectedCellsArray.length} geselecteerde cellen succesvol gewist!`);
    } catch (error) {
      console.error("Error clearing selected cells:", error);
      alert("Fout bij het wissen van geselecteerde cellen. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const clearAllCells = async () => {
    const residentCells: string[] = [];
    const allColoredCells: string[] = [];

    // Include resident cells (rows 3-13, columns 1-9)
    for (let row = 3; row <= 13; row++) {
      for (let col = 1; col <= 9; col++) {
        const cellKey = `${row}-${col}`;
        if (cellData[cellKey] && cellData[cellKey].trim() !== "") {
          residentCells.push(cellKey);
        }
        // Also track colored cells even if they don't have content
        if (cellColors[cellKey]) {
          allColoredCells.push(cellKey);
        }
      }
    }
    // Include backup row cells (rows 15-17, columns 0-9)
    for (let row = 15; row <= 17; row++) {
      for (let col = 0; col <= 9; col++) {
        const cellKey = `${row}-${col}`;
        if (cellData[cellKey] && cellData[cellKey].trim() !== "") {
          residentCells.push(cellKey);
        }
        // Also track colored cells even if they don't have content
        if (cellColors[cellKey]) {
          allColoredCells.push(cellKey);
        }
      }
    }

    if (residentCells.length === 0 && allColoredCells.length === 0) {
      alert("Geen gegevens of kleuren om te wissen.");
      return;
    }

    const confirmMessage = `ALLE ${residentCells.length} bewonerstoewijzingen en ${allColoredCells.length} celkleuren wissen? Dit kan niet ongedaan worden gemaakt!`;
    if (!confirm(confirmMessage)) return;

    setLoading(true);
    try {
      // Clear all resident cells from database first
      for (const cellId of residentCells) {
        const [rowStr, colStr] = cellId.split("-");
        const rowNumber = parseInt(rowStr);
        const columnNumber = parseInt(colStr);

        // Delete from database by sending empty string (API will handle deletion)
        await saveGridData(rowNumber, columnNumber, "", undefined);
      }

      // Clear local state after database operations
      setCellData((prev) => {
        const newData = { ...prev };
        residentCells.forEach((cellId) => {
          delete newData[cellId];
        });
        return newData;
      });

      // Clear all colors (both for cells with content and without)
      const clearedColors: CellColorData = {};
      setCellColors(clearedColors);

      setSelectedCells(new Set());
      alert(
        `${residentCells.length} cellen en ${allColoredCells.length} kleuren succesvol gewist!`,
      );
    } catch (error) {
      console.error("Error clearing all cells:", error);
      alert("Fout bij het wissen van cellen. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempValue(e.target.value);
  };

  const handleStaffCellClick = (position: number, currentName: string) => {
    setEditingCell(`staff-${position}`);
    setTempValue(currentName);
  };

  const handleStaffCellBlur = async (position: number) => {
    // Update local state immediately
    setStaffData((prev) => {
      const existing = prev.find((s) => s.position === position);
      if (existing) {
        return prev.map((s) =>
          s.position === position ? { ...s, name: tempValue } : s,
        );
      } else {
        return [...prev, { position, name: tempValue }];
      }
    });

    // Save to database
    try {
      console.log(`Saving staff position ${position}: name="${tempValue}"`);
      const response = await fetch("/api/toewijzingen/staff", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          position,
          name: tempValue,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save staff: ${response.statusText}`);
      }

      console.log(`Successfully saved staff position ${position}`);
    } catch (error) {
      console.error(`Failed to save staff position ${position}:`, error);
      alert(`Fout bij het opslaan van personeelsnaam. Probeer het opnieuw.`);
    }

    setEditingCell(null);
    setTempValue("");
  };

  const handleStaffKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    position: number,
  ) => {
    if (e.key === "Enter") {
      handleStaffCellBlur(position);
    }
    if (e.key === "Escape") {
      setEditingCell(null);
      setTempValue("");
    }
  };

  const addNewRow = () => {
    setMaxRow((prev) => prev + 1);
    // The new row will be empty initially, cells will be saved when edited
    console.log(`Added new row: ${maxRow + 1}`);
  };

  const addNewColumn = async () => {
    const newColumnNumber = maxColumn + 1;
    setMaxColumn(newColumnNumber);

    // Add a default staff member for the new column
    const defaultStaffName = `IB ${newColumnNumber}`;
    setStaffData((prev) => [
      ...prev,
      { position: newColumnNumber, name: defaultStaffName },
    ]);

    // Save the new staff member to database
    try {
      await fetch("/api/toewijzingen/staff", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          position: newColumnNumber,
          name: defaultStaffName,
        }),
      });
      console.log(
        `Added new column ${newColumnNumber} with staff: ${defaultStaffName}`,
      );
    } catch (error) {
      console.error("Error adding new column:", error);
    }
  };

  const handleCellBlur = async (cellId: string) => {
    const [rowStr, colStr] = cellId.split("-");
    const rowNumber = parseInt(rowStr);
    const columnNumber = parseInt(colStr);

    // Update local state immediately
    setCellData((prev) => ({
      ...prev,
      [cellId]: tempValue,
    }));

    // Save to database with current color
    const currentColor = cellColors[cellId] || null;

    // Await the save to ensure it completes
    try {
      console.log(
        `Saving cell ${cellId}: row=${rowNumber}, col=${columnNumber}, value="${tempValue}"`,
      );
      await saveGridData(rowNumber, columnNumber, tempValue, currentColor);
      console.log(`Successfully saved cell ${cellId} to database`);
    } catch (error) {
      console.error(`Failed to save cell ${cellId}:`, error);
      alert(`Fout bij het opslaan van celgegevens. Probeer het opnieuw.`);
    }

    const trimmedValue = tempValue.trim();
    const isResidentAssignmentCell =
      rowNumber >= RESIDENT_ROW_MIN &&
      rowNumber <= RESIDENT_ROW_MAX &&
      columnNumber >= IB_COLUMN_MIN &&
      columnNumber <= IB_COLUMN_MAX;

    if (isResidentAssignmentCell && trimmedValue) {
      const ibName = resolveIbNameForColumn(columnNumber);
      if (ibName) {
        console.log(
          `Assigning IB "${ibName}" to resident "${trimmedValue}" in column ${columnNumber}`,
        );
        updateResidentsReferent(columnNumber, ibName, trimmedValue);
      } else {
        console.warn(
          `No IB name found for column ${columnNumber}; skipping referent update for "${trimmedValue}"`,
        );
      }
    }

    setEditingCell(null);
    setTempValue("");
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    cellId: string,
  ) => {
    if (e.key === "Enter") {
      handleCellBlur(cellId);
    }
    if (e.key === "Escape") {
      setEditingCell(null);
      setTempValue("");
    }
  };

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON - expecting exactly 11 rows x 9 columns of resident data
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "", // Default value for empty cells
          blankrows: false,
          raw: false,
        });

        console.log("Excel data loaded:", jsonData);

        // Process the Excel data - expecting 11 rows x 9 columns
        // Map to grid: rows 3-13 (11 rows), columns 2-10 (9 columns) - using Excel columns 0-8
        const importedCellData: CellData = {};

        // Process exactly 11 rows of resident data
        for (
          let rowIndex = 0;
          rowIndex < Math.min(11, jsonData.length);
          rowIndex++
        ) {
          const row = jsonData[rowIndex] as string[];
          if (row && Array.isArray(row)) {
            // Process columns 0-8 (take columns 0-8 to include Kris B starting from Excel column A)
            for (
              let colIndex = 0;
              colIndex < Math.min(9, row.length);
              colIndex++
            ) {
              const cellValue = row[colIndex];
              if (
                cellValue &&
                typeof cellValue === "string" &&
                cellValue.trim().length > 0
              ) {
                // Map Excel coordinates to grid coordinates:
                // Excel row 0-10 → Grid row 3-13 (resident rows starting from number 1)
                // Excel col 0-8 → Grid col 1-9 (staff columns, Excel col 0 maps to Kris B at grid col 1)
                const gridRow = rowIndex + 3; // Start from row 3 (row with number 1)
                const gridCol = colIndex + 1; // Excel col 0→1, 1→2, ..., 8→9

                const cellKey = `${gridRow}-${gridCol}`;
                importedCellData[cellKey] = cellValue.trim();
              }
            }
          }
        }

        // Update state with imported data
        setCellData((prev) => ({
          ...prev,
          ...importedCellData,
        }));

        // Save imported data to database
        setLoading(true);
        try {
          // Save grid data
          for (const [cellKey, residentName] of Object.entries(
            importedCellData,
          )) {
            const [rowStr, colStr] = cellKey.split("-");
            const rowNumber = parseInt(rowStr);
            const columnNumber = parseInt(colStr);
            await saveGridData(
              rowNumber,
              columnNumber,
              residentName,
              undefined,
            );

            if (
              rowNumber >= RESIDENT_ROW_MIN &&
              rowNumber <= RESIDENT_ROW_MAX &&
              columnNumber >= IB_COLUMN_MIN &&
              columnNumber <= IB_COLUMN_MAX
            ) {
              const trimmedName = residentName.trim();
              const ibName = resolveIbNameForColumn(columnNumber);
              if (trimmedName && ibName) {
                updateResidentsReferent(columnNumber, ibName, trimmedName);
              }
            }
          }

          alert(
            `${Object.keys(importedCellData).length} bewonerstoewijzingen succesvol geïmporteerd!`,
          );
        } catch (error) {
          console.error("Error saving imported data:", error);
          alert(
            "Gegevens lokaal geïmporteerd maar opslaan in database mislukt. Gegevens zijn nog steeds zichtbaar.",
          );
        } finally {
          setLoading(false);
        }

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Fout bij lezen Excel bestand:", error);
        alert(
          "Fout bij lezen Excel bestand. Controleer het bestandsformaat en probeer opnieuw.",
        );
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    // Create template data for 11 rows x 9 columns
    // Format: Columns A-I are for resident data (mapping to grid columns 1-9, column A maps to Kris B)
    const templateData = [
      // Row 1 - Maps to grid row 3 (number 1) - Column A maps to Kris B
      [
        "Voorbeeld Bewoner 1",
        "",
        "Voorbeeld Bewoner 2",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      // Row 2 - Maps to grid row 4 (number 2)
      [
        "",
        "Voorbeeld Bewoner 3",
        "",
        "",
        "Voorbeeld Bewoner 4",
        "",
        "",
        "",
        "",
      ],
      // Row 3 - Maps to grid row 5 (number 3)
      ["", "", "", "", "", "Voorbeeld Bewoner 5", "", "", ""],
      // Row 4 - Maps to grid row 6 (number 4)
      ["", "", "", "", "", "", "", "", ""],
      // Row 5 - Maps to grid row 7 (number 5)
      ["", "", "", "", "", "", "", "", ""],
      // Row 6 - Maps to grid row 8 (number 6)
      ["", "", "", "", "", "", "", "", ""],
      // Row 7 - Maps to grid row 9 (number 7)
      ["", "", "", "", "", "", "", "", ""],
      // Row 8 - Maps to grid row 10 (number 8)
      ["", "", "", "", "", "", "", "", ""],
      // Row 9 - Maps to grid row 11 (number 9)
      ["", "", "", "", "", "", "", "", ""],
      // Row 10 - Maps to grid row 12 (number 10)
      ["", "", "", "", "", "", "", "", ""],
      // Row 11 - Maps to grid row 13 (number 11)
      ["", "", "", "", "", "", "", "", ""],
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Toewijzingen");

    // Save the file
    XLSX.writeFile(wb, "toewijzingen_template_11x9.xlsx");
  };

  const getStaffName = (position: number) => {
    const staff = staffData.find((s) => s.position === position);
    return staff?.name || "";
  };

  const resolveIbNameForColumn = (columnNumber: number) => {
    const configuredName = getStaffName(columnNumber);
    if (configuredName && configuredName.trim().length > 0) {
      return configuredName;
    }
    return DEFAULT_IB_NAMES[columnNumber] || "";
  };

  // Function to update a resident's referencePerson based on IB assignment
  const updateResidentsReferent = (
    columnNumber: number,
    ibName: string,
    residentName: string,
  ) => {
    try {
      if (!Array.isArray(dataMatchIt) || dataMatchIt.length === 0) {
        console.warn(
          "No residents loaded when attempting to update referent; skipping.",
        );
        return;
      }

      const updatedResidents = dataMatchIt.map((resident: any) => {
        const residentFullName =
          `${resident.firstName || ""} ${resident.lastName || ""}`.trim();
        if (residentFullName === residentName.trim()) {
          return {
            ...resident,
            referencePerson: ibName,
          };
        }
        return resident;
      });

      const changedResident = updatedResidents.find(
        (r: any) =>
          `${r.firstName || ""} ${r.lastName || ""}`.trim() ===
            residentName.trim() && r.referencePerson === ibName,
      );

      if (changedResident) {
        updateInDataMatchIt(updatedResidents);
      }
    } catch (error) {
      console.error(
        `Error updating referent for resident "${residentName}" to IB "${ibName}":`,
        error,
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <a
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              ← Back to Dashboard
            </a>
            <h1 className="text-2xl font-bold">Toewijzingen</h1>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Laden...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              ← Back to Dashboard
            </a>
            <h1 className="text-2xl font-bold">Toewijzingen</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={clearSelectedCells}
              disabled={loading || selectedCells.size === 0}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              Clear Selected ({selectedCells.size})
            </button>
            <button
              onClick={clearAllCells}
              disabled={loading}
              className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Alle bewonerstoewijzingen wissen"
            >
              <Trash2 className="h-4 w-4" />
              Alles Wissen
            </button>
            <button
              onClick={addNewRow}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Nieuwe rij toevoegen"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Rij Toevoegen
            </button>
            <button
              onClick={addNewColumn}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Nieuwe kolom toevoegen"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Kolom Toevoegen
            </button>
            <button
              onClick={downloadTemplate}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Sjabloon
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title="Excel-bestand importeren (11 rijen x 9 kolommen - gebruikt kolommen A-I, wordt toegewezen aan rasterrijen 3-13, kolommen 1-9)"
            >
              <Upload className="h-4 w-4" />
              Excel Importeren (11x9)
            </button>
            <button
              onClick={setupDatabase}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Instellen..." : "Database Instellen"}
            </button>
          </div>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden toewijzingen-container pb-16"
          tabIndex={0}
        >
          <table className="border-collapse table-auto">
            <tbody>
              {Array.from({ length: maxRow + 5 }, (_, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-b-2 border-gray-500 dark:border-gray-400 ${
                    rowIndex === 2 ? "bg-blue-50 dark:bg-blue-950/30" : ""
                  }`}
                >
                  {rowIndex === 14 ? (
                    <td
                      colSpan={10}
                      className="border-2 border-gray-500 dark:border-gray-400 p-4 text-center bg-gray-100 dark:bg-gray-700"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold">Backups</span>
                        <button
                          onClick={async () => {
                            console.log(
                              "Clear all backup cells button clicked",
                            );

                            // Clear local state for backup rows (rows 15-17)
                            const newCellData = { ...cellData };
                            const newCellColors = { ...cellColors };
                            for (let row = 15; row <= 17; row++) {
                              for (let col = 0; col <= 9; col++) {
                                delete newCellData[`${row}-${col}`];
                                delete newCellColors[`${row}-${col}`];
                              }
                            }
                            setCellData(newCellData);
                            setCellColors(newCellColors);
                            console.log(
                              "UI state cleared for all backup cells",
                            );

                            // Clear from database
                            try {
                              const clearPromises = [];
                              for (let row = 15; row <= 17; row++) {
                                for (let col = 0; col <= 9; col++) {
                                  clearPromises.push(
                                    saveGridData(row, col, "", undefined),
                                  );
                                }
                              }
                              await Promise.all(clearPromises);
                              console.log(
                                "Successfully cleared all backup cells from database",
                              );
                            } catch (error) {
                              console.warn(
                                "Some backup cells may not have been cleared from database:",
                                error,
                              );
                            }
                          }}
                          className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded text-red-600 dark:text-red-400"
                          title="Alle backup cellen wissen"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  ) : (
                    Array.from({ length: maxColumn + 1 }, (_, colIndex) => {
                      const cellId = `${rowIndex}-${colIndex}`;
                      const cellValue = cellData[cellId] || "";
                      const isSelected = selectedCells.has(cellId);
                      const cellColor = cellColors[cellId];
                      const staffName = getStaffName(colIndex);

                      return (
                        <td
                          key={colIndex}
                          className="border-2 border-gray-500 dark:border-gray-400 dark:bg-gray-800 p-2 min-h-[60px] whitespace-nowrap"
                        >
                          {/* Header rows */}
                          {rowIndex === 0 && colIndex === 0 ? (
                            <div className="text-center font-bold">
                              <span className="font-bold">Verlof</span>
                            </div>
                          ) : rowIndex === 1 && colIndex === 0 ? (
                            <div className="text-center font-semibold">
                              <span className="font-bold">Aantal:</span>
                            </div>
                          ) : rowIndex === 2 && colIndex === 0 ? (
                            <div className="text-center font-bold">
                              <span className="font-bold">IB's</span>
                            </div>
                          ) : (
                            // Display cells based on their position
                            <>
                              {/* Row numbers on the left */}
                              {colIndex === 0 &&
                              rowIndex >= 3 &&
                              rowIndex <= 13 ? (
                                <div className="text-center font-bold">
                                  {rowIndex - 2}
                                </div>
                              ) : null}

                              {/* Weekend/Vakantie labels */}
                              {rowIndex === 0 &&
                              colIndex >= 1 &&
                              colIndex <= 9 ? (
                                <div className="text-center font-bold">
                                  {colIndex <= 7 ? "Weekend" : "Vakantie"}
                                </div>
                              ) : null}

                              {/* Resident count row */}
                              {rowIndex === 1 &&
                              colIndex >= 1 &&
                              colIndex <= 9 ? (
                                <div className="text-center font-semibold">
                                  {getResidentCount(colIndex)}
                                </div>
                              ) : null}

                              {/* Staff row */}
                              {rowIndex === 2 &&
                              colIndex >= 1 &&
                              colIndex <= 9 ? (
                                <div className="text-center">
                                  {editingCell === `staff-${colIndex}` ? (
                                    <input
                                      type="text"
                                      value={tempValue}
                                      onChange={handleCellChange}
                                      onBlur={() =>
                                        handleStaffCellBlur(colIndex)
                                      }
                                      onKeyDown={(e) =>
                                        handleStaffKeyDown(e, colIndex)
                                      }
                                      className="w-full p-1 text-sm font-bold border-0 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                      autoFocus
                                    />
                                  ) : (
                                    <div
                                      className="cursor-pointer p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 font-bold"
                                      onClick={() =>
                                        handleStaffCellClick(
                                          colIndex,
                                          staffName,
                                        )
                                      }
                                      title="Klik om personeelsnaam te bewerken"
                                    >
                                      {staffName}
                                    </div>
                                  )}
                                </div>
                              ) : null}

                              {/* Resident cells (rows 3-13, columns 1-9) */}
                              {rowIndex >= 3 &&
                              rowIndex <= 13 &&
                              colIndex >= 1 &&
                              colIndex <= 9 ? (
                                <div className="relative">
                                  {/* Determine background color based on status */}
                                  {(() => {
                                    let bgColor = "";
                                    if (cellColor === "red") {
                                      bgColor = "bg-red-900 text-white";
                                    } else if (cellColor === "blue") {
                                      bgColor = "bg-blue-900 text-white";
                                    } else if (cellColor === "gray") {
                                      bgColor = "bg-gray-900 text-white";
                                    }

                                    return editingCell === cellId ? (
                                      <input
                                        type="text"
                                        value={tempValue}
                                        onChange={handleCellChange}
                                        onBlur={() => handleCellBlur(cellId)}
                                        onKeyDown={(e) =>
                                          handleKeyDown(e, cellId)
                                        }
                                        className="w-full p-1 text-sm border-0 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        autoFocus
                                      />
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <div
                                          className={`flex-1 min-h-[20px] cursor-pointer p-1 rounded whitespace-pre-wrap transition-colors ${
                                            isSelected
                                              ? "border-2 border-blue-500"
                                              : ""
                                          } ${
                                            bgColor ||
                                            "hover:bg-gray-100 dark:hover:bg-gray-700"
                                          } ${!bgColor ? "dark:text-white" : ""}`}
                                          onClick={(e) =>
                                            handleCellClick(
                                              e,
                                              cellId,
                                              cellValue,
                                            )
                                          }
                                          title={
                                            cellValue ||
                                            "Click to edit resident"
                                          }
                                        >
                                          {cellValue}
                                        </div>
                                        {cellValue && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setShowColorMenu(
                                                showColorMenu === cellId
                                                  ? null
                                                  : cellId,
                                              );
                                            }}
                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded dark:text-white"
                                            title="Kleurstatus instellen"
                                          >
                                            <Palette className="h-3 w-3" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* Color menu dropdown */}
                                  {showColorMenu === cellId && (
                                    <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-500 dark:border-gray-400 rounded shadow-lg p-2">
                                      <div className="text-xs font-semibold mb-1">
                                        Status:
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, "red")
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 bg-red-500 rounded"></span>
                                        Volwassen (Meerderjarig)
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, "blue")
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 bg-blue-500 rounded"></span>
                                        Transfer
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, "gray")
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 bg-gray-500 rounded"></span>
                                        Leeftijdstwijfel
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, null)
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 border border-gray-400 rounded"></span>
                                        Status wissen
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : null}

                              {/* Backup cells (rows 15-17, columns 0-9) */}
                              {(rowIndex === 15 ||
                                rowIndex === 16 ||
                                rowIndex === 17) &&
                              colIndex >= 0 &&
                              colIndex <= 9 ? (
                                <div className="relative">
                                  {(() => {
                                    // Determine background color based on status
                                    let bgColor = "";
                                    if (cellColor === "red") {
                                      bgColor = "bg-red-900 text-white";
                                    } else if (cellColor === "blue") {
                                      bgColor = "bg-blue-900 text-white";
                                    } else if (cellColor === "gray") {
                                      bgColor = "bg-gray-900 text-white";
                                    }

                                    return editingCell === cellId ? (
                                      <input
                                        type="text"
                                        value={tempValue}
                                        onChange={handleCellChange}
                                        onBlur={() => handleCellBlur(cellId)}
                                        onKeyDown={(e) =>
                                          handleKeyDown(e, cellId)
                                        }
                                        className="w-full p-1 text-sm border-0 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        autoFocus
                                      />
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <div
                                          className={`flex-1 min-h-[20px] cursor-pointer p-1 rounded whitespace-pre-wrap transition-colors ${
                                            isSelected
                                              ? "border-2 border-blue-500"
                                              : ""
                                          } ${
                                            bgColor ||
                                            "hover:bg-gray-100 dark:hover:bg-gray-700"
                                          } ${!bgColor ? "dark:text-white" : ""}`}
                                          onClick={(e) =>
                                            handleCellClick(
                                              e,
                                              cellId,
                                              cellValue,
                                            )
                                          }
                                          title={
                                            cellValue ||
                                            "Click to edit backup cell"
                                          }
                                        >
                                          {cellValue}
                                        </div>
                                        {cellValue && (
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              console.log(
                                                "Delete button clicked for cell:",
                                                cellId,
                                              );
                                              setCellData((prev) => {
                                                const newData = { ...prev };
                                                delete newData[cellId];
                                                return newData;
                                              });
                                              setCellColors((prev) => {
                                                const newColors = { ...prev };
                                                delete newColors[cellId];
                                                return newColors;
                                              });
                                              const [rowStr, colStr] =
                                                cellId.split("-");
                                              const rowNumber =
                                                parseInt(rowStr);
                                              const columnNumber =
                                                parseInt(colStr);
                                              try {
                                                await saveGridData(
                                                  rowNumber,
                                                  columnNumber,
                                                  "",
                                                  undefined,
                                                );
                                                console.log(
                                                  "Successfully cleared cell from database:",
                                                  cellId,
                                                );
                                              } catch (error) {
                                                console.warn(
                                                  "Failed to clear cell from database:",
                                                  cellId,
                                                  error,
                                                );
                                              }
                                            }}
                                            className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded text-red-600 dark:text-red-400"
                                            title="Celinhoud verwijderen"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* Color menu dropdown */}
                                  {showColorMenu === cellId && (
                                    <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-500 dark:border-gray-400 rounded shadow-lg p-2">
                                      <div className="text-xs font-semibold mb-1">
                                        Status:
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, "red")
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 bg-red-500 rounded"></span>
                                        Volwassen (Meerderjarig)
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, "blue")
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 bg-blue-500 rounded"></span>
                                        Transfer
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, "gray")
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 bg-gray-500 rounded"></span>
                                        Leeftijdstwijfel
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, null)
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 border border-gray-400 rounded"></span>
                                        Status wissen
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </>
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hidden file input for Excel import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleExcelImport}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
};

export default Toewijzingen;
