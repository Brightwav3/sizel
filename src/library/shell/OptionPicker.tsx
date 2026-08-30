import React from "react";

/**
 * The collapsed row plus drop-down a phone shop uses to ask "which colour?"
 * and "which storage?": a swatch, the attribute name, the chosen value, and a
 * chevron. Open it and every option is listed with its price difference from
 * the cheapest one and its stock, so the choice is made without leaving the
 * buy box.
 */

export interface PickerOption {
  id: string;
  label: string;
  /** Price difference from the cheapest option, e.g. "+ $100". Omitted when every option costs the same. */
  extra?: string;
  note: string;
  soldOut?: boolean;
  selected: boolean;
  pick: () => void;
}

interface Props {
  label: string;
  value: string;
  options: PickerOption[];
  /** Colour swatch on the collapsed row; falls back to the icon. */
  swatch?: { hex: string; hex2?: string };
  icon?: string;
}

export const OptionPicker: React.FC<Props> = ({ label, value, options, swatch, icon = "sd_card" }) => {
  const [open, setOpen] = React.useState(false);
  const holder = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => { if (!holder.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", escape); };
  }, [open]);

  if (options.length < 2) return null;

  return (
    <div className="option-picker" ref={holder}>
      <button type="button" className={`option-picker__row ${open ? "is-open" : ""}`}
        aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <span className="option-picker__tile">
          {swatch
            ? <i className="option-picker__swatch" style={swatch.hex2
                ? { background: `linear-gradient(135deg, ${swatch.hex} 0 50%, ${swatch.hex2} 50% 100%)` }
                : { background: swatch.hex }} />
            : <span className="ms">{icon}</span>}
        </span>
        <span className="option-picker__copy">
          <small>{label}</small>
          <strong>{value}</strong>
        </span>
        <span className="ms option-picker__chevron">{open ? "expand_less" : "expand_more"}</span>
      </button>

      {open && (
        <div className="option-picker__list" role="listbox" aria-label={label}>
          {options.map(option => (
            <button key={option.id} type="button" role="option" aria-selected={option.selected}
              className={`option-picker__option ${option.selected ? "is-on" : ""}`}
              onClick={() => { option.pick(); setOpen(false); }}>
              <span className="option-picker__option-head">
                <strong>{option.label}</strong>
                {option.extra && <small className="num">{option.extra}</small>}
              </span>
              <em className={option.soldOut ? "is-out" : ""}>{option.note}</em>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
