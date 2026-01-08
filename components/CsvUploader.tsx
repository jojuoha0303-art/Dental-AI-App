    import { parseCsv } from "../utils/csv";
import { ClinicRow } from "../types/clinic";

type Props = {
  onLoaded: (rows: ClinicRow[]) => void;
};

export const CsvUploader: React.FC<Props> = ({ onLoaded }) => {
  return (
    <input
      type="file"
      accept=".csv"
      onChange={async (e) => {
        if (!e.target.files) return;
        const data = await parseCsv(e.target.files[0]);
        onLoaded(data);
      }}
    />
  );
};
