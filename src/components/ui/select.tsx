import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
export type SelectOption = { value: string; label: string };

type SelectProps = {
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  onValueChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function Select({ options, ...props }: SelectProps) {
  const [selectedValue, setSelectedValue] = useState(
    props.value ?? props.defaultValue ?? "",
  );
  useEffect(() => {
    setSelectedValue(props.value ?? props.defaultValue ?? "");
  }, [props.value, props.defaultValue]);
  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    props.onValueChange?.(value);
  };
  return (
    <SelectPrimitive.Root {...props} onValueChange={handleValueChange}>
      {props.name && (
        <input
          type="hidden"
          name={props.name}
          value={props.value ?? selectedValue}
          readOnly
        />
      )}
      <SelectPrimitive.Trigger className="shadcn-select-trigger">
        <SelectPrimitive.Value placeholder={props.placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown size={15} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="shadcn-select-content"
          position="popper"
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                className="shadcn-select-item"
                key={option.value}
                value={option.value}
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check size={14} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
