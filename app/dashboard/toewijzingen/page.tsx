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
  const { dataMatchIt, updateInDataMatchIt, refreshResidents } = useData();
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
      // Load staff and grid data in parallel for better performance
      const [staffResponse, gridResponse] = await Promise.all([
        fetch("/api/toewijzingen/staff").catch(() => null),
        fetch("/api/toewijzingen/grid").catch(() => null),
      ]);

      // Process staff data
      let staff: StaffMember[] = [];
      if (staffResponse && staffResponse.ok) {
        const staffData = await staffResponse.json();
        if (Array.isArray(staffData)) {
          staff = staffData;
        }
      }
      if (staff.length === 0) {
        staff = fallbackStaff;
      }
      setStaffData(staff);

      // Process grid data
      let cellDataMap: CellData = {};
      let cellColorMap: CellColorData = {};
      let needsInitialSetup = false;

      if (gridResponse && gridResponse.ok) {
        const grid = await gridResponse.json();
        if (Array.isArray(grid) && grid.length > 0) {
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
          cellDataMap = dbCellData;
          cellColorMap = dbCellColors;
        } else {
          // Database is empty, needs initial setup
          needsInitialSetup = true;
          cellDataMap = { ...defaultCellData };
        }
      } else {
        // API failed, use defaults and mark for setup
        needsInitialSetup = true;
        cellDataMap = { ...defaultCellData };
        cellColorMap = {};
      }

      setCellData(cellDataMap);
      setCellColors(cellColorMap);

      // Only persist to database if this is initial setup (database was empty)
      if (needsInitialSetup) {
        console.log("Initial setup detected, persisting default data...");
        await persistResidentCells(cellDataMap, cellColorMap);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setStaffData(fallbackStaff);
      const fallbackCellData = { ...defaultCellData };
      setCellData(fallbackCellData);
      setCellColors({});
      // Only persist on error if database needs setup
      setLoading(false);
    }
  }, [persistResidentCells]);

  // Load data from database on mount
  useEffect(() => {
    void loadData();
  }, []);  // Remove loadData dependency to prevent re-runs

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
            await updateResidentsReferent(columnNumber, ibName, trimmedName);
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

        // Clear referent assignment if this is a resident cell
        const isResidentCell = rowNumber >= 3 && rowNumber <= 13 && columnNumber >= 1 && columnNumber <= 9;
        if (isResidentCell && cellData[cellId]) {
          await clearResidentReferent(cellData[cellId]);
        }

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

        // Clear referent assignment if this is a resident cell
        const isResidentCell = rowNumber >= 3 && rowNumber <= 13 && columnNumber >= 1 && columnNumber <= 9;
        if (isResidentCell && cellData[cellId]) {
          await clearResidentReferent(cellData[cellId]);
        }

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

    // Get the old value before updating
    const oldValue = cellData[cellId] || "";
    const trimmedOldValue = oldValue.trim();
    const trimmedNewValue = tempValue.trim();

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

    const isResidentAssignmentCell =
      rowNumber >= RESIDENT_ROW_MIN &&
      rowNumber <= RESIDENT_ROW_MAX &&
      columnNumber >= IB_COLUMN_MIN &&
      columnNumber <= IB_COLUMN_MAX;

    if (isResidentAssignmentCell) {
      // Clear old referent if there was an old value and it's different from new value
      if (trimmedOldValue && trimmedOldValue !== trimmedNewValue) {
        console.log(`Clearing old referent for: "${trimmedOldValue}"`);
        await clearResidentReferent(trimmedOldValue);
      }

      // Assign new referent if there's a new value
      if (trimmedNewValue) {
        const ibName = resolveIbNameForColumn(columnNumber);
        if (ibName) {
          console.log(
            `Assigning IB "${ibName}" to resident "${trimmedNewValue}" in column ${columnNumber}`,
          );
          await updateResidentsReferent(columnNumber, ibName, trimmedNewValue);
        } else {
          console.warn(
            `No IB name found for column ${columnNumber}; skipping referent update for "${trimmedNewValue}"`,
          );
        }
      }
      
      // If new value is empty, clear referent for old value (if different from above case)
      else if (!trimmedNewValue && trimmedOldValue) {
        console.log(`Cell cleared, ensuring referent is cleared for: "${trimmedOldValue}"`);
        await clearResidentReferent(trimmedOldValue);
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
                await updateResidentsReferent(columnNumber, ibName, trimmedName);
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
  const updateResidentsReferent = async (
    columnNumber: number,
    ibName: string,
    residentName: string,
  ) => {
    try {
      // Always refresh residents data first to ensure we have the latest data
      console.log(`Refreshing residents data before assignment...`);
      await refreshResidents();
      
      // Get fresh data after refresh
      const freshData = dataMatchIt;
      
      if (!Array.isArray(freshData) || freshData.length === 0) {
        console.warn("No residents loaded after refresh; skipping referent update.");
        return;
      }

      const cleanResidentName = residentName.trim().toLowerCase();
      console.log(`Searching for resident: "${cleanResidentName}" to assign to IB: "${ibName}"`);
      console.log(`Fresh residents data loaded:`, freshData.length);
      
      // Also try to match by badge number if the resident name looks like a number
      const possibleBadgeNumber = parseInt(cleanResidentName);
      const isNumericSearch = !isNaN(possibleBadgeNumber) && cleanResidentName === possibleBadgeNumber.toString();

      let foundResident = null;
      
      for (const resident of freshData) {
        const residentFullName =
          `${resident.firstName || ""} ${resident.lastName || ""}`.trim().toLowerCase();
        
        // Try different name matching patterns
        const nameVariations = [
          residentFullName, // Full name
          `${resident.firstName || ""}`.trim().toLowerCase(), // First name only
          `${resident.lastName || ""}`.trim().toLowerCase(), // Last name only
          `${resident.lastName || ""} ${resident.firstName || ""}`.trim().toLowerCase(), // Last name first
        ].filter(name => name.length > 0);

        // Check name matching
        const nameMatch = nameVariations.some(variation => 
          variation === cleanResidentName || 
          cleanResidentName.includes(variation) || 
          variation.includes(cleanResidentName)
        );
        
        // Check badge number matching if it's a numeric search
        const badgeMatch = isNumericSearch && resident.badge === possibleBadgeNumber;
        
        const isMatch = nameMatch || badgeMatch;

        if (isMatch && resident.id) {
          foundResident = resident;
          console.log(`✓ Found match: "${residentFullName}" (ID: ${resident.id}) -> assigning referent: "${ibName}"`);
          break; // Exit loop after finding first match
        }
      }

      if (foundResident) {
        // Double-check that the resident still exists by verifying ID exists in fresh data
        const residentStillExists = freshData.some(r => r.id === foundResident.id);
        if (!residentStillExists) {
          console.log(`⚠️ Resident ${foundResident.id} found in cached data but not in fresh data. Skipping referent assignment.`);
          return;
        }

        try {
          await updateInDataMatchIt(foundResident.id, { referencePerson: ibName });
          console.log(`✅ Successfully assigned referent "${ibName}" to resident "${foundResident.firstName} ${foundResident.lastName}"`);
        } catch (error: any) {
          console.error(`❌ Failed to update resident ${foundResident.id}:`, error);
          
          // Check if this is a "resident not found" error
          if (error?.code === 'PGRST116' && error?.details === 'The result contains 0 rows') {
            console.log(`🗑️ Resident ${foundResident.id} no longer exists in database. Refreshing data to remove stale entries.`);
            // Trigger a data refresh to clean up stale entries
            await refreshResidents();
          } else {
            console.log(`This might indicate the resident was deleted or another database issue occurred.`);
            // Only re-throw for non-"not found" errors
            throw error;
          }
        }
      } else {
        console.warn(`❌ No resident found matching: "${residentName}"`);
        console.log(`Available residents:`, freshData.slice(0, 5).map(r => 
          `${r.firstName || ""} ${r.lastName || ""}`.trim()
        ).filter(name => name.length > 0));
      }
    } catch (error) {
      console.error(
        `Error updating referent for resident "${residentName}" to IB "${ibName}":`,
        error,
      );
    }
  };

  // Function to clear a resident's referencePerson when removed from assignment
  const clearResidentReferent = async (residentName: string) => {
    try {
      // Refresh data first to ensure accuracy
      console.log(`Refreshing residents data before clearing referent...`);
      await refreshResidents();
      
      const freshData = dataMatchIt;
      
      if (!Array.isArray(freshData) || freshData.length === 0) {
        return;
      }

      const cleanResidentName = residentName.trim().toLowerCase();
      console.log(`Clearing referent for resident: "${cleanResidentName}"`);

      let foundResident = null;
      
      for (const resident of freshData) {
        const residentFullName =
          `${resident.firstName || ""} ${resident.lastName || ""}`.trim().toLowerCase();
        
        // Try different name matching patterns
        const nameVariations = [
          residentFullName, // Full name
          `${resident.firstName || ""}`.trim().toLowerCase(), // First name only
          `${resident.lastName || ""}`.trim().toLowerCase(), // Last name only
          `${resident.lastName || ""} ${resident.firstName || ""}`.trim().toLowerCase(), // Last name first
        ].filter(name => name.length > 0);

        const isMatch = nameVariations.some(variation => 
          variation === cleanResidentName || 
          cleanResidentName.includes(variation) || 
          variation.includes(cleanResidentName)
        );

        if (isMatch && resident.id && resident.referencePerson) {
          foundResident = resident;
          console.log(`✓ Found resident to clear referent: "${residentFullName}" (ID: ${resident.id})`);
          break; // Exit loop after finding first match
        }
      }

      if (foundResident) {
        // Double-check that the resident still exists by verifying ID exists in fresh data
        const residentStillExists = freshData.some(r => r.id === foundResident.id);
        if (!residentStillExists) {
          console.log(`⚠️ Resident ${foundResident.id} found in cached data but not in fresh data. Skipping referent clearing.`);
          return;
        }

        try {
          await updateInDataMatchIt(foundResident.id, { referencePerson: null });
          console.log(`✅ Successfully cleared referent for resident "${foundResident.firstName} ${foundResident.lastName}"`);
        } catch (error: any) {
          console.error(`❌ Failed to clear referent for resident ${foundResident.id}:`, error);
          
          // Check if this is a "resident not found" error
          if (error?.code === 'PGRST116' && error?.details === 'The result contains 0 rows') {
            console.log(`🗑️ Resident ${foundResident.id} no longer exists in database. Refreshing data to remove stale entries.`);
            // Trigger a data refresh to clean up stale entries
            await refreshResidents();
          } else {
            console.log(`This might indicate the resident was deleted or another database issue occurred.`);
          }
        }
      } else {
        console.log(`ℹ️ No resident found with name "${residentName}" that has a referent to clear.`);
      }
    } catch (error) {
      console.error(`Error clearing referent for resident "${residentName}":`, error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-4 mb-6">
            <a
              href="/dashboard"
              className="px-3 py-2 sm:px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              ← <span className="hidden sm:inline">Back to Dashboard</span><span className="sm:hidden">Back</span>
            </a>
            <h1 className="text-xl sm:text-2xl font-bold">Toewijzingen</h1>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="text-base sm:text-lg">Laden...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-3 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="/dashboard"
              className="px-3 py-2 sm:px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              ← <span className="hidden sm:inline">Back to Dashboard</span><span className="sm:hidden">Back</span>
            </a>
            <h1 className="text-xl sm:text-2xl font-bold">Toewijzingen</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <ThemeToggle />
            <button
              onClick={clearSelectedCells}
              disabled={loading || selectedCells.size === 0}
              className="px-2 py-2 sm:px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Clear Selected ({selectedCells.size})</span>
              <span className="sm:hidden">Clear ({selectedCells.size})</span>
            </button>
            <button
              onClick={clearAllCells}
              disabled={loading}
              className="px-2 py-2 sm:px-4 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              title="Alle bewonerstoewijzingen wissen"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden md:inline">Alles Wissen</span>
            </button>
            <button
              onClick={addNewRow}
              disabled={loading}
              className="px-2 py-2 sm:px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              title="Nieuwe rij toevoegen"
            >
              <svg
                className="h-3 w-3 sm:h-4 sm:w-4"
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
              <span className="hidden lg:inline">Rij Toevoegen</span>
              <span className="lg:hidden">+Rij</span>
            </button>
            <button
              onClick={addNewColumn}
              disabled={loading}
              className="px-2 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              title="Nieuwe kolom toevoegen"
            >
              <svg
                className="h-3 w-3 sm:h-4 sm:w-4"
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
              <span className="hidden lg:inline">Kolom Toevoegen</span>
              <span className="lg:hidden">+Kol</span>
            </button>
            <button
              onClick={downloadTemplate}
              disabled={loading}
              className="px-2 py-2 sm:px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden md:inline">Sjabloon</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="px-2 py-2 sm:px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              title="Excel-bestand importeren (11 rijen x 9 kolommen - gebruikt kolommen A-I, wordt toegewezen aan rasterrijen 3-13, kolommen 1-9)"
            >
              <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden lg:inline">Excel Importeren (11x9)</span>
              <span className="lg:hidden">Import</span>
            </button>
            <button
              onClick={setupDatabase}
              disabled={loading}
              className="px-2 py-2 sm:px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
            >
              <span className="hidden md:inline">{loading ? "Instellen..." : "Database Instellen"}</span>
              <span className="md:hidden">{loading ? "Setup..." : "Setup"}</span>
            </button>
          </div>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto overflow-y-hidden toewijzingen-container pb-16"
          tabIndex={0}
        >
          <div className="min-w-max">
            <table className="border-collapse table-auto w-full">
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
                          className="border-2 border-gray-500 dark:border-gray-400 dark:bg-gray-800 p-1 sm:p-2 min-h-[50px] sm:min-h-[60px] whitespace-nowrap min-w-[80px] sm:min-w-[100px]"
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
                                  {""}
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
                                      className="w-full p-1 text-xs sm:text-sm font-bold border-0 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                      autoFocus
                                    />
                                  ) : (
                                    <div
                                      className="cursor-pointer p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 font-bold text-xs sm:text-sm"
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
                                      bgColor = "bg-gray-600 dark:bg-gray-500 text-white";
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
                                        className="w-full p-1 text-xs sm:text-sm border-0 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        autoFocus
                                      />
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <div
                                          className={`flex-1 min-h-[20px] cursor-pointer p-1 rounded whitespace-pre-wrap transition-colors text-xs sm:text-sm ${
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
                                            <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* Color menu dropdown */}
                                  {showColorMenu === cellId && (
                                    <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-500 dark:border-gray-400 rounded shadow-lg p-2 min-w-[200px] right-0 sm:right-auto">
                                      <div className="text-xs font-semibold mb-1">
                                        Status:
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, "red")
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 bg-red-500 rounded flex-shrink-0"></span>
                                        <span className="truncate">Volwassen (Meerderjarig)</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, "blue")
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 bg-blue-500 rounded flex-shrink-0"></span>
                                        <span className="truncate">Transfer</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, "gray")
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 bg-gray-500 rounded flex-shrink-0"></span>
                                        <span className="truncate">Leeftijdstwijfel</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, null)
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 border border-gray-400 rounded flex-shrink-0"></span>
                                        <span className="truncate">Status wissen</span>
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
                                      bgColor = "bg-gray-600 dark:bg-gray-500 text-white";
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
                                        className="w-full p-1 text-xs sm:text-sm border-0 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        autoFocus
                                      />
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <div
                                          className={`flex-1 min-h-[20px] cursor-pointer p-1 rounded whitespace-pre-wrap transition-colors text-xs sm:text-sm ${
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
                                              
                                              // Clear referent assignment if this is a resident cell
                                              const [rowStr, colStr] = cellId.split("-");
                                              const rowNumber = parseInt(rowStr);
                                              const columnNumber = parseInt(colStr);
                                              const isResidentCell = rowNumber >= 3 && rowNumber <= 13 && columnNumber >= 1 && columnNumber <= 9;
                                              
                                              if (isResidentCell && cellData[cellId]) {
                                                console.log(`Clearing referent for deleted resident: "${cellData[cellId]}"`);
                                                await clearResidentReferent(cellData[cellId]);
                                              }
                                              
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
                                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* Color menu dropdown */}
                                  {showColorMenu === cellId && (
                                    <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-500 dark:border-gray-400 rounded shadow-lg p-2 min-w-[200px] right-0 sm:right-auto">
                                      <div className="text-xs font-semibold mb-1">
                                        Status:
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, "red")
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 bg-red-500 rounded flex-shrink-0"></span>
                                        <span className="truncate">Volwassen (Meerderjarig)</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, "blue")
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 bg-blue-500 rounded flex-shrink-0"></span>
                                        <span className="truncate">Transfer</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, "gray")
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 bg-gray-500 rounded flex-shrink-0"></span>
                                        <span className="truncate">Leeftijdstwijfel</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleColorChange(cellId, null)
                                        }
                                        className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                                      >
                                        <span className="w-3 h-3 border border-gray-400 rounded flex-shrink-0"></span>
                                        <span className="truncate">Status wissen</span>
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
