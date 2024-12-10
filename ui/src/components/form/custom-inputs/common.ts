export interface CommonInputProps {
  name: string;
  value: any;
  placeholder?: string;
  required?: boolean;
}

export interface CustomInputProps<P = any> {
  commonProps: CommonInputProps;
  payload?: P;
  onChange: (newVal: any) => void;
}
