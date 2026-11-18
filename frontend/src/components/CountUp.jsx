import { useCountUp } from "../hooks";

export default function CountUp({ value, format = (n) => n }) {
  return <>{format(useCountUp(Number(value) || 0))}</>;
}
