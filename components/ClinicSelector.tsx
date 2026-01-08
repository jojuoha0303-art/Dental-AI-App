type Props = {
  clinics: string[];
  selected: string;
  onChange: (clinic: string) => void;
};

export const ClinicSelector: React.FC<Props> = ({
  clinics,
  selected,
  onChange,
}) => (
  <div style={{ display: "flex", gap: 8 }}>
    {clinics.map((c) => (
      <button
        key={c}
        onClick={() => onChange(c)}
        style={{
          padding: "6px 12px",
          background: selected === c ? "#1e40af" : "#e5e7eb",
          color: selected === c ? "#fff" : "#000",
        }}
      >
        {c}
      </button>
    ))}
  </div>
);
