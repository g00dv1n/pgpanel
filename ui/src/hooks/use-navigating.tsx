import { useNavigation } from "react-router";

export function useNavigating() {
  const navigation = useNavigation();
  return Boolean(navigation.location);
}
