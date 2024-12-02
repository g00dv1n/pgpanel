export interface CommonInputProps {
  name: string;
  value: any;
  placeholder?: string;
  required?: boolean;
}

export interface CustomInputProps {
  commonProps: CommonInputProps;
  changeValue: (newVal: any) => void;
}
