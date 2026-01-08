import Papa from "papaparse";
import { ClinicRow } from "../types/clinic";

export const parseCsv = (file: File): Promise<ClinicRow[]> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (res) => resolve(res.data as ClinicRow[]),
    });
  });
};
