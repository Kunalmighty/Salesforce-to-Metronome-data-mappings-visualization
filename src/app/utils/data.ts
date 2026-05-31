import Papa from "papaparse";
import csvFileText from "../../imports/mappings.sample.csv?raw";

export interface Mapping {
  [key: string]: string | undefined;
}

export const parseMappingsCsv = (csvText: string): Promise<Mapping[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<Mapping>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) =>
        header
          .trim()
          .replace(/^\uFEFF/, "")
          .replace(/[\u200B-\u200D\uFEFF]/g, ""),
      complete: (results) => {
        resolve(results.data);
      },
      error: (error: Error) => reject(error),
    });
  });
};

export const fetchMappings = async (): Promise<Mapping[]> => {
  return parseMappingsCsv(csvFileText);
};
