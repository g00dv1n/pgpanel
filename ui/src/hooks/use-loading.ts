import { useNavigation } from "react-router";

export function useLoaderLoading() {
  const navigation = useNavigation();

  return navigation.state === "loading";
}
